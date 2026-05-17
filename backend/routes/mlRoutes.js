import express from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import {
  registerFace,
  recognizeFace,
  verifyFace,
  faceServiceHealth,
  predictShortage,
} from "../controllers/mlController.js";

const router = express.Router();

router.post("/register-face", authMiddleware, requireRole("student"), registerFace);
router.post("/verify-face", authMiddleware, requireRole("student"), verifyFace);
router.post("/recognize-face", recognizeFace);
router.get("/face-service/health", faceServiceHealth);

// Attendance shortage risk (Flask ML proxy — authenticated)
router.post(
  "/predict-shortage",
  authMiddleware,
  requireRole("student", "faculty", "admin"),
  predictShortage
);

export default router;
