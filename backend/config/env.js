import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "changeme_super_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  EMAIL_HOST: process.env.EMAIL_HOST || "",
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5500",
  /** Flask attendance shortage predictor (ml/app.py) */
  ML_PREDICT_URL: process.env.ML_PREDICT_URL || "http://localhost:8000",
  ML_TRAIN_SECRET: process.env.ML_TRAIN_SECRET || "",
  /** Face recognition Python service (backend/ml/) */
  FACE_ML_SERVICE_URL:
    process.env.FACE_ML_SERVICE_URL ||
    process.env.PYTHON_SERVICE_URL ||
    "http://localhost:5000",
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com",
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
  DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME || "Super Admin"
};
