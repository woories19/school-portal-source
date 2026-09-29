/* Exams & results, report cards, timetables (with substitute cover), subject workspace. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY, P = SP.pages;
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const tid = () => SP.S.persona === 'teacher' ? SP.S.teacherId : null;
const xbtn = '<button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button>';
const gPill = p => { const g = SP.grade(p); return SP.pill(g[0], g[1]); };
const exStatus = ex => ex.status === 'published' ? SP.pill('Published', 'green') : ex.status === 'marking' ? SP.pill('Marking in progress', 'amber') : SP.pill('Upcoming', 'blue');
const pairsAll = () => { const o = []; SP.CLASSES.forEach(c => SP.SUBJECTS.forEach(s => o.push({ classId: c.id, subject: s }))); return o; };
const progress = ex => { const all = pairsAll(), done = all.filter(p => SP.entered(ex, p.classId, p.subject)).length; return { done, n: all.length, pct: pct(done, all.length) }; };
SP.pairsAll = pairsAll;
SP.marksPending = () => { const ex = SP.exam('E2'); return ex && ex.status === 'marking' ? pairsAll().filter(p => !SP.entered(ex, p.classId, p.subject)).length : 0; };
const allowedPairs = () => tid() ? SP.teachPairs(tid()) : pairsAll();
SP.SCHOOL_NAME = 'Greenfield Public School';

/* ---------- datesheet ---------- */
function datesheet(ex) {
  const days = []; let d = ex.from || (ex.id === 'E2' ? '2026-09-21' : '2026-08-17'), end = ex.to || (ex.id === 'E2' ? '2026-09-25' : '2026-08-21');
  for (; d <= end; d = D.add(d, 1)) if (D.isSchoolDay(d)) days.push(d);
  const subs = SP.SUBJECTS.slice(), per = Math.ceil(subs.length / days.length), out = [];
  days.forEach((dd, i) => subs.slice(i * per, i * per + per).forEach(s => out.push({ date: dd, subject: s, time: ex.total === 100 ? '08:30 – 10:30' : '08:30 – 09:30' })));
  return out;
}
SP.datesheet = datesheet;

/* =============================== EXAMS PAGE =============================== */
P['admin.exams'] = function () {
  const S = SP.S, sel = SP.f('ex_id', 'E2'), ex = SP.exam(sel), tab = SP.f('ex_tab', ex.status === 'upcoming' ? 'dates' : ex.status === 'marking' ? 'marks' : 'results'), t = tid();
  const cards = S.exams.map(e => { const pr = progress(e); return '<button class="excard ' + (e.id === sel ? 'sel' : '') + '" data-act="exPick" data-id="' + e.id + '" ' + (e.id === 'E2' ? 'data-tour="ex-e2"' : '') + '><div class="row-c" style="gap:8px;justify-content:space-between;width:100%"><b>' + esc(e.name) + '</b>' + exStatus(e) + '</div><span>' + esc(e.period) + ' · out of ' + e.total + '</span>' +
    (e.status === 'marking' ? '<div class="qbar" style="margin-top:8px"><i style="width:' + pr.pct + '%"></i></div><span class="s">' + pr.done + ' of ' + pr.n + ' class-subjects marked</span>' : e.status === 'published' ? '<span class="s">Results published to parents & students</span>' : '<span class="s">Datesheet ready</span>') + '</button>'; }).join('');
  const tabs = SP.tabs([{ k: 'marks', label: 'Marks entry' }, { k: 'results', label: 'Results' }, { k: 'dates', label: 'Datesheet' }], tab, 'exTab');
  let body;
  if (tab === 'marks') body = marksEntry(ex);
  else if (tab === 'results') body = results(ex);
  else body = SP.table('ds', [{ h: 'Date', f: r => D.long(r.date) }, { h: 'Subject', f: r => '<b>' + esc(r.subject) + '</b>' }, { h: 'Time', f: r => r.time }, { h: 'Duration', f: r => ex.total === 100 ? '2 hours' : '1 hour' }, { h: 'Grades', f: r => 'All grades' }], datesheet(ex).map((r, i) => Object.assign({ id: 'ds' + i }, r)), { per: 12 });
  const pr = progress(ex), canPublish = !t && ex.status === 'marking';
  return SP.head('Exams & results', t ? 'Enter marks for your subjects' : 'Term exams, marks entry, results and report cards',
    (canPublish ? SP.btn('Fill remaining marks (demo)', 'exFill', { d: { id: ex.id }, tour: 'ex-fill', dis: pr.pct === 100 }) + SP.btn('Publish results', 'exPublishModal', { c: 'pri', i: 'send', d: { id: ex.id }, dis: pr.pct < 100, tour: 'ex-publish' }) : '')) +
    '<div class="excards">' + cards + '</div>' + tabs + body;
};
SP.act.exPick = d => { SP.ui.f.ex_id = d.id; const e = SP.exam(d.id); SP.ui.f.ex_tab = e.status === 'upcoming' ? 'dates' : e.status === 'marking' ? 'marks' : 'results'; SP.render(); };
SP.act.exTab = d => { SP.ui.f.ex_tab = d.k; SP.render(); };

/* ---- marks entry ---- */
SP.ui.mkd = {};
function marksEntry(ex) {
  if (ex.status === 'upcoming') return SP.empty('Marks entry opens after the exam', 'Datesheet is available on the next tab.');
  const pairs = allowedPairs(), t = tid();
  const cid = SP.f('mk_c') && pairs.some(p => p.classId === SP.f('mk_c')) ? SP.f('mk_c') : pairs[0].classId;
  const subs = pairs.filter(p => p.classId === cid).map(p => p.subject), sb = subs.indexOf(SP.f('mk_s')) > -1 ? SP.f('mk_s') : subs[0];
  const studs = SP.inClass(cid), done = SP.entered(ex, cid, sb) && ex.status !== 'published', key = ex.id + '|' + cid + '|' + sb, dr = SP.ui.mkd[key] = SP.ui.mkd[key] || {};
  const editable = ex.status === 'marking';
  const matrix = t ? '' : '<h4 style="margin:22px 0 8px">Progress by class</h4><div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl matrix"><thead><tr><th>Class</th>' + SP.SUBJECTS.map(s => '<th class="c">' + s.split(' ')[0] + '</th>').join('') + '</tr></thead><tbody>' +
    SP.CLASSES.map(c => '<tr><td><b>' + c.label + '</b></td>' + SP.SUBJECTS.map(s => '<td class="c"><button class="mkcell ' + (SP.entered(ex, c.id, s) ? 'ok' : '') + '" data-act="mkPick" data-c="' + c.id + '" data-s="' + esc(s) + '" title="' + c.label + ' · ' + s + '">' + (SP.entered(ex, c.id, s) ? I('check') : '') + '</button></td>').join('') + '</tr>').join('') + '</tbody></table></div></div>';
  return '<div class="toolbar">' + SP.select('mk_c', pairs.map(p => p.classId).filter((v, i, a) => a.indexOf(v) === i).map(id => [id, SP.cls(id).label]), cid) + SP.select('mk_s', subs.map(s => [s, s]), sb) +
    (done ? SP.pill('Marks saved', 'green') : SP.pill('Pending', 'amber')) + '<div class="grow"></div>' + (editable ? SP.btn('Auto-fill demo marks', 'mkAuto', { d: { key: key, c: cid, s: sb }, i: 'wand', tour: 'mk-auto' }) : '') + '</div>' +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Roll</th><th>Student</th><th class="r">Marks (out of ' + ex.total + ')</th><th>Grade</th></tr></thead><tbody>' +
    studs.map(s => { const cur = dr[s.id] != null ? dr[s.id] : SP.markOf(ex, s, sb), p = cur == null || cur === '' ? null : pct(+cur, ex.total); return '<tr><td class="mono">' + s.roll + '</td><td>' + SP.person(s.name, s.admNo, 'sm') + '</td><td class="r"><input class="input sm mkin" type="number" min="0" max="' + ex.total + '" ' + (editable ? '' : 'disabled') + ' data-in="mk" data-key="' + key + '" data-s="' + s.id + '" data-t="' + ex.total + '" value="' + (cur == null ? '' : cur) + '"></td><td id="g-' + s.id + '">' + (p == null ? '<span class="muted">—</span>' : gPill(p)) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
    (editable ? '<div class="sticky-act">' + SP.btn('Save marks for ' + SP.cls(cid).short + ' · ' + sb, 'mkSave', { c: 'pri', i: 'check', d: { key, c: cid, s: sb }, tour: 'mk-save' }) + '</div>' : '') + matrix;
}
SP.inp.mk = (v, el, d) => {
  const n = v === '' ? null : Math.max(0, Math.min(+d.t, +v)); (SP.ui.mkd[d.key] = SP.ui.mkd[d.key] || {})[d.s] = n;
  const g = document.getElementById('g-' + d.s); if (g) g.innerHTML = n == null ? '<span class="muted">—</span>' : gPill(pct(n, +d.t));
};
SP.act.mkPick = d => { SP.ui.f.mk_c = d.c; SP.ui.f.mk_s = d.s; SP.render(); };
SP.act.mkAuto = d => {
  const ex = SP.exam(SP.f('ex_id', 'E2')), dr = SP.ui.mkd[d.key] = SP.ui.mkd[d.key] || {};
  SP.inClass(d.c).forEach(s => { dr[s.id] = SP.markDerive(ex, s, d.s); });
  SP.render();
};
SP.act.mkSave = d => {
  const S = SP.S, ex = SP.exam(SP.f('ex_id', 'E2')), dr = SP.ui.mkd[d.key] || {}; let n = 0;
  SP.inClass(d.c).forEach(s => { const v = dr[s.id] != null ? dr[s.id] : SP.markOf(ex, s, d.s); if (v == null) return; (S.marks[ex.id] = S.marks[ex.id] || {})[s.id] = Object.assign((S.marks[ex.id][s.id] || {}), { [d.s]: +v }); n++; });
  if (!n) return SP.toast('Enter at least one mark first', 'warn');
  S.markSaved[ex.id + '|' + d.c + '|' + d.s] = true; delete SP.ui.mkd[d.key]; SP.toast('Marks saved · ' + SP.cls(d.c).label + ' · ' + d.s + ' (' + n + ' students)'); SP.render();
};
SP.act.exFill = d => {
  const ex = SP.exam(d.id), S = SP.S; let n = 0;
  pairsAll().forEach(p => { const k = ex.id + '|' + p.classId + '|' + p.subject; if (!SP.entered(ex, p.classId, p.subject)) { S.markSaved[k] = true; n++; } });
  SP.toast(n + ' class-subjects filled with demo marks'); SP.render();
};

/* ---- results ---- */
function results(ex) {
  if (ex.status === 'upcoming') return SP.empty('No results yet', 'Results appear after the exam.');
  const cid = SP.f('rs_c', 'ALL') === 'ALL' ? SP.CLASSES[0].id : SP.f('rs_c'), studs = SP.inClass(cid);
  const rows = studs.map(s => Object.assign({ s, id: s.id }, SP.examCard(ex, s))).sort((a, b) => b.pct - a.pct), full = rows.every(r => r.complete);
  const avg = pct(rows.reduce((n, r) => n + r.pct, 0), rows.length * 100), pass = pct(rows.filter(r => r.pct >= 40).length, rows.length);
  return '<div class="toolbar">' + SP.select('rs_c', SP.classOptions(), cid) + '<div class="grow"></div>' + SP.btn('Export CSV', 'exCsv', { i: 'dl', c: 'sm', d: { c: cid } }) + '</div>' +
    (full ? '' : '<div class="note">' + I('alert') + '<span>Some subjects for this class are still being marked, so totals are provisional.</span></div>') +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Class average', value: avg + '%', sub: SP.cls(cid).label }) + SP.tile({ label: 'Pass rate', value: pass + '%', sub: '40% and above' }) + SP.tile({ label: 'Top student', value: esc(rows[0].s.first), sub: rows[0].pct + '%' }) + SP.tile({ label: 'Needs support', value: rows.filter(r => r.pct < 50).length, tone: rows.filter(r => r.pct < 50).length ? 'amber' : '', sub: 'Below 50%' }) + '</div>' +
    SP.table('exres', [{ h: 'Rank', f: (r, i) => '<b>' + (i + 1) + '</b>' }, { h: 'Student', f: r => SP.person(r.s.name, r.s.admNo, 'sm') }, { h: 'Total', cls: 'mono', f: r => r.tot + ' / ' + r.max }, { h: 'Percentage', f: r => '<div class="qbar in"><i style="width:' + r.pct + '%"></i></div> ' + r.pct + '%' }, { h: 'Grade', f: r => gPill(r.pct) },
      { h: '', cls: 'r', f: r => SP.btn('Report card', 'rcOpen', { c: 'sm', d: { ex: ex.id, sid: r.s.id } }) }], rows, { per: 12 });
}
SP.act.exCsv = d => { const ex = SP.exam(SP.f('ex_id', 'E2')); SP.csv(ex.name.replace(/ /g, '-') + '-' + d.c + '.csv', ['Roll', 'Student'].concat(SP.SUBJECTS, ['Total', '%', 'Grade']), SP.inClass(d.c).map(s => { const c = SP.examCard(ex, s); return [s.roll, s.name].concat(c.rows.map(r => r.m == null ? '' : r.m), [c.tot, c.pct, c.grade[0]]); })); };

/* ---- publish ---- */
SP.act.exPublishModal = d => SP.openModal('publish', { id: d.id });
SP.modals.publish = function (a) {
  const ex = SP.exam(a.id), all = SP.STUDENTS.map(s => SP.examCard(ex, s)), avg = pct(all.reduce((n, c) => n + c.pct, 0), all.length * 100), pass = pct(all.filter(c => c.pct >= 40).length, all.length);
  return '<div class="m-h"><h3>Publish ' + esc(ex.name) + ' results</h3>' + xbtn + '</div><div class="m-b"><div class="summary"><div><span>Students</span><b>' + all.length + '</b></div><div><span>School average</span><b>' + avg + '%</b></div><div><span>Pass rate</span><b>' + pass + '%</b></div></div>' +
    '<div class="note ok">' + I('check') + '<span>All 128 class-subjects are marked. Results become visible in the parent and student apps immediately.</span></div><div class="checks" style="margin-top:12px"><label class="chk"><input type="checkbox" checked disabled> Push notification to parents & students</label><label class="chk"><input type="checkbox" checked disabled> WhatsApp with report card PDF</label></div></div>' +
    '<div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Publish results', 'exPublish', { c: 'pri', i: 'send', d: { id: ex.id }, tour: 'ex-go' }) + '</div>';
};
SP.act.exPublish = d => {
  const ex = SP.exam(d.id); ex.status = 'published';
  SP.STUDENTS.forEach(s => { const c = SP.examCard(ex, s); SP.notify([s.id], { kind: 'result', title: ex.name + ' results are out', body: s.first + ' scored ' + c.pct + '% (grade ' + c.grade[0] + '). Open Results to see the report card.', ref: ex.id }); });
  SP.deliver({ title: ex.name + ' report cards', total: SP.PARENTS.length, channels: ['push', 'whatsapp'], note: 'Report card PDF attached to each WhatsApp message' });
  SP.ui.modal = null; SP.ui.f.ex_tab = 'results'; SP.render();
};

/* ---- report card ---- */
SP.reportCardHtml = function (ex, s) {
  const c = SP.examCard(ex, s), r = SP.classRank(ex, s), cl = SP.cls(s.classId), par = SP.parent(s.parentId);
  return '<div class="voucher rcard"><div class="vd-h"><div>' + SP.logo() + '<div><b>' + SP.SCHOOL_NAME + '</b><span>Progress report · ' + esc(ex.name) + ' · ' + esc(ex.period) + '</span></div></div><div class="vd-no"><span>Adm. no.</span><b>' + s.admNo + '</b></div></div>' +
    '<div class="vd-meta"><div><span>Student</span><b>' + esc(s.name) + '</b></div><div><span>Class / Roll</span><b>' + cl.label + ' / ' + s.roll + '</b></div><div><span>Guardian</span><b>' + esc(par.name) + '</b></div><div><span>Attendance (30 days)</span><b>' + SP.attPct(s.id, 30) + '%</b></div></div>' +
    '<table class="vd-t"><thead><tr><th>Subject</th><th class="r">Marks</th><th class="r">Out of</th><th class="r">%</th><th>Grade</th></tr></thead><tbody>' + c.rows.map(x => { const p = x.m == null ? null : pct(x.m, ex.total); return '<tr><td>' + esc(x.sub) + '</td><td class="r mono">' + (x.m == null ? '—' : x.m) + '</td><td class="r mono">' + ex.total + '</td><td class="r mono">' + (p == null ? '—' : p + '%') + '</td><td>' + (p == null ? '' : gPill(p)) + '</td></tr>'; }).join('') +
    '<tr class="tot"><td>Total</td><td class="r mono">' + c.tot + '</td><td class="r mono">' + c.max + '</td><td class="r mono">' + c.pct + '%</td><td>' + gPill(c.pct) + '</td></tr></tbody></table>' +
    '<div class="rc-sum"><div><span>Position in class</span><b>' + r.pos + ' of ' + r.of + '</b></div><div><span>Overall grade</span><b>' + c.grade[0] + '</b></div><div><span>Result</span><b>' + (c.pct >= 40 ? 'Pass' : 'Needs improvement') + '</b></div></div>' +
    '<p class="rc-rem"><b>Class teacher\'s remarks:</b> ' + SP.remark(c.pct) + '</p><div class="rc-sign"><div><i></i>Class teacher</div><div><i></i>Principal</div><div><i></i>Parent</div></div></div>';
};
SP.act.rcOpen = d => SP.openModal('reportcard', d);
SP.modals.reportcard = function (a) { return SP.reportCardHtml(SP.exam(a.ex), SP.stu(a.sid)) + '<div class="m-f no-print">' + SP.btn('Close', 'closeModal') + SP.btn('Print', 'print', { i: 'print' }) + '</div>'; };
SP.modals.reportcard.wide = true;

/* =============================== TIMETABLES =============================== */
const DN = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
P['admin.timetable'] = function () {
  const cid = SP.f('tt_c', SP.CLASSES[0].id), today = D.dow(TODAY), c = SP.cls(cid);
  const grid = SP.PERIODS.map((p, i) => '<tr class="' + (p[2] ? 'brk' : '') + '"><th class="ttp">' + p[0] + '<span>' + p[1] + '</span></th>' + (p[2] ? '<td colspan="5" class="c muted">Break</td>' : [1, 2, 3, 4, 5].map(d => { const x = SP.timetable(cid, d)[i], sub = SP.S.subst[cid + '|' + d + '|' + x.from]; return '<td class="' + (d === today ? 'today' : '') + '"><b>' + x.subject + '</b><span>' + esc(SP.teacher(sub && d === today ? sub : x.teacherId).name) + (sub && d === today ? ' <i class="subtag">cover</i>' : '') + '</span></td>'; }).join('')) + '</tr>').join('');
  return SP.head('Timetables', 'Class timetables and daily cover', SP.btn('Print', 'print', { i: 'print', c: 'sm' })) +
    '<div class="toolbar">' + SP.select('tt_c', SP.classOptions(), cid) + '<span class="muted">Class teacher: ' + esc(SP.teacher(c.teacherId).name) + '</span></div>' +
    '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl ttgrid"><thead><tr><th></th>' + [1, 2, 3, 4, 5].map(d => '<th class="' + (d === today ? 'today' : '') + '">' + DN[d] + (d === today ? ' · today' : '') + '</th>').join('') + '</tr></thead><tbody>' + grid + '</tbody></table></div></div>' + coverCard();
};
// periods today that lack a teacher (absent / on leave) and the teachers who are free then
function coverNeeds() {
  const day = D.dow(TODAY), out = [], busy = {};
  SP.CLASSES.forEach(c => SP.timetable(c.id, day).forEach(p => { if (p.teacherId) (busy[p.from] = busy[p.from] || {})[p.teacherId] = c.id; }));
  SP.CLASSES.forEach(c => SP.timetable(c.id, day).forEach(p => { if (!p.teacherId) return; const st = SP.staffToday(p.teacherId); if (st === 'A' || st === 'L') out.push({ id: c.id + '|' + day + '|' + p.from, c, p, free: SP.TEACHERS.filter(t => { const s = SP.staffToday(t.id); return s !== 'A' && s !== 'L' && !(busy[p.from] || {})[t.id] && !Object.keys(SP.S.subst).some(k => SP.S.subst[k] === t.id && k.split('|')[2] === p.from); }) }); }));
  return out;
}
function coverCard() {
  const needs = coverNeeds(), open = needs.filter(n => !SP.S.subst[n.id]);
  return '<section class="card"><div class="card-h"><h3>Cover needed today</h3>' + SP.pill(open.length ? open.length + ' unassigned' : 'All covered', open.length ? 'amber' : 'green') + '</div><div class="card-b">' +
    (needs.length ? needs.map(n => '<div class="vrow"><div><b>' + n.c.label + ' · ' + n.p.subject + '</b><span>' + n.p.from + '–' + n.p.to + ' · ' + esc(SP.teacher(n.p.teacherId).name) + ' is ' + (SP.staffToday(n.p.teacherId) === 'A' ? 'absent' : 'on leave') + '</span></div><div>' +
      (SP.S.subst[n.id] ? SP.pill(esc(SP.teacher(SP.S.subst[n.id]).name.split(' ')[0]) + ' covers', 'green') : '<select class="input sm" id="cv-' + esc(n.id.replace(/\|/g, '_')) + '">' + n.free.slice(0, 8).map(t => '<option value="' + t.id + '">' + esc(t.name) + '</option>').join('') + '</select>') + '</div><div>' + (SP.S.subst[n.id] ? '' : SP.btn('Assign', 'coverAssign', { c: 'sm pri', d: { id: n.id } })) + '</div></div>').join('') : SP.empty('No cover needed', 'All teachers are in today.')) + '</div></section>';
}
SP.act.coverAssign = d => {
  const el = document.getElementById('cv-' + d.id.replace(/\|/g, '_')); if (!el) return; SP.S.subst[d.id] = el.value;
  const cid = d.id.split('|')[0]; SP.inClass(cid).forEach(s => SP.notify([s.id], { kind: 'timetable', title: 'Substitute teacher today', body: SP.cls(cid).label + ' — ' + SP.teacher(el.value).name + ' will take the period.', who: 'both' }));
  SP.toast(SP.teacher(el.value).name + ' assigned as cover · class notified'); SP.render();
};

/* =============================== SUBJECTS & CLASSES =============================== */
function subjStats(cid, sb) {
  const as = SP.allAssign().filter(a => a.classId === cid && a.subject === sb), qz = SP.allQuizzes().filter(q => q.classId === cid && q.subject === sb), nt = SP.allNotes().filter(n => n.classId === cid && n.subject === sb && !SP.S.notesDel[n.id]);
  const e1 = SP.exam("E1"), studs = SP.inClass(cid), em = pct(studs.reduce((n, s) => n + SP.markOf(e1, s, sb), 0), studs.length * e1.total);
  return { as, qz, nt, activeAs: as.filter(a => SP.assignState(a) !== 'closed').length, liveQz: qz.filter(q => q.status === 'live').length, exam: em };
}
P['admin.academics'] = function () {
  const t = tid();
  if (t) {
    const pairs = SP.teachPairs(t);
    return SP.head('My subjects', pairs.length + ' class-subjects · everything for a subject in one workspace', '') + '<div class="g3 wk">' + pairs.map(p => { const st = subjStats(p.classId, p.subject); return '<button class="subcard" data-act="subjOpen" data-c="' + p.classId + '" data-s="' + esc(p.subject) + '"><b>' + esc(p.subject) + '</b><span>' + SP.cls(p.classId).label + ' · ' + SP.inClass(p.classId).length + ' students</span><div class="sc-stats"><div><b>' + st.activeAs + '</b>assignments</div><div><b>' + st.liveQz + '</b>live quiz</div><div><b>' + st.nt.length + '</b>notes</div><div><b>' + st.exam + '%</b>last exam</div></div></button>'; }).join('') + '</div>';
  }
  return SP.head('Subjects & classes', 'Who teaches what — open any cell for the subject workspace', '') +
    '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl matrix"><thead><tr><th>Class</th>' + SP.SUBJECTS.map(s => '<th>' + s + '</th>').join('') + '</tr></thead><tbody>' +
    SP.CLASSES.map((c, i) => '<tr><td><b>' + c.label + '</b><div class="s">' + esc(SP.teacher(c.teacherId).name) + '</div></td>' + SP.SUBJECTS.map(s => { const tt = SP.teacher(SP.ALLOC[c.id][s]); return '<td><button class="alloc" data-act="subjOpen" data-c="' + c.id + '" data-s="' + esc(s) + '" ' + (i === 0 && s === 'English' ? 'data-tour="subj-cell"' : '') + '>' + esc(tt.name.split(' ')[0]) + ' ' + esc(tt.name.split(' ')[1][0]) + '.</button></td>'; }).join('') + '</tr>').join('') + '</tbody></table></div></div>';
};
SP.act.subjOpen = d => { SP.ui.f.sj_tab = 'ov'; SP.openDrawer('subject', { c: d.c, s: d.s }); };
SP.act.sjTab = d => { SP.ui.f.sj_tab = d.k; SP.render(); };
SP.drawers.subject = function (a) {
  const cid = a.c, sb = a.s, c = SP.cls(cid), tch = SP.teacher(SP.ALLOC[cid][sb]), st = subjStats(cid, sb), tab = SP.f('sj_tab', 'ov'), studs = SP.inClass(cid);
  const tabs = SP.tabs([{ k: 'ov', label: 'Overview' }, { k: 'st', label: 'Students', n: studs.length }], tab, 'sjTab');
  let body;
  if (tab === 'ov') {
    const mod = (ic, title, line, btns) => '<div class="modcard"><span class="ai brand">' + I(ic) + '</span><div class="grow"><b>' + title + '</b><span>' + line + '</span></div>' + btns + '</div>';
    body = '<div class="mini3"><div><span>Last exam</span><b>' + st.exam + '%</b></div><div><span>Assignments</span><b>' + st.as.length + '</b></div><div><span>Quizzes</span><b>' + st.qz.length + '</b></div></div>' +
      mod('pen', 'Assignments', st.activeAs + ' active · ' + st.as.length + ' total', SP.btn('Open', 'sjGo', { c: 'sm', d: { r: 'assign', c: cid, s: sb } })) +
      mod('help', 'Quizzes', st.liveQz + ' live · ' + st.qz.length + ' total', SP.btn('Open', 'sjGo', { c: 'sm', d: { r: 'quizzes', c: cid, s: sb } })) +
      mod('file', 'Notes', st.nt.length + ' uploaded', SP.btn('Open', 'sjGo', { c: 'sm', d: { r: 'notes', c: cid, s: sb } })) +
      mod('award', 'Exam marks', 'Unit Test 2 marking ' + (SP.entered(SP.exam('E2'), cid, sb) ? 'complete' : 'pending'), SP.btn('Open', 'sjGo', { c: 'sm', d: { r: 'exams', c: cid, s: sb } }));
  } else {
    const ex = SP.exam('E1'), as = st.as.filter(x => x.graded || SP.assignState(x) === 'closed');
    body = SP.table('sjst', [{ h: 'Student', f: s => SP.person(s.name, 'Roll ' + s.roll, 'sm') }, { h: 'Unit Test 1', cls: 'mono', f: s => SP.markOf(ex, s, sb) + '/' + ex.total }, { h: 'Assignments', f: s => { const g = as.map(x => SP.sub(x, s)).filter(Boolean); return g.length + '/' + as.length; } },
      { h: 'Quiz avg.', f: s => { const q = st.qz.filter(x => x.status === 'closed'); const v = q.map(x => { const at = SP.attempt(x, s); return at ? at.score / SP.quizTotal(x) : null; }).filter(x => x != null); return v.length ? Math.round(100 * v.reduce((n, x) => n + x, 0) / v.length) + '%' : '—'; } }], studs.map(s => Object.assign(s, {})), { per: 8, row: 'openStudent' });
  }
  return '<div class="dr-h"><div><b style="font-size:17px">' + esc(sb) + ' · ' + c.label + '</b><div class="s">Taught by ' + esc(tch.name) + ' · ' + studs.length + ' students</div></div><button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div><div class="dr-tabs">' + tabs + '</div><div class="dr-b" data-scroll="drb">' + body + '</div>';
};
SP.drawers.subject.wide = true;
SP.act.sjGo = d => {
  const map = { assign: ['as_c', 'as_s', 'as_st'], quizzes: ['qz_c'], notes: ['nt_c', 'nt_s'], exams: ['mk_c', 'mk_s'] }[d.r];
  SP.ui.f[map[0]] = d.c; if (map[1]) SP.ui.f[map[1]] = d.s; if (map[2]) SP.ui.f[map[2]] = 'all';
  if (d.r === 'notes') SP.ui.f.nt_tab = 'notes'; if (d.r === 'exams') SP.ui.f.ex_tab = 'marks'; SP.ui.f.ex_id = d.r === 'exams' ? 'E2' : SP.ui.f.ex_id;
  SP.go(d.r);
};
})();
