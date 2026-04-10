import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Class } from "../models/Class.js";

const run = async () => {
  try {
    await connectDB();

    const passwordHash = await bcrypt.hash("password123", 10);

    // Create Admin
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (!adminExists) {
      await User.create({
        name: "Super Admin",
        email: "admin@example.com",
        passwordHash: await bcrypt.hash("admin123", 10),
        role: "admin"
      });
      console.log("Admin created: admin@example.com / admin123");
    } else {
      console.log("Admin already exists");
    }

    // Create Faculty Members
    const facultyData = [
      { name: "Dr. Rajesh Kumar", email: "rajesh.kumar@example.com", department: "Computer Science & Engineering" },
      { name: "Dr. Priya Sharma", email: "priya.sharma@example.com", department: "Computer Science & Engineering" },
      { name: "Dr. Amit Singh", email: "amit.singh@example.com", department: "Information Technology" },
      { name: "Dr. Sneha Gupta", email: "sneha.gupta@example.com", department: "Electronics & Communication Engineering" },
      { name: "Dr. Vikram Patel", email: "vikram.patel@example.com", department: "Electrical & Electronics Engineering" },
      { name: "Dr. Anita Verma", email: "anita.verma@example.com", department: "Mechanical Engineering" },
      { name: "Dr. Suresh Yadav", email: "suresh.yadav@example.com", department: "Civil Engineering" },
      { name: "Test Faculty", email: "faculty@example.com", department: "Computer Science & Engineering" },
    ];

    const createdFaculty = [];
    for (const faculty of facultyData) {
      const exists = await User.findOne({ email: faculty.email });
      if (!exists) {
        const user = await User.create({
          ...faculty,
          passwordHash,
          role: "faculty"
        });
        createdFaculty.push(user);
        console.log(`Faculty created: ${faculty.email}`);
      } else {
        createdFaculty.push(exists);
        console.log(`Faculty already exists: ${faculty.email}`);
      }
    }

    // Create Students
    const departments = [
      "Computer Science & Engineering",
      "Information Technology",
      "Electronics & Communication Engineering",
      "Electrical & Electronics Engineering",
      "Mechanical Engineering",
      "Civil Engineering"
    ];

    const sections = ["A", "B"];
    const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

    let studentCount = 0;
    for (const dept of departments.slice(0, 2)) { // Only CSE and IT for now
      for (const sem of semesters.slice(2, 5)) { // Semesters 3, 4, 5
        for (const sec of sections) {
          for (let i = 1; i <= 5; i++) { // 5 students per section
            const deptCode = dept === "Computer Science & Engineering" ? "CSE" : "IT";
            const email = `student.${deptCode.toLowerCase()}.${sem}${sec.toLowerCase()}${i}@example.com`;
            const exists = await User.findOne({ email });
            if (!exists) {
              await User.create({
                name: `Student ${deptCode} ${sem}${sec}-${i}`,
                email,
                passwordHash,
                role: "student",
                department: dept,
                semester: sem,
                section: sec
              });
              studentCount++;
            }
          }
        }
      }
    }
    console.log(`Created ${studentCount} new students`);

    // Create Classes
    const classesData = [
      // CSE Classes
      { department: "Computer Science & Engineering", semester: "3", section: "A", courseCode: "CS-303", courseName: "Data Structures", facultyEmail: "rajesh.kumar@example.com" },
      { department: "Computer Science & Engineering", semester: "3", section: "B", courseCode: "CS-303", courseName: "Data Structures", facultyEmail: "rajesh.kumar@example.com" },
      { department: "Computer Science & Engineering", semester: "3", section: "A", courseCode: "CS-304", courseName: "Digital Systems", facultyEmail: "priya.sharma@example.com" },
      { department: "Computer Science & Engineering", semester: "4", section: "A", courseCode: "CS-402", courseName: "Analysis & Design of Algorithms", facultyEmail: "rajesh.kumar@example.com" },
      { department: "Computer Science & Engineering", semester: "4", section: "B", courseCode: "CS-403", courseName: "Software Engineering", facultyEmail: "priya.sharma@example.com" },
      { department: "Computer Science & Engineering", semester: "5", section: "A", courseCode: "CS-502", courseName: "Database Management Systems", facultyEmail: "faculty@example.com" },
      
      // IT Classes
      { department: "Information Technology", semester: "3", section: "A", courseCode: "CS-303", courseName: "Data Structures", facultyEmail: "amit.singh@example.com" },
      { department: "Information Technology", semester: "4", section: "A", courseCode: "CS-402", courseName: "Analysis & Design of Algorithms", facultyEmail: "amit.singh@example.com" },
      
      // ECE Classes
      { department: "Electronics & Communication Engineering", semester: "3", section: "A", courseCode: "EC-301", courseName: "Network Analysis", facultyEmail: "sneha.gupta@example.com" },
      
      // EEE Classes
      { department: "Electrical & Electronics Engineering", semester: "3", section: "A", courseCode: "EE-302", courseName: "Electrical Circuits", facultyEmail: "vikram.patel@example.com" },
      
      // ME Classes
      { department: "Mechanical Engineering", semester: "3", section: "A", courseCode: "ME-302", courseName: "Engineering Thermodynamics", facultyEmail: "anita.verma@example.com" },
      
      // CE Classes
      { department: "Civil Engineering", semester: "3", section: "A", courseCode: "CE-302", courseName: "Strength of Materials", facultyEmail: "suresh.yadav@example.com" },
    ];

    let classCount = 0;
    for (const cls of classesData) {
      const exists = await Class.findOne({
        department: cls.department,
        semester: cls.semester,
        section: cls.section,
        courseCode: cls.courseCode
      });

      if (!exists) {
        const faculty = await User.findOne({ email: cls.facultyEmail, role: "faculty" });
        if (faculty) {
          await Class.create({
            department: cls.department,
            semester: cls.semester,
            section: cls.section,
            courseCode: cls.courseCode,
            courseName: cls.courseName,
            facultyId: faculty._id
          });
          classCount++;
          console.log(`Class created: ${cls.courseCode} - ${cls.courseName} (${cls.department} Sem ${cls.semester} ${cls.section})`);
        }
      }
    }
    console.log(`Created ${classCount} new classes`);

    console.log("\n========== DATABASE SEEDED SUCCESSFULLY ==========");
    console.log("\nLogin Credentials:");
    console.log("----------------------------------");
    console.log("Admin:   admin@example.com / admin123");
    console.log("Faculty: faculty@example.com / password123");
    console.log("Faculty: rajesh.kumar@example.com / password123");
    console.log("Faculty: priya.sharma@example.com / password123");
    console.log("Student: student.cse.3a1@example.com / password123");
    console.log("Student: student.it.3a1@example.com / password123");
    console.log("----------------------------------\n");

    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
};

run();
