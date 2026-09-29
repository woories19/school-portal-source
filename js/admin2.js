/* Admin console — parents, students (ERP), academics, fees, reports; teacher console. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY, P = SP.pages;
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const SCHOOL = 'Greenfield Public School';

/* =============================== PARENTS =============================== */
P['admin.parents'] = function () {
  const q = SP.f('pa_q').toLowerCase(), fl = SP.f('pa_f');
  let list = SP.PARENTS.map(p => ({ p, kids: SP.kids(p.id) })).filter(x => x.kids.length);
  list.forEach(x => { x.owed = x.kids.reduce((a, k) => a + SP.owed(k.id), 0); x.id = x.p.id; });
  list = list.filter(x => (!q || (x.p.name + x.p.phone + x.kids.map(k => k.name).join(' ')).toLowerCase().indexOf(q) > -1) && (!fl || (fl === 'owing' ? x.owed > 0 : x.kids.length > 1)));
  return SP.head('Parents', SP.PARENTS.length + ' guardians on file · linked to ' + SP.STUDENTS.length + ' students', SP.btn('Export CSV', 'parentsCsv', { i: 'dl', c: 'sm' })) +
    '<div class="toolbar">' + SP.search('pa_q', 'Search parent, phone or child') + SP.select('pa_f', [['', 'All parents'], ['owing', 'With outstanding fees'], ['sib', 'Multiple children']], fl) + '</div>' +
    SP.table('parents', [
      { h: 'Parent', f: x => SP.person(x.p.name, x.p.rel) }, { h: 'Phone', cls: 'mono', f: x => esc(x.p.phone) + '<div class="s">' + esc(x.p.email) + '</div>' },
      { h: 'Children', f: x => x.kids.map(k => '<button class="chip-s" data-act="openStudent" data-id="' + k.id + '">' + esc(k.first) + ' · ' + SP.cls(k.classId).short + '</button>').join('') },
      { h: 'Outstanding', cls: 'mono', f: x => x.owed ? '<b class="neg">' + SP.pkr(x.owed) + '</b>' : SP.pill('Clear', 'green') },
      { h: '', cls: 'r', f: x => SP.btn('Message', 'msgStudent', { c: 'sm', d: { id: x.kids[0].id } }) }
    ], list, { per: 10 });
};
SP.act.parentsCsv = () => SP.csv('parents.csv', ['Parent', 'Relation', 'Phone', 'Email', 'Children', 'Outstanding'], SP.PARENTS.map(p => { const k = SP.kids(p.id); return [p.name, p.rel, p.phone, p.email, k.map(x => x.name + ' (' + SP.cls(x.classId).label + ')').join('; '), k.reduce((a, x) => a + SP.owed(x.id), 0)]; }));

/* =============================== STUDENTS + ERP =============================== */
function studentList() {
  const q = SP.f('st_q').toLowerCase(), c = SP.f('st_c'), f = SP.f('st_f');
  return SP.STUDENTS.filter(s => (!c || s.classId === c) && (!q || (s.name + s.admNo + SP.parent(s.parentId).name).toLowerCase().indexOf(q) > -1) &&
    (!f || (f === 'clear' && SP.owed(s.id) === 0) || (f === 'overdue' && SP.overdueN(s.id) > 0) || (f === 'hold' && SP.locked(s.id)))).sort((a, b) => a.grade - b.grade || a.classId.localeCompare(b.classId) || a.roll - b.roll);
}
P['admin.students'] = function () {
  const list = studentList();
  return SP.head('Students', SP.STUDENTS.length + ' enrolled · open a row for the full student ERP profile', SP.btn('Export CSV', 'studentsCsv', { i: 'dl', c: 'sm' })) +
    '<div class="toolbar">' + SP.search('st_q', 'Search name, admission no. or parent') + SP.select('st_c', SP.classOptions('All classes'), SP.f('st_c')) + SP.select('st_f', [['', 'Any fee status'], ['clear', 'Fees clear'], ['overdue', 'Has overdue'], ['hold', 'On gate hold']], SP.f('st_f')) + '</div>' +
    SP.table('students', [
      { h: 'Student', f: s => SP.person(s.name, s.admNo) }, { h: 'Class', f: s => SP.cls(s.classId).label + '<div class="s">Roll ' + s.roll + '</div>' },
      { h: 'Parent', f: s => esc(SP.parent(s.parentId).name) + '<div class="s">' + esc(SP.parent(s.parentId).phone) + '</div>' },
      { h: 'Attendance (30d)', f: s => { const p = SP.attPct(s.id, 30); return '<span class="' + (p < 85 ? 'neg' : '') + '">' + p + '%</span>'; } }, { h: 'Fees', f: s => SP.feePill(s.id) }
    ], list, { per: 12, row: 'openStudent', tourRow: 'stu-row' });
};
SP.act.studentsCsv = () => SP.csv('students.csv', ['Adm no', 'Name', 'Class', 'Roll', 'Parent', 'Phone', 'Attendance 30d %', 'Outstanding'], studentList().map(s => [s.admNo, s.name, SP.cls(s.classId).label, s.roll, SP.parent(s.parentId).name, SP.parent(s.parentId).phone, SP.attPct(s.id, 30), SP.owed(s.id)]));
SP.act.erpTab = d => { SP.ui.f.erp = d.k; SP.render(); };
const avgQuiz = s => { const qs = SP.QUIZZES.filter(q => q.classId === s.classId); return qs.length ? Math.round(100 * qs.reduce((a, q) => a + SP.quizScore(q, s) / q.total, 0) / qs.length) : 0; };

SP.drawers.student = function (a) {
  const s = SP.stu(a.id), p = SP.parent(s.parentId), c = SP.cls(s.classId), tab = SP.f('erp', 'overview');
  const tabs = SP.tabs([{ k: 'overview', label: 'Overview' }, { k: 'fees', label: 'Fees' }, { k: 'attendance', label: 'Attendance' }, { k: 'academics', label: 'Academics' }, { k: 'family', label: 'Family' }], tab, 'erpTab');
  let body = '';
  if (tab === 'overview') {
    body = '<div class="mini3"><div><span>Attendance (30d)</span><b>' + SP.attPct(s.id, 30) + '%</b></div><div><span>Outstanding</span><b class="' + (SP.owed(s.id) ? 'neg' : '') + '">' + SP.pkr(SP.owed(s.id)) + '</b></div><div><span>Quiz average</span><b>' + avgQuiz(s) + '%</b></div></div>' +
      SP.kv([['Admission no.', s.admNo], ['Date of birth', D.niceY(s.dob)], ['Gender', s.gender === 'F' ? 'Female' : 'Male'], ['Class teacher', esc(SP.teacher(c.teacherId).name)], ['Address', esc(s.address)], ['School transport', s.transport ? 'Yes — Route ' + (1 + (+s.id.slice(-1) % 5)) : 'No'], ['Today', SP.mark(s.id) ? { P: 'Present', A: 'Absent', L: 'On leave' }[SP.mark(s.id)] : 'Not marked']]) +
      '<div class="dr-act">' + SP.btn('Message parent', 'msgStudent', { c: 'pri', i: 'chat', d: { id: s.id } }) + SP.btn('Fee vouchers', 'erpTab', { d: { k: 'fees' } }) + '</div>';
  } else if (tab === 'fees') {
    body = SP.vouchers(s.id).slice().reverse().map(v => '<div class="vrow"><div><b>' + D.monthLabel(v.month) + '</b><span>' + v.id + ' · ' + SP.pkr(v.total) + '</span></div><div>' + voucherPill(v) + '</div><div>' + SP.btn('View', 'viewVoucher', { c: 'sm', d: { sid: s.id, vid: v.id } }) + (v.paid || !v.sent ? '' : SP.btn('Mark paid', 'payModal', { c: 'sm pri', d: { sid: s.id, vid: v.id } })) + '</div></div>').join('') || SP.empty('No vouchers yet');
  } else if (tab === 'attendance') {
    const a = SP.ATT[s.id] || '', cnt = ch => a.split(ch).length - 1;
    body = '<div class="mini3"><div><span>Present</span><b>' + cnt('P') + '</b></div><div><span>Absent</span><b class="neg">' + cnt('A') + '</b></div><div><span>Leave</span><b>' + cnt('L') + '</b></div></div><h4>Last 30 school days</h4><div class="attgrid">' +
      SP.DAYS.map((d, i) => '<div class="ac ' + (a[i] || 'P') + '" title="' + D.nice(d) + '"><span>' + (+d.slice(8)) + '</span></div>').join('') + '</div><div class="legend"><i class="P"></i>Present <i class="A"></i>Absent <i class="L"></i>Leave</div>';
  } else if (tab === 'academics') {
    body = '<h4>Recent quizzes</h4>' + SP.QUIZZES.filter(q => q.classId === s.classId).map(q => { const sc = SP.quizScore(q, s); return '<div class="qrow"><div><b>' + esc(q.title) + '</b><span>' + D.nice(q.date) + '</span></div><div class="qbar"><i style="width:' + pct(sc, q.total) + '%"></i></div><b>' + sc + '/' + q.total + '</b></div>'; }).join('') +
      '<h4>Subject teachers</h4>' + SP.kv(SP.SUBJECTS.map(sub => [sub, esc(SP.teacher(SP.ALLOC[s.classId][sub]).name)]));
  } else {
    const sibs = SP.kids(p.id).filter(k => k.id !== s.id);
    body = '<h4>Guardian</h4>' + SP.person(p.name, esc(p.rel) + ' · ' + esc(p.phone) + ' · ' + esc(p.email)) +
      '<h4>Relationships</h4>' + (sibs.length ? sibs.map(k => '<button class="rel" data-act="openStudent" data-id="' + k.id + '">' + SP.person(k.name, 'Sibling · ' + SP.cls(k.classId).label) + I('right') + '</button>').join('') : '<p class="muted">No siblings enrolled.</p>') +
      '<h4>References</h4>' + SP.kv([['Emergency contact', esc(s.eContact.name)], ['Emergency phone', esc(s.eContact.phone)]]) +
      '<h4>Student–teacher preferences</h4><div class="note">' + I('star') + esc(s.pref) + '</div>';
  }
  return '<div class="dr-h"><div>' + SP.person(s.name, c.label + ' · Roll ' + s.roll, 'lg') + '</div><div class="row-c" style="gap:8px">' + SP.feePill(s.id) + '<button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div></div><div class="dr-tabs">' + tabs + '</div><div class="dr-b">' + body + '</div>';
};
const voucherPill = v => !v.sent ? SP.pill('Draft', 'gray') : v.paid ? SP.pill('Paid', 'green') : v.due < TODAY ? SP.pill('Overdue', 'red') : SP.pill('Due', 'amber');
SP.voucherPill = voucherPill;

/* =============================== ACADEMICS =============================== */
SP.postDiary = function (o) {
  const S = SP.S; S.diary.unshift({ id: SP.uid('D'), classId: o.classId, subject: o.subject, type: o.type, title: o.title, text: o.text, date: TODAY, due: o.due || null, teacherId: o.teacherId });
  const seen = {}; SP.inClass(o.classId).forEach(s => { if (seen[s.parentId]) return; seen[s.parentId] = 1; SP.notify([s.id], { kind: 'diary', title: (o.type === 'note' ? 'Note: ' : 'New homework: ') + o.title, body: o.text }); });
  SP.toast('Posted to ' + SP.cls(o.classId).label + ' · ' + Object.keys(seen).length + ' parents notified');
};
P['admin.academics'] = function () {
  const tab = SP.f('acad', 'alloc'), cid = SP.f('ac_c');
  const tabs = SP.tabs([{ k: 'alloc', label: 'Subject allocation' }, { k: 'hw', label: 'Assignments' }, { k: 'quiz', label: 'Quizzes' }], tab, 'acadTab');
  let body = '';
  if (tab === 'alloc') {
    body = '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl matrix"><thead><tr><th>Class</th>' + SP.SUBJECTS.map(s => '<th>' + s + '</th>').join('') + '</tr></thead><tbody>' +
      SP.CLASSES.map(c => '<tr><td><b>' + c.label + '</b><div class="s">' + esc(SP.teacher(c.teacherId).name) + '</div></td>' + SP.SUBJECTS.map(s => { const t = SP.teacher(SP.ALLOC[c.id][s]); return '<td>' + esc(t.name.split(' ')[0]) + ' ' + esc(t.name.split(' ')[1][0]) + '.</td>'; }).join('') + '</tr>').join('') + '</tbody></table></div></div>';
  } else if (tab === 'hw') {
    const list = SP.S.diary.filter(d => d.type !== 'note' && (!cid || d.classId === cid)).sort((a, b) => b.date.localeCompare(a.date));
    body = '<div class="toolbar">' + SP.select('ac_c', SP.classOptions('All classes'), cid) + '<div class="grow"></div>' + SP.btn('Post assignment', 'hwModal', { i: 'plus', c: 'pri' }) + '</div>' +
      SP.table('hw', [{ h: 'Assignment', cls: 'wrap', f: d => '<b>' + esc(d.title) + '</b><div class="s">' + esc(d.text) + '</div>' }, { h: 'Class', f: d => SP.cls(d.classId).label }, { h: 'Subject', f: d => esc(d.subject) }, { h: 'Teacher', f: d => esc(SP.teacher(d.teacherId).name) }, { h: 'Posted', f: d => D.nice(d.date) }, { h: 'Due', f: d => d.due ? D.nice(d.due) : '—' }], list, { per: 9 });
  } else {
    const list = SP.QUIZZES.filter(q => !cid || q.classId === cid).sort((a, b) => b.date.localeCompare(a.date)).map(q => { const sc = SP.inClass(q.classId).map(s => SP.quizScore(q, s)); return Object.assign({}, q, { avg: pct(sc.reduce((a, b) => a + b, 0), sc.length * q.total), hi: Math.max.apply(null, sc), lo: Math.min.apply(null, sc), n: sc.length }); });
    body = '<div class="toolbar">' + SP.select('ac_c', SP.classOptions('All classes'), cid) + '</div>' +
      SP.table('quiz', [{ h: 'Quiz', f: q => '<b>' + esc(q.title) + '</b>' }, { h: 'Class', f: q => SP.cls(q.classId).label }, { h: 'Date', f: q => D.nice(q.date) }, { h: 'Class average', f: q => '<div class="qbar in"><i style="width:' + q.avg + '%"></i></div> ' + q.avg + '%' }, { h: 'High / Low', cls: 'mono', f: q => q.hi + ' / ' + q.lo + ' of ' + q.total }, { h: 'Students', f: q => q.n }], list, { per: 9, row: 'quizOpen' });
  }
  return SP.head('Academics', 'Subject allocation, assignments and quizzes', '') + body.replace(/^/, tabs);
};
SP.act.acadTab = d => { SP.ui.f.acad = d.k; SP.render(); };
SP.act.hwModal = () => SP.openModal('newhw', {});
SP.act.quizOpen = d => SP.openModal('quiz', { id: d.id });
SP.modals.quiz = function (a) {
  const q = SP.QUIZZES.find(x => x.id === a.id), rows = SP.inClass(q.classId).map(s => [s, SP.quizScore(q, s)]).sort((x, y) => y[1] - x[1]);
  return '<div class="m-h"><h3>' + esc(q.title) + ' · ' + SP.cls(q.classId).label + '</h3><button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button></div><div class="m-b">' +
    rows.map(r => '<div class="qrow"><div><b>' + esc(r[0].name) + '</b></div><div class="qbar"><i style="width:' + pct(r[1], q.total) + '%"></i></div><b>' + r[1] + '/' + q.total + '</b></div>').join('') + '</div>';
};
SP.modals.newhw = function () {
  const S = SP.S, cid = SP.f('hw_c', '5A');
  return '<div class="m-h"><h3>Post assignment</h3><button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button></div><div class="m-b"><div class="row2"><div class="field"><label>Class</label>' + SP.select('hw_c', SP.classOptions(), cid) + '</div>' +
    '<div class="field"><label>Subject</label><select class="input" id="hw-sub">' + SP.SUBJECTS.map(s => '<option>' + s + '</option>').join('') + '</select></div></div>' +
    '<div class="field"><label>Title</label><input class="input" id="hw-title" value="Chapter exercise" autocomplete="off"></div><div class="field"><label>Instructions</label><textarea class="input" id="hw-text" rows="3">Complete the exercise on page 45 and bring your notebook tomorrow.</textarea></div>' +
    '<div class="field"><label>Due date</label><input type="date" class="input" id="hw-due" value="' + D.add(TODAY, 2) + '"></div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Post & notify parents', 'hwPost', { c: 'pri' }) + '</div>';
};
SP.act.hwPost = () => { const cid = SP.f('hw_c', '5A'); SP.postDiary({ classId: cid, subject: $v('hw-sub'), type: 'homework', title: $v('hw-title') || 'Homework', text: $v('hw-text'), due: $v('hw-due'), teacherId: SP.ALLOC[cid][$v('hw-sub')] }); SP.ui.modal = null; SP.ui.f.acad = 'hw'; SP.render(); };

/* =============================== FEES =============================== */
const months = () => { const m = {}; Object.keys(SP.S.fees).forEach(k => SP.S.fees[k].forEach(v => { m[v.month] = 1; })); return Object.keys(m).sort(); };
function feeRows() {
  const ym = SP.f('fee_m', '2026-09'), q = SP.f('fee_q').toLowerCase(), c = SP.f('fee_c'), st = SP.f('fee_s');
  return SP.monthVouchers(ym).filter(x => (!c || x.s.classId === c) && (!q || (x.s.name + x.v.id + SP.parent(x.s.parentId).name).toLowerCase().indexOf(q) > -1) &&
    (!st || (st === 'draft' ? !x.v.sent : x.v.sent && SP.voucherStatus(x.v) === st))).map(x => Object.assign(x, { id: x.v.id }));
}
P['admin.fees'] = function () {
  const ym = SP.f('fee_m', '2026-09'), all = SP.monthVouchers(ym), billed = all.reduce((a, x) => a + x.v.total, 0), coll = all.reduce((a, x) => a + (x.v.paid ? x.v.total : 0), 0);
  const draft = all.filter(x => !x.v.sent).length, overdue = all.filter(x => x.v.sent && !x.v.paid && x.v.due < TODAY).length;
  const mopts = months().map(m => [m, D.monthLabel(m)]);
  const rows = feeRows();
  return SP.head('Fee vouchers', D.monthLabel(ym) + ' · ' + all.length + ' vouchers', SP.btn('Export CSV', 'feesCsv', { i: 'dl', c: 'sm' }) + SP.btn('Generate vouchers', 'genModal', { i: 'plus', c: 'pri', tour: 'gen-btn' })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Billed', value: SP.pkr(billed), icon: 'file', tone: 'brand', sub: all.length + ' vouchers' }) + SP.tile({ label: 'Collected', value: SP.pkr(coll), icon: 'check', tone: 'green', sub: pct(coll, billed) + '% collection rate' }) +
    SP.tile({ label: 'Outstanding', value: SP.pkr(billed - coll), icon: 'alert', tone: 'amber', sub: all.filter(x => !x.v.paid).length + ' unpaid' }) + SP.tile({ label: 'Overdue', value: overdue, icon: 'clock', tone: 'red', sub: 'Past due date', act: 'setFilter', d: 'overdue', attrs: 'data-k="fee_s" data-v="overdue" data-pk="fees"' }) + '</div>' +
    (draft ? '<div class="banner">' + I('send') + '<div><b>' + draft + ' vouchers generated but not sent yet.</b> Parents will see them in the app as soon as you send.</div>' + SP.btn('Send to parents', 'feeSend', { c: 'pri', tour: 'fee-send' }) + '</div>' : '') +
    '<div class="toolbar">' + SP.search('fee_q', 'Search student, parent or voucher no.') + SP.select('fee_m', mopts, ym) + SP.select('fee_c', SP.classOptions('All classes'), SP.f('fee_c')) + SP.select('fee_s', [['', 'Any status'], ['paid', 'Paid'], ['due', 'Due'], ['overdue', 'Overdue'], ['draft', 'Draft']], SP.f('fee_s')) + '<div class="grow"></div>' + SP.btn('Remind unpaid', 'feeRemind', { i: 'bell', c: 'sm' }) + '</div>' +
    SP.table('fees', [
      { h: 'Voucher', cls: 'mono', f: x => x.v.id }, { h: 'Student', f: x => SP.person(x.s.name, SP.cls(x.s.classId).short + ' · ' + esc(SP.parent(x.s.parentId).name)) }, { h: 'Amount', cls: 'mono', f: x => SP.pkr(x.v.total) },
      { h: 'Due', f: x => D.nice(x.v.due) }, { h: 'Status', f: x => voucherPill(x.v) + (x.v.method ? '<div class="s">' + esc(x.v.method) + ' · ' + D.nice(x.v.paidOn) + '</div>' : '') },
      { h: '', cls: 'r', f: (x, i) => SP.btn('View', 'viewVoucher', { c: 'sm', d: { sid: x.s.id, vid: x.v.id } }) + (x.v.paid || !x.v.sent ? '' : SP.btn('Mark paid', 'payModal', { c: 'sm pri', d: { sid: x.s.id, vid: x.v.id }, tour: 'markpaid-btn' })) }
    ], rows, { per: 10 });
};
SP.act.feesCsv = () => SP.csv('fee-vouchers-' + SP.f('fee_m', '2026-09') + '.csv', ['Voucher', 'Student', 'Class', 'Parent', 'Amount', 'Due', 'Status', 'Method', 'Paid on'], feeRows().map(x => [x.v.id, x.s.name, SP.cls(x.s.classId).label, SP.parent(x.s.parentId).name, x.v.total, x.v.due, x.v.sent ? SP.voucherStatus(x.v) : 'draft', x.v.method || '', x.v.paidOn || '']));
SP.act.feeSend = () => {
  const ym = SP.f('fee_m', '2026-09'); let n = 0; const seen = {};
  SP.monthVouchers(ym).forEach(x => { if (!x.v.sent) { x.v.sent = true; n++; if (!seen[x.s.parentId]) { seen[x.s.parentId] = 1; SP.notify([x.s.id], { kind: 'fee', title: D.monthLabel(ym) + ' fee voucher', body: 'Your fee voucher of ' + SP.pkr(x.v.total) + ' is ready. Due ' + D.nice(x.v.due) + '. Pay online in the app.', ref: x.v.id }); } } });
  SP.deliver({ title: n + ' fee vouchers · ' + D.monthLabel(ym), total: Object.keys(seen).length, channels: ['push', 'whatsapp'], note: 'PDF voucher attached to each WhatsApp message' }); SP.render();
};
SP.act.feeRemind = () => {
  const ym = SP.f('fee_m', '2026-09'), seen = {};
  SP.monthVouchers(ym).forEach(x => { if (x.v.sent && !x.v.paid && !seen[x.s.parentId]) { seen[x.s.parentId] = 1; SP.notify([x.s.id], { kind: 'fee', title: 'Fee reminder', body: D.monthLabel(ym) + ' fee of ' + SP.pkr(x.v.total) + ' is unpaid. Please clear it soon.', ref: x.v.id }); } });
  SP.deliver({ title: 'Fee reminder', total: Object.keys(seen).length, channels: ['push', 'sms'] }); SP.render();
};
SP.act.genModal = () => SP.openModal('gen', {});
SP.latestMonth = () => months()[months().length - 1];
SP.nextMonth = () => { const ms = months(), last = ms[ms.length - 1], y = +last.slice(0, 4), m = +last.slice(5); return m === 12 ? (y + 1) + '-01' : y + '-' + SP.pad(m + 1); };
SP.modals.gen = function () {
  const nxt = SP.nextMonth();
  const cid = SP.f('gen_c'), studs = cid ? SP.inClass(cid) : SP.STUDENTS;
  const total = studs.reduce((a, s) => a + SP.cls(s.classId).fee + (s.transport ? 2200 : 0), 0);
  const exists = SP.monthVouchers(nxt).length > 0;
  return '<div class="m-h"><h3>Generate fee vouchers</h3><button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button></div><div class="m-b">' +
    '<div class="row2"><div class="field"><label>Month</label><input class="input" value="' + D.monthLabel(nxt) + '" disabled></div><div class="field"><label>Classes</label>' + SP.select('gen_c', SP.classOptions('All classes (' + SP.STUDENTS.length + ' students)'), cid) + '</div></div>' +
    '<div class="field"><label>Fee heads</label><div class="heads"><div><span>Tuition fee</span><i>by grade</i></div><div><span>Transport</span><i>where enrolled</i></div><div><span>Due date</span><i>' + D.nice(nxt + '-10') + '</i></div></div></div>' +
    '<div class="summary"><div><span>Vouchers</span><b>' + studs.length + '</b></div><div><span>Total billing</span><b>' + SP.pkr(total) + '</b></div><div><span>Delivery</span><b>App + WhatsApp</b></div></div>' +
    (exists ? '<div class="note">' + I('alert') + 'Vouchers for this month already exist.</div>' : '') + '</div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Generate ' + studs.length + ' vouchers', 'genGo', { c: 'pri', i: 'file', dis: exists, d: { m: nxt }, tour: 'gen-go' }) + '</div>';
};
SP.act.genGo = d => {
  const S = SP.S, cid = SP.f('gen_c'), studs = cid ? SP.inClass(cid) : SP.STUDENTS, ym = d.m; let seq = 5000 + SP.monthVouchers(ym).length;
  studs.forEach(s => { const c = SP.cls(s.classId), heads = [['Tuition fee', c.fee]]; if (s.transport) heads.push(['Transport', 2200]); (S.fees[s.id] = S.fees[s.id] || []).push({ id: 'V' + ym.slice(2, 4) + ym.slice(5) + '-' + (++seq), month: ym, heads, total: heads.reduce((a, h) => a + h[1], 0), due: ym + '-10', paid: false, paidOn: null, method: null, sent: false }); });
  SP.ui.f.fee_m = ym; SP.ui.f.gen_c = ''; SP.ui.modal = null; SP.ui.page.fees = 0; SP.toast(studs.length + ' vouchers generated for ' + D.monthLabel(ym)); SP.render();
};
SP.act.viewVoucher = d => SP.openModal('voucher', d);
SP.act.payModal = d => SP.openModal('pay', d);
const getV = (sid, vid) => SP.vouchers(sid).find(v => v.id === vid);
SP.modals.voucher = function (a) {
  const s = SP.stu(a.sid), v = getV(a.sid, a.vid), p = SP.parent(s.parentId), c = SP.cls(s.classId);
  let bars = ''; for (let i = 0; i < 46; i++) bars += '<i style="width:' + (1 + Math.floor(SP.hash01(v.id + i) * 3)) + 'px"></i>';
  return '<div class="voucher"><div class="vd-h"><div>' + SP.logo() + '<div><b>' + SCHOOL + '</b><span>Fee voucher · ' + D.monthLabel(v.month) + '</span></div></div><div class="vd-no"><span>Voucher no.</span><b>' + v.id + '</b></div></div>' +
    '<div class="vd-meta"><div><span>Student</span><b>' + esc(s.name) + '</b></div><div><span>Class / Roll</span><b>' + c.label + ' / ' + s.roll + '</b></div><div><span>Guardian</span><b>' + esc(p.name) + '</b></div><div><span>Adm. no.</span><b>' + s.admNo + '</b></div></div>' +
    '<table class="vd-t"><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>' + v.heads.map(h => '<tr><td>' + esc(h[0]) + '</td><td class="r mono">' + SP.pkr(h[1]) + '</td></tr>').join('') + '<tr class="tot"><td>Total payable</td><td class="r mono">' + SP.pkr(v.total) + '</td></tr></tbody></table>' +
    '<div class="vd-f"><div><span>Due date</span><b>' + D.niceY(v.due) + '</b><span class="bank">Bank: HBL · A/C 0042-7788-1122 · Title: ' + SCHOOL + '</span></div><div class="barcode">' + bars + '</div>' + (v.paid ? '<div class="stamp">PAID<span>' + D.nice(v.paidOn) + ' · ' + esc(v.method) + '</span></div>' : '') + '</div></div>' +
    '<div class="m-f no-print">' + SP.btn('Close', 'closeModal') + SP.btn('Print official voucher', 'erp', { i: 'print', d: { w: 'voucher' } }) + (v.paid || !v.sent ? '' : SP.btn('Mark paid', 'payModal', { c: 'pri', d: { sid: a.sid, vid: a.vid } })) + '</div>';
};
SP.modals.voucher.wide = true;
SP.modals.pay = function (a) {
  const s = SP.stu(a.sid), v = getV(a.sid, a.vid);
  return '<div class="m-h"><h3>Record payment</h3><button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button></div><div class="m-b">' + SP.person(s.name, SP.cls(s.classId).label + ' · ' + D.monthLabel(v.month) + ' · ' + v.id) +
    '<div class="summary"><div><span>Amount received</span><b>' + SP.pkr(v.total) + '</b></div></div><div class="row2"><div class="field"><label>Payment method</label><select class="input" id="pay-m">' + SP.PAY_METHODS.map(m => '<option>' + m + '</option>').join('') + '</select></div>' +
    '<div class="field"><label>Reference (optional)</label><input class="input" id="pay-ref" placeholder="Receipt / TID" autocomplete="off"></div></div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Confirm payment', 'payGo', { c: 'pri', i: 'check', d: { sid: a.sid, vid: a.vid }, tour: 'pay-go' }) + '</div>';
};
SP.recordPayment = function (sid, vid, method, opts) {
  const v = getV(sid, vid), wasLocked = SP.locked(sid); v.paid = true; v.paidOn = TODAY; v.method = method; if (opts && opts.online) v.online = true;
  SP.notify([sid], { kind: 'fee', title: 'Payment received', body: SP.pkr(v.total) + ' received for ' + D.monthLabel(v.month) + ' fee (' + v.id + '). Thank you!', ref: vid });
  return wasLocked && !SP.locked(sid);
};
SP.act.payGo = d => { const lifted = SP.recordPayment(d.sid, d.vid, $v('pay-m') || 'Cash'); SP.ui.modal = null; SP.toast('Payment recorded' + (lifted ? ' · gate hold lifted' : '')); SP.render(); };

/* =============================== REPORTS =============================== */
P['admin.r_att'] = function () {
  const n = +SP.f('ra_n', 30), cid = SP.f('ra_c');
  const rows = SP.CLASSES.filter(c => !cid || c.id === cid).map(c => { const st = SP.inClass(c.id).filter(s => SP.ATT[s.id]); let p = 0, a = 0, l = 0, low = 0; st.forEach(s => { const x = SP.ATT[s.id].slice(-n); const pp = x.split('P').length - 1; p += pp; a += x.split('A').length - 1; l += x.split('L').length - 1; if (100 * pp / x.length < 85) low++; }); return { id: c.id, c, n: st.length, p, a, l, low, pct: pct(p, p + a + l) }; });
  const avg = pct(rows.reduce((x, r) => x + r.p, 0), rows.reduce((x, r) => x + r.p + r.a + r.l, 0)), best = rows.slice().sort((a, b) => b.pct - a.pct)[0], worst = rows.slice().sort((a, b) => a.pct - b.pct)[0];
  const chronic = SP.STUDENTS.filter(s => SP.ATT[s.id] && (!cid || s.classId === cid)).map(s => ({ id: s.id, s, pct: SP.attPct(s.id, n) })).filter(x => x.pct < 85).sort((a, b) => a.pct - b.pct);
  return SP.head('Student attendance report', 'Last ' + n + ' school days', SP.btn('Export CSV', 'raCsv', { i: 'dl', c: 'sm' }) + SP.btn('Print', 'print', { i: 'print', c: 'sm' })) +
    '<div class="toolbar">' + SP.select('ra_n', [[7, 'Last 7 days'], [14, 'Last 14 days'], [30, 'Last 30 days']], n) + SP.select('ra_c', SP.classOptions('All classes'), cid) + '</div>' +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Average attendance', value: avg + '%', icon: 'chart', tone: 'brand' }) + SP.tile({ label: 'Best class', value: best.c.label, icon: 'award', tone: 'green', sub: best.pct + '%' }) + SP.tile({ label: 'Lowest class', value: worst.c.label, icon: 'alert', tone: 'amber', sub: worst.pct + '%' }) + SP.tile({ label: 'Below 85%', value: chronic.length, icon: 'user', tone: 'red', sub: 'students flagged' }) + '</div>' +
    SP.card('Attendance by class', SP.cols(rows.map(r => r.pct), rows.map(r => r.c.short), { min: 80, max: 100, fmt: v => Math.round(v) + '%' })) +
    '<h3 class="sec">By class</h3>' + SP.table('ra', [{ h: 'Class', f: r => '<b>' + r.c.label + '</b>' }, { h: 'Class teacher', f: r => esc(SP.teacher(r.c.teacherId).name) }, { h: 'Students', f: r => r.n }, { h: 'Attendance', f: r => '<div class="qbar in"><i style="width:' + r.pct + '%"></i></div> ' + r.pct + '%' }, { h: 'Absent days', f: r => r.a }, { h: 'Leave days', f: r => r.l }, { h: 'Below 85%', f: r => r.low ? SP.pill(r.low, 'amber') : '—' }], rows, { per: 8 }) +
    '<h3 class="sec">Students below 85%</h3>' + SP.table('ra2', [{ h: 'Student', f: x => SP.person(x.s.name, x.s.admNo) }, { h: 'Class', f: x => SP.cls(x.s.classId).label }, { h: 'Attendance', f: x => '<b class="neg">' + x.pct + '%</b>' }, { h: 'Parent', f: x => esc(SP.parent(x.s.parentId).name) + '<div class="s">' + esc(SP.parent(x.s.parentId).phone) + '</div>' }], chronic, { per: 6, row: 'openStudent', empty: 'No students below the threshold' });
};
SP.act.raCsv = () => SP.csv('student-attendance.csv', ['Class', 'Students', 'Present days', 'Absent days', 'Leave days'], SP.CLASSES.map(c => { const st = SP.inClass(c.id).filter(s => SP.ATT[s.id]); let p = 0, a = 0, l = 0; st.forEach(s => { const x = SP.ATT[s.id].slice(-(+SP.f('ra_n', 30))); p += x.split('P').length - 1; a += x.split('A').length - 1; l += x.split('L').length - 1; }); return [c.label, st.length, p, a, l]; }));

P['admin.r_staff'] = function () {
  const role = SP.f('rs_r'), q = SP.f('rs_q').toLowerCase(), days = SP.DAYS.slice(-14);
  const list = SP.STAFF_ALL.filter(t => (!role || (role === 'T' ? t.role === 'Teacher' : t.role !== 'Teacher')) && (!q || t.name.toLowerCase().indexOf(q) > -1));
  const cnt = ch => SP.STAFF_ALL.filter(t => SP.staffToday(t.id) === ch).length;
  return SP.head('Staff attendance report', 'Last 14 school days · ' + SP.STAFF_ALL.length + ' staff', SP.btn('Export CSV', 'rsCsv', { i: 'dl', c: 'sm' })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Present today', value: cnt('P'), icon: 'check', tone: 'green' }) + SP.tile({ label: 'Late arrivals', value: cnt('T'), icon: 'clock', tone: 'amber' }) + SP.tile({ label: 'On leave', value: cnt('L'), icon: 'cal', tone: 'blue' }) + SP.tile({ label: 'Absent', value: cnt('A'), icon: 'alert', tone: 'red' }) + '</div>' +
    '<div class="toolbar">' + SP.search('rs_q', 'Search staff') + SP.select('rs_r', [['', 'All staff'], ['T', 'Teachers'], ['O', 'Office']], role) + '<div class="grow"></div><div class="legend"><i class="P"></i>Present <i class="T"></i>Late <i class="L"></i>Leave <i class="A"></i>Absent</div></div>' +
    '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl grid"><thead><tr><th>Staff</th>' + days.map(d => '<th class="c">' + (+d.slice(8)) + '<div class="s">' + D.dowName(d)[0] + '</div></th>').join('') + '<th class="c">Present</th></tr></thead><tbody>' +
    list.map(t => { const a = SP.STAFF_ATT[t.id]; return '<tr><td>' + SP.person(t.name, t.title, 'sm') + '</td>' + a.map(x => '<td class="c"><i class="cell ' + x + '"></i></td>').join('') + '<td class="c"><b>' + pct(a.filter(x => x === 'P' || x === 'T').length, a.length) + '%</b></td></tr>'; }).join('') + '</tbody></table></div></div>';
};
SP.act.rsCsv = () => SP.csv('staff-attendance.csv', ['Name', 'Role'].concat(SP.DAYS.slice(-14)), SP.STAFF_ALL.map(t => [t.name, t.title].concat(SP.STAFF_ATT[t.id])));

P['admin.r_gate'] = function () {
  const days = [TODAY].concat(SP.DAYS.slice(-4).reverse()), date = SP.f('rg_d', TODAY), type = SP.f('rg_t', 'S'), cid = SP.f('rg_c');
  const idx = SP.DAYS.indexOf(date); let rows;
  if (type === 'S') rows = SP.STUDENTS.filter(s => (!cid || s.classId === cid) && (date === TODAY ? SP.mark(s.id) === 'P' : SP.ATT[s.id] && SP.ATT[s.id][idx] === 'P')).map(s => ({ id: s.id, name: s.name, sub: SP.cls(s.classId).label, inn: SP.inMin(s.id, date), out: date === TODAY ? null : SP.outMin(s.id, date) }));
  else rows = SP.STAFF_ALL.filter(t => date === TODAY ? SP.staffToday(t.id) !== 'A' && SP.staffToday(t.id) !== 'L' : true).map(t => ({ id: t.id, name: t.name, sub: t.title, inn: SP.inMin(t.id, date) - 10, out: date === TODAY ? null : SP.outMin(t.id, date) + 100 }));
  const late = rows.filter(r => r.inn > SP.LATE_AFTER).length;
  return SP.head('Check in / out report', D.long(date), SP.btn('Export CSV', 'rgCsv', { i: 'dl', c: 'sm' })) +
    '<div class="toolbar">' + SP.select('rg_d', days.map(d => [d, D.long(d)]), date) + SP.select('rg_t', [['S', 'Students'], ['T', 'Staff']], type) + (type === 'S' ? SP.select('rg_c', SP.classOptions('All classes'), cid) : '') + '</div>' +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Checked in', value: rows.length, icon: 'check', tone: 'green' }) + SP.tile({ label: 'Late arrivals', value: late, icon: 'clock', tone: 'amber', sub: 'After 08:10' }) + SP.tile({ label: 'Checked out', value: rows.filter(r => r.out).length, icon: 'right', tone: 'blue' }) + SP.tile({ label: 'Still inside', value: rows.filter(r => !r.out).length, icon: 'user', tone: 'gray' }) + '</div>' +
    SP.table('rg', [{ h: 'Name', f: r => SP.person(r.name, r.sub, 'sm') }, { h: 'Check-in', cls: 'mono', f: r => D.time(r.inn) }, { h: 'Check-out', cls: 'mono', f: r => r.out ? D.time(r.out) : '—' }, { h: 'Status', f: r => r.inn > SP.LATE_AFTER ? SP.pill('Late', 'amber') : SP.pill('On time', 'green') }], rows, { per: 12 });
};
SP.act.rgCsv = () => SP.csv('check-in-out-' + SP.f('rg_d', TODAY) + '.csv', ['Name', 'Check-in'], SP.STUDENTS.filter(s => SP.mark(s.id) === 'P').map(s => [s.name, D.time(SP.inMin(s.id, TODAY))]));

function payments() { const out = []; SP.STUDENTS.forEach(s => SP.vouchers(s.id).forEach(v => { if (v.paid && v.paidOn && v.paidOn.slice(0, 7) === '2026-09') out.push({ s, v }); })); return out; }
P['admin.r_settle'] = function () {
  const pay = payments(), by = {}; SP.PAY_METHODS.forEach(m => { by[m] = { m, n: 0, gross: 0 }; });
  pay.forEach(x => { const b = by[x.v.method]; b.n++; b.gross += x.v.total; });
  const rows = SP.PAY_METHODS.map(m => { const b = by[m], chg = Math.round(b.gross * SP.METHOD_RATE[m]); return { id: m, m, n: b.n, gross: b.gross, rate: SP.METHOD_RATE[m], chg, net: b.gross - chg, status: m === 'Cash' ? 'Deposited' : m === 'Bank Deposit' ? 'Reconciled' : 'T+1 settlement' }; });
  const gross = rows.reduce((a, r) => a + r.gross, 0), chg = rows.reduce((a, r) => a + r.chg, 0);
  const pending = pay.filter(x => x.v.paidOn >= D.add(TODAY, -3) && SP.METHOD_RATE[x.v.method] > 0).reduce((a, x) => a + x.v.total * (1 - SP.METHOD_RATE[x.v.method]), 0);
  const dayN = 29, dv = []; for (let d = 1; d <= dayN; d++) { const iso = '2026-09-' + SP.pad(d); dv.push(pay.filter(x => x.v.paidOn === iso).reduce((a, x) => a + x.v.total, 0)); }
  const online = pay.filter(x => x.v.online).length;
  return SP.head('Settlement report', 'September 2026 · all payment channels', SP.btn('Export CSV', 'setCsv', { i: 'dl', c: 'sm' }) + SP.btn('Reconcile in ERPNext', 'erp', { i: 'wallet', c: 'sm', d: { w: 'reconcile' } })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Gross collected', value: SP.pkr(gross), icon: 'cash', tone: 'brand', sub: pay.length + ' payments' }) + SP.tile({ label: 'Gateway charges', value: SP.pkr(chg), icon: 'card', tone: 'amber', sub: 'JazzCash, Easypaisa, Card' }) + SP.tile({ label: 'Net settlement', value: SP.pkr(gross - chg), icon: 'wallet', tone: 'green' }) + SP.tile({ label: 'Pending settlement', value: SP.pkr(pending), icon: 'clock', tone: 'blue', sub: 'Digital, last 3 days' + (online ? ' · ' + online + ' live in demo' : '') }) + '</div>' +
    SP.card('Daily collections', SP.cols(dv, dv.map((v, i) => String(i + 1)), { fmt: v => v >= 1000 ? Math.round(v / 1000) + 'k' : Math.round(v), hl: dayN - 1 })) +
    '<h3 class="sec">By channel</h3>' + SP.table('set', [{ h: 'Channel', f: r => '<b>' + r.m + '</b>' }, { h: 'Transactions', f: r => r.n }, { h: 'Gross', cls: 'mono', f: r => SP.pkr(r.gross) }, { h: 'Fee %', f: r => r.rate ? (r.rate * 100).toFixed(1) + '%' : '—' }, { h: 'Charges', cls: 'mono', f: r => SP.pkr(r.chg) }, { h: 'Net', cls: 'mono', f: r => '<b>' + SP.pkr(r.net) + '</b>' }, { h: 'Status', f: r => SP.pill(r.status, r.status === 'T+1 settlement' ? 'amber' : 'green') }], rows, { per: 10 }) +
    '<h3 class="sec">Latest payments</h3>' + SP.table('set2', [{ h: 'Date', f: x => D.nice(x.v.paidOn) }, { h: 'Voucher', cls: 'mono', f: x => x.v.id }, { h: 'Student', f: x => esc(x.s.name) }, { h: 'Channel', f: x => esc(x.v.method) + (x.v.online ? ' ' + SP.pill('Online', 'blue') : '') }, { h: 'Amount', cls: 'mono', f: x => SP.pkr(x.v.total) }], pay.sort((a, b) => b.v.paidOn.localeCompare(a.v.paidOn)).map(x => Object.assign(x, { id: x.v.id })), { per: 8 });
};
SP.act.setCsv = () => SP.csv('settlement-sep-2026.csv', ['Date', 'Voucher', 'Student', 'Channel', 'Amount'], payments().map(x => [x.v.paidOn, x.v.id, x.s.name, x.v.method, x.v.total]));

/* =============================== TEACHER =============================== */
const draftKey = () => SP.f('attClass') || SP.cls(SP.teacher(SP.S.teacherId).classId || '5A').id;
P['teacher.attendance'] = function () {
  const S = SP.S, t = SP.teacher(S.teacherId), cid = draftKey(), c = SP.cls(cid), studs = SP.inClass(cid), submitted = !!S.attSubmitted[cid];
  SP.ui.draft = SP.ui.draft || {}; const dr = SP.ui.draft[cid] = SP.ui.draft[cid] || {};
  studs.forEach(s => { if (!dr[s.id]) dr[s.id] = S.attToday[s.id] || 'P'; });
  const cnt = k => studs.filter(s => dr[s.id] === k).length;
  const pending = SP.CLASSES.filter(x => !S.attSubmitted[x.id]);
  return SP.head('Mark attendance', D.long(TODAY) + ' · ' + c.label, submitted ? SP.pill('Submitted', 'green') : SP.pill('Pending', 'amber')) +
    '<div class="toolbar">' + SP.select('attClass', SP.classOptions(), cid) + (pending.length ? '<span class="muted">Pending today: ' + pending.map(x => x.short).join(', ') + '</span>' : '<span class="muted">All classes submitted</span>') + '<div class="grow"></div>' + SP.btn('Mark all present', 'attAll', { c: 'sm' }) + '</div>' +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Present', value: cnt('P'), tone: 'green', icon: 'check' }) + SP.tile({ label: 'Absent', value: cnt('A'), tone: 'red', icon: 'alert' }) + SP.tile({ label: 'Leave', value: cnt('L'), tone: 'amber', icon: 'cal' }) + SP.tile({ label: 'Class size', value: studs.length, tone: 'gray', icon: 'users' }) + '</div>' +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Roll</th><th>Student</th><th>Parent</th><th class="r">Mark</th></tr></thead><tbody>' + studs.map((s, i) => '<tr><td class="mono">' + s.roll + '</td><td>' + SP.person(s.name, s.admNo, 'sm') + '</td><td>' + esc(SP.parent(s.parentId).name) + '</td><td class="r"><div class="segb" ' + (i === 0 ? 'data-tour="att-seg"' : '') + '>' +
      ['P', 'A', 'L'].map(k => '<button class="' + k + (dr[s.id] === k ? ' on' : '') + '" data-act="attSet" data-s="' + s.id + '" data-v="' + k + '">' + { P: 'Present', A: 'Absent', L: 'Leave' }[k] + '</button>').join('') + '</div></td></tr>').join('') + '</tbody></table></div>' +
    '<div class="sticky-act">' + SP.btn(submitted ? 'Update & notify parents' : 'Submit attendance & notify parents', 'attSubmit', { c: 'pri', i: 'send', tour: 'att-submit' }) + '</div>';
};
SP.act.attSet = d => { SP.ui.draft[draftKey()][d.s] = d.v; SP.render(); };
SP.act.attAll = () => { const dr = SP.ui.draft[draftKey()]; Object.keys(dr).forEach(k => { dr[k] = 'P'; }); SP.render(); };
SP.act.attSubmit = () => {
  const S = SP.S, cid = draftKey(), dr = SP.ui.draft[cid]; let n = 0;
  SP.inClass(cid).forEach(s => { const before = S.attToday[s.id]; S.attToday[s.id] = dr[s.id]; if (dr[s.id] !== 'P' && before !== dr[s.id]) { n++; SP.notify([s.id], { kind: 'attendance', title: dr[s.id] === 'A' ? s.first + ' marked absent' : s.first + ' marked on leave', body: s.name + ' was marked ' + (dr[s.id] === 'A' ? 'absent' : 'on leave') + ' today, ' + D.long(TODAY) + '.' }); } });
  S.attSubmitted[cid] = true; SP.toast('Attendance saved for ' + SP.cls(cid).label + ' · ' + n + ' parent' + (n === 1 ? '' : 's') + ' notified'); SP.render();
};
P['teacher.diary'] = function () {
  const S = SP.S, t = SP.teacher(S.teacherId), cid = SP.f('dy_c', t.classId || '5A'), mine = S.diary.filter(d => d.classId === cid).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  return SP.head('Homework & diary', 'Post to every parent in the class instantly', '') + '<div class="g21"><section class="card"><div class="card-h"><h3>New post</h3></div><div class="card-b">' +
    '<div class="row2"><div class="field"><label>Class</label>' + SP.select('dy_c', SP.classOptions(), cid) + '</div><div class="field"><label>Type</label><select class="input" id="dy-type"><option value="homework">Homework</option><option value="note">Note / reminder</option></select></div></div>' +
    '<div class="row2"><div class="field"><label>Subject</label><select class="input" id="dy-sub">' + SP.SUBJECTS.map(s => '<option>' + s + '</option>').join('') + '</select></div><div class="field"><label>Due date</label><input type="date" class="input" id="dy-due" value="' + D.add(TODAY, 1) + '"></div></div>' +
    '<div class="field"><label>Title</label><input class="input" id="dy-title" value="Practice worksheet" autocomplete="off"></div><div class="field"><label>Details</label><textarea class="input" id="dy-text" rows="4">Complete both sides of the worksheet and revise tomorrow\'s topic.</textarea></div>' +
    SP.btn('Post to class', 'dyPost', { c: 'pri', i: 'send', tour: 'dy-post' }) + '</div></section>' +
    SP.card('Recent posts · ' + SP.cls(cid).label, mine.map(d => '<div class="post"><div class="row-c"><b>' + esc(d.title) + '</b>' + SP.pill(d.type === 'note' ? 'Note' : 'Homework', d.type === 'note' ? 'gray' : 'blue') + '</div><p>' + esc(d.text) + '</p><span class="muted">' + esc(d.subject) + ' · ' + D.nice(d.date) + (d.due ? ' · due ' + D.nice(d.due) : '') + '</span></div>').join('')) + '</div>';
};
SP.act.dyPost = () => { const cid = SP.f('dy_c', SP.teacher(SP.S.teacherId).classId || '5A'); SP.postDiary({ classId: cid, subject: $v('dy-sub'), type: $v('dy-type'), title: $v('dy-title') || 'Post', text: $v('dy-text'), due: $v('dy-type') === 'note' ? null : $v('dy-due'), teacherId: SP.S.teacherId }); SP.render(); };
P['teacher.timetable'] = function () {
  const t = SP.teacher(SP.S.teacherId), days = [1, 2, 3, 4, 5], dn = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const cols = days.map(d => { const items = []; SP.CLASSES.forEach(c => SP.timetable(c.id, d).forEach(p => { if (p.teacherId === t.id) items.push({ from: p.from, to: p.to, sub: p.subject, c: c.label }); })); items.sort((a, b) => a.from.localeCompare(b.from)); return '<section class="card"><div class="card-h"><h3>' + dn[d] + '</h3></div><div class="card-b">' + (items.map(i => '<div class="lesson"><b>' + i.from + '–' + i.to + '</b><span>' + i.sub + ' · ' + i.c + '</span></div>').join('') || '<span class="muted">No lessons</span>') + '</div></section>'; }).join('');
  return SP.head('My timetable', esc(t.name) + ' · ' + t.title, '') + '<div class="g3 wk">' + cols + '</div>';
};
})();
