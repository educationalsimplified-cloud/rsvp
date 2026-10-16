/* ============================================================
   Admin dashboard logic — The Cradle Schools 20th Anniversary
   NOTE: A static frontend cannot securely read Netlify Form
   submissions. Submissions are fetched from a Netlify Function
   at /.netlify/functions/rsvps which must run on the server with
   authentication and secrets (NETLIFY_API_TOKEN etc.) kept in
   Netlify environment variables — never in this file.
   ============================================================ */

const API_URL = '/.netlify/functions/rsvps';

const signInSection = document.getElementById('signInSection');
const dashboardSection = document.getElementById('dashboardSection');
const signInForm = document.getElementById('signInForm');
const signInBtn = document.getElementById('signInBtn');
const logoutBtn = document.getElementById('logoutBtn');

const submissionsBody = document.getElementById('submissionsBody');
const statsEl = {
  total: document.getElementById('statTotal'),
  accepted: document.getElementById('statAccepted'),
  declined: document.getElementById('statDeclined'),
  extra: document.getElementById('statExtra'),
  attendees: document.getElementById('statAttendees'),
};
const filterBtns = document.querySelectorAll('[data-filter]');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const errorBanner = document.getElementById('errorBanner');
const errorMessage = document.getElementById('errorMessage');
const exportBtn = document.getElementById('exportCsv');
const modalOverlay = document.getElementById('modalOverlay');
const closeModal = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');

let allSubmissions = [];
let currentFilter = 'all';
let searchTerm = '';

/* ---------- Authentication (UI demo only) ----------

 
/* ---------- Server-backed authentication ---------- */

const loginUrl = '/.netlify/functions/auth-login';
const sessionUrl = '/.netlify/functions/auth-session';
const logoutUrl = '/.netlify/functions/auth-logout';

const usernameInput = document.getElementById('adminUsername');
const passwordInput = document.getElementById('adminPassword');

async function signIn(event) {
  event.preventDefault();

  const username = usernameInput.value;
  const password = passwordInput.value;

  signInBtn.disabled = true;
  signInBtn.textContent = 'Signing in…';

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok || result.authenticated !== true) {
      errorMessage.textContent =
        result.error || 'Invalid username or password.';
      errorBanner.classList.remove('hidden');
      return;
    }

    passwordInput.value = '';
    errorBanner.classList.add('hidden');

    await showDashboard();
  } catch (error) {
    console.error('Sign-in request failed.');
    errorMessage.textContent =
      'Unable to sign in. Please check your connection and try again.';
    errorBanner.classList.remove('hidden');
  } finally {
    signInBtn.disabled = false;
    signInBtn.textContent = 'Sign in';
  }
}

async function showDashboard() {
  const response = await fetch(sessionUrl, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) {
    dashboardSection.classList.add('hidden');
    signInSection.classList.remove('hidden');
    return;
  }

  const result = await response.json();

  if (result.authenticated !== true) {
    dashboardSection.classList.add('hidden');
    signInSection.classList.remove('hidden');
    return;
  }

  signInSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');

  await loadSubmissions();
}

async function signOut() {
  logoutBtn.disabled = true;

  try {
    await fetch(logoutUrl, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Logout request failed.');
  } finally {
    allSubmissions = [];
    submissionsBody.innerHTML = '';

    dashboardSection.classList.add('hidden');
    signInSection.classList.remove('hidden');
    signInForm.reset();

    logoutBtn.disabled = false;
  }
}

signInForm.addEventListener('submit', signIn);
logoutBtn.addEventListener('click', signOut);

// Check the server session when the page opens or reloads.
(async function initializeDashboard() {
  dashboardSection.classList.add('hidden');
  signInSection.classList.remove('hidden');

  try {
    const response = await fetch(sessionUrl, {
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (response.ok) {
      const result = await response.json();

      if (result.authenticated === true) {
        await showDashboard();
      }
    }
  } catch (error) {
    console.error('Could not verify the admin session.');
  }
})();



/* ---------- Data loading ---------- */

async function loadSubmissions() {
  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    allSubmissions = await response.json();
    if (!Array.isArray(allSubmissions)) allSubmissions = [];
    errorBanner.classList.add('hidden');
  } catch (error) {
    console.error(error);
    allSubmissions = [];
    errorMessage.textContent = 'Could not load submissions. The backend function is not configured yet — see netlify/functions/rsvps.js.';
    errorBanner.classList.remove('hidden');
  }
  render();
}

/* ---------- Rendering ---------- */

function normalized(submission) {
  return {
    name: submission.name || submission.guest_name || '—',
    email: submission.email || '—',
    contact: submission.contact || '—',
    attendance: submission.attendance || 'Pending',
    additional_guests: Number(submission.additional_guests || submission.extra_guests || 0),
    message: submission.message || submission.guest_note || '',
    created_at: submission.created_at || submission.submission_id || '—',
    id: submission.id || submission.submission_id || submission.created_at || '',
  };
}

function filterSubmissions() {
  const term = searchTerm.toLowerCase();
  return allSubmissions.map(normalized).filter(sub => {
    const matchFilter =
      currentFilter === 'all' ||
      (currentFilter === 'pending' && sub.attendance === 'Pending') ||
      sub.attendance.toLowerCase() === currentFilter;
    const matchSearch =
      sub.name.toLowerCase().includes(term) ||
      sub.contact.toLowerCase().includes(term) ||
      sub.email.toLowerCase().includes(term);
    return matchFilter && matchSearch;
  });
}

function stats(list) {
  const accepted = list.filter(s => s.attendance.toLowerCase() === 'accepted').length;
  const declined = list.filter(s => s.attendance.toLowerCase() === 'declined').length;
  const extra = list.reduce((sum, s) => sum + (s.attendance.toLowerCase() === 'accepted' ? s.additional_guests : 0), 0);
  const attendees = list.reduce((sum, s) => sum + (s.attendance.toLowerCase() === 'accepted' ? 1 + s.additional_guests : 0), 0);
  return { total: list.length, accepted, declined, extra, attendees };
}

function render() {
  const list = filterSubmissions();

  statsEl.total.textContent = list.length;
  statsEl.accepted.textContent = stats(list).accepted;
  statsEl.declined.textContent = stats(list).declined;
  statsEl.extra.textContent = stats(list).extra;
  statsEl.attendees.textContent = stats(list).attendees;

  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === currentFilter);
  });

  submissionsBody.innerHTML = '';
  if (list.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  list.forEach((sub, index) => {
    const statusClass = sub.attendance.toLowerCase();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(sub.name)}</td>
      <td>${escapeHtml(sub.contact)}</td>
      <td>${escapeHtml(sub.email)}</td>
      <td class="${statusClass}"><span class="badge ${statusClass}">${escapeHtml(sub.attendance)}</span></td>
      <td>${sub.additional_guests}</td>
      <td>${sub.attendance.toLowerCase() === 'accepted' ? 1 + sub.additional_guests : 0}</td>
      <td>${escapeHtml(sub.created_at)}</td>
      <td></td>
    `;
    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'btn-sm btn-outline-red';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => openDetail(sub));
    row.querySelector('td:last-child').appendChild(viewBtn);
    submissionsBody.appendChild(row);
  });
}

/* ---------- Search / filters ---------- */

searchInput.addEventListener('input', event => {
  searchTerm = event.target.value;
  render();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    render();
  });
});

/* ---------- CSV export ---------- */

exportBtn.addEventListener('click', () => {
  const list = filterSubmissions();
  const header = ['Guest name','Contact','Email','Attendance','Additional guests','Total attendees','Submitted'];
  const rows = list.map(sub => [
    `"${escapeHtml(sub.name)}"`,
    `"${escapeHtml(sub.contact)}"`,
    `"${escapeHtml(sub.email)}"`,
    `"${escapeHtml(sub.attendance)}"`,
    sub.additional_guests,
    sub.attendance.toLowerCase() === 'accepted' ? 1 + sub.additional_guests : 0,
    `"${escapeHtml(sub.created_at)}"`,
  ]);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'cradle-anniversary-rsvps.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

/* ---------- Detail modal ---------- */

window.openDetail = sub => {
  const total = sub.attendance.toLowerCase() === 'accepted' ? 1 + Number(sub.additional_guests) : 0;
  modalBody.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;width:35%;font-weight:700;color:var(--muted)">Guest</td><td style="padding:6px 0">${escapeHtml(sub.name)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;color:var(--muted)">Email</td><td style="padding:6px 0">${escapeHtml(sub.email)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;color:var(--muted)">Phone</td><td style="padding:6px 0">${escapeHtml(sub.contact)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;color:var(--muted)">Attendance</td><td style="padding:6px 0"><span class="badge ${sub.attendance.toLowerCase()}">${escapeHtml(sub.attendance)}</span></td></tr>
      <tr><td style="padding:6px 0;font-weight:700;color:var(--muted)">Additional guests</td><td style="padding:6px 0">${escapeHtml(sub.additional_guests)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;color:var(--muted)">Total attendees</td><td style="padding:6px 0">${total}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;color:var(--muted)">Submitted</td><td style="padding:6px 0">${escapeHtml(sub.created_at)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;color:var(--muted);vertical-align:top">Note</td><td style="padding:6px 0">${escapeHtml(sub.message) || '—'}</td></tr>
    </table>
  `;
  modalOverlay.classList.add('open');
};

closeModal.addEventListener('click', () => modalOverlay.classList.remove('open'));
modalOverlay.addEventListener('click', event => {
  if (event.target === modalOverlay) modalOverlay.classList.remove('open');
});

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
