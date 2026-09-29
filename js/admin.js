/* Admin console — dashboard, admissions, communications, announcements, gate lock. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY, P = SP.pages;
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };

SP.feePill = function (sid) {
  if (SP.locked(sid)) return SP.pill('On hold', 'red');
  const o = SP.overdueN(sid); if (o) return SP.pill(o + ' overdue', 'red');
  if (SP.owed(sid) > 0) return SP.pill('Due', 'amber');
  return SP.pill('Clear', 'green');
};
SP.act.openStudent = d => { SP.ui.f.erp = 'overview'; SP.openDrawer('student', { id: d.id }); };

/* =============================== DASHBOARD =============================== */
P['admin.dashboard'] = function () {
  const S = SP.S, st = SP.stats(), sel = SP.f('dash', 'absent');
  const tiles = [
    ['total', 'Students', st.total, 'users', 'brand', 'Across ' + SP.CLASSES.length + ' sections'],
    ['present', 'Checked in', st.present, 'check', 'green', Math.round(100 * st.present / Math.max(1, st.total - st.unmarked)) + '% of marked'],
    ['absent', 'Absent', st.absent, 'alert', 'red', 'Parents auto-notified'],
    ['leave', 'On leave', st.leave, 'cal', 'amber', 'Approved requests'],
    ['unmarked', 'Not marked', st.unmarked, 'clock', 'gray', S.attSubmitted ? (SP.CLASSES.length - Object.keys(S.attSubmitted).length) + ' classes pending' : ''],
    ['staff', 'Staff in', st.staffIn + '/' + st.staffTotal, 'user', 'blue', 'Teachers & office']
  ].map(t => SP.tile({ label: t[1], value: t[2], icon: t[3], tone: t[4], sub: t[5], act: 'dashTile', d: t[0], sel: sel === t[0], tour: t[0] === 'absent' ? 'dash-absent' : '' })).join('');

  // detail panel
  let detail = '';
  if (sel === 'staff') {
    const rows = SP.STAFF_ALL.map(t => ({ t, s: SP.staffToday(t.id) }));
    detail = SP.table('dash-staff', [
      { h: 'Staff member', f: r => SP.person(r.t.name, r.t.title) }, { h: 'Role', f: r => r.t.role },
      { h: 'Status', f: r => r.s === 'P' ? SP.pill('Present', 'green') : r.s === 'T' ? SP.pill('Late', 'amber') : r.s === 'L' ? SP.pill('On leave', 'blue') : SP.pill('Absent', 'red') },
      { h: 'Check-in', cls: 'mono', f: r => r.s === 'A' || r.s === 'L' ? '—' : D.time(SP.inMin(r.t.id, TODAY) - 10 + (r.s === 'T' ? 30 : 0)) }
    ], rows.sort((a, b) => (a.s === 'P') - (b.s === 'P')), { per: 8 });
  } else if (sel === 'total') {
    const by = [1, 2, 3, 4, 5, 6, 7, 8].map(g => ({ label: 'Grade ' + g, value: SP.STUDENTS.filter(s => s.grade === g).length }));
    detail = '<div class="pad">' + SP.hbars(by) + '</div>';
  } else {
    const key = { present: 'P', absent: 'A', leave: 'L' }[sel];
    const list = SP.STUDENTS.filter(s => sel === 'unmarked' ? !S.attToday[s.id] : S.attToday[s.id] === key);
    detail = SP.table('dash-' + sel, [
      { h: 'Student', f: s => SP.person(s.name, s.admNo) }, { h: 'Class', f: s => SP.cls(s.classId).label },
      { h: sel === 'present' ? 'Check-in' : 'Status', cls: 'mono', f: s => sel === 'present' ? D.time(SP.inMin(s.id, TODAY)) : sel === 'unmarked' ? 'Awaiting ' + esc(SP.teacher(SP.cls(s.classId).teacherId).name.split(' ')[0]) : SP.pill(sel === 'absent' ? 'Absent' : 'On leave', sel === 'absent' ? 'red' : 'blue') },
      { h: 'Parent', f: s => esc(SP.parent(s.parentId).name) + '<div class="s">' + esc(SP.parent(s.parentId).phone) + '</div>' },
      { h: '', cls: 'r', f: s => sel === 'absent' ? SP.btn('Message', 'msgStudent', { c: 'sm', d: { id: s.id } }) : '' }
    ], list, { per: 8, row: 'openStudent', empty: 'No students in this group' });
  }

  // attendance trend
  const days = SP.DAYS.slice(-10), off = SP.DAYS.length - 10;
  const vals = days.map((d, i) => { let p = 0, n = 0; SP.STUDENTS.forEach(s => { const a = SP.ATT[s.id]; if (a) { n++; if (a[off + i] === 'P') p++; } }); return Math.round(100 * p / n); });
  const marked = st.present + st.absent + st.leave; vals.push(marked ? Math.round(100 * st.present / marked) : 0);
  const labels = days.map(d => D.dowName(d)[0] + (+d.slice(8))).concat(['Today']);

  // needs attention
  const pendingLeave = S.threads.filter(t => t.leave && t.leave.status === 'pending').length;
  const held = SP.STUDENTS.filter(s => SP.locked(s.id)).length;
  const pendingCls = SP.CLASSES.length - Object.keys(S.attSubmitted).length;
  const att = [
    [pendingCls, 'classes haven\'t submitted attendance', 'alert', 'amber', 'nav', 'r_att'],
    [SP.unreadAdmin(), 'unread parent messages', 'chat', 'blue', 'nav', 'comms'],
    [pendingLeave, 'leave requests awaiting approval', 'cal', 'amber', 'nav', 'comms'],
    [S.applicants.filter(a => a.stage === 'new').length, 'new admission applications', 'userplus', 'green', 'nav', 'admissions'],
    [held, 'students on fee hold at the gate', 'lock', 'red', 'nav', 'gate']
  ].filter(a => a[0] > 0).map(a => '<button class="att-row" data-act="' + a[4] + '" data-r="' + a[5] + '"><span class="ai ' + a[3] + '">' + I(a[2]) + '</span><span><b>' + a[0] + '</b> ' + a[1] + '</span>' + I('right') + '</button>').join('');

  // fees
  const mv = SP.monthVouchers('2026-09'), billed = mv.reduce((a, x) => a + x.v.total, 0), coll = mv.reduce((a, x) => a + (x.v.paid ? x.v.total : 0), 0);
  const byGrade = [1, 2, 3, 4, 5, 6, 7, 8].map(g => { const sub = mv.filter(x => x.s.grade === g); const b = sub.reduce((a, x) => a + x.v.total, 0), c = sub.reduce((a, x) => a + (x.v.paid ? x.v.total : 0), 0); return { label: 'Grade ' + g, value: b ? Math.round(100 * c / b) : 0 }; });
  const funnel = ['new', 'reviewed', 'interview', 'accepted', 'admitted'].map(k => ({ label: { new: 'New', reviewed: 'Reviewed', interview: 'Interview', accepted: 'Accepted', admitted: 'Admitted' }[k], value: S.applicants.filter(a => a.stage === k).length }));

  return SP.head('Good morning', D.long(TODAY) + ' · ' + SP.clock() + ' · ' + SP.STUDENTS.length + ' students', SP.btn('Export snapshot', 'dashExport', { i: 'dl', c: 'sm' })) +
    '<div class="tiles6">' + tiles + '</div>' +
    '<div class="g2">' + SP.card('Needs your attention', att ? '<div class="att-list">' + att + '</div>' : SP.empty('All caught up')) +
    '<section class="card"><div class="card-h"><h3>Attendance, last 10 school days</h3></div><div class="card-b">' + SP.cols(vals, labels, { min: 70, max: 100, h: 250, fmt: v => Math.round(v) + '%', hl: vals.length - 1 }) + '</div></section></div>' +
    SP.card({ absent: 'Absent students today', present: 'Checked-in students', leave: 'Students on leave', unmarked: 'Attendance not marked yet', staff: 'Staff attendance today', total: 'Enrolment by grade' }[sel], detail, '<span class="hint">Select a figure above to switch</span>', 'flush') +
    '<div class="g3"><section class="card"><div class="card-h"><h3>September fee collection</h3></div><div class="card-b row-c">' + SP.donut(billed ? 100 * coll / billed : 0, { size: 96, color: 'var(--green)' }) + '<div><div class="big">' + SP.pkr(coll) + '</div><div class="muted">collected of ' + SP.pkr(billed) + '</div><div class="muted">' + SP.pkr(billed - coll) + ' outstanding</div></div></div></section>' +
    SP.card('Collection by grade', SP.hbars(byGrade, { max: 100, fmt: v => v + '%', color: 'var(--green)' })) +
    SP.card('Admissions pipeline', SP.hbars(funnel, { color: 'var(--brand)' }), SP.btn('Open', 'nav', { c: 'sm ghost', d: { r: 'admissions' } })) + '</div>';
};
SP.act.dashTile = d => { SP.ui.f.dash = d.k; SP.ui.page['dash-' + d.k] = 0; SP.render(); };
SP.act.dashExport = () => { const st = SP.stats(); SP.csv('campus-snapshot.csv', ['Metric', 'Value'], [['Date', TODAY], ['Total students', st.total], ['Checked in', st.present], ['Absent', st.absent], ['On leave', st.leave], ['Not marked', st.unmarked], ['Staff in', st.staffIn + '/' + st.staffTotal]]); };
SP.act.msgStudent = d => SP.openModal('newchat', { studentId: d.id });

/* =============================== ADMISSIONS =============================== */
const STAGES = [['new', 'New', 'blue'], ['reviewed', 'Reviewed', 'gray'], ['interview', 'Interview', 'amber'], ['accepted', 'Accepted', 'green'], ['admitted', 'Admitted', 'green'], ['rejected', 'Rejected', 'red']];
const stageOf = k => STAGES.find(s => s[0] === k);
const stagePill = k => SP.pill(stageOf(k)[1], stageOf(k)[2]);
P['admin.admissions'] = function () {
  const S = SP.S, q = SP.f('adm_q').toLowerCase(), stg = SP.f('adm_stage'), gr = SP.f('adm_grade');
  const tiles = STAGES.map(s => SP.tile({ label: s[1], value: S.applicants.filter(a => a.stage === s[0]).length, act: 'setFilter', attrs: 'data-k="adm_stage" data-pk="adm" data-v="' + (stg === s[0] ? '' : s[0]) + '"', sel: stg === s[0], tour: s[0] === 'new' ? 'adm-new' : '' })).join('');
  const list = S.applicants.filter(a => (!stg || a.stage === stg) && (!gr || String(a.grade) === gr) && (!q || (a.name + a.ref + a.parent + a.phone).toLowerCase().indexOf(q) > -1)).sort((a, b) => b.submitted.localeCompare(a.submitted) || b.id.localeCompare(a.id));
  return SP.head('Admissions', S.applicants.length + ' applications this session · 2026–27', SP.btn('Simulate online application', 'admSimulate', { i: 'plus', c: 'pri', tour: 'adm-sim' })) +
    '<div class="tiles6">' + tiles + '</div>' +
    '<div class="toolbar">' + SP.search('adm_q', 'Search name, reference or phone') + SP.select('adm_grade', [['', 'All grades']].concat([1, 2, 3, 4, 5, 6, 7, 8].map(g => [g, 'Grade ' + g])), gr) +
    (stg ? SP.btn('Clear stage filter', 'setFilter', { c: 'sm', d: { k: 'adm_stage', v: '' } }) : '') + '</div>' +
    SP.table('adm', [
      { h: 'Applicant', f: a => SP.person(a.name, a.ref) }, { h: 'Applying for', f: a => 'Grade ' + a.grade }, { h: 'Parent', f: a => esc(a.parent) + '<div class="s">' + esc(a.phone) + '</div>' },
      { h: 'Source', f: a => '<span class="muted">' + a.source + '</span>' }, { h: 'Submitted', f: a => D.nice(a.submitted) }, { h: 'Stage', f: a => stagePill(a.stage) + (a.stage === 'interview' && a.interviewOn ? '<div class="s">' + D.nice(a.interviewOn) + ', 10:30</div>' : '') },
      { h: '', cls: 'r', f: a => SP.btn('Details', 'admOpen', { c: 'sm', d: { id: a.id } }) }
    ], list, { per: 9, row: 'admOpen', tourRow: 'adm-row' });
};
SP.act.admOpen = d => SP.openDrawer('applicant', { id: d.id });
SP.act.admSimulate = () => {
  const S = SP.S, q = SP.APP_QUEUE[S.queueIdx % SP.APP_QUEUE.length]; S.queueIdx++;
  const a = { id: SP.uid('A'), ref: 'ADM-2609-' + Math.floor(1000 + Math.random() * 8999).toString(36).toUpperCase(), name: q.name, gender: q.gender, dob: (2021 - q.grade) + '-04-12', grade: q.grade, prevSchool: q.prevSchool, parent: q.parent, rel: q.rel, phone: q.phone, source: 'portal', submitted: TODAY, stage: 'new', interviewOn: null, voucherIssued: false, studentId: null, log: [['Application received via online form', TODAY]] };
  S.applicants.unshift(a); SP.ui.f.adm_stage = ''; SP.ui.f.adm_q = ''; SP.ui.page.adm = 0;
  SP.toast('New online application from ' + q.parent + ' for ' + q.name); SP.render();
};
function appl(id) { return SP.S.applicants.find(a => a.id === id); }
function stageTo(a, st, note, toast) { a.stage = st; a.log.push([note, TODAY]); SP.toast(toast); SP.render(); }
SP.drawers.applicant = function (args) {
  const a = appl(args.id), c = SP.CLASSES.filter(x => x.grade === a.grade);
  let act = '';
  if (a.stage === 'new') act = SP.btn('Mark as reviewed', 'admReview', { c: 'pri', d: { id: a.id }, tour: 'adm-review' }) + SP.btn('Reject', 'admReject', { c: 'danger', d: { id: a.id } });
  else if (a.stage === 'reviewed') act = '<div class="field"><label>Interview date</label><input class="input" type="date" id="int-date" value="' + D.add(TODAY, 2) + '"></div>' + SP.btn('Schedule interview & notify parent', 'admInterview', { c: 'pri', d: { id: a.id }, tour: 'adm-int' }) + SP.btn('Reject', 'admReject', { c: 'danger', d: { id: a.id } });
  else if (a.stage === 'interview') act = SP.btn('Accept applicant', 'admAccept', { c: 'pri', d: { id: a.id }, tour: 'adm-accept' }) + SP.btn('Reject', 'admReject', { c: 'danger', d: { id: a.id } });
  else if (a.stage === 'accepted') act = (a.voucherIssued ? '<div class="note ok">' + I('check') + 'Admission voucher issued and sent to the parent.</div>' + SP.btn('Confirm fee received & admit', 'admAdmit', { c: 'pri', d: { id: a.id }, tour: 'adm-admit' }) : SP.btn('Issue admission voucher', 'admVoucher', { c: 'pri', d: { id: a.id }, tour: 'adm-voucher' }));
  else if (a.stage === 'rejected') act = SP.btn('Reopen application', 'admReopen', { c: '', d: { id: a.id } });
  else if (a.stage === 'admitted' && a.studentId) act = SP.btn('Open student profile', 'openStudent', { c: 'pri', d: { id: a.studentId } });
  else if (a.stage === 'admitted') act = '<div class="note ok">' + I('check') + 'Enrolled — student record created.</div>';
  return '<div class="dr-h"><div>' + SP.person(a.name, a.ref, 'lg') + '</div><button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div><div class="dr-b">' +
    '<div class="row-c" style="gap:8px">' + stagePill(a.stage) + '<span class="muted">Applying for Grade ' + a.grade + '</span></div>' +
    SP.kv([['Date of birth', D.niceY(a.dob)], ['Gender', a.gender === 'F' ? 'Female' : 'Male'], ['Previous school', esc(a.prevSchool)], ['Guardian', esc(a.parent) + ' (' + a.rel + ')'], ['Phone', esc(a.phone)], ['Source', a.source], ['Sections available', c.map(x => x.section + ' (' + SP.inClass(x.id).length + ' students)').join(' · ')]]) +
    '<div class="dr-act">' + act + '</div>' +
    '<h4>Timeline</h4><ul class="timeline">' + a.log.slice().reverse().map(l => '<li><b>' + esc(l[0]) + '</b><span>' + D.nice(l[1]) + '</span></li>').join('') + '</ul></div>';
};
SP.act.admReview = d => stageTo(appl(d.id), 'reviewed', 'Documents reviewed', 'Marked as reviewed');
SP.act.admInterview = d => { const a = appl(d.id), dt = $v('int-date') || D.add(TODAY, 2); a.interviewOn = dt; stageTo(a, 'interview', 'Interview scheduled for ' + D.nice(dt), 'Interview booked · SMS sent to ' + a.parent); };
SP.act.admAccept = d => stageTo(appl(d.id), 'accepted', 'Accepted by principal', 'Applicant accepted');
SP.act.admReject = d => stageTo(appl(d.id), 'rejected', 'Application rejected', 'Application rejected');
SP.act.admReopen = d => stageTo(appl(d.id), 'reviewed', 'Reopened', 'Application reopened');
SP.act.admVoucher = d => { const a = appl(d.id); a.voucherIssued = true; stageTo(a, 'accepted', 'Admission voucher issued (Rs 5,000 + first month)', 'Admission voucher sent via WhatsApp & SMS'); };
SP.act.admAdmit = d => {
  const S = SP.S, a = appl(d.id), opts = SP.CLASSES.filter(c => c.grade === a.grade).sort((x, y) => SP.inClass(x.id).length - SP.inClass(y.id).length), c = opts[0];
  const n = S.newStudents.length + 1, pid = 'PN' + (S.newParents.length + 1), sid = 'SN' + n, sur = a.parent.split(' ').slice(-1)[0];
  const par = { id: pid, name: a.parent, sur, rel: a.rel, phone: a.phone, email: a.parent.toLowerCase().replace(/ /g, '.') + '@gmail.com' };
  const stu = { id: sid, first: a.name.split(' ')[0], name: a.name, gender: a.gender, classId: c.id, grade: a.grade, roll: SP.inClass(c.id).length + 1, parentId: pid, admNo: 'SP-2026-' + (900 + n), dob: a.dob, address: 'House 5, Street 2, Model Town', transport: false, ability: .7, pref: 'New admission — assign a buddy for the first week', eContact: { name: 'Uncle ' + sur, phone: '0300-1234567' } };
  S.newParents.push(par); S.newStudents.push(stu); SP.PARENTS.push(par); SP.PARENT_MAP[pid] = par; SP.STUDENTS.push(stu); SP.STU_MAP[sid] = stu;
  const heads = [['Admission fee', 5000], ['Tuition fee', c.fee]];
  S.fees[sid] = [{ id: 'V2609-A' + n, month: '2026-09', heads, total: 5000 + c.fee, due: TODAY, paid: true, paidOn: TODAY, method: 'Cash', sent: true }];
  S.attToday[sid] = 'P'; a.studentId = sid;
  stageTo(a, 'admitted', 'Admitted to ' + c.label + ' (' + stu.admNo + ')', a.name + ' admitted to ' + c.label + ' — student record created');
};

/* =============================== COMMUNICATIONS =============================== */
const lastMsg = t => t.messages[t.messages.length - 1];
P['admin.comms'] = function () {
  const S = SP.S, flt = SP.f('c_flt', 'all'), q = SP.f('c_q').toLowerCase(), sel = SP.f('thread');
  const list = S.threads.filter(t => (flt === 'all' || (flt === 'unread' && t.unreadAdmin) || (flt === 'leave' && t.type === 'Leave request') || (flt === 'fee' && t.type === 'Fee query')) &&
    (!q || (SP.stu(t.studentId).name + SP.parent(SP.stu(t.studentId).parentId).name + t.subject).toLowerCase().indexOf(q) > -1)).sort((a, b) => lastMsg(b).ts.localeCompare(lastMsg(a).ts));
  const chips = [['all', 'All'], ['unread', 'Unread'], ['leave', 'Leave'], ['fee', 'Fees']].map(c => '<button class="chip ' + (flt === c[0] ? 'on' : '') + '" data-act="setFilter" data-k="c_flt" data-v="' + c[0] + '">' + c[1] + '</button>').join('');
  const items = list.map(t => { const s = SP.stu(t.studentId), p = SP.parent(s.parentId), m = lastMsg(t); return '<button class="thread ' + (t.id === sel ? 'on' : '') + (t.unreadAdmin ? ' unread' : '') + '" data-act="openThread" data-id="' + t.id + '"' + (t.id === list[0].id ? ' data-tour="thread-0"' : '') + '>' + SP.avatar(p.name) +
    '<div class="tm"><div class="tt"><b>' + esc(p.name) + '</b><span>' + D.niceTs(m.ts) + '</span></div><div class="ts">' + esc(s.name) + ' · ' + SP.cls(s.classId).short + '</div><div class="tp">' + SP.pill(t.type, t.type === 'Leave request' ? 'amber' : t.type === 'Fee query' ? 'blue' : 'gray') + esc(m.text.slice(0, 48)) + '…</div></div>' + (t.unreadAdmin ? '<i class="dot"></i>' : '') + '</button>'; }).join('') || SP.empty('No conversations');
  let pane = '<div class="pane-empty">' + I('chat') + '<b>Select a conversation</b><span>Parent messages, leave requests and fee queries appear here.</span></div>';
  const th = S.threads.find(t => t.id === sel);
  if (th) {
    const s = SP.stu(th.studentId), p = SP.parent(s.parentId);
    const banner = th.leave && th.leave.status === 'pending' ? '<div class="leave-b"><div>' + I('cal') + '<span><b>Leave request</b> for ' + D.nice(th.leave.date) + '</span></div><div>' + SP.btn('Approve', 'leaveDecide', { c: 'sm pri', d: { id: th.id, v: 'approved' }, tour: 'leave-approve' }) + SP.btn('Decline', 'leaveDecide', { c: 'sm', d: { id: th.id, v: 'declined' } }) + '</div></div>' : th.leave ? '<div class="leave-b done"><div>' + I('check') + '<span>Leave for ' + D.nice(th.leave.date) + ' — <b>' + th.leave.status + '</b></span></div></div>' : '';
    pane = '<div class="ch-h"><div>' + SP.person(p.name, esc(p.rel) + ' of ' + esc(s.name) + ' · ' + SP.cls(s.classId).label + ' · ' + esc(p.phone)) + '</div><div>' + SP.btn('Student profile', 'openStudent', { c: 'sm', d: { id: s.id } }) + '</div></div>' + banner +
      '<div class="msgs" data-scroll="chat" data-stick="1">' + th.messages.map(m => '<div class="bub ' + (m.from === 'school' ? 'me' : 'them') + '"><div class="bw">' + (m.from === 'school' ? esc(m.who) : esc(m.who) + ' · Parent') + '</div>' + esc(m.text) + '<span>' + D.niceTs(m.ts) + '</span></div>').join('') + '</div>' +
      '<div class="quick">' + ['Approved, thank you.', 'Noted. We will get back to you shortly.', 'Please share more details.', 'Please visit the front desk.'].map(x => '<button class="chip" data-act="quickReply" data-t="' + esc(x) + '">' + x + '</button>').join('') + '</div>' +
      '<div class="composer"><input class="input" id="reply" placeholder="Type a reply to ' + esc(p.name.split(' ')[0]) + '…" data-enter="sendReply" autocomplete="off">' + SP.btn('Send', 'sendReply', { c: 'pri', i: 'send', tour: 'send-reply' }) + '</div>';
  }
  return SP.head('Parent communications', S.threads.length + ' conversations · ' + SP.unreadAdmin() + ' unread', SP.btn('New chat', 'newChat', { i: 'plus', c: 'pri' })) +
    '<div class="comms"><div class="cl"><div class="cl-h">' + SP.search('c_q', 'Search parent or student') + '<div class="chips">' + chips + '</div></div><div class="cl-list">' + items + '</div></div><div class="cp">' + pane + '</div></div>';
};
SP.act.newChat = () => SP.openModal('newchat', {});
SP.act.openThread = d => { const t = SP.S.threads.find(x => x.id === d.id); t.unreadAdmin = false; SP.ui.f.thread = d.id; SP.render(); };
SP.act.quickReply = d => { const el = document.getElementById('reply'); if (el) { el.value = d.t; el.focus(); } };
function sendToParent(t, text, who) {
  t.messages.push({ from: 'school', who: who || 'Front Desk', text, ts: SP.stamp() }); t.unreadParent = true; t.unreadAdmin = false;
  SP.notify([t.studentId], { kind: 'message', title: 'New message from school', body: text, ref: t.id });
}
SP.act.sendReply = () => { const text = $v('reply'); if (!text) return SP.toast('Type a message first', 'warn'); const t = SP.S.threads.find(x => x.id === SP.ui.f.thread); if (!t) return; sendToParent(t, text); SP.render(); };
SP.act.leaveDecide = d => {
  const t = SP.S.threads.find(x => x.id === d.id); t.leave.status = d.v;
  if (d.v === 'approved' && t.leave.date === TODAY) SP.S.attToday[t.studentId] = 'L';
  sendToParent(t, d.v === 'approved' ? 'Leave approved for ' + D.nice(t.leave.date) + '. Get well soon!' : 'Sorry, we cannot approve this leave. Please contact the front desk.', 'Class teacher');
  SP.toast('Leave ' + d.v + ' · parent notified'); SP.render();
};
SP.modals.newchat = function (a) {
  const cid = SP.f('nc_class', a.studentId ? SP.stu(a.studentId).classId : '5A'), sid = a.studentId || SP.f('nc_stu');
  const studs = SP.inClass(cid);
  return '<div class="m-h"><h3>New conversation</h3><button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button></div><div class="m-b">' +
    '<div class="field"><label>Class</label>' + SP.select('nc_class', SP.classOptions(), cid) + '</div>' +
    '<div class="field"><label>Student</label><select class="input" id="nc-stu">' + studs.map(s => '<option value="' + s.id + '"' + (s.id === sid ? ' selected' : '') + '>' + esc(s.name) + ' — ' + esc(SP.parent(s.parentId).name) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label>Subject</label><input class="input" id="nc-sub" value="General" autocomplete="off"></div>' +
    '<div class="field"><label>Message</label><textarea class="input" id="nc-msg" rows="3" placeholder="Write your message…"></textarea></div></div>' +
    '<div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Send', 'ncSend', { c: 'pri', i: 'send' }) + '</div>';
};
SP.act.ncSend = () => {
  const sid = $v('nc-stu'), text = $v('nc-msg'); if (!sid || !text) return SP.toast('Add a message first', 'warn');
  const t = { id: SP.uid('C'), studentId: sid, type: 'General', subject: $v('nc-sub') || 'General', status: 'open', unreadAdmin: false, unreadParent: false, messages: [] };
  SP.S.threads.unshift(t); sendToParent(t, text); SP.ui.modal = null; SP.ui.f.thread = t.id; SP.ui.f.c_flt = 'all'; SP.toast('Message sent to ' + SP.parent(SP.stu(sid).parentId).name); SP.render();
};

/* =============================== ANNOUNCEMENTS =============================== */
const audienceKids = aud => aud === 'all' ? SP.STUDENTS : SP.inClass(aud);
const audienceLabel = aud => aud === 'all' ? 'All parents' : SP.cls(aud).label + ' parents';
const parentCount = aud => { const m = {}; audienceKids(aud).forEach(s => { m[s.parentId] = 1; }); return Object.keys(m).length; };
P['admin.announce'] = function () {
  const S = SP.S;
  const chan = { push: ['App push', 'bell'], whatsapp: ['WhatsApp', 'whatsapp'], sms: ['SMS', 'sms'] };
  const hist = S.announcements.slice().sort((a, b) => b.ts.localeCompare(a.ts)).map((a, i) => { const n = parentCount(a.audience), read = i === 0 && a.ts.slice(0, 10) === TODAY ? 0 : Math.round(n * (.5 + SP.hash01(a.id) * .35)); return '<div class="ann"><div class="ann-h"><b>' + esc(a.title) + '</b><span>' + D.niceTs(a.ts) + '</span></div><p>' + esc(a.body) + '</p><div class="ann-f">' + SP.pill(audienceLabel(a.audience), 'gray') + a.channels.map(c => '<span class="ch">' + I(chan[c][1]) + chan[c][0] + '</span>').join('') + '<span class="muted r">Delivered to ' + n + ' · Read by ' + read + '</span></div></div>'; }).join('');
  return SP.head('Announcements', 'Send push notifications, WhatsApp and SMS to parents', '') +
    '<div class="g21"><section class="card"><div class="card-h"><h3>Compose announcement</h3></div><div class="card-b">' +
    '<div class="field"><label>Audience</label><select class="input" id="an-aud"><option value="all">All parents (' + parentCount('all') + ')</option>' + SP.CLASSES.map(c => '<option value="' + c.id + '">' + c.label + ' (' + parentCount(c.id) + ')</option>').join('') + '</select></div>' +
    '<div class="field"><label>Title</label><input class="input" id="an-title" placeholder="e.g. School closed on Friday" autocomplete="off"></div>' +
    '<div class="field"><label>Message</label><textarea class="input" id="an-body" rows="4" placeholder="Write your announcement…"></textarea></div>' +
    '<div class="field"><label>Send via</label><div class="checks">' + Object.keys(chan).map(k => '<label class="chk"><input type="checkbox" id="an-' + k + '"' + (k !== 'sms' ? ' checked' : '') + '> ' + I(chan[k][1]) + chan[k][0] + '</label>').join('') + '</div></div>' +
    '<div class="row-c" style="gap:8px">' + SP.btn('Fill sample', 'anSample', { c: 'sm' }) + SP.btn('Send announcement', 'anSend', { c: 'pri', i: 'send', tour: 'an-send' }) + '</div></div></section>' +
    '<section class="card"><div class="card-h"><h3>Recent announcements</h3></div><div class="card-b anns">' + hist + '</div></section></div>';
};
SP.act.anSample = () => { document.getElementById('an-title').value = 'Parent–teacher meeting on Saturday'; document.getElementById('an-body').value = 'Dear parents, the PTM for this term will be held this Saturday from 9 AM to 1 PM. Please collect your slot from the front desk or reply in the app.'; };
SP.act.anSend = () => {
  const title = $v('an-title'), body = $v('an-body'), aud = $v('an-aud'); if (!title || !body) return SP.toast('Add a title and message', 'warn');
  const channels = ['push', 'whatsapp', 'sms'].filter(k => document.getElementById('an-' + k).checked); if (!channels.length) return SP.toast('Pick at least one channel', 'warn');
  SP.S.announcements.push({ id: SP.uid('N'), title, body, audience: aud, channels, ts: SP.stamp(), by: 'Principal' });
  SP.deliver({ title: 'Announcement · ' + audienceLabel(aud), total: parentCount(aud), channels });
  const cur = SP.stu(SP.S.childId); if (aud === 'all' || SP.kids(cur.parentId).some(k => k.classId === aud)) SP.push(title, body, 'announcement');
  SP.render();
};

/* =============================== GATE LOCK =============================== */
P['admin.gate'] = function () {
  const S = SP.S, g = S.gate, held = SP.STUDENTS.filter(s => SP.locked(s.id)), over = Object.keys(g.overrides).filter(k => g.overrides[k]);
  const scan = SP.ui.scan, sc = scan ? SP.stu(scan.sid) : null;
  const scanRes = sc ? '<div class="scan-res ' + (scan.ok ? 'ok' : 'no') + '"><div class="sr-ic">' + I(scan.ok ? 'check' : 'lock') + '</div><b>' + (scan.ok ? 'ENTRY ALLOWED' : 'ENTRY HELD') + '</b><div>' + esc(sc.name) + ' · ' + SP.cls(sc.classId).label + '</div>' + (scan.ok ? '<span>Have a good day!</span>' : '<span>' + SP.overdueN(sc.id) + ' fee vouchers overdue (' + SP.pkr(SP.owed(sc.id)) + '). Please visit the accounts office.</span>') + '</div>' : '<div class="scan-res idle"><div class="sr-ic">' + I('scan') + '</div><b>Ready to scan</b><span>Tap a student card at the gate reader</span></div>';
  const log = g.log.slice(0, 5).map(l => '<li><span>' + esc(SP.stu(l.sid).name) + '</span>' + SP.pill(l.ok ? 'Allowed' : 'Held', l.ok ? 'green' : 'red') + '<i>' + l.ts.slice(11) + '</i></li>').join('') || '<li class="muted">No scans yet</li>';
  return SP.head('Gate lock', 'Automatically hold gate entry for students with overdue fees', '<span class="pill amber">Optional add-on</span>') +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Gate lock', value: g.enabled ? 'Enabled' : 'Disabled', icon: 'lock', tone: g.enabled ? 'green' : 'gray', sub: 'Lock after ' + g.minMonths + ' overdue months' }) + SP.tile({ label: 'On hold today', value: held.length, icon: 'alert', tone: 'red', sub: SP.pkr(held.reduce((a, s) => a + SP.owed(s.id), 0)) + ' outstanding' }) + SP.tile({ label: 'Manual overrides', value: over.length, icon: 'unlock', tone: 'amber', sub: 'Allowed by the principal' }) + SP.tile({ label: 'Scans today', value: g.log.length + 412, icon: 'scan', tone: 'blue', sub: 'Gate + bus entries' }) + '</div>' +
    '<div class="g21"><div>' +
    '<div class="toolbar"><label class="chk">' + '<input type="checkbox" data-ch="gateEnable"' + (g.enabled ? ' checked' : '') + '> Enable gate lock</label><span class="muted">Lock after</span>' + SP.select('gate_m', [[1, '1 overdue month'], [2, '2 overdue months'], [3, '3 overdue months']], g.minMonths).replace('data-ch="filter" data-k="gate_m"', 'data-ch="gateMonths"') + '<div class="grow"></div>' + SP.btn('Send fee reminder to all', 'gateRemind', { i: 'send', c: 'pri', tour: 'gate-remind' }) + '</div>' +
    SP.table('gate', [
      { h: 'Student', f: s => SP.person(s.name, s.admNo) }, { h: 'Class', f: s => SP.cls(s.classId).label }, { h: 'Overdue', f: s => SP.pill(SP.overdueN(s.id) + ' months', 'red') }, { h: 'Amount', cls: 'mono', f: s => SP.pkr(SP.owed(s.id)) },
      { h: '', cls: 'r', f: s => SP.btn('Allow entry', 'gateOverride', { c: 'sm', d: { id: s.id, v: 1 } }) }
    ], held, { per: 7, empty: 'No students are on hold', row: 'openStudent' }) + '</div>' +
    '<section class="card"><div class="card-h"><h3>Gate reader simulator</h3></div><div class="card-b">' + scanRes +
    '<div class="row-c" style="gap:8px;margin-top:12px">' + SP.btn('Scan student on hold', 'gateScan', { c: 'sm danger', d: { k: 'held' }, tour: 'gate-scan' }) + SP.btn('Scan cleared student', 'gateScan', { c: 'sm', d: { k: 'clear' } }) + '</div>' +
    '<h4>Recent scans</h4><ul class="scanlog">' + log + '</ul></div></section></div>';
};
SP.inp.gateEnable = v => { SP.S.gate.enabled = v; SP.toast('Gate lock ' + (v ? 'enabled' : 'disabled')); SP.render(); };
SP.inp.gateMonths = v => { SP.S.gate.minMonths = +v; SP.render(); };
SP.act.gateOverride = d => { SP.S.gate.overrides[d.id] = true; SP.toast('Entry allowed for ' + SP.stu(d.id).name + ' today'); SP.render(); };
SP.act.gateScan = d => {
  const held = SP.STUDENTS.filter(s => SP.locked(s.id)), clear = SP.STUDENTS.filter(s => !SP.locked(s.id) && SP.owed(s.id) === 0);
  const pool = d.k === 'held' ? held : clear; if (!pool.length) return SP.toast('No student available for this scan', 'warn');
  const s = pool[Math.floor(Math.random() * pool.length)], ok = !SP.locked(s.id);
  SP.ui.scan = { sid: s.id, ok }; SP.S.gate.log.unshift({ sid: s.id, ok, ts: SP.stamp() });
  SP.render();
};
SP.act.gateRemind = () => {
  const held = SP.STUDENTS.filter(s => SP.locked(s.id)), seen = {};
  held.forEach(s => { if (seen[s.parentId]) return; seen[s.parentId] = 1; SP.notify([s.id], { kind: 'fee', title: 'Fee overdue — gate entry on hold', body: 'Please clear ' + SP.pkr(SP.owed(s.id)) + ' to avoid entry being held.' }); });
  SP.deliver({ title: 'Gate-hold reminder', total: Object.keys(seen).length, channels: ['push', 'whatsapp', 'sms'] }); SP.render();
};
})();
