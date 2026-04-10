# 📚 Smart Attendance System

A modern, web-based QR code attendance management system designed for educational institutions. This system enables faculty to mark student attendance using QR codes and provides comprehensive analytics for administrators.

## ✨ Features

### 🔐 Authentication & Authorization
- Role-based access control (Admin, Faculty, Student)
- Secure JWT authentication
- Email-based login system
- Password hashing with bcryptjs

### 📱 Attendance Tracking
- QR code generation and scanning
- Real-time attendance marking
- Session-based attendance management
- Attendance history and records

### 👥 User Management
- Three user roles: Admin, Faculty, Student
- Department and section management
- Faculty schedule assignment
- Student enrollment tracking

### 📊 Analytics & Reports
- Real-time attendance dashboards
- Comprehensive attendance reports
- Department-wise analytics
- CSV export functionality

### 📅 Schedule Management
- Faculty timetable management
- Course scheduling
- Section-wise class scheduling
- Automated session creation

### 📧 Notifications
- Email notifications via Nodemailer
- Attendance alerts
- System notifications

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web application framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB object modeling |
| **JWT** | Secure token authentication |
| **bcryptjs** | Password hashing |
| **Nodemailer** | Email service |
| **Socket.io** | Real-time communication |
| **CORS** | Cross-origin resource sharing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **HTML5** | Page structure |
| **CSS3** | Styling and responsive design |
| **Vanilla JavaScript** | Client-side interactivity |
| **Chart.js** | Data visualization |
| **QRious** | QR code generation |

---

## 📁 Project Structure

```
Smart/
├── backend/
│   ├── config/              # Configuration files
│   │   ├── db.js           # MongoDB connection
│   │   ├── email.js        # Email configuration
│   │   └── env.js          # Environment variables
│   ├── controllers/         # Request handlers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── facultyController.js
│   │   ├── studentController.js
│   │   └── analyticsController.js
│   ├── models/             # MongoDB schemas
│   │   ├── User.js
│   │   ├── Class.js
│   │   ├── Department.js
│   │   ├── AttendanceSession.js
│   │   └── AttendanceRecord.js
│   ├── routes/             # API route definitions
│   ├── middleware/         # Custom middleware
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── utils/              # Utility functions
│   ├── scripts/            # Helper scripts
│   ├── server.js           # Entry point
│   ├── package.json        # Dependencies
│   └── .env                # Environment variables
│
├── frontend/
│   ├── index.html          # Login page
│   ├── admin.html          # Admin dashboard
│   ├── faculty.html        # Faculty dashboard
│   ├── student.html        # Student dashboard
│   ├── session.html        # Session management
│   ├── assets/             # CSS, JavaScript, images
│   └── start-https.js      # HTTPS server for frontend
│
├── README.md               # This file
├── PROJECT_DOCUMENTATION.md
├── DATA_FLOW.md
└── start-server.ps1        # PowerShell startup script
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Smart
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Configure environment variables
# Edit .env with your MongoDB URI, email config, etc.
nano .env
```

### Step 3: MongoDB Configuration
Ensure MongoDB is running on your system. Update the `MONGO_URI` in `.env`:
```
MONGO_URI=mongodb://localhost:27017/smart-attendance
```

### Step 4: Email Configuration
Configure email settings in `.env`:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Step 5: Start the Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000` (or your configured port)

### Step 6: Frontend Setup
Open the frontend files in a modern web browser or serve them using the provided HTTPS server:

```bash
# From the frontend directory
node start-https.js
```

---

## 📝 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/smart-attendance

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
ADMIN_EMAIL=admin@institution.edu

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

---

## 🔄 Usage Guide

### Admin Dashboard
1. Login with admin credentials
2. Manage departments, sections, and courses
3. Assign faculty to schedules
4. View attendance analytics
5. Generate reports

### Faculty Dashboard
1. Login with faculty credentials
2. View assigned classes and schedule
3. Create attendance sessions
4. Generate QR codes for students
5. View attendance records

### Student Dashboard
1. Login with student credentials
2. View enrolled classes
3. Scan QR codes for attendance
4. Check attendance history
5. Download attendance reports

---

## 🔑 Key Features Explained

### QR Code Attendance
- Faculty generates unique QR codes for each session
- Students scan QR codes to mark attendance
- Real-time attendance updates
- Session expiry prevents unauthorized marking

### Role-Based Access
- **Admin**: Full system control, analytics, user management
- **Faculty**: Schedule management, session creation, attendance marking
- **Student**: View classes, mark attendance, check records

### Analytics & Reporting
- Department-wise attendance statistics
- Faculty performance metrics
- Student attendance trends
- CSV export for further analysis

---

## 🔐 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Stateless, secure token-based auth
- **CORS Configuration**: Prevents unauthorized cross-origin requests
- **Role-Based Authorization**: Access control at route level
- **Environment Variables**: Sensitive data in .env files

---

## 📊 Database Schema

The system uses MongoDB with the following main collections:

- **Users**: Stores user information (admins, faculty, students)
- **Departments**: Educational departments
- **Classes**: Class/section information
- **FacultySchedules**: Faculty assignment to classes
- **AttendanceSessions**: QR-based attendance sessions
- **AttendanceRecords**: Individual attendance marks

See `PROJECT_DOCUMENTATION.md` for detailed schema information.

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure MongoDB service is running
```bash
# Windows
net start MongoDB

# Linux/Mac
brew services start mongodb-community
```

### Port Already in Use
**Solution**: Change the PORT in `.env` or kill existing process
```bash
# Find process on port 5000
lsof -i :5000
```

### CORS Errors
**Solution**: Verify `CORS_ORIGIN` in `.env` matches your frontend URL

### Email Not Sending
**Solution**: Check email credentials and enable "Less secure app access" for Gmail

---

## 📚 API Documentation

Refer to `PROJECT_DOCUMENTATION.md` for complete API endpoint documentation.

### Base URL
```
http://localhost:5000/api
```

### Example Endpoints
- `POST /auth/login` - User login
- `GET /admin/departments` - Get all departments
- `POST /faculty/session` - Create attendance session
- `POST /student/attend` - Mark attendance

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

---

## 📄 Documentation

- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - Comprehensive system documentation
- [DATA_FLOW.md](DATA_FLOW.md) - Detailed data flow diagrams
- [start-server.ps1](start-server.ps1) - PowerShell startup script

---

## 🐳 Docker Support (Optional)

Coming soon! Docker configuration for easier deployment.

---

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

## 📜 License

This project is developed for educational purposes. All rights reserved.

---

## 👥 Team

Developed as an academic project for Smart Attendance System.

---

## 🎯 Future Enhancements

- [ ] Mobile app integration
- [ ] Biometric attendance
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] SMS notifications
- [ ] Docker containerization
- [ ] Automated backup system
- [ ] Attendance prediction using ML

---

**Last Updated**: April 2026  
**Version**: 1.0.0
