import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseCode: { 
      type: String, 
      required: true,
      uppercase: true,
      trim: true
    },
    courseName: { 
      type: String, 
      required: true,
      trim: true
    },
    department: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Department',
      required: true 
    },
    semester: { 
      type: Number, 
      required: true,
      min: 1,
      max: 8
    },
    credits: {
      type: Number,
      default: 3
    },
    description: {
      type: String,
      default: ''
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Compound index to ensure unique course code per department
courseSchema.index({ courseCode: 1, department: 1 }, { unique: true });

const Course = mongoose.model("Course", courseSchema);
export default Course;
