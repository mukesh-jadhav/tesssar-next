<#
.SYNOPSIS
  One-time GCP bootstrap for Tessar (Cloud Run + Firestore + Vertex AI).

.DESCRIPTION
  Idempotent. Re-running is safe — every step checks for existing
  resources before creating them.

  Prerequisites:
    - gcloud CLI installed and authenticated (`gcloud auth login`)
    - You own / have Owner on the target GCP project
    - Project has a billing account attached
    - `.env.local` exists at the repo root with every key from
      `.env.example` filled in

  What this script does:
    1. Selects the project, enables required APIs.
    2. Creates the Artifact Registry repo `tessar` in $Region.
    3. Creates the runtime service account `tessar-runtime` and grants:
         - roles/datastore.user                (Firestore RW)
         - roles/aiplatform.user               (Vertex AI invoke)
         - roles/secretmanager.secretAccessor  (read secrets)
         - roles/storage.objectViewer          (Cloud Storage read)
    4. Grants the Cloud Build SA permission to deploy Cloud Run and act
       as the runtime SA.
    5. Creates the Firestore database in $FirestoreLocation (Native mode).
    6. Deploys Firestore rules + indexes.
    7. Reads `.env.local` and creates / updates Secret Manager secrets
       under the exact names that `cloudbuild.yaml` expects.

  After this completes once, you run `scripts/deploy.ps1` to build and
  deploy the app. Re-deploys do NOT need to re-run this script unless
  you rotate secrets.

.PARAMETER ProjectId
  Target GCP project ID (e.g. `tessar-prod`). Must already exist with
  billing enabled.

.PARAMETER Region
  Cloud Run / Artifact Registry region. Defaults to `asia-south1`.

.PARAMETER FirestoreLocation
  Firestore multi-region or region. Defaults to `asia-south1`.

.PARAMETER EnvFile
  Path to env file to load secrets from. Defaults to `./.env.local`.

.EXAMPLE
  pwsh ./scripts/bootstrap-gcp.ps1 -ProjectId tessar-prod
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $ProjectId,
  [string] $Region = 'asia-south1',
  [string] $FirestoreLocation = 'asia-south1',
  [string] $EnvFile = './.env.local'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Step($msg) { Write-Host "`n→ $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Skip($msg) { Write-Host "  • $msg" -ForegroundColor DarkGray }
function Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }

# ───────────────────────────────────────────────────────────────── 0. checks
Step "Checking gcloud auth"
$account = (gcloud config get-value account 2>$null)
if (-not $account) { throw "Not authenticated. Run: gcloud auth login" }
Ok "Signed in as $account"

Step "Selecting project $ProjectId"
gcloud config set project $ProjectId | Out-Null
$projectNumber = (gcloud projects describe $ProjectId --format='value(projectNumber)')
if (-not $projectNumber) { throw "Project $ProjectId not found or not accessible." }
Ok "Project number $projectNumber"

# ───────────────────────────────────────────────────────────────── 1. apis
$apis = @(
  'run.googleapis.com',
  'cloudbuild.googleapis.com',
  'artifactregistry.googleapis.com',
  'secretmanager.googleapis.com',
  'firestore.googleapis.com',
  'iam.googleapis.com',
  'iamcredentials.googleapis.com',
  'aiplatform.googleapis.com',
  'storage.googleapis.com'
)
Step "Enabling APIs (this can take a minute)"
gcloud services enable @apis --project $ProjectId | Out-Null
Ok ("Enabled: " + ($apis -join ', '))

# ───────────────────────────────────────────────────────────────── 2. artifact registry
Step "Creating Artifact Registry repo `tessar` in $Region"
$repoExists = (gcloud artifacts repositories describe tessar --location $Region --project $ProjectId --format='value(name)' 2>$null)
if ($repoExists) { Skip "Repo already exists" }
else {
  gcloud artifacts repositories create tessar `
    --repository-format=docker `
    --location=$Region `
    --description="Tessar container images" `
    --project=$ProjectId | Out-Null
  Ok "Created"
}

# ───────────────────────────────────────────────────────────────── 3. runtime SA
$runtimeSa = "tessar-runtime@$ProjectId.iam.gserviceaccount.com"
Step "Creating runtime service account $runtimeSa"
$saExists = (gcloud iam service-accounts describe $runtimeSa --project $ProjectId --format='value(email)' 2>$null)
if ($saExists) { Skip "Service account already exists" }
else {
  gcloud iam service-accounts create tessar-runtime `
    --display-name "Tessar Cloud Run runtime" `
    --project $ProjectId | Out-Null
  Ok "Created"
}

$roles = @(
  'roles/datastore.user',
  'roles/aiplatform.user',
  'roles/secretmanager.secretAccessor',
  'roles/storage.objectViewer'
)
foreach ($r in $roles) {
  gcloud projects add-iam-policy-binding $ProjectId `
    --member "serviceAccount:$runtimeSa" `
    --role $r `
    --condition=None `
    --quiet | Out-Null
  Ok "Bound $r"
}

# ───────────────────────────────────────────────────────────────── 4. cloud build SA grants
$cloudBuildSa = "$projectNumber@cloudbuild.gserviceaccount.com"
Step "Granting Cloud Build SA permission to deploy Cloud Run + act as runtime SA"
$cbRoles = @(
  'roles/run.admin',
  'roles/iam.serviceAccountUser',
  'roles/artifactregistry.writer',
  'roles/secretmanager.admin'
)
foreach ($r in $cbRoles) {
  gcloud projects add-iam-policy-binding $ProjectId `
    --member "serviceAccount:$cloudBuildSa" `
    --role $r `
    --condition=None `
    --quiet | Out-Null
  Ok "Bound $r to Cloud Build SA"
}

# also let cloud build SA impersonate runtime SA (deploy time)
gcloud iam service-accounts add-iam-policy-binding $runtimeSa `
  --member "serviceAccount:$cloudBuildSa" `
  --role roles/iam.serviceAccountUser `
  --project $ProjectId `
  --quiet | Out-Null
Ok "Cloud Build can impersonate runtime SA"

# ───────────────────────────────────────────────────────────────── 5. firestore
Step "Ensuring Firestore (Native) database in $FirestoreLocation"
$dbExists = (gcloud firestore databases describe --database='(default)' --project $ProjectId --format='value(name)' 2>$null)
if ($dbExists) { Skip "Database already exists" }
else {
  gcloud firestore databases create `
    --location=$FirestoreLocation `
    --project=$ProjectId | Out-Null
  Ok "Created"
}

# ───────────────────────────────────────────────────────────────── 6. rules + indexes
Step "Deploying Firestore rules + indexes"
$firebaseInstalled = (Get-Command firebase -ErrorAction SilentlyContinue)
if ($firebaseInstalled) {
  firebase deploy --only firestore:rules,firestore:indexes --project $ProjectId
  Ok "Deployed via Firebase CLI"
} else {
  Warn "Firebase CLI not found. Run:  npm i -g firebase-tools  then re-run only:"
  Warn "  firebase deploy --only firestore:rules,firestore:indexes --project $ProjectId"
}

# ───────────────────────────────────────────────────────────────── 7. secrets
$envPath = Resolve-Path -LiteralPath $EnvFile -ErrorAction SilentlyContinue
if (-not $envPath) {
  Warn "Env file $EnvFile not found — skipping secret upload. Run with -EnvFile <path> later."
  Write-Host "`nBootstrap finished (without secrets)." -ForegroundColor Cyan
  exit 0
}

Step "Reading $envPath"
$envMap = @{}
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $idx = $line.IndexOf('=')
  if ($idx -lt 1) { return }
  $k = $line.Substring(0, $idx).Trim()
  $v = $line.Substring($idx + 1).Trim()
  if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
  $envMap[$k] = $v
}
Ok ("Parsed " + $envMap.Count + " keys")

# env key -> secret name (must match cloudbuild.yaml --set-secrets)
$secretMap = [ordered]@{
  'FIREBASE_ADMIN_PROJECT_ID'              = 'tessar-fb-project'
  'FIREBASE_ADMIN_CLIENT_EMAIL'            = 'tessar-fb-email'
  'FIREBASE_ADMIN_PRIVATE_KEY'             = 'tessar-fb-key'
  'NEXT_PUBLIC_FIREBASE_API_KEY'           = 'tessar-fb-api-key'
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'       = 'tessar-fb-auth-domain'
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID'        = 'tessar-fb-project'
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'    = 'tessar-fb-bucket'
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' = 'tessar-fb-sender'
  'NEXT_PUBLIC_FIREBASE_APP_ID'            = 'tessar-fb-app-id'
  'RAZORPAY_KEY_ID'                        = 'tessar-rzp-key-id'
  'RAZORPAY_KEY_SECRET'                    = 'tessar-rzp-key-secret'
  'RAZORPAY_WEBHOOK_SECRET'                = 'tessar-rzp-webhook-secret'
  'RESEND_API_KEY'                         = 'tessar-resend-key'
  'RESEND_FROM_EMAIL'                      = 'tessar-resend-from'
  'ADMIN_EMAILS'                           = 'tessar-admin-emails'
}

# secret name -> value (deduplicated; FIREBASE_ADMIN_PROJECT_ID and
# NEXT_PUBLIC_FIREBASE_PROJECT_ID both map to tessar-fb-project)
$secretValues = [ordered]@{}
foreach ($k in $secretMap.Keys) {
  $secret = $secretMap[$k]
  if (-not $envMap.ContainsKey($k)) {
    Warn "  missing $k in $EnvFile — skipping $secret"
    continue
  }
  $secretValues[$secret] = $envMap[$k]
}

Step "Creating / updating Secret Manager secrets"
foreach ($secret in $secretValues.Keys) {
  $value = $secretValues[$secret]
  $exists = (gcloud secrets describe $secret --project $ProjectId --format='value(name)' 2>$null)
  if (-not $exists) {
    gcloud secrets create $secret --replication-policy=automatic --project $ProjectId | Out-Null
  }
  # write value via stdin (handles newlines in FIREBASE_ADMIN_PRIVATE_KEY)
  $tmp = New-TemporaryFile
  Set-Content -Path $tmp -Value $value -NoNewline -Encoding UTF8
  gcloud secrets versions add $secret --data-file=$tmp --project $ProjectId | Out-Null
  Remove-Item $tmp -Force
  Ok "  $secret"
}

# grant runtime SA access to every secret (Secret Accessor at the
# project level is already bound, but binding at the resource level is
# the principle-of-least-privilege-friendly belt-and-braces)
Step "Granting runtime SA Secret Accessor on each secret"
foreach ($secret in $secretValues.Keys) {
  gcloud secrets add-iam-policy-binding $secret `
    --member "serviceAccount:$runtimeSa" `
    --role roles/secretmanager.secretAccessor `
    --project $ProjectId `
    --quiet | Out-Null
}
Ok "Done"

Write-Host "`nBootstrap complete." -ForegroundColor Green
Write-Host "  Next:  pwsh ./scripts/deploy.ps1 -ProjectId $ProjectId" -ForegroundColor Cyan
