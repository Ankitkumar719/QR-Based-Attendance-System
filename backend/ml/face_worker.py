import base64
import io
import json
import logging
import os
import sys
from urllib.parse import urlparse

import face_recognition
import numpy as np
from PIL import Image
from pymongo import MongoClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("face_worker")


def _read_input() -> dict:
    raw = sys.stdin.read()
    if not raw:
        raise ValueError("Empty stdin")
    return json.loads(raw)


def _write_output(payload: dict, exit_code: int = 0) -> None:
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()
    raise SystemExit(exit_code)


def _decode_base64_jpeg(image_b64: str) -> np.ndarray:
    try:
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes))
        return np.array(image)
    except Exception as e:
        raise ValueError(f"Failed to decode image: {e}")


def _get_mongo_users_collection():
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    if not mongo_uri:
        return None, None

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=4000)
    parsed = urlparse(mongo_uri)
    db_name = (parsed.path or "").lstrip("/") or "smart_attendance"
    db = client[db_name]
    return db["users"], client


def _load_known_faces_from_mongo():
    users_col, client = _get_mongo_users_collection()
    if users_col is None:
        return [], [], None

    known_face_encodings = []
    known_face_names = []
    try:
        cursor = users_col.find(
            {"face.descriptor": {"$exists": True}, "face.disabled": {"$ne": True}},
            {"rollNo": 1, "face.descriptor": 1},
        )
        for doc in cursor:
            descriptor = doc.get("face", {}).get("descriptor")
            if isinstance(descriptor, list) and len(descriptor) > 0:
                known_face_encodings.append(np.array(descriptor, dtype=np.float64))
                known_face_names.append(str(doc.get("rollNo") or doc.get("_id")))
        return known_face_encodings, known_face_names, client
    except Exception as e:
        try:
            client.close()
        except Exception:
            pass
        raise RuntimeError(f"Failed loading known faces from MongoDB: {e}")


def register_face(image_b64: str):
    try:
        image_np = _decode_base64_jpeg(image_b64)
    except ValueError as e:
        return {"ok": False, "error": str(e)}, 400
    face_encodings = face_recognition.face_encodings(image_np)

    if len(face_encodings) == 0:
        return {"ok": False, "error": "No face detected in image"}, 400
    if len(face_encodings) > 1:
        return {"ok": False, "error": "Multiple faces detected in image"}, 400

    descriptor = face_encodings[0].tolist()
    return {"ok": True, "descriptor": descriptor}, 200


def recognize_face(image_b64: str, tolerance: float = 0.6):
    try:
        image_np = _decode_base64_jpeg(image_b64)
    except ValueError as e:
        return {"ok": False, "error": str(e)}, 400
    face_encodings = face_recognition.face_encodings(image_np)

    if len(face_encodings) == 0:
        return {"ok": False, "error": "No face detected in image"}, 400

    known_encodings, known_names, client = _load_known_faces_from_mongo()
    try:
        if not known_encodings:
            return {"ok": False, "error": "No registered faces in database"}, 404

        matches = face_recognition.compare_faces(
            known_encodings, face_encodings[0], tolerance=tolerance
        )
        face_distances = face_recognition.face_distance(known_encodings, face_encodings[0])

        best_match_index = int(np.argmin(face_distances))
        best_distance = float(face_distances[best_match_index])
        confidence = float(1 - best_distance)

        if matches[best_match_index] and confidence > 0.6:
            student_id = known_names[best_match_index]
            return {"ok": True, "student_id": student_id, "confidence": confidence}, 200

        return {"ok": False, "error": "Face not recognized with sufficient confidence", "confidence": confidence}, 404
    finally:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass


def main():
    try:
        payload = _read_input()
        action = payload.get("action")

        if not action:
            _write_output({"ok": False, "error": "Missing action"}, 2)

        if action == "health":
            users_col, client = _get_mongo_users_collection()
            try:
                count = None
                if users_col is not None:
                    try:
                        count = users_col.count_documents({"face.descriptor": {"$exists": True}})
                    except Exception:
                        count = None
                _write_output(
                    {
                        "ok": True,
                        "status": 200,
                        "mongoConfigured": users_col is not None,
                        "registeredCount": count,
                    },
                    0,
                )
            finally:
                if client is not None:
                    try:
                        client.close()
                    except Exception:
                        pass

        image = payload.get("image")
        if not image or not isinstance(image, str):
            _write_output({"ok": False, "error": "Missing image"}, 2)

        if action == "register":
            out, status = register_face(image)
            _write_output({**out, "status": status}, 0 if status < 500 else 1)

        if action == "recognize":
            tolerance = float(payload.get("tolerance", 0.6))
            out, status = recognize_face(image, tolerance=tolerance)
            _write_output({**out, "status": status}, 0 if status < 500 else 1)

        _write_output({"ok": False, "error": f"Unknown action: {action}"}, 2)
    except SystemExit:
        raise
    except Exception as e:
        logger.exception("Unhandled error")
        _write_output({"ok": False, "error": str(e), "status": 500}, 1)


if __name__ == "__main__":
    main()
