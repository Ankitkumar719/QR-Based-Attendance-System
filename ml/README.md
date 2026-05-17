# Attendance Shortage Risk — ML Module

Predicts attendance **shortage risk** using Logistic Regression trained on **live MongoDB** data (same database as the Node.js backend).

Standalone under `/ml` — does not affect face recognition (`backend/ml/`).

## Architecture

```
MongoDB Atlas
  ├── users (students)
  ├── classes
  ├── attendancesessions
  └── attendancerecords
        ↓ pymongo
  features.py → pandas DataFrame
        ↓
  train_core.py → attendance_model.pkl
        ↓
  app.py POST /predict
```

### Feature engineering (per student)

| Field | Source |
|-------|--------|
| `attendance_percentage` | present sessions ÷ total class sessions × 100 |
| `absent_days` | missed sessions (no present record) |
| `shortage_risk` | `1` if percentage &lt; 75%, else `0` |

## Setup

```bash
cd ml
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Copy `ml/.env.example` → `ml/.env` or ensure `backend/.env` contains:

```
MONGO_URI=mongodb+srv://...
ML_TRAIN_SECRET=your_secret
```

## Train from MongoDB

```bash
# Force train
python train_model.py

# Auto train only if ≥ ML_MIN_NEW_RECORDS new attendance records
python train_model.py --auto
```

Or via Flask:

```http
POST http://localhost:8000/train
X-ML-Train-Secret: your_secret
{ "force": true }
```

## Run API (port 8000)

```bash
python app.py
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Model + last training info |
| GET | `/training/status` | Metadata + auto-retrain hint |
| POST | `/train` | Retrain from MongoDB |
| POST | `/predict` | Shortage risk prediction |

On startup, the service attempts **auto-retrain** if enough new records exist since `training_meta.json`.

## Admin trigger (Node.js)

```
POST /api/admin/ml/retrain
Authorization: Bearer <admin JWT>
{ "force": true }

GET /api/admin/ml/training-status
```

Requires `ML_PREDICT_URL` and optional `ML_TRAIN_SECRET` in `backend/.env`.

## Insufficient data

Training fails gracefully if:

- Fewer than `ML_MIN_STUDENT_SAMPLES` (default 10) students with sessions
- No sessions in database
- MongoDB unreachable

Existing `attendance_model.pkl` remains usable until a successful retrain.

## Legacy CSV

`dummy_attendance_dataset.csv` is **no longer used** for training. Kept only as a reference sample.
