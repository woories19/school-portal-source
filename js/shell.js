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
    { k: 'gate', l: 'Gate lock', i: 'lock' },
    { k: 'parents', l: 'Parents', i: 'users' },
    { k: 'students', l: 'Students', i: 'user' },
    { k: 'academics', l: 'Academics', i: 'book' },
    { g: 'Finance' },
    { k: 'fees', l: 'Fee vouchers', i: 'cash' },
    { k: 'accounting', l: 'Accounting', i: 'doc', ext: true },
    { g: 'Reports' },
    { k: 'r_att', l: 'Student attendance', i: 'chart' },
    { k: 'r_staff', l: 'Staff attendance', i: 'users' },
    { k: 'r_gate', l: 'Check in / out', i: 'clock' },
    { k: 'r_settle', l: 'Settlement', i: 'wallet' }
  ];
}
const TEACHER_NAV = [{ k: 'attendance', l: 'Attendance', i: 'check' }, { k: 'diary', l: 'Homework & diary', i: 'book' }, { k: 'timetable', l: 'My timetable', i: 'cal' }];

function sidebar() {
  const S = SP.S, cur = SP.route(), nav = S.persona === 'admin' ? adminNav() : TEACHER_NAV;
  const who = S.persona === 'admin' ? SP.person('Principal\'s office', 'Administrator', 'sm') : SP.person(SP.teacher(S.teacherId).name, 'Teacher', 'sm');
  return '<nav class="side"><div class="side-who">' + who + '</div>' + nav.map(n => n.g ? '<div class="side-g">' + n.g + '</div>' :
    '<button class="side-link ' + (n.k === cur ? 'on' : '') + '" data-act="nav" data-r="' + n.k + '" data-tour="nav-' + n.k + '">' + I(n.i) + '<span>' + n.l + '</span>' + (n.ext ? '<i class="ext">ERPNext</i>' : '') + (n.n ? '<i class="badge ' + (n.hot ? 'hot' : '') + '">' + n.n + '</i>' : '') + '</button>').join('') + '</nav>';
}

function topbar() {
  const S = SP.S, showKid = S.persona === 'parent' || S.split;
  const seg = [['admin', 'Admin console'], ['teacher', 'Teacher'], ['parent', 'Parent app']].map(p => '<button class="' + (S.persona === p[0] ? 'on' : '') + '" data-act="persona" data-p="' + p[0] + '" data-tour="persona-' + p[0] + '">' + p[1] + '</button>').join('');
  const pid = SP.stu(S.childId).parentId;
  const parentSel = showKid ? '<select class="input sm" id="parent-pick" data-ch="setParent" title="Which parent is using the phone">' + SP.PARENTS.map(p => { const k = SP.kids(p.id); return '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.name) + ' — ' + k.map(x => esc(x.first)).join(' & ') + '</option>'; }).join('') + '</select>' : '';
  const teacherSel = S.persona === 'teacher' ? '<select class="input sm" id="teacher-pick" data-ch="setTeacher">' + SP.TEACHERS.slice(0, 16).map(t => '<option value="' + t.id + '"' + (t.id === S.teacherId ? ' selected' : '') + '>' + esc(t.name) + ' · ' + SP.cls(t.classId).label + '</option>').join('') + '</select>' : '';
  return '<header class="topbar"><div class="brand">' + SP.logo() + '<div><b>School Portal</b><span>Demo · sample data</span></div></div><div class="seg" data-tour="personas">' + seg + '</div>' +
    '<div class="tb-right">' + teacherSel + parentSel +
    (S.persona !== 'parent' ? '<button class="btn sm ' + (S.split ? 'on' : '') + '" data-act="toggleSplit" title="Show the parent phone next to the console">' + I('phone') + '<span>Live phone</span></button>' : '') +
    '<button class="btn sm dark" data-act="tourOpen" data-tour="tour-btn">' + I('wand') + '<span>Guided demo</span></button>' +
    '<button class="btn sm ghost" data-act="reset" title="Reset demo data">Reset</button></div></header>';
}

SP.inp.setParent = v => { const k = SP.kids(v)[0]; SP.S.childId = k.id; SP.ui.phone = { tab: 'home', sub: null }; SP.render(); };
SP.inp.setTeacher = v => { SP.S.teacherId = v; SP.ui.f.attClass = ''; SP.render(); };

SP.views.shell = function () {
  const S = SP.S, per = S.persona, showPhone = per === 'parent' || S.split;
  let ws = '';
  if (per !== 'parent') {
    const fn = SP.pages[per + '.' + SP.route()];
    ws = '<div class="ws">' + sidebar() + '<main class="main" data-scroll="ws"><div class="page">' + (fn ? fn() : '<p>Coming soon</p>') + '</div></main></div>';
  }
  let over = '';
  if (SP.ui.drawer) over += '<div class="backdrop bd-right" data-act="backdrop"><aside class="drawer">' + SP.drawers[SP.ui.drawer.name](SP.ui.drawer.args) + '</aside></div>';
  if (SP.ui.modal) over += '<div class="backdrop" data-act="backdrop"><div class="modal ' + (SP.modals[SP.ui.modal.name].wide ? 'wide' : '') + '">' + SP.modals[SP.ui.modal.name](SP.ui.modal.args) + '</div></div>';
  return topbar() + '<div class="stage ' + per + (showPhone ? ' has-phone' : '') + '">' + ws + (showPhone ? '<aside class="dock">' + SP.phone() + (per === 'parent' ? SP.parentSide() : '') + '</aside>' : '') + '</div>' + over + SP.deliverHtml() + SP.tour.html();
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
    if (Date.now() - d.start > DUR + 3500) { SP.ui.deliver = null; clearInterval(SP._dv); const el = document.querySelector('.dv-card'); if (el) el.remove(); }
  }, 120);
};
SP.deliverHtml = function () {
  const d = SP.ui.deliver; if (!d) return '';
  const p = Math.min(1, (Date.now() - d.start) / DUR), miss = d.channels.indexOf('whatsapp') > -1 ? Math.max(1, Math.round(d.total * .02)) : 0;
  return '<div class="dv-card ' + (p >= 1 ? 'done' : '') + '"><div class="dv-title"><b>' + esc(d.title) + '</b><small>' + (p >= 1 ? 'Delivered' : 'Sending…') + '</small></div>' + rows(d, p) +
    (miss ? '<div class="dv-note">' + miss + ' number' + (miss > 1 ? 's' : '') + ' not on WhatsApp — automatically sent by SMS instead</div>' : '') + (d.note ? '<div class="dv-note">' + esc(d.note) + '</div>' : '') + '</div>';
};
})();
