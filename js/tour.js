/* Guided demo: scripted flows that navigate, highlight and (optionally) perform the action for the presenter. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc;
const T = SP.tour = { on: false, list: false, fi: 0, si: 0, scroll: false };
const S = () => SP.S;
const kid = () => SP.stu(SP.S.childId);
const app0 = () => SP.S.applicants[0];
const octV = () => SP.vouchers(SP.S.childId).find(v => v.month === SP.latestMonth());
const topThread = () => SP.S.threads[0];

const FLOWS = [
  { title: 'Admissions: application to enrolment', icon: 'userplus', mins: 2, desc: 'An online application arrives, is reviewed, interviewed, accepted, fee-voucher issued, and the student is enrolled.', steps: [
    { persona: 'admin', route: 'admissions', target: 'adm-sim', text: 'Applications from the school website land in <b>Admissions</b>. Let\'s simulate a parent applying online.', act: ['Simulate application', () => SP.act.admSimulate()] },
    { persona: 'admin', route: 'admissions', target: 'adm-row', text: 'The new application is at the top, stage <b>New</b>. Open it to see the applicant\'s details.', act: ['Open application', () => SP.act.admOpen({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', target: 'adm-review', setup: () => SP.act.admOpen({ id: app0().id }), text: 'Staff check the documents and mark the application <b>Reviewed</b>.', act: ['Mark reviewed', () => SP.act.admReview({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', target: 'adm-int', setup: () => SP.act.admOpen({ id: app0().id }), text: 'Pick an interview date. The parent is notified automatically by SMS.', act: ['Schedule interview', () => SP.act.admInterview({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', target: 'adm-accept', setup: () => SP.act.admOpen({ id: app0().id }), text: 'After the interview, the principal accepts the applicant.', act: ['Accept applicant', () => SP.act.admAccept({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', target: 'adm-voucher', setup: () => SP.act.admOpen({ id: app0().id }), text: 'An admission fee voucher is generated and sent to the parent.', act: ['Issue voucher', () => SP.act.admVoucher({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', target: 'adm-admit', setup: () => SP.act.admOpen({ id: app0().id }), text: 'Once the fee is received, admit the student. The system assigns the section with more space and creates the student record.', act: ['Confirm & admit', () => SP.act.admAdmit({ id: app0().id })] },
    { persona: 'admin', route: 'students', f: { st_q: '' }, target: 'stu-row', text: 'The student is now part of the school database, with a fee record and attendance ready to go.', setup: () => { SP.ui.f.st_q = app0().name; SP.ui.page.students = 0; } }
  ] },
  { title: 'Fee vouchers: generate, send, pay online', icon: 'cash', mins: 3, desc: 'Generate a month of vouchers for the whole school, send to parents, watch a parent pay online and see it reconcile.', steps: [
    { persona: 'admin', route: 'fees', target: 'gen-btn', text: 'Fee vouchers for the <b>whole school</b> are generated in one click. Tuition and transport heads are applied per student automatically.', act: ['Open generator', () => SP.act.genModal()] },
    { persona: 'admin', route: 'fees', target: 'gen-go', setup: () => SP.act.genModal(), text: 'Review the totals, then generate.', act: ['Generate vouchers', () => SP.act.genGo({ m: SP.nextMonth() })] },
    { persona: 'admin', route: 'fees', target: 'fee-send', text: 'Vouchers stay in <b>Draft</b> until you are ready. Sending delivers them through the parent app and WhatsApp.', act: ['Send to parents', () => SP.act.feeSend()] },
    { persona: 'admin', route: 'fees', phone: { tab: 'fees', sub: null }, target: 'ph-tab-fees', text: 'On the parent\'s phone (right), a <b>push notification</b> arrives and the new voucher is waiting under Fees.' },
    { persona: 'admin', route: 'fees', target: 'ph-pay', setup: () => { SP.ui.phone = { tab: 'fees', sub: 'voucher:' + octV().id }; }, text: 'The parent opens the voucher and taps <b>Pay online</b>.', act: ['Tap Pay', () => SP.act.phPayStart({ v: octV().id })] },
    { persona: 'admin', route: 'fees', target: 'ph-confirm', setup: () => { SP.ui.phone = { tab: 'fees', sub: 'pay:' + octV().id }; SP.ui.pay = { vid: octV().id, method: 'jazzcash', step: 'pick' }; }, text: 'They choose JazzCash, Easypaisa, card or bank app, and confirm. <i>(Simulated — no money moves.)</i>', act: ['Pay now', () => SP.act.phPayGo()] },
    { persona: 'admin', route: 'r_settle', phone: { tab: 'fees', sub: null }, target: null, text: 'The payment is live in the office. The voucher shows <b>Paid</b> and the <b>Settlement report</b> breaks collections down by channel, with gateway charges and net settlement.' }
  ] },
  { title: 'Attendance to parent alert', icon: 'check', mins: 2, desc: 'A teacher marks attendance; absent students\' parents are alerted instantly and the dashboard updates.', steps: [
    { persona: 'teacher', route: 'attendance', setup: () => { SP.S.teacherId = SP.cls(kid().classId).teacherId; SP.ui.f.attClass = kid().classId; }, target: 'att-seg', text: 'The teacher sees the class list, everyone defaults to <b>Present</b>. Mark absentees with one tap.', act: ['Mark ' + '{kid}' + ' absent', () => { SP.render(); SP.act.attSet({ s: SP.S.childId, v: 'A' }); }] },
    { persona: 'teacher', route: 'attendance', target: 'att-submit', text: 'Submit once. Every parent whose child is absent or on leave is notified.', act: ['Submit attendance', () => SP.act.attSubmit()] },
    { persona: 'teacher', route: 'attendance', phone: { tab: 'alerts', sub: null }, target: 'ph-tab-alerts', text: 'The parent instantly gets a <b>push notification</b>, and it is logged under Alerts.' },
    { persona: 'admin', route: 'dashboard', f: { dash: 'absent' }, target: 'dash-absent', text: 'The principal\'s <b>Dashboard</b> reflects it immediately, with the absent list ready for follow-up calls.' }
  ] },
  { title: 'Parent communication & leave requests', icon: 'chat', mins: 2, desc: 'A parent sends a leave request from the app; the office approves it and the parent is notified.', steps: [
    { persona: 'admin', route: 'comms', phone: { tab: 'chat', sub: null }, target: 'ph-newmsg', text: 'Parents message the school from the app, no more phone calls or WhatsApp groups.', act: ['New leave request', () => { SP.ui.nm = { type: 'Leave request' }; SP.act.phSub({ s: 'new' }); }] },
    { persona: 'admin', route: 'comms', phone: { tab: 'chat', sub: 'new' }, target: 'ph-nm-send', text: 'Pick the date, write a note, send.', act: ['Send request', () => SP.act.phNmSend()] },
    { persona: 'admin', route: 'comms', target: 'thread-0', text: 'It lands in the office <b>Communications</b> inbox as an unread leave request.', act: ['Open conversation', () => SP.act.openThread({ id: topThread().id })] },
    { persona: 'admin', route: 'comms', target: 'leave-approve', setup: () => { SP.act.openThread({ id: topThread().id }); }, text: 'One tap approves the leave. The parent is told automatically, and if it is for today the attendance is marked <b>Leave</b>.', act: ['Approve leave', () => SP.act.leaveDecide({ id: topThread().id, v: 'approved' })] },
    { persona: 'admin', route: 'comms', phone: { tab: 'chat', sub: 'thread:' }, setup: () => { SP.ui.phone = { tab: 'chat', sub: 'thread:' + topThread().id }; }, target: 'ph-send', text: 'On the phone: the approval arrives as a push and appears in the chat thread.' }
  ] },
  { title: 'Announcements to parents', icon: 'mega', mins: 1, desc: 'Broadcast a notice by app push, WhatsApp and SMS to all parents or a single class.', steps: [
    { persona: 'admin', route: 'announce', target: 'an-send', text: 'Choose the audience, write the message, pick the channels. Delivery and read counts are tracked below.', act: ['Send sample announcement', () => { SP.act.anSample(); SP.act.anSend(); }] },
    { persona: 'admin', route: 'announce', phone: { tab: 'alerts', sub: null }, target: 'ph-tab-alerts', text: 'Parents get the push instantly, and it stays in their Alerts feed.' }
  ] },
  { title: 'Gate lock & fee defaulters', icon: 'lock', mins: 2, desc: 'Students with overdue fees are held at the gate; reminders and a live reader simulation.', steps: [
    { persona: 'admin', route: 'gate', target: 'gate-remind', text: 'Students whose fees are overdue beyond your rule are flagged automatically. Nudge all their parents in one tap.', act: ['Send reminders', () => SP.act.gateRemind()] },
    { persona: 'admin', route: 'gate', target: 'gate-scan', text: 'At the gate, a card scan checks the fee status. A student with dues is <b>held</b> and referred to accounts.', act: ['Scan a held student', () => SP.act.gateScan({ k: 'held' })] },
    { persona: 'admin', route: 'gate', target: 'gate-scan', text: 'A student with no dues walks straight in.', act: ['Scan a cleared student', () => SP.act.gateScan({ k: 'clear' })] }
  ] },
  { title: 'Student ERP & reports', icon: 'chart', mins: 2, desc: 'One profile for family, fees, attendance and academics, plus operational and finance reports.', steps: [
    { persona: 'admin', route: 'students', f: { st_q: '' }, target: 'stu-row', text: 'Every student has a full <b>ERP profile</b>.', act: ['Open a profile', () => { const s = SP.STUDENTS.filter(x => SP.overdueN(x.id) > 0)[0] || SP.STUDENTS[0]; SP.act.openStudent({ id: s.id }); }] },
    { persona: 'admin', route: 'r_att', target: null, text: 'Reports: <b>student attendance</b> by class, with chronic absentees flagged for follow-up.' },
    { persona: 'admin', route: 'r_staff', target: null, text: '<b>Staff attendance</b> across 14 days, at a glance.' },
    { persona: 'admin', route: 'r_gate', target: null, text: '<b>Check in / out</b> logs with late arrivals highlighted.' },
    { persona: 'admin', route: 'r_settle', target: null, text: '<b>Settlement</b>: every payment channel, gateway charges and net amounts for reconciliation.' }
  ] },
  { title: 'Teacher: homework to parents', icon: 'book', mins: 1, desc: 'Post homework and notes that parents see immediately.', steps: [
    { persona: 'teacher', route: 'diary', target: 'dy-post', setup: () => { SP.S.teacherId = SP.cls(kid().classId).teacherId; SP.ui.f.dy_c = kid().classId; }, text: 'Teachers post homework or class notes in seconds.', act: ['Post homework', () => SP.act.dyPost()] },
    { persona: 'teacher', route: 'diary', phone: { tab: 'diary', sub: null }, target: 'ph-tab-diary', text: 'Parents are notified and see it in the <b>Diary</b>.' }
  ] }
];

const flow = () => FLOWS[T.fi], step = () => flow().steps[T.si];
function enter() {
  const st = step(), s = SP.S;
  SP.ui.modal = null; SP.ui.drawer = null;
  if (st.persona) s.persona = st.persona; if (s.persona !== 'parent') s.split = true;
  if (st.route) s.route[s.persona] = st.route;
  if (st.phone) SP.ui.phone = { tab: st.phone.tab, sub: st.phone.sub };
  if (st.f) Object.assign(SP.ui.f, st.f);
  if (st.setup) st.setup();
  T.scroll = true; SP.render();
}
SP.act.tourOpen = () => { T.list = true; T.on = false; SP.render(); };
SP.act.tourClose = () => { T.list = false; SP.render(); };
SP.act.tourStart = d => { T.fi = +d.i; T.si = 0; T.on = true; T.list = false; enter(); };
SP.act.tourExit = () => { T.on = false; T.list = false; SP.render(); };
SP.act.tourBack = () => { if (T.si > 0) { T.si--; enter(); } };
SP.act.tourNext = () => { if (T.si < flow().steps.length - 1) { T.si++; enter(); } else { T.on = false; SP.toast('Walkthrough complete'); SP.render(); } };
SP.act.tourAct = () => { const st = step(); st.act[1](); if (T.si < flow().steps.length - 1) { T.si++; const nx = step(); setTimeout(() => { SP.ui.modal = null; if (nx.persona) SP.S.persona = nx.persona; if (nx.route) SP.S.route[SP.S.persona] = nx.route; if (nx.phone) SP.ui.phone = { tab: nx.phone.tab, sub: nx.phone.sub }; if (nx.f) Object.assign(SP.ui.f, nx.f); if (nx.persona !== 'parent') SP.S.split = true; SP.ui.drawer = null; if (nx.setup) nx.setup(); T.scroll = true; SP.render(); }, 350); } else { SP.render(); } };

T.html = function () {
  if (T.list) return '<div class="backdrop" data-act="tourClose"><div class="modal tourlist"><div class="m-h"><h3>Guided demo</h3><button class="btn ghost icon" data-act="tourClose">' + I('x') + '</button></div><div class="m-b"><p class="muted" style="margin:0 0 12px">Pick a scenario. Each step highlights what to click, and can run it for you.</p>' +
    FLOWS.map((f, i) => '<button class="flow" data-act="tourStart" data-i="' + i + '"><span class="fi">' + I(f.icon) + '</span><div><b>' + f.title + '</b><span>' + f.desc + '</span></div><i>' + f.mins + ' min</i></button>').join('') + '</div></div></div>';
  if (!T.on) return '';
  const st = step(), f = flow(), n = f.steps.length;
  return '<div class="tour-card"><div class="tc-h"><span>' + I('wand') + f.title + '</span><button data-act="tourExit" title="Exit">' + I('x') + '</button></div><div class="tc-dots">' + f.steps.map((_, i) => '<i class="' + (i === T.si ? 'on' : i < T.si ? 'done' : '') + '"></i>').join('') + '</div>' +
    '<p>' + st.text + '</p><div class="tc-a"><button class="btn sm" data-act="tourBack"' + (T.si === 0 ? ' disabled' : '') + '>' + I('left') + '</button>' + (st.act ? '<button class="btn sm pri grow" data-act="tourAct">' + I('wand') + '<span>' + esc(st.act[0].replace('{kid}', kid().first)) + '</span></button>' : '<span class="grow"></span>') + '<button class="btn sm" data-act="tourNext"><span>' + (T.si === n - 1 ? 'Finish' : 'Next') + '</span>' + I('right') + '</button></div></div>';
};
T.afterRender = function () {
  document.querySelectorAll('.tour-hl').forEach(e => e.classList.remove('tour-hl'));
  if (!T.on) return; const st = step(); if (!st.target) return;
  const el = document.querySelector('[data-tour="' + st.target + '"]'); if (!el) return;
  el.classList.add('tour-hl');
  if (T.scroll) { T.scroll = false; try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { } }
};
})();
