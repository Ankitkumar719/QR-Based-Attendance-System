"""
Build training features from live MongoDB attendance data.
"""

from __future__ import annotations

import logging
from typing import Any

import pandas as pd

from config import (
    FEATURE_COLUMNS,
    MIN_SESSIONS_PER_STUDENT,
    MIN_STUDENT_SAMPLES,
    SHORTAGE_THRESHOLD_PCT,
    TARGET_COLUMN,
)
from db import DatabaseError, fetch_attendance_collections

logger = logging.getLogger(__name__)


def _sid(value: Any) -> str:
    return str(value)


def _class_matches_student(cls: dict, student: dict) -> bool:
    return (
        cls.get("department") == student.get("department")
        and str(cls.get("semester")) == str(student.get("semester"))
        and cls.get("section") == student.get("section")
    )


def build_training_dataframe() -> pd.DataFrame:
    """
    Per-student features from sessions in the student's class group:
      - attendance_percentage
      - absent_days (missed sessions)
      - shortage_risk (1 if percentage < threshold)
    """
    try:
        data = fetch_attendance_collections()
    except DatabaseError:
        raise

    students = data["students"]
    classes = data["classes"]
    sessions = data["sessions"]
    records = data["records"]

    if not students:
        raise ValueError("No students found in database.")
    if not sessions:
        raise ValueError("No attendance sessions found. Faculty must conduct sessions first.")

    # Index: (studentId, sessionId) -> record
    record_map: dict[tuple[str, str], dict] = {}
    for rec in records:
        key = (_sid(rec["studentId"]), _sid(rec["sessionId"]))
        record_map[key] = rec

    # Index: classId -> [sessions]
    sessions_by_class: dict[str, list[dict]] = {}
    for session in sessions:
        cid = _sid(session["classId"])
        sessions_by_class.setdefault(cid, []).append(session)

    rows: list[dict[str, Any]] = []

    for student in students:
        if not student.get("department") or not student.get("semester") or not student.get("section"):
            continue

        class_ids = [_sid(c["_id"]) for c in classes if _class_matches_student(c, student)]
        if not class_ids:
            continue

        student_sessions: list[dict] = []
        for cid in class_ids:
            student_sessions.extend(sessions_by_class.get(cid, []))

        if len(student_sessions) < MIN_SESSIONS_PER_STUDENT:
            continue

        present = 0
        absent = 0
        student_id = _sid(student["_id"])

        for session in student_sessions:
            session_id = _sid(session["_id"])
            rec = record_map.get((student_id, session_id))
            if rec and rec.get("status") == "present":
                present += 1
            else:
                absent += 1

        total = present + absent
        attendance_percentage = round((present / total) * 100, 2) if total else 0.0
        shortage_risk = 1 if attendance_percentage < SHORTAGE_THRESHOLD_PCT else 0

        rows.append(
            {
                "student_id": student_id,
                "student_name": student.get("name", ""),
                "roll_no": student.get("rollNo", ""),
                "total_sessions": total,
                "present_sessions": present,
                FEATURE_COLUMNS[0]: attendance_percentage,
                FEATURE_COLUMNS[1]: absent,
                TARGET_COLUMN: shortage_risk,
            }
        )

    df = pd.DataFrame(rows)
    logger.info("Built training dataframe with %d student rows", len(df))
    return df


def validate_training_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Validate row count and required columns."""
    if df is None or df.empty:
        raise ValueError(
            "Insufficient training data: no students with assigned classes and attendance sessions."
        )

    required = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Training frame missing columns: {missing}")

    clean = df[required].copy()
    for col in FEATURE_COLUMNS:
        clean[col] = pd.to_numeric(clean[col], errors="coerce")
    clean[TARGET_COLUMN] = pd.to_numeric(clean[TARGET_COLUMN], errors="coerce")
    clean = clean.dropna()

    if len(clean) < MIN_STUDENT_SAMPLES:
        raise ValueError(
            f"Insufficient training samples: need at least {MIN_STUDENT_SAMPLES} students "
            f"with class sessions, found {len(clean)}."
        )

    if clean[TARGET_COLUMN].nunique() < 2:
        logger.warning("Only one shortage_risk class present; model may be less reliable.")

    return clean
