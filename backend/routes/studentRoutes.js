import express from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import { myClasses, studentDashboard, markAttendance, getProfile, getTimetable, getAttendance, getActiveSessions, getTodayAttendance } from "../controllers/studentController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("student"));

router.get("/classes", myClasses);
router.get("/dashboard", studentDashboard); // GET /student/dashboard
router.post("/mark-attendance", markAttendance); // POST /student/mark-attendance
router.get("/profile", getProfile); // GET /student/profile
router.get("/timetable", getTimetable); // GET /student/timetable
router.get("/attendance", getAttendance); // GET /student/attendance
router.get("/active-sessions", getActiveSessions); // GET /student/active-sessions
router.get("/today-attendance", getTodayAttendance); // GET /student/today-attendance - Verify today's attendance

export default router;
