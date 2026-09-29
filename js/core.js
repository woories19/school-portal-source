/* State, selectors, notifications, event delegation, render engine. */
(function () {
'use strict';
const SP = window.SP;
const D = SP.D, TODAY = SP.TODAY;
const KEY = 'sp_demo_v3', VER = 3;

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
  const S = {
    v: VER, persona: 'admin', route: { admin: 'dashboard', teacher: 'today', staff: 'desk' }, split: true, dockRole: 'parent', childId: kids[0].id, teacherId: 'T09', staffId: 'O05',
    fees, attToday: t.marks, attSubmitted: t.submitted, applicants: SP.seedApplicants().map(SP.enrichApplicant), queueIdx: 0, threads: SP.seedThreads(), announcements: SP.seedAnnouncements(), diary: SP.seedDiary(),
    notifs: {}, gate: { enabled: true, minMonths: 2, overrides: {}, log: [] }, newStudents: [], newParents: [], clock: 3, feeMonth: '2026-09',
    assign: [], subs: {}, qz: [], att2: {}, notes: [], res: [], exams: SP.EXAMS.map(e => Object.assign({}, e)), marks: {}, markSaved: {}, events: [], circ: SP.seedCirculars(), forms: SP.seedForms(), consents: {},
    demoKids: kids.map(k => k.id),     asgOv: {}, notesDel: {}, views: {}, subst: {}, rsvps: {}, evDel: {}, attTimes: {}, diarySign: {}, visitors: SP.seedVisitors(), gateOut: {}, passes: [], sys: { checks: 0, lastCheck: TODAY + ' 10:12', backup: TODAY + ' 02:00', erpSync: TODAY + ' 10:05', erpQueue: 3, log: [] }, exports: [], sched: { att: true, fee: true, exam: false, cons: true }
  };
  // give the demo family live coursework so the student / parent apps have something real to do
  kids.forEach((k, i) => {
    const c = SP.cls(k.classId), sub = ['Science', 'Mathematics'][i % 2];
    S.qz.push({ id: 'QZ' + (i + 1), classId: c.id, subject: sub, title: sub + ' — chapter check', mins: 10, status: 'live', date: D.add(TODAY, -1), close: D.add(TODAY, 3), qs: SP.questionsFor(sub, c.grade, 5, i + 3), showAns: true, teacherId: SP.ALLOC[c.id][sub], seeded: false });
  });
  return S;
};
function load() { try { const r = localStorage.getItem(KEY); if (r) { const s = JSON.parse(r); if (s && s.v === VER) return s; } } catch (e) { } return SP.freshState(); }
// saves are batched: stringifying the whole state on every click is wasteful, so write once things settle (and on exit)
let saveT = 0, resetting = false;
SP.saveNow = () => { clearTimeout(saveT); saveT = 0; if (resetting) return; try { localStorage.setItem(KEY, JSON.stringify(SP.S)); } catch (e) { } };
SP.save = () => { if (!saveT) saveT = setTimeout(SP.saveNow, 350); };
SP.reset = () => { resetting = true; clearTimeout(saveT); try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); };
addEventListener('pagehide', SP.saveNow); document.addEventListener('visibilitychange', () => { if (document.hidden) SP.saveNow(); });
SP.boot = function () {
  SP.S = load(); const S = SP.S;
  S.newParents.forEach(p => { if (!SP.PARENT_MAP[p.id]) { SP.PARENTS.push(p); SP.PARENT_MAP[p.id] = p; } });
  S.newStudents.forEach(s => { if (!SP.STU_MAP[s.id]) { SP.STUDENTS.push(s); SP.STU_MAP[s.id] = s; } });
  if (!SP.STU_MAP[S.childId]) S.childId = SP.STUDENTS[0].id;
  (S.demoKids || []).forEach((id, i) => { if (SP.STU_MAP[id]) SP.STU_MAP[id].ability = [.88, .78][i] || .8; });
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
SP.phoneRole = () => SP.S.persona === 'student' ? 'student' : SP.S.persona === 'parent' ? 'parent' : (SP.S.dockRole || 'parent');
// n.who: 'both' (default) | 'parent' | 'student' — controls which app shows the push banner and lists the alert
SP.notify = function (sids, n) {
  const S = SP.S, ts = SP.stamp(), who = n.who || 'both';
  sids.forEach(id => { (S.notifs[id] = S.notifs[id] || []).unshift({ id: SP.uid('n'), kind: n.kind, title: n.title, body: n.body, ts, ref: n.ref || null, who }); });
  const cur = SP.stu(S.childId), role = SP.phoneRole();
  if (cur && (who === 'both' || who === role) && sids.some(id => SP.stu(id) && (role === 'student' ? id === cur.id : SP.stu(id).parentId === cur.parentId))) SP.push(n.title, n.body, n.kind, n.ref);
};
SP.push = function (title, body, kind, ref) {
  SP.ui.push = { title, body, kind, ref, id: Date.now() };
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
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-act]:not(button):not(a):not(input):not(textarea):not(select)') && !e.target.classList.contains('backdrop')) { e.preventDefault(); e.target.click(); return; }
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

/* ---------- render engine: keeps scroll + input focus, and drives all motion from *changes* ----------
   The whole tree is rebuilt on every render, so entrance animations must never live on the elements themselves
   (they would replay on every click). Instead we compare this render to the last one and set flag classes on #app
   (a-page, a-push, a-pop, a-tab, a-modal, a-drawer, a-tour, a-step, a-banner, a-dv); CSS animates only under a flag. */
let carry = [], carryT = 0, lastKeys = { ws: '', ph: '' }, last = { ws: '', ph: '', depth: 0, modal: '', drawer: '', tourOn: false, tourStep: '', push: 0, dv: 0 }, lastSeg = {};
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const EASE = 'cubic-bezier(.32,.72,0,1)';
function segMap(app, k) {
  const m = {}; app.querySelectorAll('.seg,.segp,.segb').forEach((c, i) => {
    const on = c.querySelector('.on'); if (!on) return;
    const id = (c.closest('.topbar') ? 'top' : c.closest('.phone') ? 'ph:' + k.ph : 'ws:' + k.ws) + '#' + i;
    m[id] = { x: on.getBoundingClientRect().left - c.getBoundingClientRect().left, el: on };
  });
  return m;
}
SP.render = function () {
  SP.save();
  const app = document.getElementById('app'), T = SP.tour || {}, ui = SP.ui;
  const scr = {}; app.querySelectorAll('[data-scroll]').forEach(el => { scr[el.dataset.scroll] = el.scrollTop; });
  const ae = document.activeElement; let focus = null;
  if (ae && ae.id && app.contains(ae) && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) focus = { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd };
  const keys = { ws: SP.S.persona + '/' + SP.route() + '/' + (ui.f.thread || ''), ph: ui.phone.tab + '/' + (ui.phone.sub || '') };

  // what changed since the last render?
  const cur = { ws: SP.S.persona + '/' + SP.route(), ph: SP.phoneRole() + '/' + ui.phone.tab + '/' + (ui.phone.sub || ''), depth: (ui.phone.stack || []).length + (ui.phone.sub ? 1 : 0), modal: ui.modal ? ui.modal.name : T.list ? 'tourlist' : '', drawer: ui.drawer ? ui.drawer.name : '', tourOn: !!T.on, tourStep: T.on ? T.fi + '/' + T.si : '', push: ui.push ? ui.push.id : 0, dv: ui.deliver ? ui.deliver.start : 0 };
  const flags = [], prevPhTab = last.ph.split('/').slice(0, 2).join('/'), curPhTab = cur.ph.split('/').slice(0, 2).join('/');
  if (cur.ws !== last.ws) flags.push('a-page');
  if (cur.ph !== last.ph) flags.push(curPhTab !== prevPhTab ? 'a-tab' : cur.depth > last.depth ? 'a-push' : cur.depth < last.depth ? 'a-pop' : 'a-tab');
  if (cur.modal && cur.modal !== last.modal) flags.push('a-modal');
  if (cur.drawer && cur.drawer !== last.drawer) flags.push('a-drawer');
  if (cur.tourOn && !last.tourOn) flags.push('a-tour');
  if (cur.tourOn && cur.tourStep !== last.tourStep) flags.push('a-step');
  if (cur.push && cur.push !== last.push) flags.push('a-banner');
  if (cur.dv && cur.dv !== last.dv) flags.push('a-dv');
  // several renders can happen inside one click (a step calls a setup that renders, then renders again): keep the flags for the whole tick
  carry.forEach(f => { if (flags.indexOf(f) < 0) flags.push(f); }); carry = flags.slice();
  if (!carryT) carryT = setTimeout(() => { carry = []; carryT = 0; }, 0);
  const still = reduced();
  const before = still ? null : segMap(app, { ws: last.ws, ph: last.ph });
  const oldOv = app.querySelector(':scope > .backdrop'), oldPush = app.querySelector('.ph-push'), oldTour = app.querySelector(':scope > .tour-card');

  app.className = flags.join(' ');
  app.innerHTML = SP.views.shell();

  // exit animations: keep the removed node around for a beat and fade it out
  if (!still) {
    if (oldOv && !app.querySelector(':scope > .backdrop')) { oldOv.classList.add('ghost'); document.body.appendChild(oldOv); setTimeout(() => oldOv.remove(), 300); }
    const ph = app.querySelector('.phone'); if (oldPush && ph && !ph.querySelector('.ph-push') && !oldPush.classList.contains('ghost')) { oldPush.classList.add('ghost'); ph.appendChild(oldPush); setTimeout(() => oldPush.remove(), 320); }
    if (oldTour && !app.querySelector(':scope > .tour-card')) { oldTour.classList.add('ghost'); document.body.appendChild(oldTour); setTimeout(() => oldTour.remove(), 300); }
    // a selected segment slides to its new position instead of jumping
    const now = segMap(app, cur);
    Object.keys(now).forEach(id => { const b = before[id]; if (!b) return; const dx = b.x - now[id].x; if (Math.abs(dx) > 2) try { now[id].el.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 300, easing: EASE }); } catch (e) { } });
  }
  last = cur; lastSeg = null;

  app.querySelectorAll('[data-scroll]').forEach(el => {
    const k = el.dataset.scroll;
    if (keys[k] === lastKeys[k] && scr[k] != null) el.scrollTop = scr[k];
    else if (k === 'ph' || k === 'ws') el.scrollTop = 0;
    if (el.dataset.stick) el.scrollTop = el.scrollHeight;
  });
  lastKeys = keys;
  // clickable non-buttons (table rows, cards) are reachable and operable with the keyboard
  app.querySelectorAll('[data-act]:not(button):not(a):not(input):not(.backdrop)').forEach(el => { el.tabIndex = 0; el.setAttribute('role', 'button'); });
  if (focus) { const el = document.getElementById(focus.id); if (el) { el.focus(); try { el.setSelectionRange(focus.s, focus.e); } catch (e) { } } }
  if (SP.tour && SP.tour.afterRender) SP.tour.afterRender();
};
})();
