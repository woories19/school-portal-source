/* Phone screens shared by the parent and student apps: live attendance, diary, assignments, notes, quizzes,
   results & report cards, timetable, calendar, resources, notices, consents, alerts. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY;
const X = SP.phx, bar = X.bar, kid = X.kid, kidChips = X.kidChips, role = X.role;
const ph = () => SP.ui.phone, isStu = () => role() === 'student';
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const nowMin = () => SP.NOW_MIN + SP.S.clock;
const daysTo = iso => Math.round((new Date(iso) - new Date(TODAY)) / 864e5);
const dueChip = iso => { const n = daysTo(iso); return n < 0 ? SP.pill('Overdue', 'red') : n === 0 ? SP.pill('Due today', 'amber') : n === 1 ? SP.pill('Due tomorrow', 'amber') : SP.pill('Due in ' + n + ' days', 'gray'); };
const empty = (t, s) => SP.empty(t, s);
const go = (tab, sub, seg) => { SP.ui.phone = { tab, sub: sub || null, stack: [] }; if (seg) SP.ui.f[tab === 'learn' ? 'ph_learn' : tab === 'inbox' ? 'ph_inbox' : 'ph_res'] = seg; SP.render(); };

/* ---------- deep links (push banners + alert rows) ---------- */
SP.deepLink = function (kind, ref) {
  const r = role(), k = kid(); let t = 'inbox', sub = null, seg = 'alerts';
  if (kind === 'fee' && r === 'parent') { t = 'fees'; seg = null; }
  else if (kind === 'message' && r === 'parent') { t = 'chat'; seg = null; }
  else if (kind === 'diary') { t = 'learn'; seg = 'diary'; }
  else if (kind === 'assignment') { t = 'learn'; seg = 'assign'; sub = ref ? 'assign:' + ref : null; }
  else if (kind === 'quiz') { t = 'learn'; seg = 'quiz'; sub = ref ? 'quiz:' + ref : null; }
  else if (kind === 'notes') { t = 'learn'; seg = 'notes'; sub = ref && ref.indexOf('NT') === 0 ? 'doc:note:' + ref : ref && ref.indexOf('RS') === 0 ? 'doc:res:' + ref : null; }
  else if (kind === 'result') { t = r === 'student' ? 'results' : 'home'; seg = null; sub = r === 'student' ? (ref ? 'rc:' + ref : null) : 'rc:' + (ref || 'E1'); }
  else if (kind === 'event') { t = r === 'student' ? 'inbox' : 'home'; sub = ref ? 'event:' + ref : 'calendar'; }
  else if (kind === 'circular') { t = 'inbox'; seg = 'notices'; sub = ref ? 'notice:' + ref : null; }
  else if (kind === 'consent') { t = 'inbox'; seg = 'consents'; sub = ref && r === 'parent' ? 'consent:' + ref + ':' + k.id : null; }
  else if (kind === 'timetable') { t = r === 'student' ? 'schedule' : 'home'; seg = null; sub = r === 'student' ? null : 'timetable'; }
  else if (kind === 'attendance' || kind === 'gate') { t = 'home'; seg = null; sub = 'attendance'; }
  go(t, sub, seg);
};
SP.act.alertOpen = d => SP.deepLink(d.k, d.ref || null);

/* ---------- live attendance ---------- */
function attTime(k) { const S = SP.S; return S.attTimes[k.classId] || ('08:' + SP.pad(20 + Math.floor(SP.hash01('at' + k.classId) * 30))); }
SP.liveCard = function (k, big) {
  const S = SP.S, m = SP.mark(k.id), out = S.gateOut[k.id], tch = SP.teacher(SP.cls(k.classId).teacherId), inn = D.time(SP.inMin(k.id, TODAY));
  const st = [];
  st.push(m === 'A' || m === 'L' ? ['skip', 'No gate check-in today', m === 'L' ? 'Approved leave' : 'Did not arrive at the gate'] : ['done', 'Reached the school gate', inn + ' · ' + (k.transport ? 'School bus, route ' + (1 + (+k.id.slice(-1) % 5)) : 'Gate 1')]);
  st.push(m === 'P' ? ['done', 'Marked present', esc(tch.name) + ' · ' + attTime(k)] : m === 'A' ? ['bad', 'Marked absent', esc(tch.name) + ' · ' + attTime(k) + ' · you were notified'] : m === 'L' ? ['warn', 'On approved leave', 'Leave granted for today'] : ['now', 'Waiting for attendance', esc(tch.name) + ' hasn\'t marked ' + SP.cls(k.classId).short + ' yet']);
  st.push(out != null ? ['done', 'Left school', D.time(out) + ' · signed out at the front desk'] : m === 'A' || m === 'L' ? ['skip', 'At home', 'Not on campus'] : ['idle', 'In school', 'Pickup not recorded yet']);
  const head = m === 'P' ? ['Present', 'green', 'ok'] : m === 'A' ? ['Absent', 'red', 'bad'] : m === 'L' ? ['On leave', 'blue', 'warn'] : ['Awaiting', 'gray', 'idle'];
  return '<div class="pcard live ' + head[2] + (big ? ' big' : '') + '" ' + (big ? '' : 'data-act="phSub" data-s="attendance" ') + 'data-tour="ph-att"><div class="live-h"><span class="live-dot"></span><b>Today · live</b><span class="grow"></span>' + SP.pill(head[0], head[1]) + '</div><ol class="tl">' +
    st.map(x => '<li class="' + x[0] + '"><i></i><div><b>' + x[1] + '</b><span>' + x[2] + '</span></div></li>').join('') + '</ol></div>';
};
function attendance() {
  const k = kid(), a = SP.ATT[k.id] || '', cnt = c => a.split(c).length - 1;
  return bar('Attendance', true) + '<div class="ph-pad">' + SP.liveCard(k, true) + '<div class="mini3"><div><span>Present</span><b>' + cnt('P') + '</b></div><div><span>Absent</span><b class="neg">' + cnt('A') + '</b></div><div><span>Leave</span><b>' + cnt('L') + '</b></div></div>' +
    '<h5>Last 30 school days · ' + SP.attPct(k.id, 30) + '%</h5><div class="attgrid">' + SP.DAYS.map((d, i) => '<div class="ac ' + (a[i] || 'P') + '"><span>' + (+d.slice(8)) + '</span></div>').join('') + '</div><div class="legend"><i class="P"></i>Present <i class="A"></i>Absent <i class="L"></i>Leave</div></div>';
}
SP.ps.attendance = attendance;

/* ---------- work to do ---------- */
SP.pendingWork = function (k, n) {
  const as = SP.allAssign().filter(a => a.classId === k.classId && SP.assignState(a) !== 'closed' && !SP.sub(a, k)).map(a => ({ t: 'assign', id: a.id, title: a.title, subject: a.subject, due: a.due, label: 'Assignment · ' + a.total + ' marks' }));
  const qz = SP.allQuizzes().filter(q => q.classId === k.classId && q.status === 'live' && !SP.attempt(q, k)).map(q => ({ t: 'quiz', id: q.id, title: q.title, subject: q.subject, due: q.close, label: 'Quiz · ' + q.qs.length + ' questions · ' + q.mins + ' min' }));
  return as.concat(qz).sort((a, b) => a.due.localeCompare(b.due)).slice(0, n || 9);
};
SP.workCard = w => '<button class="pcard work" data-act="phSub" data-s="' + w.t + ':' + w.id + '"><span class="ai ' + (w.t === 'quiz' ? 'brand' : 'blue') + '">' + I(w.t === 'quiz' ? 'help' : 'pen') + '</span><div class="grow"><b>' + esc(w.title) + '</b><span>' + esc(w.subject) + ' · ' + w.label + '</span></div>' + dueChip(w.due) + '</button>';
SP.unackedCount = pid => { const ks = SP.kids(pid); return SP.S.circ.filter(c => (c.needsAck || c.kind === 'invitation') && ks.some(k => SP.audOk(c.audience, k.classId)) && !SP.circAcked(c, pid) && !(c.rsvpMap && c.rsvpMap[pid])).length; };

/* ---------- student home ---------- */
SP.ps.studentHome = function () {
  const k = kid(), S = SP.S, a = SP.ATT[k.id] || '', m = SP.mark(k.id); let streak = 0; for (let i = a.length - 1; i >= 0 && a[i] === 'P'; i--) streak++; if (m === 'P') streak++; else if (m === 'A' || m === 'L') streak = 0;
  const now = D.time(nowMin()), tt = SP.timetable(k.classId, D.dow(TODAY)), next = tt.find(p => p.to > now && p.subject !== 'Break'), todo = SP.pendingWork(k, 3);
  const tile = (ic, l, s) => '<button class="qt" data-act="phSub" data-s="' + s + '"><span>' + I(ic) + '</span>' + l + '</button>';
  return '<div class="ph-hero"><div><span>' + SP.cls(k.classId).label + ' · Roll ' + k.roll + '</span><b>Hi, ' + esc(k.first) + '</b></div><button class="bellb" data-act="phTab" data-t="inbox" aria-label="Alerts">' + I('bell') + '</button></div>' +
    '<div class="ph-pad">' + SP.liveCard(k) + (next ? '<div class="pcard next"><span class="ai brand">' + I('clock') + '</span><div class="grow"><span>' + (next.from <= now ? 'Now' : 'Next lesson') + '</span><b>' + next.subject + '</b><span>' + next.from + ' – ' + next.to + ' · ' + esc(SP.teacher(next.teacherId).name) + '</span></div></div>' : '<div class="pcard clear">' + I('check') + '<div><b>School\'s out for today</b><span>Enjoy your evening!</span></div></div>') +
    '<div class="qgrid">' + tile('check', 'Attendance', 'attendance') + tile('cal', 'Calendar', 'calendar') + tile('file', 'Resources', 'resources') + tile('board', 'Notices', 'notices') + '</div>' +
    (todo.length ? '<h5>To do</h5>' + todo.map(SP.workCard).join('') : '<div class="pcard clear">' + I('check') + '<div><b>You\'re all caught up</b><span>No pending assignments or quizzes.</span></div></div>') +
    '<div class="pcard streak"><span class="ai amber">' + I('star') + '</span><div><b>' + streak + '-day attendance streak</b><span>Keep it going — great habit!</span></div></div></div>';
};

/* ---------- LEARN tab ---------- */
function schoolDays(n) { const out = []; let d = TODAY; while (out.length < n) { if (D.isSchoolDay(d)) out.unshift(d); d = D.add(d, -1); } return out; }
SP.diarySigned = (sid, day) => { const r = SP.S.diarySign[sid + '|' + day]; if (r) return r; if (SP.isDemoKid(sid)) return null; return SP.hash01('sig' + sid + day) < (day === TODAY ? .38 : .8) ? 'earlier' : null; };
function diaryView(k) {
  const days = schoolDays(5), sel = days.indexOf(SP.f('ph_day')) > -1 ? SP.f('ph_day') : TODAY, S = SP.S;
  const ents = S.diary.filter(d => d.classId === k.classId && d.date === sel), hw = ents.filter(e => e.type === 'homework' || e.type === 'assignment'), notes = ents.filter(e => e.type === 'note');
  const tt = SP.timetable(k.classId, D.dow(sel)).filter(p => p.subject !== 'Break'), sig = SP.diarySigned(k.id, sel);
  const cw = tt.map((p, i) => '<div class="cwrow"><b>' + esc(p.subject) + '</b><span>' + SP.TOPICS[p.subject][(k.grade + i + D.dow(sel)) % 4] + '</span></div>').join('');
  return '<div class="dstrip">' + days.map(d => '<button class="' + (d === sel ? 'on' : '') + '" data-act="phSeg" data-k="ph_day" data-v="' + d + '"><span>' + D.dowName(d) + '</span><b>' + (+d.slice(8)) + '</b></button>').join('') + '</div>' +
    '<h5>Classwork covered</h5><div class="pcard">' + cw + '</div>' +
    '<h5>Homework & assignments</h5>' + (hw.map(d => '<button class="pcard hw" ' + (d.ref ? 'data-act="phSub" data-s="assign:' + d.ref + '"' : '') + '><div class="hwt"><b>' + esc(d.subject) + '</b>' + (d.type === 'assignment' ? SP.pill('Assignment', 'blue') : '<em>' + esc(SP.teacher(d.teacherId).name) + '</em>') + '</div><span class="tt">' + esc(d.title) + '</span><p>' + esc(d.text) + '</p>' + (d.due ? '<i>' + I('clock') + 'Due ' + D.nice(d.due) + '</i>' : '') + '</button>').join('') || '<div class="pcard"><span>No homework posted for this day.</span></div>') +
    (notes.length ? '<h5>Notes from teachers</h5>' + notes.map(d => '<div class="pcard hw note"><div class="hwt"><b>' + esc(SP.teacher(d.teacherId).name) + '</b></div><p>' + esc(d.text) + '</p></div>').join('') : '') +
    '<div class="pcard sign ' + (sig ? 'ok' : '') + '" data-tour="ph-sign"><span class="ai ' + (sig ? 'green' : 'amber') + '">' + I(sig ? 'check' : 'pen') + '</span><div class="grow"><b>' + (sig ? 'Diary signed' : 'Parent signature') + '</b><span>' + (sig ? (sig === 'earlier' ? 'Signed by a parent' : 'Signed ' + D.niceTs(sig)) : (isStu() ? 'Waiting for your parent to sign' : 'Sign to confirm you have seen today\'s diary')) + '</span></div>' + (!sig && !isStu() && sel <= TODAY ? '<button class="pay" data-act="phSign" data-day="' + sel + '">Sign</button>' : '') + '</div>';
}
SP.act.phSign = d => { const k = kid(); SP.S.diarySign[k.id + '|' + d.day] = SP.stamp(); SP.toast(SP.parent(k.parentId).name + ' signed ' + k.first + '\'s diary for ' + D.nice(d.day)); SP.render(); };
function assignView(k) {
  const all = SP.allAssign().filter(a => a.classId === k.classId).map(a => ({ a, s: SP.sub(a, k) })), st = SP.assignState;
  const todo = all.filter(x => !x.s && st(x.a) !== 'closed').sort((p, q) => p.a.due.localeCompare(q.a.due)), sub = all.filter(x => x.s && x.s.status === 'submitted'), gr = all.filter(x => x.s && x.s.status === 'graded').sort((p, q) => q.a.due.localeCompare(p.a.due)), miss = all.filter(x => !x.s && st(x.a) === 'closed').slice(0, 3);
  const row = x => '<button class="pcard work" data-act="phSub" data-s="assign:' + x.a.id + '"><span class="ai blue">' + I('pen') + '</span><div class="grow"><b>' + esc(x.a.title) + '</b><span>' + esc(x.a.subject) + ' · ' + x.a.total + ' marks</span></div>' +
    (x.s ? (x.s.status === 'graded' ? '<b>' + x.s.marks + '/' + x.a.total + '</b>' : SP.pill('Submitted', 'green')) : st(x.a) === 'closed' ? SP.pill('Missed', 'red') : dueChip(x.a.due)) + '</button>';
  const grp = (t, l) => l.length ? '<h5>' + t + '</h5>' + l.map(row).join('') : '';
  return grp('To do', todo) + grp('Waiting for grading', sub) + grp('Graded', gr) + grp('Missed', miss) + (all.length ? '' : empty('No assignments yet'));
}
function notesView(k) {
  const sb = SP.f('ph_ns'), list = SP.allNotes().filter(n => n.classId === k.classId && !SP.S.notesDel[n.id] && (!sb || n.subject === sb)).sort((a, b) => b.ts.localeCompare(a.ts));
  return '<div class="chips scrollx">' + [''].concat(SP.SUBJECTS).map(s => '<button class="chip ' + (sb === s ? 'on' : '') + '" data-act="phSeg" data-k="ph_ns" data-v="' + esc(s) + '">' + (s || 'All') + '</button>').join('') + '</div>' +
    list.map(n => '<button class="pcard note" data-act="phDoc" data-k="note" data-id="' + n.id + '"><span class="fic" style="--c:' + SP.KIND[n.kind][2] + '">' + I(SP.KIND[n.kind][1]) + '</span><div class="grow"><b>' + esc(n.title) + '</b><span>' + esc(n.subject) + ' · ' + esc(n.chapter) + (n.size ? ' · ' + n.size : '') + '</span></div>' + (!SP.S.views[n.id] && n.ts.slice(0, 10) >= D.add(TODAY, -5) ? SP.pill('New', 'blue') : '') + '</button>').join('') || empty('No notes yet');
}
function quizView(k) {
  const all = SP.allQuizzes().filter(q => q.classId === k.classId && q.status !== 'draft').sort((a, b) => (b.status === 'live') - (a.status === 'live') || b.date.localeCompare(a.date)), live = all.filter(q => q.status === 'live' && !SP.attempt(q, k)), rest = all.filter(q => !live.includes(q));
  const row = q => { const at = SP.attempt(q, k), tot = SP.quizTotal(q); return '<button class="pcard work" data-act="phSub" data-s="quiz:' + q.id + '"><span class="ai brand">' + I('help') + '</span><div class="grow"><b>' + esc(q.title) + '</b><span>' + esc(q.subject) + ' · ' + D.nice(q.date) + '</span></div>' + (at ? '<b>' + at.score + '/' + tot + '</b>' : q.status === 'live' ? dueChip(q.close) : SP.pill('Not taken', 'gray')) + '</button>'; };
  return (live.length ? '<h5>Live now</h5>' + live.map(q => '<div class="pcard livequiz"><div class="hwt"><b>' + esc(q.title) + '</b>' + SP.pill('Live', 'green') + '</div><span>' + esc(q.subject) + ' · ' + q.qs.length + ' questions · ' + q.mins + ' min · closes ' + D.nice(q.close) + '</span><button class="pbtn" style="margin-top:8px" data-act="phSub" data-s="quiz:' + q.id + '" data-tour="ph-quiz">' + (isStu() ? 'Open quiz' : 'View quiz') + '</button></div>').join('') : '') +
    (rest.length ? '<h5>Results</h5>' + rest.map(row).join('') : '') + (all.length ? '' : empty('No quizzes yet'));
}
SP.pt.learn = function () {
  const k = kid(), seg = SP.f('ph_learn', 'diary'), pend = SP.pendingWork(k, 99), nq = pend.filter(w => w.t === 'quiz').length, na = pend.length - nq;
  return bar('Learn') + kidChips() + '<div class="ph-pad tight">' + SP.seg([['diary', 'Diary'], ['assign', 'Assignments', na || ''], ['notes', 'Notes'], ['quiz', 'Quizzes', nq || '']], seg, 'ph_learn') +
    (seg === 'diary' ? diaryView(k) : seg === 'assign' ? assignView(k) : seg === 'notes' ? notesView(k) : quizView(k)) + '</div>';
};
SP.ps.diaryjump = () => { go('learn', null, 'diary'); return SP.pt.learn(); };

/* ---------- assignment detail + submission ---------- */
SP.ui.sd = { text: '', file: null, aid: null };
SP.inp.phDraft = v => { SP.ui.sd.text = v; };
SP.act.phAttach = d => { SP.ui.sd.file = SP.ui.sd.file ? null : 'IMG_' + (4000 + Math.floor(SP.hash01(d.id + SP.S.clock) * 900)) + '.jpg'; SP.render(); };
SP.act.phSubmit = d => {
  const k = kid(), a = SP.assign(d.id), u = SP.ui.sd; if (!u.text.trim() && !u.file) return SP.toast('Add a typed answer or attach a photo first', 'warn');
  SP.submitAssign(a.id, k.id, u.text.trim(), u.file); SP.ui.sd = { text: '', file: null, aid: null }; SP.notify([k.id], { kind: 'assignment', title: k.first + ' submitted “' + a.title + '”', body: 'Submitted on ' + D.nice(TODAY) + ' — waiting for the teacher to grade.', ref: a.id, who: 'parent' }); SP.render();
};
SP.act.phResubmit = d => { const s = SP.S.subs[d.id] && SP.S.subs[d.id][kid().id]; if (s) { SP.ui.sd = { text: s.text || '', file: s.file || null, aid: d.id }; delete SP.S.subs[d.id][kid().id]; } SP.render(); };
SP.act.phNudge = d => { const k = kid(), a = SP.assign(d.id); SP.notify([k.id], { kind: 'assignment', title: 'Reminder from your parent', body: '“' + a.title + '” is due ' + D.nice(a.due) + '. Please submit it soon.', ref: a.id, who: 'student' }); SP.toast('Reminder sent to ' + k.first); };
SP.ps.assign = function (id) {
  const k = kid(), a = SP.assign(id); if (!a) return SP.pt.learn(); const s = SP.sub(a, k), stt = SP.assignStats(a), closed = SP.assignState(a) === 'closed', u = SP.ui.sd;
  let action;
  if (s && s.status === 'graded') action = '<div class="pcard grade">' + SP.donut(pct(s.marks, a.total), { size: 84, label: s.marks + '/' + a.total, color: 'var(--green)' }) + '<div><b>Graded</b><span>Class average ' + (stt.graded ? stt.avg + '%' : '—') + '</span>' + (s.fb ? '<p class="quote">“' + esc(s.fb) + '”</p>' : '') + '</div></div>';
  else if (s) action = '<div class="pcard"><div class="row-c" style="gap:8px"><b>Submitted</b>' + (s.late ? SP.pill('Late', 'red') : SP.pill('On time', 'green')) + '</div><span>' + D.niceTs(s.ts) + ' · waiting for the teacher to grade</span>' + (s.text ? '<p class="quote">' + esc(s.text) + '</p>' : '') + (s.file ? '<div class="filechip">' + I('file') + '<div><b>' + esc(s.file) + '</b><span>Photo</span></div></div>' : '') + (isStu() && !closed ? '<button class="pbtn ghost" style="margin-top:10px" data-act="phResubmit" data-id="' + a.id + '">Edit & resubmit</button>' : '') + '</div>';
  else if (closed) action = '<div class="pwarn">' + I('alert') + 'This assignment is closed and was not submitted.</div>';
  else if (isStu()) action = '<div class="pcard form"><b>Your answer</b>' + (a.type !== 'file' ? '<textarea class="input" rows="4" id="sd-text" data-in="phDraft" placeholder="Type your answer here…">' + esc(u.aid === a.id || u.text ? u.text : '') + '</textarea>' : '') + (a.type !== 'text' ? '<button class="attach" data-act="phAttach" data-id="' + a.id + '">' + (u.file ? I('check') + '<b>' + esc(u.file) + '</b><span>Tap to remove</span>' : I('clip') + '<b>Attach a photo of your work</b><span>Camera or gallery</span>') + '</button>' : '') + '<button class="pbtn" data-act="phSubmit" data-id="' + a.id + '" data-tour="ph-submit">Submit assignment</button>' + (daysTo(a.due) === 0 ? '<p class="fine">Due today — submit before school ends.</p>' : '') + '</div>';
  else action = '<div class="pcard"><b>Not submitted yet</b><span>' + esc(kid().first) + ' hasn\'t handed this in. Due ' + D.nice(a.due) + '.</span><button class="pbtn ghost" style="margin-top:10px" data-act="phNudge" data-id="' + a.id + '">' + I('bell') + 'Remind ' + esc(kid().first) + '</button></div>';
  return bar('Assignment', true) + '<div class="ph-pad"><div class="pcard"><div class="row-c" style="gap:8px">' + SP.pill(esc(a.subject), 'blue') + dueChip(a.due) + '</div><h3 class="ptitle">' + esc(a.title) + '</h3><span>' + a.total + ' marks · posted ' + D.nice(a.posted) + ' by ' + esc(SP.teacher(a.teacherId).name) + '</span><p>' + esc(a.text) + '</p>' + (a.attach ? '<button class="filechip" data-act="phToast" data-t="Downloaded ' + esc(a.attach.name) + ' (demo)">' + I('file') + '<div><b>' + esc(a.attach.name) + '</b><span>' + esc(a.attach.size) + ' · tap to download</span></div></button>' : '') + '</div>' + action + '</div>';
};
SP.act.phToast = d => SP.toast(d.t);

/* ---------- quizzes ---------- */
let qtInt = null;
const mmss = s => SP.pad(Math.floor(s / 60)) + ':' + SP.pad(s % 60);
function tick() { const u = SP.ui.qt; if (!u) { clearInterval(qtInt); qtInt = null; return; } const left = Math.max(0, Math.round((u.end - Date.now()) / 1000)), el = document.getElementById('qt-timer'); if (el) { el.textContent = mmss(left); el.parentNode.classList.toggle('low', left < 60); } if (!left) SP.act.qzSubmit({ auto: 1 }); }
SP.ps.quiz = function (id) {
  const k = kid(), q = SP.quiz(id); if (!q) return SP.pt.learn(); const at = SP.attempt(q, k);
  if (at && !at.seeded) return SP.ps.quizres(id);
  const head = '<div class="pcard"><div class="row-c" style="gap:8px">' + SP.pill(esc(q.subject), 'blue') + SP.pill(q.status === 'live' ? 'Live' : 'Closed', q.status === 'live' ? 'green' : 'gray') + '</div><h3 class="ptitle">' + esc(q.title) + '</h3>';
  if (at && at.seeded) return bar('Quiz', true) + '<div class="ph-pad">' + head + '<span>' + D.nice(q.date) + ' · class test</span></div><div class="pcard grade">' + SP.donut(pct(at.score, q.total), { size: 84, label: at.score + '/' + q.total }) + '<div><b>Your score</b><span>Class average ' + SP.quizStats(q).avg + '%</span></div></div></div>';
  if (q.status !== 'live') return bar('Quiz', true) + '<div class="ph-pad">' + head + '<span>This quiz has closed.</span></div><div class="pwarn">' + I('alert') + 'Not attempted before it closed.</div></div>';
  return bar('Quiz', true) + '<div class="ph-pad">' + head + '<span>Closes ' + D.nice(q.close) + '</span><div class="qinfo"><div><b>' + q.qs.length + '</b><span>questions</span></div><div><b>' + q.mins + '</b><span>minutes</span></div><div><b>' + q.qs.length + '</b><span>marks</span></div></div><ul class="rules"><li>One attempt only — you can\'t retake it.</li><li>Answer every question, then submit before time runs out.</li><li>' + (q.showAns ? 'You\'ll see the correct answers afterwards.' : 'Answers are shared by your teacher later.') + '</li></ul></div>' +
    (isStu() ? '<button class="pbtn" data-act="qzStart" data-id="' + q.id + '" data-tour="ph-qstart">Start quiz</button>' : '<div class="note">' + I('help') + '<span>' + esc(k.first) + ' can take this quiz from their own app. You\'ll be notified of the score.</span></div>') + '</div>';
};
SP.act.qzStart = d => { const q = SP.quiz(d.id); SP.ui.qt = { id: q.id, i: 0, ans: q.qs.map(() => -1), end: Date.now() + q.mins * 60000, t0: Date.now() }; ph().stack = []; ph().sub = 'quizrun:' + q.id; clearInterval(qtInt); qtInt = setInterval(tick, 1000); SP.render(); };
SP.ps.quizrun = function (id) {
  const u = SP.ui.qt, q = SP.quiz(id); if (!u || u.id !== id) return SP.ps.quiz(id);
  const cur = q.qs[u.i], left = Math.max(0, Math.round((u.end - Date.now()) / 1000)), last = u.i === q.qs.length - 1, un = u.ans.filter(x => x < 0).length;
  return '<div class="ph-bar quizbar"><b>' + esc(q.title) + '</b><span class="timer' + (left < 60 ? ' low' : '') + '">' + I('clock') + '<b id="qt-timer">' + mmss(left) + '</b></span></div><div class="ph-pad">' +
    '<div class="qprog"><i style="width:' + pct(u.i + 1, q.qs.length) + '%"></i></div><div class="qpal">' + q.qs.map((_, i) => '<button class="' + (i === u.i ? 'cur' : '') + (u.ans[i] >= 0 ? ' done' : '') + '" data-act="qzGo" data-i="' + i + '">' + (i + 1) + '</button>').join('') + '</div>' +
    '<div class="pcard qq"><span>Question ' + (u.i + 1) + ' of ' + q.qs.length + '</span><h3>' + esc(cur.q) + '</h3></div>' +
    cur.o.map((o, j) => '<button class="pm opt ' + (u.ans[u.i] === j ? 'on' : '') + '" data-act="qzAns" data-o="' + j + '"><span class="rd"></span><div><b>' + esc(o) + '</b></div></button>').join('') +
    '<div class="row-c" style="gap:8px;flex-wrap:nowrap;margin-top:6px"><button class="pbtn ghost" style="flex:1" data-act="qzNav" data-d="-1"' + (u.i === 0 ? ' disabled' : '') + '>Previous</button>' + (last ? '<button class="pbtn" style="flex:1.4" data-act="qzSubmit" data-tour="ph-qsubmit">Submit' + (un ? ' (' + un + ' left)' : '') + '</button>' : '<button class="pbtn" style="flex:1.4" data-act="qzNav" data-d="1">Next</button>') + '</div></div>';
};
SP.act.qzAns = d => { const u = SP.ui.qt; u.ans[u.i] = +d.o; SP.render(); };
SP.act.qzNav = d => { const u = SP.ui.qt, q = SP.quiz(u.id); u.i = Math.max(0, Math.min(q.qs.length - 1, u.i + +d.d)); SP.render(); };
SP.act.qzGo = d => { SP.ui.qt.i = +d.i; SP.render(); };
SP.act.qzSubmit = () => {
  const u = SP.ui.qt; if (!u) return; const q = SP.quiz(u.id), k = kid(), S = SP.S, score = u.ans.filter((a, i) => a === q.qs[i].a).length;
  (S.att2[q.id] = S.att2[q.id] || {})[k.id] = { ans: u.ans.slice(), score, ts: SP.stamp(), secs: Math.round((Date.now() - u.t0) / 1000) };
  SP.ui.qt = null; clearInterval(qtInt); qtInt = null; SP.notify([k.id], { kind: 'quiz', title: k.first + ' finished “' + q.title + '”', body: 'Scored ' + score + '/' + q.qs.length + ' (' + pct(score, q.qs.length) + '%).', ref: q.id, who: 'parent' });
  SP.toast(k.name + ' scored ' + score + '/' + q.qs.length + ' in “' + q.title + '” — result is live in Quizzes'); ph().stack = []; ph().sub = 'quizres:' + q.id; SP.render();
};
SP.ps.quizres = function (id) {
  const k = kid(), q = SP.quiz(id), at = SP.attempt(q, k); if (!at) return SP.ps.quiz(id); const tot = SP.quizTotal(q), st = SP.quizStats(q), p = pct(at.score, tot);
  return bar('Quiz result', true) + '<div class="ph-pad"><div class="pcard grade big">' + SP.donut(p, { size: 110, label: at.score + '/' + tot, color: p >= 70 ? 'var(--green)' : p >= 50 ? '#ff9f0a' : 'var(--red)' }) + '<div><b>' + (p >= 80 ? 'Excellent!' : p >= 60 ? 'Good job!' : 'Keep practising') + '</b><span>' + esc(q.title) + '</span><span>Class average ' + st.avg + '% · ' + st.done + ' of ' + st.n + ' finished</span></div></div>' +
    (q.qs && q.showAns && at.ans ? '<h5>Review</h5>' + q.qs.map((qq, i) => { const ok = at.ans[i] === qq.a; return '<div class="pcard rev ' + (ok ? 'ok' : 'bad') + '"><div class="hwt"><b>Q' + (i + 1) + '</b>' + SP.pill(ok ? 'Correct' : 'Incorrect', ok ? 'green' : 'red') + '</div><span class="tt">' + esc(qq.q) + '</span>' + (ok ? '' : '<p>Your answer: <b>' + (at.ans[i] >= 0 ? esc(qq.o[at.ans[i]]) : 'Not answered') + '</b></p>') + '<p>Correct answer: <b>' + esc(qq.o[qq.a]) + '</b></p></div>'; }).join('') : '') + '</div>';
};

/* ---------- notes / resources viewer ---------- */
SP.act.phDoc = d => { SP.S.views[d.id] = (SP.S.views[d.id] || 0) + 1; SP.act.phSub({ s: 'doc:' + d.k + ':' + d.id }); };
SP.ps.doc = function (kd, id) {
  const n = SP.docItem(kd, id); if (!n) return SP.pt.learn();
  return bar(SP.KIND[n.kind][0], true) + '<div class="ph-pad"><div class="pcard"><h3 class="ptitle">' + esc(n.title) + '</h3><span>' + (n.subject ? esc(n.subject) + ' · ' : '') + (n.chapter ? esc(n.chapter) + ' · ' : '') + (n.cat ? esc(n.cat) + ' · ' : '') + (n.size || 'External link') + '</span></div>' + SP.docPreview(n, true) +
    '<button class="pbtn" data-act="phToast" data-t="' + (n.kind === 'link' ? 'Opens in your browser (demo)' : 'Saved to your phone (demo)') + '">' + I(n.kind === 'link' ? 'right' : 'dl') + (n.kind === 'link' ? 'Open link' : 'Download') + '</button></div>';
};
function resourcesView() {
  const k = kid(), cat = SP.f('ph_rc'), r = role(), list = SP.allRes().filter(x => !SP.S.notesDel[x.id] && (!cat || x.cat === cat) && (!x.aud || x.aud === 'both' || (x.aud === 'parents') === (r === 'parent'))).sort((a, b) => b.ts.localeCompare(a.ts));
  return '<div class="chips scrollx">' + [''].concat(SP.RES_CATS).map(c => '<button class="chip ' + (cat === c ? 'on' : '') + '" data-act="phSeg" data-k="ph_rc" data-v="' + esc(c) + '">' + (c || 'All') + '</button>').join('') + '</div>' +
    list.map(x => '<button class="pcard note" data-act="phDoc" data-k="res" data-id="' + x.id + '"><span class="fic" style="--c:' + SP.KIND[x.kind][2] + '">' + I(SP.KIND[x.kind][1]) + '</span><div class="grow"><b>' + esc(x.title) + '</b><span>' + esc(x.cat) + (x.subject ? ' · ' + esc(x.subject) : '') + (x.size ? ' · ' + x.size : '') + '</span></div></button>').join('');
}
SP.ps.resources = () => bar('Resources', true) + '<div class="ph-pad tight">' + resourcesView() + '</div>';

/* ---------- calendar + events ---------- */
SP.act.phCalNav = d => { SP.ui.f.pc_m = d.m; SP.ui.f.pc_d = ''; SP.render(); };
SP.act.phCalDay = d => { SP.ui.f.pc_d = SP.ui.f.pc_d === d.d ? '' : d.d; SP.render(); };
SP.ps.calendar = function () {
  const k = kid(), ym = SP.f('pc_m', TODAY.slice(0, 7)), sel = SP.f('pc_d'), evs = SP.allEvents().filter(e => SP.audOk(e.audience, k.classId)), y = +ym.slice(0, 4), m = +ym.slice(5);
  const prev = m === 1 ? (y - 1) + '-12' : y + '-' + SP.pad(m - 1), next = m === 12 ? (y + 1) + '-01' : y + '-' + SP.pad(m + 1);
  const list = sel ? SP.eventOn(sel, evs) : evs.filter(e => (e.end || e.date) >= TODAY && e.date.slice(0, 7) >= ym).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  return bar('Calendar', true) + '<div class="ph-pad"><div class="pcard"><div class="row-c" style="justify-content:space-between;flex-wrap:nowrap"><button class="btn icon sm" data-act="phCalNav" data-m="' + prev + '">' + I('left') + '</button><b>' + D.monthLabel(ym) + '</b><button class="btn icon sm" data-act="phCalNav" data-m="' + next + '">' + I('right') + '</button></div>' + SP.monthGrid(ym, { evs, sel, compact: true, act: 'phCalDay' }) + '</div>' +
    '<h5>' + (sel ? D.long(sel) : 'Upcoming') + '</h5>' + (list.map(e => { const r = e.rsvp ? SP.rsvp(e, k.parentId) : null; return SP.evRow(e, 'phEvent', e.rsvp ? (r ? SP.pill(r === 'yes' ? 'Going' : 'Not going', r === 'yes' ? 'green' : 'gray') : SP.pill('RSVP', 'amber')) : ''); }).join('') || '<div class="pcard"><span>Nothing scheduled.</span></div>') + '</div>';
};
SP.act.phEvent = d => SP.act.phSub({ s: 'event:' + d.id });
SP.act.phRsvp = d => { SP.rsvpSet(d.id, kid().parentId, d.v); SP.render(); };
SP.ps.event = function (id) {
  const k = kid(), e = SP.allEvents().find(x => x.id === id); if (!e) return SP.ps.calendar(); const t = SP.EV_TYPES[e.type], r = e.rsvp ? SP.rsvp(e, k.parentId) : null;
  return bar('Event', true) + '<div class="ph-pad"><div class="pcard">' + SP.pill(t[0], t[1]) + '<h3 class="ptitle">' + esc(e.title) + '</h3>' + SP.kv([['Date', D.niceY(e.date) + (e.end ? ' – ' + D.nice(e.end) : '')], ['Time', e.time || 'All day'], ['Venue', e.place ? esc(e.place) : '—'], ['For', SP.audLabel(e.audience)]]) + '<p>' + esc(e.desc) + '</p></div>' +
    (e.rsvp ? (isStu() ? '<div class="note">' + I('cal') + '<span>Your parent responds to this invitation.</span></div>' : '<div class="pcard"><b>Will you attend?</b><div class="row-c" style="gap:8px;flex-wrap:nowrap;margin-top:8px"><button class="pbtn ' + (r === 'yes' ? '' : 'ghost') + '" style="flex:1" data-act="phRsvp" data-id="' + e.id + '" data-v="yes" data-tour="ph-rsvp">' + (r === 'yes' ? I('check') : '') + 'Going</button><button class="pbtn ' + (r === 'no' ? '' : 'ghost') + '" style="flex:1" data-act="phRsvp" data-id="' + e.id + '" data-v="no">Can\'t make it</button></div></div>') : '') +
    '<button class="pbtn ghost" data-act="phToast" data-t="Added to your phone calendar (demo)">' + I('cal') + 'Add to my calendar</button></div>';
};

/* ---------- notices (circulars & invitations) + consents ---------- */
function noticesView(k) {
  const list = SP.S.circ.filter(c => SP.audOk(c.audience, k.classId)).sort((a, b) => b.ts.localeCompare(a.ts)), pid = k.parentId;
  return list.map(c => { const done = SP.circAcked(c, pid) || (c.rsvpMap && c.rsvpMap[pid]), need = (c.needsAck || c.kind === 'invitation') && !done && !isStu(); return '<button class="pcard note" data-act="phSub" data-s="notice:' + c.id + '"><span class="ai ' + (c.kind === 'invitation' ? 'amber' : 'brand') + '">' + I(c.kind === 'invitation' ? 'mail' : 'board') + '</span><div class="grow"><b>' + esc(c.title) + '</b><span>' + (c.kind === 'invitation' ? 'Invitation' : 'Circular') + ' · ' + D.niceTs(c.ts) + '</span></div>' + (need ? SP.pill(c.kind === 'invitation' ? 'RSVP' : 'Action needed', 'amber') : done ? '<span class="tick">' + I('check') + '</span>' : '') + '</button>'; }).join('') || empty('No notices');
}
SP.ps.notices = () => bar('Notices', true) + '<div class="ph-pad">' + noticesView(kid()) + '</div>';
SP.ps.notice = function (id) {
  const k = kid(), c = SP.S.circ.find(x => x.id === id); if (!c) return SP.ps.notices(); const pid = k.parentId, acked = SP.circAcked(c, pid), rs = (c.rsvpMap && c.rsvpMap[pid]) || null;
  return bar(c.kind === 'invitation' ? 'Invitation' : 'Circular', true) + '<div class="ph-pad"><div class="pcard"><span>' + esc(c.by) + ' · ' + D.niceTs(c.ts) + '</span><h3 class="ptitle">' + esc(c.title) + '</h3><p>' + esc(c.body) + '</p>' + (c.attach ? '<button class="filechip" data-act="phToast" data-t="Downloaded ' + esc(c.attach) + ' (demo)">' + I('file') + '<div><b>' + esc(c.attach) + '</b><span>PDF · tap to download</span></div></button>' : '') + '</div>' +
    (isStu() ? '' : c.kind === 'invitation' ? '<div class="pcard"><b>Will you attend?</b><div class="row-c" style="gap:8px;flex-wrap:nowrap;margin-top:8px"><button class="pbtn ' + (rs === 'yes' ? '' : 'ghost') + '" style="flex:1" data-act="phRsvpC" data-id="' + c.id + '" data-v="yes">' + (rs === 'yes' ? I('check') : '') + 'Attending</button><button class="pbtn ' + (rs === 'no' ? '' : 'ghost') + '" style="flex:1" data-act="phRsvpC" data-id="' + c.id + '" data-v="no">Regrets</button></div></div>'
      : c.needsAck ? (acked ? '<div class="pcard clear">' + I('check') + '<div><b>Acknowledged</b><span>Thank you — the school has your confirmation.</span></div></div>' : '<button class="pbtn" data-act="phAck" data-id="' + c.id + '" data-tour="ph-ack">I have read this notice</button>') : '') + '</div>';
};
SP.act.phAck = d => { SP.ackCircular(d.id, kid().parentId); SP.render(); };
SP.act.phRsvpC = d => { SP.rsvpCircular(d.id, kid().parentId, d.v); SP.render(); };
function consentsView() {
  const ks = isStu() ? [kid()] : SP.kids(kid().parentId), rows = [];
  SP.S.forms.forEach(f => ks.forEach(s => { if (SP.audOk(f.audience, s.classId)) rows.push({ f, s, c: SP.consent(f, s.id) }); }));
  rows.sort((a, b) => !!a.c - !!b.c || a.f.deadline.localeCompare(b.f.deadline));
  return rows.map(x => '<button class="pcard note" data-act="phSub" data-s="consent:' + x.f.id + ':' + x.s.id + '"><span class="ai ' + (x.c ? (x.c.v === 'yes' ? 'green' : 'red') : 'amber') + '">' + I(x.c ? 'check' : 'pen') + '</span><div class="grow"><b>' + esc(x.f.title) + '</b><span>' + esc(x.s.first) + ' · respond by ' + D.nice(x.f.deadline) + (x.f.fee ? ' · ' + SP.pkr(x.f.fee) : '') + '</span></div>' + (x.c ? SP.pill(x.c.v === 'yes' ? 'Approved' : 'Declined', x.c.v === 'yes' ? 'green' : 'red') : SP.pill('Sign now', 'amber')) + '</button>').join('') || empty('No consent forms');
}
SP.ps.consents = () => bar('Consent forms', true) + '<div class="ph-pad">' + consentsView() + '</div>';
SP.ui.cs = { agree: false };
SP.act.phAgree = () => { SP.ui.cs.agree = !SP.ui.cs.agree; SP.render(); };
SP.ps.consent = function (fid, sid) {
  const f = SP.S.forms.find(x => x.id === fid), s = SP.stu(sid); if (!f) return SP.ps.consents(); const c = SP.consent(f, sid), par = SP.parent(s.parentId);
  return bar('Consent form', true) + '<div class="ph-pad"><div class="pcard"><div class="row-c" style="gap:8px">' + SP.pill('For ' + esc(s.first), 'blue') + SP.pill('Respond by ' + D.nice(f.deadline), 'amber') + '</div><h3 class="ptitle">' + esc(f.title) + '</h3><p>' + esc(f.desc) + '</p>' + (f.fee ? '<div class="note">' + I('cash') + '<span>A fee of <b>' + SP.pkr(f.fee) + '</b> will be added to the next voucher if you approve.</span></div>' : '') + '</div>' +
    (c ? '<div class="pcard ' + (c.v === 'yes' ? 'clear' : 'pwarn') + '">' + I(c.v === 'yes' ? 'check' : 'x') + '<div><b>' + (c.v === 'yes' ? 'Approved' : 'Declined') + '</b><span>' + (c.by ? 'Signed by ' + esc(c.by) + ' · ' : '') + D.niceTs(c.ts) + '</span></div></div>'
      : isStu() ? '<div class="note">' + I('pen') + '<span>Your parent needs to sign this form in their app.</span></div>'
      : '<div class="pcard form"><b>Signature</b><div class="field"><label>Type your full name to sign</label><input class="input" id="cs-name" value="' + esc(par.name) + '" autocomplete="off"></div><label class="chk agree" data-act="phAgree"><input type="checkbox"' + (SP.ui.cs.agree ? ' checked' : '') + ' onclick="return false"> I have read this form and I am the parent / guardian of ' + esc(s.first) + '.</label>' +
        '<div class="row-c" style="gap:8px;flex-wrap:nowrap;margin-top:10px"><button class="pbtn ghost" style="flex:1" data-act="phSign2" data-f="' + f.id + '" data-s="' + s.id + '" data-v="no">Decline</button><button class="pbtn" style="flex:1.4" data-act="phSign2" data-f="' + f.id + '" data-s="' + s.id + '" data-v="yes" data-tour="ph-cons-sign">Agree & sign</button></div></div>') + '</div>';
};
SP.act.phSign2 = d => { if (!SP.ui.cs.agree) return SP.toast('Tick the box to confirm you have read the form', 'warn'); SP.respondConsent(d.f, d.s, d.v, $v('cs-name') || SP.parent(kid().parentId).name); SP.ui.cs.agree = false; SP.render(); };

/* ---------- INBOX tab ---------- */
function alertsView() {
  const k = kid(), r = role(), ks = r === 'student' ? [k] : SP.kids(k.parentId), items = [];
  ks.forEach(x => (SP.S.notifs[x.id] || []).forEach(n => { if (n.who === 'both' || !n.who || n.who === r) items.push({ ts: n.ts, kind: n.kind, title: n.title, body: n.body, ref: n.ref }); }));
  SP.S.announcements.forEach(a => { if (a.audience === 'all' || ks.some(x => x.classId === a.audience)) items.push({ ts: a.ts, kind: 'announcement', title: a.title, body: a.body }); });
  ks.forEach(x => { const a = SP.ATT[x.id] || ''; for (let i = a.length - 1; i >= a.length - 5; i--) if (a[i] === 'A') items.push({ ts: SP.DAYS[i] + ' 09:10', kind: 'attendance', title: x.first + ' marked absent', body: x.name + ' was marked absent on ' + D.nice(SP.DAYS[i]) + '.' }); });
  items.sort((a, b) => b.ts.localeCompare(a.ts));
  const ic = { fee: ['cash', 'amber'], message: ['chat', 'blue'], attendance: ['alert', 'red'], diary: ['book', 'green'], announcement: ['mega', 'brand'], assignment: ['pen', 'blue'], quiz: ['help', 'brand'], notes: ['file', 'green'], result: ['award', 'green'], event: ['cal', 'amber'], circular: ['board', 'brand'], consent: ['board', 'amber'], gate: ['lock', 'amber'], timetable: ['clock', 'blue'] };
  return items.slice(0, 30).map(n => '<button class="pcard al" data-act="alertOpen" data-k="' + n.kind + '" data-ref="' + esc(n.ref || '') + '"><span class="ai ' + (ic[n.kind] || ic.message)[1] + '">' + I((ic[n.kind] || ic.message)[0]) + '</span><div><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p><em>' + D.niceTs(n.ts) + '</em></div></button>').join('') || empty('Nothing new');
}
SP.pt.inbox = function () {
  const k = kid(), stu = isStu(), seg = SP.f('ph_inbox', 'alerts'), pf = stu ? 0 : SP.pendingForms(k.parentId).length, un = stu ? 0 : SP.unackedCount(k.parentId);
  const items = [['alerts', stu ? 'Alerts' : 'Alerts'], ['notices', 'Notices', un || '']]; if (!stu) items.push(['consents', 'Consents', pf || '']);
  return bar(stu ? 'Alerts' : 'Inbox') + kidChips() + '<div class="ph-pad tight">' + SP.seg(items, seg, 'ph_inbox') + (seg === 'alerts' ? alertsView() : seg === 'notices' ? noticesView(k) : consentsView()) + '</div>';
};

/* ---------- RESULTS ---------- */
function resultsView(k) {
  const seg = SP.f('ph_res', 'rc'), S = SP.S; let body;
  if (seg === 'rc') {
    body = S.exams.map(ex => { if (ex.status === 'published') { const c = SP.examCard(ex, k), r = SP.classRank(ex, k); return '<button class="pcard work rcrow" data-act="phSub" data-s="rc:' + ex.id + '"><div class="pctbig">' + c.pct + '<small>%</small></div><div class="grow"><b>' + esc(ex.name) + '</b><span>' + esc(ex.period) + ' · position ' + r.pos + ' of ' + r.of + '</span></div>' + SP.pill(c.grade[0], c.grade[1]) + '</button>'; }
      return '<div class="pcard work"><span class="ai ' + (ex.status === 'marking' ? 'amber' : 'blue') + '">' + I(ex.status === 'marking' ? 'clock' : 'cal') + '</span><div class="grow"><b>' + esc(ex.name) + '</b><span>' + (ex.status === 'marking' ? 'Results will appear here once published' : 'Starts ' + D.nice(ex.from)) + '</span></div>' + SP.pill(ex.status === 'marking' ? 'Marking' : 'Upcoming', ex.status === 'marking' ? 'amber' : 'blue') + '</div>'; }).join('');
  } else if (seg === 'quiz') {
    const qs = SP.allQuizzes().filter(q => q.classId === k.classId && q.status !== 'draft').map(q => ({ q, a: SP.attempt(q, k) })).filter(x => x.a), avg = qs.length ? Math.round(qs.reduce((n, x) => n + 100 * x.a.score / SP.quizTotal(x.q), 0) / qs.length) : 0;
    body = '<div class="pcard child"><div><b>Average score</b><span>Across ' + qs.length + ' quizzes</span></div><h2 style="margin-left:auto">' + avg + '%</h2></div>' + qs.sort((a, b) => b.q.date.localeCompare(a.q.date)).map(x => '<button class="pcard qz" data-act="phSub" data-s="quiz:' + x.q.id + '"><div><b>' + esc(x.q.subject) + '</b><span>' + esc(x.q.title.split('— ')[1] || x.q.title) + ' · ' + D.nice(x.q.date) + '</span></div><div class="qbar"><i style="width:' + pct(x.a.score, SP.quizTotal(x.q)) + '%"></i></div><b>' + x.a.score + '/' + SP.quizTotal(x.q) + '</b></button>').join('');
  } else {
    const ex = SP.exam('E3'), left = daysTo(ex.from);
    body = '<div class="pcard child"><div><b>' + esc(ex.name) + '</b><span>' + esc(ex.period) + '</span></div><h2 style="margin-left:auto">' + left + '<small> days</small></h2></div>' + SP.datesheet(ex).map(r => '<div class="pcard tt"><em>' + D.nice(r.date) + '</em><div><b>' + esc(r.subject) + '</b><span>' + D.dowName(r.date) + ' · ' + r.time + '</span></div></div>').join('') + '<p class="fine">Bring your admit card, pens and geometry box.</p>';
  }
  return SP.seg([['rc', 'Report cards'], ['quiz', 'Quizzes'], ['dates', 'Datesheet']], seg, 'ph_res') + body;
}
SP.pt.results = () => bar('Results') + '<div class="ph-pad tight">' + resultsView(kid()) + '</div>';
SP.ps.results = () => bar('Results & exams', true) + kidChips() + '<div class="ph-pad tight">' + resultsView(kid()) + '</div>';
SP.ps.rc = function (id) {
  const k = kid(), ex = SP.exam(id); if (!ex || ex.status !== 'published') return SP.pt.results(); const c = SP.examCard(ex, k), r = SP.classRank(ex, k);
  return bar('Report card', true) + '<div class="ph-pad"><div class="pcard grade big">' + SP.donut(c.pct, { size: 110, label: c.pct + '%', color: c.pct >= 70 ? 'var(--green)' : c.pct >= 50 ? '#ff9f0a' : 'var(--red)' }) + '<div><b>' + esc(ex.name) + '</b><span>' + esc(k.name) + ' · ' + SP.cls(k.classId).label + '</span><div class="row-c" style="gap:6px;margin-top:6px">' + SP.pill('Grade ' + c.grade[0], c.grade[1]) + SP.pill('Position ' + r.pos + '/' + r.of, 'gray') + '</div></div></div>' +
    '<h5>Subjects</h5><div class="pcard">' + c.rows.map(x => { const p = x.m == null ? 0 : pct(x.m, ex.total), g = SP.grade(p); return '<div class="subrow"><b>' + esc(x.sub) + '</b><div class="qbar"><i style="width:' + p + '%;background:' + (p >= 70 ? 'var(--green)' : p >= 50 ? '#ff9f0a' : 'var(--red)') + '"></i></div><span>' + (x.m == null ? '—' : x.m + '/' + ex.total) + '</span>' + SP.pill(g[0], g[1]) + '</div>'; }).join('') + '</div>' +
    '<div class="pcard"><b>Teacher\'s remarks</b><p class="quote">' + SP.remark(c.pct) + '</p><span>Attendance this term: ' + SP.attPct(k.id, 30) + '%</span></div><button class="pbtn" data-act="phToast" data-t="Report card PDF saved (demo)">' + I('dl') + 'Download report card</button></div>';
};

/* ---------- TIMETABLE ---------- */
function ttView(k) {
  const d = +(SP.ui.f.ttDay || D.dow(TODAY)), names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'], now = D.time(nowMin()), isToday = d === D.dow(TODAY);
  return '<div class="days">' + [1, 2, 3, 4, 5].map(x => '<button class="' + (x === d ? 'on' : '') + '" data-act="ttDay" data-d="' + x + '">' + names[x] + '</button>').join('') + '</div>' +
    SP.timetable(k.classId, d).map(p => { if (p.subject === 'Break') return '<div class="pcard brk"><span>' + p.from + ' – ' + p.to + '</span><b>Break</b></div>'; const sub = isToday && SP.S.subst[k.classId + '|' + d + '|' + p.from], live = isToday && p.from <= now && now < p.to; return '<div class="pcard tt' + (live ? ' now' : '') + '"><em>' + p.from + '</em><div><b>' + p.subject + '</b><span>' + esc(SP.teacher(sub || p.teacherId).name) + '</span></div>' + (sub ? SP.pill('Substitute', 'amber') : live ? SP.pill('Now', 'green') : '') + '</div>'; }).join('');
}
SP.act.ttDay = d => { SP.ui.f.ttDay = d.d; SP.render(); };
SP.ps.timetable = () => bar('Timetable', true) + kidChips() + '<div class="ph-pad">' + ttView(kid()) + '</div>';
SP.pt.schedule = () => bar('Timetable') + '<div class="ph-pad">' + ttView(kid()) + '</div>';
})();
