# healthcare-platform

# Healthcare Platform — Microservices

## Team Members
- Member 1 — Patient Service (YOUR NAME)
- Member 2 — Doctor Service
- Member 3 — Appointment + Payment + Notification
- Member 4 — Video + AI + DevOps

## How to run locally

### Prerequisites
- Node.js v20+
- MongoDB running locally
- Git

### Setup steps

1. Clone the repo
   git clone https://github.com/YOUR_USERNAME/healthcare-platform.git
   cd healthcare-platform

2. Install packages for each service
   cd services/api-gateway && npm install
   cd ../patient-service && npm install
   cd ../doctor-service && npm install
   cd ../appointment-service && npm install
   cd ../payment-service && npm install
   cd ../notification-service && npm install
   cd ../video-service && npm install

3. Create .env files (see .env.example in each service)

4. Run services (each in its own terminal)
   cd services/api-gateway && npm run dev
   cd services/patient-service && npm run dev
   (repeat for your service)

## Ports
- API Gateway:        http://localhost:3000
- Patient Service:    http://localhost:3001
- Doctor Service:     http://localhost:3002
- Appointment Service: http://localhost:3003
- Payment Service:    http://localhost:3004
- Notification Service: http://localhost:3005
- Video Service:      http://localhost:3006

## API Gateway Auth Endpoints
- POST /auth/register
- POST /auth/login
- GET  /auth/me
```

---

## Step 3 — Create `.env.example` files so teammates know what to put

Create `services/api-gateway/.env.example`:
```
PORT=3000
JWT_SECRET=your_jwt_secret_here
MONGO_URI=mongodb://localhost:27017/authdb

PATIENT_SERVICE_URL=http://localhost:3001
DOCTOR_SERVICE_URL=http://localhost:3002
APPOINTMENT_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005
VIDEO_SERVICE_URL=http://localhost:3006
```

Create `services/patient-service/.env.example`:
```
PORT=3001
MONGO_URI=mongodb://localhost:27017/patientdb
JWT_SECRET=your_jwt_secret_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Push these too — `.env.example` files are safe to push because they have no real secrets.

---

## Step 4 — Guide for each teammate

Share this with your group chat. Each person only needs to follow their own section.

---

### 👉 Member 2 — Doctor Service guide

**Your service folder:** `services/doctor-service`
**Your port:** `3002`
**Your database:** `mongodb://localhost:27017/doctordb`

Create `services/doctor-service/.env`:
```
PORT=3002
MONGO_URI=mongodb://localhost:27017/doctordb
JWT_SECRET=healthcare_super_secret_key_2026