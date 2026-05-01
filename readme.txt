Healthcare Platform - Deployment Steps
======================================

Prerequisites
-------------
1. Install Docker Desktop (with Docker Compose v2).
2. Use Windows PowerShell (recommended) in project root.

Deploy with Docker Compose
--------------------------
1. Open terminal in project root.
2. Run:
   docker compose up -d --build
3. Verify containers:
   docker compose ps
4. Check gateway health:
   curl.exe -i http://localhost:3100/health
5. Open frontend:
   http://localhost:8082

Stop Deployment
---------------
1. Run:
   docker compose down

Alternative using helper script
-------------------------------
1. Start:
   .\run-healthcare.ps1 -Mode compose -Action up
2. Status:
   .\run-healthcare.ps1 -Mode compose -Action status
3. Stop:
   .\run-healthcare.ps1 -Mode compose -Action down

Kubernetes Deployment (Optional)
--------------------------------
1. Start the stack:
   .\run-healthcare.ps1 -Mode k8s -Action up
2. This will build images, sync the database links from `.env`, and apply the manifests.
3. Check resources:
   kubectl get all -n healthcare
4. Gateway health (NodePort):
   http://localhost:30000/health
5. Stop the stack:
   .\run-healthcare.ps1 -Mode k8s -Action down

Notes
-----
- Replace placeholder secrets before production deployment.
- Appointment service path in repository is: services/apponment-service
- Payment service path in repository is: services/Payment-service
