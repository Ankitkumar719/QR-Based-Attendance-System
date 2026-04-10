import express from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listClasses,
  createClass,
  promoteStudents,
  getPromotionPreview,
  graduateStudents,
  getTimetable,
  addTimetableSlot,
  deleteTimetableSlot,
  getFacultySchedule,
  addFacultyScheduleSlot,
  deleteFacultyScheduleSlot,
  saveFacultySchedule,
  listSections,
  createSection,
  updateSection,
  deleteSection,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  // Two-step student creation (ADD-ONLY)
  createStudentBasic,
  assignAcademicDetails,
  listUnassignedStudents
} from "../controllers/adminController.js";
import { report, exportCsv } from "../controllers/analyticsController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

router.get("/users", listUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.post("/users/delete", deleteUser);

// Two-step student creation routes (ADD-ONLY)
// Step 1: Create student with basic identity only
router.post("/students/create-basic", createStudentBasic);
// Step 2: Assign academic details (department, semester, section)
router.post("/students/assign-academic", assignAcademicDetails);
// Helper: List students without academic assignment
router.get("/students/unassigned", listUnassignedStudents);

router.get("/classes", listClasses);
router.post("/classes", createClass);

// Department management
router.get("/departments", listDepartments);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

// Section management
router.get("/sections", listSections);
router.post("/sections", createSection);
router.put("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

// Course management
router.get("/courses", listCourses);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// Timetable management (class-based)
router.get("/timetable", getTimetable);
router.post("/timetable/slot", addTimetableSlot);
router.post("/timetable/slot/delete", deleteTimetableSlot);

// Faculty schedule management (faculty-based)
router.get("/faculty-schedule", getFacultySchedule);
router.post("/faculty-schedule/slot", addFacultyScheduleSlot);
router.post("/faculty-schedule/slot/delete", deleteFacultyScheduleSlot);
router.post("/faculty-schedule/save", saveFacultySchedule);

// Semester promotion routes
router.get("/promote/preview", getPromotionPreview);
router.post("/promote", promoteStudents);
router.post("/graduate", graduateStudents);

// Admin analytics shortcuts
router.get("/analytics/report", report);
router.get("/analytics/export", exportCsv);

export default router;
