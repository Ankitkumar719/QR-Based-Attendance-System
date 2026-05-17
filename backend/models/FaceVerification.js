import mongoose from "mongoose";
import crypto from "crypto";

const FACE_VERIFY_TTL_MS = Number(process.env.FACE_VERIFY_TTL_MS) || 5 * 60 * 1000;

const faceVerificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    confidence: {
      type: Number,
    },
  },
  { timestamps: true }
);

faceVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

faceVerificationSchema.statics.createForStudent = async function (studentId, confidence) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + FACE_VERIFY_TTL_MS);
  const doc = await this.create({
    studentId,
    token,
    expiresAt,
    confidence,
    used: false,
  });
  return { token: doc.token, expiresAt: doc.expiresAt };
};

faceVerificationSchema.statics.consumeToken = async function (token, studentId) {
  const doc = await this.findOneAndUpdate(
    {
      token,
      studentId,
      used: false,
      expiresAt: { $gt: new Date() },
    },
    { $set: { used: true } },
    { new: true }
  );
  return doc;
};

export const FaceVerification = mongoose.model("FaceVerification", faceVerificationSchema);
