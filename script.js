/* ---------- Persistence ---------- */
const STORAGE_KEY = 'edu_erp_hack_v5';
function loadState(){ try{ const s=JSON.parse(localStorage.getItem(STORAGE_KEY)); return s && typeof s==='object'? s : {students:[],attendance:{},complaints:[],notes:[]}; }catch(e){ return {students:[],attendance:{},complaints:[],notes:[]}; } }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();
if(!Array.isArray(state.students)) state.students=[];
if(!state.attendance) state.attendance = {};
if(!Array.isArray(state.complaints)) state.complaints = [];
if(!Array.isArray(state.notes)) state.notes = [];

/* initial sample */
if(state.students.length === 0){
  state.students.push({id:'s1', name:'Ankit Sharma', roll:'AKTU2025001', course:'B.Tech CSE', username:'ankit', password:'pass1', totalFee:50000, paid:20000});
  state.students.push({id:'s2', name:'Priya Singh', roll:'AKTU2025002', course:'B.Tech ME', username:'priya', password:'pass2', totalFee:48000, paid:48000});
  saveState();
}

/* ---------- Login ---------- */
const adminCred = {user:'admin', pass:'1234'};
function login(username, password){
  username = (username || '').trim();
  password = (password || '').trim();
  if(username === adminCred.user && password === adminCred.pass){
    sessionStorage.setItem('role','admin');
    window.location.href = 'admin.html';
    return true;
  }
  const s = state.students.find(x => x.username === username && x.password === password);
  if(s){
    sessionStorage.setItem('role','student');
    sessionStorage.setItem('username', s.username);
    window.location.href = 'student.html';
    return true;
  }
  return false;
}

/* ---------- Helpers ---------- */
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
function escapeHtml(s){ if(s === undefined || s === null) return ''; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

/* ========== ADMIN ========== */
function renderAdminDashboard(){
  document.getElementById('totalStudents').textContent = state.students.length;
  const totalDue = state.students.reduce((acc,s) => acc + ((Number(s.totalFee)||0) - (Number(s.paid)||0)), 0);
  document.getElementById('totalDue').textContent = '₹' + totalDue;
  document.getElementById('totalNotes').textContent = state.notes.length;
  document.getElementById('totalComplaints').textContent = state.complaints.length;
}

/* Students list with filter by course */
function renderCourseFilter(){
  const sel = document.getElementById('courseFilter');
  if(!sel) return;
  const courses = Array.from(new Set(state.students.map(s => s.course).filter(Boolean)));
  sel.innerHTML = '<option value="">All courses</option>' + courses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  sel.addEventListener('change', () => renderStudentsTable());
}

function renderStudentsTable(){
  const tbody = document.getElementById('studentsTable');
  if(!tbody) return;
  const filter = document.getElementById('courseFilter')?.value || '';
  tbody.innerHTML = '';
  state.students.forEach((s, idx) => {
    if(filter && s.course !== filter) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(s.id)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.roll)}</td>
      <td>${escapeHtml(s.course)}</td>
      <td>₹${Number(s.paid)||0}/₹${Number(s.totalFee)||0}</td>
      <td style="display:flex;gap:8px">
        <button class="primary btn" onclick="openEditStudent(${idx})">Edit</button>
        <button class="ghost btn" onclick="deleteStudent(${idx})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* Add / Edit student modal */
function setupStudentModal(){
  const addBtn = document.getElementById('addStudentBtn');
  const modal = document.getElementById('studentModal');
  const saveBtn = document.getElementById('saveStudent');
  const cancelBtn = document.getElementById('cancelStudent');

  addBtn?.addEventListener('click', () => {
    openAddStudentModal();
  });
  cancelBtn?.addEventListener('click', () => closeStudentModal());
  // save handled when opening add/edit (to bind correct handler)
}

function openAddStudentModal(){
  document.getElementById('modalTitle').textContent = 'Add New Student';
  document.getElementById('stuName').value = '';
  document.getElementById('stuRoll').value = '';
  document.getElementById('stuCourse').value = '';
  document.getElementById('stuUsername').value = 's' + (state.students.length + 1).toString().padStart(3,'0');
  document.getElementById('stuPassword').value = '';
  document.getElementById('stuTotalFee').value = '';
  document.getElementById('stuPaidFee').value = '0';
  document.getElementById('studentModal').classList.add('open');

  document.getElementById('saveStudent').onclick = function(){
    const name = document.getElementById('stuName').value.trim();
    const roll = document.getElementById('stuRoll').value.trim();
    const course = document.getElementById('stuCourse').value.trim();
    const username = document.getElementById('stuUsername').value.trim();
    const password = document.getElementById('stuPassword').value.trim();
    const totalFee = Number(document.getElementById('stuTotalFee').value || 0);
    const paid = Number(document.getElementById('stuPaidFee').value || 0);

    if(!name || !roll || !course || !username || !password || isNaN(totalFee)){
      alert('Please fill all required fields');
      return;
    }
    if(state.students.some(s => s.username === username)){
      alert('Username already exists');
      return;
    }
    const newStu = { id: uid('s'), name, roll, course, username, password, totalFee, paid };
    state.students.push(newStu);
    saveState();
    closeStudentModal();
    renderCourseFilter();
    renderStudentsTable();
    renderAdminDashboard();
    alert(`Student added — username: ${username}`);
  };
}

function openEditStudent(index){
  const s = state.students[index];
  if(!s) return;
  document.getElementById('modalTitle').textContent = 'Edit Student';
  document.getElementById('stuName').value = s.name || '';
  document.getElementById('stuRoll').value = s.roll || '';
  document.getElementById('stuCourse').value = s.course || '';
  document.getElementById('stuUsername').value = s.username || '';
  document.getElementById('stuPassword').value = s.password || '';
  document.getElementById('stuTotalFee').value = s.totalFee || 0;
  document.getElementById('stuPaidFee').value = s.paid || 0;
  document.getElementById('studentModal').classList.add('open');

  document.getElementById('saveStudent').onclick = function(){
    s.name = document.getElementById('stuName').value.trim();
    s.roll = document.getElementById('stuRoll').value.trim();
    s.course = document.getElementById('stuCourse').value.trim();
    s.password = document.getElementById('stuPassword').value.trim();
    s.totalFee = Number(document.getElementById('stuTotalFee').value || 0);
    s.paid = Number(document.getElementById('stuPaidFee').value || 0);
    saveState();
    closeStudentModal();
    renderCourseFilter();
    renderStudentsTable();
    renderAdminDashboard();
  };
}

function closeStudentModal(){
  document.getElementById('studentModal').classList.remove('open');
}

/* Delete student */
function deleteStudent(index){
  const s = state.students[index];
  if(!s) return;
  if(!confirm(`Delete student ${s.name}? This will remove their data.`)) return;
  state.students.splice(index,1);
  // remove that student's attendance entries across dates
  Object.keys(state.attendance).forEach(date => { if(state.attendance[date]) delete state.attendance[date][s.id]; });
  // remove complaints and notes if needed (we keep notes but students removed)
  saveState();
  renderCourseFilter();
  renderStudentsTable();
  renderAdminDashboard();
}

/* ---------- Attendance ---------- */
function renderAttendanceTable(){
  const date = document.getElementById('attendanceDate')?.value || new Date().toISOString().slice(0,10);
  const tbody = document.getElementById('attendanceTable');
  if(!tbody) return;
  tbody.innerHTML = '';
  state.students.forEach(s => {
    const status = state.attendance[date]?.[s.id] || 'Absent';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.roll)}</td><td>${status}</td>
      <td style="display:flex;gap:6px">
        <button class="primary btn" onclick="markAttendance('${s.id}','${date}','Present')">Present</button>
        <button class="ghost btn" onclick="markAttendance('${s.id}','${date}','Absent')">Absent</button>
      </td>`;
    tbody.appendChild(tr);
  });
}
function markAttendance(id, date, status){
  if(!state.attendance[date]) state.attendance[date] = {};
  state.attendance[date][id] = status;
  saveState();
  renderAttendanceTable();
}

/* Mark all present */
document.addEventListener('click', e => {
  if(e.target && e.target.id === 'markAllPresent'){
    const date = document.getElementById('attendanceDate')?.value || new Date().toISOString().slice(0,10);
    state.attendance[date] = state.attendance[date] || {};
    state.students.forEach(s => state.attendance[date][s.id] = 'Present');
    saveState();
    renderAttendanceTable();
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('attendanceDate');
  if(dateInput) dateInput.value = new Date().toISOString().slice(0,10);
  if(dateInput) dateInput.addEventListener('change', renderAttendanceTable);
});

/* ---------- Notes (files via dataURL optional) ---------- */
function setupNotesUI(){
  const uploadBtn = document.getElementById('uploadNoteBtn');
  const noteModal = document.getElementById('noteModal');
  const cancelNote = document.getElementById('cancelNote');
  const saveNoteBtn = document.getElementById('saveNote');

  uploadBtn?.addEventListener('click', () => {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteDesc').value = '';
    document.getElementById('noteCourse').value = '';
    document.getElementById('noteFile').value = '';
    noteModal.classList.add('open');
  });

  cancelNote?.addEventListener('click', () => { noteModal.classList.remove('open'); });

  saveNoteBtn?.addEventListener('click', () => {
    const title = document.getElementById('noteTitle').value.trim();
    const desc = document.getElementById('noteDesc').value.trim();
    const course = document.getElementById('noteCourse').value.trim();
    const fileInput = document.getElementById('noteFile');

    if(!title || !course){ alert('Please provide title and course'); return; }

    // If file selected, read as dataURL
    const file = fileInput.files && fileInput.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = function(ev){
        const dataURL = ev.target.result;
        const note = { id: uid('n'), title, desc, course, fileName: file.name, fileData: dataURL, date: new Date().toISOString().slice(0,10) };
        state.notes.push(note); saveState(); noteModal.classList.remove('open'); renderNotesTable(); renderAdminDashboard();
      };
      reader.readAsDataURL(file);
    } else {
      const note = { id: uid('n'), title, desc, course, fileName: '', fileData: '', date: new Date().toISOString().slice(0,10) };
      state.notes.push(note); saveState(); noteModal.classList.remove('open'); renderNotesTable(); renderAdminDashboard();
    }
  });

  renderNotesTable();
}

function renderNotesTable(){
  const tbody = document.getElementById('notesTable');
  if(!tbody) return;
  tbody.innerHTML = '';
  state.notes.forEach((n, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(n.title)}</td><td>${escapeHtml(n.course)}</td><td>${escapeHtml(n.date)}</td>
      <td style="display:flex;gap:8px">
        ${n.fileData ? `<button class="primary btn" onclick="downloadNote('${n.id}')">Open</button>` : ''}
        <button class="ghost btn" onclick="deleteNote(${idx})">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function downloadNote(noteId){
  const note = state.notes.find(n => n.id === noteId);
  if(!note) return alert('File not found');
  if(note.fileData){
    const a = document.createElement('a');
    a.href = note.fileData;
    a.download = note.fileName || 'note';
    a.click();
  } else {
    alert('No file attached; description: ' + (note.desc || '—'));
  }
}

function deleteNote(index){
  if(!confirm('Delete this note?')) return;
  state.notes.splice(index,1);
  saveState();
  renderNotesTable();
  renderAdminDashboard();
}

/* ---------- STUDENT ---------- */
function renderStudentInfo(username){
  const stu = state.students.find(s => s.username === username);
  if(!stu) return;
  const el = document.getElementById('studentInfo');
  if(!el) return;
  el.innerHTML = `<h3>${escapeHtml(stu.name)}</h3>
    <p class="muted">Roll: ${escapeHtml(stu.roll)}</p>
    <p class="muted">Course: ${escapeHtml(stu.course)}</p>`;
  document.getElementById('s_paid').textContent = '₹' + (Number(stu.paid)||0);
  document.getElementById('s_total').textContent = '₹' + (Number(stu.totalFee)||0);
  document.getElementById('s_due').textContent = '₹' + ( (Number(stu.totalFee)||0) - (Number(stu.paid)||0) );
}

function renderStudentAttendance(username){
  const stu = state.students.find(s => s.username === username);
  const tbody = document.getElementById('stuAttendanceTable');
  if(!stu || !tbody) return;
  tbody.innerHTML = '';
  Object.keys(state.attendance).sort().forEach(date => {
    const status = state.attendance[date]?.[stu.id] || 'Absent';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${date}</td><td>${status}</td>`;
    tbody.appendChild(tr);
  });
}

function renderStudentNotes(username){
  const stu = state.students.find(s => s.username === username);
  const tbody = document.getElementById('studentNotesTable');
  if(!stu || !tbody) return;
  tbody.innerHTML = '';
  // show only notes for student's course
  state.notes.filter(n => n.course === stu.course).forEach(n => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(n.title)}</td><td>${escapeHtml(n.desc)}</td>
      <td>${n.fileData ? `<button class="primary btn" onclick="openNoteForStudent('${n.id}')">Open</button>` : '—'}</td>
      <td>${escapeHtml(n.date)}</td>`;
    tbody.appendChild(tr);
  });
}
function openNoteForStudent(noteId){
  const n = state.notes.find(x => x.id === noteId);
  if(!n) return alert('Note missing');
  if(n.fileData){
    const a = document.createElement('a');
    a.href = n.fileData; a.target = '_blank'; a.rel='noopener';
    a.click();
  } else {
    alert(n.desc || 'No file attached');
  }
}

/* ---------- Complaints ---------- */
function submitComplaint(username){
  const text = document.getElementById('stuComplaint')?.value.trim();
  if(!text) return alert('Please write a complaint');
  const stu = state.students.find(s => s.username === username);
  if(!stu) return alert('Student not found');
  state.complaints.push({ id: uid('c'), studentId: stu.id, text, date: new Date().toISOString().slice(0,10) });
  saveState();
  document.getElementById('stuComplaint').value = '';
  alert('Complaint submitted');
}

/* ---------- Navigation setup for admin & student ---------- */
function setupAdminNav(){
  document.querySelectorAll('#admin.html .nav-btn'); // noop to keep unique selector safe
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      ['dashboardView','studentsView','attendanceView','notesView','complaintsView'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
      });
      const showId = view + 'View';
      document.getElementById(showId)?.classList.remove('hidden');

      if(view === 'dashboard') renderAdminDashboard();
      if(view === 'students') { renderCourseFilter(); renderStudentsTable(); }
      if(view === 'attendance') renderAttendanceTable();
      if(view === 'notes') renderNotesTable();
      if(view === 'complaints') renderComplaints();
    });
  });
}

function setupStudentNav(username){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      ['profileView','attendanceView','notesView','complaintView'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
      const idMap = { profile:'profileView', attendance:'attendanceView', notes:'notesView', complaint:'complaintView' };
      document.getElementById(idMap[view])?.classList.remove('hidden');
      if(view === 'profile') renderStudentInfo(username);
      if(view === 'attendance') renderStudentAttendance(username);
      if(view === 'notes') renderStudentNotes(username);
    });
  });
}

/* ---------- Export CSV (students) ---------- */
function exportCSV(){
  const rows = [['id','name','roll','course','username','totalFee','paid']];
  state.students.forEach(s => rows.push([s.id,s.name,s.roll,s.course,s.username, s.totalFee || 0, s.paid || 0]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click(); URL.revokeObjectURL(url);
}

/* ---------- Init wiring (called from each page) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Hook export button
  document.getElementById('exportBtn')?.addEventListener('click', exportCSV);

  // Admin page initialization
  if(sessionStorage.getItem('role') === 'admin'){
    renderAdminDashboard();
    renderCourseFilter();
    renderStudentsTable();
    setupAdminNav();
    setupStudentModal();
    setupNotesUI();

    // wire logout already in pages
  }

  // Student page initialization
  if(sessionStorage.getItem('role') === 'student'){
    const username = sessionStorage.getItem('username');
    renderStudentInfo(username);
    renderStudentAttendance(username);
    renderStudentNotes(username);
    setupStudentNav(username);
    document.getElementById('submitComplaint')?.addEventListener('click', ()=> submitComplaint(username));
  }

});
