# 📚 Smart Attendance System (Hindi README)

Yeh repository ek Smart Attendance System ka source code hai jisme face-recognition aur ML-based features integrated hain. Neeche wale README ka maksad aapke liye (aur ChatGPT ko samjhaane ke liye) project ka concise aur clear overview dena hai — kya hai, kaise chalana hai, aur kaunse important files dekhni chahiye.

## 1) Project ka Short Description (परिचय)
- Purpose: Educational institutions ke liye attendance management — QR aur facial recognition dono supported. Faculty, students aur admin ke liye role-based access, analytics aur ML predictions (e.g., attendance shortage prediction) maujood hain.

## 2) Tech Stack
- Backend: Node.js + Express (`backend/server.js`)
- Database: MongoDB (Mongoose models under `backend/models`)
- ML / Face recognition: Python (Flask scripts / services in `ml/` and `backend/ml/`)
- Frontend: Static HTML/CSS/JS in `frontend/`
- Auth: JWT + bcrypt

## 3) High-level Architecture
- Frontend (browser) → Express REST API (`/api/*`) → MongoDB
- Face-recognition service (Python) ko backend HTTP client se call kiya jata hai (face register / verify)
- ML training & prediction scripts available under `ml/`

## 4) Jaldi Start Karne ke Steps (Windows / PowerShell)

1) Backend setup
```powershell
cd Smart\backend
npm install
copy .env.example .env   # ya manually environment variables set karein
npm start
```

2) ML service (Python)
```powershell
cd Smart\ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

3) Frontend
- Backend static serve karta hai frontend pages; agar local file se dekhna ho toh `frontend/index.html` browser me open karein.

Note: Agar backend `server.js` khud ML service ko spawn nahi karta, toh ML service alag terminal me chalayein aur `backend/.env` me uska URL set karein.

## 5) Important Files / Locations (Quick reference)
- Backend entry: `backend/server.js`
- DB config: `backend/config/db.js`
- Models: `backend/models/` (e.g., `User.js`, `AttendanceRecord.js`)
- Routes: `backend/routes/` (authRoutes, mlRoutes, adminRoutes, facultyRoutes, studentRoutes)
- Controllers: `backend/controllers/` (authController.js, mlController.js, studentController.js)
- ML service (Python): `ml/app.py`, `ml/train_model.py`
- Backend ML helper: `backend/ml/face_recognition_service.py` (agar present)
- Frontend pages: `frontend/index.html`, `frontend/admin.html`, JS in `frontend/assets/js/`

## 6) Key Environment Variables (check `backend/.env` or root `.env`)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `ML_SERVICE_URL` — Face/ML service base URL
- `SMTP_*` — Email config (agar notifications use ho rahi hain)

## 7) Common API prefixes (for testing / debugging)
- `/api/auth/*`
- `/api/admin/*`
- `/api/faculty/*`
- `/api/student/*`
- `/api/ml/*`

## 8) Kaise ChatGPT ko samjhaana hai (Suggested Hindi prompts)

- Project overview (short):
	- "Mera project `Smart` hai — backend Express (`backend/server.js`), frontend static (`frontend/`), ML service Python (`ml/app.py`). Main chahunga ke tu project structure samjhe aur batae kaunse files main dekhun agar JWT login error aaye."

- Bug/trace debugging:
	- "Mujhe `backend/server.js` run karte waqt yeh error mil rahi hai: <error text>. Main `backend/.env` me MONGO_URI set kar chuka hoon. Konsi file sabse pehle check karni chahiye?"

- Feature request:
	- "Mujhe attendance export CSV feature add karna hai. Suggest backend route, controller function aur frontend change. Show code snippet for `backend/controllers/attendanceController.js`."

Include hamesha jab ChatGPT se pucho:
- Repo root path (Smart), commands jo aapne run kiye (example: `npm start`), aur exact error stacktrace (agar koi error hai).

## 9) Notes / Tips
- Agar koi dependency missing ho toh `npm install` inside `backend/` aur `pip install -r ml/requirements.txt` inside `ml/` run karein.
- ML ke liye OpenCV / dlib type native dependencies platform-specific ho sakte hain — Windows pe wheels ya Visual Studio Build Tools ki zarurat padh sakti hai.

---

Agar aap chahoon, main yeh README repository root me save kar raha hoon (update ho chuka). Agla step: kya main `README.md` me aur detailed API docs (endpoints + request/response examples) add kar doon?

## ✨ Features
- Role-based authentication (Admin, Faculty, Student)
- QR code-based attendance system
- 🤖 Facial recognition attendance using Machine Learning
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

# Start Python ML service
python ml/face_recognition_service.py &

# Start Node.js server
npm run dev
```

## 🤖 AI Features
- **Facial Recognition**: Students can register their face and mark attendance using facial recognition.

git clone <repository-url>
cd Smart
cd backend
npm install
npm run dev
```

## 👨‍💻 Author
Developed as a full-stack MERN project.
