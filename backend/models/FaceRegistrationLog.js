import mongoose from "mongoose";

const faceRegistrationLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["register", "update", "reset", "disable", "enable", "verify"],
      required: true
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // student/admin who initiated
    actorRole: { type: String, enum: ["admin", "faculty", "student"] },
    success: { type: Boolean, default: true },
    message: { type: String },
    meta: { type: Object }
  },
  { timestamps: true }
);

faceRegistrationLogSchema.index({ student: 1, createdAt: -1 });

export const FaceRegistrationLog = mongoose.model(
  "FaceRegistrationLog",
  faceRegistrationLogSchema
);

