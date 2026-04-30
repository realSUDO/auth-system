const API = window.location.origin; // served from same Express server

// ---- State ----
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
function showPage(id) {
  ['pageAuth', 'pageDashboard', 'pageAdmin'].forEach(p => {
    document.getElementById(p).classList.toggle('hidden', p !== id);
  });
}

function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('signupForm').classList.toggle('active', tab === 'signup');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
}

function showAdmin(e) {
  if (e) e.preventDefault();
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

function logout() {
  clearAuth();
  showPage('pageAuth');
}

// ---- Login ----
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('liBtn');
  const err = document.getElementById('liError');
  btn.disabled = true; btn.textContent = 'Logging in...'; err.textContent = '';
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('liEmail').value,
        password: document.getElementById('liPass').value,
      }),
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('suName').value,
        email: document.getElementById('suEmail').value,
        password: document.getElementById('suPass').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Signup failed'; return; }
    saveAuth(data.accessToken, data.user);
    renderDashboard(data.user, data.accessToken);
  } catch { err.textContent = 'Network error'; }
  finally { btn.disabled = false; btn.textContent = 'Create account'; }
});

// ---- Admin unlock ----
document.getElementById('adminAuthForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const secret = document.getElementById('adminSecret').value;
  const err = document.getElementById('adminError');
  err.textContent = '';

  // Test the secret by trying to register a dummy client — if 401, wrong secret
  const res = await fetch(`${API}/oauth/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
    body: JSON.stringify({ name: '__test__', redirectUri: 'http://test' }),
  });

  if (res.status === 401) { err.textContent = 'Invalid secret'; return; }

  // Valid — store secret and show panel (ignore the test registration result)
  adminSecret = secret;
  document.getElementById('adminLockCard').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
});

// ---- Register client ----
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('registerError');
  err.textContent = '';
  const res = await fetch(`${API}/oauth/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
    body: JSON.stringify({
      name: document.getElementById('clientName').value,
      redirectUri: document.getElementById('clientRedirect').value,
    }),
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
    <p class="note">Save the client secret now — it will not be shown again.</p>
  `;
  document.getElementById('registerForm').reset();
});

// ---- Init ----
const user = getUser();
const token = getToken();
if (user && token) renderDashboard(user, token);
else showPage('pageAuth');
