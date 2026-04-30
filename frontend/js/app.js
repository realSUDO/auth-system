const API = window.location.origin;

let adminSecret = null;

function getToken() { return localStorage.getItem('auth_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('auth_user') || 'null'); }

function saveAuth(token, user) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

// ---- Page routing ----
const PAGES = ['pageAuth', 'pageDashboard', 'pageDocs', 'pageRequest', 'pageAdmin'];

function showPage(id) {
  PAGES.forEach(p => document.getElementById(p).classList.toggle('hidden', p !== id));
}

function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('signupForm').classList.toggle('active', tab === 'signup');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
}

function showAdmin() {
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('adminLockCard').classList.remove('hidden');
  showPage('pageAdmin');
}

// ---- Dashboard ----
function renderDashboard(user, token) {
  document.getElementById('topbarEmail').textContent = user.email;
  document.getElementById('avatarLetter').textContent = (user.name || user.email)[0].toUpperCase();
  document.getElementById('dashName').textContent = user.name || '—';
  document.getElementById('dashEmail').textContent = user.email;
  document.getElementById('dashToken').textContent = token;
  showPage('pageDashboard');
}

function logout() { clearAuth(); showPage('pageAuth'); }

// ---- Event listeners ----
document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
document.getElementById('tabSignup').addEventListener('click', () => switchTab('signup'));
document.getElementById('adminLink').addEventListener('click', (e) => { e.preventDefault(); showAdmin(); });
document.getElementById('adminBackBtn').addEventListener('click', () => showPage('pageAuth'));
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('docsLink').addEventListener('click', (e) => { e.preventDefault(); showPage('pageDocs'); });
document.getElementById('docsBackBtn').addEventListener('click', () => showPage('pageAuth'));
document.getElementById('docsRequestLink').addEventListener('click', (e) => { e.preventDefault(); showPage('pageRequest'); });
document.getElementById('requestLink').addEventListener('click', (e) => { e.preventDefault(); showPage('pageRequest'); });
document.getElementById('requestBackBtn').addEventListener('click', () => showPage('pageAuth'));

// ---- Login ----
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('liBtn');
  const err = document.getElementById('liError');
  btn.disabled = true; btn.textContent = 'Logging in...'; err.textContent = '';
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('liEmail').value, password: document.getElementById('liPass').value }),
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Login failed'; return; }
    saveAuth(data.accessToken, data.user);
    renderDashboard(data.user, data.accessToken);
  } catch { err.textContent = 'Network error'; }
  finally { btn.disabled = false; btn.textContent = 'Login'; }
});

// ---- Signup ----
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('suBtn');
  const err = document.getElementById('suError');
  btn.disabled = true; btn.textContent = 'Creating account...'; err.textContent = '';
  try {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: document.getElementById('suName').value, email: document.getElementById('suEmail').value, password: document.getElementById('suPass').value }),
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Signup failed'; return; }
    saveAuth(data.accessToken, data.user);
    renderDashboard(data.user, data.accessToken);
  } catch { err.textContent = 'Network error'; }
  finally { btn.disabled = false; btn.textContent = 'Create account'; }
});

// ---- Request Access ----
document.getElementById('requestForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('reqBtn');
  const err = document.getElementById('reqError');
  btn.disabled = true; btn.textContent = 'Submitting...'; err.textContent = '';
  try {
    const res = await fetch(`${API}/oauth/request-access`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: document.getElementById('reqAppName').value,
        redirectUri: document.getElementById('reqRedirect').value,
        email: document.getElementById('reqEmail').value,
        description: document.getElementById('reqDesc').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Submission failed'; return; }
    document.getElementById('requestFormCard').classList.add('hidden');
    document.getElementById('requestSuccess').classList.remove('hidden');
  } catch { err.textContent = 'Network error'; }
  finally { btn.disabled = false; btn.textContent = 'Submit request'; }
});

// ---- Admin unlock ----
document.getElementById('adminAuthForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const secret = document.getElementById('adminSecret').value;
  const err = document.getElementById('adminError');
  err.textContent = '';
  const res = await fetch(`${API}/oauth/requests`, { headers: { 'x-admin-secret': secret } });
  if (res.status === 401) { err.textContent = 'Invalid secret'; return; }
  adminSecret = secret;
  document.getElementById('adminLockCard').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  renderPendingRequests(await res.json());
});

// ---- Pending requests ----
function renderPendingRequests(requests) {
  const list = document.getElementById('pendingList');
  if (!requests.length) { list.innerHTML = '<p class="muted">No pending requests.</p>'; return; }
  list.innerHTML = requests.map(r => `
    <div class="request-item" id="req-${r.id}">
      <div class="req-info">
        <strong>${r.appName}</strong>
        <span class="muted">${r.email}</span>
        <code>${r.redirectUri}</code>
        ${r.description ? `<span class="muted">${r.description}</span>` : ''}
      </div>
      <div class="req-actions">
        <button class="btn-approve" data-id="${r.id}">Approve</button>
        <button class="btn-reject" data-id="${r.id}">Reject</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.btn-approve').forEach(btn => btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    btn.disabled = true; btn.textContent = 'Approving...';
    const res = await fetch(`${API}/oauth/requests/${id}/approve`, { method: 'POST', headers: { 'x-admin-secret': adminSecret } });
    if (res.ok) document.getElementById(`req-${id}`).remove();
    else btn.textContent = 'Failed';
  }));

  list.querySelectorAll('.btn-reject').forEach(btn => btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    const res = await fetch(`${API}/oauth/requests/${id}/reject`, { method: 'POST', headers: { 'x-admin-secret': adminSecret } });
    if (res.ok) document.getElementById(`req-${id}`).remove();
  }));
}

// ---- Register client directly ----
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('registerError');
  err.textContent = '';
  const res = await fetch(`${API}/oauth/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
    body: JSON.stringify({ name: document.getElementById('clientName').value, redirectUri: document.getElementById('clientRedirect').value }),
  });
  const data = await res.json();
  if (!res.ok) { err.textContent = data.error || 'Failed'; return; }
  const box = document.getElementById('newClientResult');
  box.classList.remove('hidden');
  box.innerHTML = `
    <strong>${data.name}</strong>
    <div>Client ID: <code>${data.clientId}</code></div>
    <div>Client Secret: <span class="secret">${data.clientSecret}</span></div>
    <div>Redirect URI: <code>${data.redirectUri}</code></div>
    <p class="note">Save the client secret — it will not be shown again.</p>
  `;
  document.getElementById('registerForm').reset();
});

// ---- Init ----
const user = getUser();
const token = getToken();
if (user && token) renderDashboard(user, token);
else showPage('pageAuth');
