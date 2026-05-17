"""
MongoDB access for the ML training pipeline (pymongo).
Uses the same Atlas database as the Node.js backend.
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlparse

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError

from config import (
    COL_CLASSES,
    COL_RECORDS,
    COL_SESSIONS,
    COL_USERS,
    MONGO_DB_NAME,
    MONGO_URI,
)

logger = logging.getLogger(__name__)

_client: MongoClient | None = None


class DatabaseError(Exception):
    """Raised when MongoDB is unavailable or misconfigured."""


def _resolve_db_name() -> str:
    if MONGO_DB_NAME:
        return MONGO_DB_NAME
    if not MONGO_URI:
        raise DatabaseError("MONGO_URI is not set. Add it to ml/.env or backend/.env")
    parsed = urlparse(MONGO_URI)
    path = (parsed.path or "").strip("/")
    if path:
        return path.split("/")[0]
    return "smart_attendance"


def get_client() -> MongoClient:
    global _client
    if _client is None:
        if not MONGO_URI:
            raise DatabaseError("MONGO_URI is not configured")
        try:
            _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
            _client.admin.command("ping")
            logger.info("Connected to MongoDB for ML training")
        except PyMongoError as exc:
            logger.error("MongoDB connection failed: %s", exc)
            raise DatabaseError(f"MongoDB connection failed: {exc}") from exc
    return _client


def get_db() -> Database:
    return get_client()[_resolve_db_name()]


def fetch_attendance_collections() -> dict[str, list[dict[str, Any]]]:
    """
    Load users, classes, sessions, and attendance records needed for feature engineering.
    """
    db = get_db()
    try:
        students = list(
            db[COL_USERS].find(
                {"role": "student"},
                {"_id": 1, "department": 1, "semester": 1, "section": 1, "rollNo": 1, "name": 1},
            )
        )
        classes = list(db[COL_CLASSES].find({}))
        sessions = list(
            db[COL_SESSIONS].find(
                {},
                {"_id": 1, "classId": 1, "createdAt": 1, "expiresAt": 1, "isActive": 1},
            )
        )
        records = list(
            db[COL_RECORDS].find(
                {},
                {"_id": 1, "sessionId": 1, "studentId": 1, "status": 1, "createdAt": 1},
            )
        )
    except PyMongoError as exc:
        logger.error("Failed to fetch attendance collections: %s", exc)
        raise DatabaseError(f"Failed to read attendance data: {exc}") from exc

    logger.info(
        "Fetched MongoDB data: %d students, %d classes, %d sessions, %d records",
        len(students),
        len(classes),
        len(sessions),
        len(records),
    )
    return {
        "students": students,
        "classes": classes,
        "sessions": sessions,
        "records": records,
    }


def count_attendance_records() -> int:
    try:
        return get_db()[COL_RECORDS].count_documents({})
    except PyMongoError as exc:
        logger.error("count_attendance_records failed: %s", exc)
        raise DatabaseError(str(exc)) from exc


def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
