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

    // Validate input
    if (!image) {
      console.warn("[mlController.registerFace] Missing image in request");
      return res.status(400).json({ message: "image is required" });
    }

    if (typeof image !== "string" || image.length === 0) {
      console.warn("[mlController.registerFace] Invalid image format");
      return res.status(400).json({ message: "image must be a non-empty base64 string" });
    }

    const student = await User.findOne({
      $or: [{ rollNo: studentId }, { _id: studentId }],
      role: "student",
    });
    if (!student) {
      console.warn("[mlController.registerFace] Student not found", { studentId });
      return res.status(404).json({ message: "Student not found" });
    }

    // Authorization: students can only register their own face
    if (String(student._id) !== String(req.user._id)) {
      console.warn("[mlController.registerFace] Unauthorized attempt", {
        userId: req.user._id,
        studentId: student._id,
      });
      return res.status(403).json({ message: "You can only register your own face" });
    }

    // Check if face ML service is configured and reachable
    if (!FACE_ML_SERVICE_URL || FACE_ML_SERVICE_URL.includes("localhost:5000")) {
      console.error("[mlController.registerFace] Face ML service misconfigured", {
        url: FACE_ML_SERVICE_URL,
      });
      return res.status(503).json({
        message:
          "Face recognition service not properly configured. Contact administrator.",
        code: "FACE_SERVICE_UNAVAILABLE",
      });
    }

    console.info("[mlController.registerFace] Calling face ML service", {
      studentId: student._id,
      serviceUrl: FACE_ML_SERVICE_URL,
      imageSize: image.length,
    });

    const mlResponse = await axios.post(
      `${FACE_ML_SERVICE_URL}/register_face`,
      { student_id: student.rollNo || String(student._id), image },
      { timeout: 30_000 }
    );

    console.info("[mlController.registerFace] Success", {
      studentId: student._id,
      response: mlResponse.data,
    });

    res.status(200).json({
      message: "Face registered successfully",
      data: mlResponse.data,
    });
  } catch (error) {
    // Detailed error logging
    if (error.code === "ECONNREFUSED") {
      console.error("[mlController.registerFace] Face ML service not running", {
        url: FACE_ML_SERVICE_URL,
        error: error.message,
      });
      return res.status(503).json({
        message: "Face recognition service is not running",
        code: "FACE_SERVICE_NOT_RUNNING",
      });
    }

    if (error.code === "ENOTFOUND" || error.code === "EHOSTUNREACH") {
      console.error("[mlController.registerFace] Face ML service unreachable", {
        url: FACE_ML_SERVICE_URL,
        error: error.message,
      });
      return res.status(503).json({
        message: "Face recognition service is unreachable",
        code: "FACE_SERVICE_UNREACHABLE",
      });
    }

    if (error.response?.status === 400) {
      const mlError = error.response.data?.error || "Face detection failed";
      console.warn("[mlController.registerFace] Face detection error", {
        studentId: req.user._id,
        error: mlError,
      });
      return res.status(400).json({
        message: mlError,
        code: "FACE_DETECTION_FAILED",
      });
    }

    if (error.response?.status === 404) {
      console.warn("[mlController.registerFace] Service endpoint not found", {
        endpoint: `${FACE_ML_SERVICE_URL}/register_face`,
      });
      return res.status(503).json({
        message: "Face registration endpoint not available on ML service",
        code: "ENDPOINT_NOT_FOUND",
      });
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      console.error("[mlController.registerFace] Timeout", {
        url: FACE_ML_SERVICE_URL,
        error: error.message,
      });
      return res.status(504).json({
        message: "Face recognition service timed out",
        code: "FACE_SERVICE_TIMEOUT",
      });
    }

    console.error("[mlController.registerFace] Unexpected error", {
      studentId: req.user._id,
      error: error.message,
      status: error.response?.status,
    });

    res.status(error.response?.status || 500).json({
      message: error.response?.data?.error || "Error registering face",
      code: "FACE_REGISTRATION_FAILED",
    });
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
