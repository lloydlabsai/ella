/* ═══════════════════════════════════════════════════════════
   Ella — Popup Script
   Handles login/signup UI, displays capture stats, and
   links to the main Ella web app.
   ═══════════════════════════════════════════════════════════ */

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');
const captureCountEl = document.getElementById('capture-count');
const recentList = document.getElementById('recent-list');
const captureCommentsToggle = document.getElementById('capture-comments-toggle');
const captureProfileBtn = document.getElementById('capture-profile-btn');
const profileStatus = document.getElementById('profile-status');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressSection = document.getElementById('progress-section');

const MIN_POSTS = 5;

// ─── VIEW SWITCHING ──────────────────────────────────────

function showLogin() {
  loginView.style.display = 'block';
  dashboardView.style.display = 'none';
  authError.style.display = 'none';
}

function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
}

function showError(msg) {
  authError.textContent = msg;
  authError.style.display = 'block';
}

function setButtonsLoading(loading) {
  loginBtn.disabled = loading;
  signupBtn.disabled = loading;
  loginBtn.textContent = loading ? 'Logging in…' : 'Log in';
}

// ─── AUTH ─────────────────────────────────────────────────

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.style.display = 'none';
  setButtonsLoading(true);

  const resp = await chrome.runtime.sendMessage({
    action: 'login',
    data: { email: emailInput.value, password: passwordInput.value },
  });

  setButtonsLoading(false);

  if (resp.success) {
    showDashboard();
    loadDashboardData();
  } else {
    showError(resp.error || 'Login failed');
  }
});

signupBtn.addEventListener('click', async () => {
  authError.style.display = 'none';
  if (!emailInput.value || !passwordInput.value) {
    showError('Enter email and password');
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = 'Signing up…';

  const resp = await chrome.runtime.sendMessage({
    action: 'signup',
    data: { email: emailInput.value, password: passwordInput.value },
  });

  signupBtn.disabled = false;
  signupBtn.textContent = 'Sign up';

  if (resp.success) {
    showDashboard();
    loadDashboardData();
  } else {
    showError(resp.error || 'Signup failed');
  }
});

logoutBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'logout' });
  showLogin();
});

document.getElementById('bulk-capture-btn').addEventListener('click', async () => {
  const btn = document.getElementById('bulk-capture-btn');
  btn.disabled = true;
  btn.textContent = 'Starting...';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { action: 'triggerBulkCapture' });
      btn.textContent = 'Running on page...';
      setTimeout(() => { btn.disabled = false; btn.textContent = 'Quick Capture All Visible Posts'; }, 3000);
    }
  } catch {
    btn.textContent = 'Navigate to LinkedIn first';
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Quick Capture All Visible Posts'; }, 2000);
  }
});

// ─── PROFILE CAPTURE ─────────────────────────────────────

captureProfileBtn.addEventListener('click', async () => {
  captureProfileBtn.disabled = true;
  captureProfileBtn.textContent = 'Capturing (this takes ~10s)...';
  profileStatus.textContent = 'Scrolling and reading your profile...';
  profileStatus.className = 'profile-capture__status';

  try {
    const resp = await chrome.runtime.sendMessage({ action: 'captureProfile' });
    if (resp?.success) {
      profileStatus.textContent = `Captured: ${resp.profile?.name || 'Profile saved'}`;
      profileStatus.classList.add('profile-capture__status--success');
      captureProfileBtn.textContent = 'Recapture Profile';
    } else {
      profileStatus.textContent = resp?.error || 'Capture failed';
      profileStatus.classList.add('profile-capture__status--error');
      captureProfileBtn.textContent = 'Capture My LinkedIn Profile';
    }
  } catch (err) {
    profileStatus.textContent = err.message || 'Capture failed';
    profileStatus.classList.add('profile-capture__status--error');
    captureProfileBtn.textContent = 'Capture My LinkedIn Profile';
  }
  captureProfileBtn.disabled = false;
});

// ─── SETTINGS ────────────────────────────────────────────

captureCommentsToggle.addEventListener('change', async () => {
  await chrome.runtime.sendMessage({
    action: 'setSetting',
    data: { key: 'captureComments', value: captureCommentsToggle.checked },
  });
});

document.getElementById('hot-threshold').addEventListener('change', async (e) => {
  const val = parseInt(e.target.value) || 100;
  await chrome.storage.local.set({ hotThreshold: val });
});

async function loadSettings() {
  const resp = await chrome.runtime.sendMessage({ action: 'getSettings' });
  captureCommentsToggle.checked = resp?.captureComments || false;
  const hotResp = await chrome.storage.local.get('hotThreshold');
  document.getElementById('hot-threshold').value = hotResp?.hotThreshold || 100;
}

// ─── DASHBOARD DATA ──────────────────────────────────────

async function loadDashboardData() {
  // Load capture count + profile context
  const statusResp = await chrome.runtime.sendMessage({ action: 'getStatus' });
  if (statusResp?.loggedIn) {
    const count = statusResp.captureCount ?? 0;
    captureCountEl.textContent = count;
    updateProgress(count);
    updateProfileStatus(statusResp.linkedinContext);
  }

  // Load recent captures
  const recentResp = await chrome.runtime.sendMessage({ action: 'getRecentCaptures' });
  renderRecentCaptures(recentResp?.posts || []);
}

function updateProfileStatus(linkedinContext) {
  const capturedInfo = document.getElementById('profile-captured-info');
  const notCaptured = document.getElementById('profile-not-captured');
  const nameEl = document.getElementById('profile-captured-name');
  const headlineEl = document.getElementById('profile-captured-headline');

  if (linkedinContext?.name) {
    capturedInfo.style.display = 'block';
    notCaptured.style.display = 'none';
    nameEl.textContent = `\u2713 ${linkedinContext.name}`;
    headlineEl.textContent = linkedinContext.headline || '';
  } else {
    capturedInfo.style.display = 'none';
    notCaptured.style.display = 'block';
  }
}

function updateProgress(count) {
  const pct = Math.min(100, Math.round((count / MIN_POSTS) * 100));
  progressBar.style.width = `${pct}%`;

  if (count >= 20) {
    progressBar.classList.add('progress__bar--complete');
    progressText.classList.add('progress__text--complete');
    progressText.textContent = `${count} posts — Ella knows your industry well`;
  } else if (count >= MIN_POSTS) {
    progressBar.classList.remove('progress__bar--complete');
    progressText.classList.remove('progress__text--complete');
    progressText.textContent = `${count}/20 posts — Ella's learning, ${20 - count} more to unlock full insights`;
  } else {
    progressBar.classList.remove('progress__bar--complete');
    progressText.classList.remove('progress__text--complete');
    progressText.textContent = `${count}/${MIN_POSTS} posts — ${MIN_POSTS - count} more and Ella starts finding what works`;
  }
}

function renderRecentCaptures(posts) {
  if (posts.length === 0) {
    recentList.innerHTML = '<li class="recent__empty">No captures yet</li>';
    return;
  }

  recentList.innerHTML = posts
    .map((p) => {
      const author = p.author_name || 'Unknown';
      const preview = (p.post_text || '').slice(0, 60) + (p.post_text?.length > 60 ? '…' : '');
      return `<li class="recent__item"><span class="recent__item-author">${escapeHtml(author)}</span>${escapeHtml(preview)}</li>`;
    })
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── INIT ─────────────────────────────────────────────────

async function init() {
  const resp = await chrome.runtime.sendMessage({ action: 'getAuthState' });
  if (resp?.loggedIn) {
    showDashboard();
    loadDashboardData();
    loadSettings();
  } else {
    showLogin();
  }
}

init();
