import express from "express";
import { login, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register); // can be limited to admin usage from frontend

export default router;
