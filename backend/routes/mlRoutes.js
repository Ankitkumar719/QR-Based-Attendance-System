import express from 'express';
import { registerFace, recognizeFace } from '../controllers/mlController.js';

const router = express.Router();

// Register face for a student
router.post('/register-face', registerFace);

// Recognize face for attendance
router.post('/recognize-face', recognizeFace);

export default router;