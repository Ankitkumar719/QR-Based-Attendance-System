import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const run = async () => {
  try {
    await connectDB();

    // Count students before deletion
    const count = await User.countDocuments({ role: "student" });
    console.log(`Found ${count} students in database`);

    if (count > 0) {
      // Delete all students
      const result = await User.deleteMany({ role: "student" });
      console.log(`✅ Deleted ${result.deletedCount} students`);
    } else {
      console.log("No students to delete");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

run();
