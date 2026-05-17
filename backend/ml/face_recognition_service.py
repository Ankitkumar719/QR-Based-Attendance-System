from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import os
import base64
import logging
from PIL import Image
import io
from pymongo import MongoClient
from urllib.parse import urlparse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes (for frontend access if needed)
CORS(app, origins=["*"])

# Directory to store face encodings
FACE_DATA_DIR = 'face_data'
if not os.path.exists(FACE_DATA_DIR):
    os.makedirs(FACE_DATA_DIR)
    logger.info(f"Created face data directory: {FACE_DATA_DIR}")

def _get_mongo_collection():
    """Return (collection, client) for users collection if MONGO_URI is set, else (None, None)."""
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    if not mongo_uri:
        return None, None

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=4000)
        parsed = urlparse(mongo_uri)
        db_name = (parsed.path or "").lstrip("/") or "smart_attendance"
        db = client[db_name]
        return db["users"], client
    except Exception as e:
        logger.error(f"Mongo connection init failed: {e}")
        return None, None

def load_known_faces():
    """Load all registered face encodings from disk."""
    known_face_encodings = []
    known_face_names = []

    # Prefer MongoDB (persists across redeploys); fallback to disk.
    users_col, client = _get_mongo_collection()
    if users_col is not None:
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
            logger.info(f"Loaded {len(known_face_encodings)} face encodings from MongoDB")
            return known_face_encodings, known_face_names
        except Exception as e:
            logger.error(f"Error loading face data from MongoDB: {e}")
        finally:
            try:
                client.close()
            except Exception:
                pass

    try:
        for filename in os.listdir(FACE_DATA_DIR):
            if filename.endswith('.npy'):
                name = filename[:-4]  # Remove .npy extension
                filepath = os.path.join(FACE_DATA_DIR, filename)
                try:
                    encoding = np.load(filepath)
                    known_face_encodings.append(encoding)
                    known_face_names.append(name)
                except Exception as e:
                    logger.error(f"Failed to load face encoding from {filename}: {e}")
        logger.info(f"Loaded {len(known_face_encodings)} face encodings")
    except Exception as e:
        logger.error(f"Error loading face data: {e}")
    return known_face_encodings, known_face_names

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    try:
        encodings, names = load_known_faces()
        return jsonify({
            'status': 'ok',
            'service': 'face-recognition',
            'registered_faces': len(names),
            'face_data_dir': os.path.abspath(FACE_DATA_DIR)
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'error',
            'service': 'face-recognition',
            'error': str(e)
        }), 500

@app.route('/register_face', methods=['POST'])
def register_face():
    """Register a face for a student. Expects base64 encoded JPEG image."""
    try:
        if not request.is_json:
            logger.warning("register_face: Content-Type is not application/json")
            return jsonify({'error': 'Content-Type must be application/json'}), 400

        data = request.json
        if not data:
            logger.warning("register_face: Empty request body")
            return jsonify({'error': 'Request body is empty'}), 400

        student_id = data.get('student_id')
        image_data = data.get('image')

        # Validate inputs
        if not student_id:
            logger.warning("register_face: Missing student_id")
            return jsonify({'error': 'Missing required field: student_id'}), 400

        if not image_data:
            logger.warning("register_face: Missing image")
            return jsonify({'error': 'Missing required field: image'}), 400

        if not isinstance(image_data, str) or len(image_data) == 0:
            logger.warning("register_face: Invalid image format")
            return jsonify({'error': 'image must be a non-empty base64 string'}), 400

        logger.info(f"[register_face] Registering face for student {student_id}")

        # Decode base64 image
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            image_np = np.array(image)
            logger.debug(f"[register_face] Image decoded. Shape: {image_np.shape}")
        except Exception as e:
            logger.error(f"[register_face] Failed to decode image: {e}")
            return jsonify({'error': f'Failed to decode image: {str(e)}'}), 400

        # Find face encodings
        try:
            face_encodings = face_recognition.face_encodings(image_np)
            logger.info(f"[register_face] Found {len(face_encodings)} faces in image")
        except Exception as e:
            logger.error(f"[register_face] Face detection failed: {e}")
            return jsonify({'error': f'Face detection failed: {str(e)}'}), 500

        if len(face_encodings) == 0:
            logger.warning(f"[register_face] No face found in image for student {student_id}")
            return jsonify({
                'error': 'No face detected in image. Please ensure your face is clearly visible in good lighting.'
            }), 400

        if len(face_encodings) > 1:
            logger.warning(f"[register_face] Multiple faces found for student {student_id}")
            return jsonify({
                'error': 'Multiple faces detected. Please ensure only your face is in the image.'
            }), 400

        encoding = face_encodings[0]
        descriptor = encoding.tolist()

        # Best-effort save to disk for local/dev backward-compatibility.
        disk_saved = False
        try:
            filepath = os.path.join(FACE_DATA_DIR, f'{student_id}.npy')
            np.save(filepath, encoding)
            disk_saved = True
            logger.info(f"[register_face] Face encoding saved to disk for student {student_id}")
        except Exception as e:
            logger.warning(f"[register_face] Disk save failed (continuing): {e}")

        return jsonify({
            'message': 'Face registered successfully',
            'student_id': student_id,
            'descriptor': descriptor,
            'disk_saved': disk_saved
        }), 200

    except Exception as e:
        logger.exception(f"[register_face] Unexpected error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    """Recognize a face in an image. Expects base64 encoded JPEG image."""
    try:
        if not request.is_json:
            logger.warning("recognize_face: Content-Type is not application/json")
            return jsonify({'error': 'Content-Type must be application/json'}), 400

        data = request.json
        if not data:
            logger.warning("recognize_face: Empty request body")
            return jsonify({'error': 'Request body is empty'}), 400

        image_data = data.get('image')

        if not image_data:
            logger.warning("recognize_face: Missing image")
            return jsonify({'error': 'Missing required field: image'}), 400

        logger.info("[recognize_face] Processing face recognition request")

        # Decode base64 image
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            image_np = np.array(image)
            logger.debug(f"[recognize_face] Image decoded. Shape: {image_np.shape}")
        except Exception as e:
            logger.error(f"[recognize_face] Failed to decode image: {e}")
            return jsonify({'error': f'Failed to decode image: {str(e)}'}), 400

        # Find face encodings in the image
        try:
            face_encodings = face_recognition.face_encodings(image_np)
            logger.info(f"[recognize_face] Found {len(face_encodings)} faces in image")
        except Exception as e:
            logger.error(f"[recognize_face] Face detection failed: {e}")
            return jsonify({'error': f'Face detection failed: {str(e)}'}), 500

        if len(face_encodings) == 0:
            logger.warning("[recognize_face] No face found in image")
            return jsonify({
                'error': 'No face detected in image. Please ensure your face is clearly visible.'
            }), 400

        # Load known faces
        known_encodings, known_names = load_known_faces()

        if not known_encodings:
            logger.warning("[recognize_face] No registered faces found")
            return jsonify({'error': 'No registered faces in database'}), 404

        # Compare faces
        try:
            matches = face_recognition.compare_faces(known_encodings, face_encodings[0], tolerance=0.6)
            face_distances = face_recognition.face_distance(known_encodings, face_encodings[0])
            logger.debug(f"[recognize_face] Comparison complete. Distances: {face_distances}")
        except Exception as e:
            logger.error(f"[recognize_face] Face comparison failed: {e}")
            return jsonify({'error': f'Face comparison failed: {str(e)}'}), 500

        # Find best match
        best_match_index = np.argmin(face_distances)
        best_distance = face_distances[best_match_index]
        confidence = 1 - best_distance

        logger.info(f"[recognize_face] Best match distance: {best_distance}, confidence: {confidence}")

        if matches[best_match_index] and confidence > 0.6:
            student_id = known_names[best_match_index]
            logger.info(f"[recognize_face] Face recognized as student {student_id} with confidence {confidence}")
            return jsonify({
                'student_id': student_id,
                'confidence': float(confidence)
            }), 200
        else:
            logger.warning(f"[recognize_face] Face not recognized with sufficient confidence (best: {confidence})")
            return jsonify({
                'error': 'Face not recognized with sufficient confidence',
                'confidence': float(confidence)
            }), 404

    except Exception as e:
        logger.exception(f"[recognize_face] Unexpected error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Starting Face Recognition Service...")
    logger.info(f"Face data directory: {os.path.abspath(FACE_DATA_DIR)}")
    port = int(os.getenv("PORT", "5001"))
    debug = os.getenv("FLASK_DEBUG", "").lower() in ("1", "true", "yes", "on")
    app.run(host='0.0.0.0', port=port, debug=debug)
