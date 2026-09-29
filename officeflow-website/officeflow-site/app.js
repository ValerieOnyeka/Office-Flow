/* ===================== OfficeFlow — shared app logic ===================== */

const SEED_DATA = {
  tasks: [
    {id:'t1', title:'Prepare monthly financial report', dept:'Finance', priority:'High', due:'Today', status:'inprogress'},
    {id:'t2', title:'Update client database', dept:'Administration', priority:'Medium', due:'Sept 25', status:'todo'},
    {id:'t3', title:'Draft onboarding checklist', dept:'HR', priority:'Low', due:'Sept 27', status:'todo'},
    {id:'t4', title:'Reconcile August expenses', dept:'Finance', priority:'Urgent', due:'Tomorrow', status:'inprogress'},
    {id:'t5', title:'Publish Q3 newsletter', dept:'Marketing', priority:'Medium', due:'Sept 30', status:'done'},
    {id:'t6', title:'Audit supply room stock', dept:'Operations', priority:'Low', due:'Sept 24', status:'done'},
  ],
  requests: [
    {id:'r1', title:'Projector not working', type:'IT Support', location:'Conference Room B', priority:'High', stage:2},
    {id:'r2', title:'AC unit leaking', type:'Maintenance', location:'2nd Floor Open Space', priority:'Medium', stage:1},
    {id:'r3', title:'Low on printer toner', type:'Office Supplies', location:'Print Station', priority:'Low', stage:3},
  ],
  inventory: [
    {name:'Printer Paper', cat:'Supplies', qty:45, min:15, loc:'Store Room A'},
    {name:'Toner Cartridge', cat:'Supplies', qty:3, min:5, loc:'Print Station'},
    {name:'Laptops', cat:'Equipment', qty:18, min:4, loc:'IT Store'},
    {name:'Projector', cat:'Equipment', qty:4, min:2, loc:'AV Store'},
    {name:'Office Chairs', cat:'Furniture', qty:37, min:10, loc:'Warehouse'},
    {name:'A4 Envelopes', cat:'Supplies', qty:6, min:10, loc:'Admin Store'},
  ],
  employees: [
    {name:'Jane Doe', role:'Marketing Executive', dept:'Marketing', tasks:4, status:'Available'},
    {name:'Tunde Bello', role:'Finance Officer', dept:'Finance', tasks:6, status:'Busy'},
    {name:'Amaka Obi', role:'HR Associate', dept:'Human Resources', tasks:2, status:'Available'},
    {name:'Chidi Okoro', role:'IT Support', dept:'IT', tasks:5, status:'Available'},
    {name:'Grace Udo', role:'Operations Lead', dept:'Operations', tasks:3, status:'Busy'},
    {name:'Valerie', role:'Admin Assistant', dept:'Administration', tasks:4, status:'Available'},
  ],
  announcements: [
    {title:'Office Maintenance Notice', body:'The second-floor workspace will undergo electrical maintenance on Friday from 2\u20134 PM.', when:'2 days ago'},
    {title:'New IT Support Process', body:'IT requests should now be submitted through Requests rather than direct messages, for faster tracking.', when:'5 days ago'},
    {title:'Monthly Town Hall', body:'This month\u2019s town hall moves to the main conference hall to fit the whole team.', when:'1 week ago'},
  ],
  events: [
    {d:28, title:'Staff Meeting', type:''}, {d:24, title:'Client Call', type:'blue'},
    {d:30, title:'Deadline: Report', type:'amber'}, {d:22, title:'Training', type:''},
  ]
};

const DATA_KEY = 'officeflow-data';
const SESSION_KEY = 'officeflow-session';

function loadData(){
  try{
    const raw = localStorage.getItem(DATA_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  const fresh = JSON.parse(JSON.stringify(SEED_DATA));
  saveData(fresh);
  return fresh;
}
function saveData(data){
  try{ localStorage.setItem(DATA_KEY, JSON.stringify(data)); }catch(e){}
}
function getSession(){
  try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }catch(e){ return null; }
}
function setSession(session){
  try{ localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }catch(e){}
}
function startSession(role){
  const names = {employee:'Valerie', manager:'Tunde Bello', admin:'Grace Udo'};
  setSession({role, name:names[role] || 'Valerie'});
}
function clearSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }

let DB = loadData();

/* ---------------- Theme ---------------- */
function applyStoredTheme(){
  try{
    const saved = localStorage.getItem('officeflow-theme');
    if(saved){
      document.documentElement.setAttribute('data-theme', saved);
      const btn = document.getElementById('themeBtn');
      if(btn) btn.textContent = saved==='dark' ? '\u2600' : '\u263E';
    }
  }catch(e){}
}
function toggleTheme(){
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let next;
  if(!current){ next = prefersDark ? 'light' : 'dark'; }
  else if(current==='dark'){ next='light'; } else { next='dark'; }
  root.setAttribute('data-theme', next);
  const btn = document.getElementById('themeBtn');
  if(btn) btn.textContent = next==='dark' ? '\u2600' : '\u263E';
  try{ localStorage.setItem('officeflow-theme', next); }catch(e){}
}

/* ---------------- Toast / Modal ---------------- */
function toast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>t.classList.remove('show'), 2200);
}
function openModal(html){
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalBackdrop').classList.add('active');
}
function closeModal(){ document.getElementById('modalBackdrop').classList.remove('active'); }

/* ---------------- Sidebar / topbar wiring ---------------- */
function toggleSidebar(open){
  document.getElementById('sidebar').classList.toggle('open', open);
  document.getElementById('scrim').classList.toggle('active', open);
}
function initials(name){ return name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase(); }

function requireSession(){
  const session = getSession();
  if(!session){ window.location.href = 'login.html'; return null; }
  return session;
}

function initAppShell(){
  const session = requireSession();
  if(!session) return;

  document.getElementById('userAvatar').textContent = initials(session.name);
  document.getElementById('userName').textContent = session.name;
  document.getElementById('userRoleLabel').textContent = session.role.charAt(0).toUpperCase()+session.role.slice(1);

  const isAdmin = session.role==='admin' || session.role==='manager';
  document.querySelectorAll('.admin-only').forEach(el=>{ el.style.display = isAdmin ? 'flex' : 'none'; });

  const currentPage = document.body.dataset.page;
  document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
    el.classList.toggle('active', el.dataset.page===currentPage);
  });

  const modalBackdrop = document.getElementById('modalBackdrop');
  if(modalBackdrop) modalBackdrop.addEventListener('click', e=>{ if(e.target.id==='modalBackdrop') closeModal(); });

  const search = document.getElementById('globalSearch');
  if(search) search.addEventListener('input', ()=>{ if(search.value) toast('Searching \u201c'+search.value+'\u201d across tasks, requests & people'); });

  applyStoredTheme();
  renderPage(currentPage, session);
}
function logout(){ clearSession(); window.location.href = 'index.html'; }
function toggleNotif(){
  openModal(`
    <h3>Notifications</h3><p class="sub">Recent activity in your workspace</p>
    <div class="panel" style="border:none; box-shadow:none;">
      <div class="list-row" style="padding:10px 0;"><div class="ic-box">\u2611</div><div class="grow"><b>You were assigned a new task</b><div class="sub">Reconcile August expenses \u00b7 Finance</div></div></div>
      <div class="list-row" style="padding:10px 0;"><div class="ic-box">\u2691</div><div class="grow"><b>Your maintenance request was assigned</b><div class="sub">Projector \u00b7 Conference Room B</div></div></div>
      <div class="list-row" style="padding:10px 0;"><div class="ic-box">\u25F7</div><div class="grow"><b>Staff meeting starts in 30 minutes</b><div class="sub">Conference Room A</div></div></div>
      <div class="list-row" style="padding:10px 0; border-bottom:none;"><div class="ic-box">\uD83D\uDCE6</div><div class="grow"><b>Toner is running low</b><div class="sub">Print Station \u2014 3 left</div></div></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost btn-block" onclick="closeModal()">Close</button></div>
  `);
}

/* ---------------- Page router ---------------- */
function renderPage(page, session){
  const c = document.getElementById('content');
  if(!c) return;
  const renderers = {
    'dashboard': renderDashboard, 'tasks': renderTasks, 'requests': renderRequests,
    'calendar': renderCalendar, 'announcements': renderAnnouncements, 'directory': renderDirectory,
    'profile': renderProfile, 'admin-dashboard': renderAdminDashboard, 'employees': renderEmployees,
    'inventory': renderInventory, 'reports': renderReports, 'settings': renderSettings
  };
  c.innerHTML = (renderers[page] || renderDashboard)(session);
}
function refresh(){ initAppShell(); }

/* ---------------- donut helper ---------------- */
function donutSvg(parts){
  const total = parts.reduce((s,p)=>s+p[0],0) || 1;
  let acc = 0;
  const r = 34, cx=44, cy=44, circ = 2*Math.PI*r;
  const segs = parts.map(([v,color])=>{
    const frac = v/total;
    const dash = frac*circ;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="14" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${cx} ${cy})"/>`;
    acc += dash;
    return seg;
  }).join('');
  return `<svg width="88" height="88" viewBox="0 0 88 88">${segs}</svg>`;
}
function emptyMini(msg){ return `<div class="empty" style="padding:24px 10px;"><div class="ic">\u25CB</div><p>${msg}</p></div>`; }

/* ===================== Page renderers ===================== */
function renderDashboard(session){
  const todo = DB.tasks.filter(t=>t.status==='todo').length;
  const inprog = DB.tasks.filter(t=>t.status==='inprogress').length;
  const done = DB.tasks.filter(t=>t.status==='done').length;
  return `
    <div class="page-head">
      <div><h1>Good morning, ${session.name} \uD83D\uDC4B</h1><div class="greet">Here's what's happening in your workspace today.</div></div>
      <div class="actions"><button class="btn btn-primary" onclick="openNewTaskModal()">+ New task</button></div>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="lbl">My tasks</div><b>${DB.tasks.length}</b><div class="delta">${done} completed</div></div>
      <div class="stat-card"><div class="lbl">Pending requests</div><b>${DB.requests.length}</b><div class="delta down">2 awaiting action</div></div>
      <div class="stat-card"><div class="lbl">Upcoming meetings</div><b>3</b><div class="delta">Next: today, 3:00 PM</div></div>
      <div class="stat-card"><div class="lbl">Weekly productivity</div><b>78%</b><div class="delta">+6% vs last week</div></div>
    </div>
    <div class="two-col">
      <div class="panel">
        <div class="panel-head"><h3>Weekly productivity</h3><a class="link" href="reports.html">View report</a></div>
        <div class="panel-pad">
          <div class="bar-chart">
            ${[['Mon',70],['Tue',85],['Wed',65],['Thu',92],['Fri',78]].map(([d,v])=>`<div class="col"><div class="fill" style="height:${v}%"></div><span>${d}</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Task progress</h3><a class="link" href="tasks.html">See all</a></div>
        <div class="panel-pad">
          <div class="donut-wrap">
            ${donutSvg([[todo,'var(--blue)'],[inprog,'var(--amber)'],[done,'var(--accent)']])}
            <div class="legend">
              <div class="row"><span class="sw" style="background:var(--blue)"></span>To do \u2014 ${todo}</div>
              <div class="row"><span class="sw" style="background:var(--amber)"></span>In progress \u2014 ${inprog}</div>
              <div class="row"><span class="sw" style="background:var(--accent)"></span>Completed \u2014 ${done}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="panel" style="margin-top:16px;">
      <div class="panel-head"><h3>Upcoming meetings</h3><a class="link" href="calendar.html">Open calendar</a></div>
      <div class="list-row"><div class="ic-box">\u25F7</div><div class="grow"><b>Monthly Staff Meeting</b><div class="sub">Conference Room A</div></div><time>Sept 28, 10:00 AM</time></div>
      <div class="list-row"><div class="ic-box">\u25F7</div><div class="grow"><b>Client Review Call</b><div class="sub">Virtual \u2014 Google Meet</div></div><time>Sept 24, 2:00 PM</time></div>
      <div class="list-row"><div class="ic-box">\u25F7</div><div class="grow"><b>Department Training</b><div class="sub">Training Room</div></div><time>Sept 22, 3:00 PM</time></div>
    </div>
  `;
}

function renderTasks(){
  const cols = [['todo','To Do'],['inprogress','In Progress'],['done','Completed']];
  return `
    <div class="page-head"><h1>My Tasks</h1><div class="actions"><button class="btn btn-primary" onclick="openNewTaskModal()">+ New task</button></div></div>
    <div class="filter-row">
      <div class="chip active">All</div><div class="chip">To Do</div><div class="chip">In Progress</div><div class="chip">Completed</div>
      <div class="search-mini"><span class="ic">\u2315</span><input placeholder="Search tasks"></div>
    </div>
    <div class="kanban">
      ${cols.map(([key,label])=>`
        <div class="kanban-col">
          <h4>${label} <span>${DB.tasks.filter(t=>t.status===key).length}</span></h4>
          ${DB.tasks.filter(t=>t.status===key).map(t=>taskCard(t)).join('') || emptyMini('No tasks here')}
        </div>
      `).join('')}
    </div>
  `;
}
function taskCard(t){
  const p = {Low:'b-grey',Medium:'b-blue',High:'b-amber',Urgent:'b-red'}[t.priority];
  return `
    <div class="task-card">
      <div class="tags"><span class="badge ${p}">${t.priority}</span></div>
      <h5>${t.title}</h5>
      <div class="dept">${t.dept} Department</div>
      <div class="foot"><span>\uD83D\uDCC5 Due ${t.due}</span>
        <select onchange="setTaskStatus('${t.id}', this.value)">
          <option value="todo" ${t.status==='todo'?'selected':''}>To Do</option>
          <option value="inprogress" ${t.status==='inprogress'?'selected':''}>In Progress</option>
          <option value="done" ${t.status==='done'?'selected':''}>Completed</option>
        </select>
      </div>
    </div>`;
}
function setTaskStatus(id, status){
  const t = DB.tasks.find(x=>x.id===id);
  if(t){ t.status = status; saveData(DB); refresh(); toast('Task moved to ' + status.replace('inprogress','In Progress').replace('todo','To Do').replace('done','Completed')); }
}
function openNewTaskModal(){
  openModal(`
    <h3>Create task</h3><p class="sub">Assign work to a team member</p>
    <div class="field"><label>Task title</label><input id="ntTitle" placeholder="e.g. Prepare monthly report"></div>
    <div class="field"><label>Description</label><textarea rows="2" placeholder="Short description"></textarea></div>
    <div class="field-row">
      <div class="field"><label>Assign to</label><select>${DB.employees.map(e=>`<option>${e.name}</option>`).join('')}</select></div>
      <div class="field"><label>Priority</label><select id="ntPriority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Deadline</label><input type="date"></div>
      <div class="field"><label>Department</label><select id="ntDept"><option>Finance</option><option>Administration</option><option>Marketing</option><option>IT</option><option>Operations</option></select></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary btn-block" onclick="createTask()">Create task</button></div>
  `);
}
function createTask(){
  const title = document.getElementById('ntTitle').value || 'Untitled task';
  const priority = document.getElementById('ntPriority').value;
  const dept = document.getElementById('ntDept').value;
  DB.tasks.unshift({id:'t'+Date.now(), title, dept, priority, due:'This week', status:'todo'});
  saveData(DB); closeModal(); refresh(); toast('Task created');
}

function renderRequests(){
  const stages = ['Submitted','Assigned','In Progress','Resolved'];
  return `
    <div class="page-head"><h1>Office Requests</h1><div class="actions"><button class="btn btn-primary" onclick="openNewRequestModal()">+ Submit request</button></div></div>
    <div class="filter-row">
      <div class="chip active">All</div><div class="chip">Maintenance</div><div class="chip">IT Support</div><div class="chip">Supplies</div>
    </div>
    ${DB.requests.map(r=>`
      <div class="panel" style="margin-bottom:14px;">
        <div class="panel-head">
          <div><h3>${r.title}</h3><div class="row-sub">${r.type} \u00b7 ${r.location}</div></div>
          <span class="badge ${{Low:'b-grey',Medium:'b-blue',High:'b-amber',Urgent:'b-red'}[r.priority]}">${r.priority}</span>
        </div>
        <div class="panel-pad">
          <div class="req-track">
            ${stages.map((s,i)=>`<div class="req-step ${i<r.stage?'done':''}"><div class="node">${i<r.stage?'\u2713':i+1}</div>${s}</div>`).join('')}
          </div>
        </div>
      </div>
    `).join('')}
  `;
}
function openNewRequestModal(){
  openModal(`
    <h3>Submit request</h3><p class="sub">Report a workplace issue for follow-up</p>
    <div class="field"><label>Request type</label><select id="rqType"><option>Maintenance</option><option>IT Support</option><option>Cleaning</option><option>Equipment</option><option>Office Supplies</option><option>Other</option></select></div>
    <div class="field"><label>Title</label><input id="rqTitle" placeholder="e.g. Projector not working"></div>
    <div class="field"><label>Location</label><input id="rqLoc" placeholder="e.g. Conference Room B"></div>
    <div class="field"><label>Description</label><textarea rows="3" placeholder="What's the issue?"></textarea></div>
    <div class="field"><label>Priority</label><select id="rqPriority"><option>Low</option><option selected>Medium</option><option>High</option></select></div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary btn-block" onclick="createRequest()">Submit request</button></div>
  `);
}
function createRequest(){
  const title = document.getElementById('rqTitle').value || 'Untitled request';
  const type = document.getElementById('rqType').value;
  const location = document.getElementById('rqLoc').value || 'Unspecified';
  const priority = document.getElementById('rqPriority').value;
  DB.requests.unshift({id:'r'+Date.now(), title, type, location, priority, stage:1});
  saveData(DB); closeModal(); refresh(); toast('Request submitted');
}

function renderCalendar(){
  const days = Array.from({length:30},(_,i)=>i+1);
  const startOffset = 1;
  return `
    <div class="page-head"><h1>Calendar</h1><div class="actions"><button class="btn btn-ghost btn-sm">\u2039</button><button class="btn btn-ghost btn-sm" style="font-weight:700;">September 2026</button><button class="btn btn-ghost btn-sm">\u203A</button><button class="btn btn-primary" onclick="openNewEventModal()">+ New event</button></div>
    </div>
    <div class="panel">
      <div class="cal-grid">
        ${['S','M','T','W','T','F','S'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}
        ${Array.from({length:startOffset}).map(()=>`<div class="cal-cell other"></div>`).join('')}
        ${days.map(d=>{
          const evts = DB.events.filter(e=>e.d===d);
          return `<div class="cal-cell ${d===22?'today':''}"><div class="dnum">${d}</div>${evts.map(e=>`<div class="cal-evt ${e.type}">${e.title}</div>`).join('')}</div>`;
        }).join('')}
      </div>
    </div>
  `;
}
function openNewEventModal(){
  openModal(`
    <h3>New event</h3><p class="sub">Add a meeting or office event</p>
    <div class="field"><label>Title</label><input id="evTitle" placeholder="e.g. Staff Meeting"></div>
    <div class="field-row">
      <div class="field"><label>Day of month</label><input id="evDay" type="number" min="1" max="30" value="24"></div>
      <div class="field"><label>Time</label><input type="time"></div>
    </div>
    <div class="field"><label>Location</label><input placeholder="e.g. Conference Room A"></div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary btn-block" onclick="createEvent()">Add event</button></div>
  `);
}
function createEvent(){
  const title = document.getElementById('evTitle').value || 'Untitled event';
  const d = parseInt(document.getElementById('evDay').value) || 24;
  DB.events.push({d, title, type:'blue'});
  saveData(DB); closeModal(); refresh(); toast('Event added');
}

function renderAnnouncements(session){
  const canPost = session.role==='admin' || session.role==='manager';
  return `
    <div class="page-head"><h1>Announcements</h1>${canPost?'<div class="actions"><button class="btn btn-primary" onclick="openAnnounceModal()">+ Post announcement</button></div>':''}</div>
    <div class="panel">
      ${DB.announcements.map(a=>`
        <div class="announce-card">
          <div class="ic-box">\uD83D\uDCE3</div>
          <div class="grow"><h5>${a.title}</h5><p>${a.body}</p></div>
          <time>${a.when}</time>
        </div>
      `).join('')}
    </div>
  `;
}
function openAnnounceModal(){
  openModal(`
    <h3>Post announcement</h3><p class="sub">Visible to everyone on their dashboard</p>
    <div class="field"><label>Title</label><input id="anTitle" placeholder="e.g. Office Maintenance Notice"></div>
    <div class="field"><label>Message</label><textarea id="anBody" rows="3" placeholder="What should the team know?"></textarea></div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary btn-block" onclick="postAnnounce()">Post</button></div>
  `);
}
function postAnnounce(){
  const title = document.getElementById('anTitle').value || 'Untitled notice';
  const body = document.getElementById('anBody').value || '';
  DB.announcements.unshift({title, body, when:'Just now'});
  saveData(DB); closeModal(); refresh(); toast('Announcement posted');
}

function renderDirectory(){
  return `
    <div class="page-head"><h1>Employee Directory</h1></div>
    <div class="filter-row">
      <div class="chip active">All departments</div><div class="chip">Finance</div><div class="chip">Marketing</div><div class="chip">IT</div>
      <div class="search-mini"><span class="ic">\u2315</span><input placeholder="Search people"></div>
    </div>
    <div class="dir-grid">
      ${DB.employees.map(e=>`
        <div class="dir-card">
          <div class="top"><div class="avatar">${initials(e.name)}</div><div><h5>${e.name}</h5><div class="role">${e.role}</div></div></div>
          <span class="badge b-grey">${e.dept}</span>
          <div class="stat-mini"><span>Current tasks: ${e.tasks}</span><span class="badge ${e.status==='Available'?'b-green':'b-amber'}">${e.status}</span></div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderProfile(session){
  const me = DB.employees.find(e=>e.name===session.name) || {role:'Team Member', dept:'General'};
  return `
    <div class="page-head"><h1>My Profile</h1></div>
    <div class="panel">
      <div class="profile-card">
        <div class="avatar">${initials(session.name)}</div>
        <div><h2 style="font-size:19px;">${session.name}</h2><div class="row-sub">${me.role} \u00b7 ${me.dept} Department</div></div>
      </div>
      <div class="profile-grid">
        <div class="field"><label>Email</label><input value="${session.name.toLowerCase().replace(/\\s+/g,'.')}@officeflow.demo"></div>
        <div class="field"><label>Phone</label><input value="+234 800 000 0000"></div>
        <div class="field"><label>Department</label><input value="${me.dept}"></div>
        <div class="field"><label>Status</label><select><option>Available</option><option>Busy</option><option>Away</option></select></div>
      </div>
      <div class="panel-pad" style="padding-top:0;"><button class="btn btn-primary" onclick="toast('Profile saved')">Save changes</button></div>
    </div>
  `;
}

function renderAdminDashboard(){
  return `
    <div class="page-head"><div><h1>Office Overview</h1><div class="greet">Snapshot across the whole organisation.</div></div></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="lbl">Employees</div><b>${DB.employees.length + 36}</b></div>
      <div class="stat-card"><div class="lbl">Total tasks</div><b>128</b><div class="delta">96 completed</div></div>
      <div class="stat-card"><div class="lbl">Open requests</div><b>${DB.requests.length + 11}</b><div class="delta down">5 pending</div></div>
      <div class="stat-card"><div class="lbl">Low-stock items</div><b>${DB.inventory.filter(i=>i.qty<i.min).length}</b><div class="delta down">Needs reorder</div></div>
    </div>
    <div class="two-col">
      <div class="panel">
        <div class="panel-head"><h3>Task overview</h3><a class="link" href="reports.html">Full report</a></div>
        <div class="panel-pad">
          <div class="bar-chart" style="height:120px;">
            ${[['To Do',32],['In Progress',20],['Completed',76]].map(([d,v])=>`<div class="col"><div class="fill" style="height:${v}%; background:${d==='Completed'?'var(--accent)':d==='In Progress'?'var(--amber)':'var(--blue)'}"></div><span>${d}</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Office requests</h3><a class="link" href="requests.html">View all</a></div>
        <div class="list-row"><div class="grow"><b>Pending</b></div><span class="badge b-blue">5</span></div>
        <div class="list-row"><div class="grow"><b>In progress</b></div><span class="badge b-amber">4</span></div>
        <div class="list-row"><div class="grow"><b>Resolved</b></div><span class="badge b-green">12</span></div>
      </div>
    </div>
    <div class="panel" style="margin-top:16px;">
      <div class="panel-head"><h3>Inventory alerts</h3><a class="link" href="inventory.html">Manage inventory</a></div>
      ${DB.inventory.filter(i=>i.qty<i.min).map(i=>`
        <div class="list-row"><div class="ic-box">\u26A0</div><div class="grow"><b>${i.name}</b><div class="sub">${i.loc}</div></div><span class="badge b-red">${i.qty} left</span></div>
      `).join('') || emptyMini('No low-stock items')}
    </div>
  `;
}

function renderEmployees(){
  return `
    <div class="page-head"><h1>Employees</h1><div class="actions"><button class="btn btn-primary" onclick="openAddEmployeeModal()">+ Add employee</button></div></div>
    <div class="panel table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Department</th><th>Role</th><th>Tasks</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${DB.employees.map(e=>`
            <tr>
              <td><div class="row-title">${e.name}</div></td>
              <td>${e.dept}</td><td>${e.role}</td><td>${e.tasks}</td>
              <td><span class="badge ${e.status==='Available'?'b-green':'b-amber'}">${e.status}</span></td>
              <td><span class="icon-link" onclick="toast('Editing '+ '${e.name}'.split(' ')[0] +'\u2019s profile')">Edit</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
function openAddEmployeeModal(){
  openModal(`
    <h3>Add employee</h3><p class="sub">Create a new employee profile</p>
    <div class="field"><label>Full name</label><input id="emName" placeholder="e.g. Ifeoma Nwosu"></div>
    <div class="field-row">
      <div class="field"><label>Role</label><input id="emRole" placeholder="e.g. Sales Associate"></div>
      <div class="field"><label>Department</label><select id="emDept"><option>Finance</option><option>Marketing</option><option>IT</option><option>Operations</option><option>Human Resources</option><option>Administration</option></select></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary btn-block" onclick="addEmployee()">Add employee</button></div>
  `);
}
function addEmployee(){
  const name = document.getElementById('emName').value || 'New Employee';
  const role = document.getElementById('emRole').value || 'Team Member';
  const dept = document.getElementById('emDept').value;
  DB.employees.unshift({name, role, dept, tasks:0, status:'Available'});
  saveData(DB); closeModal(); refresh(); toast('Employee added');
}

function renderInventory(){
  return `
    <div class="page-head"><h1>Inventory</h1><div class="actions"><button class="btn btn-primary" onclick="openInventoryModal()">+ Add item</button></div></div>
    <div class="panel table-wrap">
      <table>
        <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Location</th><th>Status</th></tr></thead>
        <tbody>
          ${DB.inventory.map(i=>{
            const low = i.qty < i.min;
            return `<tr>
              <td><div class="row-title">${i.name}</div></td>
              <td>${i.cat}</td><td>${i.qty}</td><td>${i.loc}</td>
              <td><span class="badge ${low?'b-red':'b-green'}">${low?'\u26A0 Low Stock':'Available'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
function openInventoryModal(){
  openModal(`
    <h3>Add item</h3><p class="sub">Track a new inventory item</p>
    <div class="field"><label>Item name</label><input id="ivName" placeholder="e.g. Whiteboard Markers"></div>
    <div class="field-row">
      <div class="field"><label>Category</label><select id="ivCat"><option>Supplies</option><option>Equipment</option><option>Furniture</option></select></div>
      <div class="field"><label>Location</label><input id="ivLoc" placeholder="e.g. Store Room A"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Quantity</label><input id="ivQty" type="number" value="10"></div>
      <div class="field"><label>Minimum stock</label><input id="ivMin" type="number" value="5"></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary btn-block" onclick="addInventory()">Add item</button></div>
  `);
}
function addInventory(){
  const name = document.getElementById('ivName').value || 'New item';
  const cat = document.getElementById('ivCat').value;
  const loc = document.getElementById('ivLoc').value || 'Unassigned';
  const qty = parseInt(document.getElementById('ivQty').value)||0;
  const min = parseInt(document.getElementById('ivMin').value)||0;
  DB.inventory.unshift({name,cat,qty,min,loc});
  saveData(DB); closeModal(); refresh(); toast('Item added to inventory');
}

function renderReports(){
  return `
    <div class="page-head"><h1>Reports</h1></div>
    <div class="grid-3">
      <div class="panel">
        <div class="panel-head"><h3>Employee productivity</h3></div>
        <div class="panel-pad">
          <div class="bar-chart">
            ${[['Mon',70],['Tue',85],['Wed',65],['Thu',92],['Fri',78]].map(([d,v])=>`<div class="col"><div class="fill" style="height:${v}%"></div><span>${d}</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Department activity</h3></div>
        <div class="panel-pad">
          <div class="bar-chart">
            ${[['Fin',22],['Mkt',18],['Ops',30],['IT',14],['HR',9]].map(([d,v])=>`<div class="col"><div class="fill" style="height:${v*3}%; background:var(--blue)"></div><span>${d}</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Maintenance requests</h3></div>
        <div class="panel-pad">
          <div class="donut-wrap">
            ${donutSvg([[5,'var(--blue)'],[4,'var(--amber)'],[12,'var(--accent)']])}
            <div class="legend">
              <div class="row"><span class="sw" style="background:var(--blue)"></span>Pending \u2014 5</div>
              <div class="row"><span class="sw" style="background:var(--amber)"></span>In progress \u2014 4</div>
              <div class="row"><span class="sw" style="background:var(--accent)"></span>Resolved \u2014 12</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="panel" style="margin-top:16px;">
      <div class="panel-head"><h3>Inventory status</h3></div>
      <div class="panel-pad table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Current stock</th><th>Minimum</th><th>Status</th></tr></thead>
          <tbody>
            ${DB.inventory.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.min}</td><td><span class="badge ${i.qty<i.min?'b-red':'b-green'}">${i.qty<i.min?'Low':'OK'}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSettings(){
  return `
    <div class="page-head"><h1>Settings</h1></div>
    <div class="panel" style="max-width:520px;">
      <div class="panel-head"><h3>Appearance</h3></div>
      <div class="list-row"><div class="grow"><b>Dark mode</b><div class="sub">Toggle light and dark theme</div></div><button class="btn btn-ghost btn-sm" onclick="toggleTheme()">Toggle</button></div>
      <div class="panel-head"><h3>Notifications</h3></div>
      <div class="list-row"><div class="grow"><b>Task assignments</b><div class="sub">Notify me when I'm assigned a task</div></div><span class="badge b-green">On</span></div>
      <div class="list-row"><div class="grow"><b>Low stock alerts</b><div class="sub">Notify admins when inventory runs low</div></div><span class="badge b-green">On</span></div>
      <div class="panel-head"><h3>Workspace</h3></div>
      <div class="list-row"><div class="grow"><b>Organisation name</b></div><input style="max-width:180px; padding:7px 10px; border-radius:6px; border:1px solid var(--line); background:var(--surface); color:var(--ink);" value="Imo Digital City Ltd"></div>
    </div>
  `;
}
