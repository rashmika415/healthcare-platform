# Healthcare Platform

Healthcare Platform is a microservices-based telemedicine system that supports patient care workflows such as account management, appointment booking, doctor management, payments, and video consultations.

## Table of Contents

- Project Summary
- Features
- System Architecture
- Tech Stack
- Repository Structure
- Prerequisites
- Environment Configuration
- Service and Port Mapping
- Deployment with Docker Compose
- Deployment with Kubernetes
- Verification and Health Checks
- Running Test Scripts
- Troubleshooting
- Submission Files
- License

## Project Summary

This project is built as a distributed healthcare solution using multiple backend services behind a central API gateway and a React frontend. Each domain concern is isolated in its own service, making the system easier to scale and maintain.

## Features

- Authentication and role-based access control
- Admin panel: manage users, approve/reject doctors, monitor operations and transactions
- Patient profile and medical workflows
- Doctor profile and availability management
- Appointment booking and appointment history
- Payment processing workflow
- Video consultation support
- AI symptom checker with specialty recommendations
- Centralized routing through API gateway

## Admin Role (Fully Implemented)

Admin capabilities:

- **Manage user accounts**: list users, activate/deactivate accounts, delete users
- **Verify doctor registrations**: approve (verify) or reject doctor signups with a reason
- **Oversee platform operations**: view all appointments and active video sessions
- **Oversee financial transactions**: view all payment records

Admin login (Docker Compose default):

- **Email**: `admin@healthcare.com`
- **Password**: `admin123`

Create the seed admin (first time only):

```bash
cd services/api-gateway
npm install
node seedAdmin.js
```

Admin UI pages (client routes):

- `/admin/dashboard`
- `/admin/doctors`
- `/admin/patients`
- `/admin/appointments`
- `/admin/video`
- `/admin/transactions`

Admin API endpoints (API Gateway):

- `GET /admin/users`
- `PUT /admin/activate/:id`
- `PUT /admin/deactivate/:id`
- `DELETE /admin/users/:id`
- `PUT /admin/verify-doctor/:id`
- `PUT /admin/reject-doctor/:id` (body: `{ "reason": "..." }`)
- `GET /admin/stats`
- `GET /admin/appointments`
- `GET /admin/transactions`

## System Architecture

Request flow:

1. Browser client sends requests to API Gateway.
2. API Gateway authenticates and proxies requests to target services.
3. Domain services interact with MongoDB and return responses.

Core services:

- API Gateway
- Patient Service
- Doctor Service
- Appointment Service
- Payment Service
- Video Service
- AI Symptom Service
- MongoDB
- React Client

Note: The notification service is included in the Docker Compose stack.

## Tech Stack

- Frontend: React, Tailwind CSS, Axios
- Backend: Node.js, Express
- Database: MongoDB
- Containerization: Docker, Docker Compose
- Orchestration: Kubernetes manifests

## Repository Structure

- client: React frontend application
- services/api-gateway: Gateway and auth routing
- services/patient-service: Patient-related APIs
- services/doctor-service: Doctor-related APIs
- services/apponment-service: Appointment-related APIs
- services/Payment-service: Payment-related APIs
- services/video-service: Video consultation APIs
- services/ai-symptom-service: AI symptom analysis and specialty recommendation APIs
- services/notification-service: Notification service code (not in Compose stack)
- k8s: Kubernetes deployment manifests and scripts
- bridge: Additional Kubernetes overlay resources
- run-healthcare.ps1: Convenience script for Compose and Kubernetes lifecycle

## Prerequisites

Install these tools before running the project:

- Docker Desktop (latest stable)
- Docker Compose v2
- PowerShell 7+ (recommended on Windows)
- Optional for Kubernetes mode:
  - kubectl
  - Local cluster such as Docker Desktop Kubernetes, Minikube, or Kind

## Environment Configuration

The project currently includes placeholder secret values in deployment files. Replace them for real environments.

Important environment values:

- JWT_SECRET
- STRIPE_SECRET_KEY
- EMAIL_USER
- EMAIL_PASS
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- GEMINI_API_KEY (optional, for LLM-powered symptom analysis via Google Gemini)

Project-specific notes:

- Patient service uses additional variables via services/patient-service/.env.
- Appointment folder is named services/apponment-service in this repository.
- Payment folder is named services/Payment-service in this repository.

## Service and Port Mapping

### Docker Compose host ports

- Frontend Client: http://localhost:8082
- API Gateway: http://localhost:3100
- Patient Service: http://localhost:3101
- Doctor Service: http://localhost:3102
- Appointment Service: http://localhost:3103
- Payment Service: http://localhost:3104
- Notification Service: http://localhost:3005
- Video Service: http://localhost:3106
- AI Symptom Service: http://localhost:3107
- MongoDB: localhost:27018

### Internal container ports

- API Gateway: 3000
- Patient Service: 3001
- Doctor Service: 3002
- Appointment Service: 3003
- Payment Service: 3004
- Notification Service: 3005
- Video Service: 3006
- AI Symptom Service: 3007
- MongoDB: 27017

## Deployment with Docker Compose

Run from project root:

```powershell
docker compose up -d --build
```

Or with helper script:

```powershell
.\run-healthcare.ps1 -Mode compose -Action up
```

Check status:

```powershell
docker compose ps
```

Stop stack:

```powershell
docker compose down
```

Or:

```powershell
.\run-healthcare.ps1 -Mode compose -Action down
```

## Deployment with Kubernetes

Build local images:

```powershell
.\k8s\build-local-images.ps1
```

Deploy manifests:

```powershell
kubectl apply -f .\k8s\healthcare-platform.yaml
```

Or with helper script:

```powershell
.\run-healthcare.ps1 -Mode k8s -Action up
```

Check resources:

```powershell
kubectl get all -n healthcare
```

Remove deployment:

```powershell
kubectl delete -f .\k8s\healthcare-platform.yaml --ignore-not-found=true
```

## Verification and Health Checks

After startup, verify with these checks:

```powershell
curl.exe -i http://localhost:3100/health
curl.exe -i http://localhost:3100/appointments/getallappointments
curl.exe -i http://localhost:3103/appointments/getallappointments
```

Open UI:

- http://localhost:8082

## Running Test Scripts

Two quick scripts are included at repository root:

- test-services.js
- test-doctor-profile.js

Run with Node:

```powershell
node .\test-services.js
node .\test-doctor-profile.js
```

Note: Some script URLs currently target localhost ports 3000 or 3002, which are internal container ports in Compose mode. If needed, update them to host ports such as 3100 and 3102.

## Troubleshooting

### Services appear healthy but UI still fails

Use hard refresh in browser and verify API gateway endpoint:

```powershell
curl.exe -i http://localhost:3100/health
```

### Appointment page shows load error

- Confirm appointment service is running in Compose.
- Confirm API gateway can proxy appointment routes.
- Confirm frontend container was rebuilt after API-base changes.

### Check logs

```powershell
docker compose logs --tail=200 api-gateway
docker compose logs --tail=200 appointment-service
docker compose logs --tail=200 client
```

### Rebuild only one service

```powershell
docker compose up -d --build client
docker compose up -d --build appointment-service
```

## Submission Files

For assignment submission, include:

- README.md: Full project documentation
- readme.txt: Deployment steps in plain text


