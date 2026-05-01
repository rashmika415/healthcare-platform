param(
  [ValidateSet("compose", "k8s")]
  [string]$Mode = "compose",
  [ValidateSet("up", "down", "status")]
  [string]$Action = "up"
)

$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
Set-Location $root

function Invoke-LocalImageBuild {
  & "$root\k8s\build-local-images.ps1"
}

function Invoke-DatabaseSecretSync {
  $envFile = Join-Path $root '.env'
  if (-not (Test-Path $envFile)) {
    throw ".env file not found at $envFile"
  }

  kubectl create secret generic healthcare-db-uris `
    --namespace healthcare `
    --from-env-file=$envFile `
    --dry-run=client `
    -o yaml | kubectl apply -f -
}

switch ($Mode) {
  "compose" {
    switch ($Action) {
      "up" { docker compose up --build -d }
      "down" { docker compose down }
      "status" { docker compose ps }
    }
  }
  "k8s" {
    switch ($Action) {
      "up" {
        Invoke-LocalImageBuild
        Invoke-DatabaseSecretSync
        kubectl apply -f "$root\k8s\healthcare-platform.yaml"
        kubectl get pods -n healthcare
      }
      "down" {
        kubectl delete -f "$root\k8s\healthcare-platform.yaml" --ignore-not-found=true
      }
      "status" {
        kubectl get all -n healthcare
      }
    }
  }
}