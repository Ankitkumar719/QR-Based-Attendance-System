import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const run = async () => {
  try {
    await connectDB();

    // Get all students without roll numbers
    const students = await User.find({ 
      role: "student", 
      $or: [{ rollNo: null }, { rollNo: { $exists: false } }]
    });

    console.log(`Found ${students.length} students without roll numbers`);

    // Group students by department and admission year
    for (const student of students) {
      if (!student.department) {
        console.log(`Skipping ${student.email} - no department`);
        continue;
      }

      // Determine admission year based on current semester
      // Assuming each semester takes 6 months
      const currentSem = parseInt(student.semester) || 1;
      const currentYear = new Date().getFullYear();
      const yearsInCollege = Math.ceil(currentSem / 2);
      const admissionYear = student.admissionYear || (currentYear - yearsInCollege + 1);

      // Generate roll number
      const rollNo = await User.generateRollNo(student.department, admissionYear);

      await User.findByIdAndUpdate(student._id, { 
        rollNo, 
        admissionYear 
      });

      console.log(`Updated ${student.name}: ${rollNo} (Admission Year: ${admissionYear})`);
    }

    console.log("\n========== ROLL NUMBERS GENERATED ==========");
    
    // Show summary
    const updatedStudents = await User.find({ role: "student", rollNo: { $exists: true, $ne: null } })
      .select("name email rollNo department semester section admissionYear")
      .sort({ rollNo: 1 });

    console.log("\nRoll Number Format: YYDEPTSSSSS");
    console.log("YY = Last 2 digits of admission year");
    console.log("DEPT = Department code (CSE, IT, ECE, EEE, ME, CE)");
    console.log("SSSS = 4-digit serial number\n");

    console.log("Sample Roll Numbers:");
    updatedStudents.slice(0, 10).forEach(s => {
      console.log(`  ${s.rollNo} - ${s.name} (${s.department}, Sem ${s.semester})`);
    });

    if (updatedStudents.length > 10) {
      console.log(`  ... and ${updatedStudents.length - 10} more students`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

run();
