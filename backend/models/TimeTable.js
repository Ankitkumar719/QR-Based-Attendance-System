import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // e.g., "09:00"
  endTime: { type: String, required: true },   // e.g., "10:00"
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  courseCode: { type: String },
  courseName: { type: String },
  room: { type: String }
}, { _id: false });

const timeTableSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    semester: { type: String, required: true },
    section: { type: String, required: true },
    academicYear: { type: String }, // e.g., "2024-25"
    schedule: {
      monday: [timeSlotSchema],
      tuesday: [timeSlotSchema],
      wednesday: [timeSlotSchema],
      thursday: [timeSlotSchema],
      friday: [timeSlotSchema],
      saturday: [timeSlotSchema]
    }
  },
  { timestamps: true }
);

// Compound index for unique timetable per department/semester/section
timeTableSchema.index({ department: 1, semester: 1, section: 1 }, { unique: true });

// Static method to get current/upcoming class
timeTableSchema.statics.getCurrentClass = async function(department, semester, section) {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  
  if (today === 'sunday') return null;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const timetable = await this.findOne({ department, semester, section });
  if (!timetable || !timetable.schedule[today]) return null;
  
  const slots = timetable.schedule[today];
  
  // Find current or next class
  for (const slot of slots) {
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    // Current class (within time slot)
    if (currentTime >= startMinutes && currentTime < endMinutes) {
      return { ...slot.toObject(), status: 'ongoing', day: today };
    }
    
    // Upcoming class (within next 15 minutes)
    if (currentTime >= startMinutes - 15 && currentTime < startMinutes) {
      return { ...slot.toObject(), status: 'upcoming', day: today };
    }
  }
  
  return null;
};

export const TimeTable = mongoose.model("TimeTable", timeTableSchema);
