# For manual downloading only
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Url,

    [Parameter(Mandatory = $false)]
    [switch]$NoDownload
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
$dataDir = Join-Path $projectRoot 'osrm\data'
$processedDir = Join-Path $projectRoot 'osrm\processed'

Assert-Command -Name 'docker'
Assert-Command -Name 'curl'

New-Item -ItemType Directory -Path $dataDir, $processedDir -Force | Out-Null

try {
    $uri = [System.Uri]::new($Url)
} catch {
    throw "The provided URL is invalid: $Url"
}

$fileName = [System.IO.Path]::GetFileName($uri.AbsolutePath)
if ($fileName -notmatch '\.osm\.pbf$') {
    throw 'The input URL must point to an .osm.pbf extract.'
}

$targetFile = Join-Path $dataDir $fileName

# Handle download logic based on the -NoDownload switch
if ($NoDownload) {
    if (-not (Test-Path $targetFile)) {
        throw "The file '$targetFile' was not found. Cannot skip download."
    }
    Write-Host "Skipping download as requested. Using existing file: $targetFile"
} else {
    if (Test-Path $targetFile) {
        Write-Host "Removing existing download: $targetFile"
        Remove-Item -Force $targetFile
    }
    Write-Host "Downloading extract into $dataDir"
    Invoke-WebRequest -Uri $Url -OutFile $targetFile
    Write-Host 'Step A: download complete'
}

# Fix: Strips '.osm.pbf' correctly instead of leaving '.osm' behind
$mapStem = $fileName -replace '\.osm\.pbf$', ''

Get-ChildItem -LiteralPath $processedDir -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "$mapStem.*" } | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host 'Step B: extracting routing graph with osrm-extract'
docker run --rm `
  -v "${dataDir}:/data" `
  -v "${processedDir}:/processed" `
  osrm/osrm-backend:latest `
  sh -c "cd /data && osrm-extract -p /opt/car.lua /data/$fileName"

Get-ChildItem -LiteralPath $dataDir -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "$mapStem.osrm*" } | ForEach-Object {
    Move-Item -LiteralPath $_.FullName -Destination $processedDir -Force
}

Write-Host 'Step C: partitioning graph with osrm-partition'
docker run --rm `
  -v "${processedDir}:/processed" `
  osrm/osrm-backend:latest `
  sh -c "cd /processed && osrm-partition /processed/$mapStem"

Write-Host 'Step D: customizing graph for MLD with osrm-customize'
docker run --rm `
  -v "${processedDir}:/processed" `
  osrm/osrm-backend:latest `
  sh -c "cd /processed && osrm-customize /processed/$mapStem"

Write-Host 'OSRM processing completed successfully.'
Write-Host "Processed files are available in $processedDir"
