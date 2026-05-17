"""
Flask API for attendance shortage risk prediction and model retraining.

Run:
    python app.py
"""

from __future__ import annotations

import logging
from functools import wraps
import joblib
import pandas as pd
from flask import Flask, jsonify, request

from config import HOST, ML_TRAIN_SECRET, MODEL_PATH, PORT
from train_core import load_training_meta, run_training, should_auto_retrain

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
_model_bundle: dict | None = None


def load_model_bundle() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run: python train_model.py"
        )
    bundle = joblib.load(MODEL_PATH)
    if "model" not in bundle or "feature_columns" not in bundle:
        raise ValueError("Invalid model bundle")
    return bundle


def reload_model() -> bool:
    global _model_bundle
    try:
        _model_bundle = load_model_bundle()
        logger.info("Model reloaded from %s", MODEL_PATH)
        return True
    except Exception as exc:
        logger.error("Model reload failed: %s", exc)
        _model_bundle = None
        return False


def require_train_secret(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if ML_TRAIN_SECRET:
            provided = request.headers.get("X-ML-Train-Secret", "")
            if provided != ML_TRAIN_SECRET:
                return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)

    return decorated


def validate_predict_payload(data: dict) -> tuple[float, float]:
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object.")
    if "attendance_percentage" not in data:
        raise ValueError("Missing required field: attendance_percentage")
    if "absent_days" not in data:
        raise ValueError("Missing required field: absent_days")

    attendance_percentage = float(data["attendance_percentage"])
    absent_days = float(data["absent_days"])

    if not 0 <= attendance_percentage <= 100:
        raise ValueError("attendance_percentage must be between 0 and 100.")
    if absent_days < 0:
        raise ValueError("absent_days must be zero or positive.")

    return attendance_percentage, absent_days


@app.route("/health", methods=["GET"])
def health():
    meta = load_training_meta()
    model_loaded = _model_bundle is not None
    return jsonify(
        {
            "status": "ok" if model_loaded else "degraded",
            "service": "attendance-shortage-predictor",
            "model_loaded": model_loaded,
            "model_path": str(MODEL_PATH),
            "data_source": meta.get("data_source", "unknown"),
            "last_trained_at": meta.get("trained_at"),
        }
    ), 200 if model_loaded else 503


@app.route("/training/status", methods=["GET"])
def training_status():
    meta = load_training_meta()
    should_train, reason = should_auto_retrain(meta)
    return jsonify(
        {
            "meta": meta,
            "auto_retrain_recommended": should_train,
            "auto_retrain_reason": reason,
            "model_exists": MODEL_PATH.exists(),
        }
    )


@app.route("/train", methods=["POST"])
@require_train_secret
def train_endpoint():
    """
    Retrain from MongoDB.
    Body (optional): { "force": true, "auto": false }
    """
    body = request.get_json(silent=True) or {}
    force = bool(body.get("force", True))
    auto = bool(body.get("auto", False))

    logger.info("Train requested force=%s auto=%s", force, auto)
    result = run_training(force=force, auto=auto)

    if result.get("trained"):
        reload_model()
        return jsonify(result), 200

    status = 400 if result.get("error") else 200
    return jsonify(result), status


@app.route("/predict", methods=["POST"])
def predict():
    if _model_bundle is None:
        return jsonify({"error": "Model not loaded. Train the model first."}), 503

    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    try:
        attendance_percentage, absent_days = validate_predict_payload(request.get_json())
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    try:
        model = _model_bundle["model"]
        features = pd.DataFrame(
            [[attendance_percentage, absent_days]],
            columns=_model_bundle["feature_columns"],
        )
        prediction = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        prob_high = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])

        return jsonify(
            {
                "shortage_risk": prediction,
                "shortage_risk_label": "high" if prediction == 1 else "low",
                "probability_high_risk": round(prob_high, 4),
                "attendance_percentage": attendance_percentage,
                "absent_days": absent_days,
            }
        ), 200
    except Exception as exc:
        logger.exception("Prediction failed: %s", exc)
        return jsonify({"error": "Internal prediction error"}), 500


def create_app() -> Flask:
    global _model_bundle
    try:
        _model_bundle = load_model_bundle()
        logger.info("Model loaded from %s", MODEL_PATH)
    except Exception as exc:
        logger.error("Startup model load failed: %s", exc)
        _model_bundle = None

    # Optional auto-retrain on startup when enough new data
    try:
        auto_result = run_training(force=False, auto=True)
        if auto_result.get("trained"):
            reload_model()
            logger.info("Auto-retrain on startup: %s", auto_result.get("message"))
        elif auto_result.get("skipped"):
            logger.info("Auto-retrain skipped: %s", auto_result.get("reason"))
    except Exception as exc:
        logger.warning("Auto-retrain check failed: %s", exc)

    return app


if __name__ == "__main__":
    create_app()
    app.run(host=HOST, port=PORT, debug=False)
