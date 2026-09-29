/* State, selectors, notifications, event delegation, render engine. */
(function () {
'use strict';
const SP = window.SP;
const D = SP.D, TODAY = SP.TODAY;
const KEY = 'sp_demo_v2', VER = 2;

SP.act = {}; SP.inp = {}; SP.views = {}; SP.modals = {}; SP.drawers = {};
SP.ui = { page: {}, phone: { tab: 'home', sub: null }, modal: null, drawer: null, push: null, f: {} };

/* ---------- utils ---------- */
SP.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
SP.pkr = n => 'Rs ' + Math.round(n).toLocaleString('en-US');
SP.initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
SP.uid = p => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

/* ---------- state ---------- */
SP.freshState = function () {
  const fees = SP.seedFees();
  const pairs = SP.PARENTS.filter(p => SP.STUDENTS.filter(s => s.parentId === p.id).length === 2);
  const open = ['5A', '5B', '6A', '7B']; // classes whose attendance is still unmarked today
  const two = pairs.find(p => SP.kids(p.id).some(k => open.indexOf(k.classId) > -1)) || pairs[0];
  const kids = SP.STUDENTS.filter(s => s.parentId === two.id).sort((a, b) => (open.indexOf(b.classId) > -1) - (open.indexOf(a.classId) > -1) || a.grade - b.grade);
  kids.forEach(k => { const v = fees[k.id]; v[0].paid = v[1].paid = true; v[0].paidOn = '2026-07-06'; v[1].paidOn = '2026-08-08'; v[0].method = v[1].method = 'Cash'; v[2].paid = false; v[2].paidOn = null; v[2].method = null; });
  const t = SP.seedToday();
  return {
    v: VER, persona: 'admin', route: { admin: 'dashboard', teacher: 'attendance' }, split: true, childId: kids[0].id, teacherId: 'T09',
    fees, attToday: t.marks, attSubmitted: t.submitted, applicants: SP.seedApplicants(), queueIdx: 0, threads: SP.seedThreads(), announcements: SP.seedAnnouncements(), diary: SP.seedDiary(),
    notifs: {}, gate: { enabled: true, minMonths: 2, overrides: {}, log: [] }, newStudents: [], newParents: [], clock: 3, feeMonth: '2026-09', quizzes: []
  };
};
function load() { try { const r = localStorage.getItem(KEY); if (r) { const s = JSON.parse(r); if (s && s.v === VER) return s; } } catch (e) { } return SP.freshState(); }
SP.save = () => { try { localStorage.setItem(KEY, JSON.stringify(SP.S)); } catch (e) { } };
SP.reset = () => { try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); };
SP.boot = function () {
  SP.S = load(); const S = SP.S;
  S.newParents.forEach(p => { if (!SP.PARENT_MAP[p.id]) { SP.PARENTS.push(p); SP.PARENT_MAP[p.id] = p; } });
  S.newStudents.forEach(s => { if (!SP.STU_MAP[s.id]) { SP.STUDENTS.push(s); SP.STU_MAP[s.id] = s; } });
  if (!SP.STU_MAP[S.childId]) S.childId = SP.STUDENTS[0].id;
};

/* ---------- selectors ---------- */
SP.stu = id => SP.STU_MAP[id];
SP.cls = id => SP.CLASSES.find(c => c.id === id);
SP.parent = id => SP.PARENT_MAP[id];
SP.teacher = id => SP.STAFF_ALL.find(t => t.id === id);
SP.kids = pid => SP.STUDENTS.filter(s => s.parentId === pid);
SP.inClass = cid => SP.STUDENTS.filter(s => s.classId === cid);
SP.vouchers = sid => SP.S.fees[sid] || [];
SP.owed = sid => SP.vouchers(sid).reduce((a, v) => a + (v.paid ? 0 : v.total), 0);
SP.overdueN = sid => SP.vouchers(sid).filter(v => !v.paid && v.sent && v.due < TODAY).length;
SP.locked = sid => SP.S.gate.enabled && SP.overdueN(sid) >= SP.S.gate.minMonths && !SP.S.gate.overrides[sid];
SP.mark = sid => SP.S.attToday[sid] || null;
SP.attPct = (sid, n) => { const a = SP.ATT[sid]; if (!a) return 100; const s = a.slice(-n); return Math.round(100 * (s.split('P').length - 1) / s.length); };
SP.voucherStatus = v => v.paid ? 'paid' : (v.due < TODAY ? 'overdue' : 'due');
SP.stamp = () => TODAY + ' ' + D.time(SP.NOW_MIN + SP.S.clock++);
SP.clock = () => D.time(SP.NOW_MIN + SP.S.clock);
SP.stats = function () {
  const S = SP.S; const st = { total: SP.STUDENTS.length, present: 0, absent: 0, leave: 0, unmarked: 0 };
  SP.STUDENTS.forEach(s => { const m = S.attToday[s.id]; if (m === 'P') st.present++; else if (m === 'A') st.absent++; else if (m === 'L') st.leave++; else st.unmarked++; });
  st.staffTotal = SP.STAFF_ALL.length; st.staffIn = SP.STAFF_ALL.filter(t => SP.staffToday(t.id) !== 'A' && SP.staffToday(t.id) !== 'L').length;
  return st;
};
SP.staffToday = id => SP.STAFF_ATT[id][SP.STAFF_ATT[id].length - 1];
SP.monthVouchers = ym => { const out = []; SP.STUDENTS.forEach(s => { const v = SP.vouchers(s.id).find(x => x.month === ym); if (v) out.push({ s, v }); }); return out; };
SP.unreadAdmin = () => SP.S.threads.filter(t => t.unreadAdmin).length;
SP.parentUnread = pid => SP.S.threads.filter(t => t.unreadParent && SP.stu(t.studentId).parentId === pid).length;

/* ---------- notify / toast / push ---------- */
SP.toast = function (msg, tone) {
  const box = document.getElementById('toasts'); if (!box) return;
  const el = document.createElement('div'); el.className = 'toast ' + (tone || 'ok');
  el.innerHTML = SP.icon(tone === 'warn' ? 'alert' : 'check') + '<span>' + SP.esc(msg) + '</span>';
  box.appendChild(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
};
SP.notify = function (sids, n) {
  const S = SP.S, ts = SP.stamp();
  sids.forEach(id => { (S.notifs[id] = S.notifs[id] || []).unshift({ id: SP.uid('n'), kind: n.kind, title: n.title, body: n.body, ts, ref: n.ref || null }); });
  const cur = SP.stu(S.childId);
  if (cur && sids.some(id => SP.stu(id) && SP.stu(id).parentId === cur.parentId)) SP.push(n.title, n.body, n.kind);
};
SP.push = function (title, body, kind) {
  SP.ui.push = { title, body, kind, id: Date.now() };
  const id = SP.ui.push.id;
  setTimeout(() => { if (SP.ui.push && SP.ui.push.id === id) { SP.ui.push = null; SP.render(); } }, 4800);
};

/* ---------- event delegation ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = SP.act[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'A') e.preventDefault();
  fn(el.dataset, el, e);
});
document.addEventListener('input', e => { const el = e.target.closest('[data-in]'); if (el && SP.inp[el.dataset.in]) SP.inp[el.dataset.in](el.value, el, el.dataset); });
document.addEventListener('change', e => { const el = e.target.closest('[data-ch]'); if (el && SP.inp[el.dataset.ch]) SP.inp[el.dataset.ch](el.type === 'checkbox' ? el.checked : el.value, el, el.dataset); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (SP.ui.modal) SP.act.closeModal(); else if (SP.ui.drawer) SP.act.closeDrawer(); }
  if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-enter]')) { const b = document.querySelector('[data-act="' + e.target.dataset.enter + '"]'); if (b) b.click(); }
});

/* ---------- navigation ---------- */
SP.route = () => SP.S.route[SP.S.persona];
SP.go = function (r) { SP.S.route[SP.S.persona] = r; SP.ui.drawer = null; SP.ui.modal = null; SP.render(); };
SP.openModal = (name, args) => { SP.ui.modal = { name, args }; SP.render(); };
SP.openDrawer = (name, args) => { SP.ui.drawer = { name, args }; SP.render(); };
SP.act.nav = d => SP.go(d.r);
SP.act.closeModal = () => { SP.ui.modal = null; SP.render(); };
SP.act.closeDrawer = () => { SP.ui.drawer = null; SP.render(); };
SP.act.backdrop = (d, el, e) => { if (e.target === el) { SP.ui.modal = null; SP.ui.drawer = null; SP.render(); } };
SP.act.page = d => { SP.ui.page[d.key] = Math.max(0, (SP.ui.page[d.key] || 0) + (+d.d)); SP.render(); };
SP.act.persona = d => { SP.S.persona = d.p; SP.ui.modal = null; SP.ui.drawer = null; SP.render(); };
SP.act.toggleSplit = () => { SP.S.split = !SP.S.split; SP.render(); };
SP.act.reset = () => { if (confirm('Reset all demo data back to the starting point?')) SP.reset(); };
SP.inp.filter = (v, el, d) => { SP.ui.f[d.k] = v; SP.ui.page[d.pk || d.k] = 0; SP.render(); };
SP.f = (k, def) => (SP.ui.f[k] == null ? (def == null ? '' : def) : SP.ui.f[k]);
SP.act.setFilter = d => { SP.ui.f[d.k] = d.v; SP.ui.page[d.pk || d.k] = 0; SP.render(); };

/* ---------- render engine (keeps scroll + input focus) ---------- */
let lastKeys = { ws: '', ph: '' };
SP.render = function () {
  SP.save();
  const app = document.getElementById('app');
  const scr = {}; app.querySelectorAll('[data-scroll]').forEach(el => { scr[el.dataset.scroll] = el.scrollTop; });
  const ae = document.activeElement; let focus = null;
  if (ae && ae.id && app.contains(ae) && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) focus = { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd };
  const keys = { ws: SP.S.persona + '/' + SP.route() + '/' + (SP.ui.f.thread || ''), ph: SP.ui.phone.tab + '/' + (SP.ui.phone.sub || '') };
  app.innerHTML = SP.views.shell();
  app.querySelectorAll('[data-scroll]').forEach(el => {
    const k = el.dataset.scroll;
    if (keys[k] === lastKeys[k] && scr[k] != null) el.scrollTop = scr[k];
    else if (k === 'ph' || k === 'ws') el.scrollTop = 0;
    if (el.dataset.stick) el.scrollTop = el.scrollHeight;
  });
  lastKeys = keys;
  if (focus) { const el = document.getElementById(focus.id); if (el) { el.focus(); try { el.setSelectionRange(focus.s, focus.e); } catch (e) { } } }
  if (SP.tour && SP.tour.afterRender) SP.tour.afterRender();
};
})();
