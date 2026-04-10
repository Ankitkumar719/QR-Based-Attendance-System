import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const run = async () => {
  try {
    await connectDB();

    const email = "faculty@example.com";
    const password = "faculty123";

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log("Faculty already exists:", email);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const faculty = await User.create({
      name: "Test Faculty",
      email: email.toLowerCase(),
      passwordHash,
      role: "faculty",
      department: "Computer Science & Engineering"
    });

    console.log("Faculty created:", faculty.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
