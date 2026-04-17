$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
Set-Location $root

function Resolve-ServiceContext {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Candidates
  )

  foreach ($candidate in $Candidates) {
    $fullPath = Join-Path $root $candidate
    if (Test-Path $fullPath) {
      return $candidate
    }
  }

  throw "None of the expected service paths exist: $($Candidates -join ', ')"
}

$appointmentContext = Resolve-ServiceContext -Candidates @(
  "services/appointment-service",
  "services/apponment-service"
)

$paymentContext = Resolve-ServiceContext -Candidates @(
  "services/payment-service",
  "services/Payment-service"
)

$images = @(
  @{ Name = "healthcare/api-gateway:local"; Context = "services/api-gateway" },
  @{ Name = "healthcare/patient-service:local"; Context = "services/patient-service" },
  @{ Name = "healthcare/doctor-service:local"; Context = "services/doctor-service" },
  @{ Name = "healthcare/appointment-service:local"; Context = $appointmentContext },
  @{ Name = "healthcare/payment-service:local"; Context = $paymentContext },
  @{ Name = "healthcare/video-service:local"; Context = "services/video-service" }
)

Write-Host "Building local Kubernetes images..." -ForegroundColor Cyan

foreach ($img in $images) {
  Write-Host "-> Building $($img.Name) from $($img.Context)" -ForegroundColor Yellow
  docker build -t $img.Name $img.Context
  if ($LASTEXITCODE -ne 0) {
    throw "Build failed for $($img.Name)"
  }
}

Write-Host "All images built successfully." -ForegroundColor Green
