import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    timestamp: {
      type: Date,
      default: () => new Date()
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present"
    }
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model(
  "AttendanceRecord",
  attendanceRecordSchema
);
