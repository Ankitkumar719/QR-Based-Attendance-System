# 📚 Smart Attendance System with ML Integration

A modern, web-based attendance management system designed for educational institutions. This system enables faculty to mark student attendance using QR codes or facial recognition and provides real-time tracking along with comprehensive analytics for administrators.

## ✨ Features
- Role-based authentication (Admin, Faculty, Student)
- QR code-based attendance system
- 🤖 Facial recognition attendance using Machine Learning
- 🤖 AI Chat Assistant powered by ChatGPT
- Real-time attendance tracking
- Analytics dashboard and reports
- Email notifications

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js, Python (Flask for ML)
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Frontend**: HTML, CSS, JavaScript
- **ML**: OpenCV, face-recognition library
- **Charts**: Chart.js, QRious

## 🚀 Setup

### Prerequisites
- Node.js
- Python 3.x
- MongoDB

### Installation
```bash
git clone <repository-url>
cd Smart
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies for ML
pip install opencv-python face-recognition flask

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start Python ML service
python ml/face_recognition_service.py &

# Start Node.js server
npm run dev
```

## 🤖 AI Features
- **Facial Recognition**: Students can register their face and mark attendance using facial recognition.
- **AI Chat Assistant**: Get help with attendance queries, system usage, and troubleshooting powered by ChatGPT.

### Setting up OpenAI API
1. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
git clone <repository-url>
cd Smart
cd backend
npm install
npm run dev
```

## 👨‍💻 Author
Developed as a full-stack MERN project.
