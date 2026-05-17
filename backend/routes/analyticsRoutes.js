import express from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import { report, exportCsv, studentAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin", "faculty", "student"));

router.get("/report", report); // GET /analytics/report
router.get("/export", exportCsv); // GET /analytics/export
router.get("/student", studentAnalytics); // GET /analytics/student

export default router;
