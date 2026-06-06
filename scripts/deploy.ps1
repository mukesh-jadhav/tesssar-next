<#
.SYNOPSIS
  Build and deploy Tessar to Cloud Run via Cloud Build.

.PARAMETER ProjectId
  GCP project ID.

.PARAMETER Region
  Cloud Run region (defaults to asia-south1).

.PARAMETER AppUrl
  Public origin used for OAuth redirects, Razorpay callbacks, emails.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $ProjectId,
  [string] $Region = "asia-south1",
  [string] $AppUrl = "https://tessar.dev"
)

$ErrorActionPreference = "Continue"

function Step($msg) { Write-Host ("`n>> " + $msg) -ForegroundColor Cyan }
function Ok($msg)   { Write-Host ("  [ok] " + $msg) -ForegroundColor Green }

# PS 5.1 treats native-command stderr under ErrorActionPreference=Stop as fatal,
# even with 2>$null. Use Probe for existence checks.
function Probe {
  param([scriptblock] $Block)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  try { & $Block } catch { $null } finally { $ErrorActionPreference = $prev }
}

Step "Selecting project $ProjectId"
gcloud config set project $ProjectId | Out-Null
Ok "App URL = $AppUrl"

Step "Submitting build to Cloud Build"
gcloud builds submit `
  --config cloudbuild.yaml `
  --substitutions "_REGION=$Region,_APP_URL=$AppUrl" `
  --project $ProjectId

if ($LASTEXITCODE -ne 0) {
  Write-Host "`nBuild failed. See log link above." -ForegroundColor Red
  exit $LASTEXITCODE
}

Step "Resolving deployed URL"
$url = Probe { gcloud run services describe tessar --region $Region --project $ProjectId --format="value(status.url)" 2>$null }
if ($url) {
  Ok "Cloud Run URL: $url"
  if ($AppUrl -ne $url) {
    Write-Host ""
    Write-Host "NOTE: Your build inlined NEXT_PUBLIC_APP_URL=$AppUrl (from .env.production)." -ForegroundColor Yellow
    Write-Host "      Cloud Run is serving from $url." -ForegroundColor Yellow
    Write-Host "      Map $AppUrl to this service: Cloud Run console -> Manage Custom Domains." -ForegroundColor Yellow
  }
}

Write-Host "`nDone." -ForegroundColor Green