import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/smart_attendance",
  JWT_SECRET: process.env.JWT_SECRET || "changeme_super_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  EMAIL_HOST: process.env.EMAIL_HOST || "",
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5500"
};
