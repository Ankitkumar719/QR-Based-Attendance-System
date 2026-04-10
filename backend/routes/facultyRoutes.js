import express from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import { 
  myClasses, 
  startSession, 
  classSessions,
  getMyTimetable,
  getMySchedule,
  getCurrentClass,
  autoStartSession,
  getClassStudents,
  saveAttendance,
  endSession,
  // Manual attendance (ADD-ONLY)
  manualMarkAttendance,
  getSessionStudents
} from "../controllers/facultyController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("faculty"));

router.get("/classes", myClasses);
router.get("/timetable", getMyTimetable);
router.get("/my-schedule", getMySchedule);
router.get("/current-class", getCurrentClass);
router.post("/start-session", startSession);
router.post("/auto-session", autoStartSession);
router.post("/end-session/:sessionId", endSession);
router.post("/save-attendance", saveAttendance);
router.get("/class/:classId/sessions", classSessions);

// Attendance report for a class and date
import { getAttendanceReport } from "../controllers/facultyController.js";
router.get("/class/:classId/attendance-report", getAttendanceReport);
router.get("/class/:classId/students", getClassStudents);

// Manual attendance routes (ADD-ONLY - fallback for QR issues)
router.post("/manual-attendance", manualMarkAttendance);
router.get("/session/:sessionId/students", getSessionStudents);

export default router;
