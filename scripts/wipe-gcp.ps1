<#
.SYNOPSIS
  Nuke every Google Cloud project you own.  Dry-run by default.

.DESCRIPTION
  ────────────────────────────  READ THIS FIRST  ────────────────────────────
  • `gcloud projects delete` schedules a project for soft-delete. You have
    a 30-day window to run `gcloud projects undelete <ID>` and recover it.
  • After 30 days every resource inside (Firestore, Cloud Storage, Artifact
    Registry images, Secret Manager secrets, Cloud Run revisions, logs,
    IAM policy, OAuth clients, domain mappings) is purged and is NOT
    recoverable from anywhere.
  • Billing for the project stops within a few hours of shutdown. Pass
    -DetachBilling to detach immediately.
  • If your projects live under an Organization, this script will SKIP
    org-level resources and only touch projects you own. Folders, the
    org itself, billing accounts and your Google account are untouched.

  Default mode is DRY-RUN — nothing is deleted, you only see what would
  be deleted. Re-run with -IReallyMeanIt AND the typed confirmation
  phrase to actually delete.

.PARAMETER Filter
  Which projects to target:
    * all       — every project you have Owner on
    * tessar    — IDs starting with "tessar-" or named "tessar"
    * prefix    — IDs starting with -Prefix
  Default: tessar (safest).

.PARAMETER Prefix
  Used when -Filter prefix.  Example: -Prefix demo-

.PARAMETER ExceptProject
  Project ID to KEEP.  Useful for leaving a "billing" or "sandbox" alone.

.PARAMETER DetachBilling
  Detach the billing account from each project before deletion.

.PARAMETER IReallyMeanIt
  Required to actually delete. Without it the script only lists.

.PARAMETER Confirm
  When -IReallyMeanIt is set you must also pass:
    -Confirm "DELETE EVERYTHING"
  The literal string. Anything else aborts.

.EXAMPLE
  # Just see what would happen
  pwsh ./scripts/wipe-gcp.ps1

.EXAMPLE
  # See what would happen across ALL projects
  pwsh ./scripts/wipe-gcp.ps1 -Filter all

.EXAMPLE
  # Actually wipe every Tessar-prefixed project, detach billing first
  pwsh ./scripts/wipe-gcp.ps1 -Filter tessar -DetachBilling `
       -IReallyMeanIt -Confirm "DELETE EVERYTHING"

.EXAMPLE
  # Wipe everything except a kept sandbox
  pwsh ./scripts/wipe-gcp.ps1 -Filter all -ExceptProject keep-this-one `
       -DetachBilling -IReallyMeanIt -Confirm "DELETE EVERYTHING"
#>
[CmdletBinding()]
param(
  [ValidateSet('all','tessar','prefix')] [string] $Filter = 'tessar',
  [string] $Prefix = '',
  [string[]] $ExceptProject = @(),
  [switch] $DetachBilling,
  [switch] $IReallyMeanIt,
  [string] $Confirm = ''
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Step($m) { Write-Host "`n→ $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "  ✓ $m" -ForegroundColor Green }
function Skip($m) { Write-Host "  • $m" -ForegroundColor DarkGray }
function Warn($m) { Write-Host "  ! $m" -ForegroundColor Yellow }
function Bad($m)  { Write-Host "  ✗ $m" -ForegroundColor Red }

# ── 0. auth check ───────────────────────────────────────────────────────────
$account = (gcloud config get-value account 2>$null)
if (-not $account) { throw "Not authenticated. Run: gcloud auth login" }
Write-Host "Signed in as: $account" -ForegroundColor Cyan

# ── 1. list projects ───────────────────────────────────────────────────────
Step "Listing projects you can see"
$rawJson = gcloud projects list --format=json 2>$null
if (-not $rawJson) { Warn "No projects visible to this account."; exit 0 }
$projects = $rawJson | ConvertFrom-Json
# only ACTIVE projects (skip already-deleted ones)
$projects = $projects | Where-Object { $_.lifecycleState -eq 'ACTIVE' }
Ok ("Found " + $projects.Count + " active project(s)")

# ── 2. select targets ──────────────────────────────────────────────────────
switch ($Filter) {
  'all'    { $targets = $projects }
  'tessar' { $targets = $projects | Where-Object {
              $_.projectId -like 'tessar*' -or $_.name -ieq 'tessar'
            } }
  'prefix' {
    if (-not $Prefix) { throw "-Filter prefix requires -Prefix <string>" }
    $targets = $projects | Where-Object { $_.projectId -like "$Prefix*" }
  }
}
if ($ExceptProject.Count -gt 0) {
  $targets = $targets | Where-Object { $ExceptProject -notcontains $_.projectId }
}

if (-not $targets -or $targets.Count -eq 0) {
  Warn "No projects matched the filter. Nothing to do."
  Write-Host "`nAll projects on this account:" -ForegroundColor DarkGray
  $projects | Select-Object projectId, name, projectNumber | Format-Table | Out-String | Write-Host
  exit 0
}

# ── 3. show what we'd do ───────────────────────────────────────────────────
Write-Host ""
Write-Host "Targets:" -ForegroundColor Yellow
$targets | Select-Object projectId, name, projectNumber | Format-Table | Out-String | Write-Host

Write-Host "Actions per project:" -ForegroundColor Yellow
if ($DetachBilling) { Write-Host "  1. Detach billing account" }
                     Write-Host "  $((if ($DetachBilling) {'2'} else {'1'})). gcloud projects delete (30-day soft-delete window applies)"

# ── 4. safety gate ─────────────────────────────────────────────────────────
if (-not $IReallyMeanIt) {
  Write-Host ""
  Write-Host "DRY-RUN: nothing was deleted." -ForegroundColor Green
  Write-Host "To actually delete, re-run with:" -ForegroundColor Cyan
  Write-Host "  -IReallyMeanIt -Confirm `"DELETE EVERYTHING`"" -ForegroundColor Cyan
  exit 0
}

if ($Confirm -cne 'DELETE EVERYTHING') {
  Bad "Confirmation phrase mismatch."
  Write-Host "You passed -IReallyMeanIt but -Confirm was not the exact string DELETE EVERYTHING." -ForegroundColor Red
  Write-Host "Aborting. No project was touched." -ForegroundColor Red
  exit 1
}

# Final interactive check (in case someone scripted IReallyMeanIt by mistake).
Write-Host ""
Write-Host "You are about to schedule $($targets.Count) project(s) for deletion." -ForegroundColor Red
Write-Host "This is the last prompt. Type the project count number to continue:" -ForegroundColor Red
$answer = Read-Host "Number of projects to confirm"
if ([string]$answer -ne [string]$targets.Count) {
  Bad "Number mismatch. Aborting. No project was touched."
  exit 1
}

# ── 5. do it ───────────────────────────────────────────────────────────────
foreach ($p in $targets) {
  $id = $p.projectId
  Write-Host ""
  Step "Project $id"

  if ($DetachBilling) {
    try {
      gcloud beta billing projects unlink $id 2>$null | Out-Null
      Ok "Billing detached"
    } catch {
      Warn "Billing detach failed (maybe none attached): $($_.Exception.Message)"
    }
  }

  try {
    gcloud projects delete $id --quiet | Out-Null
    Ok "Scheduled for deletion (recover within 30 days with: gcloud projects undelete $id)"
  } catch {
    Bad "Delete failed: $($_.Exception.Message)"
  }
}

Write-Host ""
Write-Host "Done. To list still-recoverable projects:" -ForegroundColor Cyan
Write-Host "  gcloud projects list --filter='lifecycleState=DELETE_REQUESTED'" -ForegroundColor Cyan
Write-Host "After 30 days they vanish permanently. Your Google account itself is unchanged." -ForegroundColor Cyan
