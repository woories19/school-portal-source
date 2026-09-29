/* Phone app shell (parent + student): frame, tabs, navigation stack, home, fees + online payment, chat.
   Learning, results, calendar, notices and consents live in phone2.js and register into SP.pt (tabs) / SP.ps (screens). */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY;
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const ph = () => SP.ui.phone;
const kid = () => SP.stu(SP.S.childId);
const role = () => SP.phoneRole();
const subOf = () => (ph().sub || '').split(':');
SP.pt = {}; SP.ps = {};

SP.act.phTab = d => { SP.ui.phone = { tab: d.t, sub: null, stack: [] }; SP.render(); };
SP.act.phSub = d => { const p = ph(); p.stack = p.stack || []; if (p.sub) p.stack.push(p.sub); p.sub = d.s; SP.render(); };
SP.act.phBack = () => { const p = ph(); if (subOf()[0] === 'pay') SP.ui.pay = null; p.sub = (p.stack || []).pop() || null; SP.render(); };
SP.act.setKid = d => { SP.S.childId = d.id; SP.ui.phone = { tab: ph().tab, sub: null, stack: [] }; SP.render(); };
SP.act.pushOpen = () => { const p = SP.ui.push; SP.ui.push = null; SP.deepLink(p && p.kind, p && p.ref); };

/* ---------- pieces ---------- */
const bar = (title, back) => '<div class="ph-bar">' + (back ? '<button data-act="phBack" aria-label="Back">' + I('left') + '</button>' : '') + '<b>' + title + '</b></div>';
function kidChips() {
  if (role() === 'student') return '';
  const ks = SP.kids(kid().parentId); if (ks.length < 2) return '';
  return '<div class="kchips">' + ks.map(k => '<button class="' + (k.id === kid().id ? 'on' : '') + '" data-act="setKid" data-id="' + k.id + '">' + SP.avatar(k.name, 'xs') + esc(k.first) + '<i>' + SP.cls(k.classId).short + '</i></button>').join('') + '</div>';
}
SP.phx = { bar, kid, kidChips, role };
SP.seg = (items, cur, key) => '<div class="segp">' + items.map(i => '<button class="' + (i[0] === cur ? 'on' : '') + '" data-act="phSeg" data-k="' + key + '" data-v="' + i[0] + '">' + i[1] + (i[2] ? '<i>' + i[2] + '</i>' : '') + '</button>').join('') + '</div>';
SP.act.phSeg = d => { SP.ui.f[d.k] = d.v; SP.render(); };
const feeCard = v => '<div class="pcard fee ' + SP.voucherStatus(v) + '" data-act="phSub" data-s="voucher:' + v.id + '"><div><b>' + D.monthLabel(v.month) + '</b><span>' + v.id + ' · Due ' + D.nice(v.due) + '</span></div><div class="r"><b>' + SP.pkr(v.total) + '</b>' + SP.voucherPill(v) + '</div></div>';
const shown = k => SP.vouchers(k.id).filter(v => v.sent);

/* ---------- HOME (parent) ---------- */
function home() {
  if (role() === 'student') return SP.ps.studentHome();
  const k = kid(), p = SP.parent(k.parentId), S = SP.S, due = shown(k).filter(v => !v.paid), owed = due.reduce((a, v) => a + v.total, 0);
  const todo = SP.pendingWork(k, 2), ann = S.announcements.filter(a => a.audience === 'all' || a.audience === k.classId).sort((a, b) => b.ts.localeCompare(a.ts))[0];
  const forms = SP.pendingForms(k.parentId).length, tile = (ic, l, s, badge) => '<button class="qt" data-act="phSub" data-s="' + s + '"><span>' + I(ic) + (badge ? '<i class="badge hot">' + badge + '</i>' : '') + '</span>' + l + '</button>';
  return '<div class="ph-hero"><div><span>Assalamualaikum,</span><b>' + esc(p.name.split(' ')[0]) + '</b></div><button class="bellb" data-act="phTab" data-t="inbox" aria-label="Inbox">' + I('bell') + '</button></div>' + kidChips() +
    '<div class="ph-pad"><div class="pcard child">' + SP.avatar(k.name, 'lg') + '<div><b>' + esc(k.name) + '</b><span>' + SP.cls(k.classId).label + ' · Roll ' + k.roll + '</span></div></div>' + SP.liveCard(k) +
    (forms ? '<button class="pcard action" data-act="phTab" data-t="inbox" data-tour="ph-cons-banner">' + I('board') + '<div><b>' + forms + ' form' + (forms > 1 ? 's need' : ' needs') + ' your signature</b><span>Tap to review and sign</span></div>' + I('right') + '</button>' : '') +
    (owed ? '<div class="pcard due" data-tour="ph-due"><div><span>Fee due</span><b>' + SP.pkr(owed) + '</b><i>' + due.length + ' voucher' + (due.length > 1 ? 's' : '') + '</i></div><button class="pay" data-act="phTab" data-t="fees">Pay now</button></div>' + (SP.locked(k.id) ? '<div class="pwarn">' + I('lock') + 'Gate entry is on hold until dues are cleared.</div>' : '') : '<div class="pcard clear">' + I('check') + '<div><b>Fees are up to date</b><span>Thank you!</span></div></div>') +
    '<div class="qgrid">' + tile('check', 'Attendance', 'attendance') + tile('clock', 'Timetable', 'timetable') + tile('award', 'Results', 'results') + tile('cal', 'Calendar', 'calendar') + tile('file', 'Resources', 'resources') + tile('board', 'Notices', 'notices') + tile('pen', 'Consents', 'consents', forms || '') + tile('list', 'Diary', 'diaryjump') + '</div>' +
    (todo.length ? '<h5>Coming up for ' + esc(k.first) + '</h5>' + todo.map(SP.workCard).join('') : '') +
    (ann ? '<h5>Latest announcement</h5><div class="pcard ann"><b>' + esc(ann.title) + '</b><span>' + esc(ann.body.slice(0, 110)) + '…</span></div>' : '') + '</div>';
}

/* ---------- FEES (parent) ---------- */
function fees() {
  const k = kid(), list = shown(k).slice().reverse();
  return bar('Fees') + kidChips() + '<div class="ph-pad">' + (list.map(feeCard).join('') || SP.empty('No vouchers yet')) + '</div>';
}
function voucher(vid) {
  const k = kid(), v = SP.vouchers(k.id).find(x => x.id === vid); if (!v) return fees();
  return bar('Fee voucher', true) + '<div class="ph-pad"><div class="pcard vch"><div class="vt"><b>' + D.monthLabel(v.month) + '</b>' + SP.voucherPill(v) + '</div><span>' + v.id + '</span>' +
    v.heads.map(h => '<div class="vl"><span>' + esc(h[0]) + '</span><b>' + SP.pkr(h[1]) + '</b></div>').join('') + '<div class="vl tot"><span>Total</span><b>' + SP.pkr(v.total) + '</b></div><div class="vl"><span>Due date</span><b>' + D.niceY(v.due) + '</b></div>' +
    (v.paid ? '<div class="vl"><span>Paid</span><b>' + D.nice(v.paidOn) + ' · ' + esc(v.method) + '</b></div>' : '') + '</div>' +
    (v.paid ? '<button class="pbtn ghost" data-act="phReceipt" data-v="' + v.id + '">' + I('file') + 'Download receipt</button>' : '<button class="pbtn" data-tour="ph-pay" data-act="phPayStart" data-v="' + v.id + '">Pay ' + SP.pkr(v.total) + ' online</button>') + '</div>';
}
SP.act.phReceipt = () => SP.toast('Receipt saved to your phone (demo)');
SP.act.phPayStart = d => { SP.ui.pay = { vid: d.v, method: 'jazzcash', step: 'pick' }; SP.act.phSub({ s: 'pay:' + d.v }); };
SP.act.phPayMethod = d => { SP.ui.pay.method = d.m; SP.render(); };
const METHODS = [['jazzcash', 'JazzCash', 'JazzCash', 'Mobile wallet', '0300-1234567'], ['easypaisa', 'Easypaisa', 'Easypaisa', 'Mobile wallet', '0345-7654321'], ['card', 'Debit / Credit card', 'Card', 'Visa · Mastercard', '4242 4242 4242 4242'], ['bank', 'Raast / bank app', 'Bank Deposit', 'Instant transfer', 'PK36 SCBL 0000 0011 2345 01']];
function pay(vid) {
  const k = kid(), v = SP.vouchers(k.id).find(x => x.id === vid), u = SP.ui.pay || { step: 'pick', method: 'jazzcash' }, m = METHODS.find(x => x[0] === u.method);
  if (u.step === 'processing') return '<div class="ph-center"><div class="spin"></div><b>Processing payment…</b><span>Please don\'t close the app</span></div>';
  if (u.step === 'done') return '<div class="ph-center ok"><div class="okc">' + I('check') + '</div><b>Payment successful</b><h2>' + SP.pkr(v.total) + '</h2><div class="rcpt"><div><span>Voucher</span><b>' + v.id + '</b></div><div><span>Paid via</span><b>' + esc(m[1]) + '</b></div><div><span>Transaction ID</span><b>TXN' + (u.txn || '') + '</b></div><div><span>Date</span><b>' + D.nice(TODAY) + ' · ' + SP.clock() + '</b></div></div><button class="pbtn" data-act="phPayDone">Done</button></div>';
  return bar('Pay online', true) + '<div class="ph-pad"><div class="pcard"><span>Paying for ' + D.monthLabel(v.month) + '</span><h2>' + SP.pkr(v.total) + '</h2></div><h5>Choose payment method</h5>' +
    METHODS.map(x => '<button class="pm ' + (x[0] === u.method ? 'on' : '') + '" data-act="phPayMethod" data-m="' + x[0] + '"><span class="rd"></span><div><b>' + x[1] + '</b><span>' + x[3] + '</span></div></button>').join('') +
    '<div class="field"><label>' + (u.method === 'card' ? 'Card number' : u.method === 'bank' ? 'IBAN' : 'Mobile number') + '</label><input class="input" value="' + m[4] + '" readonly></div>' +
    '<button class="pbtn" data-tour="ph-confirm" data-act="phPayGo">Pay ' + SP.pkr(v.total) + '</button><p class="fine">Demo only — no real payment is made.</p></div>';
}
SP.act.phPayGo = () => {
  const u = SP.ui.pay; if (!u) return; u.step = 'processing'; SP.render();
  setTimeout(() => {
    const k = kid(), vid = u.vid, v = SP.vouchers(k.id).find(x => x.id === vid), m = METHODS.find(x => x[0] === u.method);
    if (!v || v.paid) { SP.ui.pay = null; return SP.render(); }
    SP.recordPayment(k.id, vid, m[2], { online: true }); u.step = 'done'; u.txn = String(Math.floor(10000000 + Math.random() * 89999999));
    SP.toast('Online payment received · ' + SP.pkr(v.total) + ' from ' + SP.parent(k.parentId).name + ' (' + k.first + ')');
    SP.render();
  }, 1600);
};
SP.act.phPayDone = () => { SP.ui.pay = null; ph().sub = null; ph().stack = []; SP.render(); };

/* ---------- CHAT (parent) ---------- */
const parentThreads = () => SP.S.threads.filter(t => SP.stu(t.studentId).parentId === kid().parentId).sort((a, b) => b.messages[b.messages.length - 1].ts.localeCompare(a.messages[a.messages.length - 1].ts));
function chat() {
  const list = parentThreads();
  return bar('Messages') + '<div class="ph-pad"><button class="pbtn" data-act="phSub" data-s="new" data-tour="ph-newmsg">' + I('plus') + 'New message / leave request</button>' + (list.map(t => { const m = t.messages[t.messages.length - 1]; return '<button class="pcard thr ' + (t.unreadParent ? 'un' : '') + '" data-act="phThread" data-id="' + t.id + '"><div><b>' + esc(t.subject) + '</b><em>' + D.niceTs(m.ts) + '</em></div><span>' + esc(m.text.slice(0, 60)) + '</span>' + (t.leave ? SP.pill('Leave ' + t.leave.status, t.leave.status === 'approved' ? 'green' : t.leave.status === 'pending' ? 'amber' : 'red') : '') + '</button>'; }).join('') || SP.empty('No messages yet')) + '</div>';
}
SP.act.phThread = d => { const t = SP.S.threads.find(x => x.id === d.id); t.unreadParent = false; SP.act.phSub({ s: 'thread:' + d.id }); };
function thread(id) {
  const t = SP.S.threads.find(x => x.id === id); if (!t) return chat();
  return bar(esc(t.subject), true) + '<div class="ph-chat" data-scroll="pchat" data-stick="1">' + t.messages.map(m => '<div class="pb ' + (m.from === 'parent' ? 'me' : 'them') + '">' + (m.from === 'school' ? '<em>' + esc(m.who) + '</em>' : '') + esc(m.text) + '<span>' + D.niceTs(m.ts) + '</span></div>').join('') + '</div>' +
    '<div class="ph-comp"><input class="input" id="pm-text" placeholder="Type a message" data-enter="phSend" autocomplete="off"><button data-act="phSend" data-id="' + t.id + '" data-tour="ph-send" aria-label="Send">' + I('send') + '</button></div>';
}
SP.act.phSend = d => { const text = $v('pm-text'); if (!text) return; const t = SP.S.threads.find(x => x.id === (d.id || subOf()[1])); const p = SP.parent(kid().parentId); t.messages.push({ from: 'parent', who: p.name, text, ts: SP.stamp() }); t.unreadAdmin = true; SP.toast('New message from ' + p.name); SP.render(); };
SP.ui.nm = { type: 'Leave request' };
function newMsg() {
  const ks = SP.kids(kid().parentId), nm = SP.ui.nm, leave = nm.type === 'Leave request';
  return bar('New message', true) + '<div class="ph-pad"><div class="field"><label>Type</label><div class="tsel">' + ['Leave request', 'General', 'Fee query'].map(t => '<button class="' + (nm.type === t ? 'on' : '') + '" data-act="phNmType" data-t="' + t + '">' + t + '</button>').join('') + '</div></div>' +
    (ks.length > 1 ? '<div class="field"><label>Regarding</label><select class="input" id="nm-kid">' + ks.map(k => '<option value="' + k.id + '"' + (k.id === kid().id ? ' selected' : '') + '>' + esc(k.name) + '</option>').join('') + '</select></div>' : '') +
    (leave ? '<div class="field"><label>Leave date</label><input type="date" class="input" id="nm-date" value="' + D.add(TODAY, 1) + '"></div>' : '') +
    '<div class="field"><label>Message</label><textarea class="input" id="nm-text" rows="4" placeholder="Write your message…">' + (leave ? esc(kid().first) + ' is unwell and will not be able to attend school. Kindly grant leave.' : '') + '</textarea></div><button class="pbtn" data-act="phNmSend" data-tour="ph-nm-send">Send to school</button></div>';
}
SP.act.phNmType = d => { SP.ui.nm.type = d.t; SP.render(); };
SP.act.phNmSend = () => {
  const text = $v('nm-text'); if (!text) return SP.toast('Write a message first', 'warn');
  const nm = SP.ui.nm, sid = $v('nm-kid') || kid().id, p = SP.parent(kid().parentId), leave = nm.type === 'Leave request';
  const t = { id: SP.uid('C'), studentId: sid, type: nm.type, subject: leave ? 'Leave request' : nm.type === 'Fee query' ? 'Fee query' : 'General message', status: 'open', unreadAdmin: true, unreadParent: false, messages: [{ from: 'parent', who: p.name, text, ts: SP.stamp() }] };
  if (leave) t.leave = { date: $v('nm-date') || D.add(TODAY, 1), status: 'pending' };
  SP.S.threads.unshift(t); ph().sub = 'thread:' + t.id; ph().stack = []; SP.toast((leave ? 'Leave request' : 'Message') + ' from ' + p.name + ' — ' + SP.stu(sid).first); SP.render();
};

/* ---------- frame ---------- */
SP.pt.home = home; SP.pt.fees = fees; SP.pt.chat = chat;
SP.ps.voucher = voucher; SP.ps.pay = pay; SP.ps.thread = thread; SP.ps.new = newMsg;
function screen() {
  const t = ph().tab, s = subOf();
  if (s[0] && SP.ps[s[0]]) return SP.ps[s[0]](s[1], s[2]);
  const f = SP.pt[t] || SP.pt.home; return f();
}
const TABS = { parent: [['home', 'home', 'Home'], ['learn', 'book', 'Learn'], ['fees', 'cash', 'Fees'], ['chat', 'chat', 'Chat'], ['inbox', 'bell', 'Inbox']], student: [['home', 'home', 'Home'], ['learn', 'book', 'Learn'], ['schedule', 'clock', 'Timetable'], ['results', 'award', 'Results'], ['inbox', 'bell', 'Alerts']] };
SP.phone = function () {
  const r = role(), tabs = TABS[r]; if (!tabs.some(x => x[0] === ph().tab)) SP.ui.phone = { tab: 'home', sub: null, stack: [] };
  const t = ph().tab, un = SP.parentUnread(kid().parentId), inb = r === 'parent' ? SP.pendingForms(kid().parentId).length + SP.unackedCount(kid().parentId) : 0;
  const full = (subOf()[0] === 'pay' && SP.ui.pay && (SP.ui.pay.step === 'processing' || SP.ui.pay.step === 'done')) || subOf()[0] === 'quizrun';
  const push = SP.ui.push ? '<button class="ph-push" data-act="pushOpen"><span class="pi">' + I('bell') + '</span><div><em>School Portal · now</em><b>' + esc(SP.ui.push.title) + '</b><span>' + esc((SP.ui.push.body || '').slice(0, 80)) + '</span></div></button>' : '';
  return '<div class="phone ' + r + '"><div class="ph-status"><b>' + SP.clock() + '</b><span class="notch"></span><span>' + I('trend') + '</span></div>' + push +
    '<div class="ph-scroll" data-scroll="ph">' + screen() + '</div>' +
    '<nav class="ph-tabs' + (full ? ' hide' : '') + '">' + tabs.map(x => '<button class="' + (t === x[0] ? 'on' : '') + '" data-act="phTab" data-t="' + x[0] + '" data-tour="ph-tab-' + x[0] + '">' + I(x[1]) + '<span>' + x[2] + '</span>' + (x[0] === 'chat' && un ? '<i class="badge hot">' + un + '</i>' : '') + (x[0] === 'inbox' && inb ? '<i class="badge hot">' + inb + '</i>' : '') + '</button>').join('') + '</nav></div>';
};
SP.phoneSide = function () {
  const st = role() === 'student';
  return '<div class="pside"><h3>' + (st ? 'Student app' : 'Parent app') + '</h3><p>' + (st ? 'This is what a student sees on their own phone. Homework, quizzes, notes and results — all in one place.' : 'This is exactly what a parent sees on their phone. Everything is live — anything you change in the Admin console or Teacher view appears here instantly.') + '</p><ul>' +
    (st ? '<li>' + I('check') + 'Submit assignments with a photo or typed answer</li><li>' + I('check') + 'Take timed quizzes and see the score instantly</li><li>' + I('check') + 'Read notes and view report cards</li>' : '<li>' + I('check') + 'Pay the fee voucher online</li><li>' + I('check') + 'Track attendance live and sign the daily diary</li><li>' + I('check') + 'Approve consent forms and RSVP to events</li>') + '</ul>' + SP.btn('Open the admin console', 'persona', { c: 'pri', d: { p: 'admin' } }) + '</div>';
};
})();
