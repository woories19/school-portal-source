/* App shell: top bar, persona switcher, sidebars, overlays. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc;
SP.pages = {};

function adminNav() {
  const S = SP.S, newApps = S.applicants.filter(a => a.stage === 'new').length, un = SP.unreadAdmin();
  return [
    { k: 'dashboard', l: 'Dashboard', i: 'home' },
    { g: 'Administration' },
    { k: 'admissions', l: 'Admissions', i: 'userplus', n: newApps },
    { k: 'comms', l: 'Communications', i: 'chat', n: un, hot: true },
    { k: 'announce', l: 'Announcements', i: 'mega' },
    { k: 'circulars', l: 'Circulars & consents', i: 'board' },
    { k: 'calendar', l: 'Events & calendar', i: 'cal' },
    { k: 'gate', l: 'Gate lock', i: 'lock' },
    { k: 'parents', l: 'Parents', i: 'users' },
    { k: 'students', l: 'Students', i: 'user' },
    { k: 'staff', l: 'Staff', i: 'shield' },
    { g: 'Academics' },
    { k: 'timetable', l: 'Timetables', i: 'clock' },
    { k: 'academics', l: 'Subjects & classes', i: 'book' },
    { k: 'assign', l: 'Assignments', i: 'pen' },
    { k: 'quizzes', l: 'Quizzes', i: 'help' },
    { k: 'notes', l: 'Notes & resources', i: 'file' },
    { k: 'exams', l: 'Exams & results', i: 'award' },
    { g: 'Finance' },
    { k: 'fees', l: 'Fee vouchers', i: 'cash' },
    { k: 'accounting', l: 'Accounting', i: 'doc', ext: true },
    { g: 'Reports' },
    { k: 'reports', l: 'All reports', i: 'chart' },
    { k: 'r_att', l: 'Student attendance', i: 'list' },
    { k: 'r_staff', l: 'Staff attendance', i: 'users' },
    { k: 'r_gate', l: 'Check in / out', i: 'scan' },
    { k: 'r_settle', l: 'Settlement', i: 'wallet' },
    { g: 'System' },
    { k: 'system', l: 'System status', i: 'cloud' }
  ];
}
const TEACHER_NAV = [
  { k: 'today', l: 'Today', i: 'home' }, { g: 'Classroom' }, { k: 'attendance', l: 'Attendance', i: 'check' }, { k: 'timetable', l: 'My timetable', i: 'clock' }, { k: 'academics', l: 'My subjects', i: 'book' }, { k: 'diary', l: 'Homework & diary', i: 'list' },
  { g: 'Teaching' }, { k: 'assign', l: 'Assignments', i: 'pen' }, { k: 'quizzes', l: 'Quizzes', i: 'help' }, { k: 'notes', l: 'Notes & resources', i: 'file' }, { k: 'exams', l: 'Exams & marks', i: 'award' }, { g: 'School' }, { k: 'calendar', l: 'Events & calendar', i: 'cal' }
];
function staffNav() {
  const n = SP.S.applicants.filter(a => a.stage === 'new').length, un = SP.unreadAdmin();
  return [{ k: 'desk', l: 'Front desk', i: 'home' }, { g: 'Counter' }, { k: 'admissions', l: 'Admissions', i: 'userplus', n }, { k: 'fees', l: 'Fee counter', i: 'cash' }, { k: 'comms', l: 'Parent messages', i: 'chat', n: un, hot: true }, { k: 'students', l: 'Students', i: 'user' }, { g: 'School' }, { k: 'calendar', l: 'Events & calendar', i: 'cal' }, { k: 'circulars', l: 'Circulars & consents', i: 'board' }];
}

function sidebar() {
  const S = SP.S, cur = SP.route(), nav = S.persona === 'admin' ? adminNav() : S.persona === 'teacher' ? TEACHER_NAV : staffNav();
  const who = S.persona === 'admin' ? SP.person('Principal\'s office', 'Administrator', 'sm') : S.persona === 'teacher' ? SP.person(SP.teacher(S.teacherId).name, 'Teacher', 'sm') : SP.person(SP.teacher(S.staffId).name, SP.teacher(S.staffId).title, 'sm');
  return '<nav class="side"><div class="side-who">' + who + '</div>' + nav.map(n => n.g ? '<div class="side-g">' + n.g + '</div>' :
    '<button class="side-link ' + (n.k === cur ? 'on' : '') + '" data-act="nav" data-r="' + n.k + '" data-tour="nav-' + n.k + '">' + I(n.i) + '<span>' + n.l + '</span>' + (n.ext ? '<i class="ext">ERPNext</i>' : '') + (n.n ? '<i class="badge ' + (n.hot ? 'hot' : '') + '">' + n.n + '</i>' : '') + '</button>').join('') + '</nav>';
}

// students offered in the Student-app picker: the demo family first, then one per class
function studentPool() {
  const fam = SP.kids(SP.stu(SP.S.childId).parentId), seen = {}, out = [];
  fam.forEach(k => { seen[k.id] = 1; out.push(k); });
  SP.CLASSES.forEach(c => { const s = SP.inClass(c.id)[1]; if (s && !seen[s.id]) { seen[s.id] = 1; out.push(s); } });
  return out;
}
function topbar() {
  const S = SP.S, per = S.persona, phoneOn = per === 'parent' || per === 'student' || S.split, role = SP.phoneRole();
  const seg = [['admin', 'Admin'], ['teacher', 'Teacher'], ['staff', 'Front desk'], ['parent', 'Parent'], ['student', 'Student']].map(p => '<button class="' + (per === p[0] ? 'on' : '') + '" data-act="persona" data-p="' + p[0] + '" data-tour="persona-' + p[0] + '">' + p[1] + '</button>').join('');
  const pid = SP.stu(S.childId).parentId;
  const parentSel = phoneOn && role === 'parent' ? '<select class="input sm" id="parent-pick" data-ch="setParent" title="Which parent is using the phone">' + SP.PARENTS.map(p => { const k = SP.kids(p.id); return '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.name) + ' — ' + k.map(x => esc(x.first)).join(' & ') + '</option>'; }).join('') + '</select>' : '';
  const studentSel = phoneOn && role === 'student' ? '<select class="input sm" id="student-pick" data-ch="setStudent" title="Which student is using the phone">' + studentPool().map(s => '<option value="' + s.id + '"' + (s.id === S.childId ? ' selected' : '') + '>' + esc(s.name) + ' · ' + SP.cls(s.classId).short + '</option>').join('') + '</select>' : '';
  const teacherSel = per === 'teacher' ? '<select class="input sm" id="teacher-pick" data-ch="setTeacher">' + SP.TEACHERS.slice(0, 16).map(t => '<option value="' + t.id + '"' + (t.id === S.teacherId ? ' selected' : '') + '>' + esc(t.name) + ' · ' + SP.cls(t.classId).short + '</option>').join('') + '</select>' : '';
  const dockSeg = S.split && per !== 'parent' && per !== 'student' ? '<div class="seg sm2" title="Which app to show in the docked phone">' + [['parent', 'Parent'], ['student', 'Student']].map(p => '<button class="' + (role === p[0] ? 'on' : '') + '" data-act="dockRole" data-r="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>' : '';
  return '<header class="topbar' + (per === 'parent' || per === 'student' ? ' mob' : '') + '"><div class="brand">' + SP.logo() + '<div><b>School Portal</b><span>Demo · sample data</span></div></div><div class="seg" data-tour="personas">' + seg + '</div>' +
    '<div class="tb-right">' + teacherSel + studentSel + parentSel + dockSeg +
    (per !== 'parent' && per !== 'student' ? '<button class="btn sm ' + (S.split ? 'on' : '') + '" data-act="toggleSplit" title="Show the parent / student phone next to the console">' + I('phone') + '<span>Live phone</span></button>' : '') +
    '<button class="btn sm dark" data-act="tourOpen" data-tour="tour-btn">' + I('wand') + '<span>Guided demo</span></button>' +
    '<button class="btn sm ghost" data-act="reset" title="Reset demo data">Reset</button></div></header>';
}

SP.inp.setParent = v => { const k = SP.kids(v)[0]; SP.S.childId = k.id; SP.ui.phone = { tab: 'home', sub: null }; SP.render(); };
SP.inp.setStudent = v => { SP.S.childId = v; SP.ui.phone = { tab: 'home', sub: null }; SP.render(); };
SP.inp.setTeacher = v => { SP.S.teacherId = v; SP.ui.f.attClass = ''; SP.render(); };
SP.act.dockRole = d => { SP.S.dockRole = d.r; SP.ui.phone = { tab: 'home', sub: null }; SP.render(); };
SP.pageFn = function (per, r) {
  const p = SP.pages;
  return p[per + '.' + r] || ((per === 'teacher' || per === 'staff') ? p['admin.' + r] : null);
};

SP.views.shell = function () {
  const S = SP.S, per = S.persona, phoneOn = per === 'parent' || per === 'student' || S.split, mobile = per === 'parent' || per === 'student';
  let ws = '';
  if (!mobile) {
    const fn = SP.pageFn(per, SP.route());
    ws = '<div class="ws">' + sidebar() + '<main class="main" data-scroll="ws"><div class="page">' + (fn ? fn() : '<p>Coming soon</p>') + '</div></main></div>';
  }
  let over = '';
  if (SP.ui.drawer) over += '<div class="backdrop bd-right" data-act="backdrop"><aside class="drawer ' + (SP.drawers[SP.ui.drawer.name].wide ? 'wide' : '') + '">' + SP.drawers[SP.ui.drawer.name](SP.ui.drawer.args) + '</aside></div>';
  if (SP.ui.modal) over += '<div class="backdrop" data-act="backdrop"><div class="modal ' + (SP.modals[SP.ui.modal.name].wide ? 'wide' : '') + '" data-scroll="modal" role="dialog" aria-modal="true">' + SP.modals[SP.ui.modal.name](SP.ui.modal.args) + '</div></div>';
  return topbar() + '<div class="stage ' + (mobile ? 'parent ' + per : per) + (phoneOn ? ' has-phone' : '') + '">' + ws + (phoneOn ? '<aside class="dock">' + SP.phone() + (mobile ? SP.phoneSide() : '') + '</aside>' : '') + '</div>' + over + SP.deliverHtml() + SP.tour.html();
};
})();


/* ---------- delivery tracker: makes bulk sends feel like the live messaging pipeline ---------- */
(function () {
const SP = window.SP, I = SP.icon, esc = SP.esc;
const LABEL = { push: ['App push', 'bell'], whatsapp: ['WhatsApp', 'whatsapp'], sms: ['SMS', 'sms'] };
const DUR = 2200;
function rows(d, p) {
  return d.channels.map(c => {
    const miss = c === 'whatsapp' ? Math.max(1, Math.round(d.total * .02)) : 0, ok = d.total - miss, n = Math.round(ok * Math.min(1, p * (c === 'push' ? 1.25 : c === 'whatsapp' ? .95 : .8)));
    return '<div class="dv-row"><span>' + I(LABEL[c][1]) + LABEL[c][0] + '</span><div class="dv-bar"><i data-c="' + c + '" style="width:' + Math.round(100 * n / d.total) + '%"></i></div><b data-n="' + c + '">' + n + '/' + d.total + '</b></div>';
  }).join('');
}
SP.deliver = function (o) {
  SP.ui.deliver = { title: o.title, total: o.total, channels: o.channels, note: o.note, start: Date.now() };
  clearInterval(SP._dv);
  SP._dv = setInterval(() => {
    const d = SP.ui.deliver; if (!d) return clearInterval(SP._dv);
    const p = Math.min(1, (Date.now() - d.start) / DUR);
    d.channels.forEach(c => {
      const miss = c === 'whatsapp' ? Math.max(1, Math.round(d.total * .02)) : 0, ok = d.total - miss, n = Math.round(ok * Math.min(1, p * (c === 'push' ? 1.25 : c === 'whatsapp' ? .95 : .8)));
      const bar = document.querySelector('.dv-bar i[data-c="' + c + '"]'), num = document.querySelector('[data-n="' + c + '"]');
      if (bar) bar.style.width = Math.round(100 * n / d.total) + '%'; if (num) num.textContent = n + '/' + d.total;
    });
    if (p >= 1) { const el = document.querySelector('.dv-card'); if (el) el.classList.add('done'); const t = document.querySelector('.dv-title small'); if (t) t.textContent = 'Delivered'; }
    if (Date.now() - d.start > DUR + 3500) { SP.ui.deliver = null; clearInterval(SP._dv); const el = document.querySelector('.dv-card'); if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 320); } }
  }, 120);
};
SP.deliverHtml = function () {
  const d = SP.ui.deliver; if (!d) return '';
  const p = Math.min(1, (Date.now() - d.start) / DUR), miss = d.channels.indexOf('whatsapp') > -1 ? Math.max(1, Math.round(d.total * .02)) : 0;
  return '<div class="dv-card ' + (p >= 1 ? 'done' : '') + '"><div class="dv-title"><b>' + esc(d.title) + '</b><small>' + (p >= 1 ? 'Delivered' : 'Sending…') + '</small></div>' + rows(d, p) +
    (miss ? '<div class="dv-note">' + miss + ' number' + (miss > 1 ? 's' : '') + ' not on WhatsApp — automatically sent by SMS instead</div>' : '') + (d.note ? '<div class="dv-note">' + esc(d.note) + '</div>' : '') + '</div>';
};
})();
