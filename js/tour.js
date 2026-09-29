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
const SUBJ = 'Science';
const tch = () => SP.ALLOC[kid().classId][SUBJ];
const tSet = () => { SP.S.teacherId = tch(); };
const asg = () => SP.S.assign[0], qzn = () => SP.S.qz[0], circ0 = () => SP.S.circ[0], form0 = () => SP.S.forms[0], ev0 = () => SP.S.events[0];
const ph = (tab, sub, seg) => () => { SP.ui.phone = { tab, sub: sub || null, stack: [] }; if (seg) SP.ui.f[tab === 'learn' ? 'ph_learn' : tab === 'inbox' ? 'ph_inbox' : 'ph_res'] = seg; };
const openApp = tab => () => { SP.act.admOpen({ id: app0().id }); SP.ui.f.adm_tab = tab || 'overview'; SP.render(); };
// the first class-subject that still needs Unit Test 2 marks
const pendPair = () => SP.pairsAll().find(p => !SP.entered(SP.exam('E2'), p.classId, p.subject)) || { classId: kid().classId, subject: SUBJ };
const mkKey = () => { const p = pendPair(); return { key: 'E2|' + p.classId + '|' + p.subject, c: p.classId, s: p.subject }; };
const mkSet = () => { const p = pendPair(); Object.assign(SP.ui.f, { ex_id: 'E2', ex_tab: 'marks', mk_c: p.classId, mk_s: p.subject }); };

const FLOWS = [
  { group: 'Core', title: 'Admissions: application to enrolment', icon: 'userplus', mins: 3, desc: 'Documents, interview, assessment, acceptance, admission fee, then enrol — the student can only be admitted once the fee is paid.', steps: [
    { persona: 'admin', route: 'admissions', target: 'adm-sim', text: 'Applications from the school website land in <b>Admissions</b>. Let\'s simulate a parent applying online.', act: ['Simulate application', () => SP.act.admSimulate()] },
    { persona: 'admin', route: 'admissions', target: 'adm-row', text: 'The new application is at the top. Open the <b>admission file</b> to see everything in one place.', act: ['Open admission file', () => SP.act.admOpen({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp('docs'), target: 'adm-docs', text: 'Required documents must be received before an application can be reviewed. Staff tick them off as they arrive.', act: ['Mark all received', () => SP.act.admDocsAll({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp(), target: 'adm-review', text: 'With the documents in, the application is <b>reviewed</b>.', act: ['Mark reviewed', () => SP.act.admReview({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp(), target: 'adm-int', text: 'Pick an interview date. The parent is notified by SMS automatically.', act: ['Schedule interview', () => SP.act.admInterview({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp('assess'), target: 'adm-assess', text: 'Record the entrance test and interview rating. The applicant can\'t be accepted until this is done.', act: ['Save assessment', () => SP.act.admAssess({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp('assess'), target: 'adm-accept', text: 'The principal accepts the applicant.', act: ['Accept applicant', () => SP.act.admAccept({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp('fee'), target: 'adm-voucher', text: 'The <b>admission fee voucher</b> goes to the parent on WhatsApp and SMS.', act: ['Issue voucher', () => SP.act.admVoucher({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp('fee'), target: 'adm-admit', text: 'Notice <b>Admit student</b> is locked. The seat is held, but enrolment waits for the fee.', act: ['Try to admit', () => SP.act.admAdmit({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp('fee'), target: 'adm-payonline', text: 'The parent pays online (or the office records cash). The status flips to <b>Paid</b> instantly.', act: ['Parent pays online', () => SP.act.admPayOnline({ id: app0().id })] },
    { persona: 'admin', route: 'admissions', setup: openApp('fee'), target: 'adm-admit', text: 'Now the student can be admitted. Pick a section and confirm — the student record, fee history and parent app are created.', act: ['Admit student', () => SP.act.admAdmit({ id: app0().id })] },
    { persona: 'admin', route: 'students', f: { st_q: '' }, target: 'stu-row', text: 'The student is now in the school database, with a fee record and attendance ready to go.', setup: () => { SP.ui.f.st_q = app0().name; SP.ui.page.students = 0; } }
  ] },
  { group: 'Core', title: 'Fee vouchers: generate, send, pay online', icon: 'cash', mins: 3, desc: 'Generate a month of vouchers for the whole school, send to parents, watch a parent pay online and see it reconcile.', steps: [
    { persona: 'admin', route: 'fees', target: 'gen-btn', text: 'Fee vouchers for the <b>whole school</b> are generated in one click. Tuition and transport heads are applied per student automatically.', act: ['Open generator', () => SP.act.genModal()] },
    { persona: 'admin', route: 'fees', target: 'gen-go', setup: () => SP.act.genModal(), text: 'Review the totals, then generate.', act: ['Generate vouchers', () => SP.act.genGo({ m: SP.nextMonth() })] },
    { persona: 'admin', route: 'fees', target: 'fee-send', text: 'Vouchers stay in <b>Draft</b> until you are ready. Sending delivers them through the parent app and WhatsApp.', act: ['Send to parents', () => SP.act.feeSend()] },
    { persona: 'admin', route: 'fees', phone: { tab: 'fees', sub: null }, target: 'ph-tab-fees', text: 'On the parent\'s phone (right), a <b>push notification</b> arrives and the new voucher is waiting under Fees.' },
    { persona: 'admin', route: 'fees', target: 'ph-pay', setup: () => { SP.ui.phone = { tab: 'fees', sub: 'voucher:' + octV().id, stack: ['x'] }; }, text: 'The parent opens the voucher and taps <b>Pay online</b>.', act: ['Tap Pay', () => SP.act.phPayStart({ v: octV().id })] },
    { persona: 'admin', route: 'fees', target: 'ph-confirm', setup: () => { SP.ui.phone = { tab: 'fees', sub: 'pay:' + octV().id, stack: [] }; SP.ui.pay = { vid: octV().id, method: 'jazzcash', step: 'pick' }; }, text: 'They choose JazzCash, Easypaisa, card or bank app, and confirm. <i>(Simulated — no money moves.)</i>', act: ['Pay now', () => SP.act.phPayGo()] },
    { persona: 'admin', route: 'r_settle', phone: { tab: 'fees', sub: null }, target: null, text: 'The payment is live in the office. The voucher shows <b>Paid</b> and the <b>Settlement report</b> breaks collections down by channel, with gateway charges and net settlement.' }
  ] },
  { group: 'Core', title: 'Live attendance, gate pass & diary', icon: 'check', mins: 3, desc: 'A teacher marks attendance, the parent\'s live tracker updates, the front desk signs the student out early, and the parent signs the daily diary.', steps: [
    { persona: 'teacher', route: 'attendance', setup: () => { SP.S.teacherId = SP.cls(kid().classId).teacherId; SP.ui.f.attClass = kid().classId; }, target: 'att-submit', text: 'The class teacher marks attendance and submits once. Absent students\' parents are alerted; everyone else is recorded as present.', act: ['Mark present & submit', () => { SP.render(); SP.act.attSet({ s: SP.S.childId, v: 'P' }); SP.act.attSubmit(); }] },
    { persona: 'teacher', route: 'attendance', phone: { tab: 'home', sub: null }, target: 'ph-att', text: 'On the parent\'s phone the <b>live tracker</b> moves on its own: reached the gate → marked present by the teacher → in school.' },
    { persona: 'staff', route: 'desk', setup: () => { SP.ui.f.gp_c = kid().classId; SP.ui.f.gp_s = SP.S.childId; }, target: 'gp-issue', text: 'At the <b>front desk</b>, an early pickup: issue a gate pass and the student is signed out.', act: ['Issue gate pass', () => SP.act.gpIssue({ sid: SP.S.childId })] },
    { persona: 'staff', route: 'desk', phone: { tab: 'home', sub: null }, target: 'ph-att', text: 'The parent gets an instant push and the tracker shows <b>Left school</b>, with the time and who collected.' },
    { persona: 'teacher', route: 'diary', dock: 'parent', setup: () => { SP.S.teacherId = SP.cls(kid().classId).teacherId; SP.ui.f.dy_c = kid().classId; ph('learn', null, 'diary')(); }, target: 'ph-sign', text: 'Pakistani schools sign the diary daily. Now parents do it in the app — one tap, timestamped.', act: ['Parent signs the diary', () => SP.act.phSign({ day: SP.TODAY })] }
  ] },
  { group: 'Core', title: 'Parent communication & leave requests', icon: 'chat', mins: 2, desc: 'A parent sends a leave request from the app; the office approves it and the parent is notified.', steps: [
    { persona: 'admin', route: 'comms', phone: { tab: 'chat', sub: null }, target: 'ph-newmsg', text: 'Parents message the school from the app, no more phone calls or WhatsApp groups.', act: ['New leave request', () => { SP.ui.nm = { type: 'Leave request' }; SP.act.phSub({ s: 'new' }); }] },
    { persona: 'admin', route: 'comms', phone: { tab: 'chat', sub: 'new' }, target: 'ph-nm-send', text: 'Pick the date, write a note, send.', act: ['Send request', () => SP.act.phNmSend()] },
    { persona: 'admin', route: 'comms', target: 'thread-0', text: 'It lands in the office <b>Communications</b> inbox as an unread leave request.', act: ['Open conversation', () => SP.act.openThread({ id: topThread().id })] },
    { persona: 'admin', route: 'comms', target: 'leave-approve', setup: () => { SP.act.openThread({ id: topThread().id }); }, text: 'One tap approves the leave. The parent is told automatically, and if it is for today the attendance is marked <b>Leave</b>.', act: ['Approve leave', () => SP.act.leaveDecide({ id: topThread().id, v: 'approved' })] },
    { persona: 'admin', route: 'comms', setup: () => { SP.ui.phone = { tab: 'chat', sub: 'thread:' + topThread().id, stack: [] }; }, target: 'ph-send', text: 'On the phone: the approval arrives as a push and appears in the chat thread.' }
  ] },
  { group: 'Core', title: 'Announcements to parents', icon: 'mega', mins: 1, desc: 'Broadcast a notice by app push, WhatsApp and SMS to all parents or a single class.', steps: [
    { persona: 'admin', route: 'announce', target: 'an-send', text: 'Choose the audience, write the message, pick the channels. Delivery and read counts are tracked below.', act: ['Send sample announcement', () => { SP.act.anSample(); SP.act.anSend(); }] },
    { persona: 'admin', route: 'announce', phone: { tab: 'inbox', sub: null }, setup: () => { SP.ui.f.ph_inbox = 'alerts'; }, target: 'ph-tab-inbox', text: 'Parents get the push instantly, and it stays in their Inbox.' }
  ] },
  { group: 'Learning', title: 'Assignments: post, submit, grade', icon: 'pen', mins: 3, desc: 'A teacher posts an assignment, the student submits a photo from their phone, the teacher grades it and both student and parent are told.', steps: [
    { persona: 'teacher', route: 'assign', dock: 'student', setup: () => { tSet(); Object.assign(SP.ui.f, { as_st: 'active', as_c: '', as_s: '' }); }, target: 'as-new', text: 'Teachers see only their own classes. Post an assignment with instructions, marks, due date and an optional worksheet.', act: ['New assignment', () => { SP.ui.f.na_c = kid().classId; SP.ui.f.na_s = SUBJ; SP.act.newAssign(); }] },
    { persona: 'teacher', route: 'assign', dock: 'student', setup: () => { tSet(); SP.ui.f.na_c = kid().classId; SP.ui.f.na_s = SUBJ; SP.act.newAssign(); }, target: 'as-post', text: 'One tap posts it to the whole class. Students and parents are notified, and it appears in the daily diary.', act: ['Post assignment', () => SP.act.assignCreate()] },
    { persona: 'teacher', route: 'assign', dock: 'student', setup: () => { const a = asg(); ph('learn', a ? 'assign:' + a.id : null, 'assign')(); SP.ui.sd = { text: '', file: null, aid: null }; }, target: 'ph-submit', text: 'On the <b>student\'s own phone</b> it arrives with a push. They write an answer or attach a photo of their notebook, then submit.', act: ['Submit from the phone', () => { const a = asg(); if (!a) return; SP.ui.sd = { text: 'Plants make food using sunlight, water and carbon dioxide.', file: 'IMG_4218.jpg', aid: a.id }; SP.act.phSubmit({ id: a.id }); }] },
    { persona: 'teacher', route: 'assign', dock: 'student', setup: () => { tSet(); const a = asg(); if (a) SP.act.assignOpen({ id: a.id }); }, target: 'as-grade', text: 'Back with the teacher: the submission shows up instantly, with late and missing students flagged.', act: ['Open the submission', () => { const a = asg(); if (a) SP.act.gradeOpen({ aid: a.id, sid: SP.S.childId }); }] },
    { persona: 'teacher', route: 'assign', dock: 'student', setup: () => { tSet(); const a = asg(); if (a) SP.act.gradeOpen({ aid: a.id, sid: SP.S.childId }); }, target: 'as-save', text: 'Give marks and feedback. Quick-feedback chips make grading fast.', act: ['Save & notify parent', () => { const a = asg(); if (!a) return; const f = document.getElementById('gr-f'); if (f) f.value = 'Well explained — neat diagram too!'; SP.act.grSave({ aid: a.id, sid: SP.S.childId }); }] },
    { persona: 'teacher', route: 'assign', dock: 'student', setup: () => { const a = asg(); ph('learn', a ? 'assign:' + a.id : null, 'assign')(); }, target: null, text: 'The student sees the score and feedback straight away — and the parent gets the same alert on their phone.' }
  ] },
  { group: 'Learning', title: 'Quizzes: build, take, results', icon: 'help', mins: 3, desc: 'Build a self-marking quiz from the question bank, publish it, watch a student take it against the clock, and see the results.', steps: [
    { persona: 'teacher', route: 'quizzes', dock: 'student', setup: () => { tSet(); SP.ui.f.qz_s = ''; }, target: 'qz-new', text: 'Quizzes mark themselves. Start a new one for your class.', act: ['New quiz', () => { SP.act.newQuiz(); SP.ui.qb.classId = kid().classId; SP.ui.qb.subject = SUBJ; SP.render(); }] },
    { persona: 'teacher', route: 'quizzes', dock: 'student', setup: () => { tSet(); SP.act.newQuiz(); SP.ui.qb.classId = kid().classId; SP.ui.qb.subject = SUBJ; SP.render(); }, target: 'qb-suggest', text: 'Type your own questions, or pull five from the <b>question bank</b> and edit them.', act: ['Suggest 5 questions', () => SP.act.qbSuggest()] },
    { persona: 'teacher', route: 'quizzes', dock: 'student', setup: () => { tSet(); SP.act.newQuiz(); SP.ui.qb.classId = kid().classId; SP.ui.qb.subject = SUBJ; SP.act.qbSuggest(); }, target: 'qb-publish', text: 'Set the time limit and closing date, then publish. Students and parents are notified.', act: ['Publish to students', () => SP.act.qbSave({ pub: '1' })] },
    { persona: 'teacher', route: 'quizzes', dock: 'student', setup: () => { ph('learn', null, 'quiz')(); }, target: 'ph-quiz', text: 'The quiz appears on the student\'s phone under <b>Learn → Quizzes</b>.', act: ['Open the quiz', () => { const q = qzn(); if (q) SP.act.phSub({ s: 'quiz:' + q.id }); }] },
    { persona: 'teacher', route: 'quizzes', dock: 'student', setup: () => { const q = qzn(); ph('learn', q ? 'quiz:' + q.id : null, 'quiz')(); }, target: 'ph-qstart', text: 'One attempt, timed. The rules are clear before they begin.', act: ['Start quiz', () => { const q = qzn(); if (q) SP.act.qzStart({ id: q.id }); }] },
    { persona: 'teacher', route: 'quizzes', dock: 'student', setup: () => { const q = qzn(); if (q && !SP.ui.qt) SP.act.qzStart({ id: q.id }); if (SP.ui.qt) SP.ui.qt.i = SP.ui.qt.ans.length - 1; }, target: 'ph-qsubmit', text: 'One question at a time with a countdown and a question palette. Submitting marks it instantly.', act: ['Answer & submit', () => { const u = SP.ui.qt; if (!u) return; const q = SP.quiz(u.id); u.ans = q.qs.map((x, i) => i < q.qs.length - 1 ? x.a : (x.a + 1) % 4); SP.act.qzSubmit(); }] },
    { persona: 'teacher', route: 'quizzes', dock: 'student', setup: () => { tSet(); const q = qzn(); if (q) SP.act.qzOpen({ id: q.id }); }, target: 'qz-sim', text: 'The teacher\'s results update live: attempts, average, and question-by-question analysis. (Simulate the rest of the class.)', act: ['Simulate class attempts', () => { const q = qzn(); if (q) SP.act.qzSim({ id: q.id }); }] }
  ] },
  { group: 'Learning', title: 'Exams: marks to report card', icon: 'award', mins: 3, desc: 'Teachers enter marks per subject, the principal publishes, and parents and students get the report card with grade and class position.', steps: [
    { persona: 'admin', route: 'exams', f: { ex_id: 'E2', ex_tab: 'marks' }, target: 'ex-e2', text: 'Unit Test 2 is being marked. The card shows how many class-subjects are complete — publishing unlocks only when all are done.' },
    { persona: 'admin', route: 'exams', setup: mkSet, target: 'mk-auto', text: 'Each teacher enters marks for their subject. Grades show as you type. (Auto-fill for the demo.)', act: ['Auto-fill demo marks', () => SP.act.mkAuto(mkKey())] },
    { persona: 'admin', route: 'exams', setup: () => { mkSet(); SP.act.mkAuto(mkKey()); }, target: 'mk-save', text: 'Save, and the progress bar moves.', act: ['Save marks', () => SP.act.mkSave(mkKey())] },
    { persona: 'admin', route: 'exams', f: { ex_id: 'E2', ex_tab: 'marks' }, target: 'ex-fill', text: 'To save time in the demo, complete all remaining marks at once.', act: ['Fill remaining marks', () => SP.act.exFill({ id: 'E2' })] },
    { persona: 'admin', route: 'exams', f: { ex_id: 'E2', ex_tab: 'results' }, target: 'ex-publish', text: 'Everything is marked. Review the results and publish.', act: ['Publish results', () => SP.act.exPublishModal({ id: 'E2' })] },
    { persona: 'admin', route: 'exams', f: { ex_id: 'E2', ex_tab: 'results' }, setup: () => SP.act.exPublishModal({ id: 'E2' }), target: 'ex-go', text: 'The summary shows average and pass rate before anything goes out.', act: ['Publish now', () => SP.act.exPublish({ id: 'E2' })] },
    { persona: 'admin', route: 'exams', dock: 'parent', setup: ph('home', 'rc:E2'), target: null, text: 'Every parent gets a push and a WhatsApp with the report card PDF. In the app: overall score, grade, class position, subject-wise bars and the teacher\'s remarks.' }
  ] },
  { group: 'School life', title: 'Circulars & consent forms', icon: 'board', mins: 3, desc: 'Send a circular with read receipts and acknowledgement, then a signed permission slip and track who has responded.', steps: [
    { persona: 'admin', route: 'circulars', f: { cc_tab: 'circ' }, target: 'cc-new', text: 'Circulars and invitations go to the whole school, a grade or one class, with an optional attachment.', act: ['New circular', () => SP.act.circNew({ k: 'circular' })] },
    { persona: 'admin', route: 'circulars', f: { cc_tab: 'circ' }, setup: () => SP.act.circNew({ k: 'circular' }), target: 'cc-send', text: '“Require acknowledgement” means you will know exactly who has read it.', act: ['Send circular', () => SP.act.circSave({ k: 'circular' })] },
    { persona: 'admin', route: 'circulars', dock: 'parent', setup: () => { const c = circ0(); ph('inbox', c ? 'notice:' + c.id : null, 'notices')(); }, target: 'ph-ack', text: 'The parent reads the notice and taps once to acknowledge.', act: ['Acknowledge', () => { const c = circ0(); if (c) SP.act.phAck({ id: c.id }); }] },
    { persona: 'admin', route: 'circulars', f: { cc_tab: 'circ' }, setup: () => { const c = circ0(); if (c) SP.act.circOpen({ id: c.id }); }, target: 'cc-remind', text: 'Live read and acknowledgement counts — remind everyone who hasn\'t responded in one tap.', act: ['Remind the rest', () => { const c = circ0(); if (c) SP.act.circRemind({ id: c.id }); }] },
    { persona: 'admin', route: 'circulars', f: { cc_tab: 'cons' }, target: 'cons-new', text: 'For trips, photos and sports, create a <b>consent form</b>. A fee can be added automatically for approved students.', act: ['New consent form', () => SP.act.consNew()] },
    { persona: 'admin', route: 'circulars', f: { cc_tab: 'cons' }, setup: () => SP.act.consNew(), target: 'cons-send', text: 'Send it to a grade or the whole school with a response deadline.', act: ['Send to parents', () => SP.act.consSave()] },
    { persona: 'admin', route: 'circulars', dock: 'parent', setup: () => { const f = form0(); ph('inbox', f ? 'consent:' + f.id + ':' + SP.S.childId : null, 'consents')(); SP.ui.cs = { agree: false }; }, target: 'ph-cons-sign', text: 'The parent reads the form, ticks the box and signs with their name.', act: ['Agree & sign', () => { const f = form0(); if (!f) return; SP.ui.cs.agree = true; SP.act.phSign2({ f: f.id, s: SP.S.childId, v: 'yes' }); }] },
    { persona: 'admin', route: 'circulars', f: { cc_tab: 'cons' }, setup: () => { const f = form0(); if (f) SP.act.consOpen({ id: f.id }); }, target: 'cons-remind', text: 'The tracker updates live: approved, declined and pending per student, with a reminder for the rest and an exportable signed list.' }
  ] },
  { group: 'School life', title: 'Events, calendar & RSVP', icon: 'cal', mins: 2, desc: 'Add a school event, parents and students see it in the calendar, and parents RSVP from the app.', steps: [
    { persona: 'admin', route: 'calendar', target: 'ev-new', text: 'One calendar for the whole school: exams, holidays, meetings, sports and trips.', act: ['Add event', () => SP.act.evNew()] },
    { persona: 'admin', route: 'calendar', setup: () => SP.act.evNew(), target: 'ev-save', text: 'Choose the audience and ask for RSVPs. Parents are notified instantly.', act: ['Add to calendar', () => SP.act.evSave()] },
    { persona: 'admin', route: 'calendar', dock: 'parent', setup: () => { const e = ev0(); ph('home', e ? 'event:' + e.id : null)(); }, target: 'ph-rsvp', text: 'The event appears in the parent\'s calendar with a push. One tap to RSVP.', act: ['RSVP: Going', () => { const e = ev0(); if (e) SP.act.phRsvp({ id: e.id, v: 'yes' }); }] },
    { persona: 'admin', route: 'calendar', dock: 'parent', setup: () => { const e = ev0(); if (e) SP.act.evOpen({ id: e.id }); }, target: null, text: 'The office sees who is coming, who declined and who hasn\'t replied — with a one-tap reminder.' }
  ] },
  { group: 'Core', title: 'Student ERP & reports', icon: 'chart', mins: 3, desc: 'One profile for family, fees, attendance and academics, plus a full reports section.', steps: [
    { persona: 'admin', route: 'students', f: { st_q: '' }, target: 'stu-row', text: 'Every student has a full <b>ERP profile</b> — including exam results, assignments and quizzes.', act: ['Open a profile', () => { const s = SP.STUDENTS.filter(x => SP.overdueN(x.id) > 0)[0] || SP.STUDENTS[0]; SP.act.openStudent({ id: s.id }); }] },
    { persona: 'admin', route: 'reports', target: 'rep-fees', text: 'The <b>Reports</b> hub: every report grouped, with scheduled delivery to the principal by WhatsApp or email.' },
    { persona: 'admin', route: 'r_fees', target: null, text: '<b>Fee collection & defaulters</b>: month-wise collection, ageing of dues and the families to call first.' },
    { persona: 'admin', route: 'r_exam', target: null, text: '<b>Exam analysis</b>: subject averages, grade distribution, class comparison and students at risk.' },
    { persona: 'admin', route: 'r_att', target: null, text: '<b>Student attendance</b> by class, with chronic absentees flagged for follow-up.' },
    { persona: 'admin', route: 'r_settle', target: null, text: '<b>Settlement</b>: every payment channel, gateway charges and net amounts for reconciliation.' }
  ] },
  { group: 'Core', title: 'Gate lock & fee defaulters', icon: 'lock', mins: 2, desc: 'Students with overdue fees are held at the gate; reminders and a live reader simulation.', steps: [
    { persona: 'admin', route: 'gate', target: 'gate-remind', text: 'Students whose fees are overdue beyond your rule are flagged automatically. Nudge all their parents in one tap.', act: ['Send reminders', () => SP.act.gateRemind()] },
    { persona: 'admin', route: 'gate', target: 'gate-scan', text: 'At the gate, a card scan checks the fee status. A student with dues is <b>held</b> and referred to accounts.', act: ['Scan a held student', () => SP.act.gateScan({ k: 'held' })] },
    { persona: 'admin', route: 'gate', target: 'gate-scan', text: 'A student with no dues walks straight in.', act: ['Scan a cleared student', () => SP.act.gateScan({ k: 'clear' })] }
  ] },
  { group: 'Platform', title: 'System status', icon: 'cloud', mins: 1, desc: 'Live health of every service behind the portal: messaging, payments, ERPNext sync, gate readers and backups.', steps: [
    { persona: 'admin', route: 'system', target: 'sys-check', text: 'A single screen shows the health of everything the school depends on. Run a live check across all services.', act: ['Run health check', () => SP.act.sysCheck()] },
    { persona: 'admin', route: 'system', target: 'sys-erp', text: 'The ERPNext connection, backups, gate readers and scheduled jobs are all visible — with one-tap sync.', act: ['Sync ERPNext now', () => SP.act.sysErp()] }
  ] },
  { group: 'Learning', title: 'Teacher: homework & notes', icon: 'book', mins: 2, desc: 'Post homework and upload lesson notes that parents and students see immediately.', steps: [
    { persona: 'teacher', route: 'diary', target: 'dy-post', setup: () => { SP.S.teacherId = SP.cls(kid().classId).teacherId; SP.ui.f.dy_c = kid().classId; }, text: 'Teachers post homework or class notes in seconds.', act: ['Post homework', () => SP.act.dyPost()] },
    { persona: 'teacher', route: 'diary', dock: 'parent', setup: ph('learn', null, 'diary'), target: 'ph-tab-learn', text: 'Parents are notified and see it in the <b>Diary</b>.' },
    { persona: 'teacher', route: 'notes', dock: 'student', setup: () => { tSet(); SP.ui.f.nt_tab = 'notes'; SP.ui.f.un_c = kid().classId; SP.ui.f.un_s = SUBJ; }, target: 'nt-up', text: 'Lesson <b>notes</b> — PDFs, slides, videos and links — are uploaded per subject.', act: ['Upload notes', () => SP.act.upNote()] },
    { persona: 'teacher', route: 'notes', dock: 'student', setup: () => { tSet(); SP.ui.f.un_c = kid().classId; SP.ui.f.un_s = SUBJ; SP.act.upNote(); }, target: 'nt-save', text: 'Choose the file and notify the class.', act: ['Upload', () => SP.act.noteSave()] },
    { persona: 'teacher', route: 'notes', dock: 'student', setup: ph('learn', null, 'notes'), target: 'ph-tab-learn', text: 'Students open them from <b>Learn → Notes</b> on their phone — new items are flagged.' }
  ] }
];

const flow = () => FLOWS[T.fi], step = () => flow().steps[T.si];
function apply(st) {
  const s = SP.S;
  SP.ui.modal = null; SP.ui.drawer = null;
  if (st.persona) s.persona = st.persona;
  const mobile = s.persona === 'parent' || s.persona === 'student';
  if (!mobile) s.split = true;
  s.dockRole = st.dock || 'parent';
  if (st.route) s.route[s.persona] = st.route;
  if (st.phone) SP.ui.phone = { tab: st.phone.tab, sub: st.phone.sub, stack: [] };
  if (st.f) Object.assign(SP.ui.f, st.f);
  if (st.setup) st.setup();
  T.scroll = true; SP.render();
}
const enter = () => apply(step());
SP.act.tourOpen = () => { T.list = true; T.on = false; SP.render(); };
SP.act.tourClose = () => { T.list = false; SP.render(); };
SP.act.tourStart = d => { T.fi = +d.i; T.si = 0; T.on = true; T.list = false; enter(); };
SP.act.tourExit = () => { T.on = false; T.list = false; SP.render(); };
SP.act.tourBack = () => { if (T.si > 0) { T.si--; enter(); } };
SP.act.tourNext = () => { if (T.si < flow().steps.length - 1) { T.si++; enter(); } else { T.on = false; SP.toast('Walkthrough complete'); SP.render(); } };
SP.act.tourAct = () => { const st = step(); st.act[1](); if (T.si < flow().steps.length - 1) { T.si++; const nx = step(); setTimeout(() => apply(nx), 350); } else { SP.render(); } };

T.html = function () {
  if (T.list) { let g = ''; return '<div class="backdrop" data-act="tourClose"><div class="modal tourlist"><div class="m-h"><h3>Guided demo</h3><button class="btn ghost icon" data-act="tourClose">' + I('x') + '</button></div><div class="m-b"><p class="muted" style="margin:0 0 4px">Pick a scenario. Each step highlights what to click, and can run it for you.</p>' +
    FLOWS.map((f, i) => { const h = f.group !== g ? '<h4 class="flow-g">' + (g = f.group) + '</h4>' : ''; return h + '<button class="flow" data-act="tourStart" data-i="' + i + '"><span class="fi">' + I(f.icon) + '</span><div><b>' + f.title + '</b><span>' + f.desc + '</span></div><i>' + f.mins + ' min</i></button>'; }).join('') + '</div></div></div>'; }
  if (!T.on) return '';
  const st = step(), f = flow(), n = f.steps.length;
  return '<div class="tour-card"><div class="tc-h"><span>' + I('wand') + f.title + '</span><button data-act="tourExit" title="Exit">' + I('x') + '</button></div><div class="tc-dots">' + f.steps.map((_, i) => '<i class="' + (i === T.si ? 'on' : i < T.si ? 'done' : '') + '"></i>').join('') + '</div>' +
    '<p>' + st.text + '</p><div class="tc-a"><button class="btn sm" data-act="tourBack"' + (T.si === 0 ? ' disabled' : '') + '>' + I('left') + '</button>' + (st.act ? '<button class="btn sm pri grow" data-act="tourAct">' + I('wand') + '<span>' + esc(st.act[0]) + '</span></button>' : '<span class="grow"></span>') + '<button class="btn sm" data-act="tourNext"><span>' + (T.si === n - 1 ? 'Finish' : 'Next') + '</span>' + I('right') + '</button></div></div>';
};
T.afterRender = function () {
  document.querySelectorAll('.tour-hl').forEach(e => e.classList.remove('tour-hl'));
  if (!T.on) return; const st = step(); if (!st.target) return;
  const el = document.querySelector('[data-tour="' + st.target + '"]'); if (!el) return;
  el.classList.add('tour-hl');
  if (T.scroll) { T.scroll = false; try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { } }
};
SP.tourFlows = FLOWS;
})();
