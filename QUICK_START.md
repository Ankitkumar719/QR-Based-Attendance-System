# Quick Start Guide - Smart Attendance System

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+ (for ML services)
- MongoDB (connection string in `.env`)

## Startup Steps (Windows/Mac/Linux)

### Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# ML service dependencies (one-time setup)
cd ../ml
pip install -r requirements.txt face-recognition pillow flask-cors
cd ..
```

### Step 2: Environment Setup

Copy and configure `.env`:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and settings
```

Key settings:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
FACE_ML_SERVICE_URL=http://localhost:5001
ML_PREDICT_URL=http://localhost:8000
```

### Step 3: Start Services (Open Multiple Terminals)

#### Terminal 1 - Backend Server
```bash
cd backend
npm start
# You should see: "Server running on port 5000"
```

#### Terminal 2 - Face Recognition Service ⭐ IMPORTANT
```bash
cd backend/ml
python face_recognition_service.py
# You should see: "Starting Face Recognition Service..."
# And: "Running on http://0.0.0.0:5001"
```

#### Terminal 3 (Optional) - ML Shortage Predictor
```bash
cd ml
python app.py
# You should see: "Running on http://0.0.0.0:8000"
```

### Step 4: Open Frontend

```bash
# Option A: Serve from Node.js (via backend)
# Just visit: http://localhost:5000

# Option B: Open HTML directly
# Open frontend/index.html in browser
# It will connect to http://localhost:5000 for API
```

### Step 5: Verify Everything Works

✅ Check health:
```bash
# Terminal 1
curl http://localhost:5000/api/health

# Terminal 2
curl http://localhost:5001/health

# Should both return 200 OK
```

✅ Login and test:
1. Go to http://localhost:5000
2. Login with test credentials
3. Go to Profile → Register Face
4. Follow on-screen instructions

## Troubleshooting

### "Cannot find module 'cors'"
```bash
cd backend
npm install cors
```

### "ModuleNotFoundError: No module named 'face_recognition'"
```bash
pip install face-recognition pillow flask-cors
```

### Port 5001 already in use
```bash
# Kill existing process
# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5001 | xargs kill -9
```

### Face service won't start
1. Check Python version: `python --version` (need 3.8+)
2. Check dependencies installed: `pip list | grep face`
3. Check face_data directory exists: `ls backend/ml/face_data`

## Architecture Overview

```
Frontend (HTML/JS)
     ↓
Backend API (Node.js:5000)
     ├→ Face Recognition (Python:5001) ⭐
     ├→ ML Predictor (Python:8000)
     └→ MongoDB
```

## Important Notes

⭐ **The face recognition service (port 5001) MUST be running** for face registration to work.

- Frontend requires **both** services (5000 + 5001)
- Backend forwards face requests to Python service
- Each service needs its own terminal
- Ctrl+C in any terminal stops that service

## For Development

### Enabling Debug Logs

Edit `backend/controllers/mlController.js` to see more details:
```javascript
// Line 32 onwards - logs already included
// Check browser console and terminal output
```

### Testing Face Upload Directly

```bash
# After starting both services...
curl -X POST http://localhost:5000/api/ml/register-face \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "studentId": "2211001",
    "image": "<base64_image_data>"
  }'
```

## Production Deployment

See [FACE_RECOGNITION_SETUP.md](./FACE_RECOGNITION_SETUP.md) for:
- Render.com deployment
- AWS Lambda setup
- Docker containerization
- HTTPS production configuration

---

**Got stuck?** Check [FACE_RECOGNITION_SETUP.md](./FACE_RECOGNITION_SETUP.md) for comprehensive troubleshooting.
