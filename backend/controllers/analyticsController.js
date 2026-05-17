import mongoose from "mongoose";
import { createObjectCsvStringifier } from "csv-writer";
import { Class } from "../models/Class.js";
import { AttendanceSession } from "../models/AttendanceSession.js";
import { AttendanceRecord } from "../models/AttendanceRecord.js";

// GET /analytics/student — personal attendance analytics for logged-in student
export const studentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { startDate, endDate } = req.query;

    const recordFilter = { studentId };
    const records = await AttendanceRecord.find(recordFilter)
      .populate({
        path: "sessionId",
        populate: { path: "classId" }
      })
      .lean();

    const inRange = (dateValue) => {
      if (!startDate && !endDate) return true;
      const d = new Date(dateValue);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (d < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    };

    const filtered = records.filter((rec) => {
      const session = rec.sessionId;
      if (!session) return false;
      return inRange(session.createdAt || rec.createdAt);
    });

    const presentCount = filtered.filter((r) => r.status === "present").length;
    const absentCount = filtered.filter((r) => r.status !== "present").length;
    const totalSessions = filtered.length;
    const attendancePercentage = totalSessions
      ? Math.round((presentCount / totalSessions) * 100)
      : 0;

    const monthlyMap = new Map();
    for (const rec of filtered) {
      const session = rec.sessionId;
      const when = new Date(session?.createdAt || rec.createdAt);
      const monthKey = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthKey, present: 0, absent: 0 });
      }
      const bucket = monthlyMap.get(monthKey);
      if (rec.status === "present") bucket.present += 1;
      else bucket.absent += 1;
    }

    const detailRecords = filtered.map((rec) => {
      const session = rec.sessionId;
      const cls = session?.classId;
      return {
        date: session?.createdAt || rec.createdAt,
        subject: cls?.courseName || cls?.courseCode || "N/A",
        faculty: "N/A",
        status: rec.status,
        sessionTime: session?.createdAt
          ? new Date(session.createdAt).toLocaleTimeString()
          : "N/A",
        location: cls?.room || "N/A"
      };
    });

    res.json({
      totalSessions,
      presentCount,
      absentCount,
      attendancePercentage,
      monthlyData: Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
      records: detailRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (err) {
    console.error("studentAnalytics error:", err.message);
    next(err);
  }
};

// GET /analytics/report
export const report = async (req, res, next) => {
  try {
    const { department, semester, section, courseCode } = req.query;

    const classFilter = {};
    if (department) classFilter.department = department;
    if (semester) classFilter.semester = semester;
    if (section) classFilter.section = section;
    if (courseCode) classFilter.courseCode = courseCode;

    const classes = await Class.find(classFilter).lean();
    const classIds = classes.map((c) => c._id);

    if (!classIds.length) {
      return res.json([]);
    }

    const sessions = await AttendanceSession.find({ classId: { $in: classIds } })
      .sort({ createdAt: -1 })
      .lean();
    const sessionIds = sessions.map((s) => s._id);

    const agg = await AttendanceRecord.aggregate([
      { $match: { sessionId: { $in: sessionIds } } },
      {
        $group: {
          _id: "$sessionId",
          total: { $sum: 1 },
          presents: {
            $sum: {
              $cond: [{ $eq: ["$status", "present"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const aggMap = agg.reduce((acc, a) => {
      acc[a._id.toString()] = a;
      return acc;
    }, {});

    const sessionClassMap = sessions.reduce((acc, s) => {
      acc[s._id.toString()] = s.classId.toString();
      return acc;
    }, {});

    const classAgg = new Map();

    for (const s of sessions) {
      const classId = s.classId.toString();
      const a = aggMap[s._id.toString()] || { total: 0, presents: 0 };
      if (!classAgg.has(classId)) {
        classAgg.set(classId, {
          sessions: 0,
          total: 0,
          presents: 0
        });
      }
      const cAgg = classAgg.get(classId);
      cAgg.sessions += 1;
      cAgg.total += a.total;
      cAgg.presents += a.presents;
    }

    const result = classes.map((cls) => {
      const aggC = classAgg.get(cls._id.toString()) || {
        sessions: 0,
        total: 0,
        presents: 0
      };
      const averageAttendance = aggC.total
        ? Math.round((aggC.presents / aggC.total) * 100)
        : 0;
      return {
        class: cls,
        totalClassesConducted: aggC.sessions,
        totalMarked: aggC.total,
        presentCount: aggC.presents,
        absentCount: aggC.total - aggC.presents,
        averageAttendance
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /analytics/export
export const exportCsv = async (req, res, next) => {
  try {
    // Reuse report data
    req.query = req.query || {};
    const { department, semester, section, courseCode } = req.query;

    const classFilter = {};
    if (department) classFilter.department = department;
    if (semester) classFilter.semester = semester;
    if (section) classFilter.section = section;
    if (courseCode) classFilter.courseCode = courseCode;

    const classes = await Class.find(classFilter).lean();
    const classIds = classes.map((c) => c._id);

    const sessions = await AttendanceSession.find({ classId: { $in: classIds } })
      .sort({ createdAt: -1 })
      .lean();
    const sessionIds = sessions.map((s) => s._id);

    const agg = await AttendanceRecord.aggregate([
      { $match: { sessionId: { $in: sessionIds } } },
      {
        $group: {
          _id: "$sessionId",
          total: { $sum: 1 },
          presents: {
            $sum: {
              $cond: [{ $eq: ["$status", "present"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const aggMap = agg.reduce((acc, a) => {
      acc[a._id.toString()] = a;
      return acc;
    }, {});

    const classById = classes.reduce((acc, c) => {
      acc[c._id.toString()] = c;
      return acc;
    }, {});

    const records = sessions.map((s) => {
      const cls = classById[s.classId.toString()];
      const a = aggMap[s._id.toString()] || { total: 0, presents: 0 };
      const averageAttendance = a.total
        ? Math.round((a.presents / a.total) * 100)
        : 0;
      return {
        department: cls?.department || "",
        semester: cls?.semester || "",
        section: cls?.section || "",
        courseCode: cls?.courseCode || "",
        courseName: cls?.courseName || "",
        sessionCreatedAt: s.createdAt,
        totalMarked: a.total,
        presentCount: a.presents,
        absentCount: a.total - a.presents,
        averageAttendance
      };
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "department", title: "Department" },
        { id: "semester", title: "Semester" },
        { id: "section", title: "Section" },
        { id: "courseCode", title: "Course Code" },
        { id: "courseName", title: "Course Name" },
        { id: "sessionCreatedAt", title: "Session Time" },
        { id: "totalMarked", title: "Total Marked" },
        { id: "presentCount", title: "Present" },
        { id: "absentCount", title: "Absent" },
        { id: "averageAttendance", title: "Average %" }
      ]
    });

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(records);
    const csv = header + body;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance_report.csv"
    );

    res.send(csv);
  } catch (err) {
    next(err);
  }
};
