#Requires -Version 7
<#
.SYNOPSIS
  The fast lane: moves one checked change through development, testing and main with no clicking in between.

.DESCRIPTION
  Every required check still runs, on the same commit, in the same order as docs/development/WORKFLOW.md describes.
  The script only does the waiting and the merging for you:

    1. waits for the pull request's required checks, then squash-merges it into development;
    2. opens the development -> testing pull request, waits for its checks, merges it with a merge commit;
    3. opens the testing -> main release pull request, waits for its checks, merges it with a merge commit
       (merging deploys to production).

  It never forces anything, never bypasses a check, and stops at the first check that fails.
  It refuses to run while other changes are already waiting between main and development, because the
  promotion pull requests carry everything that is on development.

.PARAMETER Command
  status  Shows the lane heads, what is waiting to be released and the open pull requests. Changes nothing.
  run     Ships the pull request given as the second argument.

.PARAMETER Pr
  The number of a pull request into development (from feature/, fix/, refactor/, docs/, experiment/ or chore/).

.PARAMETER IncludeQueued
  Ship the other changes that are waiting on development as well.

.PARAMETER DryRun
  Checks everything and prints what would happen, without merging or opening anything.

.PARAMETER TimeoutMinutes
  How long to wait for the checks of each step (default 25).

.EXAMPLE
  pwsh scripts/ship.ps1 status
  pwsh scripts/ship.ps1 run 71 -DryRun
  pwsh scripts/ship.ps1 run 71
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory, Position = 0)][ValidateSet('status', 'run')][string]$Command,
  [Parameter(Position = 1)][int]$Pr,
  [switch]$IncludeQueued,
  [switch]$DryRun,
  [int]$TimeoutMinutes = 25
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

# The checked-in contract is validated against the workflow job names and generated docs in CI.
$CheckContractPath = Join-Path $PSScriptRoot '..\.github\required-checks.json'
$CheckContract = Get-Content -Raw $CheckContractPath | ConvertFrom-Json -AsHashtable
$Required = @{}
foreach ($lane in $CheckContract.lanes) {
  if (-not $lane.checks -or $lane.checks.Count -eq 0) {
    throw "Required-check contract for '$($lane.branch)' must include at least one status check."
  }
  $names = foreach ($checkId in $lane.checks) {
    if (-not $CheckContract.checks.ContainsKey($checkId)) {
      throw "Required-check contract for '$($lane.branch)' references unknown check '$checkId'."
    }
    $CheckContract.checks[$checkId]
  }
  $Required[$lane.branch] = @($names)
}
$FailedStates = @('FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'STARTUP_FAILURE')
$PendingStates = @('IN_PROGRESS', 'QUEUED', 'PENDING', 'WAITING', 'REQUESTED', 'EXPECTED')
$PassedStates = @('SUCCESS', 'SKIPPED', 'NEUTRAL')
$BranchPattern = '^(feature|fix|refactor|docs|experiment|chore)/'
$ProductionUrl = 'https://loadout-ysws.vercel.app/'

function Write-Step([string]$Message) { Write-Host "==> $Message" -ForegroundColor Cyan }

function Get-PullRequest([int]$Number) {
  gh pr view $Number --json 'number,title,state,isDraft,baseRefName,headRefName,statusCheckRollup' | ConvertFrom-Json
}

# --- Reading a pull request's checks -------------------------------------------------------------------------------

# A check run has a name and a conclusion; a commit status has a context and a state. Either may be missing.
function Get-CheckName($Check) {
  if ($Check.PSObject.Properties['name'] -and $Check.name) { return $Check.name }
  return $Check.context
}

function Get-CheckState($Check) {
  foreach ($field in 'conclusion', 'state', 'status') {
    if ($Check.PSObject.Properties[$field] -and $Check.$field) { return [string]$Check.$field }
  }
}

function Test-AnyState([string[]]$States, [string[]]$Wanted) {
  return @($States | Where-Object { $_ -in $Wanted }).Count -gt 0
}

# A name can appear more than once (the pull request run and a push run). Any failure fails it, and it passes only
# when nothing is still running and at least one entry succeeded or was skipped.
function Get-CheckVerdict([string[]]$States) {
  if (Test-AnyState $States $FailedStates) { return 'Failed' }
  if (-not $States -or (Test-AnyState $States $PendingStates)) { return 'Pending' }
  if (Test-AnyState $States $PassedStates) { return 'Passed' }
  return 'Pending'
}

function Get-StatesByName($Checks) {
  $byName = @{}
  foreach ($group in ($Checks | Group-Object { Get-CheckName $_ })) {
    $byName[$group.Name] = @($group.Group | ForEach-Object { Get-CheckState $_ })
  }
  return $byName
}

# Sorts a pull request's checks into passed, failed and still pending, for the checks its base lane requires.
function Get-CheckSummary($PullRequest) {
  $statesByName = Get-StatesByName $PullRequest.statusCheckRollup
  $verdicts = foreach ($name in $Required[$PullRequest.baseRefName]) {
    [pscustomobject]@{ Name = $name; Verdict = Get-CheckVerdict $statesByName[$name] }
  }
  [pscustomobject]@{
    Passed  = @($verdicts | Where-Object Verdict -eq 'Passed' | ForEach-Object Name)
    Failed  = @($verdicts | Where-Object Verdict -eq 'Failed' | ForEach-Object Name)
    Pending = @($verdicts | Where-Object Verdict -eq 'Pending' | ForEach-Object Name)
  }
}

function Wait-ForChecks([int]$Number, [string]$What) {
  $deadline = (Get-Date).AddMinutes($TimeoutMinutes)
  while ($true) {
    $pullRequest = Get-PullRequest $Number
    $summary = Get-CheckSummary $pullRequest
    if ($summary.Failed) { throw "$What failed: $($summary.Failed -join ', '). Fix it on the branch; nothing was bypassed." }
    if (-not $summary.Pending) { return $pullRequest }
    if ((Get-Date) -gt $deadline) { throw "$What is still waiting for: $($summary.Pending -join ', ') after $TimeoutMinutes minutes. Run the command again to carry on." }
    Write-Host "    waiting for: $($summary.Pending -join ', ')"
    Start-Sleep -Seconds 20
  }
}

# --- The lanes -----------------------------------------------------------------------------------------------------

function Get-Waiting {
  git fetch origin --quiet
  [pscustomobject]@{
    Development = @(git log --format='%h %s' origin/main..origin/development)
    Testing     = @(git log --format='%h %s' origin/main..origin/testing)
  }
}

function Open-PromotionPullRequest([string]$Base, [string]$Head, [string]$Title, [string]$Body) {
  $existing = gh pr list --base $Base --head $Head --state open --json number --jq '.[0].number // empty'
  if ($existing) { return [int]$existing }
  $url = gh pr create --base $Base --head $Head --title $Title --body $Body
  return [int]($url -replace '^.*/pull/', '')
}

# A new pull request needs at least one commit the base lacks, and GitHub can take a moment to show the last merge.
function Wait-ForNewCommits([string]$Base, [string]$Head) {
  $deadline = (Get-Date).AddMinutes(2)
  do {
    git fetch origin --quiet
    $ahead = [int](git rev-list --count "origin/${Base}..origin/${Head}")
    if ($ahead -gt 0) { return }
    Start-Sleep -Seconds 5
  } while ((Get-Date) -lt $deadline)
  throw "$Head has nothing that $Base lacks yet. Run the command again in a minute."
}

# One hop between lanes: open (or reuse) the pull request, wait for its checks, merge it with a merge commit.
function Invoke-Promotion([string]$Base, [string]$Head, [string]$Title, [string]$Body) {
  Wait-ForNewCommits $Base $Head
  $number = Open-PromotionPullRequest $Base $Head $Title $Body
  Wait-ForChecks $number "Checks on #$number ($Head to $Base)" | Out-Null
  gh pr merge $number --merge
  return $number
}

# --- Guards --------------------------------------------------------------------------------------------------------

function Assert-Shippable($PullRequest) {
  $number = $PullRequest.number
  $problems = @(
    @{ Broken = $PullRequest.state -ne 'OPEN'; Message = "Pull request #$number is $($PullRequest.state), not open." }
    @{ Broken = $PullRequest.isDraft; Message = "Pull request #$number is a draft." }
    @{ Broken = $PullRequest.baseRefName -ne 'development'; Message = "Pull request #$number goes into $($PullRequest.baseRefName). The fast lane starts with a pull request into development." }
    @{ Broken = $PullRequest.headRefName -notmatch $BranchPattern; Message = "Branch '$($PullRequest.headRefName)' is not one of feature/, fix/, refactor/, docs/, experiment/ or chore/." }
  )
  $first = $problems | Where-Object { $_.Broken } | Select-Object -First 1
  if ($first) { throw $first.Message }
}

function Assert-NothingQueued {
  $waiting = Get-Waiting
  $queued = @($waiting.Development + $waiting.Testing | Select-Object -Unique)
  if (-not $queued -or $IncludeQueued) { return }
  Write-Host 'Other changes are already waiting between main and development:' -ForegroundColor Yellow
  $queued | ForEach-Object { "  $_" }
  throw 'The promotion pull requests carry everything on development. Release those first, or run again with -IncludeQueued to ship them together.'
}

# --- Commands ------------------------------------------------------------------------------------------------------

function Show-Lanes {
  foreach ($lane in 'development', 'testing', 'main') {
    '{0,-12} {1}' -f $lane, (git log -1 --format='%h %s' "origin/$lane")
  }
}

function Show-Commits([string]$Label, [string[]]$Commits) {
  Write-Host "$Label $($Commits.Count)"
  $Commits | ForEach-Object { "  $_" }
}

function Show-OpenPullRequests {
  Write-Host 'Open pull requests:'
  $open = gh pr list --state open --json 'number,title,baseRefName,headRefName' --jq '.[] | "  #\(.number) \(.headRefName) -> \(.baseRefName)  \(.title)"'
  if ($open) { $open } else { '  none' }
}

function Show-Status {
  $waiting = Get-Waiting
  Show-Lanes
  Write-Host ''
  Show-Commits 'Waiting on development (not on main):' $waiting.Development
  Show-Commits 'Waiting on testing (not on main):' $waiting.Testing
  Write-Host ''
  Show-OpenPullRequests
}

function Invoke-Run([int]$Number) {
  if ($Number -le 0) { throw 'Give the number of the pull request to ship: ship.ps1 run <number>' }
  $pullRequest = Get-PullRequest $Number
  Assert-Shippable $pullRequest
  Assert-NothingQueued

  $title = $pullRequest.title
  $summary = Get-CheckSummary $pullRequest
  Write-Step "Fast lane for #$Number '$title'"
  Write-Host "    checks now: passed [$($summary.Passed -join ', ')]  pending [$($summary.Pending -join ', ')]  failed [$($summary.Failed -join ', ')]"
  if ($DryRun) {
    Write-Host '    dry run: would wait for the checks, squash-merge into development, then promote through testing to main (merging main deploys to production).'
    return
  }

  Write-Step 'Waiting for the pull request checks'
  Wait-ForChecks $Number "Checks on #$Number" | Out-Null
  Write-Step "Squash-merging #$Number into development"
  gh pr merge $Number --squash

  Write-Step 'Promoting development to testing'
  $toTesting = Invoke-Promotion 'testing' 'development' "Promote $title to testing" "Promotes #$Number from development to testing. Merge with a merge commit once the lane checks pass."
  Write-Step 'Releasing testing to main'
  $release = Invoke-Promotion 'main' 'testing' "Release $title to main" "Releases #$Number from development through testing (#$toTesting) to main. Merge with a merge commit once the main lane checks pass; merging deploys to production."

  Write-Step 'Shipped'
  Write-Host "    #$Number -> development, #$toTesting -> testing, #$release -> main."
  Write-Host "    Vercel now deploys main. Production: $ProductionUrl"
}

switch ($Command) {
  'status' { Show-Status }
  'run'    { Invoke-Run $Pr }
}
