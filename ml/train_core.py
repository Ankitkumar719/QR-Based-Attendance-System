"""
Shared training logic — used by CLI and Flask /train endpoint.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from config import (
    FEATURE_COLUMNS,
    MIN_NEW_RECORDS_FOR_AUTO_RETRAIN,
    MODEL_PATH,
    TARGET_COLUMN,
    TRAINING_META_PATH,
)
from db import DatabaseError, count_attendance_records
from features import build_training_dataframe, validate_training_frame

logger = logging.getLogger(__name__)


def load_training_meta() -> dict[str, Any]:
    if not TRAINING_META_PATH.exists():
        return {}
    try:
        return json.loads(TRAINING_META_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Could not read training_meta.json: %s", exc)
        return {}


def save_training_meta(meta: dict[str, Any]) -> None:
    TRAINING_META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")


def should_auto_retrain(meta: dict[str, Any]) -> tuple[bool, str]:
    """Return (should_train, reason)."""
    try:
        current_records = count_attendance_records()
    except DatabaseError as exc:
        return False, str(exc)

    last_count = int(meta.get("attendance_record_count", 0))
    delta = current_records - last_count

    if not meta.get("trained_at"):
        return True, "No prior training metadata; initial train recommended."

    if delta >= MIN_NEW_RECORDS_FOR_AUTO_RETRAIN:
        return True, f"{delta} new attendance records since last training (threshold {MIN_NEW_RECORDS_FOR_AUTO_RETRAIN})."

    return False, f"Only {delta} new records since last training; threshold is {MIN_NEW_RECORDS_FOR_AUTO_RETRAIN}."


def train_logistic_model(X: pd.DataFrame, y: pd.Series) -> tuple[LogisticRegression, dict[str, Any]]:
    model = LogisticRegression(max_iter=1000, random_state=42)

    if len(X) < 12:
        model.fit(X, y)
        metrics = {
            "accuracy": None,
            "test_samples": 0,
            "train_samples": int(len(y)),
            "note": "Small dataset; trained on all samples without hold-out test.",
        }
        logger.info("Small dataset (%d rows); trained without test split", len(X))
        return model, metrics

    test_size = 0.2 if len(X) >= 20 else 0.15
    stratify = y if y.nunique() > 1 else None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=stratify
    )

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))

    metrics = {
        "accuracy": round(accuracy, 4),
        "test_samples": int(len(y_test)),
        "train_samples": int(len(y_train)),
    }

    logger.info("Test accuracy: %.2f%%", accuracy * 100)
    logger.info("Confusion matrix:\n%s", confusion_matrix(y_test, y_pred))
    logger.info(
        "Classification report:\n%s",
        classification_report(y_test, y_pred, zero_division=0),
    )

    return model, metrics


def save_model_bundle(model: LogisticRegression, meta: dict[str, Any]) -> None:
    bundle = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "model_type": "LogisticRegression",
        "trained_at": meta.get("trained_at"),
        "data_source": "mongodb",
    }
    joblib.dump(bundle, MODEL_PATH)
    save_training_meta(meta)
    logger.info("Saved model to %s", MODEL_PATH)


def run_training(*, force: bool = False, auto: bool = False) -> dict[str, Any]:
    """
    Train from MongoDB and persist model.

    force: always train if data sufficient
    auto: train only if enough new records since last run
    """
    meta = load_training_meta()

    if auto and not force:
        ok, reason = should_auto_retrain(meta)
        if not ok:
            return {
                "trained": False,
                "skipped": True,
                "reason": reason,
                "meta": meta,
            }

    try:
        raw_df = build_training_dataframe()
        df = validate_training_frame(raw_df)
    except (ValueError, DatabaseError) as exc:
        logger.error("Training data preparation failed: %s", exc)
        return {
            "trained": False,
            "error": str(exc),
            "fallback": "Keep using existing attendance_model.pkl if present.",
            "meta": meta,
        }

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].astype(int)

    try:
        model, metrics = train_logistic_model(X, y)
    except Exception as exc:
        logger.exception("Model training failed: %s", exc)
        return {"trained": False, "error": str(exc), "meta": meta}

    try:
        record_count = count_attendance_records()
    except DatabaseError:
        record_count = meta.get("attendance_record_count", 0)

    new_meta = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "sample_count": int(len(df)),
        "attendance_record_count": record_count,
        "data_source": "mongodb",
        **metrics,
    }
    save_model_bundle(model, new_meta)

    return {
        "trained": True,
        "message": "Model trained from MongoDB attendance data",
        "meta": new_meta,
        "class_distribution": {
            "low_risk": int((y == 0).sum()),
            "high_risk": int((y == 1).sum()),
        },
    }
