# Smart Attendance System - Project Description

## Overview
This is a full-stack attendance management system designed for academic institutions. It includes:
- A Node.js + Express backend with MongoDB persistence.
- A static frontend served directly by the backend.
- A Python ML service for attendance shortage prediction.
- Face recognition support using a Python worker.

## Backend
### Location
`backend/`

### Key responsibilities
- User authentication and role-based access.
- Admin, faculty, and student APIs.
- Class, timetable, schedule, and attendance management.
- Face registration and verification support.
- ML prediction proxy and retraining support.
- Socket.IO real-time classroom/session features.

### Important files
- `backend/server.js` - application entry point.
- `backend/package.json` - backend dependencies.
- `backend/config/env.js` - environment validation and configuration.
- `backend/config/db.js` - MongoDB connection.
- `backend/routes/` - route definitions for auth, admin, faculty, student, analytics, and ML.
- `backend/controllers/` - request logic for each area.
- `backend/middleware/authMiddleware.js` - JWT auth + role enforcement.
- `backend/models/` - Mongoose schemas for users, classes, attendance, schedules, and more.
- `backend/utils/jwt.js` - JWT token helpers.
- `backend/utils/facePythonClient.js` - bridge to the Python face worker.
- `backend/utils/mlPredictClient.js` - proxy for the ML shortage prediction service.

### Core flows
- Startup connects to MongoDB and creates a default admin user if needed.
- Auth routes support login and registration.
- Admin routes are protected by `requireRole("admin")`.
- Faculty routes are protected by `requireRole("faculty")`.
- Student routes are protected by `requireRole("student")`.
- Admin functions include user/class/department/section/course management and graduation/promotion logic.
- Faculty functions support session creation, attendance capture, and manual attendance fallback.
- Student functions support attendance marking, profile, attendance history, and active session checking.

## Frontend
### Location
`frontend/`

### Key files
- `frontend/index.html`
- `frontend/admin.html`
- `frontend/faculty.html`
- `frontend/student.html`
- `frontend/assets/js/` - frontend logic for authentication and API calls.
- `frontend/assets/css/styles.css`

### Behavior
- Served as static content by the backend.
- Uses JS assets to call `/api/...` routes and render the UI.

## ML Service
### Location
`ml/`

### Key responsibilities
- Attendance shortage risk prediction.
- Model retraining and status reporting.

### Important files
- `ml/app.py` - Flask API for prediction, health, and training.
- `ml/config.py` - ML service configuration.
- `ml/train_core.py` - training utility and auto-retrain logic.
- `ml/train_model.py` - model training entrypoint.
- `ml/requirements.txt` - Python dependencies.
- `ml/attendance_model.pkl` - serialized trained model.

### Service endpoints
- `GET /health` - service health and model status.
- `GET /training/status` - training metadata and retraining recommendation.
- `POST /train` - retrain model from data.
- `POST /predict` - predict attendance shortage risk.

## Deployment & environment
### Environment variables
Required for backend:
- `MONGO_URI`
- `JWT_SECRET`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

Optional but recommended:
- `FRONTEND_URL`
- `ML_PREDICT_URL`
- `ML_TRAIN_SECRET`
- `FACE_ML_SERVICE_URL`
- `FACE_ML_TIMEOUT_MS`

### Notes
- Backend is configured as ES modules.
- The root `package.json` only contains a single dependency and is not the backend app manifest.
- Backend dependencies are in `backend/package.json`, so install and run commands should target that folder.
- Face recognition relies on local Python runtime and `face-recognition` dependencies.
- The ML predictor is a separate Flask service, typically running on port 8000 by default.

## Additional points
- There is a two-step student creation flow in admin controllers to create identity first and assign academic details later.
- The project includes seeding and management scripts under `backend/scripts/`.
- Static frontend and backend are deployed together through Express static serving.
- Logging and error handling are centralized in `backend/middleware/errorHandler.js`.

## Recommended next steps
- Verify `.env` values and run `npm install` inside `backend/`.
- Ensure Python dependencies in `ml/requirements.txt` are installed before using face recognition or the ML service.
- Review frontend API integration to confirm routes and auth headers are aligned.
