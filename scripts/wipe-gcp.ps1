<#
.SYNOPSIS
  Nuke every Google Cloud project you own. Dry-run by default.

.PARAMETER Filter
  all | tessar | prefix

.PARAMETER Prefix
  Used when -Filter prefix.

.PARAMETER ExceptProject
  Project IDs to KEEP.

.PARAMETER DetachBilling
  Detach billing first.

.PARAMETER IReallyMeanIt
  Required for actual deletion.

.PARAMETER Confirm
  Must equal "DELETE EVERYTHING".
#>
[CmdletBinding()]
param(
  [ValidateSet("all","tessar","prefix")] [string] $Filter = "tessar",
  [string] $Prefix = "",
  [string[]] $ExceptProject = @(),
  [switch] $DetachBilling,
  [switch] $IReallyMeanIt,
  [string] $Confirm = ""
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Step($m) { Write-Host ("`n>> " + $m) -ForegroundColor Cyan }
function Ok($m)   { Write-Host ("  [ok] " + $m) -ForegroundColor Green }
function Skip2($m){ Write-Host ("  [..] " + $m) -ForegroundColor DarkGray }
function Warn($m) { Write-Host ("  [!!] " + $m) -ForegroundColor Yellow }
function Bad($m)  { Write-Host ("  [xx] " + $m) -ForegroundColor Red }

$account = (gcloud config get-value account 2>$null)
if (-not $account) { throw "Not authenticated. Run: gcloud auth login" }
Write-Host ("Signed in as: " + $account) -ForegroundColor Cyan

Step "Listing projects"
$rawJson = gcloud projects list --format=json 2>$null
if (-not $rawJson) { Warn "No projects visible."; exit 0 }
$projects = $rawJson | ConvertFrom-Json
$projects = $projects | Where-Object { $_.lifecycleState -eq "ACTIVE" }
Ok ("Found " + $projects.Count + " active project(s)")

switch ($Filter) {
  "all"    { $targets = $projects }
  "tessar" { $targets = $projects | Where-Object { $_.projectId -like "tessar*" -or $_.name -ieq "tessar" } }
  "prefix" {
    if (-not $Prefix) { throw "-Filter prefix requires -Prefix <string>" }
    $targets = $projects | Where-Object { $_.projectId -like ($Prefix + "*") }
  }
}
if ($ExceptProject.Count -gt 0) {
  $targets = $targets | Where-Object { $ExceptProject -notcontains $_.projectId }
}

if (-not $targets -or $targets.Count -eq 0) {
  Warn "No projects matched."
  exit 0
}

Write-Host ""
Write-Host "Targets:" -ForegroundColor Yellow
$targets | Select-Object projectId, name, projectNumber | Format-Table | Out-String | Write-Host

if (-not $IReallyMeanIt) {
  Write-Host "`nDRY-RUN: nothing was deleted." -ForegroundColor Green
  Write-Host 'To delete: -IReallyMeanIt -Confirm "DELETE EVERYTHING"' -ForegroundColor Cyan
  exit 0
}

if ($Confirm -cne "DELETE EVERYTHING") {
  Bad "Confirmation phrase mismatch."
  exit 1
}

Write-Host ""
Write-Host ("About to delete " + $targets.Count + " project(s).") -ForegroundColor Red
$answer = Read-Host "Type the count to confirm"
if ([string]$answer -ne [string]$targets.Count) {
  Bad "Aborted."
  exit 1
}

foreach ($p in $targets) {
  $id = $p.projectId
  Step "Project $id"
  if ($DetachBilling) {
    try { gcloud beta billing projects unlink $id 2>$null | Out-Null; Ok "Billing detached" }
    catch { Warn "Billing detach failed: $($_.Exception.Message)" }
  }
  try { gcloud projects delete $id --quiet | Out-Null; Ok "Scheduled for deletion" }
  catch { Bad "Delete failed: $($_.Exception.Message)" }
}

Write-Host "`nDone." -ForegroundColor Cyan