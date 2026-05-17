import axios from "axios";
import { User } from "../models/User.js";
import { FaceVerification } from "../models/FaceVerification.js";
import { env } from "../config/env.js";
import {
  validateShortagePayload,
  requestShortagePrediction,
  mapMlClientError,
  ValidationError,
} from "../utils/mlPredictClient.js";

// ---------------------------------------------------------------------------
// Face recognition ML (backend/ml/face_recognition_service.py)
// Separate service — do not confuse with shortage prediction on port 8000
// ---------------------------------------------------------------------------
const FACE_ML_SERVICE_URL = env.FACE_ML_SERVICE_URL;

export const registerFace = async (req, res) => {
  try {
    const { studentId, image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "image is required" });
    }

    const student = await User.findOne({
      $or: [{ rollNo: studentId }, { _id: studentId }],
      role: "student",
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (String(student._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only register your own face" });
    }

    await axios.post(
      `${FACE_ML_SERVICE_URL}/register_face`,
      { student_id: student.rollNo || String(student._id), image },
      { timeout: 30_000 }
    );

    res.status(200).json({ message: "Face registered successfully" });
  } catch (error) {
    console.error("[mlController.registerFace]", error.message);
    res.status(500).json({ message: "Error registering face" });
  }
};

/**
 * Step 1 of dual verification — verify live face only (does NOT mark attendance).
 * Returns a short-lived faceVerificationToken for use with POST /api/student/mark-attendance.
 */
export const verifyFace = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: "image is required" });
    }

    const response = await axios.post(
      `${FACE_ML_SERVICE_URL}/recognize_face`,
      { image },
      { timeout: 30_000 }
    );

    const { student_id, confidence } = response.data;
    const CONFIDENCE_THRESHOLD = 0.6;

    if (confidence < CONFIDENCE_THRESHOLD) {
      return res.status(400).json({
        message: "Face not recognized with sufficient confidence",
        verified: false,
      });
    }

    const authenticatedStudent = req.user;
    const recognizedRoll = String(student_id || "").trim();
    const userRoll = String(authenticatedStudent.rollNo || "").trim();
    const userId = String(authenticatedStudent._id);

    const identityMatch =
      (userRoll && recognizedRoll === userRoll) ||
      recognizedRoll === userId;

    if (!identityMatch) {
      console.warn("[mlController.verifyFace] face mismatch", {
        userId,
        recognizedRoll,
      });
      return res.status(403).json({
        message: "Face does not match the logged-in student account",
        verified: false,
      });
    }

    const { token, expiresAt } = await FaceVerification.createForStudent(
      authenticatedStudent._id,
      confidence
    );

    console.info("[mlController.verifyFace] success", {
      studentId: authenticatedStudent._id,
      confidence,
    });

    res.status(200).json({
      verified: true,
      faceVerificationToken: token,
      expiresAt,
      confidence,
      message: "Face verified. Scan the faculty QR code to complete attendance.",
    });
  } catch (error) {
    console.error("[mlController.verifyFace]", error.message);
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({ message: "Face recognition service unavailable" });
    }
    res.status(500).json({ message: "Face verification failed" });
  }
};

/** @deprecated Use verifyFace + mark-attendance dual flow. Does not mark attendance. */
export const recognizeFace = async (req, res) => {
  return res.status(400).json({
    message:
      "Direct face-only attendance is disabled. Use POST /api/ml/verify-face then mark attendance with QR.",
    code: "DUAL_VERIFICATION_REQUIRED",
  });
};

// ---------------------------------------------------------------------------
// Attendance shortage risk prediction (Flask /ml on port 8000)
// POST /api/ml/predict-shortage
// ---------------------------------------------------------------------------
export const predictShortage = async (req, res) => {
  try {
    const payload = validateShortagePayload(req.body);

    console.info("[mlController.predictShortage] Forwarding to ML service", {
      url: env.ML_PREDICT_URL,
      attendance_percentage: payload.attendance_percentage,
      absent_days: payload.absent_days,
    });

    const prediction = await requestShortagePrediction(payload);

    return res.status(200).json({
      success: true,
      ...prediction,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.warn("[mlController.predictShortage] Validation failed:", error.message);
      return res.status(400).json({ success: false, message: error.message });
    }

    const mapped = mapMlClientError(error);
    console.error("[mlController.predictShortage]", mapped.message, error.code || "");

    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
      ...(mapped.details ? { details: mapped.details } : {}),
    });
  }
};
