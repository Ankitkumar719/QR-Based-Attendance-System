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
    // Faculty location where session was created
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    },
    accuracy: {
      type: Number,
      required: false
    },
    radius: {
      type: Number,
      default: 30
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
