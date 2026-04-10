import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "A1", "A2", "B1"
    department: { type: String, required: true },
    description: { type: String }, // Optional description
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound unique index - same section name can't exist twice in same department
sectionSchema.index({ name: 1, department: 1 }, { unique: true });

export default mongoose.model("Section", sectionSchema);
