import mongoose from "mongoose";
import { Class } from "../models/Class.js";
import { AttendanceSession } from "../models/AttendanceSession.js";
import { AttendanceRecord } from "../models/AttendanceRecord.js";
import { sendLowAttendanceEmail } from "../utils/mailer.js";

export const myClasses = async (req, res, next) => {
  try {
    const { department, semester, section } = req.user;
    const classes = await Class.find({ department, semester, section });
    res.json(classes);
  } catch (err) {
    next(err);
  }
};

// GET /student/dashboard
export const studentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const records = await AttendanceRecord.find({ studentId })
      .populate({
        path: "sessionId",
        populate: { path: "classId" }
      })
      .lean();

    if (!records.length) {
      return res.json({
        overallPercentage: 0,
        subjects: [],
        lowestSubject: null
      });
    }

    const perClass = new Map();
    for (const rec of records) {
      const cls = rec.sessionId.classId;
      if (!cls) continue;
      const key = cls._id.toString();
      if (!perClass.has(key)) {
        perClass.set(key, {
          class: {
            id: cls._id,
            courseCode: cls.courseCode,
            courseName: cls.courseName
          },
          total: 0,
          present: 0
        });
      }
      const agg = perClass.get(key);
      agg.total += 1;
      if (rec.status === "present") agg.present += 1;
    }

    let totalOverall = 0;
    let totalPresentOverall = 0;
    const subjects = [];
    for (const { class: cls, total, present } of perClass.values()) {
      totalOverall += total;
      totalPresentOverall += present;
      const percentage = total ? Math.round((present / total) * 100) : 0;
      subjects.push({
        class: cls,
        total,
        present,
        percentage
      });
    }

    const overallPercentage = totalOverall
      ? Math.round((totalPresentOverall / totalOverall) * 100)
      : 0;

    let lowestSubject = null;
    for (const s of subjects) {
      if (!lowestSubject || s.percentage < lowestSubject.percentage) {
        lowestSubject = s;
      }
    }

    // Send low attendance email if overall < 75 (basic implementation)
    if (overallPercentage < 75 && req.user.email) {
      try {
        await sendLowAttendanceEmail(req.user.email, overallPercentage);
      } catch (e) {
        // log and ignore email errors
        console.error("Failed to send low attendance email", e.message);
      }
    }

    res.json({ overallPercentage, subjects, lowestSubject });
  } catch (err) {
    next(err);
  }
};

// POST /student/mark-attendance
export const markAttendance = async (req, res, next) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({ message: "qrToken is required" });
    }

    const now = new Date();
    const session = await AttendanceSession.findOne({
      qrToken,
      isActive: true,
      expiresAt: { $gt: now }
    });

    if (!session) {
      return res.status(400).json({ message: "Invalid or expired session" });
    }

    // Prevent duplicate attendance
    try {
      const record = await AttendanceRecord.create({
        sessionId: session._id,
        studentId: req.user._id,
        status: "present"
      });

      const io = req.app.get("io");
      if (io) {
        io.to(`class:${session.classId}`).emit("attendance-updated", {
          sessionId: session._id,
          studentId: req.user._id
        });
      }

      res.status(201).json(record);
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ message: "Attendance already marked" });
      }
      throw e;
    }
  } catch (err) {
    next(err);
  }
};

// GET /student/profile
export const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      name: user.name,
      email: user.email,
      studentId: user._id,
      branch: user.department,
      semester: user.semester,
      section: user.section
    });
  } catch (err) {
    next(err);
  }
};

// GET /student/timetable
export const getTimetable = async (req, res, next) => {
  try {
    const { department, semester, section } = req.user;
    
    // Import TimeTable model
    const { TimeTable } = await import("../models/TimeTable.js");
    
    // Fetch timetable for student's department, semester, and section
    const timetable = await TimeTable.findOne({ 
      department, 
      semester: String(semester), 
      section 
    });
    
    if (!timetable) {
      return res.json([]);
    }
    
    // Transform timetable data for frontend
    // Collect all unique time slots across all days
    const timeSlots = new Map();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    days.forEach(day => {
      const daySchedule = timetable.schedule[day] || [];
      daySchedule.forEach(slot => {
        const timeKey = `${slot.startTime} - ${slot.endTime}`;
        if (!timeSlots.has(timeKey)) {
          timeSlots.set(timeKey, {
            time: timeKey,
            startTime: slot.startTime,
            monday: null,
            tuesday: null,
            wednesday: null,
            thursday: null,
            friday: null,
            saturday: null
          });
        }
        timeSlots.get(timeKey)[day] = {
          course: `${slot.courseCode || ''} ${slot.courseName || ''}`.trim(),
          courseCode: slot.courseCode,
          courseName: slot.courseName,
          room: slot.room,
          classId: slot.classId
        };
      });
    });
    
    // Sort by start time and convert to array
    const result = Array.from(timeSlots.values()).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /student/active-sessions - Get active attendance sessions for student's class
export const getActiveSessions = async (req, res, next) => {
  try {
    const { department, semester, section } = req.user;
    const now = new Date();

    // Find classes for this student
    const classes = await Class.find({ department, semester, section });
    const classIds = classes.map(c => c._id);

    // Find active sessions for these classes
    const sessions = await AttendanceSession.find({
      classId: { $in: classIds },
      isActive: true,
      expiresAt: { $gt: now }
    }).populate("classId");

    // Check which sessions the student has already marked attendance for
    const sessionIds = sessions.map(s => s._id);
    const markedRecords = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
      studentId: req.user._id
    });
    const markedSessionIds = new Set(markedRecords.map(r => r.sessionId.toString()));

    const result = sessions.map(session => ({
      sessionId: session._id,
      classId: session.classId._id,
      courseCode: session.classId.courseCode,
      courseName: session.classId.courseName,
      qrToken: session.qrToken,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      alreadyMarked: markedSessionIds.has(session._id.toString())
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /student/attendance?date=YYYY-MM-DD
export const getAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { department, semester, section } = req.user;
    
    // Find classes for this student
    const classes = await Class.find({ department, semester, section });
    const classIds = classes.map(c => c._id);

    // Find sessions for these classes on the given date
    const sessions = await AttendanceSession.find({
      classId: { $in: classIds },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate("classId");

    const results = [];
    for (const session of sessions) {
      const record = await AttendanceRecord.findOne({
        sessionId: session._id,
        studentId: req.user._id
      });

      results.push({
        subject: session.classId.courseName,
        status: record ? "Present" : "Absent"
      });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// GET /student/today-attendance - Get today's attendance with verification details
export const getTodayAttendance = async (req, res, next) => {
  try {
    const { department, semester, section } = req.user;
    
    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all classes for this student
    const classes = await Class.find({ department, semester, section });
    const classIds = classes.map(c => c._id);

    // Find all sessions for today
    const sessions = await AttendanceSession.find({
      classId: { $in: classIds },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate("classId").sort({ createdAt: -1 });

    const results = [];
    
    for (const session of sessions) {
      const record = await AttendanceRecord.findOne({
        sessionId: session._id,
        studentId: req.user._id
      });

      results.push({
        sessionId: session._id,
        courseCode: session.classId.courseCode,
        courseName: session.classId.courseName,
        sessionStartedAt: session.createdAt,
        isActive: session.isActive && session.expiresAt > now,
        status: record ? record.status : 'absent',
        markedAt: record ? record.markedAt || record.createdAt : null,
        verificationCode: record ? `${session._id.toString().slice(-4).toUpperCase()}-${record._id.toString().slice(-4).toUpperCase()}` : null
      });
    }

    res.json({
      date: now.toISOString().split('T')[0],
      totalSessions: sessions.length,
      presentCount: results.filter(r => r.status === 'present').length,
      absentCount: results.filter(r => r.status === 'absent').length,
      records: results
    });
  } catch (err) {
    next(err);
  }
};
