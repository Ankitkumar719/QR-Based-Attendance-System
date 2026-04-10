import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    semester: { type: String, required: true },
    section: { type: String, required: true },
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export const Class = mongoose.model("Class", classSchema);
