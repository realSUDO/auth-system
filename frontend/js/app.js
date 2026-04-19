const API = 'http://localhost:8080';

function show(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

async function signup() {
  const r = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('su-name').value,
      email: document.getElementById('su-email').value,
      password: document.getElementById('su-pass').value,
    }),
  });
  const data = await r.json();
  document.getElementById('su-out').textContent = JSON.stringify(data, null, 2);
  if (data.accessToken) localStorage.setItem('token', data.accessToken);
}

async function login() {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('li-email').value,
      password: document.getElementById('li-pass').value,
    }),
  });
  const data = await r.json();
  document.getElementById('li-out').textContent = JSON.stringify(data, null, 2);
  if (data.accessToken) {
    localStorage.setItem('token', data.accessToken);
    document.getElementById('v-token').value = data.accessToken;
  }
}

async function verifyToken() {
  const token = document.getElementById('v-token').value;
  const r = await fetch(`${API}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  document.getElementById('v-out').textContent = JSON.stringify(await r.json(), null, 2);
}

async function loadOidc() {
  const r = await fetch(`${API}/.well-known/openid-configuration`);
  document.getElementById('oidc-out').textContent = JSON.stringify(await r.json(), null, 2);
}

async function loadJwks() {
  const r = await fetch(`${API}/jwks`);
  document.getElementById('jwks-out').textContent = JSON.stringify(await r.json(), null, 2);
}
