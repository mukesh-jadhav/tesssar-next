<#
.SYNOPSIS
  One-time GCP bootstrap for Tessar (Cloud Run + Firestore + Vertex AI).

.DESCRIPTION
  Idempotent. Re-running is safe.

.PARAMETER ProjectId
  Target GCP project ID.

.PARAMETER Region
  Cloud Run / Artifact Registry region.

.PARAMETER FirestoreLocation
  Firestore region (Native mode).

.PARAMETER EnvFile
  Path to env file to load secrets from.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $ProjectId,
  [string] $Region = "asia-south1",
  [string] $FirestoreLocation = "asia-south1",
  [string] $EnvFile = "./.env.local"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Step($msg) { Write-Host ("`n>> " + $msg) -ForegroundColor Cyan }
function Ok($msg)   { Write-Host ("  [ok] " + $msg) -ForegroundColor Green }
function Skip2($msg){ Write-Host ("  [..] " + $msg) -ForegroundColor DarkGray }
function Warn($msg) { Write-Host ("  [!!] " + $msg) -ForegroundColor Yellow }

# 0. checks
Step "Checking gcloud auth"
$account = (gcloud config get-value account 2>$null)
if (-not $account) { throw "Not authenticated. Run: gcloud auth login" }
Ok "Signed in as $account"

Step "Selecting project $ProjectId"
gcloud config set project $ProjectId | Out-Null
$projectNumber = (gcloud projects describe $ProjectId --format="value(projectNumber)")
if (-not $projectNumber) { throw "Project $ProjectId not found or not accessible." }
Ok "Project number $projectNumber"

# 1. apis
$apis = @(
  "run.googleapis.com",
  "cloudbuild.googleapis.com",
  "artifactregistry.googleapis.com",
  "secretmanager.googleapis.com",
  "firestore.googleapis.com",
  "iam.googleapis.com",
  "iamcredentials.googleapis.com",
  "aiplatform.googleapis.com",
  "storage.googleapis.com"
)
Step "Enabling APIs (this can take a minute)"
gcloud services enable @apis --project $ProjectId | Out-Null
Ok ("Enabled: " + ($apis -join ", "))

# 2. artifact registry
Step "Creating Artifact Registry repo tessar in $Region"
$repoExists = (gcloud artifacts repositories describe tessar --location $Region --project $ProjectId --format="value(name)" 2>$null)
if ($repoExists) { Skip2 "Repo already exists" }
else {
  gcloud artifacts repositories create tessar `
    --repository-format=docker `
    --location=$Region `
    --description="Tessar container images" `
    --project=$ProjectId | Out-Null
  Ok "Created"
}

# 3. runtime SA
$runtimeSa = "tessar-runtime@$ProjectId.iam.gserviceaccount.com"
Step "Creating runtime service account $runtimeSa"
$saExists = (gcloud iam service-accounts describe $runtimeSa --project $ProjectId --format="value(email)" 2>$null)
if ($saExists) { Skip2 "Service account already exists" }
else {
  gcloud iam service-accounts create tessar-runtime `
    --display-name "Tessar Cloud Run runtime" `
    --project $ProjectId | Out-Null
  Ok "Created"
}

$roles = @(
  "roles/datastore.user",
  "roles/aiplatform.user",
  "roles/secretmanager.secretAccessor",
  "roles/storage.objectViewer",
  "roles/iam.serviceAccountTokenCreator"
)
foreach ($r in $roles) {
  gcloud projects add-iam-policy-binding $ProjectId `
    --member "serviceAccount:$runtimeSa" `
    --role $r `
    --condition=None `
    --quiet 2>$null | Out-Null
  Ok "Bound $r"
}

# Also let the runtime SA mint its own ID tokens (needed by Firebase Admin
# SDK to create session cookies / verify ID tokens without a JSON key).
gcloud iam service-accounts add-iam-policy-binding $runtimeSa `
  --member "serviceAccount:$runtimeSa" `
  --role roles/iam.serviceAccountTokenCreator `
  --project $ProjectId `
  --quiet 2>$null | Out-Null
Ok "Runtime SA can self-impersonate (for session cookies)"

# 4. cloud build SA grants
$cloudBuildSa = "$projectNumber@cloudbuild.gserviceaccount.com"
Step "Granting Cloud Build SA permissions"
$cbRoles = @(
  "roles/run.admin",
  "roles/iam.serviceAccountUser",
  "roles/artifactregistry.writer",
  "roles/secretmanager.admin"
)
foreach ($r in $cbRoles) {
  gcloud projects add-iam-policy-binding $ProjectId `
    --member "serviceAccount:$cloudBuildSa" `
    --role $r `
    --condition=None `
    --quiet | Out-Null
  Ok "Bound $r to Cloud Build SA"
}

gcloud iam service-accounts add-iam-policy-binding $runtimeSa `
  --member "serviceAccount:$cloudBuildSa" `
  --role roles/iam.serviceAccountUser `
  --project $ProjectId `
  --quiet | Out-Null
Ok "Cloud Build can impersonate runtime SA"

# 5. firestore
Step "Ensuring Firestore (Native) database in $FirestoreLocation"
$dbExists = (gcloud firestore databases describe --database="(default)" --project $ProjectId --format="value(name)" 2>$null)
if ($dbExists) { Skip2 "Database already exists" }
else {
  gcloud firestore databases create `
    --location=$FirestoreLocation `
    --project=$ProjectId | Out-Null
  Ok "Created"
}

# 6. rules + indexes
Step "Deploying Firestore rules + indexes"
$firebaseInstalled = (Get-Command firebase -ErrorAction SilentlyContinue)
if ($firebaseInstalled) {
  firebase deploy --only firestore:rules,firestore:indexes --project $ProjectId
  Ok "Deployed via Firebase CLI"
} else {
  Warn "Firebase CLI not found. Run:"
  Warn "  npm i -g firebase-tools"
  Warn "  firebase deploy --only firestore:rules,firestore:indexes --project $ProjectId"
}

# 7. secrets
$envPath = Resolve-Path -LiteralPath $EnvFile -ErrorAction SilentlyContinue
if (-not $envPath) {
  Warn "Env file $EnvFile not found - skipping secret upload."
  Write-Host "`nBootstrap finished (without secrets)." -ForegroundColor Cyan
  exit 0
}

Step "Reading $envPath"
$envMap = @{}
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }
  $k = $line.Substring(0, $idx).Trim()
  $v = $line.Substring($idx + 1).Trim()
  if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
  $envMap[$k] = $v
}
Ok ("Parsed " + $envMap.Count + " keys")

$secretMap = [ordered]@{
  "NEXT_PUBLIC_FIREBASE_API_KEY"             = "tessar-fb-api-key"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"         = "tessar-fb-auth-domain"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"          = "tessar-fb-project"
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"      = "tessar-fb-bucket"
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "tessar-fb-sender"
  "NEXT_PUBLIC_FIREBASE_APP_ID"              = "tessar-fb-app-id"
  "RAZORPAY_KEY_ID"                          = "tessar-rzp-key-id"
  "RAZORPAY_KEY_SECRET"                      = "tessar-rzp-key-secret"
  "RAZORPAY_WEBHOOK_SECRET"                  = "tessar-rzp-webhook-secret"
  "RESEND_API_KEY"                           = "tessar-resend-key"
  "RESEND_FROM_EMAIL"                        = "tessar-resend-from"
  "ADMIN_EMAILS"                             = "tessar-admin-emails"
}

$secretValues = [ordered]@{}
foreach ($k in $secretMap.Keys) {
  $secret = $secretMap[$k]
  if (-not $envMap.ContainsKey($k) -or -not $envMap[$k]) {
    Warn ("  missing " + $k + " in " + $EnvFile + " - skipping " + $secret)
    continue
  }
  $secretValues[$secret] = $envMap[$k]
}

Step "Creating / updating Secret Manager secrets"
foreach ($secret in $secretValues.Keys) {
  $value = $secretValues[$secret]
  $exists = (gcloud secrets describe $secret --project $ProjectId --format="value(name)" 2>$null)
  if (-not $exists) {
    gcloud secrets create $secret --replication-policy=automatic --project $ProjectId | Out-Null
  }
  $tmp = New-TemporaryFile
  Set-Content -Path $tmp -Value $value -NoNewline -Encoding UTF8
  gcloud secrets versions add $secret --data-file=$tmp --project $ProjectId | Out-Null
  Remove-Item $tmp -Force
  Ok "  $secret"
}

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
Write-Host ("  Next:  powershell -File ./scripts/deploy.ps1 -ProjectId " + $ProjectId) -ForegroundColor Cyan