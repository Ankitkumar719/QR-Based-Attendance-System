# Smart Attendance System - Complete Data Flow

## Table of Contents
1. [Authentication Flow](#1-authentication-flow)
2. [Admin Setup Flow](#2-admin-setup-flow)
3. [Faculty Schedule Assignment Flow](#3-faculty-schedule-assignment-flow)
4. [Attendance Session Flow](#4-attendance-session-flow)
5. [Student Attendance Marking Flow](#5-student-attendance-marking-flow)
6. [Reporting Flow](#6-reporting-flow)

---

## 1. Authentication Flow

### 1.1 User Login

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOGIN FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────┘

  USER                    FRONTEND                   BACKEND                 DATABASE
   │                         │                          │                       │
   │  Enter email/password   │                          │                       │
   ├────────────────────────>│                          │                       │
   │                         │                          │                       │
   │                         │  POST /auth/login        │                       │
   │                         │  {email, password}       │                       │
   │                         ├─────────────────────────>│                       │
   │                         │                          │                       │
   │                         │                          │  Find user by email   │
   │                         │                          ├──────────────────────>│
   │                         │                          │                       │
   │                         │                          │  User document        │
   │                         │                          │<──────────────────────┤
   │                         │                          │                       │
   │                         │                          │  Compare password     │
   │                         │                          │  (bcrypt.compare)     │
   │                         │                          │                       │
   │                         │                          │  Generate JWT token   │
   │                         │                          │  (user.id + role)     │
   │                         │                          │                       │
   │                         │  {token, user}           │                       │
   │                         │<─────────────────────────┤                       │
   │                         │                          │                       │
   │                         │  Store in localStorage:  │                       │
   │                         │  - token                 │                       │
   │                         │  - user object           │                       │
   │                         │                          │                       │
   │                         │  Redirect based on role: │                       │
   │                         │  - admin → admin.html    │                       │
   │                         │  - faculty → faculty.html│                       │
   │                         │  - student → student.html│                       │
   │  Dashboard loaded       │                          │                       │
   │<────────────────────────┤                          │                       │
   │                         │                          │                       │

```

### 1.2 JWT Token Structure

```javascript
// Token Payload
{
  "id": "user_mongo_id",
  "role": "admin|faculty|student",
  "iat": 1735000000,        // Issued at
  "exp": 1735604800         // Expires (7 days)
}

// Token stored in localStorage
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIs...');
localStorage.setItem('user', JSON.stringify({
  id: "...",
  name: "John Doe",
  email: "john@example.com",
  role: "faculty",
  department: "Computer Science & Engineering"
}));
```

### 1.3 API Request with Authentication

```
  FRONTEND                           BACKEND
     │                                  │
     │  GET /faculty/my-schedule        │
     │  Headers: {                      │
     │    Authorization: Bearer <token> │
     │  }                               │
     ├─────────────────────────────────>│
     │                                  │
     │                    ┌─────────────┴─────────────┐
     │                    │    authMiddleware.js      │
     │                    │                           │
     │                    │  1. Extract token         │
     │                    │  2. jwt.verify(token)     │
     │                    │  3. Attach user to req    │
     │                    │  4. Check role if needed  │
     │                    └─────────────┬─────────────┘
     │                                  │
     │                                  │  req.user = { id, role }
     │                                  │
     │                                  ▼
     │                           Controller Logic
     │                                  │
     │  Response data                   │
     │<─────────────────────────────────┤
```

---

## 2. Admin Setup Flow

### 2.1 Creating Department → Section → Course Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADMIN INITIAL SETUP FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                         STEP 1: CREATE DEPARTMENT
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                                                                          │
  │   Admin                    Frontend                    Backend           │
  │     │                         │                           │              │
  │     │  Fill department form   │                           │              │
  │     │  - name: "CSE"          │                           │              │
  │     │  - code: "CSE"          │                           │              │
  │     ├────────────────────────>│                           │              │
  │     │                         │                           │              │
  │     │                         │  POST /admin/departments  │              │
  │     │                         │  {name, code, description}│              │
  │     │                         ├──────────────────────────>│              │
  │     │                         │                           │              │
  │     │                         │                           │  ┌─────────┐ │
  │     │                         │                           │  │MongoDB  │ │
  │     │                         │                           │  │         │ │
  │     │                         │                           │  │Create   │ │
  │     │                         │                           │  │Document │ │
  │     │                         │                           │  └────┬────┘ │
  │     │                         │                           │       │      │
  │     │                         │  {_id: "dept_123", ...}   │<──────┘      │
  │     │                         │<──────────────────────────┤              │
  │     │                         │                           │              │
  │     │  Department created     │                           │              │
  │     │<────────────────────────┤                           │              │
  │                                                                          │
  └──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         STEP 2: CREATE SECTIONS
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                                                                          │
  │   Admin                    Frontend                    Backend           │
  │     │                         │                           │              │
  │     │  Select department      │                           │              │
  │     │  Select semester: 3     │                           │              │
  │     │  Section name: "A"      │                           │              │
  │     ├────────────────────────>│                           │              │
  │     │                         │                           │              │
  │     │                         │  POST /admin/sections     │              │
  │     │                         │  {                        │              │
  │     │                         │    department: "dept_123",│              │
  │     │                         │    semester: 3,           │              │
  │     │                         │    name: "A"              │              │
  │     │                         │  }                        │              │
  │     │                         ├──────────────────────────>│              │
  │     │                         │                           │              │
  │     │                         │  Section created          │              │
  │     │                         │<──────────────────────────┤              │
  │                                                                          │
  └──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         STEP 3: CREATE COURSES
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                                                                          │
  │   Admin                    Frontend                    Backend           │
  │     │                         │                           │              │
  │     │  Select department      │                           │              │
  │     │  Select semester: 3     │                           │              │
  │     │  Course code: "CS-301"  │                           │              │
  │     │  Course name: "DS"      │                           │              │
  │     ├────────────────────────>│                           │              │
  │     │                         │                           │              │
  │     │                         │  POST /admin/courses      │              │
  │     │                         │  {                        │              │
  │     │                         │    department: "dept_123",│              │
  │     │                         │    semester: 3,           │              │
  │     │                         │    courseCode: "CS-301",  │              │
  │     │                         │    courseName: "Data Str" │              │
  │     │                         │  }                        │              │
  │     │                         ├──────────────────────────>│              │
  │     │                         │                           │              │
  │     │                         │                    ┌──────┴──────┐       │
  │     │                         │                    │ Check for   │       │
  │     │                         │                    │ duplicate   │       │
  │     │                         │                    │ course code │       │
  │     │                         │                    │ in same dept│       │
  │     │                         │                    └──────┬──────┘       │
  │     │                         │                           │              │
  │     │                         │  Course created           │              │
  │     │                         │<──────────────────────────┤              │
  │                                                                          │
  └──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Database State After Setup

```javascript
// departments collection
{
  _id: ObjectId("dept_123"),
  name: "Computer Science & Engineering",
  code: "CSE",
  isActive: true
}

// sections collection  
{
  _id: ObjectId("sec_456"),
  name: "A",
  department: ObjectId("dept_123"),
  semester: 3,
  isActive: true
}

// courses collection
{
  _id: ObjectId("course_789"),
  courseCode: "CS-301",
  courseName: "Data Structures",
  department: ObjectId("dept_123"),
  semester: 3,
  credits: 4,
  isActive: true
}
```

---

## 3. Faculty Schedule Assignment Flow

### 3.1 Admin Creates Faculty & Assigns Schedule

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FACULTY SCHEDULE ASSIGNMENT FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

  ADMIN                      FRONTEND                     BACKEND
    │                           │                            │
    │  Navigate to Timetable    │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  GET /admin/faculty        │
    │                           ├───────────────────────────>│
    │                           │                            │
    │                           │  [{id, name, department}]  │
    │                           │<───────────────────────────┤
    │                           │                            │
    │  Select Faculty:          │                            │
    │  "Dr. Smith"              │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  GET /admin/faculty-schedule/fac_123
    │                           ├───────────────────────────>│
    │                           │                            │
    │                           │  {schedule: {monday:[], ...}}
    │                           │<───────────────────────────┤
    │                           │                            │
    │  Display current schedule │                            │
    │<──────────────────────────┤                            │
    │                           │                            │
    │                           │                            │
    │  ADD NEW SLOT:            │                            │
    │  - Day: Monday            │                            │
    │  - Time: 09:00-10:00      │                            │
    │  - Course: CS-301         │                            │
    │  - Section: CSE Sem3 A    │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  POST /admin/faculty-schedule/fac_123
    │                           │  {                         │
    │                           │    day: "monday",          │
    │                           │    slot: {                 │
    │                           │      courseCode: "CS-301", │
    │                           │      courseName: "DS",     │
    │                           │      department: "CSE",    │
    │                           │      semester: 3,          │
    │                           │      section: "A",         │
    │                           │      startTime: "09:00",   │
    │                           │      endTime: "10:00"      │
    │                           │    }                       │
    │                           │  }                         │
    │                           ├───────────────────────────>│
    │                           │                            │
    │                           │               ┌────────────┴────────────┐
    │                           │               │  DUPLICATE CHECK:       │
    │                           │               │                         │
    │                           │               │  Check if same slot     │
    │                           │               │  exists with:           │
    │                           │               │  - Same courseCode      │
    │                           │               │  - Same startTime       │
    │                           │               │  - Same endTime         │
    │                           │               │  - Same section         │
    │                           │               │  on the same day        │
    │                           │               │                         │
    │                           │               │  If duplicate → Error   │
    │                           │               │  If unique → Add slot   │
    │                           │               └────────────┬────────────┘
    │                           │                            │
    │                           │  Slot added successfully   │
    │                           │<───────────────────────────┤
    │                           │                            │
    │  Schedule updated         │                            │
    │<──────────────────────────┤                            │
```

### 3.2 FacultySchedule Document Structure

```javascript
// facultyschedules collection
{
  _id: ObjectId("sched_001"),
  faculty: ObjectId("fac_123"),  // Reference to User
  schedule: {
    monday: [
      {
        courseCode: "CS-301",
        courseName: "Data Structures",
        department: "Computer Science & Engineering",
        semester: 3,
        section: "A",
        startTime: "09:00",
        endTime: "10:00"
      },
      {
        courseCode: "CS-302",
        courseName: "Algorithms",
        department: "Computer Science & Engineering",
        semester: 3,
        section: "B",
        startTime: "11:00",
        endTime: "12:00"
      }
    ],
    tuesday: [...],
    wednesday: [...],
    thursday: [...],
    friday: [...],
    saturday: []
  },
  createdAt: ISODate("2025-12-24T00:00:00Z")
}
```

---

## 4. Attendance Session Flow

### 4.1 Faculty Starts Session (One-Click from Dashboard)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ATTENDANCE SESSION START FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

  FACULTY                    FRONTEND                     BACKEND
    │                           │                            │
    │  Login & View Dashboard   │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  GET /faculty/my-schedule  │
    │                           ├───────────────────────────>│
    │                           │                            │
    │                           │  {schedule: {...}}         │
    │                           │<───────────────────────────┤
    │                           │                            │
    │  Dashboard shows:         │                            │
    │  ┌─────────────────────┐  │                            │
    │  │ My Assigned Classes │  │                            │
    │  │                     │  │                            │
    │  │ Mon 09:00 CS-301    │  │                            │
    │  │ [📝 Start]          │  │                            │
    │  │                     │  │                            │
    │  │ Mon 11:00 CS-302    │  │                            │
    │  │ [📝 Start]          │  │                            │
    │  └─────────────────────┘  │                            │
    │<──────────────────────────┤                            │
    │                           │                            │
    │                           │                            │
    │  CLICK "📝 Start"         │                            │
    │  for CS-301               │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  POST /faculty/auto-session│
    │                           │  {                         │
    │                           │    courseCode: "CS-301",   │
    │                           │    courseName: "DS",       │
    │                           │    department: "CSE",      │
    │                           │    semester: 3,            │
    │                           │    section: "A"            │
    │                           │  }                         │
    │                           ├───────────────────────────>│
    │                           │                            │
    │                           │         ┌──────────────────┴──────────────────┐
    │                           │         │  autoStartSession() in Controller   │
    │                           │         │                                     │
    │                           │         │  1. Find or Create Class:           │
    │                           │         │     - Search for existing class     │
    │                           │         │       matching course + section     │
    │                           │         │     - If not found, create new      │
    │                           │         │                                     │
    │                           │         │  2. Check Active Session:           │
    │                           │         │     - Look for unexpired session    │
    │                           │         │       for this class today          │
    │                           │         │     - If exists, return existing    │
    │                           │         │                                     │
    │                           │         │  3. Create New Session:             │
    │                           │         │     - Generate unique qrToken       │
    │                           │         │       (crypto.randomBytes)          │
    │                           │         │     - Set expiresAt (now + 1 hour)  │
    │                           │         │     - Save to AttendanceSession     │
    │                           │         │                                     │
    │                           │         └──────────────────┬──────────────────┘
    │                           │                            │
    │                           │  {                         │
    │                           │    id: "session_abc",      │
    │                           │    qrToken: "xyz789...",   │
    │                           │    className: "CS-301 DS", │
    │                           │    expiresAt: "...",       │
    │                           │    existing: false         │
    │                           │  }                         │
    │                           │<───────────────────────────┤
    │                           │                            │
    │                           │  ┌─────────────────────────┐
    │                           │  │ Generate QR Code        │
    │                           │  │ using QRious library    │
    │                           │  │                         │
    │                           │  │ QR contains: qrToken    │
    │                           │  └─────────────────────────┘
    │                           │                            │
    │  Dashboard shows:         │                            │
    │  ┌─────────────────────┐  │                            │
    │  │ 🔴 Active Session   │  │                            │
    │  │                     │  │                            │
    │  │ CS-301 Data Struct  │  │                            │
    │  │ CSE Sem 3 A         │  │                            │
    │  │                     │  │                            │
    │  │    ┌─────────┐      │  │                            │
    │  │    │ QR CODE │      │  │                            │
    │  │    │  █▀▀█   │      │  │                            │
    │  │    │  █▄▄█   │      │  │                            │
    │  │    └─────────┘      │  │                            │
    │  │                     │  │                            │
    │  │ [🔍 Enlarge] [⏹ End]│  │                            │
    │  │                     │  │                            │
    │  │ ✅ Present: 0       │  │                            │
    │  │ ❌ Absent: 45       │  │                            │
    │  │ 📊 Total: 45        │  │                            │
    │  └─────────────────────┘  │                            │
    │<──────────────────────────┤                            │
```

### 4.2 Database State After Session Creation

```javascript
// classes collection (created if not exists)
{
  _id: ObjectId("class_001"),
  courseCode: "CS-301",
  courseName: "Data Structures",
  department: "Computer Science & Engineering",
  semester: 3,
  section: "A",
  faculty: ObjectId("fac_123"),
  students: [],  // Populated when students register
  createdAt: ISODate("2025-12-24T09:00:00Z")
}

// attendancesessions collection
{
  _id: ObjectId("session_abc"),
  class: ObjectId("class_001"),
  faculty: ObjectId("fac_123"),
  date: ISODate("2025-12-24T00:00:00Z"),
  qrToken: "xyz789abc123def456...",  // 32-byte hex string
  expiresAt: ISODate("2025-12-24T10:00:00Z"),  // 1 hour from start
  isActive: true,
  attendees: [],
  createdAt: ISODate("2025-12-24T09:00:00Z")
}
```

---

## 5. Student Attendance Marking Flow

### 5.1 Student Scans QR & Marks Attendance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STUDENT ATTENDANCE MARKING FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

  STUDENT                    FRONTEND                     BACKEND              DATABASE
    │                           │                            │                    │
    │  See QR code displayed    │                            │                    │
    │  by faculty on screen     │                            │                    │
    │                           │                            │                    │
    │  Open phone camera or     │                            │                    │
    │  QR scanner app           │                            │                    │
    │                           │                            │                    │
    │  Scan QR Code             │                            │                    │
    │  ─────────────────────>   │                            │                    │
    │                           │                            │                    │
    │  QR decoded:              │                            │                    │
    │  "xyz789abc123..."        │                            │                    │
    │                           │                            │                    │
    │  Submit attendance        │                            │                    │
    ├──────────────────────────>│                            │                    │
    │                           │                            │                    │
    │                           │  POST /student/mark-attendance                  │
    │                           │  {                         │                    │
    │                           │    qrToken: "xyz789...",   │                    │
    │                           │    deviceId: "device_001", │                    │
    │                           │    location: {             │                    │
    │                           │      lat: 28.61,           │                    │
    │                           │      lng: 77.20            │                    │
    │                           │    }                       │                    │
    │                           │  }                         │                    │
    │                           ├───────────────────────────>│                    │
    │                           │                            │                    │
    │                           │         ┌──────────────────┴──────────────────┐ │
    │                           │         │  markAttendance() in Controller     │ │
    │                           │         │                                     │ │
    │                           │         │  1. Find session by qrToken         │ │
    │                           │         │     ────────────────────────────────┼─┼─>
    │                           │         │                                     │ │
    │                           │         │     AttendanceSession.findOne({     │ │
    │                           │         │       qrToken: "xyz789...",         │ │
    │                           │         │       isActive: true,               │ │
    │                           │         │       expiresAt: { $gt: now }       │ │
    │                           │         │     })                              │ │
    │                           │         │     <────────────────────────────────┼─┼─
    │                           │         │                                     │ │
    │                           │         │  2. Validate session                │ │
    │                           │         │     - Check if not expired          │ │
    │                           │         │     - Check if active               │ │
    │                           │         │                                     │ │
    │                           │         │  3. Verify student belongs to class │ │
    │                           │         │     - Check department match        │ │
    │                           │         │     - Check semester match          │ │
    │                           │         │     - Check section match           │ │
    │                           │         │                                     │ │
    │                           │         │  4. Check duplicate attendance      │ │
    │                           │         │     - Student already in attendees? │ │
    │                           │         │                                     │ │
    │                           │         │  5. Optional: Device binding        │ │
    │                           │         │     - First time: save deviceId     │ │
    │                           │         │     - Later: verify deviceId match  │ │
    │                           │         │                                     │ │
    │                           │         │  6. Add to attendees array          │ │
    │                           │         │     ────────────────────────────────┼─┼─>
    │                           │         │                                     │ │
    │                           │         │     session.attendees.push({        │ │
    │                           │         │       student: student._id,         │ │
    │                           │         │       markedAt: new Date(),         │ │
    │                           │         │       deviceId: "device_001",       │ │
    │                           │         │       location: {lat, lng}          │ │
    │                           │         │     })                              │ │
    │                           │         │     session.save()                  │ │
    │                           │         │     <────────────────────────────────┼─┼─
    │                           │         │                                     │ │
    │                           │         │  7. Create AttendanceRecord         │ │
    │                           │         │     ────────────────────────────────┼─┼─>
    │                           │         │                                     │ │
    │                           │         │     AttendanceRecord.create({       │ │
    │                           │         │       student: student._id,         │ │
    │                           │         │       class: class._id,             │ │
    │                           │         │       session: session._id,         │ │
    │                           │         │       date: today,                  │ │
    │                           │         │       status: "present",            │ │
    │                           │         │       markedBy: "qr"                │ │
    │                           │         │     })                              │ │
    │                           │         │     <────────────────────────────────┼─┼─
    │                           │         │                                     │ │
    │                           │         └──────────────────┬──────────────────┘ │
    │                           │                            │                    │
    │                           │  {                         │                    │
    │                           │    success: true,          │                    │
    │                           │    message: "Attendance    │                    │
    │                           │              marked!",     │                    │
    │                           │    class: "CS-301 DS",     │                    │
    │                           │    time: "09:15 AM"        │                    │
    │                           │  }                         │                    │
    │                           │<───────────────────────────┤                    │
    │                           │                            │                    │
    │  ✅ Attendance Marked!    │                            │                    │
    │     CS-301 Data Struct    │                            │                    │
    │     Dec 24, 09:15 AM      │                            │                    │
    │<──────────────────────────┤                            │                    │
```

### 5.2 Real-time Update on Faculty Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              REAL-TIME ATTENDANCE UPDATE (Polling Method)                    │
└─────────────────────────────────────────────────────────────────────────────┘

  FACULTY DASHBOARD              BACKEND                    DATABASE
         │                          │                           │
         │  (Every 5 seconds)       │                           │
         │                          │                           │
         │  GET /faculty/session-status/session_abc             │
         ├─────────────────────────>│                           │
         │                          │                           │
         │                          │  AttendanceSession.findById
         │                          ├──────────────────────────>│
         │                          │                           │
         │                          │  {attendees: [5 students]}│
         │                          │<──────────────────────────┤
         │                          │                           │
         │  {                       │                           │
         │    present: 5,           │                           │
         │    absent: 40,           │                           │
         │    total: 45,            │                           │
         │    recentScans: [...]    │                           │
         │  }                       │                           │
         │<─────────────────────────┤                           │
         │                          │                           │
         │  Update UI:              │                           │
         │  ✅ Present: 5           │                           │
         │  ❌ Absent: 40           │                           │
         │  📊 Total: 45            │                           │
         │                          │                           │
```

### 5.3 Database State After Attendance Marking

```javascript
// attendancesessions collection (updated)
{
  _id: ObjectId("session_abc"),
  class: ObjectId("class_001"),
  faculty: ObjectId("fac_123"),
  date: ISODate("2025-12-24"),
  qrToken: "xyz789abc123...",
  expiresAt: ISODate("2025-12-24T10:00:00Z"),
  isActive: true,
  attendees: [
    {
      student: ObjectId("student_001"),
      markedAt: ISODate("2025-12-24T09:15:00Z"),
      deviceId: "device_abc",
      location: { latitude: 28.61, longitude: 77.20 }
    },
    {
      student: ObjectId("student_002"),
      markedAt: ISODate("2025-12-24T09:16:30Z"),
      deviceId: "device_def",
      location: { latitude: 28.61, longitude: 77.20 }
    }
    // ... more students
  ]
}

// attendancerecords collection (individual records)
{
  _id: ObjectId("record_001"),
  student: ObjectId("student_001"),
  class: ObjectId("class_001"),
  session: ObjectId("session_abc"),
  date: ISODate("2025-12-24"),
  status: "present",
  markedAt: ISODate("2025-12-24T09:15:00Z"),
  markedBy: "qr",
  deviceId: "device_abc"
}
```

---

## 6. Reporting Flow

### 6.1 Faculty Views Attendance Report

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ATTENDANCE REPORT FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  FACULTY                    FRONTEND                     BACKEND
    │                           │                            │
    │  Navigate to              │                            │
    │  "View Attendance"        │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │  Select filters:          │                            │
    │  - Branch: CSE            │                            │
    │  - Semester: 3            │                            │
    │  - Section: A             │                            │
    │  - Subject: CS-301        │                            │
    │  - Date: 2025-12-24       │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  GET /faculty/attendance   │
    │                           │  ?department=CSE           │
    │                           │  &semester=3               │
    │                           │  &section=A                │
    │                           │  &courseCode=CS-301        │
    │                           │  &date=2025-12-24          │
    │                           ├───────────────────────────>│
    │                           │                            │
    │                           │         ┌──────────────────┴──────────────────┐
    │                           │         │  Query Pipeline:                    │
    │                           │         │                                     │
    │                           │         │  1. Find Class matching filters     │
    │                           │         │                                     │
    │                           │         │  2. Find AttendanceSession          │
    │                           │         │     for class on date               │
    │                           │         │                                     │
    │                           │         │  3. Get all students in class       │
    │                           │         │                                     │
    │                           │         │  4. For each student:               │
    │                           │         │     - Check if in session.attendees │
    │                           │         │     - Mark present or absent        │
    │                           │         │                                     │
    │                           │         │  5. Calculate statistics            │
    │                           │         │                                     │
    │                           │         └──────────────────┬──────────────────┘
    │                           │                            │
    │                           │  {                         │
    │                           │    class: "CS-301 DS",     │
    │                           │    date: "2025-12-24",     │
    │                           │    totalStudents: 45,      │
    │                           │    present: 38,            │
    │                           │    absent: 7,              │
    │                           │    percentage: 84.4%,      │
    │                           │    students: [             │
    │                           │      {                     │
    │                           │        rollNo: "CSE001",   │
    │                           │        name: "John",       │
    │                           │        status: "present",  │
    │                           │        time: "09:15 AM"    │
    │                           │      },                    │
    │                           │      ...                   │
    │                           │    ]                       │
    │                           │  }                         │
    │                           │<───────────────────────────┤
    │                           │                            │
    │  Display Report:          │                            │
    │  ┌─────────────────────┐  │                            │
    │  │ CS-301 Data Struct  │  │                            │
    │  │ Dec 24, 2025        │  │                            │
    │  │                     │  │                            │
    │  │ Present: 38 (84.4%) │  │                            │
    │  │ Absent: 7           │  │                            │
    │  │                     │  │                            │
    │  │ Roll No  Name   St  │  │                            │
    │  │ CSE001   John   ✅  │  │                            │
    │  │ CSE002   Jane   ✅  │  │                            │
    │  │ CSE003   Bob    ❌  │  │                            │
    │  │ ...                 │  │                            │
    │  │                     │  │                            │
    │  │ [Export CSV]        │  │                            │
    │  └─────────────────────┘  │                            │
    │<──────────────────────────┤                            │
```

### 6.2 Export to CSV Flow

```
  FACULTY                    FRONTEND                     
    │                           │                         
    │  Click "Export CSV"       │                         
    ├──────────────────────────>│                         
    │                           │                         
    │                           │  ┌─────────────────────┐
    │                           │  │ Build CSV string:   │
    │                           │  │                     │
    │                           │  │ Roll No,Name,Status │
    │                           │  │ CSE001,John,Present │
    │                           │  │ CSE002,Jane,Present │
    │                           │  │ CSE003,Bob,Absent   │
    │                           │  │                     │
    │                           │  │ Create Blob         │
    │                           │  │ Create download link│
    │                           │  │ Trigger download    │
    │                           │  └─────────────────────┘
    │                           │                         
    │  📥 attendance_CS301_     │                         
    │     20251224.csv          │                         
    │<──────────────────────────┤                         
```

---

## Complete System Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE SYSTEM OVERVIEW                             │
└─────────────────────────────────────────────────────────────────────────────┘

     ADMIN                    FACULTY                   STUDENT
       │                         │                         │
       │  1. Setup               │                         │
       │  ──────────>            │                         │
       │  • Departments          │                         │
       │  • Sections             │                         │
       │  • Courses              │                         │
       │  • Faculty accounts     │                         │
       │                         │                         │
       │  2. Assign Schedule     │                         │
       │  ──────────────────────>│                         │
       │  • Weekly timetable     │                         │
       │  • Course assignments   │                         │
       │                         │                         │
       │                         │  3. View Schedule       │
       │                         │  <──────────────        │
       │                         │  • My classes           │
       │                         │  • Today's classes      │
       │                         │                         │
       │                         │  4. Start Session       │
       │                         │  ──────────────>        │
       │                         │  • Generate QR          │
       │                         │  • Display code         │
       │                         │                         │
       │                         │                    5. Scan QR
       │                         │                    <─────────
       │                         │                    • Mark attendance
       │                         │                    • Device binding
       │                         │                         │
       │                         │  6. Monitor             │
       │                         │  <──────────────        │
       │                         │  • Real-time count      │
       │                         │  • View attendees       │
       │                         │                         │
       │                         │  7. End Session         │
       │                         │  ──────────────>        │
       │                         │  • Close attendance     │
       │                         │  • Mark absents         │
       │                         │                         │
       │  8. View Reports        │                    8. View History
       │  <──────────            │  <──────────────   <─────────
       │  • Analytics            │  • Class reports   • My attendance
       │  • Department stats     │  • Export CSV      • Percentage
       │                         │                         │
       ▼                         ▼                         ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                         MongoDB                              │
  │                                                              │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
  │  │  Users   │ │ Classes  │ │ Sessions │ │   Records    │   │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
  │  │  Depts   │ │ Sections │ │ Courses  │ │  Schedules   │   │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
  │                                                              │
  └─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR HANDLING                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  Common Errors and Responses:

  1. INVALID QR TOKEN
     ─────────────────
     Student scans expired/invalid QR
     
     Response: {
       success: false,
       error: "Invalid or expired QR code"
     }

  2. SESSION EXPIRED
     ─────────────────
     Session time exceeded (> 1 hour)
     
     Response: {
       success: false,
       error: "Session has expired"
     }

  3. ALREADY MARKED
     ─────────────────
     Student tries to mark twice
     
     Response: {
       success: false,
       error: "Attendance already marked for this session"
     }

  4. DEVICE MISMATCH
     ─────────────────
     Different device than registered
     
     Response: {
       success: false,
       error: "Please use your registered device"
     }

  5. NOT ENROLLED
     ─────────────────
     Student not in this class
     
     Response: {
       success: false,
       error: "You are not enrolled in this class"
     }

  6. UNAUTHORIZED
     ─────────────────
     Invalid or missing JWT token
     
     Response: {
       success: false,
       error: "Unauthorized access"
     }
     → Redirect to login
```

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025
