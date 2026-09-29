/* Reports hub + fee collection, exam analysis, coursework and admissions reports. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, P = SP.pages;
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const back = SP.btn('All reports', 'nav', { i: 'left', c: 'sm', d: { r: 'reports' } });

// log every export so the hub can show "recent exports"
const _csv = SP.csv;
SP.csv = function (name, head, rows) { const ex = SP.S.exports; ex.unshift({ name, ts: SP.stamp(), rows: rows.length }); if (ex.length > 6) ex.length = 6; return _csv(name, head, rows); };

/* =============================== HUB =============================== */
function metrics() {
  const st = SP.stats(), sep = SP.monthVouchers('2026-09'), b = sep.reduce((a, x) => a + x.v.total, 0), c = sep.reduce((a, x) => a + (x.v.paid ? x.v.total : 0), 0);
  const e1 = SP.exam('E1'), cards = SP.STUDENTS.map(s => SP.examCard(e1, s)), asg = SP.allAssign().filter(a => SP.assignState(a) !== 'closed').map(a => SP.assignStats(a));
  return { att: pct(st.present, st.present + st.absent + st.leave) + '% present today', staff: st.staffIn + '/' + st.staffTotal + ' staff in', gate: st.present + ' check-ins today', fees: pct(c, b) + '% of September collected', settle: SP.pkr(c) + ' this month', exam: pct(cards.reduce((n, x) => n + x.pct, 0), cards.length * 100) + '% school average', work: pct(asg.reduce((n, s) => n + s.sub, 0), asg.reduce((n, s) => n + s.n, 0)) + '% submission rate', adm: SP.S.applicants.length + ' applications', circ: SP.S.circ.length + ' notices · ' + SP.S.forms.length + ' forms', comms: SP.unreadAdmin() + ' unread' };
}
P['admin.reports'] = function () {
  const m = metrics(), S = SP.S;
  const grp = (title, items) => '<h3 class="sec">' + title + '</h3><div class="repgrid">' + items.map(r => '<button class="repcard" data-act="' + (r[4] || 'nav') + '" data-r="' + r[0] + '" ' + (r[5] ? 'data-tour="' + r[5] + '"' : '') + '><span class="ai brand">' + I(r[3]) + '</span><b>' + r[1] + '</b><span class="rdesc">' + r[2] + '</span><em>' + m[r[6]] + '</em></button>').join('') + '</div>';
  const sched = [['att', 'Daily attendance summary', 'Principal · every day 2:00 PM · WhatsApp'], ['fee', 'Weekly fee collection & defaulters', 'Principal, Accountant · Mondays 8:00 AM · PDF by email'], ['exam', 'Exam result analysis', 'Principal, Vice Principal · after results are published'], ['cons', 'Consent & circular tracker', 'Front desk · daily until the deadline']];
  return SP.head('Reports', 'Every report the school needs — view it, export it, or have it sent automatically', '') +
    grp('Attendance', [['r_att', 'Student attendance', 'Class-wise attendance, chronic absentees and trends.', 'list', 'nav', '', 'att'], ['r_staff', 'Staff attendance', 'Presence, lateness and leave for every teacher and staff member.', 'users', 'nav', '', 'staff'], ['r_gate', 'Check in / out', 'Gate logs with late arrivals and early pickups.', 'scan', 'nav', '', 'gate']]) +
    grp('Finance', [['r_fees', 'Fee collection & defaulters', 'Month-wise collection, ageing of dues and top outstanding families.', 'cash', 'nav', 'rep-fees', 'fees'], ['r_settle', 'Settlement', 'Every payment channel, gateway charges and net settlement.', 'wallet', 'nav', '', 'settle'], ['accounting', 'Accounting reports', 'Ledgers, trial balance and statutory statements in ERPNext.', 'doc', 'nav', '', 'settle']]) +
    grp('Academics', [['r_exam', 'Exam results analysis', 'Subject averages, grade distribution, class comparison and at-risk students.', 'award', 'nav', 'rep-exam', 'exam'], ['r_work', 'Coursework & quizzes', 'Assignment submission rates, quiz scores and teacher activity.', 'pen', 'nav', '', 'work'], ['exams', 'Report cards', 'Generate and print report cards by class.', 'file', 'nav', '', 'exam']]) +
    grp('Admissions & communication', [['r_adm', 'Admissions funnel', 'Applications to enrolment, sources and time to decision.', 'userplus', 'nav', '', 'adm'], ['circulars', 'Circulars & consents', 'Read receipts, acknowledgements and signed permission slips.', 'board', 'nav', '', 'circ'], ['comms', 'Parent communication', 'Message volume, response times and leave requests.', 'chat', 'nav', '', 'comms']]) +
    '<div class="g2"><section class="card"><div class="card-h"><h3>Scheduled reports</h3></div><div class="card-b" style="padding-top:6px">' + sched.map(x => '<div class="vrow"><div><b>' + x[1] + '</b><span>' + x[2] + '</span></div><div></div><div><button class="switch ' + (S.sched[x[0]] ? 'on' : '') + '" data-act="schedToggle" data-k="' + x[0] + '" aria-label="Toggle"><i></i></button></div></div>').join('') + '</div></section>' +
    '<section class="card"><div class="card-h"><h3>Recent exports</h3></div><div class="card-b" style="padding-top:6px">' + (S.exports.length ? S.exports.map(x => '<div class="vrow"><div><b>' + esc(x.name) + '</b><span>' + D.niceTs(x.ts) + ' · ' + x.rows + ' rows</span></div><div></div><div>' + I('check') + '</div></div>').join('') : SP.empty('No exports yet', 'Use any “Export CSV” button and it appears here.')) + '</div></section></div>';
};
SP.act.schedToggle = d => { SP.S.sched[d.k] = !SP.S.sched[d.k]; SP.toast('Scheduled report ' + (SP.S.sched[d.k] ? 'turned on' : 'turned off')); SP.render(); };

/* =============================== FEE COLLECTION =============================== */
P['admin.r_fees'] = function () {
  const months = ['2026-07', '2026-08', '2026-09'], rows = months.map(m => { const v = SP.monthVouchers(m), b = v.reduce((a, x) => a + x.v.total, 0), c = v.reduce((a, x) => a + (x.v.paid ? x.v.total : 0), 0); return { m, b, c, p: pct(c, b) }; });
  const tb = rows.reduce((a, r) => a + r.b, 0), tc = rows.reduce((a, r) => a + r.c, 0);
  const fam = {}; SP.STUDENTS.forEach(s => { const o = SP.owed(s.id); if (!o) return; const f = fam[s.parentId] = fam[s.parentId] || { id: s.parentId, p: SP.parent(s.parentId), kids: [], owed: 0, over: 0 }; f.kids.push(s); f.owed += o; f.over = Math.max(f.over, SP.overdueN(s.id)); });
  const fl = Object.keys(fam).map(k => fam[k]), bucket = n => fl.filter(f => (n === 3 ? f.over >= 3 : f.over === n)).reduce((a, f) => a + f.owed, 0);
  const byGrade = [1, 2, 3, 4, 5, 6, 7, 8].map(g => { const v = SP.monthVouchers('2026-09').filter(x => x.s.grade === g), b = v.reduce((a, x) => a + x.v.total, 0), c = v.reduce((a, x) => a + (x.v.paid ? x.v.total : 0), 0); return { g, b, c, id: 'g' + g }; });
  return SP.head('Fee collection & defaulters', 'July – September 2026', back + SP.btn('Export CSV', 'rfCsv', { i: 'dl', c: 'sm' }) + SP.btn('Print', 'print', { i: 'print', c: 'sm' })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Billed (3 months)', value: SP.pkr(tb) }) + SP.tile({ label: 'Collected', value: SP.pkr(tc), sub: pct(tc, tb) + '% collection rate' }) + SP.tile({ label: 'Outstanding', value: SP.pkr(tb - tc), tone: 'amber' }) + SP.tile({ label: 'Defaulting families', value: fl.filter(f => f.over > 0).length, tone: 'red', sub: 'At least 1 month overdue' }) + '</div>' +
    '<div class="g2">' + SP.card('Collection rate by month', SP.cols(rows.map(r => r.p), rows.map(r => D.monthLabel(r.m).slice(0, 3)), { min: 0, max: 100, h: 200, fmt: v => Math.round(v) + '%', hl: 2 })) + SP.card('Ageing of outstanding dues', SP.hbars([{ label: '1 month', value: bucket(1), color: '#ff9f0a' }, { label: '2 months', value: bucket(2), color: '#ff6b35' }, { label: '3+ months', value: bucket(3), color: 'var(--red)' }], { fmt: v => 'Rs ' + Math.round(v / 1000) + 'k' })) + '</div>' +
    '<h3 class="sec">September by grade</h3>' + SP.table('rfg', [{ h: 'Grade', f: r => '<b>Grade ' + r.g + '</b>' }, { h: 'Billed', cls: 'mono', f: r => SP.pkr(r.b) }, { h: 'Collected', cls: 'mono', f: r => SP.pkr(r.c) }, { h: 'Rate', f: r => '<div class="qbar in"><i style="width:' + pct(r.c, r.b) + '%;background:var(--green)"></i></div> ' + pct(r.c, r.b) + '%' }, { h: 'Outstanding', cls: 'mono', f: r => SP.pkr(r.b - r.c) }], byGrade, { per: 8 }) +
    '<h3 class="sec">Top outstanding families</h3>' + SP.table('rft', [{ h: 'Family', f: f => SP.person(f.p.name, f.kids.map(k => esc(k.first)).join(' & ')) }, { h: 'Phone', cls: 'mono', f: f => esc(f.p.phone) }, { h: 'Overdue', f: f => f.over ? SP.pill(f.over + ' month' + (f.over > 1 ? 's' : ''), 'red') : SP.pill('Due', 'amber') }, { h: 'Outstanding', cls: 'mono', f: f => '<b class="neg">' + SP.pkr(f.owed) + '</b>' }, { h: '', cls: 'r', f: f => SP.btn('Message', 'msgStudent', { c: 'sm', d: { id: f.kids[0].id } }) }], fl.sort((a, b) => b.owed - a.owed), { per: 8 });
};
SP.act.rfCsv = () => { const rows = []; SP.STUDENTS.forEach(s => { const o = SP.owed(s.id); if (o) rows.push([s.name, SP.cls(s.classId).label, SP.parent(s.parentId).name, SP.parent(s.parentId).phone, SP.overdueN(s.id), o]); }); SP.csv('fee-defaulters.csv', ['Student', 'Class', 'Parent', 'Phone', 'Months overdue', 'Outstanding'], rows); };

/* =============================== EXAM ANALYSIS =============================== */
P['admin.r_exam'] = function () {
  const exs = SP.S.exams.filter(e => e.status !== 'upcoming'), id = SP.f('re_e', 'E1'), ex = SP.exam(id), cards = SP.STUDENTS.map(s => ({ s, id: s.id, c: SP.examCard(ex, s) }));
  const avg = pct(cards.reduce((n, x) => n + x.c.pct, 0), cards.length * 100), pass = pct(cards.filter(x => x.c.pct >= 40).length, cards.length), top = pct(cards.filter(x => x.c.pct >= 80).length, cards.length);
  const subj = SP.SUBJECTS.map(sb => { const v = SP.STUDENTS.map(s => SP.markOf(ex, s, sb)).filter(x => x != null); return { label: sb, value: v.length ? pct(v.reduce((a, b) => a + b, 0), v.length * ex.total) : 0 }; });
  const dist = ['A1', 'A', 'B', 'C', 'D', 'E', 'F'].map(g => ({ label: 'Grade ' + g, value: cards.filter(x => x.c.grade[0] === g).length, color: g === 'F' ? 'var(--red)' : g === 'E' || g === 'D' ? '#ff9f0a' : 'var(--green)' }));
  const byClass = SP.CLASSES.map(c => { const v = cards.filter(x => x.s.classId === c.id); return { c, p: pct(v.reduce((n, x) => n + x.c.pct, 0), v.length * 100) }; });
  const risk = cards.filter(x => x.c.pct < 50).sort((a, b) => a.c.pct - b.c.pct);
  return SP.head('Exam results analysis', esc(ex.name) + ' · ' + esc(ex.period), back + SP.select('re_e', exs.map(e => [e.id, e.name]), id) + SP.btn('Print', 'print', { i: 'print', c: 'sm' })) +
    (ex.status === 'marking' ? '<div class="note">' + I('alert') + '<span>Marking is still in progress, so figures are provisional.</span></div>' : '') +
    '<div class="tiles6 t4">' + SP.tile({ label: 'School average', value: avg + '%' }) + SP.tile({ label: 'Pass rate', value: pass + '%', sub: '40% and above' }) + SP.tile({ label: 'Scored 80%+', value: top + '%', sub: 'Grade A and above' }) + SP.tile({ label: 'At risk', value: risk.length, tone: risk.length ? 'amber' : '', sub: 'Below 50%' }) + '</div>' +
    '<div class="g2">' + SP.card('Average by subject', SP.hbars(subj, { max: 100, fmt: v => v + '%' })) + SP.card('Grade distribution', SP.hbars(dist)) + '</div>' +
    SP.card('Class comparison', SP.cols(byClass.map(x => x.p), byClass.map(x => x.c.short), { min: 40, max: 100, h: 220, fmt: v => Math.round(v) + '%' })) +
    '<h3 class="sec">Students who need support</h3>' + SP.table('rer', [{ h: 'Student', f: x => SP.person(x.s.name, x.s.admNo, 'sm') }, { h: 'Class', f: x => SP.cls(x.s.classId).label }, { h: 'Score', f: x => '<b class="neg">' + x.c.pct + '%</b>' }, { h: 'Weakest subject', f: x => { const w = x.c.rows.filter(r => r.m != null).sort((a, b) => a.m - b.m)[0]; return w ? esc(w.sub) : '—'; } }, { h: 'Parent', f: x => esc(SP.parent(x.s.parentId).name) }], risk, { per: 6, row: 'openStudent', empty: 'Nobody is below 50%' });
};

/* =============================== COURSEWORK =============================== */
P['admin.r_work'] = function () {
  const all = SP.allAssign(), act = all.filter(a => SP.assignState(a) !== 'closed'), stats = all.map(a => ({ a, s: SP.assignStats(a) })), qs = SP.allQuizzes().filter(q => q.status !== 'draft');
  const rate = pct(stats.reduce((n, x) => n + x.s.sub, 0), stats.reduce((n, x) => n + x.s.n, 0)), gradedAvg = pct(stats.filter(x => x.s.graded).reduce((n, x) => n + x.s.avg, 0), stats.filter(x => x.s.graded).length * 100);
  const qa = qs.map(q => SP.quizStats(q)).filter(s => s.done), qavg = qa.length ? Math.round(qa.reduce((n, s) => n + s.avg, 0) / qa.length) : 0;
  const bySub = SP.SUBJECTS.map(sb => { const x = stats.filter(y => y.a.subject === sb); return { label: sb, value: pct(x.reduce((n, y) => n + y.s.sub, 0), x.reduce((n, y) => n + y.s.n, 0)) }; });
  const byT = SP.TEACHERS.map(t => ({ id: t.id, t, as: all.filter(a => a.teacherId === t.id).length, nt: SP.allNotes().filter(n => n.teacherId === t.id).length, qz: SP.allQuizzes().filter(q => (q.teacherId || SP.ALLOC[q.classId][q.subject]) === t.id).length })).sort((a, b) => (b.as + b.nt + b.qz) - (a.as + a.nt + a.qz));
  return SP.head('Coursework & quizzes', 'How much students are engaging with online work', back + SP.btn('Print', 'print', { i: 'print', c: 'sm' })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Active assignments', value: act.length }) + SP.tile({ label: 'Submission rate', value: rate + '%', sub: 'All assignments' }) + SP.tile({ label: 'Avg. graded mark', value: gradedAvg + '%' }) + SP.tile({ label: 'Quiz average', value: qavg + '%', sub: qs.length + ' quizzes' }) + '</div>' +
    '<div class="g2">' + SP.card('Submission rate by subject', SP.hbars(bySub, { max: 100, fmt: v => v + '%' })) + SP.card('Notes uploaded by subject', SP.hbars(SP.SUBJECTS.map(sb => ({ label: sb, value: SP.allNotes().filter(n => n.subject === sb).length })), { color: '#af52de' })) + '</div>' +
    '<h3 class="sec">Teacher activity</h3>' + SP.table('rwt', [{ h: 'Teacher', f: x => SP.person(x.t.name, x.t.title, 'sm') }, { h: 'Assignments', f: x => x.as }, { h: 'Quizzes', f: x => x.qz }, { h: 'Notes', f: x => x.nt }, { h: 'Activity', f: x => '<div class="qbar in"><i style="width:' + Math.min(100, (x.as + x.nt + x.qz) * 6) + '%"></i></div>' }], byT, { per: 8, row: 'staffOpen' });
};

/* =============================== ADMISSIONS FUNNEL =============================== */
P['admin.r_adm'] = function () {
  const A = SP.S.applicants, n = k => A.filter(a => a.stage === k).length, adm = n('admitted'), tot = A.length;
  const reached = { Applied: tot, Reviewed: tot - n('new') - n('rejected'), Interviewed: n('interview') + n('accepted') + n('admitted'), Accepted: n('accepted') + n('admitted'), Admitted: adm };
  const src = {}; A.forEach(a => { src[a.source] = (src[a.source] || 0) + 1; });
  const byG = [1, 2, 3, 4, 5, 6, 7, 8].map(g => ({ g, id: 'g' + g, n: A.filter(a => a.grade === g).length, adm: A.filter(a => a.grade === g && a.stage === 'admitted').length, seats: SP.CLASSES.filter(c => c.grade === g).length * 25 - SP.STUDENTS.filter(s => s.grade === g).length }));
  const fee = A.filter(a => a.stage === 'accepted');
  return SP.head('Admissions funnel', '2026–27 session', back + SP.btn('Print', 'print', { i: 'print', c: 'sm' })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Applications', value: tot }) + SP.tile({ label: 'Admitted', value: adm, sub: pct(adm, tot) + '% conversion' }) + SP.tile({ label: 'Awaiting fee', value: fee.filter(a => !SP.admFeeReady(a)).length, tone: 'amber', sub: 'Accepted, unpaid' }) + SP.tile({ label: 'Avg. time to decision', value: '6.4 days' }) + '</div>' +
    '<div class="g2">' + SP.card('Funnel', SP.hbars(Object.keys(reached).map(k => ({ label: k, value: reached[k] })))) + SP.card('Where applicants come from', SP.hbars(Object.keys(src).map(k => ({ label: k, value: src[k], color: '#af52de' })))) + '</div>' +
    '<h3 class="sec">By grade</h3>' + SP.table('rag', [{ h: 'Grade', f: r => '<b>Grade ' + r.g + '</b>' }, { h: 'Applications', f: r => r.n }, { h: 'Admitted', f: r => r.adm }, { h: 'Seats left', f: r => r.seats > 0 ? SP.pill(r.seats + ' seats', r.seats < 8 ? 'amber' : 'green') : SP.pill('Full', 'red') }], byG, { per: 8 });
};
})();
