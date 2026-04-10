import express from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import { report, exportCsv } from "../controllers/analyticsController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin", "faculty"));

router.get("/report", report); // GET /analytics/report
router.get("/export", exportCsv); // GET /analytics/export

export default router;
