<#
.SYNOPSIS
  Build and deploy Tessar to Cloud Run via Cloud Build.

.DESCRIPTION
  Runs `gcloud builds submit` with `cloudbuild.yaml`. On first run pass
  -AppUrl as the public URL you intend to serve traffic from (your
  custom domain or the Cloud Run URL once you know it).

  After the first deploy, re-running this with the resulting
  https://...run.app URL as -AppUrl is fine — Cloud Run rebuilds with
  NEXT_PUBLIC_APP_URL pointing at itself.

  Prerequisites:
    - `scripts/bootstrap-gcp.ps1` has been run once for $ProjectId.
    - You are at the repo root (cloudbuild.yaml is here).

.PARAMETER ProjectId
  GCP project ID.

.PARAMETER Region
  Cloud Run region (defaults to asia-south1).

.PARAMETER AppUrl
  Public origin used for OAuth redirects, Razorpay callbacks, emails.
  Defaults to the Cloud Run *.run.app URL (resolved post-deploy on
  first run via a no-op redeploy if left blank).

.EXAMPLE
  pwsh ./scripts/deploy.ps1 -ProjectId tessar-prod
  pwsh ./scripts/deploy.ps1 -ProjectId tessar-prod -AppUrl https://tessar.app
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $ProjectId,
  [string] $Region = 'asia-south1',
  [string] $AppUrl = ''
)

$ErrorActionPreference = 'Stop'

function Step($msg) { Write-Host "`n→ $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }

Step "Selecting project $ProjectId"
gcloud config set project $ProjectId | Out-Null

if (-not $AppUrl) {
  # try to read the existing service URL; fall back to a placeholder
  $existing = (gcloud run services describe tessar --region $Region --project $ProjectId --format='value(status.url)' 2>$null)
  if ($existing) {
    $AppUrl = $existing
    Ok "Using existing service URL $AppUrl"
  } else {
    $AppUrl = "https://placeholder.invalid"
    Ok "No existing service. Using $AppUrl for now — re-run with -AppUrl after first deploy."
  }
}

Step "Submitting build to Cloud Build"
gcloud builds submit `
  --config cloudbuild.yaml `
  --substitutions "_REGION=$Region,_APP_URL=$AppUrl" `
  --project $ProjectId

Step "Resolving deployed URL"
$url = (gcloud run services describe tessar --region $Region --project $ProjectId --format='value(status.url)')
Ok "Deployed: $url"

if ($AppUrl -ne $url -and $AppUrl -eq "https://placeholder.invalid") {
  Write-Host "`nRe-running with the real URL so NEXT_PUBLIC_APP_URL is correct..." -ForegroundColor Yellow
  gcloud builds submit `
    --config cloudbuild.yaml `
    --substitutions "_REGION=$Region,_APP_URL=$url" `
    --project $ProjectId
  Ok "Final URL: $url"
}

Write-Host "`nDone." -ForegroundColor Green
Write-Host "  Open: $url" -ForegroundColor Cyan
