import { apiGet, apiPost, apiPut, apiDelete, ensureAuth, getUser } from "./api.js";

const user = ensureAuth(["admin"]);

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

const statsEl = document.getElementById("adminStats");
const analyticsForm = document.getElementById("analyticsForm");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const analyticsTable = document.getElementById("analyticsTable");
const profileDetails = document.getElementById("profileDetails");
let adminChart;

// Faculty form elements
const createFacultyForm = document.getElementById("createFacultyForm");
const cfMsg = document.getElementById("cfMsg");
const cfEditId = document.getElementById("cfEditId");
const cfSubmitBtn = document.getElementById("cfSubmitBtn");
const cfCancelBtn = document.getElementById("cfCancelBtn");
const facultyListBody = document.getElementById("facultyListBody");

// Student form elements
const createStudentForm = document.getElementById("createStudentForm");
const csMsg = document.getElementById("csMsg");
const csEditId = document.getElementById("csEditId");
const csSubmitBtn = document.getElementById("csSubmitBtn");
const csCancelBtn = document.getElementById("csCancelBtn");
const studentListBody = document.getElementById("studentListBody");
const filterStudentsBtn = document.getElementById("filterStudentsBtn");

// Promotion elements
const promoteForm = document.getElementById("promoteForm");
const prMsg = document.getElementById("prMsg");
const previewPromotionBtn = document.getElementById("previewPromotionBtn");
const promotionPreview = document.getElementById("promotionPreview");
const previewCount = document.getElementById("previewCount");
const previewTableBody = document.getElementById("previewTableBody");

// View switching
const dashboardBtn = document.getElementById("dashboardBtn");
const createUserBtn = document.getElementById("createUserBtn");
const departmentsBtn = document.getElementById("departmentsBtn");
const sectionsBtn = document.getElementById("sectionsBtn");
const coursesBtn = document.getElementById("coursesBtn");
const timetableBtn = document.getElementById("timetableBtn");
const promoteBtn = document.getElementById("promoteBtn");
const analyticsBtn = document.getElementById("analyticsBtn");
const profileBtn = document.getElementById("profileBtn");

const dashboardView = document.getElementById("dashboardView");
const createUserView = document.getElementById("createUserView");
const departmentsView = document.getElementById("departmentsView");
const sectionsView = document.getElementById("sectionsView");
const coursesView = document.getElementById("coursesView");
const timetableView = document.getElementById("timetableView");
const promoteView = document.getElementById("promoteView");
const analyticsView = document.getElementById("analyticsView");
const profileView = document.getElementById("profileView");

dashboardBtn.addEventListener("click", () => switchView("dashboard"));
createUserBtn.addEventListener("click", () => switchView("createUser"));
departmentsBtn.addEventListener("click", () => switchView("departments"));
sectionsBtn.addEventListener("click", () => switchView("sections"));
coursesBtn.addEventListener("click", () => switchView("courses"));
timetableBtn.addEventListener("click", () => switchView("timetable"));
promoteBtn.addEventListener("click", () => switchView("promote"));
analyticsBtn.addEventListener("click", () => switchView("analytics"));
profileBtn.addEventListener("click", () => switchView("profile"));

function switchView(view) {
  dashboardView.style.display = "none";
  createUserView.style.display = "none";
  departmentsView.style.display = "none";
  sectionsView.style.display = "none";
  coursesView.style.display = "none";
  timetableView.style.display = "none";
  promoteView.style.display = "none";
  analyticsView.style.display = "none";
  profileView.style.display = "none";
  dashboardBtn.classList.remove("active");
  createUserBtn.classList.remove("active");
  departmentsBtn.classList.remove("active");
  sectionsBtn.classList.remove("active");
  coursesBtn.classList.remove("active");
  timetableBtn.classList.remove("active");
  promoteBtn.classList.remove("active");
  analyticsBtn.classList.remove("active");
  profileBtn.classList.remove("active");

  if (view === "dashboard") {
    dashboardView.style.display = "block";
    dashboardBtn.classList.add("active");
  } else if (view === "createUser") {
    createUserView.style.display = "block";
    createUserBtn.classList.add("active");
    loadUserLists(); // Load faculty and student lists
  } else if (view === "departments") {
    departmentsView.style.display = "block";
    departmentsBtn.classList.add("active");
    loadDepartmentList(); // Load departments
  } else if (view === "sections") {
    sectionsView.style.display = "block";
    sectionsBtn.classList.add("active");
    loadSectionList(); // Load sections
    loadDepartmentDropdowns(); // Load department options for section form
  } else if (view === "courses") {
    coursesView.style.display = "block";
    coursesBtn.classList.add("active");
    loadCourseList(); // Load courses
    loadCourseDepartmentDropdowns(); // Load department options for course form
  } else if (view === "timetable") {
    timetableView.style.display = "block";
    timetableBtn.classList.add("active");
    loadFacultyDropdown(); // Load faculty list for timetable
    loadTimetableDepartmentFilter(); // Load department filter
  } else if (view === "promote") {
    promoteView.style.display = "block";
    promoteBtn.classList.add("active");
    loadPromoteDepartmentDropdowns(); // Load dropdowns for promote section
  } else if (view === "analytics") {
    analyticsView.style.display = "block";
    analyticsBtn.classList.add("active");
  } else if (view === "profile") {
    profileView.style.display = "block";
    profileBtn.classList.add("active");
  }
}

async function loadStats() {
  try {
    const [users, classes, departments, sections, courses] = await Promise.all([
      apiGet("/admin/users"),
      apiGet("/admin/classes"),
      apiGet("/admin/departments"),
      apiGet("/admin/sections"),
      apiGet("/admin/courses"),
    ]);

    const students = users.filter((u) => u.role === "student");
    const faculty = users.filter((u) => u.role === "faculty");
    const totalStudents = students.length;
    const totalFaculty = faculty.length;
    const totalClasses = classes.length;
    const totalDepartments = departments.length;
    const totalSections = sections.length;
    const totalCourses = courses.length;

    // Main Stats Cards
    statsEl.innerHTML = `
      <div class="card" style="border-left: 4px solid #28a745;">
        <h3 style="color: #28a745;">👨‍🎓 Students</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 10px 0;">${totalStudents}</p>
        <small style="color: #888;">Total Enrolled</small>
      </div>
      <div class="card" style="border-left: 4px solid #17a2b8;">
        <h3 style="color: #17a2b8;">👨‍🏫 Faculty</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 10px 0;">${totalFaculty}</p>
        <small style="color: #888;">Active Members</small>
      </div>
      <div class="card" style="border-left: 4px solid #ffc107;">
        <h3 style="color: #ffc107;">🏢 Departments</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 10px 0;">${totalDepartments}</p>
        <small style="color: #888;">Total Departments</small>
      </div>
      <div class="card" style="border-left: 4px solid #6f42c1;">
        <h3 style="color: #6f42c1;">📚 Sections</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 10px 0;">${totalSections}</p>
        <small style="color: #888;">Active Sections</small>
      </div>
      <div class="card" style="border-left: 4px solid #fd7e14;">
        <h3 style="color: #fd7e14;">📖 Courses</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 10px 0;">${totalCourses}</p>
        <small style="color: #888;">Course Catalog</small>
      </div>
      <div class="card" style="border-left: 4px solid #e83e8c;">
        <h3 style="color: #e83e8c;">📅 Classes</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 10px 0;">${totalClasses}</p>
        <small style="color: #888;">Scheduled</small>
      </div>
    `;

    // Update admin name
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const adminNameEl = document.getElementById("adminNameDisplay");
    if (adminNameEl && user.name) {
      adminNameEl.textContent = user.name;
    }

    // Update date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Load semester distribution
    loadSemesterDistribution(students);

    // Load department overview
    loadDepartmentOverview(students, faculty, departments);

    // Load system summary
    loadSystemSummary(totalStudents, totalFaculty, totalDepartments, totalSections, totalCourses, totalClasses);

  } catch (error) {
    console.error("Stats load error", error);
    statsEl.innerHTML = "<p>Could not load dashboard stats.</p>";
  }
}

function updateDateTime() {
  const now = new Date();
  const dateEl = document.getElementById("currentDate");
  const timeEl = document.getElementById("currentTime");
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

function loadSemesterDistribution(students) {
  const semesterCounts = {};
  for (let i = 1; i <= 8; i++) {
    semesterCounts[i] = 0;
  }
  
  students.forEach(s => {
    const sem = s.semester || 1;
    if (semesterCounts[sem] !== undefined) {
      semesterCounts[sem]++;
    }
  });

  const semesterEl = document.getElementById("semesterDistribution");
  if (semesterEl) {
    semesterEl.innerHTML = Object.entries(semesterCounts).map(([sem, count]) => `
      <div style="background: ${count > 0 ? '#2d2d2d' : '#1a1a1a'}; padding: 10px; border-radius: 8px; text-align: center; border: 1px solid ${count > 0 ? '#3d3d3d' : '#2a2a2a'};">
        <p style="font-size: 0.75rem; color: #888; margin: 0;">Sem ${sem}</p>
        <p style="font-size: 1.2rem; font-weight: bold; margin: 5px 0; color: ${count > 0 ? '#28a745' : '#555'};">${count}</p>
      </div>
    `).join("");
  }
}

function loadDepartmentOverview(students, faculty, departments) {
  const deptEl = document.getElementById("departmentOverview");
  if (!deptEl) return;

  if (departments.length === 0) {
    deptEl.innerHTML = '<p style="color: #888; text-align: center;">No departments found</p>';
    return;
  }

  const deptStats = departments.map(dept => {
    const deptStudents = students.filter(s => s.department === dept.name || s.department === dept._id);
    const deptFaculty = faculty.filter(f => f.department === dept.name || f.department === dept._id);
    return {
      name: dept.name,
      code: dept.code || dept.name.substring(0, 3).toUpperCase(),
      students: deptStudents.length,
      faculty: deptFaculty.length
    };
  });

  deptEl.innerHTML = deptStats.map(d => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #2d2d2d; border-radius: 6px; margin-bottom: 8px;">
      <div>
        <span style="font-weight: bold; color: #fff;">${d.name}</span>
        <span style="color: #666; font-size: 0.8rem; margin-left: 8px;">(${d.code})</span>
      </div>
      <div style="display: flex; gap: 15px;">
        <span style="color: #28a745; font-size: 0.85rem;">👨‍🎓 ${d.students}</span>
        <span style="color: #17a2b8; font-size: 0.85rem;">👨‍🏫 ${d.faculty}</span>
      </div>
    </div>
  `).join("");
}

function loadSystemSummary(students, faculty, departments, sections, courses, classes) {
  const summaryEl = document.getElementById("systemSummary");
  if (!summaryEl) return;

  const avgStudentsPerDept = departments > 0 ? Math.round(students / departments) : 0;
  const avgFacultyPerDept = departments > 0 ? Math.round(faculty / departments) : 0;
  const studentFacultyRatio = faculty > 0 ? (students / faculty).toFixed(1) : 'N/A';

  summaryEl.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="background: #2d2d2d; padding: 12px; border-radius: 6px; text-align: center;">
        <p style="font-size: 0.8rem; color: #888; margin: 0;">Student:Faculty Ratio</p>
        <p style="font-size: 1.3rem; font-weight: bold; margin: 5px 0; color: #17a2b8;">${studentFacultyRatio}:1</p>
      </div>
      <div style="background: #2d2d2d; padding: 12px; border-radius: 6px; text-align: center;">
        <p style="font-size: 0.8rem; color: #888; margin: 0;">Avg Students/Dept</p>
        <p style="font-size: 1.3rem; font-weight: bold; margin: 5px 0; color: #28a745;">${avgStudentsPerDept}</p>
      </div>
      <div style="background: #2d2d2d; padding: 12px; border-radius: 6px; text-align: center;">
        <p style="font-size: 0.8rem; color: #888; margin: 0;">Avg Faculty/Dept</p>
        <p style="font-size: 1.3rem; font-weight: bold; margin: 5px 0; color: #fd7e14;">${avgFacultyPerDept}</p>
      </div>
      <div style="background: #2d2d2d; padding: 12px; border-radius: 6px; text-align: center;">
        <p style="font-size: 0.8rem; color: #888; margin: 0;">Classes/Course</p>
        <p style="font-size: 1.3rem; font-weight: bold; margin: 5px 0; color: #e83e8c;">${courses > 0 ? (classes / courses).toFixed(1) : 0}</p>
      </div>
    </div>
  `;
}

// ===================== FACULTY MANAGEMENT =====================

async function loadFacultyTable() {
  try {
    const users = await apiGet("/admin/users?role=faculty");
    if (users.length === 0) {
      facultyListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No faculty found</td></tr>';
      return;
    }
    facultyListBody.innerHTML = users.map(f => `
      <tr>
        <td>${f.name}</td>
        <td>${f.email}</td>
        <td>${f.department || 'N/A'}</td>
        <td>
          <button class="edit-faculty-btn" data-id="${f._id}" data-name="${f.name}" data-email="${f.email}" data-dept="${f.department || ''}" style="background: #ffc107; padding: 4px 8px; font-size: 0.8rem;">✏️ Edit</button>
          <button class="delete-faculty-btn" data-id="${f._id}" data-name="${f.name}" style="background: #dc3545; padding: 4px 8px; font-size: 0.8rem;">🗑️</button>
        </td>
      </tr>
    `).join("");
    
    // Add edit handlers
    document.querySelectorAll(".edit-faculty-btn").forEach(btn => {
      btn.addEventListener("click", () => editFaculty(btn.dataset));
    });
    
    // Add delete handlers
    document.querySelectorAll(".delete-faculty-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteFaculty(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    console.error("Error loading faculty list:", err);
    facultyListBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading faculty</td></tr>';
  }
}

function editFaculty(data) {
  cfEditId.value = data.id;
  document.getElementById("cfName").value = data.name;
  document.getElementById("cfEmail").value = data.email;
  document.getElementById("cfDepartment").value = data.dept;
  document.getElementById("cfPassword").value = "";
  cfSubmitBtn.textContent = "Update Faculty";
  cfCancelBtn.style.display = "inline-block";
  cfMsg.textContent = "";
}

cfCancelBtn.addEventListener("click", () => {
  cfEditId.value = "";
  createFacultyForm.reset();
  cfSubmitBtn.textContent = "Add Faculty";
  cfCancelBtn.style.display = "none";
  cfMsg.textContent = "";
});

async function deleteFaculty(id, name) {
  if (!confirm(`Are you sure you want to delete faculty "${name}"?`)) return;
  try {
    await apiPost("/admin/users/delete", { userId: id });
    loadFacultyTable();
    loadStats();
  } catch (err) {
    alert("Error deleting faculty: " + err.message);
  }
}

createFacultyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  cfMsg.textContent = "";
  
  const editId = cfEditId.value;
  const userData = {
    name: document.getElementById("cfName").value,
    email: document.getElementById("cfEmail").value,
    department: document.getElementById("cfDepartment").value,
    role: "faculty"
  };
  
  const password = document.getElementById("cfPassword").value;
  if (password) userData.password = password;
  
  try {
    if (editId) {
      // Update existing faculty
      await apiPut(`/admin/users/${editId}`, userData);
      cfMsg.style.color = "green";
      cfMsg.textContent = "Faculty updated successfully!";
    } else {
      // Create new faculty
      if (!password) {
        cfMsg.style.color = "red";
        cfMsg.textContent = "Password is required for new faculty";
        return;
      }
      await apiPost("/admin/users", userData);
      cfMsg.style.color = "green";
      cfMsg.textContent = "Faculty created successfully!";
    }
    
    cfCancelBtn.click(); // Reset form
    loadFacultyTable();
    loadFacultyDropdown(); // Refresh timetable faculty dropdown
    loadStats();
  } catch (err) {
    cfMsg.style.color = "red";
    cfMsg.textContent = err.message;
  }
});

// ===================== STUDENT MANAGEMENT =====================

async function loadStudentList(filters = {}) {
  try {
    let url = "/admin/users?role=student";
    if (filters.department) url += `&department=${encodeURIComponent(filters.department)}`;
    if (filters.section) url += `&section=${encodeURIComponent(filters.section)}`;
    
    const users = await apiGet(url);
    if (users.length === 0) {
      studentListBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No students found</td></tr>';
      return;
    }
    studentListBody.innerHTML = users.map(s => `
      <tr>
        <td>${s.rollNo || 'N/A'}</td>
        <td>${s.name}</td>
        <td>${s.email}</td>
        <td>${s.department?.substring(0, 3) || 'N/A'}</td>
        <td>${s.section || '-'}</td>
        <td>${s.semester || '1'}</td>
        <td>
          <button class="edit-student-btn" data-id="${s._id}" data-name="${s.name}" data-email="${s.email}" data-dept="${s.department || ''}" data-section="${s.section || ''}" data-semester="${s.semester || '1'}" data-year="${s.admissionYear || ''}" style="background: #ffc107; padding: 4px 8px; font-size: 0.8rem;">✏️</button>
          <button class="delete-student-btn" data-id="${s._id}" data-name="${s.name}" style="background: #dc3545; padding: 4px 8px; font-size: 0.8rem;">🗑️</button>
        </td>
      </tr>
    `).join("");
    
    // Add edit handlers
    document.querySelectorAll(".edit-student-btn").forEach(btn => {
      btn.addEventListener("click", () => editStudent(btn.dataset));
    });
    
    // Add delete handlers
    document.querySelectorAll(".delete-student-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteStudent(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    console.error("Error loading student list:", err);
    studentListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error loading students</td></tr>';
  }
}

async function editStudent(data) {
  csEditId.value = data.id;
  document.getElementById("csName").value = data.name;
  document.getElementById("csEmail").value = data.email;
  document.getElementById("csDepartment").value = data.dept;
  document.getElementById("csSemester").value = data.semester || "1";
  
  // Load sections for the department, then set the section value
  const csSection = document.getElementById("csSection");
  csSection.innerHTML = '<option value="">-- Not Assigned --</option>';
  if (data.dept) {
    try {
      const sections = await apiGet(`/admin/sections?department=${encodeURIComponent(data.dept)}`);
      sections.forEach(s => {
        csSection.innerHTML += `<option value="${s.name}">${s.name}${s.description ? ' - ' + s.description : ''}</option>`;
      });
    } catch (err) {
      console.error("Error loading sections:", err);
    }
  }
  csSection.value = data.section;
  
  document.getElementById("csAdmissionYear").value = data.year;
  document.getElementById("csPassword").value = "";
  csSubmitBtn.textContent = "Update Student";
  csCancelBtn.style.display = "inline-block";
  csMsg.textContent = "";
  
  // Update hint for Step 2 (editing/assigning academic details)
  const stepHint = document.getElementById("stepHint");
  if (stepHint) {
    stepHint.innerHTML = `✏️ <strong>Step 2:</strong> Assign/update academic details for <strong>${data.name}</strong>`;
    stepHint.style.color = "#28a745";
  }
  const pwdRequired = document.getElementById("pwdRequired");
  if (pwdRequired) pwdRequired.style.display = "none";
}

csCancelBtn.addEventListener("click", () => {
  csEditId.value = "";
  createStudentForm.reset();
  csSubmitBtn.textContent = "Add Student";
  csCancelBtn.style.display = "none";
  csMsg.textContent = "";
  

  const pwdRequired = document.getElementById("pwdRequired");
  if (pwdRequired) pwdRequired.style.display = "inline";
});

async function deleteStudent(id, name) {
  if (!confirm(`Are you sure you want to delete student "${name}"?`)) return;
  try {
    await apiPost("/admin/users/delete", { userId: id });
    loadStudentList();
    loadStats();
  } catch (err) {
    alert("Error deleting student: " + err.message);
  }
}

createStudentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  csMsg.textContent = "";
  
  const editId = csEditId.value;
  const semesterValue = document.getElementById("csSemester").value;
  const userData = {
    name: document.getElementById("csName").value,
    email: document.getElementById("csEmail").value,
    department: document.getElementById("csDepartment").value,
    section: document.getElementById("csSection").value,
    semester: semesterValue || "1", // Default to 1st semester if not selected
    role: "student"
  };
  
  const password = document.getElementById("csPassword").value;
  if (password) userData.password = password;
  
  const admissionYear = document.getElementById("csAdmissionYear").value;
  if (admissionYear) userData.admissionYear = parseInt(admissionYear);
  
  try {
    if (editId) {
      // Update existing student
      await apiPut(`/admin/users/${editId}`, userData);
      csMsg.style.color = "green";
      csMsg.textContent = "Student updated successfully!";
    } else {
      // Create new student
      if (!password) {
        csMsg.style.color = "red";
        csMsg.textContent = "Password is required for new student";
        return;
      }
      const result = await apiPost("/admin/users", userData);
      csMsg.style.color = "green";
      // Guide admin to Step 2 if department not assigned
      if (!userData.department) {
        csMsg.textContent = `✅ Student created! Click ✏️ Edit to assign department/section (Step 2)`;
      } else {
        csMsg.textContent = result.rollNo 
          ? `Student created! Roll No: ${result.rollNo}` 
          : "Student created successfully!";
      }
    }
    
    csCancelBtn.click(); // Reset form
    loadStudentList();
    loadStats();
  } catch (err) {
    csMsg.style.color = "red";
    csMsg.textContent = err.message;
  }
});

filterStudentsBtn.addEventListener("click", () => {
  loadStudentList({
    department: document.getElementById("studentFilterDept").value,
    section: document.getElementById("studentFilterSection").value
  });
});

// Populate section filter dropdown
async function loadStudentFilterSections() {
  try {
    const sections = await apiGet("/admin/sections");
    const filterSelect = document.getElementById("studentFilterSection");
    filterSelect.innerHTML = '<option value="">All Sections</option>';
    sections.forEach(s => {
      filterSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`;
    });
  } catch (err) {
    console.error("Error loading filter sections:", err);
  }
}

// Load users on view switch
function loadUserLists() {
  loadFacultyTable();
  loadStudentList();
  loadStudentSectionDropdown(); // Load sections for student form
  loadStudentFilterSections(); // Load sections for filter dropdown
  loadUserDepartmentDropdowns(); // Load department dropdowns
}

// ===================== PROMOTE STUDENTS =====================

const promoteGroupBtn = document.getElementById("promoteGroupBtn");
const promoteSelectedBtn = document.getElementById("promoteSelectedBtn");
const loadPromoteListBtn = document.getElementById("loadPromoteListBtn");
const promoteStudentListBody = document.getElementById("promoteStudentListBody");
const promoteGroupMsg = document.getElementById("promoteGroupMsg");
const promoteIndividualMsg = document.getElementById("promoteIndividualMsg");
const selectAllPromote = document.getElementById("selectAllPromote");
const selectedCountEl = document.getElementById("selectedCount");

// Load department dropdowns for promote section
async function loadPromoteDepartmentDropdowns() {
  try {
    const departments = await apiGet("/admin/departments");
    const selects = ["promoteFilterDept", "individualFilterDept"];
    selects.forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        select.innerHTML = '<option value="">All Departments</option>';
        departments.forEach(d => {
          select.innerHTML += `<option value="${d.name}">${d.name}</option>`;
        });
      }
    });
    
    // Load sections for group promote filter
    const sections = await apiGet("/admin/sections");
    const promoteFilterSection = document.getElementById("promoteFilterSection");
    if (promoteFilterSection) {
      promoteFilterSection.innerHTML = '<option value="">All Sections</option>';
      sections.forEach(s => {
        promoteFilterSection.innerHTML += `<option value="${s.name}">${s.name}</option>`;
      });
    }
  } catch (err) {
    console.error("Error loading promote dropdowns:", err);
  }
}

// Group Promotion
promoteGroupBtn.addEventListener("click", async () => {
  promoteGroupMsg.textContent = "";
  
  const dept = document.getElementById("promoteFilterDept").value;
  const section = document.getElementById("promoteFilterSection").value;
  const fromSem = document.getElementById("promoteFromSem").value;
  const toSem = document.getElementById("promoteToSem").value;
  
  if (!toSem) {
    promoteGroupMsg.style.color = "red";
    promoteGroupMsg.textContent = "Please select target semester";
    return;
  }
  
  // Build filter query
  let url = "/admin/users?role=student";
  if (dept) url += `&department=${encodeURIComponent(dept)}`;
  if (section) url += `&section=${encodeURIComponent(section)}`;
  if (fromSem) url += `&semester=${encodeURIComponent(fromSem)}`;
  
  try {
    const students = await apiGet(url);
    
    if (students.length === 0) {
      promoteGroupMsg.style.color = "orange";
      promoteGroupMsg.textContent = "No students found matching the criteria";
      return;
    }
    
    const filterDesc = [
      dept ? `Dept: ${dept.substring(0, 15)}...` : "All Depts",
      section ? `Section: ${section}` : "All Sections",
      fromSem ? `Sem ${fromSem}` : "All Sems"
    ].join(", ");
    
    const targetDesc = toSem === "next" ? "next semester" : `semester ${toSem}`;
    
    if (!confirm(`Promote ${students.length} students (${filterDesc}) to ${targetDesc}?`)) {
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const student of students) {
      try {
        let newSem;
        if (toSem === "next") {
          const currentSem = parseInt(student.semester) || 1;
          newSem = Math.min(currentSem + 1, 8).toString();
        } else {
          newSem = toSem;
        }
        
        await apiPut(`/admin/users/${student._id}`, { semester: newSem });
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(`Error promoting ${student.name}:`, err);
      }
    }
    
    promoteGroupMsg.style.color = "green";
    promoteGroupMsg.textContent = `✅ Promoted ${successCount} students${errorCount > 0 ? ` (${errorCount} errors)` : ""}`;
    loadStudentList();
  } catch (err) {
    promoteGroupMsg.style.color = "red";
    promoteGroupMsg.textContent = "Error: " + err.message;
  }
});

// Load students for individual promotion
loadPromoteListBtn.addEventListener("click", async () => {
  promoteIndividualMsg.textContent = "";
  
  const dept = document.getElementById("individualFilterDept").value;
  const sem = document.getElementById("individualFilterSem").value;
  
  let url = "/admin/users?role=student";
  if (dept) url += `&department=${encodeURIComponent(dept)}`;
  if (sem) url += `&semester=${encodeURIComponent(sem)}`;
  
  try {
    const students = await apiGet(url);
    
    if (students.length === 0) {
      promoteStudentListBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No students found</td></tr>';
      updateSelectedCount();
      return;
    }
    
    promoteStudentListBody.innerHTML = students.map(s => `
      <tr>
        <td><input type="checkbox" class="promote-checkbox" data-id="${s._id}" data-name="${s.name}" data-sem="${s.semester || '1'}" /></td>
        <td>${s.rollNo || 'N/A'}</td>
        <td>${s.name}</td>
        <td>${s.department?.substring(0, 3) || 'N/A'}</td>
        <td>${s.semester || '1'}</td>
        <td>
          <select class="new-sem-select" data-id="${s._id}" style="padding: 4px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="next" ${!s.semester || parseInt(s.semester) < 8 ? 'selected' : ''}>Next (+1)</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
          </select>
        </td>
      </tr>
    `).join("");
    
    // Add checkbox change listeners
    document.querySelectorAll(".promote-checkbox").forEach(cb => {
      cb.addEventListener("change", updateSelectedCount);
    });
    
    updateSelectedCount();
  } catch (err) {
    promoteStudentListBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading students</td></tr>';
  }
});

// Select All checkbox
selectAllPromote.addEventListener("change", () => {
  const checkboxes = document.querySelectorAll(".promote-checkbox");
  checkboxes.forEach(cb => cb.checked = selectAllPromote.checked);
  updateSelectedCount();
});

function updateSelectedCount() {
  const checked = document.querySelectorAll(".promote-checkbox:checked").length;
  selectedCountEl.textContent = `${checked} students selected`;
}

// Promote selected students
promoteSelectedBtn.addEventListener("click", async () => {
  promoteIndividualMsg.textContent = "";
  
  const checkedBoxes = document.querySelectorAll(".promote-checkbox:checked");
  
  if (checkedBoxes.length === 0) {
    promoteIndividualMsg.style.color = "red";
    promoteIndividualMsg.textContent = "Please select at least one student";
    return;
  }
  
  if (!confirm(`Promote ${checkedBoxes.length} selected student(s)?`)) {
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const cb of checkedBoxes) {
    const studentId = cb.dataset.id;
    const currentSem = parseInt(cb.dataset.sem) || 1;
    const selectEl = document.querySelector(`.new-sem-select[data-id="${studentId}"]`);
    const targetSem = selectEl.value;
    
    let newSem;
    if (targetSem === "next") {
      newSem = Math.min(currentSem + 1, 8).toString();
    } else {
      newSem = targetSem;
    }
    
    try {
      await apiPut(`/admin/users/${studentId}`, { semester: newSem });
      successCount++;
    } catch (err) {
      errorCount++;
      console.error(`Error promoting student ${studentId}:`, err);
    }
  }
  
  promoteIndividualMsg.style.color = "green";
  promoteIndividualMsg.textContent = `✅ Promoted ${successCount} students${errorCount > 0 ? ` (${errorCount} errors)` : ""}`;
  
  // Reload the list
  loadPromoteListBtn.click();
  loadStudentList();
});

// ===================== DEPARTMENT MANAGEMENT =====================

const createDepartmentForm = document.getElementById("createDepartmentForm");
const deptMsg = document.getElementById("deptMsg");
const departmentListBody = document.getElementById("departmentListBody");

async function loadDepartmentList() {
  try {
    const departments = await apiGet("/admin/departments");
    if (departments.length === 0) {
      departmentListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No departments found. Create one above.</td></tr>';
      return;
    }
    
    departmentListBody.innerHTML = departments.map(d => `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.code}</td>
        <td>${d.description || '-'}</td>
        <td>
          <button class="delete-dept-btn" data-id="${d._id}" data-name="${d.name}" style="background: #dc3545; padding: 4px 8px; font-size: 0.8rem;">🗑️ Delete</button>
        </td>
      </tr>
    `).join("");
    
    // Add delete handlers
    document.querySelectorAll(".delete-dept-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteDepartment(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    console.error("Error loading departments:", err);
    departmentListBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading departments</td></tr>';
  }
}

async function deleteDepartment(id, name) {
  if (!confirm(`Are you sure you want to delete department "${name}"? This may affect users and sections.`)) return;
  try {
    await apiDelete(`/admin/departments/${id}`);
    loadDepartmentList();
    loadStats();
  } catch (err) {
    alert("Error deleting department: " + err.message);
  }
}

createDepartmentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  deptMsg.textContent = "";
  
  const deptData = {
    name: document.getElementById("deptName").value,
    code: document.getElementById("deptCode").value,
    description: document.getElementById("deptDescription").value
  };
  
  try {
    await apiPost("/admin/departments", deptData);
    deptMsg.style.color = "green";
    deptMsg.textContent = `Department "${deptData.name}" (${deptData.code}) created successfully!`;
    createDepartmentForm.reset();
    loadDepartmentList();
    loadStats();
  } catch (err) {
    deptMsg.style.color = "red";
    deptMsg.textContent = err.message;
  }
});

// Load departments into various dropdowns
async function loadUserDepartmentDropdowns() {
  try {
    const departments = await apiGet("/admin/departments");
    const cfDepartment = document.getElementById("cfDepartment");
    const csDepartment = document.getElementById("csDepartment");
    const studentFilterDept = document.getElementById("studentFilterDept");
    
    // Faculty department dropdown
    cfDepartment.innerHTML = '<option value="">Select Department</option>';
    departments.forEach(d => {
      cfDepartment.innerHTML += `<option value="${d.name}">${d.name}</option>`;
    });
    
    // Student department dropdown
    csDepartment.innerHTML = '<option value="">Select Department</option>';
    departments.forEach(d => {
      csDepartment.innerHTML += `<option value="${d.name}">${d.name}</option>`;
    });
    
    // Student filter dropdown
    studentFilterDept.innerHTML = '<option value="">All Departments</option>';
    departments.forEach(d => {
      studentFilterDept.innerHTML += `<option value="${d.name}">${d.name}</option>`;
    });
  } catch (err) {
    console.error("Error loading department dropdowns:", err);
  }
}

// Load departments for section management dropdowns
async function loadDepartmentDropdowns() {
  try {
    const departments = await apiGet("/admin/departments");
    const secDepartment = document.getElementById("secDepartment");
    const sectionFilterDept = document.getElementById("sectionFilterDept");
    
    secDepartment.innerHTML = '<option value="">Select Department</option>';
    departments.forEach(d => {
      secDepartment.innerHTML += `<option value="${d.name}">${d.name}</option>`;
    });
    
    sectionFilterDept.innerHTML = '<option value="">All Departments</option>';
    departments.forEach(d => {
      sectionFilterDept.innerHTML += `<option value="${d.name}">${d.name}</option>`;
    });
  } catch (err) {
    console.error("Error loading department dropdowns for sections:", err);
  }
}

// Load departments for timetable filter
async function loadTimetableDepartmentFilter() {
  try {
    const departments = await apiGet("/admin/departments");
    const ttDepartmentFilter = document.getElementById("ttDepartmentFilter");
    
    ttDepartmentFilter.innerHTML = '<option value="">All Departments</option>';
    departments.forEach(d => {
      ttDepartmentFilter.innerHTML += `<option value="${d.name}">${d.name}</option>`;
    });
  } catch (err) {
    console.error("Error loading timetable department filter:", err);
  }
}

// ===================== SECTION MANAGEMENT =====================

const createSectionForm = document.getElementById("createSectionForm");
const secMsg = document.getElementById("secMsg");
const sectionListBody = document.getElementById("sectionListBody");
const sectionFilterDept = document.getElementById("sectionFilterDept");

async function loadSectionList(department = "") {
  try {
    let url = "/admin/sections";
    if (department) url += `?department=${encodeURIComponent(department)}`;
    
    const sections = await apiGet(url);
    if (sections.length === 0) {
      sectionListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No sections found. Create one above.</td></tr>';
      return;
    }
    
    sectionListBody.innerHTML = sections.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.department}</td>
        <td>${s.description || '-'}</td>
        <td>
          <button class="delete-section-btn" data-id="${s._id}" data-name="${s.name}" data-dept="${s.department}" style="background: #dc3545; padding: 4px 8px; font-size: 0.8rem;">🗑️ Delete</button>
        </td>
      </tr>
    `).join("");
    
    // Add delete handlers
    document.querySelectorAll(".delete-section-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteSection(btn.dataset.id, btn.dataset.name, btn.dataset.dept));
    });
  } catch (err) {
    console.error("Error loading sections:", err);
    sectionListBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading sections</td></tr>';
  }
}

async function deleteSection(id, name, dept) {
  if (!confirm(`Are you sure you want to delete section "${name}" from ${dept}?`)) return;
  try {
    await apiDelete(`/admin/sections/${id}`);
    loadSectionList(sectionFilterDept.value);
    loadStats();
  } catch (err) {
    alert("Error deleting section: " + err.message);
  }
}

createSectionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  secMsg.textContent = "";
  
  const sectionData = {
    name: document.getElementById("secName").value,
    department: document.getElementById("secDepartment").value,
    description: document.getElementById("secDescription").value
  };
  
  try {
    await apiPost("/admin/sections", sectionData);
    secMsg.style.color = "green";
    secMsg.textContent = `Section "${sectionData.name}" created successfully!`;
    createSectionForm.reset();
    loadSectionList(sectionFilterDept.value);
    loadStats();
  } catch (err) {
    secMsg.style.color = "red";
    secMsg.textContent = err.message;
  }
});

sectionFilterDept.addEventListener("change", () => {
  loadSectionList(sectionFilterDept.value);
});

// ===================== COURSE MANAGEMENT =====================

const createCourseForm = document.getElementById("createCourseForm");
const courseMsg = document.getElementById("courseMsg");
const courseListBody = document.getElementById("courseListBody");
const courseFilterDept = document.getElementById("courseFilterDept");
const courseFilterSem = document.getElementById("courseFilterSem");
const filterCoursesBtn = document.getElementById("filterCoursesBtn");

async function loadCourseList(department = "", semester = "") {
  try {
    let url = "/admin/courses";
    const params = [];
    if (department) params.push(`department=${encodeURIComponent(department)}`);
    if (semester) params.push(`semester=${semester}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    
    const courses = await apiGet(url);
    if (courses.length === 0) {
      courseListBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No courses found. Create one above.</td></tr>';
      return;
    }
    
    courseListBody.innerHTML = courses.map(c => `
      <tr>
        <td><strong>${c.courseCode}</strong></td>
        <td>${c.courseName}</td>
        <td>${c.department?.name || c.department}</td>
        <td>Semester ${c.semester}</td>
        <td>${c.credits}</td>
        <td>
          <button class="delete-course-btn" data-id="${c._id}" data-name="${c.courseName}" style="background: #dc3545; padding: 4px 8px; font-size: 0.8rem;">🗑️ Delete</button>
        </td>
      </tr>
    `).join("");
    
    // Add delete handlers
    document.querySelectorAll(".delete-course-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteCourse(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    console.error("Error loading courses:", err);
    courseListBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading courses</td></tr>';
  }
}

async function deleteCourse(id, name) {
  if (!confirm(`Are you sure you want to delete course "${name}"?`)) return;
  try {
    await apiDelete(`/admin/courses/${id}`);
    loadCourseList(courseFilterDept.value, courseFilterSem.value);
    loadStats();
  } catch (err) {
    alert("Error deleting course: " + err.message);
  }
}

createCourseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  courseMsg.textContent = "";
  
  const courseData = {
    department: document.getElementById("courseDepartment").value,
    semester: document.getElementById("courseSemester").value,
    courseCode: document.getElementById("courseCode").value,
    courseName: document.getElementById("courseName").value,
    credits: document.getElementById("courseCredits").value || 3,
    description: document.getElementById("courseDescription").value
  };
  
  try {
    await apiPost("/admin/courses", courseData);
    courseMsg.style.color = "green";
    courseMsg.textContent = `Course "${courseData.courseCode} - ${courseData.courseName}" created successfully!`;
    createCourseForm.reset();
    loadCourseList(courseFilterDept.value, courseFilterSem.value);
    loadStats();
  } catch (err) {
    courseMsg.style.color = "red";
    courseMsg.textContent = err.message;
  }
});

filterCoursesBtn.addEventListener("click", () => {
  loadCourseList(courseFilterDept.value, courseFilterSem.value);
});

// Load departments for course management dropdowns
async function loadCourseDepartmentDropdowns() {
  try {
    const departments = await apiGet("/admin/departments");
    const courseDepartment = document.getElementById("courseDepartment");
    
    courseDepartment.innerHTML = '<option value="">Select Department</option>';
    departments.forEach(d => {
      courseDepartment.innerHTML += `<option value="${d._id}">${d.name} (${d.code})</option>`;
    });
    
    courseFilterDept.innerHTML = '<option value="">All Departments</option>';
    departments.forEach(d => {
      courseFilterDept.innerHTML += `<option value="${d._id}">${d.name}</option>`;
    });
  } catch (err) {
    console.error("Error loading course department dropdowns:", err);
  }
}

// Load sections for student form dropdown based on selected department
async function loadStudentSectionDropdown() {
  const csDepartment = document.getElementById("csDepartment");
  const csSection = document.getElementById("csSection");
  
  async function updateSections() {
    const dept = csDepartment.value;
    csSection.innerHTML = '<option value="">Select Section (Optional)</option>';
    
    if (dept) {
      try {
        const sections = await apiGet(`/admin/sections?department=${encodeURIComponent(dept)}`);
        sections.forEach(s => {
          csSection.innerHTML += `<option value="${s.name}">${s.name}${s.description ? ' - ' + s.description : ''}</option>`;
        });
      } catch (err) {
        console.error("Error loading sections:", err);
      }
    }
  }
  
  csDepartment.addEventListener("change", updateSections);
}

analyticsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const params = new URLSearchParams();
  const dep = document.getElementById("anDepartment").value;
  const sem = document.getElementById("anSemester").value;
  const sec = document.getElementById("anSection").value;
  const name = document.getElementById("anCourseName").value;
  if (dep) params.append("department", dep);
  if (sem) params.append("semester", sem);
  if (sec) params.append("section", sec);
  if (name) params.append("courseName", name);

  const report = await apiGet(`/analytics/report?${params.toString()}`);
  renderAnalytics(report);
});

exportCsvBtn.addEventListener("click", () => {
  const params = new URLSearchParams();
  const dep = document.getElementById("anDepartment").value;
  const sem = document.getElementById("anSemester").value;
  const sec = document.getElementById("anSection").value;
  const name = document.getElementById("anCourseName").value;
  if (dep) params.append("department", dep);
  if (sem) params.append("semester", sem);
  if (sec) params.append("section", sec);
  if (name) params.append("courseName", name);

  window.open(`http://localhost:5000/analytics/export?${params.toString()}`);
});

function renderAnalytics(report) {
  analyticsTable.innerHTML = "";
  if (!report.length) return;

  const header = `
    <tr>
      <th>Course</th>
      <th>Classes</th>
      <th>Present</th>
      <th>Absent</th>
      <th>Avg %</th>
    </tr>
  `;
  const rows = report
    .map(
      (r) => `
      <tr>
        <td>${r.class.courseCode} - ${r.class.courseName}</td>
        <td>${r.totalClassesConducted}</td>
        <td>${r.presentCount}</td>
        <td>${r.absentCount}</td>
        <td>${r.averageAttendance}%</td>
      </tr>`
    )
    .join("");
  analyticsTable.innerHTML = header + rows;

  const ctx = document.getElementById("adminChart");
  const labels = report.map((r) => r.class.courseCode);
  const data = report.map((r) => r.averageAttendance);
  if (adminChart) adminChart.destroy();
  adminChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Average %",
          data,
          backgroundColor: "#1b1f3b"
        }
      ]
    }
  });
}

async function loadProfile() {
    const currentUser = getUser();
    profileDetails.innerHTML = `
        <div class="upcoming-class-grid">
            <p><strong>Name:</strong></p><p>${currentUser?.name || "Admin"}</p>
            <p><strong>Email:</strong></p><p>${currentUser?.email || "N/A"}</p>
            <p><strong>Role:</strong></p><p>${currentUser?.role || "admin"}</p>
        </div>
    `;
}

// Promotion Preview
previewPromotionBtn.addEventListener("click", async () => {
  prMsg.textContent = "";
  const department = document.getElementById("prDepartment").value;
  const semester = document.getElementById("prFromSemester").value;
  const section = document.getElementById("prSection").value;

  if (!semester) {
    prMsg.style.color = "red";
    prMsg.textContent = "Please select a semester";
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append("semester", semester);
    if (department) params.append("department", department);
    if (section) params.append("section", section);

    const result = await apiGet(`/admin/promote/preview?${params.toString()}`);
    
    previewCount.textContent = result.count;
    
    if (result.count === 0) {
      previewTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No students found for the selected criteria</td></tr>`;
    } else {
      previewTableBody.innerHTML = result.students.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.email}</td>
          <td>${s.department || 'N/A'}</td>
          <td>${s.semester}</td>
          <td>${s.section || 'N/A'}</td>
        </tr>
      `).join("");
    }
    
    promotionPreview.style.display = "block";
  } catch (err) {
    prMsg.style.color = "red";
    prMsg.textContent = err.message;
  }
});

// Promote Students
promoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  prMsg.textContent = "";

  const department = document.getElementById("prDepartment").value;
  const fromSemester = document.getElementById("prFromSemester").value;
  const section = document.getElementById("prSection").value;

  if (!fromSemester) {
    prMsg.style.color = "red";
    prMsg.textContent = "Please select a semester";
    return;
  }

  const confirmMsg = fromSemester === "8" 
    ? "Are you sure you want to mark these students as graduated?" 
    : `Are you sure you want to promote students from semester ${fromSemester} to semester ${parseInt(fromSemester) + 1}?`;

  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    let result;
    const body = { fromSemester };
    if (department) body.department = department;
    if (section) body.section = section;

    if (fromSemester === "8") {
      result = await apiPost("/admin/graduate", body);
    } else {
      result = await apiPost("/admin/promote", body);
    }

    prMsg.style.color = "green";
    prMsg.textContent = result.message;
    promotionPreview.style.display = "none";
    loadStats(); // Refresh stats
  } catch (err) {
    prMsg.style.color = "red";
    prMsg.textContent = err.message;
  }
});

// Initial load
switchView("dashboard");
loadStats().catch(console.error);
loadProfile();

// ===================== FACULTY SCHEDULE MANAGEMENT =====================

let currentFacultyId = null;
let currentFacultySchedule = null;
let facultyClasses = [];
let allFacultyList = [];

const ttDepartmentFilter = document.getElementById("ttDepartmentFilter");
const ttFacultySelect = document.getElementById("ttFaculty");
const ttFacultyInfo = document.getElementById("ttFacultyInfo");
const loadFacultyScheduleBtn = document.getElementById("loadFacultyScheduleBtn");
const addSlotBtn = document.getElementById("addSlotBtn");
const slotMsg = document.getElementById("slotMsg");
const adminTimetableBody = document.getElementById("adminTimetableBody");
const slotCourseSelect = document.getElementById("slotCourse");
const saveScheduleBtn = document.getElementById("saveScheduleBtn");
const scheduleStatus = document.getElementById("scheduleStatus");

// Load all faculty members for timetable dropdown
async function loadFacultyDropdown() {
  try {
    console.log("Loading faculty dropdown...");
    const users = await apiGet("/admin/users?role=faculty");
    console.log("Faculty users received:", users);
    allFacultyList = users;
    console.log("ttFacultySelect element:", ttFacultySelect);
    filterFacultyByDepartment();
  } catch (err) {
    console.error("Error loading faculty list:", err);
  }
}

// Alias for initial load
const loadFacultyList = loadFacultyDropdown;

// Filter faculty by department
function filterFacultyByDepartment() {
  const selectedDept = ttDepartmentFilter.value;
  const filteredFaculty = selectedDept 
    ? allFacultyList.filter(f => f.department === selectedDept)
    : allFacultyList;
  
  ttFacultySelect.innerHTML = '<option value="">Select Faculty</option>';
  filteredFaculty.forEach(f => {
    ttFacultySelect.innerHTML += `<option value="${f._id}" data-dept="${f.department || ''}" data-email="${f.email}">${f.name} (${f.department || 'No Dept'})</option>`;
  });
  
  // Reset faculty info when filter changes
  ttFacultyInfo.value = "";
}

// Department filter change handler
ttDepartmentFilter.addEventListener("change", filterFacultyByDepartment);

// Show faculty info when selected
ttFacultySelect.addEventListener("change", () => {
  const selectedOption = ttFacultySelect.options[ttFacultySelect.selectedIndex];
  if (selectedOption.value) {
    ttFacultyInfo.value = `${selectedOption.dataset.email} | ${selectedOption.dataset.dept || 'No Department'}`;
  } else {
    ttFacultyInfo.value = "";
  }
});

// Load faculty's schedule and classes
loadFacultyScheduleBtn.addEventListener("click", async () => {
  const facultyId = ttFacultySelect.value;
  
  if (!facultyId) {
    alert("Please select a faculty member");
    return;
  }
  
  currentFacultyId = facultyId;
  
  try {
    // Get selected faculty's department
    const selectedFaculty = ttFacultySelect.options[ttFacultySelect.selectedIndex];
    const facultyDept = selectedFaculty.dataset.dept;
    
    // Load ALL courses (not just assigned classes) - filtered by faculty's department if available
    let coursesUrl = "/admin/courses";
    if (facultyDept) {
      // First get the department ID
      const departments = await apiGet("/admin/departments");
      const dept = departments.find(d => d.name === facultyDept);
      if (dept) {
        coursesUrl += `?department=${dept._id}`;
      }
    }
    const courses = await apiGet(coursesUrl);
    
    // Populate course dropdown with available courses
    slotCourseSelect.innerHTML = '<option value="">Select Course</option>';
    courses.forEach(c => {
      const deptName = c.department?.name || c.department;
      const deptCode = c.department?.code || deptName?.substring(0,3);
      slotCourseSelect.innerHTML += `<option value="${c._id}" data-code="${c.courseCode}" data-name="${c.courseName}" data-dept="${deptName}" data-dept-id="${c.department?._id || c.department}" data-sem="${c.semester}">${c.courseCode} - ${c.courseName} (Sem ${c.semester}, ${deptCode})</option>`;
    });
    
    // Reset section dropdown
    document.getElementById("slotSection").innerHTML = '<option value="">Select Section</option>';
    
    if (courses.length === 0) {
      slotMsg.style.color = "orange";
      slotMsg.textContent = "No courses found. Create courses first in Manage Courses.";
    } else {
      slotMsg.textContent = "";
    }
    
    // Load faculty's schedule
    const schedule = await apiGet(`/admin/faculty-schedule?facultyId=${facultyId}`);
    currentFacultySchedule = schedule || { facultyId, schedule: {} };
    
    renderFacultySchedule();
  } catch (err) {
    console.error("Error loading faculty schedule:", err);
    alert("Error loading schedule: " + err.message);
  }
});

// Load sections when course is selected
slotCourseSelect.addEventListener("change", async () => {
  const slotSection = document.getElementById("slotSection");
  const selectedOption = slotCourseSelect.options[slotCourseSelect.selectedIndex];
  
  slotSection.innerHTML = '<option value="">Select Section</option>';
  
  if (selectedOption.value && selectedOption.dataset.dept) {
    try {
      const deptName = selectedOption.dataset.dept;
      const sections = await apiGet(`/admin/sections?department=${encodeURIComponent(deptName)}`);
      sections.forEach(s => {
        slotSection.innerHTML += `<option value="${s.name}">${s.name}${s.description ? ' - ' + s.description : ''}</option>`;
      });
    } catch (err) {
      console.error("Error loading sections:", err);
    }
  }
});

// Add time slot to faculty schedule
addSlotBtn.addEventListener("click", async () => {
  slotMsg.textContent = "";
  
  if (!currentFacultyId) {
    slotMsg.style.color = "red";
    slotMsg.textContent = "Please select a faculty first";
    return;
  }
  
  const day = document.getElementById("slotDay").value;
  const startTime = document.getElementById("slotStart").value;
  const endTime = document.getElementById("slotEnd").value;
  const courseSelect = document.getElementById("slotCourse");
  const selectedOption = courseSelect.options[courseSelect.selectedIndex];
  const courseId = courseSelect.value;
  const section = document.getElementById("slotSection").value;
  
  if (!startTime || !endTime || !courseId) {
    slotMsg.style.color = "red";
    slotMsg.textContent = "Please fill Day, Start Time, End Time, and Course";
    return;
  }
  
  try {
    await apiPost("/admin/faculty-schedule/slot", {
      facultyId: currentFacultyId,
      day,
      startTime,
      endTime,
      courseId,
      courseCode: selectedOption.dataset.code,
      courseName: selectedOption.dataset.name,
      department: selectedOption.dataset.dept,
      semester: selectedOption.dataset.sem,
      section
    });
    
    slotMsg.style.color = "green";
    slotMsg.textContent = "Class added to schedule!";
    
    // Reload schedule
    loadFacultyScheduleBtn.click();
    
    // Reset form
    document.getElementById("slotStart").value = "";
    document.getElementById("slotEnd").value = "";
    document.getElementById("slotSection").value = "";
  } catch (err) {
    slotMsg.style.color = "red";
    slotMsg.textContent = err.message;
  }
});

function renderFacultySchedule() {
  if (!currentFacultySchedule || !currentFacultySchedule.schedule) {
    adminTimetableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No schedule found</td></tr>';
    return;
  }
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const schedule = currentFacultySchedule.schedule;
  
  // Get all unique time slots
  const timeSlots = new Set();
  for (const day of days) {
    if (schedule[day]) {
      schedule[day].forEach(slot => {
        timeSlots.add(`${slot.startTime}|${slot.endTime}`);
      });
    }
  }
  
  if (timeSlots.size === 0) {
    adminTimetableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No classes scheduled yet. Add classes above.</td></tr>';
    return;
  }
  
  // Sort time slots
  const sortedTimeSlots = Array.from(timeSlots).sort((a, b) => a.localeCompare(b));
  
  // Build table rows
  let html = '';
  for (const timeSlot of sortedTimeSlots) {
    const [startTime, endTime] = timeSlot.split('|');
    html += `<tr><td><strong>${startTime} - ${endTime}</strong></td>`;
    
    for (const day of days) {
      const slot = schedule[day]?.find(s => s.startTime === startTime);
      if (slot) {
        html += `<td class="timetable-cell">
          <div class="course-code">${slot.courseCode}</div>
          <div class="course-name">${slot.courseName}</div>
          <div class="section" style="font-weight: bold; color: #007bff;">Section: ${slot.section || 'N/A'}</div>
          <div style="font-size: 0.65rem; color: #888;">${slot.department?.substring(0,3) || ''} - Sem ${slot.semester || ''}</div>
          <button class="delete-slot-btn" data-day="${day}" data-time="${startTime}" style="background: #dc3545; padding: 2px 6px; font-size: 0.7rem; margin-top: 5px;">×</button>
        </td>`;
      } else {
        html += '<td></td>';
      }
    }
    
    html += '</tr>';
  }
  
  adminTimetableBody.innerHTML = html;
  
  // Add delete handlers
  document.querySelectorAll(".delete-slot-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this time slot?")) return;
      
      const day = btn.dataset.day;
      const startTime = btn.dataset.time;
      
      try {
        await apiPost("/admin/faculty-schedule/slot/delete", {
          facultyId: currentFacultyId,
          day,
          startTime
        });
        
        loadFacultyScheduleBtn.click();
      } catch (err) {
        alert("Error deleting slot: " + err.message);
      }
    });
  });
}

// Save Schedule button handler
saveScheduleBtn.addEventListener("click", async () => {
  if (!currentFacultyId) {
    alert("Please select a faculty member first");
    return;
  }
  
  if (!currentFacultySchedule || !currentFacultySchedule.schedule) {
    alert("No schedule to save");
    return;
  }
  
  try {
    saveScheduleBtn.disabled = true;
    saveScheduleBtn.textContent = "Saving...";
    
    // Save the complete schedule
    await apiPost("/admin/faculty-schedule/save", {
      facultyId: currentFacultyId,
      schedule: currentFacultySchedule.schedule
    });
    
    scheduleStatus.style.color = "#28a745";
    scheduleStatus.textContent = "✓ Schedule saved successfully!";
    
    setTimeout(() => {
      scheduleStatus.textContent = "";
    }, 3000);
  } catch (err) {
    scheduleStatus.style.color = "#dc3545";
    scheduleStatus.textContent = "✗ Error saving: " + err.message;
  } finally {
    saveScheduleBtn.disabled = false;
    saveScheduleBtn.textContent = "💾 Save Schedule";
  }
});