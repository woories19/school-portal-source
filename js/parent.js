/* Parent mobile app (rendered inside a phone frame). */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY;
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const ph = () => SP.ui.phone;
const kid = () => SP.stu(SP.S.childId);
const subOf = () => (ph().sub || '').split(':');

SP.act.phTab = d => { SP.ui.phone = { tab: d.t, sub: null }; SP.render(); };
SP.act.phSub = d => { ph().sub = d.s; SP.render(); };
SP.act.phBack = () => { const s = subOf(); ph().sub = s[0] === 'pay' ? 'voucher:' + s[1] : null; if (s[0] === 'pay') SP.ui.pay = null; SP.render(); };
SP.act.setKid = d => { SP.S.childId = d.id; SP.ui.phone = { tab: ph().tab, sub: null }; SP.render(); };
SP.act.pushOpen = () => { const p = SP.ui.push; SP.ui.push = null; const t = { fee: 'fees', message: 'chat', diary: 'diary', attendance: 'alerts', announcement: 'alerts' }[p && p.kind] || 'alerts'; SP.ui.phone = { tab: t, sub: null }; SP.render(); };

/* ---------- pieces ---------- */
const bar = (title, back) => '<div class="ph-bar">' + (back ? '<button data-act="phBack">' + I('left') + '</button>' : '') + '<b>' + title + '</b></div>';
function kidChips() {
  const ks = SP.kids(kid().parentId); if (ks.length < 2) return '';
  return '<div class="kchips">' + ks.map(k => '<button class="' + (k.id === kid().id ? 'on' : '') + '" data-act="setKid" data-id="' + k.id + '">' + SP.avatar(k.name, 'xs') + esc(k.first) + '<i>' + SP.cls(k.classId).short + '</i></button>').join('') + '</div>';
}
const feeCard = v => '<div class="pcard fee ' + SP.voucherStatus(v) + '" data-act="phSub" data-s="voucher:' + v.id + '"><div><b>' + D.monthLabel(v.month) + '</b><span>' + v.id + ' · Due ' + D.nice(v.due) + '</span></div><div class="r"><b>' + SP.pkr(v.total) + '</b>' + SP.voucherPill(v) + '</div></div>';
const shown = k => SP.vouchers(k.id).filter(v => v.sent);

/* ---------- HOME ---------- */
function home() {
  const k = kid(), p = SP.parent(k.parentId), S = SP.S, m = SP.mark(k.id), due = shown(k).filter(v => !v.paid), owed = due.reduce((a, v) => a + v.total, 0);
  const attTxt = m === 'P' ? ['Present today', 'Checked in at ' + D.time(SP.inMin(k.id, TODAY)), 'ok'] : m === 'A' ? ['Absent today', 'Marked by your class teacher', 'bad'] : m === 'L' ? ['On approved leave', 'Leave granted for today', 'warn'] : ['Not marked yet', 'Attendance is taken by 9:30 AM', 'idle'];
  const hw = S.diary.filter(d => d.classId === k.classId && d.type === 'homework' && d.due >= TODAY).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 2);
  const ann = S.announcements.filter(a => a.audience === 'all' || a.audience === k.classId).sort((a, b) => b.ts.localeCompare(a.ts))[0];
  const tile = (t, ic, l, s) => '<button class="qt" data-act="phSub" data-s="' + s + '"><span>' + I(ic) + '</span>' + l + '</button>';
  return '<div class="ph-hero"><div><span>Assalamualaikum,</span><b>' + esc(p.name.split(' ')[0]) + '</b></div><button class="bellb" data-act="phTab" data-t="alerts">' + I('bell') + '</button></div>' + kidChips() +
    '<div class="ph-pad"><div class="pcard child">' + SP.avatar(k.name, 'lg') + '<div><b>' + esc(k.name) + '</b><span>' + SP.cls(k.classId).label + ' · Roll ' + k.roll + '</span></div></div>' +
    '<div class="pcard att ' + attTxt[2] + '" data-tour="ph-att"><span class="ai">' + I(m === 'P' ? 'check' : m === 'A' ? 'alert' : 'clock') + '</span><div><b>' + attTxt[0] + '</b><span>' + attTxt[1] + '</span></div></div>' +
    (owed ? '<div class="pcard due" data-tour="ph-due"><div><span>Fee due</span><b>' + SP.pkr(owed) + '</b><i>' + due.length + ' voucher' + (due.length > 1 ? 's' : '') + '</i></div><button class="pay" data-act="phTab" data-t="fees">Pay now</button></div>' + (SP.locked(k.id) ? '<div class="pwarn">' + I('lock') + 'Gate entry is on hold until dues are cleared.</div>' : '') : '<div class="pcard clear">' + I('check') + '<div><b>Fees are up to date</b><span>Thank you!</span></div></div>') +
    '<div class="qgrid">' + tile(0, 'check', 'Attendance', 'attendance') + tile(0, 'cal', 'Timetable', 'timetable') + tile(0, 'award', 'Results', 'results') + tile(0, 'book', 'Homework', 'diaryjump') + '</div>' +
    (hw.length ? '<h5>Homework due</h5>' + hw.map(d => '<div class="pcard hw"><b>' + esc(d.subject) + '</b><span>' + esc(d.title) + '</span><i>Due ' + D.nice(d.due) + '</i></div>').join('') : '') +
    (ann ? '<h5>Latest announcement</h5><div class="pcard ann"><b>' + esc(ann.title) + '</b><span>' + esc(ann.body.slice(0, 110)) + '…</span></div>' : '') + '</div>';
}

/* ---------- FEES ---------- */
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
SP.act.phPayStart = d => { SP.ui.pay = { vid: d.v, method: 'jazzcash', step: 'pick' }; ph().sub = 'pay:' + d.v; SP.render(); };
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
SP.act.phPayDone = () => { SP.ui.pay = null; ph().sub = null; SP.render(); };

/* ---------- DIARY ---------- */
function diary() {
  const k = kid(), list = SP.S.diary.filter(d => d.classId === k.classId).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 14);
  return bar('Homework & diary') + kidChips() + '<div class="ph-pad">' + list.map(d => '<div class="pcard hw ' + d.type + '"><div class="hwt"><b>' + esc(d.type === 'note' ? 'Teacher note' : d.subject) + '</b><em>' + D.nice(d.date) + '</em></div><span class="tt">' + esc(d.title) + '</span><p>' + esc(d.text) + '</p>' + (d.due ? '<i>' + I('clock') + 'Due ' + D.nice(d.due) + '</i>' : '') + '<small>' + esc(SP.teacher(d.teacherId).name) + '</small></div>').join('') + '</div>';
}

/* ---------- CHAT ---------- */
const parentThreads = () => SP.S.threads.filter(t => SP.stu(t.studentId).parentId === kid().parentId).sort((a, b) => b.messages[b.messages.length - 1].ts.localeCompare(a.messages[a.messages.length - 1].ts));
function chat() {
  const list = parentThreads();
  return bar('Messages') + '<div class="ph-pad"><button class="pbtn" data-act="phSub" data-s="new" data-tour="ph-newmsg">' + I('plus') + 'New message / leave request</button>' + (list.map(t => { const m = t.messages[t.messages.length - 1]; return '<button class="pcard thr ' + (t.unreadParent ? 'un' : '') + '" data-act="phThread" data-id="' + t.id + '"><div><b>' + esc(t.subject) + '</b><em>' + D.niceTs(m.ts) + '</em></div><span>' + esc(m.text.slice(0, 60)) + '</span>' + (t.leave ? SP.pill('Leave ' + t.leave.status, t.leave.status === 'approved' ? 'green' : t.leave.status === 'pending' ? 'amber' : 'red') : '') + '</button>'; }).join('') || SP.empty('No messages yet')) + '</div>';
}
SP.act.phThread = d => { const t = SP.S.threads.find(x => x.id === d.id); t.unreadParent = false; ph().sub = 'thread:' + d.id; SP.render(); };
function thread(id) {
  const t = SP.S.threads.find(x => x.id === id); if (!t) return chat();
  return bar(esc(t.subject), true) + '<div class="ph-chat" data-scroll="pchat" data-stick="1">' + t.messages.map(m => '<div class="pb ' + (m.from === 'parent' ? 'me' : 'them') + '">' + (m.from === 'school' ? '<em>' + esc(m.who) + '</em>' : '') + esc(m.text) + '<span>' + D.niceTs(m.ts) + '</span></div>').join('') + '</div>' +
    '<div class="ph-comp"><input class="input" id="pm-text" placeholder="Type a message" data-enter="phSend" autocomplete="off"><button data-act="phSend" data-id="' + t.id + '" data-tour="ph-send">' + I('send') + '</button></div>';
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
  SP.S.threads.unshift(t); ph().sub = 'thread:' + t.id; SP.toast((leave ? 'Leave request' : 'Message') + ' from ' + p.name + ' — ' + SP.stu(sid).first); SP.render();
};

/* ---------- ALERTS ---------- */
function alerts() {
  const k = kid(), ks = SP.kids(k.parentId), items = [];
  ks.forEach(x => (SP.S.notifs[x.id] || []).forEach(n => items.push({ ts: n.ts, kind: n.kind, title: n.title, body: n.body })));
  SP.S.announcements.forEach(a => { if (a.audience === 'all' || ks.some(x => x.classId === a.audience)) items.push({ ts: a.ts, kind: 'announcement', title: a.title, body: a.body }); });
  ks.forEach(x => { const a = SP.ATT[x.id] || ''; for (let i = a.length - 1; i >= a.length - 5; i--) if (a[i] === 'A') items.push({ ts: SP.DAYS[i] + ' 09:10', kind: 'attendance', title: x.first + ' marked absent', body: x.name + ' was marked absent on ' + D.nice(SP.DAYS[i]) + '.' }); });
  items.sort((a, b) => b.ts.localeCompare(a.ts));
  const ic = { fee: ['cash', 'amber'], message: ['chat', 'blue'], attendance: ['alert', 'red'], diary: ['book', 'green'], announcement: ['mega', 'brand'] };
  return bar('Alerts') + '<div class="ph-pad">' + items.slice(0, 25).map(n => '<div class="pcard al"><span class="ai ' + (ic[n.kind] || ic.message)[1] + '">' + I((ic[n.kind] || ic.message)[0]) + '</span><div><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p><em>' + D.niceTs(n.ts) + '</em></div></div>').join('') + '</div>';
}

/* ---------- attendance / timetable / results ---------- */
function attendance() {
  const k = kid(), a = SP.ATT[k.id] || '', cnt = c => a.split(c).length - 1;
  return bar('Attendance', true) + '<div class="ph-pad"><div class="mini3"><div><span>Present</span><b>' + cnt('P') + '</b></div><div><span>Absent</span><b class="neg">' + cnt('A') + '</b></div><div><span>Leave</span><b>' + cnt('L') + '</b></div></div>' +
    '<h5>Last 30 school days · ' + SP.attPct(k.id, 30) + '%</h5><div class="attgrid">' + SP.DAYS.map((d, i) => '<div class="ac ' + (a[i] || 'P') + '"><span>' + (+d.slice(8)) + '</span></div>').join('') + '</div><div class="legend"><i class="P"></i>Present <i class="A"></i>Absent <i class="L"></i>Leave</div></div>';
}
function timetable() {
  const k = kid(), d = +(SP.ui.f.ttDay || D.dow(TODAY)), names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return bar('Timetable', true) + '<div class="ph-pad"><div class="days">' + [1, 2, 3, 4, 5].map(x => '<button class="' + (x === d ? 'on' : '') + '" data-act="ttDay" data-d="' + x + '">' + names[x] + '</button>').join('') + '</div>' +
    SP.timetable(k.classId, d).map((p, i) => p.subject === 'Break' ? '<div class="pcard brk"><span>' + p.from + ' – ' + p.to + '</span><b>Break</b></div>' : '<div class="pcard tt"><em>' + p.from + '</em><div><b>' + p.subject + '</b><span>' + esc(SP.teacher(p.teacherId).name) + '</span></div></div>').join('') + '</div>';
}
SP.act.ttDay = d => { SP.ui.f.ttDay = d.d; SP.render(); };
function results() {
  const k = kid(), qs = SP.QUIZZES.filter(q => q.classId === k.classId).sort((a, b) => b.date.localeCompare(a.date)), avg = Math.round(100 * qs.reduce((a, q) => a + SP.quizScore(q, k) / q.total, 0) / qs.length);
  return bar('Quizzes & results', true) + '<div class="ph-pad"><div class="pcard child"><div><b>Average score</b><span>Across ' + qs.length + ' recent quizzes</span></div><h2 style="margin-left:auto">' + avg + '%</h2></div>' +
    qs.map(q => { const sc = SP.quizScore(q, k); return '<div class="pcard qz"><div><b>' + esc(q.subject) + '</b><span>' + esc(q.title.split('— ')[1] || q.title) + ' · ' + D.nice(q.date) + '</span></div><div class="qbar"><i style="width:' + Math.round(100 * sc / q.total) + '%"></i></div><b>' + sc + '/' + q.total + '</b></div>'; }).join('') + '</div>';
}

/* ---------- frame ---------- */
function screen() {
  const t = ph().tab, s = subOf();
  if (s[0] === 'voucher') return voucher(s[1]);
  if (s[0] === 'pay') return pay(s[1]);
  if (s[0] === 'thread') return thread(s[1]);
  if (s[0] === 'new') return newMsg();
  if (s[0] === 'attendance') return attendance();
  if (s[0] === 'timetable') return timetable();
  if (s[0] === 'results') return results();
  if (s[0] === 'diaryjump') { ph().tab = 'diary'; ph().sub = null; return diary(); }
  return { home, fees, diary, chat, alerts }[t]();
}
SP.phone = function () {
  const t = ph().tab, un = SP.parentUnread(kid().parentId), tabs = [['home', 'home', 'Home'], ['fees', 'cash', 'Fees'], ['diary', 'book', 'Diary'], ['chat', 'chat', 'Chat'], ['alerts', 'bell', 'Alerts']];
  const full = subOf()[0] === 'pay' && SP.ui.pay && (SP.ui.pay.step === 'processing' || SP.ui.pay.step === 'done');
  const push = SP.ui.push ? '<button class="ph-push" data-act="pushOpen"><span class="pi">' + I('bell') + '</span><div><em>School Portal · now</em><b>' + esc(SP.ui.push.title) + '</b><span>' + esc((SP.ui.push.body || '').slice(0, 80)) + '</span></div></button>' : '';
  return '<div class="phone"><div class="ph-status"><b>' + SP.clock() + '</b><span class="notch"></span><span>' + I('trend') + '</span></div>' + push +
    '<div class="ph-scroll" data-scroll="ph">' + screen() + '</div>' +
    '<nav class="ph-tabs' + (full ? ' hide' : '') + '">' + tabs.map(x => '<button class="' + (t === x[0] ? 'on' : '') + '" data-act="phTab" data-t="' + x[0] + '" data-tour="ph-tab-' + x[0] + '">' + I(x[1]) + '<span>' + x[2] + '</span>' + (x[0] === 'chat' && un ? '<i class="badge hot">' + un + '</i>' : '') + '</button>').join('') + '</nav></div>';
};
SP.parentSide = () => '<div class="pside"><h3>Parent app</h3><p>This is exactly what a parent sees on their phone. Everything is live — anything you change in the Admin console or Teacher view appears here instantly.</p><ul><li>' + I('check') + 'Pay the fee voucher online</li><li>' + I('check') + 'Send a leave request to the school</li><li>' + I('check') + 'Get push alerts for attendance, homework and announcements</li></ul>' + SP.btn('Open the admin console', 'persona', { c: 'pri', d: { p: 'admin' } }) + '</div>';
})();
