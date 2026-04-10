import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "Computer Science & Engineering"
    code: { type: String, required: true, unique: true }, // e.g., "CSE"
    description: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
