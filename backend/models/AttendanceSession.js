import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },
    qrToken: {
      type: String,
      required: true,
      unique: true
    },
    createdAt: {
      type: Date,
      default: () => new Date()
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);
