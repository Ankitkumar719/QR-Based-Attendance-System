import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const run = async () => {
  try {
    await connectDB();

    // Delete all students and faculty
    const result = await User.deleteMany({ role: { $in: ["student", "faculty"] } });
    
    console.log(`\n✅ Deleted ${result.deletedCount} students and faculty members\n`);
    
    // Show remaining users
    const remaining = await User.countDocuments();
    console.log(`Remaining users (Admin only): ${remaining}`);
    
    // List remaining users
    const remainingUsers = await User.find({}, { name: 1, email: 1, role: 1 });
    console.log("\nRemaining Users:");
    remainingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) [${user.role}]`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
