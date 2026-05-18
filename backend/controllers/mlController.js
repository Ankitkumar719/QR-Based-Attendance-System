import axios from "axios";
import { User } from "../models/User.js";
import { FaceVerification } from "../models/FaceVerification.js";
import { FaceRegistrationLog } from "../models/FaceRegistrationLog.js";
import { env } from "../config/env.js";
import { runFaceWorker, assertNoExternalFaceService } from "../utils/facePythonClient.js";
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
const FACE_ML_TIMEOUT_MS = env.FACE_ML_TIMEOUT_MS || 30_000;

const isLocalhostUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryFaceMlError = (error) => {
  if (!error) return false;
  if (
    error.code === "ECONNRESET" ||
    error.code === "EAI_AGAIN" ||
    error.code === "ENETUNREACH" ||
    error.code === "EHOSTUNREACH" ||
    error.code === "ECONNREFUSED" ||
    error.code === "ENOTFOUND" ||
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT"
  ) {
    return true;
  }
  const status = error.response?.status;
  if ([502, 503, 504].includes(status)) return true;
  return false;
};

const postToFaceMlWithRetry = async (url, body, { timeoutMs, maxAttempts = 3 } = {}) => {
  const attempts = Math.max(1, Number(maxAttempts) || 1);
  const timeout = Number(timeoutMs) || FACE_ML_TIMEOUT_MS;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await axios.post(url, body, { timeout });
    } catch (error) {
      lastError = error;
      const retryable = shouldRetryFaceMlError(error);
      if (!retryable || attempt === attempts) throw error;
      const backoffMs = 250 * Math.pow(2, attempt - 1);
      console.warn("[faceMlClient] retrying request", {
        attempt,
        attempts,
        backoffMs,
        url,
        code: error.code,
        status: error.response?.status,
        message: error.message,
      });
      await sleep(backoffMs);
    }
  }

  throw lastError;
};

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

    if (student.face?.disabled) {
      console.warn("[mlController.registerFace] Face registration disabled for student", {
        studentId: student._id,
        disabledAt: student.face?.disabledAt,
      });
      return res.status(403).json({
        message: "Face registration is disabled for this account. Contact administrator.",
        code: "FACE_REGISTRATION_DISABLED",
      });
    }

    assertNoExternalFaceService();

    console.info("[mlController.registerFace] Running local face worker", {
      studentId: student._id,
      imageSize: image.length,
    });

    const workerOut = await runFaceWorker(
      { action: "register", image },
      { timeoutMs: FACE_ML_TIMEOUT_MS }
    );

    if (!workerOut.ok) {
      const status = workerOut.status || 500;
      return res.status(status).json({
        message: workerOut.error || "Face registration failed",
        code: status === 400 ? "FACE_DETECTION_FAILED" : "FACE_SERVICE_UNAVAILABLE",
      });
    }

    const descriptor = workerOut.descriptor;

    if (!Array.isArray(descriptor) || descriptor.length < 64) {
      console.error("[mlController.registerFace] Face worker did not return a descriptor", {
        keys: Object.keys(workerOut || {}),
        type: typeof descriptor,
        length: Array.isArray(descriptor) ? descriptor.length : undefined,
      });
      return res.status(502).json({
        message: "Face service did not return a face descriptor",
        code: "FACE_DESCRIPTOR_MISSING",
      });
    }

    const now = new Date();
    const isUpdate = Array.isArray(student.face?.descriptor) && student.face.descriptor.length > 0;

    student.face = {
      descriptor,
      registeredAt: student.face?.registeredAt || now,
      updatedAt: now,
      disabled: false,
      disabledAt: undefined,
      disabledReason: undefined,
    };
    try {
      await student.save();
    } catch (dbErr) {
      console.error("[mlController.registerFace] Failed saving face descriptor to MongoDB", {
        studentId: student._id,
        error: dbErr.message,
      });
      return res.status(500).json({
        message: "Failed to save face registration",
        code: "FACE_DB_SAVE_FAILED",
      });
    }

    await FaceRegistrationLog.create({
      action: isUpdate ? "update" : "register",
      student: student._id,
      actor: req.user?._id,
      actorRole: req.user?.role,
      success: true,
      message: isUpdate ? "Face updated" : "Face registered",
      meta: {
        descriptorLength: descriptor.length,
      },
    });

    console.info("[mlController.registerFace] Success", {
      studentId: student._id,
      descriptorLength: descriptor.length,
    });

    res.status(200).json({
      message: isUpdate ? "Face updated successfully" : "Face registered successfully",
      face: {
        registeredAt: student.face?.registeredAt,
        updatedAt: student.face?.updatedAt,
      },
    });
  } catch (error) {
    // Detailed error logging
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

    if (error.code === "FACE_WORKER_TIMEOUT") {
      return res.status(504).json({
        message: "Face recognition timed out",
        code: "FACE_SERVICE_TIMEOUT",
      });
    }

    if (error.code === "FACE_PYTHON_NOT_FOUND") {
      console.error("[mlController.registerFace] Python not available for face worker", {
        stderr: error.stderr,
        exitCode: error.exitCode,
      });
      return res.status(503).json({
        message:
          "Face recognition runtime is not available on the server. Ensure Python is installed in the deployment (Docker recommended).",
        code: "FACE_PYTHON_NOT_AVAILABLE",
      });
    }

    if (error.code === "FACE_PYTHON_DEPS_MISSING") {
      console.error("[mlController.registerFace] Python face-recognition deps missing", {
        stderr: error.stderr,
        exitCode: error.exitCode,
      });
      return res.status(503).json({
        message:
          "Face recognition dependencies are missing on the server. Ensure the deployment installs `face-recognition` (Docker recommended).",
        code: "FACE_PYTHON_DEPS_MISSING",
      });
    }

    console.error("[mlController.registerFace] Unexpected error", {
      studentId: req.user._id,
      error: error.message,
      status: error.response?.status,
      response: error.response?.data,
      stderr: error.stderr,
      stdout: error.stdout,
    });

    try {
      await FaceRegistrationLog.create({
        action: "register",
        student: req.user?._id,
        actor: req.user?._id,
        actorRole: req.user?.role,
        success: false,
        message: error.message,
        meta: {
          code: error.code,
          status: error.response?.status,
        },
      });
    } catch (e) {
      // ignore logging failures
    }

    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Error registering face",
      code: error.code || "FACE_REGISTRATION_FAILED",
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

    assertNoExternalFaceService();

    const out = await runFaceWorker(
      { action: "recognize", image, tolerance: 0.6 },
      { timeoutMs: FACE_ML_TIMEOUT_MS }
    );

    if (!out || typeof out !== "object") {
      console.error("verifyFace: invalid face worker response", { out });
      return res.status(500).json({ message: "Face recognition service returned invalid response", code: "FACE_SERVICE_ERROR" });
    }

    if (!out.ok) {
      const status = out.status || 500;
      if (status === 400) {
        return res.status(400).json({ message: out.error || "Face detection failed", code: "FACE_DETECTION_FAILED" });
      }
      if (status === 404) {
        return res.status(404).json({ message: out.error || "Face not recognized", verified: false });
      }
      return res.status(503).json({ message: out.error || "Face recognition service unavailable", code: "FACE_SERVICE_UNAVAILABLE" });
    }

    const { student_id, confidence } = out;
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
    console.error("[mlController.verifyFace] error", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      response: error.response?.data,
    });

    if (error.code === "FACE_WORKER_TIMEOUT") {
      return res.status(504).json({
        message: "Face recognition service timed out",
        code: "FACE_SERVICE_TIMEOUT",
      });
    }

    return res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Face verification failed",
      code: "FACE_VERIFICATION_FAILED",
    });
  }
};

export const faceServiceHealth = async (req, res) => {
  try {
    const out = await runFaceWorker({ action: "health" }, { timeoutMs: 5_000 });
    return res.status(200).json({
      ok: true,
      mode: "local-python",
      pythonBin: process.env.FACE_PYTHON_BIN || "python3",
      workerPath: process.env.FACE_PYTHON_WORKER || "backend/ml/face_worker.py",
      mongoConfigured: Boolean(out.mongoConfigured),
      registeredCount: out.registeredCount ?? null,
    });
  } catch (error) {
    console.error("[mlController.faceServiceHealth] error", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      response: error.response?.data,
    });
    return res.status(503).json({
      ok: false,
      message: "Face recognition service health check failed",
      code: "FACE_SERVICE_UNREACHABLE",
    });
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
