import nodemailer from "nodemailer";
import { env } from "./env.js";

export const emailTransporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS
  }
});
