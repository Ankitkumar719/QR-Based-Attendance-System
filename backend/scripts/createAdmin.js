import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const run = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log("Admin already exists:", email);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name: "Super Admin",
      email: email.toLowerCase(),
      passwordHash,
      role: "admin"
    });

    console.log("Admin created:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
