/* Learning management (admin + teacher): assignments & grading, online quizzes, subject notes, resource library. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY, P = SP.pages;
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const tid = () => SP.S.persona === 'teacher' ? SP.S.teacherId : null; // teacher persona sees only their own work
SP.teachPairs = t => { const out = []; SP.CLASSES.forEach(c => SP.SUBJECTS.forEach(s => { if (SP.ALLOC[c.id][s] === t) out.push({ classId: c.id, subject: s }); })); return out; };
const myClasses = () => { const t = tid(); if (!t) return SP.CLASSES.map(c => c.id); const seen = {}; SP.teachPairs(t).forEach(p => { seen[p.classId] = 1; }); return SP.CLASSES.filter(c => seen[c.id]).map(c => c.id); };
const mySubjects = cid => { const t = tid(); return t ? SP.SUBJECTS.filter(s => SP.ALLOC[cid][s] === t) : SP.SUBJECTS; };
const clsOpts = all => (all ? [['', all]] : []).concat(myClasses().map(id => [id, SP.cls(id).label]));
const subOpts = all => (all ? [['', all]] : []).concat(SP.SUBJECTS.map(s => [s, s]));
const teacherName = id => { const t = SP.teacher(id); return t ? t.name : '—'; };
const xbtn = '<button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button>';
const statePill = st => st === 'today' ? SP.pill('Due today', 'amber') : st === 'active' ? SP.pill('Active', 'green') : SP.pill('Closed', 'gray');
const chk = (id, label, on) => '<label class="chk"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + label + '</label>';

/* ===== overrides for seeded assignments (deadline extension / closing) ===== */
SP.allAssign = () => SP.ASSIGN.concat(SP.S.assign).map(a => SP.S.asgOv[a.id] ? Object.assign({}, a, SP.S.asgOv[a.id]) : a);

/* =============================== ASSIGNMENTS =============================== */
function assignRows() {
  const t = tid(), q = SP.f('as_q').toLowerCase(), c = SP.f('as_c'), sb = SP.f('as_s'), st = SP.f('as_st', 'active');
  return SP.allAssign().filter(a => (!t || a.teacherId === t) && (!c || a.classId === c) && (!sb || a.subject === sb) && (!q || (a.title + a.subject).toLowerCase().indexOf(q) > -1) &&
    (st === 'all' || (st === 'active' ? SP.assignState(a) !== 'closed' : SP.assignState(a) === 'closed')))
    .map(a => Object.assign({}, a, { stt: SP.assignStats(a) })).sort((a, b) => (SP.assignState(a) === 'closed') - (SP.assignState(b) === 'closed') || (SP.assignState(a) === 'closed' ? b.due.localeCompare(a.due) : a.due.localeCompare(b.due)));
}
P['admin.assign'] = function () {
  const t = tid(), rows = assignRows(), all = SP.allAssign().filter(a => !t || a.teacherId === t);
  const active = all.filter(a => SP.assignState(a) !== 'closed'), stats = active.map(a => SP.assignStats(a));
  const toGrade = stats.reduce((n, s) => n + s.sub - s.graded, 0), comp = pct(stats.reduce((n, s) => n + s.sub, 0), stats.reduce((n, s) => n + s.n, 0));
  return SP.head('Assignments', active.length + ' active · ' + (t ? 'your classes' : 'all classes'), SP.btn('New assignment', 'newAssign', { i: 'plus', c: 'pri', tour: 'as-new' })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Active', value: active.length, sub: 'Open for submission' }) + SP.tile({ label: 'Due this week', value: active.filter(a => a.due <= D.add(TODAY, 7)).length, sub: 'Next 7 days' }) +
    SP.tile({ label: 'To grade', value: toGrade, tone: toGrade ? 'amber' : '', sub: 'Submissions waiting', tour: 'as-tograde' }) + SP.tile({ label: 'Submission rate', value: comp + '%', sub: 'Across active work' }) + '</div>' +
    '<div class="toolbar">' + SP.search('as_q', 'Search assignments') + SP.select('as_c', clsOpts('All classes'), SP.f('as_c')) + SP.select('as_s', subOpts('All subjects'), SP.f('as_s')) + SP.select('as_st', [['active', 'Active'], ['closed', 'Closed'], ['all', 'All']], SP.f('as_st', 'active')) + '</div>' +
    SP.table('assign', [
      { h: 'Assignment', cls: 'wrap', f: a => '<b>' + esc(a.title) + '</b><div class="s">' + esc(a.subject) + ' · ' + SP.cls(a.classId).label + (t ? '' : ' · ' + esc(teacherName(a.teacherId))) + '</div>' },
      { h: 'Due', f: a => D.nice(a.due) + '<div>' + statePill(SP.assignState(a)) + '</div>' },
      { h: 'Submitted', f: a => '<div class="qbar in"><i style="width:' + pct(a.stt.sub, a.stt.n) + '%"></i></div> ' + a.stt.sub + '/' + a.stt.n },
      { h: 'To grade', f: a => a.stt.sub - a.stt.graded ? SP.pill(a.stt.sub - a.stt.graded, 'amber') : '<span class="muted">—</span>' },
      { h: 'Avg. mark', f: a => a.stt.graded ? a.stt.avg + '%' : '<span class="muted">—</span>' },
      { h: '', cls: 'r', f: a => SP.btn('Open', 'assignOpen', { c: 'sm', d: { id: a.id } }) }
    ], rows, { per: 9, row: 'assignOpen', tourRow: 'as-row', empty: 'No assignments match' });
};
SP.act.assignOpen = d => { SP.ui.f.as_tab = 'subs'; SP.ui.f.as_f = ''; SP.openDrawer('assign', { id: d.id }); };
SP.act.asTab = d => { SP.ui.f.as_tab = d.k; SP.render(); };

SP.drawers.assign = function (args) {
  const a = SP.assign(args.id), st = SP.assignStats(a), tab = SP.f('as_tab', 'subs'), flt = SP.f('as_f');
  const tabs = SP.tabs([{ k: 'subs', label: 'Submissions', n: st.sub + '/' + st.n }, { k: 'det', label: 'Details' }], tab, 'asTab');
  let body;
  if (tab === 'subs') {
    let tagged = 0; const rows = st.rows.filter(r => !flt || (flt === 'missing' ? !r.sub : flt === 'submitted' ? r.sub && r.sub.status === 'submitted' : r.sub && r.sub.status === 'graded'));
    body = '<div class="mini3"><div><span>Submitted</span><b>' + st.sub + '/' + st.n + '</b></div><div><span>Graded</span><b>' + st.graded + '</b></div><div><span>Average mark</span><b>' + (st.graded ? st.avg + '%' : '—') + '</b></div></div>' +
      '<div class="chips" style="margin-bottom:10px">' + [['', 'All'], ['submitted', 'To grade'], ['graded', 'Graded'], ['missing', 'Missing']].map(c => '<button class="chip ' + (flt === c[0] ? 'on' : '') + '" data-act="setFilter" data-k="as_f" data-v="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' +
      (rows.map((r) => '<div class="vrow"><div>' + SP.person(r.s.name, r.sub ? (r.sub.late ? 'Submitted late · ' : 'Submitted · ') + D.niceTs(r.sub.ts) : 'Not submitted', 'sm') + '</div><div>' +
        (r.sub ? (r.sub.status === 'graded' ? '<b>' + r.sub.marks + '/' + a.total + '</b>' : SP.pill('To grade', 'amber')) : SP.pill('Missing', 'red')) + '</div><div>' +
        (r.sub ? SP.btn(r.sub.status === 'graded' ? 'Edit' : 'Grade', 'gradeOpen', { c: 'sm ' + (r.sub.status === 'graded' ? '' : 'pri'), d: { aid: a.id, sid: r.s.id }, tour: r.sub && !tagged++ ? 'as-grade' : '' }) : '') + '</div></div>').join('') || SP.empty('No students in this filter')) +
      '<div class="dr-act">' + SP.btn('Remind missing (' + st.missing + ')', 'asRemind', { i: 'bell', d: { id: a.id }, dis: !st.missing || SP.assignState(a) === 'closed', tour: 'as-remind' }) + SP.btn('Extend by 2 days', 'asExtend', { d: { id: a.id } }) + SP.btn(SP.assignState(a) === 'closed' ? 'Reopen' : 'Close assignment', 'asClose', { d: { id: a.id } }) + SP.btn('Export CSV', 'asCsv', { i: 'dl', d: { id: a.id } }) + '</div>';
  } else {
    body = SP.kv([['Subject', esc(a.subject)], ['Class', SP.cls(a.classId).label], ['Teacher', esc(teacherName(a.teacherId))], ['Posted', D.niceY(a.posted)], ['Due', D.niceY(a.due)], ['Total marks', a.total], ['Submission', { file: 'File upload', text: 'Typed answer', both: 'File or typed answer' }[a.type]], ['Visible to', st.n + ' students · ' + st.n + ' parents']]) +
      '<h4>Instructions</h4><p>' + esc(a.text) + '</p>' + (a.attach ? '<h4>Attachment</h4><div class="filechip">' + I('file') + '<div><b>' + esc(a.attach.name) + '</b><span>' + esc(a.attach.size) + '</span></div></div>' : '');
  }
  return '<div class="dr-h"><div><b style="font-size:17px">' + esc(a.title) + '</b><div class="s">' + esc(a.subject) + ' · ' + SP.cls(a.classId).label + ' · due ' + D.nice(a.due) + '</div></div><div class="row-c" style="gap:8px">' + statePill(SP.assignState(a)) + '<button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div></div><div class="dr-tabs">' + tabs + '</div><div class="dr-b" data-scroll="drb">' + body + '</div>';
};
SP.drawers.assign.wide = true;

SP.act.newAssign = () => { SP.ui.f.na_c = SP.ui.f.na_c || myClasses()[0]; SP.openModal('newassign', {}); };
SP.modals.newassign = function () {
  const cid = SP.f('na_c', myClasses()[0]), subs = mySubjects(cid), sb = subs.indexOf(SP.f('na_s')) > -1 ? SP.f('na_s') : subs[0];
  return '<div class="m-h"><h3>New assignment</h3>' + xbtn + '</div><div class="m-b"><div class="row2"><div class="field"><label>Class</label>' + SP.select('na_c', clsOpts(), cid) + '</div><div class="field"><label>Subject</label>' + SP.select('na_s', subs.map(s => [s, s]), sb) + '</div></div>' +
    '<div class="field"><label>Title</label><input class="input" id="na-t" value="Chapter exercise — practice set" autocomplete="off"></div><div class="field"><label>Instructions</label><textarea class="input" id="na-x" rows="3">Complete the questions in your notebook. Show your working and upload a clear photo before the due date.</textarea></div>' +
    '<div class="row2"><div class="field"><label>Due date</label><input type="date" class="input" id="na-d" value="' + D.add(TODAY, 3) + '"></div><div class="field"><label>Total marks</label><select class="input" id="na-m"><option>10</option><option selected>20</option><option>25</option><option>50</option></select></div></div>' +
    '<div class="row2"><div class="field"><label>Students submit</label><select class="input" id="na-y"><option value="both">Photo/file or typed answer</option><option value="file">Photo / file upload</option><option value="text">Typed answer</option></select></div><div class="field"><label>Attach a worksheet</label><select class="input" id="na-a"><option value="">No attachment</option><option>Worksheet.pdf</option><option>Reading_pack.pdf</option></select></div></div>' +
    '<div class="checks">' + chk('na-n', 'Notify students & parents now', true) + '</div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Post assignment', 'assignCreate', { c: 'pri', i: 'send', tour: 'as-post' }) + '</div>';
};
SP.act.assignCreate = () => {
  const S = SP.S, cid = SP.f('na_c', myClasses()[0]), subs = mySubjects(cid), sb = subs.indexOf(SP.f('na_s')) > -1 ? SP.f('na_s') : subs[0], title = $v('na-t') || 'Assignment', att = $v('na-a');
  const a = { id: SP.uid('AS'), classId: cid, subject: sb, title, text: $v('na-x'), posted: TODAY, due: $v('na-d') || D.add(TODAY, 3), total: +$v('na-m') || 20, teacherId: tid() || SP.ALLOC[cid][sb], type: $v('na-y') || 'both', attach: att ? { name: att, size: '0.4 MB' } : null };
  S.assign.unshift(a);
  S.diary.unshift({ id: SP.uid('D'), classId: cid, subject: sb, type: 'assignment', title: 'Assignment: ' + title, text: 'Due ' + D.nice(a.due) + ' · ' + a.total + ' marks. Open Assignments to submit.', date: TODAY, due: a.due, teacherId: a.teacherId, ref: a.id });
  if (document.getElementById('na-n') && document.getElementById('na-n').checked) {
    SP.inClass(cid).forEach(s => SP.notify([s.id], { kind: 'assignment', title: 'New assignment: ' + title, body: sb + ' · due ' + D.nice(a.due) + ' · ' + a.total + ' marks', ref: a.id }));
    SP.deliver({ title: 'Assignment · ' + SP.cls(cid).label, total: SP.inClass(cid).length, channels: ['push'], note: 'Students and parents notified' });
  }
  SP.ui.modal = null; SP.ui.f.as_st = 'active'; SP.ui.f.as_c = ''; SP.ui.f.as_s = ''; SP.toast('Assignment posted to ' + SP.cls(cid).label); SP.render();
};
const ov = id => (SP.S.asgOv[id] = SP.S.asgOv[id] || {});
SP.act.asExtend = d => { const a = SP.assign(d.id); ov(d.id).due = D.add(a.due < TODAY ? TODAY : a.due, 2); ov(d.id).closed = false; SP.toast('Deadline extended to ' + D.nice(ov(d.id).due)); SP.render(); };
SP.act.asClose = d => { const a = SP.assign(d.id); if (SP.assignState(a) === 'closed') { ov(d.id).closed = false; ov(d.id).due = D.add(TODAY, 2); } else ov(d.id).closed = true; SP.toast('Assignment ' + (ov(d.id).closed ? 'closed' : 'reopened')); SP.render(); };
SP.act.asRemind = d => {
  const a = SP.assign(d.id), miss = SP.assignStats(a).rows.filter(r => !r.sub);
  miss.forEach(r => SP.notify([r.s.id], { kind: 'assignment', title: 'Reminder: ' + a.title, body: a.subject + ' is due ' + D.nice(a.due) + '. You have not submitted yet.', ref: a.id }));
  SP.deliver({ title: 'Assignment reminder', total: miss.length, channels: ['push', 'whatsapp'] }); SP.render();
};
SP.act.asCsv = d => { const a = SP.assign(d.id); SP.csv('assignment-' + a.id + '.csv', ['Student', 'Class', 'Status', 'Marks', 'Submitted'], SP.assignStats(a).rows.map(r => [r.s.name, SP.cls(a.classId).label, r.sub ? r.sub.status : 'missing', r.sub && r.sub.marks != null ? r.sub.marks + '/' + a.total : '', r.sub ? r.sub.ts : ''])); };

/* ---- grading ---- */
SP.act.gradeOpen = d => SP.openModal('grade', { aid: d.aid, sid: d.sid });
SP.modals.grade = function (x) {
  const a = SP.assign(x.aid), s = SP.stu(x.sid), sub = SP.sub(a, s), rows = SP.assignStats(a).rows.filter(r => r.sub && r.sub.status === 'submitted' && r.s.id !== s.id);
  const preview = sub.text ? '<div class="note">' + I('pen') + '<span>' + esc(sub.text) + '</span></div>' : '';
  const file = sub.file ? '<div class="filechip">' + I('file') + '<div><b>' + esc(sub.file) + '</b><span>Photo · 1.2 MB</span></div></div><div class="imgprev"><div></div><div></div><div></div></div>' : (!sub.text ? '<div class="filechip">' + I('file') + '<div><b>' + esc(s.first) + '_' + esc(a.subject.slice(0, 4)) + '_answer.jpg</b><span>Photo · 1.4 MB</span></div></div><div class="imgprev"><div></div><div></div><div></div></div>' : '');
  return '<div class="m-h"><h3>Grade submission</h3>' + xbtn + '</div><div class="m-b">' + SP.person(s.name, SP.cls(s.classId).label + ' · ' + esc(a.title), 'lg') +
    '<div class="s" style="margin:8px 0">' + (sub.late ? '<b class="neg">Submitted late</b> · ' : 'Submitted · ') + D.niceTs(sub.ts) + '</div>' + preview + file +
    '<div class="row2" style="margin-top:12px"><div class="field"><label>Marks (out of ' + a.total + ')</label><input class="input" type="number" min="0" max="' + a.total + '" id="gr-m" value="' + (sub.marks != null ? sub.marks : Math.round(a.total * .8)) + '"></div><div class="field"><label>Quick feedback</label><div class="chips">' + ['Excellent work!', 'Good effort', 'Please redo neatly', 'Incomplete'].map(t => '<button class="chip" data-act="grFb" data-t="' + esc(t) + '">' + t + '</button>').join('') + '</div></div></div>' +
    '<div class="field"><label>Feedback to student & parent</label><textarea class="input" id="gr-f" rows="2">' + esc(sub.fb || '') + '</textarea></div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + (rows.length ? SP.btn('Save & next', 'grSave', { d: { aid: a.id, sid: s.id, next: rows[0].s.id } }) : '') + SP.btn('Save & notify parent', 'grSave', { c: 'pri', i: 'check', d: { aid: a.id, sid: s.id }, tour: 'as-save' }) + '</div>';
};
SP.act.grFb = d => { const e = document.getElementById('gr-f'); if (e) e.value = d.t; };
SP.act.grSave = d => {
  const S = SP.S, a = SP.assign(d.aid), s = SP.stu(d.sid), sub = SP.sub(a, s), m = Math.max(0, Math.min(a.total, +$v('gr-m') || 0)), fb = $v('gr-f');
  (S.subs[a.id] = S.subs[a.id] || {})[s.id] = Object.assign({}, sub, { status: 'graded', marks: m, fb, seeded: false });
  SP.notify([s.id], { kind: 'assignment', title: 'Assignment graded: ' + a.title, body: a.subject + ' · ' + m + '/' + a.total + (fb ? ' — ' + fb : ''), ref: a.id });
  SP.toast(s.first + ' graded ' + m + '/' + a.total + ' · parent notified');
  SP.ui.modal = d.next ? { name: 'grade', args: { aid: a.id, sid: d.next } } : null; SP.render();
};
// student-side submission (called from the phone)
SP.submitAssign = function (aid, sid, text, file) {
  const S = SP.S, a = SP.assign(aid), s = SP.stu(sid), late = TODAY > a.due;
  (S.subs[aid] = S.subs[aid] || {})[sid] = { status: 'submitted', ts: SP.stamp(), text: text || '', file: file || null, late, marks: null, fb: '' };
  SP.toast(s.name + ' submitted “' + a.title + '” — your teacher sees it in Assignments' + (late ? ' (late)' : ''));
};

/* =============================== QUIZZES =============================== */
const qTeacher = q => q.teacherId || SP.ALLOC[q.classId][q.subject];
const qStatePill = q => q.status === 'live' ? SP.pill('Live', 'green') : q.status === 'draft' ? SP.pill('Draft', 'gray') : SP.pill('Closed', 'blue');
P['admin.quizzes'] = function () {
  const t = tid(), q = SP.f('qz_q').toLowerCase(), c = SP.f('qz_c'), st = SP.f('qz_s');
  const all = SP.allQuizzes().filter(x => !t || qTeacher(x) === t), rows = all.filter(x => (!c || x.classId === c) && (!st || x.status === st) && (!q || x.title.toLowerCase().indexOf(q) > -1)).map(x => Object.assign({}, x, { stt: SP.quizStats(x) })).sort((a, b) => (b.status === 'live') - (a.status === 'live') || b.date.localeCompare(a.date));
  const done = all.filter(x => x.status !== 'draft').map(x => SP.quizStats(x)).filter(s => s.done), avg = done.length ? Math.round(done.reduce((n, s) => n + s.avg, 0) / done.length) : 0;
  return SP.head('Quizzes', 'Online quizzes that mark themselves · results in real time', SP.btn('New quiz', 'newQuiz', { i: 'plus', c: 'pri', tour: 'qz-new' })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Live now', value: all.filter(x => x.status === 'live').length, sub: 'Open to students' }) + SP.tile({ label: 'Drafts', value: all.filter(x => x.status === 'draft').length, sub: 'Not yet published' }) + SP.tile({ label: 'Completed', value: all.filter(x => x.status === 'closed').length, sub: 'This term' }) + SP.tile({ label: 'Average score', value: avg + '%', sub: 'Across attempted quizzes' }) + '</div>' +
    '<div class="toolbar">' + SP.search('qz_q', 'Search quizzes') + SP.select('qz_c', clsOpts('All classes'), c) + SP.select('qz_s', [['', 'Any status'], ['live', 'Live'], ['draft', 'Draft'], ['closed', 'Closed']], st) + '</div>' +
    SP.table('quizzes', [
      { h: 'Quiz', cls: 'wrap', f: x => '<b>' + esc(x.title) + '</b><div class="s">' + esc(x.subject) + ' · ' + SP.cls(x.classId).label + '</div>' }, { h: 'Questions', f: x => SP.quizTotal(x) + (x.mins ? ' · ' + x.mins + ' min' : '') },
      { h: 'Attempted', f: x => x.status === 'draft' ? '<span class="muted">—</span>' : '<div class="qbar in"><i style="width:' + pct(x.stt.done, x.stt.n) + '%"></i></div> ' + x.stt.done + '/' + x.stt.n },
      { h: 'Average', f: x => x.stt.done ? x.stt.avg + '%' : '<span class="muted">—</span>' }, { h: 'Status', f: x => qStatePill(x) + (x.close && x.status === 'live' ? '<div class="s">closes ' + D.nice(x.close) + '</div>' : '') },
      { h: '', cls: 'r', f: x => SP.btn(x.status === 'draft' ? 'Publish' : 'Results', x.status === 'draft' ? 'qzPublish' : 'qzOpen', { c: 'sm ' + (x.status === 'draft' ? 'pri' : ''), d: { id: x.id } }) }
    ], rows, { per: 9, row: 'qzOpen', tourRow: 'qz-row', empty: 'No quizzes yet' });
};
SP.act.qzOpen = d => SP.openModal('quizres', { id: d.id });
SP.modals.quizres = function (a) {
  const q = SP.quiz(a.id), st = SP.quizStats(q), tot = SP.quizTotal(q), rows = st.rows.filter(r => r.a).sort((x, y) => y.a.score - x.a.score);
  let qa = '';
  if (q.qs && st.done) qa = '<h4>Question analysis</h4>' + q.qs.map((qq, i) => { const ok = rows.filter(r => r.a.ans && r.a.ans[i] === qq.a).length, n = rows.filter(r => r.a.ans).length; return '<div class="qrow"><div><b>Q' + (i + 1) + '. ' + esc(qq.q) + '</b></div><div class="qbar"><i style="width:' + pct(ok, n) + '%"></i></div><b>' + pct(ok, n) + '%</b></div>'; }).join('');
  return '<div class="m-h"><div><h3>' + esc(q.title) + '</h3><div class="s">' + SP.cls(q.classId).label + ' · ' + esc(q.subject) + ' · ' + qStatePill(q) + '</div></div>' + xbtn + '</div><div class="m-b">' +
    '<div class="mini3"><div><span>Attempted</span><b>' + st.done + '/' + st.n + '</b></div><div><span>Average</span><b>' + (st.done ? st.avg + '%' : '—') + '</b></div><div><span>High / low</span><b>' + (st.done ? st.hi + ' / ' + st.lo : '—') + '</b></div></div>' + qa +
    '<h4>Students</h4>' + (rows.map(r => '<div class="qrow"><div>' + SP.person(r.s.name, r.a.ts ? D.niceTs(r.a.ts) : '', 'sm') + '</div><div class="qbar"><i style="width:' + pct(r.a.score, tot) + '%"></i></div><b>' + r.a.score + '/' + tot + '</b></div>').join('') || SP.empty('No attempts yet', 'Students will appear here as they finish the quiz.')) + '</div>' +
    '<div class="m-f">' + (q.status === 'live' ? SP.btn('Simulate class attempts', 'qzSim', { d: { id: q.id }, tour: 'qz-sim' }) + SP.btn('Close quiz', 'qzClose', { d: { id: q.id } }) : q.status === 'closed' && !q.seeded ? SP.btn('Reopen', 'qzClose', { d: { id: q.id } }) : '') + SP.btn('Done', 'closeModal', { c: 'pri' }) + '</div>';
};
SP.modals.quizres.wide = true;
const rawQ = id => SP.S.qz.find(x => x.id === id);
SP.act.qzClose = d => { const q = rawQ(d.id); if (!q) return; q.status = q.status === 'live' ? 'closed' : 'live'; SP.toast('Quiz ' + (q.status === 'live' ? 'reopened' : 'closed')); SP.render(); };
SP.act.qzSim = d => {
  const q = rawQ(d.id), S = SP.S; let n = 0; if (!q) return; const att = S.att2[q.id] = S.att2[q.id] || {};
  SP.inClass(q.classId).forEach(s => { if (att[s.id] || SP.isDemoKid(s.id)) return; const ans = q.qs.map((qq, i) => SP.hash01(q.id + s.id + i) < .35 + s.ability * .6 ? qq.a : (qq.a + 1 + i % 3) % 4); att[s.id] = { ans, score: ans.filter((x, i) => x === q.qs[i].a).length, ts: TODAY + ' 09:' + SP.pad(10 + n % 45), secs: 200 + n * 7 }; n++; });
  SP.toast(n + ' student attempts added (demo)'); SP.render();
};
SP.act.qzPublish = d => { const q = rawQ(d.id); if (!q) return; q.status = 'live'; announceQuiz(q); SP.render(); };
function announceQuiz(q) {
  SP.inClass(q.classId).forEach(s => SP.notify([s.id], { kind: 'quiz', title: 'New quiz: ' + q.title, body: q.subject + ' · ' + q.qs.length + ' questions · ' + q.mins + ' min · closes ' + D.nice(q.close), ref: q.id }));
  SP.deliver({ title: 'Quiz · ' + SP.cls(q.classId).label, total: SP.inClass(q.classId).length, channels: ['push'], note: 'Students and parents notified' });
}

/* ---- quiz builder ---- */
SP.act.newQuiz = () => { const c = myClasses()[0]; SP.ui.qb = { classId: c, subject: mySubjects(c)[0], title: '', mins: 10, close: D.add(TODAY, 3), showAns: true, qs: [] }; SP.openModal('newquiz', {}); };
SP.inp.qbf = (v, el, d) => { SP.ui.qb[d.k] = d.k === 'mins' ? +v : d.k === 'showAns' ? el.checked : v; if (d.k === 'classId') SP.ui.qb.subject = mySubjects(v)[0]; if (el.tagName === 'SELECT' || el.type === 'checkbox') SP.render(); };
SP.inp.qbq = (v, el, d) => { const q = SP.ui.qb.qs[+d.i]; if (d.k === 'q') q.q = v; else q.o[+d.o] = v; };
SP.inp.qbc = (v, el, d) => { SP.ui.qb.qs[+d.i].a = +d.o; };
SP.act.qbAdd = () => { SP.ui.qb.qs.push({ q: '', o: ['', '', '', ''], a: 0 }); SP.render(); };
SP.act.qbDel = d => { SP.ui.qb.qs.splice(+d.i, 1); SP.render(); };
SP.act.qbSuggest = () => { const b = SP.ui.qb; b.qs = b.qs.filter(q => q.q).concat(SP.questionsFor(b.subject, SP.cls(b.classId).grade, 5, b.qs.length + 1)); if (!b.title) b.title = b.subject + ' — chapter check'; SP.render(); };
SP.modals.newquiz = function () {
  const b = SP.ui.qb, sel = (k, opts, cur) => '<select class="input" data-ch="qbf" data-k="' + k + '">' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
  return '<div class="m-h"><h3>New quiz</h3>' + xbtn + '</div><div class="m-b"><div class="row2"><div class="field"><label>Class</label>' + sel('classId', clsOpts(), b.classId) + '</div><div class="field"><label>Subject</label>' + sel('subject', mySubjects(b.classId).map(s => [s, s]), b.subject) + '</div></div>' +
    '<div class="field"><label>Quiz title</label><input class="input" data-in="qbf" data-k="title" value="' + esc(b.title) + '" placeholder="e.g. Chapter 4 check" autocomplete="off"></div>' +
    '<div class="row2"><div class="field"><label>Time allowed (minutes)</label>' + sel('mins', [5, 10, 15, 20, 30].map(m => [m, m + ' minutes']), b.mins) + '</div><div class="field"><label>Closes on</label><input type="date" class="input" data-in="qbf" data-k="close" value="' + b.close + '"></div></div>' +
    '<div class="checks" style="margin-bottom:8px"><label class="chk"><input type="checkbox" data-ch="qbf" data-k="showAns"' + (b.showAns ? ' checked' : '') + '> Show correct answers after submission</label></div>' +
    '<div class="row-c" style="margin:14px 0 6px"><h4 style="margin:0">Questions (' + b.qs.length + ')</h4><span class="grow"></span>' + SP.btn('Suggest 5 from question bank', 'qbSuggest', { c: 'sm', i: 'wand', tour: 'qb-suggest' }) + SP.btn('Add question', 'qbAdd', { c: 'sm', i: 'plus' }) + '</div>' +
    (b.qs.map((q, i) => '<div class="qcard"><div class="row-c" style="gap:8px"><b>Q' + (i + 1) + '</b><input class="input" data-in="qbq" data-i="' + i + '" data-k="q" value="' + esc(q.q) + '" placeholder="Question" autocomplete="off"><button class="btn ghost icon" data-act="qbDel" data-i="' + i + '">' + I('trash') + '</button></div>' +
      '<div class="qopts">' + q.o.map((o, j) => '<label class="qopt"><input type="radio" name="qa' + i + '" data-ch="qbc" data-i="' + i + '" data-o="' + j + '"' + (q.a === j ? ' checked' : '') + '><input class="input sm" data-in="qbq" data-i="' + i + '" data-o="' + j + '" data-k="o" value="' + esc(o) + '" placeholder="Option ' + 'ABCD'[j] + '" autocomplete="off"></label>').join('') + '</div></div>').join('') || '<div class="note">' + I('help') + '<span>No questions yet. Add your own or pull five from the question bank, then edit them.</span></div>') +
    '</div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Save draft', 'qbSave', { d: { pub: '' } }) + SP.btn('Publish to students', 'qbSave', { c: 'pri', i: 'send', d: { pub: '1' }, tour: 'qb-publish' }) + '</div>';
};
SP.modals.newquiz.wide = true;
SP.act.qbSave = d => {
  const b = SP.ui.qb, S = SP.S; if (!b.qs.length) return SP.toast('Add at least one question', 'warn');
  if (b.qs.some(q => !q.q.trim() || q.o.some(o => !o.trim()))) return SP.toast('Every question needs text and four options', 'warn');
  const q = { id: SP.uid('QZ'), classId: b.classId, subject: b.subject, title: b.title || (b.subject + ' quiz'), mins: b.mins, status: d.pub ? 'live' : 'draft', date: TODAY, close: b.close, qs: b.qs, showAns: b.showAns, teacherId: tid() || SP.ALLOC[b.classId][b.subject] };
  S.qz.unshift(q); if (d.pub) announceQuiz(q); SP.ui.modal = null; SP.ui.f.qz_s = ''; SP.toast(d.pub ? 'Quiz published to ' + SP.cls(q.classId).label : 'Quiz saved as draft'); SP.render();
};

/* =============================== NOTES + RESOURCES =============================== */
const noteRows = () => { const t = tid(), c = SP.f('nt_c'), sb = SP.f('nt_s'), q = SP.f('nt_q').toLowerCase(); return SP.allNotes().filter(n => !SP.S.notesDel[n.id] && (!t || n.teacherId === t) && (!c || n.classId === c) && (!sb || n.subject === sb) && (!q || (n.title + n.chapter).toLowerCase().indexOf(q) > -1)).sort((a, b) => b.ts.localeCompare(a.ts)); };
const fileIcon = k => '<span class="fic" style="--c:' + SP.KIND[k][2] + '">' + I(SP.KIND[k][1]) + '</span>';
P['admin.notes'] = function () {
  const tab = SP.f('nt_tab', 'notes'), t = tid();
  const tabs = SP.tabs([{ k: 'notes', label: 'Subject notes' }, { k: 'res', label: 'Resource library' }], tab, 'ntTab');
  let body;
  if (tab === 'notes') {
    const rows = noteRows();
    body = '<div class="toolbar">' + SP.search('nt_q', 'Search notes') + SP.select('nt_c', clsOpts('All classes'), SP.f('nt_c')) + SP.select('nt_s', subOpts('All subjects'), SP.f('nt_s')) + '<div class="grow"></div>' + SP.btn('Upload notes', 'upNote', { i: 'upload', c: 'pri', tour: 'nt-up' }) + '</div>' +
      SP.table('notes', [
        { h: 'Note', cls: 'wrap', f: n => '<div class="person">' + fileIcon(n.kind) + '<div class="pn"><div class="n">' + esc(n.title) + '</div><div class="s">' + esc(n.subject) + ' · ' + SP.cls(n.classId).label + ' · ' + esc(n.chapter) + '</div></div></div>' },
        { h: 'Type', f: n => SP.KIND[n.kind][0] + (n.size ? '<div class="s">' + n.size + '</div>' : '') }, { h: 'Uploaded', f: n => D.niceTs(n.ts) + '<div class="s">' + esc(teacherName(n.teacherId)) + '</div>' }, { h: 'Views', f: n => '<span class="mono">' + (n.views + (SP.S.views[n.id] || 0)) + '</span>' },
        { h: '', cls: 'r', f: n => SP.btn('Open', 'docOpen', { c: 'sm', d: { k: 'note', id: n.id } }) + SP.btn('', 'noteDel', { c: 'sm icon ghost', i: 'trash', d: { id: n.id } }) }
      ], rows, { per: 10, empty: 'No notes for these filters' });
  } else {
    const cat = SP.f('rs_cat'), q = SP.f('rs_q').toLowerCase(), rows = SP.allRes().filter(r => !SP.S.notesDel[r.id] && (!cat || r.cat === cat) && (!q || r.title.toLowerCase().indexOf(q) > -1));
    body = '<div class="toolbar">' + SP.search('rs_q', 'Search resources') + '<div class="chips">' + [''].concat(SP.RES_CATS).map(c => '<button class="chip ' + (cat === c ? 'on' : '') + '" data-act="setFilter" data-k="rs_cat" data-v="' + esc(c) + '" data-pk="resources">' + (c || 'All') + '</button>').join('') + '</div><div class="grow"></div>' + SP.btn('Upload resource', 'upRes', { i: 'upload', c: 'pri' }) + '</div>' +
      SP.table('resources', [
        { h: 'Resource', cls: 'wrap', f: r => '<div class="person">' + fileIcon(r.kind) + '<div class="pn"><div class="n">' + esc(r.title) + '</div><div class="s">' + esc(r.cat) + (r.subject ? ' · ' + esc(r.subject) : '') + '</div></div></div>' }, { h: 'Visible to', f: r => ({ both: 'Parents & students', parents: 'Parents', students: 'Students' }[r.aud || 'both']) },
        { h: 'Uploaded', f: r => D.nice(r.ts.slice(0, 10)) + '<div class="s">' + esc(r.by) + '</div>' }, { h: 'Downloads', f: r => '<span class="mono">' + (r.dl + (SP.S.views[r.id] || 0)) + '</span>' },
        { h: '', cls: 'r', f: r => SP.btn('Open', 'docOpen', { c: 'sm', d: { k: 'res', id: r.id } }) + SP.btn('', 'noteDel', { c: 'sm icon ghost', i: 'trash', d: { id: r.id } }) }
      ], rows, { per: 10, empty: 'No resources match' });
  }
  return SP.head('Notes & resources', 'Lesson notes per subject, and a shared library for parents and students', '') + tabs + body;
};
SP.act.ntTab = d => { SP.ui.f.nt_tab = d.k; SP.render(); };
SP.act.noteDel = d => { SP.S.notesDel[d.id] = true; SP.toast('Removed'); SP.render(); };
SP.act.docOpen = d => SP.openModal('doc', d);
SP.docItem = (k, id) => (k === 'note' ? SP.allNotes() : SP.allRes()).find(x => x.id === id);
SP.docPreview = function (n, big) {
  if (n.kind === 'video') return '<div class="vprev">' + '<span class="play">' + I('right') + '</span><div class="vbar"><i></i></div></div>';
  if (n.kind === 'link') return '<div class="note">' + I('right') + '<span>This link opens in a new tab in the live app.</span></div>';
  return '<div class="dprev' + (big ? ' big' : '') + '"><div class="dp-h"></div><div class="dp-l w9"></div><div class="dp-l w7"></div><div class="dp-l w8"></div><div class="dp-l w5"></div><div class="dp-b"></div><div class="dp-l w9"></div><div class="dp-l w6"></div></div>';
};
SP.modals.doc = function (a) {
  const n = SP.docItem(a.k, a.id);
  return '<div class="m-h"><div><h3>' + esc(n.title) + '</h3><div class="s">' + SP.KIND[n.kind][0] + (n.size ? ' · ' + n.size : '') + (n.subject ? ' · ' + esc(n.subject) : '') + '</div></div>' + xbtn + '</div><div class="m-b">' + SP.docPreview(n) + '</div><div class="m-f">' + SP.btn('Close', 'closeModal') + SP.btn(n.kind === 'link' ? 'Open link' : 'Download', 'docGet', { c: 'pri', i: n.kind === 'link' ? 'right' : 'dl', d: { id: a.id } }) + '</div>';
};
SP.act.docGet = d => { SP.S.views[d.id] = (SP.S.views[d.id] || 0) + 1; SP.toast('Downloaded (demo)'); SP.render(); };

SP.act.upNote = () => { SP.ui.f.un_c = SP.ui.f.un_c || myClasses()[0]; SP.openModal('upnote', {}); };
const kindOpts = Object.keys(SP.KIND).filter(k => k !== 'img').map(k => '<option value="' + k + '">' + SP.KIND[k][0] + '</option>').join('');
SP.modals.upnote = function () {
  const cid = SP.f('un_c', myClasses()[0]), subs = mySubjects(cid), sb = subs.indexOf(SP.f('un_s')) > -1 ? SP.f('un_s') : subs[0];
  return '<div class="m-h"><h3>Upload notes</h3>' + xbtn + '</div><div class="m-b"><div class="row2"><div class="field"><label>Class</label>' + SP.select('un_c', clsOpts(), cid) + '</div><div class="field"><label>Subject</label>' + SP.select('un_s', subs.map(s => [s, s]), sb) + '</div></div>' +
    '<div class="row2"><div class="field"><label>Chapter / topic</label><input class="input" id="un-ch" value="Chapter 4" autocomplete="off"></div><div class="field"><label>Type</label><select class="input" id="un-k">' + kindOpts + '</select></div></div>' +
    '<div class="field"><label>Title</label><input class="input" id="un-t" value="Photosynthesis — revision notes" autocomplete="off"></div>' +
    '<div class="field"><label>File</label><div class="drop">' + I('upload') + '<div><b>Drag a file here or choose</b><select class="input sm" id="un-f">' + SP.FILES.map(f => '<option>' + f + '</option>').join('') + '</select></div></div></div>' +
    '<div class="checks">' + chk('un-n', 'Notify students of ' + SP.cls(cid).label, true) + '</div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Upload', 'noteSave', { c: 'pri', i: 'upload', tour: 'nt-save' }) + '</div>';
};
SP.act.noteSave = () => {
  const S = SP.S, cid = SP.f('un_c', myClasses()[0]), subs = mySubjects(cid), sb = subs.indexOf(SP.f('un_s')) > -1 ? SP.f('un_s') : subs[0], kind = $v('un-k') || 'pdf', title = $v('un-t') || 'Notes';
  const n = { id: SP.uid('NT'), classId: cid, subject: sb, title, chapter: $v('un-ch') || 'Chapter', kind, size: kind === 'video' ? '24 MB' : kind === 'link' ? '' : '1.2 MB', ts: SP.stamp(), teacherId: tid() || SP.ALLOC[cid][sb], views: 0 };
  S.notes.unshift(n);
  if (document.getElementById('un-n') && document.getElementById('un-n').checked) { SP.inClass(cid).forEach(s => SP.notify([s.id], { kind: 'notes', title: 'New notes: ' + title, body: sb + ' · ' + n.chapter, ref: n.id })); SP.deliver({ title: 'Notes · ' + SP.cls(cid).label, total: SP.inClass(cid).length, channels: ['push'] }); }
  SP.ui.modal = null; SP.ui.f.nt_tab = 'notes'; SP.ui.f.nt_c = ''; SP.ui.f.nt_s = ''; SP.toast('Notes uploaded to ' + SP.cls(cid).label + ' · ' + sb); SP.render();
};
SP.act.upRes = () => SP.openModal('upres', {});
SP.modals.upres = function () {
  return '<div class="m-h"><h3>Upload resource</h3>' + xbtn + '</div><div class="m-b"><div class="field"><label>Title</label><input class="input" id="ur-t" value="Winter break holiday homework" autocomplete="off"></div>' +
    '<div class="row2"><div class="field"><label>Category</label><select class="input" id="ur-c">' + SP.RES_CATS.map(c => '<option>' + c + '</option>').join('') + '</select></div><div class="field"><label>Visible to</label><select class="input" id="ur-a"><option value="both">Parents & students</option><option value="parents">Parents only</option><option value="students">Students only</option></select></div></div>' +
    '<div class="row2"><div class="field"><label>Type</label><select class="input" id="ur-k">' + kindOpts + '</select></div><div class="field"><label>Subject (optional)</label><select class="input" id="ur-s"><option value="">None</option>' + SP.SUBJECTS.map(s => '<option>' + s + '</option>').join('') + '</select></div></div>' +
    '<div class="drop">' + I('upload') + '<div><b>Drag a file here or choose</b><select class="input sm" id="ur-f">' + SP.FILES.map(f => '<option>' + f + '</option>').join('') + '</select></div></div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Upload & notify', 'resSave', { c: 'pri', i: 'upload' }) + '</div>';
};
SP.act.resSave = () => {
  const S = SP.S, kind = $v('ur-k') || 'pdf', r = { id: SP.uid('RS'), title: $v('ur-t') || 'Resource', cat: $v('ur-c'), subject: $v('ur-s'), grade: 0, kind, size: kind === 'link' ? '' : '0.9 MB', ts: SP.stamp(), by: SP.S.persona === 'teacher' ? teacherName(S.teacherId) : 'Academic office', dl: 0, aud: $v('ur-a') || 'both' };
  S.res.unshift(r); SP.STUDENTS.forEach(s => { if (SP.isDemoKid(s.id)) SP.notify([s.id], { kind: 'notes', title: 'New resource: ' + r.title, body: r.cat, ref: r.id, who: r.aud === 'students' ? 'student' : r.aud === 'parents' ? 'parent' : 'both' }); });
  SP.deliver({ title: 'Resource · ' + r.cat, total: SP.PARENTS.length, channels: ['push'] }); SP.ui.modal = null; SP.ui.f.nt_tab = 'res'; SP.render();
};
})();
