# 📚 Smart Attendance System

This repository contains the source code for a Smart Attendance System with face recognition and ML-based features. The README below gives a clear project overview — what it is, how to run it, and which important files to check.

## 1) Project Short Description

- Purpose: Attendance management for educational institutions — supports both QR and face recognition. Includes role-based access for faculty, students, and admin, analytics, and ML predictions (for example, attendance shortage prediction).

## 2) Tech Stack

- Backend: Node.js + Express (`backend/server.js`)
- Database: MongoDB (Mongoose models under `backend/models`)
- ML / Face recognition: Python (Flask scripts/services in `ml/` and `backend/ml/`)
- Frontend: Static HTML/CSS/JS in `frontend/`
- Auth: JWT + bcrypt

## 3) High-level Architecture

- Frontend (browser) → Express REST API (`/api/*`) → MongoDB
- Face recognition service (Python) is called from the backend HTTP client (face register / verify)
- ML training and prediction scripts are available under `ml/`

## 4) Quick Start Steps (Windows / PowerShell)

1. Backend setup

```powershell
cd Smart\backend
npm install
copy .env.example .env   # or manually set environment variables
npm start
```

2. ML service (Python)

```powershell
cd Smart\ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

3. Frontend

- The backend serves frontend pages; if you want to open locally, open `frontend/index.html` in the browser.

Note: If `server.js` does not launch the ML service itself, run the ML service in a separate terminal and set its URL in `backend/.env`.

## 5) Important Files / Locations

- Backend entry: `backend/server.js`
- DB config: `backend/config/db.js`
- Models: `backend/models/` (e.g., `User.js`, `AttendanceRecord.js`)
- Routes: `backend/routes/` (authRoutes, mlRoutes, adminRoutes, facultyRoutes, studentRoutes)
- Controllers: `backend/controllers/` (authController.js, mlController.js, studentController.js)
- ML service (Python): `ml/app.py`, `ml/train_model.py`
- Backend ML helper: `backend/ml/face_recognition_service.py` (if present)
- Frontend pages: `frontend/index.html`, `frontend/admin.html`, JS in `frontend/assets/js/`

## 6) Key Environment Variables

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `ML_SERVICE_URL` — Face/ML service base URL
- `SMTP_*` — Email config (if notifications are used)

## 7) Common API prefixes

- `/api/auth/*`
- `/api/admin/*`
- `/api/faculty/*`
- `/api/student/*`
- `/api/ml/*`

## 8) Suggested Prompts for ChatGPT

- Project overview:
  - “My project `Smart` has backend Express (`backend/server.js`), static frontend (`frontend/`), and ML service Python (`ml/app.py`). Please understand the project structure and tell me which files to check if I get a JWT login error.”
- Bug/trace debugging:
  - “I get this error while running `backend/server.js`: `<error text>`. I have set `MONGO_URI` in `backend/.env`. Which file should I check first?”
- Feature request:
  - “I want to add an attendance export CSV feature. Suggest the backend route, controller function, and frontend change. Show a code snippet for `backend/controllers/attendanceController.js`.”

Always include:

- Repo root path (`Smart`), the commands you ran (for example: `npm start`), and the exact error stack trace if there is any.

## 9) Notes / Tips

- If dependencies are missing, run `npm install` inside `backend/` and `pip install -r ml/requirements.txt` inside `ml/`.
- ML dependencies like OpenCV or dlib may be platform-specific on Windows and may require wheels or Visual Studio Build Tools.

---

## ✨ Features

- Role-based authentication (Admin, Faculty, Student)
- QR code-based attendance system
- 🤖 Facial recognition attendance using Machine Learning
- Real-time attendance tracking
- Analytics dashboard and reports
- Email notifications

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Python (Flask for ML)
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Frontend**: HTML, CSS, JavaScript
- **ML**: OpenCV, face-recognition library
- **Charts**: Chart.js, QRious

## 🚀 Setup

### Prerequisites

- Node.js
- Python 3.x
- MongoDB

### Installation

```bash
git clone <repository-url>
cd Smart
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies for ML
pip install opencv-python face-recognition flask

# Set up environment variables
cp .env.example .env

# Start Python ML service
python ml/face_recognition_service.py &

# Start Node.js server
npm run dev
```

## 🤖 AI Features

- **Facial Recognition**: Students can register their face and mark attendance using facial recognition.

## 👨‍💻 Author

Developed as a full-stack MERN project.
