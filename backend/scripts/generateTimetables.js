import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Class } from "../models/Class.js";
import { TimeTable } from "../models/TimeTable.js";

const timeSlots = [
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "11:00" },
  { startTime: "11:15", endTime: "12:15" },
  { startTime: "12:15", endTime: "13:15" },
  { startTime: "14:00", endTime: "15:00" },
  { startTime: "15:00", endTime: "16:00" },
  { startTime: "16:15", endTime: "17:15" }
];

const rooms = ["LH-101", "LH-102", "LH-103", "LH-201", "LH-202", "LH-203", "Lab-1", "Lab-2", "Lab-3"];

const subjectsData = {
  "Computer Science & Engineering": {
    3: [
      { code: "CS-302", name: "Discrete Structures" },
      { code: "CS-303", name: "Data Structures" },
      { code: "CS-304", name: "Digital Systems" },
      { code: "CS-305", name: "Object-Oriented Programming" },
      { code: "ES-301", name: "Energy & Environmental Engineering" }
    ],
    4: [
      { code: "CS-402", name: "Analysis & Design of Algorithms" },
      { code: "CS-403", name: "Software Engineering" },
      { code: "CS-404", name: "Computer Organization" },
      { code: "CS-405", name: "Operating Systems" },
      { code: "BT-401", name: "Mathematics-III" }
    ],
    5: [
      { code: "CS-501", name: "Theory of Computation" },
      { code: "CS-502", name: "Database Management Systems" },
      { code: "CS-503", name: "Computer Networks" },
      { code: "CS-504", name: "Machine Learning" },
      { code: "CS-505", name: "Linux Lab" }
    ]
  },
  "Information Technology": {
    3: [
      { code: "IT-302", name: "Discrete Mathematics" },
      { code: "IT-303", name: "Data Structures" },
      { code: "IT-304", name: "Digital Logic" },
      { code: "IT-305", name: "OOP with Java" },
      { code: "ES-301", name: "Environmental Science" }
    ],
    4: [
      { code: "IT-402", name: "Algorithm Design" },
      { code: "IT-403", name: "Software Engineering" },
      { code: "IT-404", name: "Computer Architecture" },
      { code: "IT-405", name: "Operating Systems" },
      { code: "BT-401", name: "Mathematics-III" }
    ],
    5: [
      { code: "IT-501", name: "Automata Theory" },
      { code: "IT-502", name: "DBMS" },
      { code: "IT-503", name: "Networks" },
      { code: "IT-504", name: "Web Technologies" },
      { code: "IT-505", name: "Python Lab" }
    ]
  },
  "Electronics & Communication Engineering": {
    3: [
      { code: "EC-302", name: "Network Analysis" },
      { code: "EC-303", name: "Analog Electronics" },
      { code: "EC-304", name: "Signals & Systems" },
      { code: "EC-305", name: "Electronic Devices" },
      { code: "ES-301", name: "Environmental Science" }
    ],
    4: [
      { code: "EC-402", name: "Digital Electronics" },
      { code: "EC-403", name: "Control Systems" },
      { code: "EC-404", name: "Communication Systems-I" },
      { code: "EC-405", name: "Electromagnetic Theory" },
      { code: "BT-401", name: "Mathematics-III" }
    ],
    5: [
      { code: "EC-501", name: "Microprocessors" },
      { code: "EC-502", name: "Communication Systems-II" },
      { code: "EC-503", name: "VLSI Design" },
      { code: "EC-504", name: "Digital Signal Processing" },
      { code: "EC-505", name: "Microprocessor Lab" }
    ]
  },
  "Electrical & Electronics Engineering": {
    3: [
      { code: "EE-302", name: "Electrical Circuits" },
      { code: "EE-303", name: "Electromagnetic Fields" },
      { code: "EE-304", name: "Electrical Measurements" },
      { code: "EE-305", name: "Analog Electronics" },
      { code: "ES-301", name: "Environmental Science" }
    ],
    4: [
      { code: "EE-402", name: "Power Generation" },
      { code: "EE-403", name: "Control Systems" },
      { code: "EE-404", name: "Digital Electronics" },
      { code: "EE-405", name: "Electrical Machines-I" },
      { code: "BT-401", name: "Mathematics-III" }
    ],
    5: [
      { code: "EE-501", name: "Electrical Machines-II" },
      { code: "EE-502", name: "Power Electronics" },
      { code: "EE-503", name: "Power System-I" },
      { code: "EE-504", name: "Microcontrollers" },
      { code: "EE-505", name: "Machines Lab" }
    ]
  },
  "Mechanical Engineering": {
    3: [
      { code: "ME-302", name: "Engineering Thermodynamics" },
      { code: "ME-303", name: "Strength of Materials" },
      { code: "ME-304", name: "Manufacturing Processes" },
      { code: "ME-305", name: "Engineering Mechanics" },
      { code: "ES-301", name: "Environmental Science" }
    ],
    4: [
      { code: "ME-402", name: "Fluid Mechanics" },
      { code: "ME-403", name: "Theory of Machines" },
      { code: "ME-404", name: "Materials Science" },
      { code: "ME-405", name: "Manufacturing Technology" },
      { code: "BT-401", name: "Mathematics-III" }
    ],
    5: [
      { code: "ME-501", name: "Machine Design-I" },
      { code: "ME-502", name: "Heat Transfer" },
      { code: "ME-503", name: "IC Engines" },
      { code: "ME-504", name: "CAD/CAM" },
      { code: "ME-505", name: "Thermal Lab" }
    ]
  },
  "Civil Engineering": {
    3: [
      { code: "CE-302", name: "Strength of Materials" },
      { code: "CE-303", name: "Engineering Geology" },
      { code: "CE-304", name: "Surveying-I" },
      { code: "CE-305", name: "Building Materials" },
      { code: "ES-301", name: "Environmental Science" }
    ],
    4: [
      { code: "CE-402", name: "Structural Analysis-I" },
      { code: "CE-403", name: "Fluid Mechanics" },
      { code: "CE-404", name: "Concrete Technology" },
      { code: "CE-405", name: "Surveying-II" },
      { code: "BT-401", name: "Mathematics-III" }
    ],
    5: [
      { code: "CE-501", name: "Structural Analysis-II" },
      { code: "CE-502", name: "Geotechnical Engineering" },
      { code: "CE-503", name: "Transportation Engineering" },
      { code: "CE-504", name: "Environmental Engineering" },
      { code: "CE-505", name: "Survey Camp" }
    ]
  }
};

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function generateDaySchedule(subjects, existingClasses) {
  const schedule = [];
  const usedSubjects = new Set();
  
  // Randomly select 5-6 slots per day
  const numSlots = Math.floor(Math.random() * 2) + 5;
  const availableSlots = [...timeSlots].sort(() => Math.random() - 0.5).slice(0, numSlots);
  availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  for (const slot of availableSlots) {
    // Pick a random subject that hasn't been used today
    const availableSubjects = subjects.filter(s => !usedSubjects.has(s.code));
    if (availableSubjects.length === 0) continue;
    
    const subject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)];
    usedSubjects.add(subject.code);
    
    // Find if there's an existing class for this course
    const existingClass = existingClasses.find(c => c.courseCode === subject.code);
    
    schedule.push({
      startTime: slot.startTime,
      endTime: slot.endTime,
      classId: existingClass?._id || null,
      courseCode: subject.code,
      courseName: subject.name,
      room: rooms[Math.floor(Math.random() * rooms.length)]
    });
  }
  
  return schedule;
}

const run = async () => {
  try {
    await connectDB();
    
    // Clear existing timetables
    await TimeTable.deleteMany({});
    console.log("Cleared existing timetables");
    
    const departments = Object.keys(subjectsData);
    const sections = ['A', 'B'];
    const semesters = [3, 4, 5];
    
    let timetableCount = 0;
    
    for (const dept of departments) {
      for (const sem of semesters) {
        const subjects = subjectsData[dept][sem];
        if (!subjects) continue;
        
        for (const sec of sections) {
          // Get existing classes for this department/semester/section
          const existingClasses = await Class.find({
            department: dept,
            semester: sem.toString(),
            section: sec
          });
          
          const schedule = {};
          
          for (const day of days) {
            schedule[day] = generateDaySchedule(subjects, existingClasses);
          }
          
          await TimeTable.create({
            department: dept,
            semester: sem.toString(),
            section: sec,
            academicYear: "2024-25",
            schedule
          });
          
          timetableCount++;
          console.log(`Created timetable: ${dept} - Sem ${sem} - Section ${sec}`);
        }
      }
    }
    
    console.log(`\n========== TIMETABLES GENERATED ==========`);
    console.log(`Total timetables created: ${timetableCount}`);
    console.log(`\nSample Schedule (CSE Sem 3 Section A - Monday):`);
    
    const sampleTT = await TimeTable.findOne({
      department: "Computer Science & Engineering",
      semester: "3",
      section: "A"
    });
    
    if (sampleTT && sampleTT.schedule.monday) {
      sampleTT.schedule.monday.forEach(slot => {
        console.log(`  ${slot.startTime} - ${slot.endTime}: ${slot.courseCode} (${slot.courseName}) @ ${slot.room}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

run();
