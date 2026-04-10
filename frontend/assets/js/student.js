import { apiGet, apiPost, ensureAuth } from "./api.js";

const user = ensureAuth(["student"]);

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

const subjectCards = document.getElementById("subjectCards");
const dashboardSummaryCards = document.getElementById("dashboardSummaryCards");
const upcomingClassDetails = document.getElementById("upcomingClassDetails");
const todaySchedule = document.getElementById("todaySchedule");
const profileDetails = document.getElementById("profileDetails");
const qrTokenInput = document.getElementById("qrTokenInput");
const markBtn = document.getElementById("markBtn");
const markMsg = document.getElementById("markMsg");
const timeTable = document.getElementById("timeTable");
const activeSessionsList = document.getElementById("activeSessionsList");
const activeSessionBanner = document.getElementById("activeSessionBanner");
const activeSessionBannerText = document.getElementById("activeSessionBannerText");

document.getElementById('studentDate').valueAsDate = new Date();

// Update welcome banner with user info
function updateWelcomeBanner() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const nameEl = document.getElementById("studentNameDisplay");
  const infoEl = document.getElementById("studentInfoDisplay");
  const dateEl = document.getElementById("currentDateStudent");
  const dayEl = document.getElementById("currentDayStudent");
  
  if (nameEl && storedUser.name) {
    nameEl.textContent = storedUser.name;
  }
  if (infoEl) {
    const dept = storedUser.department || '';
    const sem = storedUser.semester || '';
    const sec = storedUser.section || '';
    infoEl.textContent = `${dept} | Semester ${sem} | Section ${sec}`;
  }
  
  const now = new Date();
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (dayEl) {
    dayEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
  }
}

// View switching
const dashboardBtn = document.getElementById("dashboardBtn");
const markAttendanceBtn = document.getElementById("markAttendanceBtn");
const viewAttendanceBtn = document.getElementById("viewAttendanceBtn");
const timeTableBtn = document.getElementById("timeTableBtn");
const profileBtn = document.getElementById("profileBtn");
const dashboardView = document.getElementById("dashboardView");
const markAttendanceView = document.getElementById("markAttendanceView");
const viewAttendanceView = document.getElementById("viewAttendanceView");
const timeTableView = document.getElementById("timeTableView");
const profileView = document.getElementById("profileView");

dashboardBtn.addEventListener("click", () => switchView("dashboard"));
markAttendanceBtn.addEventListener("click", () => switchView("mark"));
viewAttendanceBtn.addEventListener("click", () => switchView("view"));
timeTableBtn.addEventListener("click", () => switchView("timeTable"));
profileBtn.addEventListener("click", () => switchView("profile"));

// Make switchView accessible globally for button onclick
window.switchView = switchView;

function switchView(view) {
  dashboardView.style.display = "none";
  markAttendanceView.style.display = "none";
  viewAttendanceView.style.display = "none";
  timeTableView.style.display = "none";
  profileView.style.display = "none";
  dashboardBtn.classList.remove("active");
  markAttendanceBtn.classList.remove("active");
  viewAttendanceBtn.classList.remove("active");
  timeTableBtn.classList.remove("active");
  profileBtn.classList.remove("active");

  if (view === "dashboard") {
    dashboardView.style.display = "block";
    dashboardBtn.classList.add("active");
  } else if (view === "mark") {
    markAttendanceView.style.display = "block";
    markAttendanceBtn.classList.add("active");
    loadActiveSessions(); // Load active sessions when view is opened
  } else if (view === "view") {
    viewAttendanceView.style.display = "block";
    viewAttendanceBtn.classList.add("active");
  } else if (view === "timeTable") {
    timeTableView.style.display = "block";
    timeTableBtn.classList.add("active");
  } else if (view === "profile") {
    profileView.style.display = "block";
    profileBtn.classList.add("active");
  }
}

// Load today's attendance verification
async function loadTodayAttendance() {
  const todayAttendanceList = document.getElementById("todayAttendanceList");
  
  try {
    const data = await apiGet("/student/today-attendance");
    
    if (!data.records || data.records.length === 0) {
      todayAttendanceList.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #888;">
          <span style="font-size: 2.5rem;">📭</span>
          <p style="margin-top: 10px;">No attendance sessions today yet.</p>
          <small>Your attendance records will appear here once your faculty starts a session.</small>
        </div>
      `;
      return;
    }
    
    const recordsHTML = data.records.map(record => {
      const statusColor = record.status === 'present' ? '#28a745' : '#dc3545';
      const statusIcon = record.status === 'present' ? '✅' : '❌';
      const statusText = record.status === 'present' ? 'PRESENT' : 'ABSENT';
      
      const markedTime = record.markedAt ? new Date(record.markedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : null;
      
      const sessionTime = new Date(record.sessionStartedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; border-bottom: 1px solid #333; ${record.status === 'present' ? 'background: rgba(40, 167, 69, 0.1);' : ''}">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #fff; font-size: 1rem;">${record.courseCode}</div>
            <div style="color: #aaa; font-size: 0.85rem;">${record.courseName}</div>
            <div style="color: #666; font-size: 0.75rem; margin-top: 5px;">Session started at ${sessionTime}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.5rem;">${statusIcon}</div>
            <div style="color: ${statusColor}; font-weight: bold; font-size: 0.9rem;">${statusText}</div>
            ${markedTime ? `
              <div style="color: #888; font-size: 0.75rem; margin-top: 3px;">
                Marked at ${markedTime}
              </div>
              <div style="color: #666; font-size: 0.7rem; font-family: monospace; margin-top: 2px;">
                ID: ${record.verificationCode}
              </div>
            ` : record.isActive ? `
              <button onclick="switchView('mark')" style="padding: 5px 10px; font-size: 0.75rem; background: #ffc107; color: #000; margin-top: 5px; cursor: pointer;">
                Mark Now →
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    // Summary header
    const summaryHTML = `
      <div style="display: flex; justify-content: space-around; padding: 15px; background: #1a1a1a; border-bottom: 2px solid #333;">
        <div style="text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #28a745;">${data.presentCount}</div>
          <div style="color: #888; font-size: 0.75rem;">Present</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #dc3545;">${data.absentCount}</div>
          <div style="color: #888; font-size: 0.75rem;">Absent</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #17a2b8;">${data.totalSessions}</div>
          <div style="color: #888; font-size: 0.75rem;">Total</div>
        </div>
      </div>
    `;
    
    todayAttendanceList.innerHTML = summaryHTML + recordsHTML;
    
  } catch (error) {
    console.error("Today attendance load error", error);
    todayAttendanceList.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #dc3545;">
        <p>Could not load today's attendance. Please try again.</p>
      </div>
    `;
  }
}

// Make loadTodayAttendance globally accessible
window.loadTodayAttendance = loadTodayAttendance;

async function loadDashboard() {
  try {
    const data = await apiGet("/student/dashboard");
    const summaryCardsHTML = `
        <div class="card"><h3>Overall Attendance</h3><p style="font-size: 2rem; font-weight: bold;">${data.overallPercentage}%</p></div>
        <div class="card"><h3>Total Classes</h3><p style="font-size: 2rem; font-weight: bold;">${data.totalClasses}</p></div>
        <div class="card"><h3>Remaining Classes</h3><p style="font-size: 2rem; font-weight: bold;">${data.remainingClasses}</p></div>
    `;
    dashboardSummaryCards.innerHTML = summaryCardsHTML;

    const subjectCardsHTML = data.subjects.map(subject => `
        <div class="card">
            <h3>${subject.class.courseCode}</h3>
            <p>${subject.class.courseName}</p>
            <p style="font-size: 2rem; font-weight: bold;">${subject.percentage}%</p>
        </div>
    `).join('');
    subjectCards.innerHTML = subjectCardsHTML;
  } catch (error) {
    console.error("Dashboard load error", error);
    dashboardSummaryCards.innerHTML = "<p>Could not load dashboard stats.</p>";
    subjectCards.innerHTML = "<p>Could not load subject details.</p>";
  }
}

// Load active attendance sessions for the student
async function loadActiveSessions() {
  try {
    const sessions = await apiGet("/student/active-sessions");
    
    if (!sessions || sessions.length === 0) {
      activeSessionsList.innerHTML = `
        <p style="color: #888; text-align: center;">
          <span style="font-size: 2rem;">📭</span><br>
          No active attendance sessions at the moment.<br>
          <small>Wait for your faculty to start an attendance session.</small>
        </p>
      `;
      return;
    }
    
    const sessionCardsHTML = sessions.map(session => {
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      const remainingMs = expiresAt - now;
      const remainingMins = Math.max(0, Math.floor(remainingMs / 60000));
      const remainingSecs = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
      
      if (session.alreadyMarked) {
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #1a3d1a; border-left: 4px solid #28a745; border-radius: 8px; margin-bottom: 10px;">
            <div>
              <div style="font-weight: bold; color: #fff; font-size: 1.1rem;">${session.courseCode}</div>
              <div style="color: #aaa; font-size: 0.9rem;">${session.courseName || ''}</div>
            </div>
            <div style="text-align: right;">
              <span style="color: #28a745; font-weight: bold;">✅ Attendance Marked</span>
            </div>
          </div>
        `;
      }
      
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #2d2d2d; border-left: 4px solid #ffc107; border-radius: 8px; margin-bottom: 10px;">
          <div>
            <div style="font-weight: bold; color: #fff; font-size: 1.1rem;">${session.courseCode}</div>
            <div style="color: #aaa; font-size: 0.9rem;">${session.courseName || ''}</div>
            <div style="color: #ffc107; font-size: 0.8rem; margin-top: 5px;">
              ⏰ Expires in: <span class="session-timer" data-expires="${session.expiresAt}">${remainingMins}m ${remainingSecs}s</span>
            </div>
          </div>
          <div style="text-align: right;">
            <button onclick="markSessionAttendance('${session.qrToken}', this)" 
                    style="background: #28a745; padding: 10px 20px; font-size: 1rem; cursor: pointer;">
              📝 Mark Attendance
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    activeSessionsList.innerHTML = sessionCardsHTML;
    
    // Start countdown timers
    startSessionTimers();
    
  } catch (error) {
    console.error("Active sessions load error", error);
    activeSessionsList.innerHTML = `<p style="color: red;">Could not load active sessions. Please try again.</p>`;
  }
}

// Timer update for session expiry countdown
let sessionTimerInterval = null;

function startSessionTimers() {
  // Clear existing interval
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
  }
  
  sessionTimerInterval = setInterval(() => {
    const timers = document.querySelectorAll('.session-timer');
    let anyActive = false;
    
    timers.forEach(timer => {
      const expiresAt = new Date(timer.dataset.expires);
      const now = new Date();
      const remainingMs = expiresAt - now;
      
      if (remainingMs <= 0) {
        timer.textContent = 'Expired';
        timer.style.color = '#dc3545';
        // Reload sessions to refresh the list
        loadActiveSessions();
      } else {
        anyActive = true;
        const remainingMins = Math.floor(remainingMs / 60000);
        const remainingSecs = Math.floor((remainingMs % 60000) / 1000);
        timer.textContent = `${remainingMins}m ${remainingSecs}s`;
      }
    });
    
    if (!anyActive && sessionTimerInterval) {
      clearInterval(sessionTimerInterval);
      sessionTimerInterval = null;
    }
  }, 1000);
}

// Mark attendance for a specific session
window.markSessionAttendance = async function(qrToken, button) {
  const originalText = button.innerHTML;
  button.innerHTML = '⏳ Marking...';
  button.disabled = true;
  
  try {
    await apiPost("/student/mark-attendance", { qrToken });
    button.innerHTML = '✅ Marked!';
    button.style.background = '#28a745';
    
    // Refresh the sessions list and dashboard after a short delay
    setTimeout(async () => {
      await loadActiveSessions();
      await loadDashboard();
      await loadTodayAttendance(); // Refresh verification section
      await checkActiveSessionsForBanner();
    }, 1000);
    
  } catch (err) {
    button.innerHTML = originalText;
    button.disabled = false;
    
    if (err.message.includes('already marked')) {
      alert('Attendance already marked for this session!');
      await loadActiveSessions();
    } else {
      alert(`Error: ${err.message}`);
    }
  }
};

// Check for active sessions and show banner on dashboard
async function checkActiveSessionsForBanner() {
  try {
    const sessions = await apiGet("/student/active-sessions");
    
    // Filter sessions that haven't been marked yet
    const unmarkedSessions = sessions.filter(s => !s.alreadyMarked);
    
    if (unmarkedSessions.length > 0) {
      activeSessionBanner.style.display = 'block';
      if (unmarkedSessions.length === 1) {
        activeSessionBannerText.textContent = `${unmarkedSessions[0].courseCode} - ${unmarkedSessions[0].courseName || ''} is taking attendance now!`;
      } else {
        activeSessionBannerText.textContent = `${unmarkedSessions.length} classes are taking attendance now!`;
      }
    } else {
      activeSessionBanner.style.display = 'none';
    }
  } catch (error) {
    console.error("Error checking active sessions", error);
    activeSessionBanner.style.display = 'none';
  }
}

markBtn.addEventListener("click", () => {
  const token = qrTokenInput.value.trim();
  handleMarkAttendance(token);
});

async function handleMarkAttendance(token) {
  if (!token) return;

  markMsg.textContent = "Verifying token...";
  markMsg.style.color = "orange";

  try {
    await apiPost("/student/mark-attendance", { qrToken: token });
    markMsg.style.color = "green";
    markMsg.textContent = "Attendance marked successfully!";
    qrTokenInput.value = token; // show the token that was used
    await loadDashboard(); // Refresh dashboard stats
    await loadTodayAttendance(); // Refresh verification section
    await loadActiveSessions(); // Refresh active sessions
  } catch (err) {
    markMsg.style.color = "red";
    markMsg.textContent = `Error: ${err.message}. Please try again.`;
  }
}

// QR scanner using html5-qrcode
if (window.Html5Qrcode) {
  const qrRegionId = "qrReader";
  const qrScanner = new Html5Qrcode(qrRegionId, {
    formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    },
    verbose: false
  });
  
  const config = { 
    fps: 15,  // Higher FPS for faster detection
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    disableFlip: false,  // Allow scanning flipped QR codes
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    }
  };

  let isScanning = false;

  const startScan = () => {
    if (isScanning) return; // Already scanning
    isScanning = true;
    
    // Try to get available cameras first
    Html5Qrcode.getCameras().then(cameras => {
      if (cameras && cameras.length > 0) {
        // Prefer back camera if available
        const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear'));
        const cameraId = backCamera ? backCamera.id : cameras[0].id;
        
        qrScanner.start(
          cameraId,
          config,
          (decodedText) => {
            if (isScanning) {
              isScanning = false; // Prevent multiple submissions from one scan
              // Play a success sound/vibration feedback
              if (navigator.vibrate) navigator.vibrate(200);
              qrScanner.stop().then(() => {
                handleMarkAttendance(decodedText);
              }).catch(err => console.error("Failed to stop scanner", err));
            }
          },
          (errorMessage) => { /* ignore scan errors */ }
        ).catch((err) => {
          isScanning = false;
          console.warn(`QR scanner error: ${err}`);
          markMsg.textContent = "Could not start QR Scanner. Please allow camera access.";
          markMsg.style.color = 'red';
        });
      } else {
        // Fallback to facingMode
        qrScanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (isScanning) {
              isScanning = false;
              if (navigator.vibrate) navigator.vibrate(200);
              qrScanner.stop().then(() => {
                handleMarkAttendance(decodedText);
              }).catch(err => console.error("Failed to stop scanner", err));
            }
          },
          (errorMessage) => { /* ignore scan errors */ }
        ).catch((err) => {
          isScanning = false;
          console.warn(`QR scanner error: ${err}`);
          markMsg.textContent = "Could not start QR Scanner. Please allow camera access.";
          markMsg.style.color = 'red';
        });
      }
    }).catch(err => {
      // Fallback if getCameras fails
      qrScanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (isScanning) {
            isScanning = false;
            if (navigator.vibrate) navigator.vibrate(200);
            qrScanner.stop().then(() => {
              handleMarkAttendance(decodedText);
            }).catch(err => console.error("Failed to stop scanner", err));
          }
        },
        (errorMessage) => { /* ignore scan errors */ }
      ).catch((err) => {
        isScanning = false;
        console.warn(`QR scanner error: ${err}`);
        markMsg.textContent = "Could not start QR Scanner. Please allow camera access.";
        markMsg.style.color = 'red';
      });
    });
  };

  const stopScan = () => {
    if (isScanning && qrScanner.isScanning) {
        qrScanner.stop().then(() => isScanning = false).catch(err => {
            console.error("Failed to stop scanner on view switch", err);
            isScanning = false; // ensure state is reset
        });
    }
  };

  // Use a MutationObserver to start/stop scanner when view changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'style') {
        if (markAttendanceView.style.display === 'block') {
          markMsg.textContent = '';
          qrTokenInput.value = '';
          startScan();
        } else {
          stopScan();
        }
      }
    });
  });

  observer.observe(markAttendanceView, { attributes: true });
}

async function loadTimeTable() {
  try {
    const timeTableData = await apiGet("/student/timetable");
    
    if (!timeTableData || timeTableData.length === 0) {
      timeTable.innerHTML = `
        <thead>
          <tr><th colspan="7" style="text-align: center; color: #888;">No timetable available for your class</th></tr>
        </thead>
      `;
      upcomingClassDetails.innerHTML = `<p style="color: #888;">No classes scheduled yet. Please contact your admin.</p>`;
      return;
    }
    
    const header = `
      <thead>
        <tr>
          <th>Time</th>
          <th>Monday</th>
          <th>Tuesday</th>
          <th>Wednesday</th>
          <th>Thursday</th>
          <th>Friday</th>
          <th>Saturday</th>
        </tr>
      </thead>
    `;

    const rows = timeTableData.map(t => `
      <tr>
        <td style="font-weight: bold; white-space: nowrap;">${t.time}</td>
        <td>${t.monday ? `<div style="font-weight:bold;">${t.monday.courseCode || ''}</div><small style="color:#888;">${t.monday.courseName || ''}</small>${t.monday.room ? `<br><small style="color:#666;">📍 ${t.monday.room}</small>` : ''}` : '-'}</td>
        <td>${t.tuesday ? `<div style="font-weight:bold;">${t.tuesday.courseCode || ''}</div><small style="color:#888;">${t.tuesday.courseName || ''}</small>${t.tuesday.room ? `<br><small style="color:#666;">📍 ${t.tuesday.room}</small>` : ''}` : '-'}</td>
        <td>${t.wednesday ? `<div style="font-weight:bold;">${t.wednesday.courseCode || ''}</div><small style="color:#888;">${t.wednesday.courseName || ''}</small>${t.wednesday.room ? `<br><small style="color:#666;">📍 ${t.wednesday.room}</small>` : ''}` : '-'}</td>
        <td>${t.thursday ? `<div style="font-weight:bold;">${t.thursday.courseCode || ''}</div><small style="color:#888;">${t.thursday.courseName || ''}</small>${t.thursday.room ? `<br><small style="color:#666;">📍 ${t.thursday.room}</small>` : ''}` : '-'}</td>
        <td>${t.friday ? `<div style="font-weight:bold;">${t.friday.courseCode || ''}</div><small style="color:#888;">${t.friday.courseName || ''}</small>${t.friday.room ? `<br><small style="color:#666;">📍 ${t.friday.room}</small>` : ''}` : '-'}</td>
        <td>${t.saturday ? `<div style="font-weight:bold;">${t.saturday.courseCode || ''}</div><small style="color:#888;">${t.saturday.courseName || ''}</small>${t.saturday.room ? `<br><small style="color:#666;">📍 ${t.saturday.room}</small>` : ''}` : '-'}</td>
      </tr>
    `).join('');

    timeTable.innerHTML = `${header}<tbody>${rows}</tbody>`;
    findUpcomingClass(timeTableData);
  } catch (error) {
    console.error("Timetable load error", error);
    timeTable.innerHTML = "<tr><td colspan='7'>Could not load timetable.</td></tr>";
  }
}

function findUpcomingClass(timeTableData) {
    const now = new Date();
    const dayOfWeek = now.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // in minutes

    let currentClass = null;
    let upcomingClass = null;

    for (const slot of timeTableData) {
        const classInfo = slot[dayOfWeek];
        if (!classInfo) continue;
        
        const timeParts = slot.time.split(' - ');
        const startParts = timeParts[0].split(':');
        const endParts = timeParts[1].split(':');
        const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

        // Check if this is current class
        if (currentTime >= startTime && currentTime < endTime) {
            currentClass = { 
                course: classInfo.courseCode || classInfo.course, 
                courseName: classInfo.courseName,
                time: slot.time,
                room: classInfo.room
            };
        }
        // Check for upcoming class (within next hour)
        else if (startTime > currentTime && startTime - currentTime <= 60 && !upcomingClass) {
            upcomingClass = { 
                course: classInfo.courseCode || classInfo.course, 
                courseName: classInfo.courseName,
                time: slot.time,
                room: classInfo.room,
                startsIn: startTime - currentTime
            };
        }
    }

    if (currentClass) {
        upcomingClassDetails.innerHTML = `
            <div style="border-left: 4px solid #28a745; padding-left: 15px;">
                <p style="color: #28a745; font-weight: bold; margin-bottom: 5px;">🟢 ONGOING CLASS</p>
                <p><strong>Course:</strong> ${currentClass.course} ${currentClass.courseName ? `- ${currentClass.courseName}` : ''}</p>
                <p><strong>Time:</strong> ${currentClass.time}</p>
                ${currentClass.room ? `<p><strong>Room:</strong> ${currentClass.room}</p>` : ''}
                <button onclick="switchView('mark')" style="margin-top: 10px; background: #28a745;">📱 Mark Attendance Now</button>
            </div>
        `;
    } else if (upcomingClass) {
        upcomingClassDetails.innerHTML = `
            <div style="border-left: 4px solid #ffc107; padding-left: 15px;">
                <p style="color: #ffc107; font-weight: bold; margin-bottom: 5px;">⏰ NEXT CLASS (in ${upcomingClass.startsIn} min)</p>
                <p><strong>Course:</strong> ${upcomingClass.course} ${upcomingClass.courseName ? `- ${upcomingClass.courseName}` : ''}</p>
                <p><strong>Time:</strong> ${upcomingClass.time}</p>
                ${upcomingClass.room ? `<p><strong>Room:</strong> ${upcomingClass.room}</p>` : ''}
            </div>
        `;
    } else {
        upcomingClassDetails.innerHTML = `<p style="color: #888;">📚 No more classes today.</p>`;
    }
    
    // Show today's full schedule
    showTodaySchedule(timeTableData, dayOfWeek, currentTime);
}

function showTodaySchedule(timeTableData, dayOfWeek, currentTime) {
    const todayClasses = [];
    
    for (const slot of timeTableData) {
        const classInfo = slot[dayOfWeek];
        if (classInfo) {
            const timeParts = slot.time.split(' - ');
            const startParts = timeParts[0].split(':');
            const endParts = timeParts[1].split(':');
            const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            
            let status = 'upcoming';
            if (currentTime >= endTime) status = 'completed';
            else if (currentTime >= startTime && currentTime < endTime) status = 'ongoing';
            
            todayClasses.push({
                time: slot.time,
                course: classInfo.courseCode || classInfo.course,
                courseName: classInfo.courseName,
                room: classInfo.room,
                status
            });
        }
    }
    
    if (todayClasses.length === 0) {
        todaySchedule.innerHTML = `<p style="color: #888; text-align: center;">No classes scheduled for today.</p>`;
        return;
    }
    
    todaySchedule.innerHTML = todayClasses.map(cls => {
        const statusColors = {
            completed: { bg: '#2d2d2d', border: '#555', icon: '✅' },
            ongoing: { bg: '#1a3d1a', border: '#28a745', icon: '🟢' },
            upcoming: { bg: '#2d2d2d', border: '#3d3d3d', icon: '⏳' }
        };
        const style = statusColors[cls.status];
        
        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: ${style.bg}; border-left: 3px solid ${style.border}; border-radius: 6px; margin-bottom: 8px;">
                <span style="font-size: 1.2rem;">${style.icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: #fff;">${cls.course}</div>
                    ${cls.courseName ? `<small style="color: #888;">${cls.courseName}</small>` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.85rem; color: #aaa;">${cls.time}</div>
                    ${cls.room ? `<small style="color: #666;">📍 ${cls.room}</small>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function loadProfile() {
  try {
    const profile = await apiGet("/student/profile");
    profileDetails.innerHTML = `
        <div class="upcoming-class-grid">
            <p><strong>Name:</strong></p><p>${profile.name}</p>
            <p><strong>Email:</strong></p><p>${profile.email}</p>
            <p><strong>Student ID:</strong></p><p>${profile.studentId}</p>
            <p><strong>Branch:</strong></p><p>${profile.branch}</p>
            <p><strong>Semester:</strong></p><p>${profile.semester}</p>
            <p><strong>Section:</strong></p><p>${profile.section}</p>
        </div>
    `;
  } catch (error) {
    console.error("Profile load error", error);
    profileDetails.innerHTML = "<p>Could not load profile.</p>";
  }
}

// View Attendance
const viewAttendanceForm = document.getElementById("viewAttendanceForm");
const attendanceStatusTable = document.getElementById("attendanceStatusTable");

viewAttendanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    attendanceStatusTable.style.display = "table";
    const date = document.getElementById("studentDate").value;
    
    try {
        const attendance = await apiGet(`/student/attendance?date=${date}`);
        const header = `
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Status</th>
                </tr>
            </thead>
        `;

        const rows = attendance.map(a => `
            <tr>
                <td>${a.subject}</td>
                <td style="color: ${a.status === 'Present' ? 'green' : 'red'};">${a.status}</td>
            </tr>
        `).join('');

        attendanceStatusTable.innerHTML = `${header}<tbody>${rows}</tbody>`;
    } catch (error) {
        console.error("Attendance status load error", error);
        attendanceStatusTable.innerHTML = "<tr><td colspan='2'>Could not load attendance.</td></tr>";
    }
});

// Initial load
async function init() {
    switchView("dashboard");
    updateWelcomeBanner();
    await loadDashboard();
    await loadTodayAttendance(); // Load today's attendance verification
    await loadTimeTable();
    await loadProfile();
    await checkActiveSessionsForBanner();
    
    // Periodically check for new active sessions (every 30 seconds)
    setInterval(async () => {
      await checkActiveSessionsForBanner();
      await loadTodayAttendance(); // Also refresh today's attendance
    }, 30000);
}

init();