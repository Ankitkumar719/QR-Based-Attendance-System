"""ML module configuration (reads from environment / ml/.env)."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ML_DIR = Path(__file__).resolve().parent
load_dotenv(ML_DIR / ".env")
load_dotenv(ML_DIR.parent / "backend" / ".env")

MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "")  # optional; parsed from URI if empty

# Mongoose default collection names (lowercase plural)
COL_USERS = os.getenv("ML_COL_USERS", "users")
COL_CLASSES = os.getenv("ML_COL_CLASSES", "classes")
COL_SESSIONS = os.getenv("ML_COL_SESSIONS", "attendancesessions")
COL_RECORDS = os.getenv("ML_COL_RECORDS", "attendancerecords")

MODEL_PATH = ML_DIR / "attendance_model.pkl"
TRAINING_META_PATH = ML_DIR / "training_meta.json"

FEATURE_COLUMNS = ["attendance_percentage", "absent_days"]
TARGET_COLUMN = "shortage_risk"

# Label: shortage if overall attendance below this threshold (%)
SHORTAGE_THRESHOLD_PCT = float(os.getenv("ML_SHORTAGE_THRESHOLD_PCT", "75"))

# Training gates
MIN_STUDENT_SAMPLES = int(os.getenv("ML_MIN_STUDENT_SAMPLES", "10"))
MIN_SESSIONS_PER_STUDENT = int(os.getenv("ML_MIN_SESSIONS_PER_STUDENT", "1"))
MIN_NEW_RECORDS_FOR_AUTO_RETRAIN = int(os.getenv("ML_MIN_NEW_RECORDS", "20"))

# Flask
HOST = os.getenv("ML_HOST", "0.0.0.0")
PORT = int(os.getenv("ML_PORT", "8000"))
ML_TRAIN_SECRET = os.getenv("ML_TRAIN_SECRET", "")
