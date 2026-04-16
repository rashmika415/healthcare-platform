# Healthcare Platform

Containerized microservices stack with MongoDB, API gateway, backend services, and React client.

## Runtime Choices

- Docker Compose for local development
- Kubernetes for local cluster testing

Kubernetes source of truth in this repo is `k8s/healthcare-platform.yaml`.

## Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- `kubectl` with an active local cluster (for Kubernetes mode)
- PowerShell

## One-Command Run

From repo root:

```powershell
.\run-healthcare.ps1 -Mode compose -Action up
```

```powershell
.\run-healthcare.ps1 -Mode k8s -Action up
```

## Management Commands

Compose:

```powershell
.\run-healthcare.ps1 -Mode compose -Action status
.\run-healthcare.ps1 -Mode compose -Action down
```

Kubernetes:

```powershell
.\run-healthcare.ps1 -Mode k8s -Action status
.\run-healthcare.ps1 -Mode k8s -Action down
```

## Main Endpoints

- Client: `http://localhost:8081`
- API Gateway: `http://localhost:3000`
- Patient Service: `http://localhost:3001`
- Doctor Service: `http://localhost:3002`
- Appointment Service: `http://localhost:3003`
- Payment Service: `http://localhost:3004`
- Video Service: `http://localhost:3006`

## Notes

- `k8s/build-local-images.ps1` builds images tagged as `healthcare/*:local` before applying Kubernetes manifests.
- Placeholder secrets are currently in `k8s/healthcare-platform.yaml`; replace them before non-local use.
- The bridge manifests under `bridge/` are generated artifacts and not used by the run script.