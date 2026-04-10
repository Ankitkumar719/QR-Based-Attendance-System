# Smart Attendance System - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [User Roles & Features](#user-roles--features)
7. [Installation & Setup](#installation--setup)
8. [File Structure](#file-structure)
9. [Workflow Guide](#workflow-guide)

---

## Project Overview

**Smart Attendance System** is a web-based QR code attendance management system designed for educational institutions. It enables faculty to mark student attendance using QR codes and provides comprehensive analytics for administrators.

### Key Features
- 🔐 Role-based authentication (Admin, Faculty, Student)
- 📱 QR Code-based attendance marking
- 📊 Real-time attendance tracking
- 📅 Timetable management
- 🏫 Department, Section, and Course management
- 📈 Attendance reports and analytics

---

## Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Nodemailer | Email notifications |

### Frontend
| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| CSS3 | Styling |
| Vanilla JavaScript | Interactivity |
| Chart.js | Analytics charts |
| QRious | QR code generation |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ index   │  │ admin   │  │ faculty │  │ student │        │
│  │ .html   │  │ .html   │  │ .html   │  │ .html   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴─────┬──────┴────────────┘              │
│                          │                                   │
│                    ┌─────┴─────┐                            │
│                    │  api.js   │  (API Helper)              │
│                    └─────┬─────┘                            │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────┼──────────────────────────────────┐
│                     BACKEND                                  │
│                    ┌─────┴─────┐                            │
│                    │ server.js │                            │
│                    └─────┬─────┘                            │
│                          │                                   │
│    ┌─────────────────────┼─────────────────────┐            │
│    │                 ROUTES                     │            │
│    │  ┌────────┐ ┌────────┐ ┌────────┐        │            │
│    │  │ auth   │ │ admin  │ │faculty │        │            │
│    │  │ Routes │ │ Routes │ │Routes  │        │            │
│    │  └───┬────┘ └───┬────┘ └───┬────┘        │            │
│    └──────┼──────────┼──────────┼─────────────┘            │
│           │          │          │                           │
│    ┌──────┴──────────┴──────────┴─────────────┐            │
│    │              CONTROLLERS                  │            │
│    │  ┌────────┐ ┌────────┐ ┌────────┐       │            │
│    │  │ auth   │ │ admin  │ │faculty │       │            │
│    │  │Contrlr │ │Contrlr │ │Contrlr │       │            │
│    │  └───┬────┘ └───┬────┘ └───┬────┘       │            │
│    └──────┼──────────┼──────────┼────────────┘            │
│           │          │          │                          │
│    ┌──────┴──────────┴──────────┴────────────┐            │
│    │               MODELS                     │            │
│    │  User, Class, Department, Section,      │            │
│    │  Course, FacultySchedule, AttendanceSession │        │
│    └─────────────────┬───────────────────────┘            │
└──────────────────────┼────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │    MongoDB      │
              │ smart_attendance│
              └─────────────────┘
```

---

## Database Schema

### User Model
```javascript
{
  name: String,              // Full name
  email: String,             // Unique email (login)
  password: String,          // Hashed password
  role: String,              // 'admin' | 'faculty' | 'student'
  rollNumber: String,        // For students only
  department: String,        // Department name
  semester: Number,          // 1-8
  section: String,           // A, B, C, etc.
  deviceId: String,          // For student device binding
  createdAt: Date
}
```

### Department Model
```javascript
{
  name: String,              // e.g., "Computer Science & Engineering"
  code: String,              // e.g., "CSE"
  description: String,
  isActive: Boolean,
  createdAt: Date
}
```

### Section Model
```javascript
{
  name: String,              // e.g., "A", "B"
  department: ObjectId,      // Reference to Department
  semester: Number,          // 1-8
  studentCount: Number,
  isActive: Boolean,
  createdAt: Date
}
```

### Course Model
```javascript
{
  courseCode: String,        // e.g., "CS-301"
  courseName: String,        // e.g., "Data Structures"
  department: ObjectId,      // Reference to Department
  semester: Number,          // 1-8
  credits: Number,
  description: String,
  isActive: Boolean,
  createdAt: Date
}
// Compound index: { courseCode: 1, department: 1 } (unique)
```

### Class Model
```javascript
{
  courseCode: String,
  courseName: String,
  department: String,
  semester: Number,
  section: String,
  faculty: ObjectId,         // Reference to User (faculty)
  students: [ObjectId],      // Array of User references
  createdAt: Date
}
```

### FacultySchedule Model
```javascript
{
  faculty: ObjectId,         // Reference to User (faculty)
  schedule: {
    monday: [{
      courseCode: String,
      courseName: String,
      department: String,
      semester: Number,
      section: String,
      startTime: String,     // "09:00"
      endTime: String        // "10:00"
    }],
    tuesday: [...],
    wednesday: [...],
    thursday: [...],
    friday: [...],
    saturday: [...]
  },
  createdAt: Date
}
```

### AttendanceSession Model
```javascript
{
  class: ObjectId,           // Reference to Class
  faculty: ObjectId,         // Reference to User
  date: Date,
  qrToken: String,           // Unique QR code token
  expiresAt: Date,           // Session expiry time
  isActive: Boolean,
  attendees: [{
    student: ObjectId,
    markedAt: Date,
    deviceId: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  createdAt: Date
}
```

### AttendanceRecord Model
```javascript
{
  student: ObjectId,
  class: ObjectId,
  session: ObjectId,
  date: Date,
  status: String,            // 'present' | 'absent' | 'late'
  markedAt: Date,
  markedBy: String,          // 'qr' | 'manual'
  deviceId: String
}
```

---

## API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "token": "jwt_token_here",
  "user": { "id", "name", "email", "role", ... }
}
```

#### Register Student
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "rollNumber": "CSE2021001",
  "department": "Computer Science & Engineering",
  "semester": 5,
  "section": "A"
}
```

---

### Admin Routes

All admin routes require JWT token with admin role.

#### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/departments` | List all departments |
| POST | `/admin/departments` | Create department |
| PUT | `/admin/departments/:id` | Update department |
| DELETE | `/admin/departments/:id` | Delete department |

#### Sections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/sections` | List all sections |
| POST | `/admin/sections` | Create section |
| PUT | `/admin/sections/:id` | Update section |
| DELETE | `/admin/sections/:id` | Delete section |

#### Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/courses` | List courses (filter by dept/semester) |
| POST | `/admin/courses` | Create course |
| PUT | `/admin/courses/:id` | Update course |
| DELETE | `/admin/courses/:id` | Delete course |

**Query Parameters for GET /admin/courses:**
- `department` - Filter by department ID
- `semester` - Filter by semester (1-8)

#### Faculty Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/faculty` | List all faculty |
| POST | `/admin/faculty` | Create faculty account |
| GET | `/admin/faculty-schedule/:facultyId` | Get faculty schedule |
| POST | `/admin/faculty-schedule/:facultyId` | Add schedule slot |
| DELETE | `/admin/faculty-schedule/:facultyId/:day/:slotIndex` | Remove slot |

**Add Schedule Slot Request:**
```json
{
  "day": "monday",
  "slot": {
    "courseCode": "CS-301",
    "courseName": "Data Structures",
    "department": "Computer Science & Engineering",
    "semester": 3,
    "section": "A",
    "startTime": "09:00",
    "endTime": "10:00"
  }
}
```

#### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/students` | List all students |
| GET | `/admin/students/:id` | Get student details |
| PUT | `/admin/students/:id` | Update student |
| DELETE | `/admin/students/:id` | Delete student |

#### Classes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/classes` | List all classes |
| POST | `/admin/classes` | Create class |
| PUT | `/admin/classes/:id` | Update class |
| DELETE | `/admin/classes/:id` | Delete class |

---

### Faculty Routes

All faculty routes require JWT token with faculty role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/faculty/classes` | Get faculty's classes |
| GET | `/faculty/my-schedule` | Get weekly schedule |
| GET | `/faculty/timetable` | Get timetable data |
| POST | `/faculty/auto-session` | Start attendance session |
| POST | `/faculty/end-session/:sessionId` | End session |
| GET | `/faculty/attendance/:classId` | Get attendance records |

**Start Auto Session Request:**
```json
{
  "courseCode": "CS-301",
  "courseName": "Data Structures",
  "department": "Computer Science & Engineering",
  "semester": 3,
  "section": "A"
}
```

**Response:**
```json
{
  "id": "session_id",
  "qrToken": "unique_qr_token",
  "className": "CS-301 - Data Structures",
  "expiresAt": "2025-12-24T10:00:00.000Z",
  "existing": false
}
```

---

### Student Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/profile` | Get student profile |
| POST | `/student/mark-attendance` | Mark attendance via QR |
| GET | `/student/attendance` | Get attendance history |
| GET | `/student/timetable` | Get class timetable |

**Mark Attendance Request:**
```json
{
  "qrToken": "scanned_qr_token",
  "deviceId": "device_unique_id",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

---

### Analytics Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/overview` | Dashboard statistics |
| GET | `/analytics/attendance-trends` | Attendance trends |
| GET | `/analytics/department-wise` | Department statistics |

---

## User Roles & Features

### Admin Features
1. **Dashboard**
   - Overview statistics
   - Recent activities
   - Quick actions

2. **Manage Departments**
   - Create/Edit/Delete departments
   - View department details

3. **Manage Sections**
   - Create sections per department/semester
   - Set student capacity

4. **Manage Courses**
   - Add courses by department and semester
   - Course codes, credits, descriptions

5. **Manage Faculty**
   - Create faculty accounts
   - Assign schedules (timetable)
   - View faculty workload

6. **Manage Students**
   - View/Edit student records
   - Generate roll numbers
   - Import/Export data

7. **Timetable Management**
   - Create weekly schedules
   - Assign faculty to time slots
   - Prevent duplicate assignments

8. **Reports & Analytics**
   - Attendance reports
   - Department-wise analysis
   - Export capabilities

---

### Faculty Features
1. **Dashboard**
   - Today's classes
   - My assigned classes (full week)
   - Active session panel
   - Quick statistics

2. **Start Attendance Session**
   - One-click session start from dashboard
   - QR code generation
   - Real-time attendance counter
   - Enlarge QR for projection
   - End session button

3. **View Attendance**
   - Filter by class/date
   - Attendance reports
   - Export to CSV

4. **Time Table**
   - Weekly schedule view
   - Class details

5. **Profile**
   - View/Update profile
   - Change password

---

### Student Features
1. **Dashboard**
   - Attendance summary
   - Today's classes
   - Recent attendance

2. **Mark Attendance**
   - Scan QR code
   - Device verification
   - Location tracking (optional)

3. **View Attendance**
   - Subject-wise attendance
   - Attendance percentage
   - Calendar view

4. **Time Table**
   - Weekly schedule

5. **Profile**
   - Personal details
   - Roll number
   - Department info

---

## Installation & Setup

### Prerequisites
- Node.js v14+ 
- MongoDB v4+
- npm or yarn

### Step 1: Clone/Download Project
```bash
cd Smart
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Environment
Create `backend/config/env.js`:
```javascript
module.exports = {
  PORT: 5000,
  MONGODB_URI: 'mongodb://localhost:27017/smart_attendance',
  JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: '7d',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
  EMAIL_USER: 'your-email@gmail.com',
  EMAIL_PASS: 'your-app-password'
};
```

### Step 4: Start MongoDB
```bash
mongod
```

### Step 5: Create Admin Account
```bash
cd backend
node scripts/createAdmin.js
```
Default credentials:
- Email: admin@smart.edu
- Password: admin123

### Step 6: Start Server
```bash
node server.js
```
Server runs at: `http://localhost:5000`

### Step 7: Access Application
- Login Page: `http://localhost:5000`
- Admin Dashboard: `http://localhost:5000/admin.html`
- Faculty Dashboard: `http://localhost:5000/faculty.html`
- Student Dashboard: `http://localhost:5000/student.html`

---

## File Structure

```
Smart/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── email.js           # Email configuration
│   │   └── env.js             # Environment variables
│   │
│   ├── controllers/
│   │   ├── adminController.js  # Admin logic
│   │   ├── analyticsController.js
│   │   ├── authController.js   # Authentication
│   │   ├── facultyController.js
│   │   └── studentController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── errorHandler.js     # Global error handler
│   │
│   ├── models/
│   │   ├── AttendanceRecord.js
│   │   ├── AttendanceSession.js
│   │   ├── Class.js
│   │   ├── Course.js
│   │   ├── Department.js
│   │   ├── FacultySchedule.js
│   │   ├── Section.js
│   │   ├── TimeTable.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── facultyRoutes.js
│   │   └── studentRoutes.js
│   │
│   ├── scripts/
│   │   ├── createAdmin.js      # Create admin user
│   │   ├── createFaculty.js    # Create test faculty
│   │   ├── generateRollNumbers.js
│   │   ├── generateTimetables.js
│   │   └── seedDatabase.js     # Seed test data
│   │
│   ├── utils/
│   │   ├── jwt.js              # JWT helpers
│   │   └── mailer.js           # Email utilities
│   │
│   ├── package.json
│   └── server.js               # Entry point
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css      # Global styles
│   │   │
│   │   └── js/
│   │       ├── admin.js        # Admin dashboard logic
│   │       ├── api.js          # API helper functions
│   │       ├── auth.js         # Authentication helpers
│   │       ├── faculty.js      # Faculty dashboard logic
│   │       └── student.js      # Student dashboard logic
│   │
│   ├── index.html              # Login page
│   ├── admin.html              # Admin dashboard
│   ├── faculty.html            # Faculty dashboard
│   └── student.html            # Student dashboard
│
└── PROJECT_DOCUMENTATION.md    # This file
```

---

## Workflow Guide

### Admin Workflow

```
1. LOGIN as Admin
       │
       ▼
2. CREATE DEPARTMENTS
   (CSE, IT, ECE, etc.)
       │
       ▼
3. CREATE SECTIONS
   (Per department & semester)
       │
       ▼
4. CREATE COURSES
   (Per department & semester)
       │
       ▼
5. CREATE FACULTY ACCOUNTS
       │
       ▼
6. ASSIGN SCHEDULES TO FACULTY
   (Select faculty → Add time slots with courses)
       │
       ▼
7. STUDENTS REGISTER
   (Self-registration or admin creation)
       │
       ▼
8. MONITOR & REPORTS
```

### Faculty Workflow

```
1. LOGIN as Faculty
       │
       ▼
2. VIEW DASHBOARD
   - See "Today's Classes"
   - See "My Assigned Classes" (full week)
       │
       ▼
3. CLICK "📝 Start" on a class
       │
       ▼
4. QR CODE APPEARS in dashboard
   - Session info displayed
   - Present/Absent counter
       │
       ▼
5. STUDENTS SCAN QR CODE
   (Real-time updates)
       │
       ▼
6. CLICK "End Session" when done
       │
       ▼
7. VIEW ATTENDANCE REPORTS
   - Filter by date/class
   - Export CSV
```

### Student Workflow

```
1. REGISTER / LOGIN
       │
       ▼
2. VIEW DASHBOARD
   - Attendance summary
   - Today's classes
       │
       ▼
3. WHEN CLASS STARTS:
   Faculty shows QR code
       │
       ▼
4. SCAN QR CODE
   (Using phone camera / app)
       │
       ▼
5. ATTENDANCE MARKED
   - Confirmation shown
   - Device ID recorded
       │
       ▼
6. VIEW ATTENDANCE HISTORY
   - Subject-wise percentage
   - Detailed records
```

---

## Security Features

1. **JWT Authentication** - Secure token-based auth
2. **Password Hashing** - bcrypt with salt rounds
3. **Role-based Access** - Middleware protection
4. **Device Binding** - Prevent proxy attendance
5. **Session Expiry** - QR tokens expire automatically
6. **Input Validation** - Server-side validation

---

## Future Enhancements

- [ ] Mobile App (React Native / Flutter)
- [ ] Face Recognition
- [ ] Geofencing for location verification
- [ ] Push Notifications
- [ ] Biometric Authentication
- [ ] Advanced Analytics Dashboard
- [ ] Bulk Import/Export (Excel)
- [ ] Email/SMS Alerts for low attendance
- [ ] Parent Portal
- [ ] Integration with LMS

---

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Start MongoDB service
```bash
mongod
```

**2. JWT Token Invalid**
```
Error: jwt malformed
```
Solution: Clear localStorage and login again

**3. Port Already in Use**
```
Error: EADDRINUSE: address already in use :::5000
```
Solution: Kill existing process or change port in env.js

**4. CORS Errors**
Solution: Ensure frontend and backend on same origin or configure CORS

---

## Contact & Support

For issues or questions, check:
1. Console logs (browser & server)
2. Network tab in DevTools
3. MongoDB logs

---

**Version:** 1.0.0  
**Last Updated:** December 24, 2025
