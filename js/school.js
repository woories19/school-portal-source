/* School-wide features: calendar & events, circulars & consents, staff & roles, front desk, teacher home. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY, P = SP.pages;
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const xbtn = '<button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button>';
const chk = (id, label, on) => '<label class="chk"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + label + '</label>';
const isOn = id => { const e = document.getElementById(id); return !!(e && e.checked); };
const AUD = () => [['all', 'Whole school'], ['grade:1,2,3,4', 'Grades 1–4'], ['grade:5,6,7,8', 'Grades 5–8'], ['grade:6,7,8', 'Grades 6–8']].concat(SP.CLASSES.map(c => [c.id, c.label]));
const audSel = (id, cur) => '<select class="input" id="' + id + '">' + AUD().map(a => '<option value="' + a[0] + '"' + (a[0] === cur ? ' selected' : '') + '>' + a[1] + '</option>').join('') + '</select>';
const nowMin = () => SP.NOW_MIN + SP.S.clock;
// notify one student per parent in an audience (so each family gets a single alert)
function tellAudience(aud, n) { const ps = SP.audParents(aud); ps.forEach(x => SP.notify([x.id], n)); return ps.length; }
SP.tellAudience = tellAudience;

/* =============================== CALENDAR =============================== */
const TYPE_COL = { holiday: 'var(--green)', exam: 'var(--red)', ptm: 'var(--brand)', sports: '#ff9500', trip: '#af52de', event: '#8e8e93', deadline: '#ff9f0a' };
SP.monthGrid = function (ym, o) {
  o = o || {}; const evs = o.evs || SP.allEvents(), y = +ym.slice(0, 4), m = +ym.slice(5), lead = (D.dow(ym + '-01') + 6) % 7, dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let cells = ''; for (let i = 0; i < lead; i++) cells += '<div class="cal-d off"></div>';
  for (let d = 1; d <= dim; d++) {
    const iso = ym + '-' + SP.pad(d), es = SP.eventOn(iso, evs), w = D.dow(iso), hol = es.some(e => e.type === 'holiday');
    cells += '<button class="cal-d' + (iso === TODAY ? ' today' : '') + (iso === o.sel ? ' sel' : '') + (w === 0 || w === 6 ? ' we' : '') + (hol ? ' hol' : '') + '" data-act="' + (o.act || 'calDay') + '" data-d="' + iso + '"><span class="n">' + d + '</span>' +
      (o.compact ? '<span class="dots">' + es.slice(0, 3).map(e => '<i style="background:' + TYPE_COL[e.type] + '"></i>').join('') + '</span>' : es.slice(0, 2).map(e => '<span class="ev" style="--c:' + TYPE_COL[e.type] + '">' + esc(e.title) + '</span>').join('') + (es.length > 2 ? '<span class="more">+' + (es.length - 2) + ' more</span>' : '')) + '</button>';
  }
  return '<div class="cal' + (o.compact ? ' mini' : '') + '">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => '<div class="cal-h">' + x + '</div>').join('') + cells + '</div>';
};
SP.evRow = function (e, act, extra) {
  return '<button class="evrow" data-act="' + (act || 'evOpen') + '" data-id="' + e.id + '"><i class="evbar" style="background:' + TYPE_COL[e.type] + '"></i><div class="grow"><b>' + esc(e.title) + '</b><span>' + D.nice(e.date) + (e.end ? ' – ' + D.nice(e.end) : '') + (e.time ? ' · ' + e.time : '') + (e.place ? ' · ' + esc(e.place) : '') + '</span></div>' + (extra || '') + '</button>';
};
const monthNav = ym => { const y = +ym.slice(0, 4), m = +ym.slice(5); return { prev: m === 1 ? (y - 1) + '-12' : y + '-' + SP.pad(m - 1), next: m === 12 ? (y + 1) + '-01' : y + '-' + SP.pad(m + 1) }; };
P['admin.calendar'] = function () {
  const ym = SP.f('cal_m', TODAY.slice(0, 7)), sel = SP.f('cal_d'), nav = monthNav(ym), flt = SP.f('cal_t');
  const all = SP.allEvents().filter(e => !flt || e.type === flt), day = sel ? SP.eventOn(sel, all) : [];
  const upcoming = all.filter(e => (e.end || e.date) >= TODAY).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  const list = sel ? day : upcoming;
  const rs = e => e.rsvp ? (() => { const s = SP.evStats(e); return SP.pill(s.yes + ' going', 'green'); })() : '';
  return SP.head('Events & calendar', 'One school calendar for parents, students and staff', SP.btn('Add event', 'evNew', { i: 'plus', c: 'pri', tour: 'ev-new' })) +
    '<div class="g21 calwrap"><section class="card"><div class="card-h"><div class="row-c" style="gap:6px"><button class="btn icon sm" data-act="calNav" data-m="' + nav.prev + '">' + I('left') + '</button><h3 style="min-width:150px;text-align:center">' + D.monthLabel(ym) + '</h3><button class="btn icon sm" data-act="calNav" data-m="' + nav.next + '">' + I('right') + '</button></div>' + SP.btn('Today', 'calNav', { c: 'sm', d: { m: TODAY.slice(0, 7), day: TODAY } }) + '</div><div class="card-b">' + SP.monthGrid(ym, { evs: all, sel }) +
    '<div class="chips" style="margin-top:12px">' + [''].concat(Object.keys(SP.EV_TYPES)).map(t => '<button class="chip ' + (flt === t ? 'on' : '') + '" data-act="setFilter" data-k="cal_t" data-v="' + t + '">' + (t ? '<i class="tdot" style="background:' + TYPE_COL[t] + '"></i>' + SP.EV_TYPES[t][0] : 'All') + '</button>').join('') + '</div></div></section>' +
    '<section class="card"><div class="card-h"><h3>' + (sel ? D.long(sel) : 'Coming up') + '</h3>' + (sel ? SP.btn('Clear', 'calClear', { c: 'sm ghost' }) : '') + '</div><div class="card-b">' + (list.map(e => SP.evRow(e, 'evOpen', rs(e))).join('') || SP.empty('Nothing scheduled', sel ? 'Add an event for this day.' : '')) + '</div></section></div>';
};
SP.act.calNav = d => { SP.ui.f.cal_m = d.m; SP.ui.f.cal_d = d.day || ''; SP.render(); };
SP.act.calDay = d => { SP.ui.f.cal_d = SP.ui.f.cal_d === d.d ? '' : d.d; SP.render(); };
SP.act.calClear = () => { SP.ui.f.cal_d = ''; SP.render(); };
SP.act.evOpen = d => SP.openDrawer('event', { id: d.id });
SP.drawers.event = function (a) {
  const e = SP.allEvents().find(x => x.id === a.id); if (!e) return '<div class="dr-h"><b>Event removed</b><button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div>';
  const t = SP.EV_TYPES[e.type], st = e.rsvp ? SP.evStats(e) : null, ps = SP.audParents(e.audience);
  return '<div class="dr-h"><div><b style="font-size:17px">' + esc(e.title) + '</b><div class="s">' + D.long(e.date) + (e.end ? ' → ' + D.nice(e.end) : '') + '</div></div><div class="row-c" style="gap:8px">' + SP.pill(t[0], t[1]) + '<button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div></div><div class="dr-b" data-scroll="drb">' +
    SP.kv([['When', D.niceY(e.date) + (e.time ? ' · ' + e.time : '')], ['Where', e.place ? esc(e.place) : '—'], ['Audience', SP.audLabel(e.audience) + ' · ' + SP.audStudents(e.audience).length + ' students']]) + '<p>' + esc(e.desc) + '</p>' +
    (st ? '<h4>RSVP from parents</h4><div class="mini3"><div><span>Going</span><b>' + st.yes + '</b></div><div><span>Not going</span><b>' + st.no + '</b></div><div><span>No reply</span><b>' + st.pending + '</b></div></div><div class="qbar" style="height:10px"><i style="width:' + pct(st.yes, st.n) + '%;background:var(--green)"></i></div>' +
      '<div class="dr-act">' + SP.btn('Remind ' + st.pending + ' parents', 'evRemind', { i: 'bell', c: 'pri', d: { id: e.id }, dis: !st.pending }) + '</div>' : '') +
    '<div class="dr-act">' + SP.btn('Delete event', 'evDel', { c: 'danger', i: 'trash', d: { id: e.id } }) + '</div></div>';
};
SP.act.evRemind = d => { const e = SP.allEvents().find(x => x.id === d.id), n = SP.audParents(e.audience).filter(x => !SP.rsvp(e, x.parentId)); n.forEach(x => SP.notify([x.id], { kind: 'event', title: 'Please RSVP: ' + e.title, body: D.nice(e.date) + (e.place ? ' · ' + e.place : ''), ref: e.id, who: 'parent' })); SP.deliver({ title: 'RSVP reminder', total: n.length, channels: ['push', 'whatsapp'] }); SP.render(); };
SP.act.evDel = d => { SP.S.evDel[d.id] = true; SP.S.events = SP.S.events.filter(e => e.id !== d.id); SP.ui.drawer = null; SP.toast('Event removed'); SP.render(); };
SP.act.evNew = () => SP.openModal('newevent', {});
SP.modals.newevent = function () {
  return '<div class="m-h"><h3>Add event</h3>' + xbtn + '</div><div class="m-b"><div class="field"><label>Event title</label><input class="input" id="ev-t" value="Winter science exhibition" autocomplete="off"></div>' +
    '<div class="row2"><div class="field"><label>Type</label><select class="input" id="ev-k">' + Object.keys(SP.EV_TYPES).map(k => '<option value="' + k + '"' + (k === 'event' ? ' selected' : '') + '>' + SP.EV_TYPES[k][0] + '</option>').join('') + '</select></div><div class="field"><label>Audience</label>' + audSel('ev-a', 'all') + '</div></div>' +
    '<div class="row2"><div class="field"><label>Date</label><input type="date" class="input" id="ev-d" value="' + D.add(TODAY, 21) + '"></div><div class="field"><label>Time</label><input type="time" class="input" id="ev-h" value="10:00"></div></div>' +
    '<div class="row2"><div class="field"><label>Venue</label><input class="input" id="ev-p" value="School hall" autocomplete="off"></div><div class="field"><label>Ends on (optional)</label><input type="date" class="input" id="ev-e"></div></div>' +
    '<div class="field"><label>Description</label><textarea class="input" id="ev-x" rows="2">Students showcase their projects. Parents are welcome.</textarea></div><div class="checks">' + chk('ev-r', 'Ask parents to RSVP', true) + chk('ev-n', 'Notify parents now', true) + '</div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Add to calendar', 'evSave', { c: 'pri', i: 'cal', tour: 'ev-save' }) + '</div>';
};
SP.act.evSave = () => {
  const e = { id: SP.uid('EV'), date: $v('ev-d') || D.add(TODAY, 21), end: $v('ev-e') || null, title: $v('ev-t') || 'School event', type: $v('ev-k') || 'event', audience: $v('ev-a') || 'all', desc: $v('ev-x'), place: $v('ev-p'), time: $v('ev-h'), rsvp: isOn('ev-r') };
  SP.S.events.unshift(e); SP.ui.f.cal_m = e.date.slice(0, 7); SP.ui.f.cal_d = e.date;
  if (isOn('ev-n')) { const n = tellAudience(e.audience, { kind: 'event', title: 'New event: ' + e.title, body: D.nice(e.date) + (e.time ? ' · ' + e.time : '') + (e.place ? ' · ' + e.place : '') + (e.rsvp ? ' — tap to RSVP' : ''), ref: e.id }); SP.deliver({ title: 'Event · ' + e.title, total: n, channels: ['push', 'whatsapp'] }); }
  SP.ui.modal = null; SP.toast('Added to the school calendar'); SP.render();
};
SP.rsvpSet = function (evId, pid, v) { const S = SP.S; (S.rsvps[evId] = S.rsvps[evId] || {})[pid] = v; const e = SP.allEvents().find(x => x.id === evId); SP.toast(SP.parent(pid).name + ' is ' + (v === 'yes' ? 'going to' : 'not going to') + ' “' + e.title + '”'); };

/* =============================== CIRCULARS & CONSENTS =============================== */
const CF_TYPES = { trip: ['Field trip', 'brand'], photo: ['Media release', 'gray'], sports: ['Sports & medical', 'amber'], medical: ['Medical', 'red'], other: ['General', 'gray'] };
P['admin.circulars'] = function () {
  const tab = SP.f('cc_tab', 'circ'), S = SP.S;
  const tabs = SP.tabs([{ k: 'circ', label: 'Circulars & invitations', n: S.circ.length }, { k: 'cons', label: 'Parental consents', n: S.forms.length }], tab, 'ccTab');
  let body;
  if (tab === 'circ') {
    const rows = S.circ.slice().sort((a, b) => b.ts.localeCompare(a.ts)).map(c => Object.assign({}, c, { stt: SP.circStats(c) }));
    body = SP.table('circ', [
      { h: 'Notice', cls: 'wrap', f: c => '<div class="person"><span class="ai ' + (c.kind === 'invitation' ? 'amber' : 'brand') + '">' + I(c.kind === 'invitation' ? 'mail' : 'board') + '</span><div class="pn"><div class="n">' + esc(c.title) + '</div><div class="s">' + (c.kind === 'invitation' ? 'Invitation' : 'Circular') + ' · ' + esc(c.by) + '</div></div></div>' },
      { h: 'Audience', f: c => SP.audLabel(c.audience) + '<div class="s">' + c.stt.n + ' families</div>' }, { h: 'Sent', f: c => D.niceTs(c.ts) },
      { h: 'Read', f: c => '<div class="qbar in"><i style="width:' + pct(c.stt.read, c.stt.n) + '%"></i></div> ' + pct(c.stt.read, c.stt.n) + '%' },
      { h: 'Response', f: c => c.kind === 'invitation' ? SP.pill(c.stt.yes + ' attending', 'green') + (c.stt.no ? SP.pill(c.stt.no + ' declined', 'gray') : '') : c.needsAck ? '<div class="qbar in"><i style="width:' + pct(c.stt.ack, c.stt.n) + '%;background:var(--green)"></i></div> ' + c.stt.ack + '/' + c.stt.n + ' acknowledged' : '<span class="muted">No reply needed</span>' },
      { h: '', cls: 'r', f: c => SP.btn('Open', 'circOpen', { c: 'sm', d: { id: c.id } }) }
    ], rows, { per: 8, row: 'circOpen', tourRow: 'cc-row' });
  } else {
    body = '<div class="formgrid">' + S.forms.map(f => { const st = SP.consentStats(f), dl = Math.round((new Date(f.deadline) - new Date(TODAY)) / 864e5), t = CF_TYPES[f.type] || CF_TYPES.other; return '<button class="formcard" data-act="consOpen" data-id="' + f.id + '"><div class="row-c" style="gap:8px;justify-content:space-between;width:100%"><b>' + esc(f.title) + '</b>' + SP.pill(t[0], t[1]) + '</div><span>' + SP.audLabel(f.audience) + ' · ' + st.n + ' students · deadline ' + D.nice(f.deadline) + (dl >= 0 ? ' (' + dl + 'd)' : ' (passed)') + '</span>' +
      '<div class="stack"><i class="g" style="width:' + pct(st.yes, st.n) + '%"></i><i class="r" style="width:' + pct(st.no, st.n) + '%"></i></div><div class="stack-l"><span><i class="g"></i>' + st.yes + ' approved</span><span><i class="r"></i>' + st.no + ' declined</span><span><i></i>' + st.pending + ' pending</span></div></button>'; }).join('') + '</div>';
  }
  return SP.head('Circulars & consents', 'Notices with read receipts, invitations with RSVP, and signed permission slips',
    tab === 'circ' ? SP.btn('New invitation', 'circNew', { d: { k: 'invitation' }, i: 'mail' }) + SP.btn('New circular', 'circNew', { d: { k: 'circular' }, c: 'pri', i: 'plus', tour: 'cc-new' }) : SP.btn('New consent form', 'consNew', { c: 'pri', i: 'plus', tour: 'cons-new' })) + tabs + body;
};
SP.act.ccTab = d => { SP.ui.f.cc_tab = d.k; SP.render(); };
SP.act.circNew = d => SP.openModal('newcirc', { k: d.k });
SP.modals.newcirc = function (a) {
  const inv = a.k === 'invitation';
  return '<div class="m-h"><h3>' + (inv ? 'New invitation' : 'New circular') + '</h3>' + xbtn + '</div><div class="m-b"><div class="field"><label>Title</label><input class="input" id="cc-t" value="' + (inv ? 'Invitation: Parent–Teacher Meeting' : 'Winter uniform and timings') + '" autocomplete="off"></div>' +
    '<div class="row2"><div class="field"><label>Send to</label>' + audSel('cc-a', 'all') + '</div><div class="field"><label>Attachment</label><select class="input" id="cc-f"><option value="">None</option><option>Circular.pdf</option><option>Invitation_card.pdf</option></select></div></div>' +
    '<div class="field"><label>Message</label><textarea class="input" id="cc-b" rows="4">' + (inv ? 'You are invited to meet your child\'s teachers on Thursday, 22 October from 9 AM to 1 PM. Please confirm your attendance in the app.' : 'Please note the revised winter timings and uniform requirements effective 1 November. Kindly acknowledge that you have read this notice.') + '</textarea></div>' +
    '<div class="checks">' + (inv ? chk('cc-r', 'Ask parents to RSVP', true) : chk('cc-ack', 'Require acknowledgement', true)) + chk('cc-w', 'Also send on WhatsApp', true) + chk('cc-s', 'Also send SMS', false) + '</div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Send ' + (inv ? 'invitation' : 'circular'), 'circSave', { c: 'pri', i: 'send', d: { k: a.k }, tour: 'cc-send' }) + '</div>';
};
SP.act.circSave = d => {
  const inv = d.k === 'invitation', c = { id: SP.uid('CR'), kind: d.k, title: $v('cc-t') || 'Notice', body: $v('cc-b'), audience: $v('cc-a') || 'all', ts: SP.stamp(), by: SP.S.persona === 'staff' ? 'Front desk' : 'Principal', needsAck: !inv && isOn('cc-ack'), rsvp: inv && isOn('cc-r'), ack: {}, rsvpMap: {}, attach: $v('cc-f') || null };
  SP.S.circ.unshift(c); const n = tellAudience(c.audience, { kind: 'circular', title: (inv ? 'Invitation: ' : 'Circular: ') + c.title.replace(/^(Invitation|Circular): /, ''), body: c.body.slice(0, 90), ref: c.id, who: 'both' });
  const ch = ['push']; if (isOn('cc-w')) ch.push('whatsapp'); if (isOn('cc-s')) ch.push('sms'); SP.deliver({ title: (inv ? 'Invitation' : 'Circular') + ' · ' + SP.audLabel(c.audience), total: n, channels: ch, note: c.attach ? c.attach + ' attached' : '' });
  SP.ui.modal = null; SP.ui.f.cc_tab = 'circ'; SP.render();
};
SP.act.circOpen = d => SP.openDrawer('circular', { id: d.id });
SP.drawers.circular = function (a) {
  const c = SP.S.circ.find(x => x.id === a.id), st = SP.circStats(c), pend = SP.audParents(c.audience).filter(x => !SP.circAcked(c, x.parentId)).slice(0, 8);
  return '<div class="dr-h"><div><b style="font-size:17px">' + esc(c.title) + '</b><div class="s">' + (c.kind === 'invitation' ? 'Invitation' : 'Circular') + ' · ' + SP.audLabel(c.audience) + ' · ' + D.niceTs(c.ts) + '</div></div><button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div><div class="dr-b" data-scroll="drb">' +
    '<div class="notice-prev"><p>' + esc(c.body) + '</p>' + (c.attach ? '<div class="filechip">' + I('file') + '<div><b>' + esc(c.attach) + '</b><span>PDF · 0.3 MB</span></div></div>' : '') + '</div>' +
    '<div class="mini3"><div><span>Families</span><b>' + st.n + '</b></div><div><span>Read</span><b>' + pct(st.read, st.n) + '%</b></div><div><span>' + (c.kind === 'invitation' ? 'Attending' : 'Acknowledged') + '</span><b>' + (c.kind === 'invitation' ? st.yes : st.ack) + '</b></div></div>' +
    (c.needsAck && st.n - st.ack > 0 ? '<h4>Not yet acknowledged (' + (st.n - st.ack) + ')</h4>' + pend.map(x => '<div class="vrow"><div>' + SP.person(SP.parent(x.parentId).name, esc(x.name.split(' ')[0]) + '\'s parent · ' + SP.cls(x.classId).short, 'sm') + '</div><div></div><div></div></div>').join('') + '<div class="dr-act">' + SP.btn('Remind all pending', 'circRemind', { c: 'pri', i: 'bell', d: { id: c.id }, tour: 'cc-remind' }) + '</div>' : c.needsAck ? '<div class="note ok">' + I('check') + '<span>Every family has acknowledged this notice.</span></div>' : '') + '</div>';
};
SP.act.circRemind = d => { const c = SP.S.circ.find(x => x.id === d.id), pend = SP.audParents(c.audience).filter(x => !SP.circAcked(c, x.parentId)); pend.forEach(x => SP.notify([x.id], { kind: 'circular', title: 'Reminder: ' + c.title, body: 'Please open and acknowledge this notice.', ref: c.id, who: 'parent' })); SP.deliver({ title: 'Acknowledgement reminder', total: pend.length, channels: ['push', 'whatsapp'] }); SP.render(); };
SP.ackCircular = function (cid, pid) { const c = SP.S.circ.find(x => x.id === cid); c.ack[pid] = SP.stamp(); SP.toast(SP.parent(pid).name + ' acknowledged “' + c.title + '”'); };
SP.rsvpCircular = function (cid, pid, v) { const c = SP.S.circ.find(x => x.id === cid); c.rsvpMap = c.rsvpMap || {}; c.rsvpMap[pid] = v; c.ack[pid] = SP.stamp(); SP.toast(SP.parent(pid).name + ' replied ' + (v === 'yes' ? 'attending' : 'not attending') + ' to “' + c.title + '”'); };

/* ---- consent forms ---- */
SP.act.consNew = () => SP.openModal('newcons', {});
SP.modals.newcons = function () {
  return '<div class="m-h"><h3>New consent form</h3>' + xbtn + '</div><div class="m-b"><div class="field"><label>Title</label><input class="input" id="cf-t" value="Visit to the Science Museum" autocomplete="off"></div>' +
    '<div class="row2"><div class="field"><label>Type</label><select class="input" id="cf-k">' + Object.keys(CF_TYPES).map(k => '<option value="' + k + '">' + CF_TYPES[k][0] + '</option>').join('') + '</select></div><div class="field"><label>Students</label>' + audSel('cf-a', 'grade:5,6,7,8') + '</div></div>' +
    '<div class="row2"><div class="field"><label>Respond by</label><input type="date" class="input" id="cf-d" value="' + D.add(TODAY, 10) + '"></div><div class="field"><label>Fee to add (Rs, optional)</label><input class="input" type="number" id="cf-f" value="600"></div></div>' +
    '<div class="field"><label>What parents are agreeing to</label><textarea class="input" id="cf-x" rows="3">Grades 5–8 will visit the Science Museum on Friday. Departure 8:30 AM, return 1:30 PM. Teachers will accompany the group.</textarea></div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Send to parents', 'consSave', { c: 'pri', i: 'send', tour: 'cons-send' }) + '</div>';
};
SP.act.consSave = () => {
  const f = { id: SP.uid('CF'), title: $v('cf-t') || 'Consent form', type: $v('cf-k') || 'other', desc: $v('cf-x'), audience: $v('cf-a') || 'all', deadline: $v('cf-d') || D.add(TODAY, 10), ts: SP.stamp(), by: 'Principal\'s office', fee: +$v('cf-f') || 0 };
  SP.S.forms.unshift(f); const n = tellAudience(f.audience, { kind: 'consent', title: 'Consent needed: ' + f.title, body: 'Please respond by ' + D.nice(f.deadline) + '.', ref: f.id, who: 'parent' });
  SP.deliver({ title: 'Consent form · ' + SP.audLabel(f.audience), total: n, channels: ['push', 'whatsapp'] }); SP.ui.modal = null; SP.ui.f.cc_tab = 'cons'; SP.render();
};
SP.act.consOpen = d => { SP.ui.f.cs_f = ''; SP.openDrawer('consent', { id: d.id }); };
SP.drawers.consent = function (a) {
  const f = SP.S.forms.find(x => x.id === a.id), st = SP.consentStats(f), flt = SP.f('cs_f');
  const rows = st.studs.map(s => ({ s, c: SP.consent(f, s.id) })).filter(r => !flt || (flt === 'pending' ? !r.c : r.c && r.c.v === flt)).slice(0, 40);
  return '<div class="dr-h"><div><b style="font-size:17px">' + esc(f.title) + '</b><div class="s">' + SP.audLabel(f.audience) + ' · respond by ' + D.nice(f.deadline) + '</div></div><button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div><div class="dr-b" data-scroll="drb">' +
    '<p>' + esc(f.desc) + '</p>' + (f.fee ? '<div class="note">' + I('cash') + '<span>A fee of <b>' + SP.pkr(f.fee) + '</b> is added to the next voucher of every approved student.</span></div>' : '') +
    '<div class="mini3"><div><span>Approved</span><b style="color:var(--green)">' + st.yes + '</b></div><div><span>Declined</span><b style="color:var(--red)">' + st.no + '</b></div><div><span>Pending</span><b>' + st.pending + '</b></div></div>' +
    '<div class="row-c" style="margin-bottom:8px"><div class="chips">' + [['', 'All'], ['yes', 'Approved'], ['no', 'Declined'], ['pending', 'Pending']].map(c => '<button class="chip ' + (flt === c[0] ? 'on' : '') + '" data-act="setFilter" data-k="cs_f" data-v="' + c[0] + '">' + c[1] + '</button>').join('') + '</div></div>' +
    rows.map(r => '<div class="vrow"><div>' + SP.person(r.s.name, SP.cls(r.s.classId).short + ' · ' + esc(SP.parent(r.s.parentId).name), 'sm') + '</div><div>' + (r.c ? SP.pill(r.c.v === 'yes' ? 'Approved' : 'Declined', r.c.v === 'yes' ? 'green' : 'red') : SP.pill('Pending', 'amber')) + '</div><div class="s">' + (r.c ? D.niceTs(r.c.ts) : '') + '</div></div>').join('') +
    '<div class="dr-act">' + SP.btn('Remind ' + st.pending + ' pending', 'consRemind', { c: 'pri', i: 'bell', d: { id: f.id }, dis: !st.pending, tour: 'cons-remind' }) + SP.btn('Export signed list', 'consCsv', { i: 'dl', d: { id: f.id } }) + '</div></div>';
};
SP.drawers.consent.wide = true;
SP.act.consRemind = d => { const f = SP.S.forms.find(x => x.id === d.id), pend = SP.consentStats(f).studs.filter(s => !SP.consent(f, s.id)), seen = {}; let n = 0; pend.forEach(s => { if (seen[s.parentId]) return; seen[s.parentId] = 1; n++; SP.notify([s.id], { kind: 'consent', title: 'Reminder: consent needed', body: f.title + ' — respond by ' + D.nice(f.deadline), ref: f.id, who: 'parent' }); }); SP.deliver({ title: 'Consent reminder', total: n, channels: ['push', 'whatsapp', 'sms'] }); SP.render(); };
SP.act.consCsv = d => { const f = SP.S.forms.find(x => x.id === d.id); SP.csv('consent-' + f.id + '.csv', ['Student', 'Class', 'Parent', 'Response', 'Signed at'], SP.consentStats(f).studs.map(s => { const c = SP.consent(f, s.id); return [s.name, SP.cls(s.classId).label, SP.parent(s.parentId).name, c ? c.v : 'pending', c ? c.ts : '']; })); };
SP.respondConsent = function (fid, sid, v, signer) {
  const f = SP.S.forms.find(x => x.id === fid), s = SP.stu(sid); (SP.S.consents[fid] = SP.S.consents[fid] || {})[sid] = { v, ts: SP.stamp(), by: signer };
  SP.toast(signer + ' ' + (v === 'yes' ? 'approved' : 'declined') + ' “' + f.title + '” for ' + s.first);
};

/* =============================== STAFF =============================== */
const stLabel = { P: ['Present', 'green'], T: ['Late', 'amber'], L: ['On leave', 'blue'], A: ['Absent', 'red'] };
P['admin.staff'] = function () {
  const tab = SP.f('sf_tab', 'dir'), tabs = SP.tabs([{ k: 'dir', label: 'Directory', n: SP.STAFF_ALL.length }, { k: 'roles', label: 'Roles & access' }], tab, 'sfTab');
  let body;
  if (tab === 'dir') {
    const q = SP.f('sf_q').toLowerCase(), r = SP.f('sf_r');
    const list = SP.STAFF_ALL.filter(t => (!r || (r === 'T' ? t.role === 'Teacher' : t.role !== 'Teacher')) && (!q || (t.name + t.title).toLowerCase().indexOf(q) > -1));
    const cnt = ch => SP.STAFF_ALL.filter(t => SP.staffToday(t.id) === ch).length;
    body = '<div class="tiles6 t4">' + SP.tile({ label: 'Teachers', value: SP.TEACHERS.length, sub: '16 class teachers' }) + SP.tile({ label: 'Office staff', value: SP.STAFF_OFFICE.length }) + SP.tile({ label: 'In today', value: cnt('P') + cnt('T'), sub: cnt('T') + ' late' }) + SP.tile({ label: 'Away today', value: cnt('A') + cnt('L'), tone: cnt('A') ? 'amber' : '', sub: cnt('L') + ' on leave' }) + '</div>' +
      '<div class="toolbar">' + SP.search('sf_q', 'Search staff') + SP.select('sf_r', [['', 'Everyone'], ['T', 'Teachers'], ['O', 'Office staff']], r) + '</div>' +
      SP.table('staff', [{ h: 'Name', f: t => SP.person(t.name, t.title) }, { h: 'Teaches', f: t => t.role === 'Teacher' ? SP.teachPairs(t.id).slice(0, 2).map(p => SP.cls(p.classId).short + ' ' + p.subject.split(' ')[0]).join(', ') + (SP.teachPairs(t.id).length > 2 ? ' +' + (SP.teachPairs(t.id).length - 2) : '') : '<span class="muted">—</span>' },
        { h: 'Phone', cls: 'mono', f: t => esc(t.phone) }, { h: 'Today', f: t => SP.pill(stLabel[SP.staffToday(t.id)][0], stLabel[SP.staffToday(t.id)][1]) }, { h: '14-day', f: t => pct(SP.STAFF_ATT[t.id].filter(x => x === 'P' || x === 'T').length, 14) + '%' }], list, { per: 10, row: 'staffOpen' });
  } else {
    const ROLES = ['Principal', 'Vice Principal', 'Accountant', 'Admissions', 'Front desk', 'Teacher', 'Parent', 'Student'];
    const M = [['Dashboard & reports', 'FFVVVV--'], ['Admissions', 'FF-FF---'], ['Fees & payments', 'FVF-V-V-'], ['Mark attendance', 'FF---F--'], ['View attendance', 'FFVVVFVV'], ['Enter exam marks', 'FF---F--'], ['Publish results', 'FF------'], ['See results & report cards', 'FF---FVV'], ['Circulars & consents', 'FF--VVVV'], ['Parent messages', 'FFVVFFF-'], ['System status', 'F-------']];
    const cell = c => c === 'F' ? SP.pill('Full', 'green') : c === 'V' ? SP.pill('View', 'blue') : '<span class="muted">—</span>';
    body = '<div class="banner">' + I('shield') + '<div><b>Everyone sees only what they need.</b> Access follows the role — a teacher never sees fee data, and a front-desk officer can\'t publish results.</div></div><div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl matrix"><thead><tr><th>Module</th>' + ROLES.map(r => '<th class="c">' + r + '</th>').join('') + '</tr></thead><tbody>' + M.map(m => '<tr><td><b>' + m[0] + '</b></td>' + m[1].split('').map(c => '<td class="c">' + cell(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></div>';
  }
  return SP.head('Staff', 'Teachers and office staff · profiles, attendance and access', '') + tabs + body;
};
SP.act.sfTab = d => { SP.ui.f.sf_tab = d.k; SP.render(); };
SP.act.staffOpen = d => { SP.ui.f.sf_dt = 'ov'; SP.openDrawer('staffp', { id: d.id }); };
SP.act.sfDt = d => { SP.ui.f.sf_dt = d.k; SP.render(); };
SP.drawers.staffp = function (a) {
  const t = SP.teacher(a.id), tab = SP.f('sf_dt', 'ov'), st = SP.staffToday(t.id), tabs = SP.tabs([{ k: 'ov', label: 'Overview' }, { k: 'sch', label: 'Today' }, { k: 'att', label: 'Attendance' }], tab, 'sfDt');
  let body;
  if (tab === 'ov') {
    const pairs = t.role === 'Teacher' ? SP.teachPairs(t.id) : [];
    body = SP.kv([['Role', esc(t.title)], ['Phone', esc(t.phone)], ['Today', stLabel[st][0]], ['Class teacher of', t.classId ? SP.cls(t.classId).label : '—'], ['Weekly periods', pairs.length ? pairs.length * 5 + '' : '—']]) + (pairs.length ? '<h4>Subjects taught</h4><div>' + pairs.map(p => '<span class="chip-s">' + esc(p.subject) + ' · ' + SP.cls(p.classId).short + '</span>').join('') + '</div>' : '') + '<div class="dr-act">' + SP.btn('Send message', 'stMsg', { i: 'chat', c: 'pri', d: { id: t.id } }) + SP.btn('Call', 'stCall', { d: { id: t.id } }) + '</div>';
  } else if (tab === 'sch') {
    const items = []; SP.CLASSES.forEach(c => SP.timetable(c.id, D.dow(TODAY)).forEach(p => { if (p.teacherId === t.id) items.push({ from: p.from, to: p.to, sub: p.subject, c: c.label }); })); items.sort((x, y) => x.from.localeCompare(y.from));
    body = items.length ? items.map(i => '<div class="lesson"><b>' + i.from + '–' + i.to + '</b><span>' + i.sub + ' · ' + i.c + '</span></div>').join('') : SP.empty('No lessons today', t.role === 'Teacher' ? 'Free day.' : 'Office staff don\'t teach.');
  } else {
    const days = SP.DAYS.slice(-14);
    body = '<div class="attgrid" style="grid-template-columns:repeat(7,1fr)">' + SP.STAFF_ATT[t.id].map((x, i) => '<div class="ac ' + (x === 'T' ? 'A' : x) + '" style="' + (x === 'T' ? 'background:#ffe0a3' : '') + '" title="' + D.nice(days[i]) + '"><span>' + (+days[i].slice(8)) + '</span></div>').join('') + '</div><div class="legend"><i class="P"></i>Present <i class="T"></i>Late <i class="L"></i>Leave <i class="A"></i>Absent</div>';
  }
  return '<div class="dr-h"><div>' + SP.person(t.name, t.title, 'lg') + '</div><div class="row-c" style="gap:8px">' + SP.pill(stLabel[st][0], stLabel[st][1]) + '<button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div></div><div class="dr-tabs">' + tabs + '</div><div class="dr-b" data-scroll="drb">' + body + '</div>';
};
SP.act.stMsg = d => SP.toast('Message sent to ' + SP.teacher(d.id).name + ' (demo)');
SP.act.stCall = d => SP.toast('Calling ' + SP.teacher(d.id).phone + ' (demo)');

/* =============================== FRONT DESK =============================== */
P['staff.desk'] = function () {
  const S = SP.S, vs = S.visitors, inside = vs.filter(v => !v.out), newApps = S.applicants.filter(a => a.stage === 'new').length;
  const cid = SP.f('gp_c', SP.CLASSES[8].id), studs = SP.inClass(cid), sid = studs.some(s => s.id === SP.f('gp_s')) ? SP.f('gp_s') : studs[0].id;
  return SP.head('Front desk', 'Good morning, ' + esc(SP.teacher(S.staffId).name.split(' ')[0]) + ' · ' + D.long(TODAY), SP.btn('Add visitor', 'vsNew', { i: 'plus', c: 'pri' })) +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Visitors today', value: vs.length }) + SP.tile({ label: 'Inside now', value: inside.length, sub: 'Not yet signed out' }) + SP.tile({ label: 'Gate passes', value: S.passes.length, sub: 'Early pickups today' }) + SP.tile({ label: 'New applications', value: newApps, tone: newApps ? 'amber' : '', sub: 'Waiting for review', act: 'nav', attrs: 'data-r="admissions"' }) + '</div>' +
    '<div class="g21"><section class="card"><div class="card-h"><h3>Visitor log</h3></div><div class="card-b" style="padding-top:6px">' + vs.slice().reverse().map(v => '<div class="vrow"><div><b>' + esc(v.name) + '</b><span>' + esc(v.who) + ' · ' + esc(v.purpose) + '</span></div><div class="s mono">' + v.inn + (v.out ? ' – ' + v.out : '') + '<br>' + v.pass + '</div><div>' + (v.out ? SP.pill('Left', 'gray') : SP.btn('Sign out', 'vsOut', { c: 'sm', d: { id: v.id } })) + '</div></div>').join('') + '</div></section>' +
    '<section class="card"><div class="card-h"><h3>Early pickup / gate pass</h3></div><div class="card-b"><p class="hint" style="margin-top:0">Issue a pass, sign the student out, and the parent is told instantly.</p><div class="field"><label>Class</label>' + SP.select('gp_c', SP.classOptions(), cid) + '</div><div class="field"><label>Student</label>' + SP.select('gp_s', studs.map(s => [s.id, s.name]), sid) + '</div>' +
    '<div class="row2"><div class="field"><label>Picked up by</label><input class="input" id="gp-b" value="Uncle (Asif)" autocomplete="off"></div><div class="field"><label>Reason</label><select class="input" id="gp-r"><option>Medical appointment</option><option>Family emergency</option><option>Unwell</option></select></div></div>' + SP.btn('Issue pass & sign out', 'gpIssue', { c: 'pri', i: 'check', d: { sid }, tour: 'gp-issue' }) +
    (S.passes.length ? '<h4 style="margin:18px 0 6px">Issued today</h4>' + S.passes.slice(0, 4).map(p => '<div class="lesson"><b>' + esc(SP.stu(p.sid).name) + '</b><span>' + p.time + ' · ' + esc(p.by) + ' · ' + esc(p.reason) + '</span></div>').join('') : '') + '</div></section></div>';
};
SP.act.vsOut = d => { const v = SP.S.visitors.find(x => x.id === d.id); v.out = SP.D.time(nowMin()); SP.toast(v.name + ' signed out'); SP.render(); };
SP.act.vsNew = () => SP.openModal('newvisitor', {});
SP.modals.newvisitor = function () {
  return '<div class="m-h"><h3>Add visitor</h3>' + xbtn + '</div><div class="m-b"><div class="field"><label>Name</label><input class="input" id="vs-n" value="Mr. Ahsan Raza" autocomplete="off"></div><div class="row2"><div class="field"><label>Who they are</label><input class="input" id="vs-w" value="Parent of Zoya (3B)" autocomplete="off"></div><div class="field"><label>Purpose</label><input class="input" id="vs-p" value="Meet the class teacher" autocomplete="off"></div></div><p class="hint">A printed gate pass is issued and the person being visited is notified.</p></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Sign in', 'vsSave', { c: 'pri' }) + '</div>';
};
SP.act.vsSave = () => { const S = SP.S; S.visitors.push({ id: SP.uid('VS'), name: $v('vs-n') || 'Visitor', who: $v('vs-w'), purpose: $v('vs-p'), inn: D.time(nowMin()), out: null, pass: 'GP-' + (2400 + S.visitors.length) }); SP.ui.modal = null; SP.toast('Visitor signed in · pass issued'); SP.render(); };
SP.act.gpIssue = d => {
  const S = SP.S, s = SP.stu(d.sid), by = $v('gp-b') || 'Guardian', reason = $v('gp-r'), t = D.time(nowMin());
  S.passes.unshift({ sid: s.id, time: t, by, reason }); S.gateOut[s.id] = nowMin();
  SP.notify([s.id], { kind: 'gate', title: s.first + ' left school early', body: 'Signed out at ' + t + ' with ' + by + ' (' + reason + ').', who: 'parent' });
  SP.toast(s.name + ' signed out at ' + t + ' · parent notified'); SP.render();
};

/* =============================== TEACHER HOME =============================== */
P['teacher.today'] = function () {
  const S = SP.S, t = SP.teacher(S.teacherId), day = D.dow(TODAY), now = D.time(nowMin()), items = [];
  SP.CLASSES.forEach(c => SP.timetable(c.id, day).forEach(p => { if (p.teacherId === t.id) items.push({ from: p.from, to: p.to, sub: p.subject, c }); })); items.sort((a, b) => a.from.localeCompare(b.from));
  const mine = SP.allAssign().filter(a => a.teacherId === t.id), tograde = mine.reduce((n, a) => { const s = SP.assignStats(a); return n + s.sub - s.graded; }, 0);
  const live = SP.allQuizzes().filter(q => q.status === 'live' && (q.teacherId || SP.ALLOC[q.classId][q.subject]) === t.id).length, attPending = t.classId && !S.attSubmitted[t.classId];
  const todo = [];
  if (attPending) todo.push(['alert', 'amber', 'Attendance not submitted for ' + SP.cls(t.classId).label, 'attendance']);
  if (tograde) todo.push(['pen', 'blue', tograde + ' assignment submissions waiting to be graded', 'assign']);
  const ex2 = SP.exam('E2'), pend = SP.teachPairs(t.id).filter(p => ex2.status === 'marking' && !SP.entered(ex2, p.classId, p.subject)).length;
  if (pend) todo.push(['award', 'brand', pend + ' class-subject' + (pend > 1 ? 's' : '') + ' still need Unit Test 2 marks', 'exams']);
  const ev = SP.allEvents().filter(e => (e.end || e.date) >= TODAY).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  return SP.head('Good morning, ' + esc(t.name.split(' ')[0]), D.long(TODAY) + ' · ' + SP.clock() + (t.classId ? ' · Class teacher, ' + SP.cls(t.classId).label : ''), '') +
    '<div class="tiles6 t4">' + SP.tile({ label: 'Lessons today', value: items.length, sub: items.length ? 'Next: ' + ((items.find(i => i.from >= now) || {}).from || 'none') : 'Free day' }) + SP.tile({ label: 'To grade', value: tograde, tone: tograde ? 'amber' : '', sub: 'Submissions' }) + SP.tile({ label: 'Live quizzes', value: live }) + SP.tile({ label: 'Attendance', value: attPending ? 'Pending' : 'Done', tone: attPending ? 'amber' : '', sub: t.classId ? SP.cls(t.classId).label : 'No class' }) + '</div>' +
    '<div class="g2"><section class="card"><div class="card-h"><h3>Today\'s schedule</h3></div><div class="card-b">' + (items.map(i => { const st = i.to <= now ? 'done' : i.from <= now ? 'now' : 'next'; return '<div class="sched ' + st + '"><em>' + i.from + '</em><div class="grow"><b>' + esc(i.sub) + '</b><span>' + i.c.label + ' · ' + SP.inClass(i.c.id).length + ' students</span></div>' + (st === 'now' ? SP.pill('In progress', 'green') : st === 'done' ? '<span class="muted">Done</span>' : '<span class="muted">Later</span>') + '</div>'; }).join('') || SP.empty('No lessons today')) + '</div></section>' +
    '<section class="card"><div class="card-h"><h3>Needs your attention</h3></div><div class="card-b">' + (todo.length ? '<div class="att-list">' + todo.map(a => '<button class="att-row" data-act="nav" data-r="' + a[3] + '"><span class="ai ' + a[1] + '">' + I(a[0]) + '</span><span>' + a[2] + '</span>' + I('right') + '</button>').join('') + '</div>' : SP.empty('All caught up')) +
    '<h4 style="margin:18px 0 6px;font-size:13px;color:var(--muted)">Coming up</h4>' + ev.map(e => SP.evRow(e, 'nav')).join('').replace(/data-act="nav"/g, 'data-act="nav" data-r="calendar"') + '</div></section></div>';
};
})();
