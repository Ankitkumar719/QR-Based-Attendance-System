from flask import Flask, request, jsonify
import face_recognition
import numpy as np
import os
import base64
from PIL import Image
import io

app = Flask(__name__)

# Directory to store face encodings
FACE_DATA_DIR = 'face_data'
if not os.path.exists(FACE_DATA_DIR):
    os.makedirs(FACE_DATA_DIR)

def load_known_faces():
    known_face_encodings = []
    known_face_names = []
    for filename in os.listdir(FACE_DATA_DIR):
        if filename.endswith('.npy'):
            name = filename[:-4]  # Remove .npy extension
            encoding = np.load(os.path.join(FACE_DATA_DIR, filename))
            known_face_encodings.append(encoding)
            known_face_names.append(name)
    return known_face_encodings, known_face_names

@app.route('/register_face', methods=['POST'])
def register_face():
    data = request.json
    student_id = data['student_id']
    image_data = data['image']  # Base64 encoded image

    # Decode base64 image
    image = Image.open(io.BytesIO(base64.b64decode(image_data)))
    image_np = np.array(image)

    # Find face encodings
    face_encodings = face_recognition.face_encodings(image_np)
    if len(face_encodings) == 0:
        return jsonify({'error': 'No face found in image'}), 400

    # Save the first face encoding
    encoding = face_encodings[0]
    np.save(os.path.join(FACE_DATA_DIR, f'{student_id}.npy'), encoding)

    return jsonify({'message': 'Face registered successfully'})

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    data = request.json
    image_data = data['image']  # Base64 encoded image

    # Decode base64 image
    image = Image.open(io.BytesIO(base64.b64decode(image_data)))
    image_np = np.array(image)

    # Find face encodings in the image
    face_encodings = face_recognition.face_encodings(image_np)
    if len(face_encodings) == 0:
        return jsonify({'error': 'No face found in image'}), 400

    # Load known faces
    known_encodings, known_names = load_known_faces()

    if not known_encodings:
        return jsonify({'error': 'No registered faces'}), 400

    # Compare faces
    matches = face_recognition.compare_faces(known_encodings, face_encodings[0])
    face_distances = face_recognition.face_distance(known_encodings, face_encodings[0])

    best_match_index = np.argmin(face_distances)
    if matches[best_match_index]:
        student_id = known_names[best_match_index]
        return jsonify({'student_id': student_id, 'confidence': 1 - face_distances[best_match_index]})
    else:
        return jsonify({'error': 'Face not recognized'}), 404

if __name__ == '__main__':
    app.run(port=5000, debug=True)