import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "10:00"
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  courseCode: String,
  courseName: String,
  department: String,
  semester: String,
  section: String,
  room: String
}, { _id: false });

const facultyScheduleSchema = new mongoose.Schema({
  facultyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true
  },
  academicYear: { type: String, default: () => `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` },
  schedule: {
    monday: [timeSlotSchema],
    tuesday: [timeSlotSchema],
    wednesday: [timeSlotSchema],
    thursday: [timeSlotSchema],
    friday: [timeSlotSchema],
    saturday: [timeSlotSchema]
  }
}, { timestamps: true });

// Get today's classes for a faculty
facultyScheduleSchema.methods.getTodayClasses = function() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  
  if (today === 'sunday') return [];
  
  return this.schedule[today] || [];
};

export const FacultySchedule = mongoose.model("FacultySchedule", facultyScheduleSchema);
