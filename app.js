/* =============================================
   PORTFOLIO MANAGEMENT SYSTEM — app.js
   Covers: Auth, Portfolio, Skills, Projects
   ============================================= */

/* ── 1. DATABASE (localStorage) ─────────────── */
const DB = {
  users: JSON.parse(localStorage.getItem('pms_users') || '[]'),

  save() {
    localStorage.setItem('pms_users', JSON.stringify(this.users));
  },

  findUser(email) {
    return this.users.find(u => u.email === email);
  },

  addUser(user) {
    this.users.push(user);
    this.save();
  },

  updateUser(email, data) {
    const i = this.users.findIndex(u => u.email === email);
    if (i > -1) {
      Object.assign(this.users[i], data);
      this.save();
    }
  }
};

/* ── 2. APP STATE ────────────────────────────── */
let state = {
  session:  JSON.parse(sessionStorage.getItem('pms_session') || 'null'),
  page:     'dashboard',
  modal:    null,
  authMode: 'login',
  authErr:  '',
  authOk:   '',
  flash:    null
};

/* ── 3. HELPERS ─────────────────────────────── */
function q(sel)  { return document.querySelector(sel); }

// Escape HTML to prevent XSS
function esc(s) {
  return String(s || '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// Get currently logged-in user object
function getUser() {
  return DB.findUser(state.session?.email);
}

// Show a temporary flash message
function flash(msg, type = 'success') {
  state.flash = { msg, type };
  render();
  setTimeout(() => { state.flash = null; render(); }, 3000);
}

// Client-side router
function nav(page) {
  state.page  = page;
  state.modal = null;
  render();
}

/* ── 4. AUTH FUNCTIONS ───────────────────────── */
function switchAuth(mode) {
  state.authMode = mode;
  state.authErr  = '';
  state.authOk   = '';
  render();
}

function doRegister() {
  const name  = q('#reg-name')?.value.trim();
  const email = q('#reg-email')?.value.trim().toLowerCase();
  const pw    = q('#reg-pw')?.value;

  if (!name || !email || !pw) {
    state.authErr = 'All fields are required.';
    return render();
  }
  if (pw.length < 6) {
    state.authErr = 'Password must be at least 6 characters.';
    return render();
  }
  if (DB.findUser(email)) {
    state.authErr = 'This email is already registered.';
    return render();
  }

  DB.addUser({
    name, email, pw,
    about: '', phone: '', location: '', website: '',
    linkedin: '', github: '',
    skills: [], projects: []
  });

  state.authErr  = '';
  state.authOk   = 'Account created! You can sign in now.';
  state.authMode = 'login';
  render();
}

function doLogin() {
  const email = q('#login-email')?.value.trim().toLowerCase();
  const pw    = q('#login-pw')?.value;
  const user  = DB.findUser(email);

  if (!user || user.pw !== pw) {
    state.authErr = 'Invalid email or password.';
    return render();
  }

  state.session  = { email };
  state.authErr  = '';
  state.authOk   = '';
  sessionStorage.setItem('pms_session', JSON.stringify(state.session));
  state.page = 'dashboard';
  render();
}

function doLogout() {
  state.session = null;
  sessionStorage.removeItem('pms_session');
  state.authMode = 'login';
  state.authErr  = '';
  state.authOk   = '';
  render();
}

/* ── 5. PORTFOLIO FUNCTIONS ──────────────────── */
function savePortfolio() {
  DB.updateUser(state.session.email, {
    name:     q('#pf-name').value.trim(),
    location: q('#pf-location').value.trim(),
    phone:    q('#pf-phone').value.trim(),
    website:  q('#pf-website').value.trim(),
    about:    q('#pf-about').value.trim(),
    linkedin: q('#pf-linkedin').value.trim(),
    github:   q('#pf-github').value.trim(),
  });
  flash('Portfolio saved successfully!');
}

/* ── 6. SKILLS FUNCTIONS ─────────────────────── */
function openModal(type, idx = null) {
  state.modal = { type, idx };
  render();
}

function closeModal() {
  state.modal = null;
  render();
}

function saveSkill(idx) {
  const name = q('#sk-name')?.value.trim();
  if (!name) return;

  const u      = getUser();
  const skills = [...(u?.skills || [])];
  const item   = {
    name,
    category: q('#sk-cat').value,
    level:    q('#sk-level').value,
    notes:    q('#sk-notes').value.trim()
  };

  if (idx !== null && idx !== undefined) {
    skills[idx] = item;   // UPDATE
  } else {
    skills.push(item);    // ADD
  }

  DB.updateUser(state.session.email, { skills });
  closeModal();
  flash(idx !== null && idx !== undefined ? 'Skill updated!' : 'Skill added!');
}

function deleteSkill(idx) {
  const u      = getUser();
  const skills = [...(u?.skills || [])];
  skills.splice(idx, 1);  // DELETE
  DB.updateUser(state.session.email, { skills });
  flash('Skill deleted.', 'error');
  render();
}

/* ── 7. PROJECTS FUNCTIONS ───────────────────── */
function saveProject(idx) {
  const title = q('#pr-title')?.value.trim();
  if (!title) return;

  const u        = getUser();
  const projects = [...(u?.projects || [])];
  const techRaw  = q('#pr-tech').value;
  const tech     = techRaw
    ? techRaw.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const item = {
    title,
    description: q('#pr-desc').value.trim(),
    status:      q('#pr-status').value,
    year:        q('#pr-year').value,
    tech,
    github: q('#pr-github').value.trim(),
    live:   q('#pr-live').value.trim()
  };

  if (idx !== null && idx !== undefined) {
    projects[idx] = item;  // UPDATE
  } else {
    projects.push(item);   // ADD
  }

  DB.updateUser(state.session.email, { projects });
  closeModal();
  flash(idx !== null && idx !== undefined ? 'Project updated!' : 'Project added!');
}

function deleteProject(idx) {
  const u        = getUser();
  const projects = [...(u?.projects || [])];
  projects.splice(idx, 1);  // DELETE
  DB.updateUser(state.session.email, { projects });
  flash('Project deleted.', 'error');
  render();
}

/* ── 8. HTML TEMPLATES ───────────────────────── */

/* --- AUTH PAGE --- */
function AuthPage() {
  const mode = state.authMode;
  return `
  <div class="auth-wrap">
    <div class="auth-box">
      <div class="auth-logo">PortfolioOS</div>
      <div class="auth-sub">${mode === 'login' ? 'Sign in to your portfolio' : 'Create your portfolio account'}</div>

      ${state.authErr ? `<div class="alert alert-danger">${state.authErr}</div>` : ''}
      ${state.authOk  ? `<div class="alert alert-success">${state.authOk}</div>` : ''}

      <div class="card">
        ${mode === 'register' ? `
          <div class="form-group">
            <label class="label">Full Name</label>
            <input id="reg-name" placeholder="Jane Smith" />
          </div>
          <div class="form-group">
            <label class="label">Email</label>
            <input id="reg-email" type="email" placeholder="jane@example.com" />
          </div>
          <div class="form-group">
            <label class="label">Password</label>
            <input id="reg-pw" type="password" placeholder="Min. 6 characters" />
          </div>
          <button class="btn-primary" style="width:100%" onclick="doRegister()">Create Account</button>
        ` : `
          <div class="form-group">
            <label class="label">Email</label>
            <input id="login-email" type="email" placeholder="jane@example.com" />
          </div>
          <div class="form-group">
            <label class="label">Password</label>
            <input id="login-pw" type="password" placeholder="Your password" />
          </div>
          <button class="btn-primary" style="width:100%" onclick="doLogin()">Sign In</button>
        `}
      </div>

      <div class="auth-toggle">
        ${mode === 'login'
          ? `Don't have an account? <a onclick="switchAuth('register')">Register</a>`
          : `Already have an account? <a onclick="switchAuth('login')">Sign in</a>`}
      </div>
    </div>
  </div>`;
}

/* --- APP SHELL (sidebar + page content) --- */
function Shell(content) {
  const u = getUser();
  const navItems = [
    { id: 'dashboard', icon: '⊡', label: 'Dashboard' },
    { id: 'portfolio', icon: '◈', label: 'Portfolio' },
    { id: 'skills',    icon: '◎', label: 'Skills' },
    { id: 'projects',  icon: '◻', label: 'Projects' },
  ];

  return `
  <div class="shell">
    <aside class="sidebar">
      <div class="sidebar-logo">PortfolioOS</div>

      <div class="sidebar-user">
        <div class="sidebar-user-name">${esc(u?.name || 'User')}</div>
        <div class="sidebar-user-email">${esc(u?.email || '')}</div>
      </div>

      ${navItems.map(n => `
        <button class="nav-item ${state.page === n.id ? 'active' : ''}" onclick="nav('${n.id}')">
          <span class="nav-icon">${n.icon}</span> ${n.label}
        </button>`).join('')}

      <div style="flex:1"></div>

      <button class="nav-item" onclick="doLogout()" style="margin-top:auto; color:var(--red)">
        <span class="nav-icon">⤶</span> Logout
      </button>
    </aside>

    <main class="main">
      ${state.flash ? `
        <div class="alert flash-bar ${state.flash.type === 'success' ? 'alert-success' : 'alert-danger'}">
          ${state.flash.msg}
        </div>` : ''}
      ${content}
      ${state.modal ? renderModal() : ''}
    </main>
  </div>`;
}

/* --- DASHBOARD PAGE --- */
function DashboardPage() {
  const u        = getUser();
  const skills   = u?.skills   || [];
  const projects = u?.projects || [];
  const filled   = [u?.name, u?.about, u?.phone, u?.location, u?.website].filter(Boolean).length;
  const completion = Math.round((filled / 5) * 100);

  return Shell(`
    <div class="page-title">Dashboard</div>
    <div class="page-sub">Welcome back, ${esc(u?.name)}! Here's your portfolio overview.</div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-val">${skills.length}</div>
        <div class="stat-label">Skills Added</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${projects.length}</div>
        <div class="stat-label">Projects Listed</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${completion}%</div>
        <div class="stat-label">Profile Complete</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="flex items-center justify-between" style="margin-bottom:1rem">
        <strong>Recent Skills</strong>
        <button class="btn-secondary btn-sm" onclick="nav('skills')">View all</button>
      </div>
      ${skills.length === 0
        ? `<p class="text-muted text-small">No skills yet.
             <a onclick="nav('skills')" style="color:var(--accent2);cursor:pointer">Add your first skill →</a></p>`
        : skills.slice(-3).map(s => `
            <div class="flex items-center justify-between" style="margin-bottom:.6rem">
              <span>${esc(s.name)}</span>
              <span class="badge badge-accent">${esc(s.level)}</span>
            </div>`).join('')}
    </div>

    <div class="card">
      <div class="flex items-center justify-between" style="margin-bottom:1rem">
        <strong>Recent Projects</strong>
        <button class="btn-secondary btn-sm" onclick="nav('projects')">View all</button>
      </div>
      ${projects.length === 0
        ? `<p class="text-muted text-small">No projects yet.
             <a onclick="nav('projects')" style="color:var(--accent2);cursor:pointer">Add your first project →</a></p>`
        : projects.slice(-2).map(p => `
            <div style="margin-bottom:.75rem; padding-bottom:.75rem; border-bottom:1px solid var(--border)">
              <div class="flex items-center justify-between">
                <strong style="font-size:14px">${esc(p.title)}</strong>
                <span class="badge ${p.status === 'Live' ? 'badge-green' : p.status === 'WIP' ? 'badge-amber' : 'badge-red'}">
                  ${esc(p.status)}
                </span>
              </div>
              <div class="text-small text-muted" style="margin-top:3px">
                ${esc(p.description.slice(0, 80))}${p.description.length > 80 ? '...' : ''}
              </div>
            </div>`).join('')}
    </div>
  `);
}

/* --- PORTFOLIO PAGE --- */
function PortfolioPage() {
  const u = getUser();
  return Shell(`
    <div class="page-title">Portfolio</div>
    <div class="page-sub">Manage your personal info, about section, and contact details.</div>

    <!-- Personal Information -->
    <div class="card" style="margin-bottom:1rem">
      <strong style="font-size:15px; display:block; margin-bottom:1rem">Personal Information</strong>
      <div class="grid-2">
        <div class="form-group">
          <label class="label">Full Name</label>
          <input id="pf-name" value="${esc(u?.name || '')}" placeholder="Jane Smith" />
        </div>
        <div class="form-group">
          <label class="label">Location</label>
          <input id="pf-location" value="${esc(u?.location || '')}" placeholder="New York, USA" />
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="label">Phone</label>
          <input id="pf-phone" value="${esc(u?.phone || '')}" placeholder="+1 555 000 0000" />
        </div>
        <div class="form-group">
          <label class="label">Website</label>
          <input id="pf-website" value="${esc(u?.website || '')}" placeholder="https://yoursite.com" />
        </div>
      </div>
    </div>

    <!-- About Section -->
    <div class="card" style="margin-bottom:1rem">
      <strong style="font-size:15px; display:block; margin-bottom:1rem">About Section</strong>
      <div class="form-group">
        <label class="label">Bio / Summary</label>
        <textarea id="pf-about" rows="4" placeholder="Tell the world who you are...">${esc(u?.about || '')}</textarea>
      </div>
    </div>

    <!-- Contact Information -->
    <div class="card" style="margin-bottom:1.5rem">
      <strong style="font-size:15px; display:block; margin-bottom:1rem">Contact Information</strong>
      <div class="form-group">
        <label class="label">Email (login — cannot change)</label>
        <input value="${esc(u?.email || '')}" disabled style="opacity:.6" />
      </div>
      <div class="form-group">
        <label class="label">LinkedIn</label>
        <input id="pf-linkedin" value="${esc(u?.linkedin || '')}" placeholder="https://linkedin.com/in/yourprofile" />
      </div>
      <div class="form-group">
        <label class="label">GitHub</label>
        <input id="pf-github" value="${esc(u?.github || '')}" placeholder="https://github.com/yourusername" />
      </div>
    </div>

    <button class="btn-primary" onclick="savePortfolio()">Save Changes</button>
  `);
}

/* --- SKILLS PAGE --- */
function SkillsPage() {
  const u      = getUser();
  const skills = u?.skills || [];
  const levelPct = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };

  return Shell(`
    <div class="flex items-center justify-between" style="margin-bottom:1.75rem">
      <div>
        <div class="page-title" style="margin-bottom:.15rem">Skills</div>
        <div class="page-sub" style="margin-bottom:0">Showcase your technical and professional abilities.</div>
      </div>
      <button class="btn-primary" onclick="openModal('skill')">+ Add Skill</button>
    </div>

    ${skills.length === 0 ? `
      <div class="card" style="text-align:center; padding:3rem">
        <div style="font-size:2.5rem; margin-bottom:1rem">◎</div>
        <div style="font-weight:500; margin-bottom:.5rem">No skills yet</div>
        <div class="text-muted text-small" style="margin-bottom:1.25rem">Add your first skill to get started</div>
        <button class="btn-primary" onclick="openModal('skill')">+ Add Skill</button>
      </div>`
    : `<div style="display:grid; gap:.75rem">
        ${skills.map((s, i) => `
          <div class="skill-card">
            <div>
              <div style="font-weight:500">${esc(s.name)}</div>
              <div class="skill-level-bar">
                <div class="skill-level-fill" style="width:${levelPct[s.level] || 50}%"></div>
              </div>
              <div class="text-small text-muted" style="margin-top:4px">
                ${esc(s.level)} · ${esc(s.category || 'General')}
              </div>
            </div>
            <div class="flex gap-1">
              <button class="btn-icon" onclick="openModal('skill', ${i})" title="Edit">✎</button>
              <button class="btn-icon" style="color:var(--red)" onclick="deleteSkill(${i})" title="Delete">✕</button>
            </div>
          </div>`).join('')}
      </div>`}
  `);
}

/* --- PROJECTS PAGE --- */
function ProjectsPage() {
  const u        = getUser();
  const projects = u?.projects || [];

  return Shell(`
    <div class="flex items-center justify-between" style="margin-bottom:1.75rem">
      <div>
        <div class="page-title" style="margin-bottom:.15rem">Projects</div>
        <div class="page-sub" style="margin-bottom:0">Manage your portfolio of work and side projects.</div>
      </div>
      <button class="btn-primary" onclick="openModal('project')">+ Add Project</button>
    </div>

    ${projects.length === 0 ? `
      <div class="card" style="text-align:center; padding:3rem">
        <div style="font-size:2.5rem; margin-bottom:1rem">◻</div>
        <div style="font-weight:500; margin-bottom:.5rem">No projects yet</div>
        <div class="text-muted text-small" style="margin-bottom:1.25rem">Showcase your work by adding a project</div>
        <button class="btn-primary" onclick="openModal('project')">+ Add Project</button>
      </div>`
    : `<div style="display:grid; gap:1rem">
        ${projects.map((p, i) => `
          <div class="proj-card">
            <div class="flex items-center justify-between" style="margin-bottom:.5rem">
              <div class="flex items-center gap-2">
                <strong style="font-size:15px">${esc(p.title)}</strong>
                <span class="badge ${p.status === 'Live' ? 'badge-green' : p.status === 'WIP' ? 'badge-amber' : 'badge-red'}">
                  ${esc(p.status)}
                </span>
                ${p.year ? `<span class="text-small text-muted">${esc(p.year)}</span>` : ''}
              </div>
              <div class="flex gap-1">
                <button class="btn-icon" onclick="openModal('project', ${i})" title="Edit">✎</button>
                <button class="btn-icon" style="color:var(--red)" onclick="deleteProject(${i})" title="Delete">✕</button>
              </div>
            </div>
            <div class="text-muted text-small" style="margin-bottom:.75rem">${esc(p.description)}</div>
            ${(p.tech || []).length
              ? `<div class="proj-tech">${p.tech.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
              : ''}
            ${(p.github || p.live) ? `
              <div class="flex gap-2" style="margin-top:.75rem">
                ${p.github ? `<a href="${esc(p.github)}" target="_blank" class="badge badge-accent" style="text-decoration:none">GitHub ↗</a>` : ''}
                ${p.live   ? `<a href="${esc(p.live)}"   target="_blank" class="badge badge-green"  style="text-decoration:none">Live ↗</a>`   : ''}
              </div>` : ''}
          </div>`).join('')}
      </div>`}
  `);
}

/* --- MODAL (Skill / Project) --- */
function renderModal() {
  const u = getUser();
  const m = state.modal;
  if (!m) return '';

  /* -- Skill Modal -- */
  if (m.type === 'skill') {
    const s    = m.idx !== null ? (u?.skills || [])[m.idx] : null;
    const cats = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Design', 'Data', 'Other'];
    const lvls = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

    return `
    <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
      <div class="modal">
        <div class="modal-title">${s ? 'Edit' : 'Add'} Skill</div>

        <div class="form-group">
          <label class="label">Skill Name</label>
          <input id="sk-name" value="${esc(s?.name || '')}" placeholder="e.g. React, Python, Figma..." />
        </div>
        <div class="form-group">
          <label class="label">Category</label>
          <select id="sk-cat">
            ${cats.map(c => `<option ${s?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="label">Proficiency Level</label>
          <select id="sk-level">
            ${lvls.map(l => `<option ${s?.level === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="label">Notes (optional)</label>
          <textarea id="sk-notes" placeholder="Years of experience, certifications...">${esc(s?.notes || '')}</textarea>
        </div>

        <div class="flex gap-2" style="justify-content:flex-end">
          <button class="btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn-primary"   onclick="saveSkill(${m.idx})">${s ? 'Update' : 'Add'} Skill</button>
        </div>
      </div>
    </div>`;
  }

  /* -- Project Modal -- */
  if (m.type === 'project') {
    const p = m.idx !== null ? (u?.projects || [])[m.idx] : null;

    return `
    <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
      <div class="modal">
        <div class="modal-title">${p ? 'Edit' : 'Add'} Project</div>

        <div class="form-group">
          <label class="label">Project Title</label>
          <input id="pr-title" value="${esc(p?.title || '')}" placeholder="My Awesome App" />
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea id="pr-desc" placeholder="What does this project do?">${esc(p?.description || '')}</textarea>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="label">Status</label>
            <select id="pr-status">
              ${['Live', 'WIP', 'Archived'].map(s => `<option ${p?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="label">Year</label>
            <input id="pr-year" value="${esc(p?.year || new Date().getFullYear())}" placeholder="2024" />
          </div>
        </div>
        <div class="form-group">
          <label class="label">Tech Stack (comma separated)</label>
          <input id="pr-tech" value="${esc((p?.tech || []).join(', '))}" placeholder="React, Node.js, MongoDB" />
        </div>
        <div class="form-group">
          <label class="label">GitHub URL</label>
          <input id="pr-github" value="${esc(p?.github || '')}" placeholder="https://github.com/..." />
        </div>
        <div class="form-group">
          <label class="label">Live URL</label>
          <input id="pr-live" value="${esc(p?.live || '')}" placeholder="https://..." />
        </div>

        <div class="flex gap-2" style="justify-content:flex-end">
          <button class="btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn-primary"   onclick="saveProject(${m.idx})">${p ? 'Update' : 'Add'} Project</button>
        </div>
      </div>
    </div>`;
  }

  return '';
}

/* ── 9. MAIN RENDER (router) ─────────────────── */
function render() {
  const el = document.getElementById('app');

  // Not logged in → show Auth page
  if (!state.session) {
    el.innerHTML = AuthPage();
    return;
  }

  // Logged in → route to correct page
  if      (state.page === 'dashboard') el.innerHTML = DashboardPage();
  else if (state.page === 'portfolio') el.innerHTML = PortfolioPage();
  else if (state.page === 'skills')    el.innerHTML = SkillsPage();
  else if (state.page === 'projects')  el.innerHTML = ProjectsPage();
}

/* ── 10. BOOT ────────────────────────────────── */
render();