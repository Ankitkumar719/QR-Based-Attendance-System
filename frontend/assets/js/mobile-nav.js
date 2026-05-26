const sidebar = document.querySelector('.sidebar');
const body = document.body;
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileProfileBtn = document.getElementById('mobileProfileBtn');
const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

const navFallbacks = {
  dashboardBtn: ['dashboardBtn'],
  timeTableBtn: ['timeTableBtn', 'viewAttendanceBtn', 'timetableBtn'],
  analyticsBtn: ['analyticsBtn'],
  profileBtn: ['profileBtn']
};

function setSidebarOpen(open) {
  if (!sidebar) return;
  sidebar.classList.toggle('open', open);
  body.classList.toggle('sidebar-open', open);
}

function closeSidebar() {
  setSidebarOpen(false);
}

function toggleSidebar() {
  if (!sidebar) return;
  setSidebarOpen(!sidebar.classList.contains('open'));
}

function clickNavButton(buttonId) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.click();
    return true;
  }
  return false;
}

function navigateTo(key) {
  const candidates = navFallbacks[key] || [key];
  for (const candidate of candidates) {
    if (clickNavButton(candidate)) {
      return true;
    }
  }
  return false;
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleSidebar();
  });
}

if (mobileProfileBtn) {
  mobileProfileBtn.addEventListener('click', () => {
    navigateTo('profileBtn');
    closeSidebar();
  });
}

mobileNavItems.forEach((item) => {
  item.addEventListener('click', () => {
    const target = item.dataset.target;
    if (target) {
      navigateTo(target);
      mobileNavItems.forEach((child) => child.classList.remove('active'));
      item.classList.add('active');
    }
    closeSidebar();
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1100) {
    closeSidebar();
  }
});

document.addEventListener('click', (event) => {
  if (!sidebar || !sidebar.classList.contains('open')) return;
  if (event.target instanceof Element && !sidebar.contains(event.target) && !mobileMenuBtn?.contains(event.target)) {
    closeSidebar();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSidebar();
  }
});
