# Face Recognition Service - Setup & Troubleshooting Guide

## Overview

The Smart Attendance System uses a dual-service architecture for face recognition:
- **Frontend (React/HTML/JS)**: Captures face via webcam
- **Backend (Node.js/Express)**: Authenticates and forwards requests
- **Face Service (Python/Flask)**: Processes face recognition on **port 5001**

## Critical Issues Fixed

### 1. Port Conflict ❌ → ✅
**Problem**: Both Node.js and Flask face service tried to use port 5000
**Solution**: Flask service now runs on port **5001**

### 2. Missing Service URL ❌ → ✅
**Problem**: `.env` file didn't define `FACE_ML_SERVICE_URL`
**Solution**: Added to `.env` file: `FACE_ML_SERVICE_URL=http://localhost:5001`

### 3. Missing Error Details ❌ → ✅
**Problem**: Generic "Error registering face" message
**Solution**: Frontend now logs actual errors with codes (FACE_SERVICE_NOT_RUNNING, etc.)

### 4. Poor Logging ❌ → ✅
**Problem**: Couldn't debug failures
**Solution**: Added comprehensive logging to backend and Flask service

## Running the Face Recognition Service

### Local Development (All Services)

1. **Start MongoDB** (if needed for attendance records)
   ```bash
   # Your MongoDB connection string in .env
   ```

2. **Terminal 1 - Start Node.js Backend**
   ```bash
   cd backend
   npm install
   npm start
   # Runs on http://localhost:5000
   ```

3. **Terminal 2 - Start Face Recognition Service**
   ```bash
   cd backend/ml
   # Install dependencies (one-time)
   pip install -r ../../ml/requirements.txt face-recognition pillow
   
   # Run the service
   python face_recognition_service.py
   # Runs on http://localhost:5001
   # Look for: "Starting Face Recognition Service..."
   ```

4. **Terminal 3 - Start Frontend Dev Server** (if using hot-reload)
   ```bash
   # Or open frontend/index.html in browser
   # Points to http://localhost:5000 for API
   ```

### Health Checks

- Backend health: `curl http://localhost:5000/api/health`
- Face service health: `curl http://localhost:5001/health`

Both should return 200 OK responses.

## Troubleshooting

### Error: "Face registration service is not running"

**Cause**: Face Flask service on port 5001 is not running

**Fix**:
```bash
# Make sure you're in backend/ml directory
python face_recognition_service.py

# Verify it's running:
curl http://localhost:5001/health
# Should see: {"status": "ok", "service": "face-recognition", ...}
```

### Error: "Cannot reach face service. Check network and try again"

**Cause**: Service is running but unreachable (DNS, firewall, wrong port)

**Possible fixes**:
1. Check `FACE_ML_SERVICE_URL` in backend/.env
2. Verify Flask service is running on correct port:
   ```bash
   # On Windows
   netstat -ano | findstr :5001
   
   # On Mac/Linux
   lsof -i :5001
   ```
3. Check firewall isn't blocking localhost:5001

### Error: "Face not detected: No face detected in image"

**Cause**: Face recognition model couldn't find a face

**Possible fixes**:
1. Ensure face is clearly visible
2. Check lighting (avoid backlighting)
3. Remove sunglasses or masks
4. Get closer to camera (face should be ~20-30% of frame)
5. Check camera resolution is adequate

### Error: "Multiple faces detected"

**Cause**: More than one face in the image

**Fix**: Take photo alone, ensure no other people/faces in background

### Python Dependencies Missing

**Install face_recognition library**:
```bash
# Face recognition requires dlib which needs compilation
# This may take 5-10 minutes on first install

# On Windows
pip install face-recognition pillow

# On Mac
pip install face-recognition pillow

# On Linux (may need additional packages)
sudo apt-get install build-essential cmake git
pip install face-recognition pillow
```

Check installation:
```bash
python -c "import face_recognition; print('✓ face_recognition installed')"
```

## Database Structure

Face encodings are stored as `.npy` files in `backend/ml/face_data/` directory:
```
backend/ml/face_data/
  ├── 2211234.npy        # Student roll number or ID
  ├── john_doe.npy
  └── ...
```

Each `.npy` file contains a 128-dimensional numpy array (face encoding).

## Verification Flow

1. **Student clicks "Register Face"** (Profile page)
2. Frontend requests camera permission
3. Frontend captures image → converts to base64
4. Frontend sends to: `POST /api/ml/register-face`
5. Backend (Node.js) validates and invokes the local Python worker (`backend/ml/face_worker.py`)
6. Python worker:
   - Decodes base64 image
   - Detects face using `face_recognition` library
   - Generates 128-D face encoding (descriptor)
   - Returns descriptor to backend for MongoDB storage
7. Frontend shows: "✅ Face registered successfully!"

## Production Deployment (Render, AWS)

### Render.com (Free plan-friendly: single service)

This project supports running face recognition inside the Node.js backend service by spawning a local Python worker.

Recommended Render setup:
- Deploy using Docker (`Dockerfile` + `render.yaml`).
- Set `MONGO_URI` in Render Environment Variables.
- Optional: `FACE_PYTHON_BIN=python3` and `FACE_ML_TIMEOUT_MS=30000`.

### AWS (Lambda + RDS)

For Lambda, use Layer for face_recognition (pre-compiled):
```bash
# Create layer
mkdir python
pip install -r requirements.txt face-recognition -t python/lib/python3.11/site-packages/
zip -r layer.zip python
# Upload as Lambda Layer
```

## Frontend Error Codes

| Code | Meaning | User Message |
|------|---------|--------------|
| `FACE_SERVICE_NOT_RUNNING` | Flask service offline | "Face recognition service is offline" |
| `FACE_SERVICE_UNREACHABLE` | Network/DNS error | "Cannot reach face service" |
| `FACE_DETECTION_FAILED` | No face found | "Face not detected" |
| `FACE_SERVICE_TIMEOUT` | Slow response | "Face service took too long" |
| `FACE_SERVICE_UNAVAILABLE` | Not configured | "Face service not configured" |
| `ENDPOINT_NOT_FOUND` | Wrong URL | "Endpoint not available" |

## Performance Notes

- Face encoding takes 500ms-2s per image
- Compare against 1000+ faces: 500ms-1s
- Image size doesn't matter (automatically resized)
- Quality matters: low-light images take longer to process

## Security Notes

1. Face encodings are **not** images - they're anonymous 128-D vectors
2. Cannot reconstruct face image from encoding
3. Stored locally in `face_data/` - not sent to external services
4. Frontend requires authentication token to call endpoints
5. Backend validates student identity before saving

## Debugging Tips

### Enable verbose logging

Edit `backend/controllers/mlController.js`:
```javascript
// Change log level
console.log = console.debug  // More verbose
```

Edit `backend/ml/face_recognition_service.py`:
```python
# Line 11
logging.basicConfig(level=logging.DEBUG)  # More detailed logs
```

### Test face service directly

```bash
# Register a test face
curl -X POST http://localhost:5001/register_face \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test_student",
    "image": "<base64_image_here>"
  }'

# Check service health
curl http://localhost:5001/health
```

### Monitor service logs

```bash
# While service is running, watch for errors
tail -f /path/to/logs  # If logging to file

# Or check browser DevTools Console (frontend errors)
# Or check Node.js terminal output (backend errors)
```

## Common Deployment Issues

### "ModuleNotFoundError: No module named 'face_recognition'"
→ Run: `pip install face-recognition pillow`

### "Cannot find face_recognition_service.py"
→ Check path: `backend/ml/face_recognition_service.py`

### "Address already in use: port 5001"
→ Kill existing process: `lsof -ti:5001 | xargs kill -9`

### "CORS error" when accessing from different domain
→ CORS is enabled in Flask service (line: `CORS(app, origins=["*"])`)
→ Check browser DevTools → Network → CORS headers

## Next Steps

1. ✅ Start both services (backend + face service)
2. ✅ Test health endpoints
3. ✅ Go to Profile page, click "Register Face"
4. ✅ Monitor console for error codes
5. ✅ Check face_data/ directory for .npy files
6. ✅ Verify attendance marking works after registration
