import axios from 'axios';
import { User } from '../models/User.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendanceSession } from '../models/AttendanceSession.js';

const PYTHON_SERVICE_URL = 'http://localhost:5000';

export const registerFace = async (req, res) => {
    try {
        const { studentId, image } = req.body;

        // Check if student exists
        const student = await User.findOne({ rollNo: studentId, role: 'student' });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Call Python service
        const response = await axios.post(`${PYTHON_SERVICE_URL}/register_face`, {
            student_id: studentId,
            image: image
        });

        res.status(200).json({ message: 'Face registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering face' });
    }
};

export const recognizeFace = async (req, res) => {
    try {
        const { image, sessionId } = req.body;

        // Call Python service
        const response = await axios.post(`${PYTHON_SERVICE_URL}/recognize_face`, {
            image: image
        });

        const { student_id, confidence } = response.data;

        if (confidence < 0.6) { // Threshold for recognition
            return res.status(400).json({ message: 'Face not recognized with sufficient confidence' });
        }

        // Find student
        const student = await User.findOne({ rollNo: student_id, role: 'student' });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find active session
        const session = await AttendanceSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if already marked
        const existingRecord = await AttendanceRecord.findOne({
            studentId: student._id,
            sessionId: sessionId
        });

        if (existingRecord) {
            return res.status(400).json({ message: 'Attendance already marked' });
        }

        // Mark attendance
        const attendanceRecord = new AttendanceRecord({
            studentId: student._id,
            sessionId: sessionId,
            status: 'present',
            timestamp: new Date()
        });

        await attendanceRecord.save();

        res.status(200).json({ message: 'Attendance marked successfully', student: student.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error recognizing face' });
    }
};