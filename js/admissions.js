/* Admissions: pipeline (list + board), the admission file drawer, documents, assessment, fee gate, admit. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, TODAY = SP.TODAY, P = SP.pages;
const $v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };

const STAGES = [['new', 'New', 'blue'], ['reviewed', 'Reviewed', 'gray'], ['interview', 'Interview', 'amber'], ['accepted', 'Accepted', 'green'], ['admitted', 'Admitted', 'green'], ['rejected', 'Rejected', 'red']];
const stageOf = k => STAGES.find(s => s[0] === k);
const stagePill = k => SP.pill(stageOf(k)[1], stageOf(k)[2]);
const appl = id => SP.S.applicants.find(a => a.id === id);
const docsHave = a => SP.DOCS.filter(d => a.docs[d[0]]).length;
const reqMissing = a => SP.DOCS.filter(d => d[2] && !a.docs[d[0]]);
// fee state: none (no voucher yet) | unpaid | paid | waived
const feeState = a => !a.fee.issued ? 'none' : a.fee.waived ? 'waived' : a.fee.paid ? 'paid' : 'unpaid';
const feePill = a => { const f = feeState(a); return a.stage === 'admitted' ? SP.pill('Paid', 'green') : a.stage === 'rejected' || (a.stage !== 'accepted' && f === 'none') ? '<span class="muted">—</span>' : f === 'none' ? SP.pill('Voucher not issued', 'gray') : f === 'unpaid' ? SP.pill('Unpaid · ' + SP.pkr(a.fee.amount), 'amber') : f === 'waived' ? SP.pill('Waived', 'blue') : SP.pill('Paid', 'green'); };
SP.admFeeReady = a => a.stage === 'accepted' && (a.fee.paid || a.fee.waived);
const log = (a, t) => a.log.push([t, TODAY]);
const stepIndex = a => ({ new: 0, reviewed: 1, interview: 2, accepted: SP.admFeeReady(a) ? 4 : 3, admitted: 5, rejected: -1 }[a.stage]);

/* =============================== PAGE =============================== */
P['admin.admissions'] = function () {
  const S = SP.S, q = SP.f('adm_q').toLowerCase(), stg = SP.f('adm_stage'), gr = SP.f('adm_grade'), fee = SP.f('adm_fee'), view = SP.f('adm_view', 'list');
  const tiles = STAGES.map(s => SP.tile({ label: s[1], value: S.applicants.filter(a => a.stage === s[0]).length, act: 'setFilter', attrs: 'data-k="adm_stage" data-pk="adm" data-v="' + (stg === s[0] ? '' : s[0]) + '"', sel: stg === s[0], tour: s[0] === 'new' ? 'adm-new' : '' })).join('');
  const acc = S.applicants.filter(a => a.stage === 'accepted'), waiting = acc.filter(a => !SP.admFeeReady(a)), ready = acc.filter(SP.admFeeReady);
  const list = S.applicants.filter(a => (!stg || a.stage === stg) && (!gr || String(a.grade) === gr) && (!q || (a.name + a.ref + a.parent + a.phone).toLowerCase().indexOf(q) > -1) &&
    (!fee || (fee === 'pending' && a.stage === 'accepted' && !SP.admFeeReady(a)) || (fee === 'ready' && SP.admFeeReady(a)))).sort((a, b) => b.submitted.localeCompare(a.submitted) || b.id.localeCompare(a.id));
  const banner = acc.length ? '<div class="banner">' + I('cash') + '<div><b>' + waiting.length + ' accepted applicant' + (waiting.length === 1 ? ' is' : 's are') + ' waiting on the admission fee</b> · ' + ready.length + ' paid and ready to admit.</div>' +
    SP.btn('Show fee pending', 'setFilter', { c: 'sm', d: { k: 'adm_fee', v: fee === 'pending' ? '' : 'pending', pk: 'adm' } }) + SP.btn('Show ready to admit', 'setFilter', { c: 'sm pri', d: { k: 'adm_fee', v: fee === 'ready' ? '' : 'ready', pk: 'adm' } }) + '</div>' : '';
  let body;
  if (view === 'board') {
    body = '<div class="board">' + STAGES.filter(s => s[0] !== 'rejected').map(s => {
      const items = list.filter(a => a.stage === s[0]);
      return '<div class="bcol"><div class="bcol-h"><b>' + s[1] + '</b><span>' + items.length + '</span></div>' + items.slice(0, 6).map(a => '<button class="bcard" data-act="admOpen" data-id="' + a.id + '"><b>' + esc(a.name) + '</b><span>Grade ' + a.grade + ' · ' + esc(a.parent.split(' ')[0]) + '</span><div class="row-c" style="gap:6px;margin-top:6px"><span class="mini-p">' + I('file') + docsHave(a) + '/5</span>' + (a.stage === 'accepted' || a.stage === 'admitted' ? feePill(a) : '') + '</div></button>').join('') + (items.length > 6 ? '<div class="bmore">+' + (items.length - 6) + ' more</div>' : '') + (items.length ? '' : '<div class="bmore">Nothing here</div>') + '</div>';
    }).join('') + '</div>';
  } else {
    body = SP.table('adm', [
      { h: 'Applicant', f: a => SP.person(a.name, a.ref) }, { h: 'Grade', f: a => 'Grade ' + a.grade }, { h: 'Parent', f: a => esc(a.parent) + '<div class="s">' + esc(a.phone) + '</div>' },
      { h: 'Documents', f: a => '<div class="qbar in"><i style="width:' + docsHave(a) * 20 + '%"></i></div> ' + docsHave(a) + '/5' }, { h: 'Assessment', f: a => a.test ? '<b>' + a.test.score + '</b>/100' : '<span class="muted">—</span>' },
      { h: 'Admission fee', f: feePill }, { h: 'Stage', f: a => stagePill(a.stage) + (a.stage === 'interview' && a.interviewOn ? '<div class="s">' + D.nice(a.interviewOn) + ', 10:30</div>' : '') },
      { h: '', cls: 'r', f: a => SP.btn('Open file', 'admOpen', { c: 'sm', d: { id: a.id } }) }
    ], list, { per: 9, row: 'admOpen', tourRow: 'adm-row' });
  }
  return SP.head('Admissions', S.applicants.length + ' applications this session · 2026–27',
    '<div class="segb" data-tour="adm-view">' + [['list', 'List'], ['board', 'Board']].map(v => '<button class="' + (view === v[0] ? 'on' : '') + '" data-act="setFilter" data-k="adm_view" data-v="' + v[0] + '">' + v[1] + '</button>').join('') + '</div>' + SP.btn('Simulate online application', 'admSimulate', { i: 'plus', c: 'pri', tour: 'adm-sim' })) +
    '<div class="tiles6">' + tiles + '</div>' + banner +
    '<div class="toolbar">' + SP.search('adm_q', 'Search name, reference or phone') + SP.select('adm_grade', [['', 'All grades']].concat([1, 2, 3, 4, 5, 6, 7, 8].map(g => [g, 'Grade ' + g])), gr) + SP.select('adm_fee', [['', 'Any fee status'], ['pending', 'Fee pending'], ['ready', 'Paid · ready to admit']], fee) +
    (stg ? SP.btn('Clear stage filter', 'setFilter', { c: 'sm', d: { k: 'adm_stage', v: '' } }) : '') + '</div>' + body;
};
SP.act.admOpen = d => { SP.ui.f.adm_tab = 'overview'; SP.openDrawer('applicant', { id: d.id }); };
SP.act.admTab = d => { SP.ui.f.adm_tab = d.k; SP.render(); };
SP.act.admSimulate = () => {
  const S = SP.S, q = SP.APP_QUEUE[S.queueIdx % SP.APP_QUEUE.length]; S.queueIdx++;
  const a = SP.enrichApplicant({ id: SP.uid('A'), ref: 'ADM-2609-' + Math.floor(1000 + Math.random() * 8999).toString(36).toUpperCase(), name: q.name, gender: q.gender, dob: (2021 - q.grade) + '-04-12', grade: q.grade, prevSchool: q.prevSchool, parent: q.parent, rel: q.rel, phone: q.phone, source: 'portal', submitted: TODAY, stage: 'new', interviewOn: null, voucherIssued: false, studentId: null, log: [['Application received via online form', TODAY]] });
  a.docs = { bform: true, cnic: true, photo: false, result: false, leaving: false };
  S.applicants.unshift(a); SP.ui.f.adm_stage = ''; SP.ui.f.adm_q = ''; SP.ui.f.adm_fee = ''; SP.ui.page.adm = 0;
  SP.toast('New online application from ' + q.parent + ' for ' + q.name); SP.render();
};

/* =============================== ADMISSION FILE =============================== */
SP.drawers.applicant = function (args) {
  const a = appl(args.id), tab = SP.f('adm_tab', 'overview'), c = SP.CLASSES.filter(x => x.grade === a.grade), idx = stepIndex(a);
  const steps = ['Applied', 'Reviewed', 'Interview', 'Accepted', 'Fee paid', 'Admitted'];
  const stepper = a.stage === 'rejected' ? '<div class="note">' + I('alert') + '<span><b>Application rejected.</b> ' + esc(a.note || 'No reason recorded.') + '</span></div>' :
    '<div class="stepper">' + steps.map((s, i) => '<div class="' + (i < idx ? 'done' : i === idx ? 'now' : '') + '"><i>' + (i < idx ? I('check') : i + 1) + '</i><span>' + s + '</span></div>').join('') + '</div>';
  const tabs = SP.tabs([{ k: 'overview', label: 'Overview' }, { k: 'docs', label: 'Documents', n: docsHave(a) + '/5' }, { k: 'assess', label: 'Assessment' }, { k: 'fee', label: 'Admission fee' }, { k: 'time', label: 'Timeline' }], tab, 'admTab');
  let body = '';
  if (tab === 'overview') {
    body = SP.kv([['Date of birth', D.niceY(a.dob)], ['Gender', a.gender === 'F' ? 'Female' : 'Male'], ['Applying for', 'Grade ' + a.grade], ['Previous school', esc(a.prevSchool)], ['Guardian', esc(a.parent) + ' (' + a.rel + ')'], ['Phone', esc(a.phone)], ['Source', a.source], ['Submitted', D.nice(a.submitted)], ['Sections', c.map(x => x.section + ' · ' + SP.inClass(x.id).length + ' students').join('  ·  ')]]);
  } else if (tab === 'docs') {
    body = '<p class="hint">Required documents must be received before an application can be reviewed.</p>' + SP.DOCS.map(d => '<div class="docrow"><span class="ai ' + (a.docs[d[0]] ? 'green' : d[2] ? 'amber' : '') + '">' + I(a.docs[d[0]] ? 'check' : 'file') + '</span><div class="grow"><b>' + d[1] + '</b><span>' + (d[2] ? 'Required' : 'Optional') + '</span></div>' +
      (a.docs[d[0]] ? SP.pill('Received', 'green') + SP.btn('', 'admDoc', { c: 'sm ghost icon', i: 'eye', d: { id: a.id, k: d[0], v: 'view' } }) : SP.btn('Mark received', 'admDoc', { c: 'sm', d: { id: a.id, k: d[0], v: 'on' } })) + '</div>').join('') +
      (a.stage === 'new' || a.stage === 'reviewed' ? '<div class="dr-act">' + SP.btn('Mark all received', 'admDocsAll', { d: { id: a.id }, tour: 'adm-docs' }) + '</div>' : '');
  } else if (tab === 'assess') {
    const t = a.test;
    body = t ? '<div class="mini3"><div><span>Entrance test</span><b>' + t.score + '/100</b></div><div><span>Interview rating</span><b>' + '★'.repeat(t.rating) + '<span style="opacity:.25">' + '★'.repeat(5 - t.rating) + '</span></b></div><div><span>Assessed by</span><b style="font-size:14px">' + esc(t.by) + '</b></div></div><div class="note">' + I('star') + esc(t.note) + '</div>' : (a.stage === 'interview' || a.stage === 'reviewed' ? '<p class="hint">Record the entrance test score and interview outcome. An applicant can only be accepted after assessment.</p>' +
      '<div class="row2"><div class="field"><label>Entrance test score (out of 100)</label><input class="input" type="number" min="0" max="100" id="as-score" value="74"></div><div class="field"><label>Interview rating</label><select class="input" id="as-rate">' + [5, 4, 3, 2].map(n => '<option value="' + n + '"' + (n === 4 ? ' selected' : '') + '>' + n + ' — ' + ['', '', 'Below average', 'Good', 'Very good', 'Excellent'][n] + '</option>').join('') + '</select></div></div><div class="field"><label>Notes</label><textarea class="input" id="as-note" rows="3">Confident and articulate. Recommended for admission.</textarea></div>' + SP.btn('Save assessment', 'admAssess', { c: 'pri', d: { id: a.id }, tour: 'adm-assess' }) : SP.empty('Not assessed yet', 'Assessment opens once the application is reviewed.'));
  } else if (tab === 'fee') {
    const f = a.fee, st = feeState(a);
    body = '<div class="mini3"><div><span>Admission fee</span><b>' + SP.pkr(5000) + '</b></div><div><span>First month</span><b>' + SP.pkr(f.amount - 5000) + '</b></div><div><span>Total due</span><b>' + SP.pkr(f.amount) + '</b></div></div>' +
      (st === 'none' ? '<div class="note">' + I('alert') + '<span>No admission voucher yet. It can be issued once the applicant is accepted.</span></div>' :
        st === 'paid' ? '<div class="note ok">' + I('check') + '<span><b>Fee received</b> — ' + esc(f.method) + ' · ' + D.nice(f.paidOn) + '. The applicant can now be admitted.</span></div>' :
        st === 'waived' ? '<div class="note ok">' + I('check') + '<span><b>Fee waived</b> (scholarship). The applicant can be admitted.</span></div>' :
        '<div class="note">' + I('clock') + '<span><b>Waiting for payment.</b> The seat is held for 7 days. The parent has the voucher on WhatsApp and SMS and can pay online.</span></div>' +
        '<div class="row2"><div class="field"><label>Record payment received</label><select class="input" id="af-m">' + SP.PAY_METHODS.map(m => '<option>' + m + '</option>').join('') + '</select></div><div class="field"><label>&nbsp;</label>' + SP.btn('Confirm payment', 'admPay', { c: 'pri', i: 'check', d: { id: a.id }, tour: 'adm-pay' }) + '</div></div>' +
        '<div class="dr-act">' + SP.btn('Simulate parent paying online', 'admPayOnline', { i: 'phone', d: { id: a.id }, tour: 'adm-payonline' }) + SP.btn('Send reminder', 'admRemind', { i: 'bell', d: { id: a.id } }) + SP.btn('Waive fee (scholarship)', 'admWaive', { d: { id: a.id } }) + '</div>') +
      (f.issued ? '<h4>What the parent received</h4><div class="bubble-sms">' + esc('School Portal: Admission of ' + a.name + ' (Grade ' + a.grade + ') has been accepted. Please pay ' + SP.pkr(f.amount) + ' by ' + D.nice(D.add(TODAY, 7)) + ' to confirm the seat. Voucher: ADM-' + a.ref.slice(-4) + '. Pay via JazzCash/Easypaisa or at the school.') + '</div>' : '');
  } else {
    body = '<ul class="timeline">' + a.log.slice().reverse().map(l => '<li><b>' + esc(l[0]) + '</b><span>' + D.nice(l[1]) + '</span></li>').join('') + '</ul>';
  }
  // contextual next step (footer)
  let act = '', hint = '';
  const miss = reqMissing(a);
  if (a.stage === 'new') { act = SP.btn('Mark as reviewed', 'admReview', { c: 'pri', d: { id: a.id }, tour: 'adm-review', dis: miss.length > 0 }) + SP.btn('Reject', 'admRejectModal', { c: 'danger', d: { id: a.id } }); hint = miss.length ? 'Missing required documents: ' + miss.map(d => d[1]).join(', ') : 'All required documents received.'; }
  else if (a.stage === 'reviewed') act = '<input class="input sm" type="date" id="int-date" value="' + D.add(TODAY, 2) + '">' + SP.btn('Schedule interview & notify parent', 'admInterview', { c: 'pri', d: { id: a.id }, tour: 'adm-int' }) + SP.btn('Reject', 'admRejectModal', { c: 'danger', d: { id: a.id } });
  else if (a.stage === 'interview') { act = SP.btn('Accept applicant', 'admAccept', { c: 'pri', d: { id: a.id }, tour: 'adm-accept', dis: !a.test }) + SP.btn('Reject', 'admRejectModal', { c: 'danger', d: { id: a.id } }); hint = a.test ? 'Assessment recorded — ready for a decision.' : 'Record the assessment before deciding.'; }
  else if (a.stage === 'accepted') {
    if (!a.fee.issued) act = SP.btn('Issue admission voucher', 'admVoucher', { c: 'pri', d: { id: a.id }, tour: 'adm-voucher' });
    else { const ok = SP.admFeeReady(a); act = '<select class="input sm" id="adm-sec">' + c.slice().sort((x, y) => SP.inClass(x.id).length - SP.inClass(y.id).length).map(x => '<option value="' + x.id + '">' + x.label + ' (' + SP.inClass(x.id).length + ')</option>').join('') + '</select>' + SP.btn('Admit student', 'admAdmit', { c: 'pri', i: 'check', d: { id: a.id }, tour: 'adm-admit', dis: !ok }); hint = ok ? 'Fee cleared — choose a section and admit.' : 'Admission fee of ' + SP.pkr(a.fee.amount) + ' is still pending. The student can be admitted once it is paid.'; }
  } else if (a.stage === 'rejected') act = SP.btn('Reopen application', 'admReopen', { d: { id: a.id } });
  else if (a.stage === 'admitted' && a.studentId) act = SP.btn('Open student profile', 'openStudent', { c: 'pri', d: { id: a.studentId } });
  return '<div class="dr-h"><div>' + SP.person(a.name, a.ref + ' · Grade ' + a.grade, 'lg') + '</div><div class="row-c" style="gap:8px">' + stagePill(a.stage) + '<button class="btn ghost icon" data-act="closeDrawer">' + I('x') + '</button></div></div>' +
    '<div class="dr-tabs">' + stepper + tabs + '</div><div class="dr-b" data-scroll="drb">' + body + '</div>' +
    '<div class="dr-foot">' + (hint ? '<div class="hint ' + (/pending|Missing|Record/.test(hint) ? 'warn' : '') + '">' + hint + '</div>' : '') + '<div class="row-c" style="gap:8px;justify-content:flex-end">' + act + '</div></div>';
};
SP.drawers.applicant.wide = true;

/* ---------- actions ---------- */
function to(a, st, note, toast) { a.stage = st; log(a, note); SP.toast(toast); SP.render(); }
SP.act.admDoc = d => { const a = appl(d.id); if (d.v === 'view') return SP.toast('Document preview opens here (demo)'); a.docs[d.k] = true; log(a, SP.DOCS.find(x => x[0] === d.k)[1] + ' received'); SP.render(); };
SP.act.admDocsAll = d => { const a = appl(d.id); SP.DOCS.forEach(x => { a.docs[x[0]] = true; }); log(a, 'All documents received'); SP.toast('All documents marked received'); SP.render(); };
SP.act.admReview = d => { const a = appl(d.id); if (reqMissing(a).length) return SP.toast('Required documents are missing', 'warn'); to(a, 'reviewed', 'Documents verified and application reviewed', 'Application reviewed'); };
SP.act.admInterview = d => { const a = appl(d.id), dt = $v('int-date') || D.add(TODAY, 2); a.interviewOn = dt; to(a, 'interview', 'Interview scheduled for ' + D.nice(dt), 'Interview booked · SMS sent to ' + a.parent); };
SP.act.admAssess = d => { const a = appl(d.id); a.test = { score: Math.max(0, Math.min(100, +$v('as-score') || 0)), by: SP.teacher(SP.S.staffId).name, rating: +$v('as-rate') || 4, note: $v('as-note') || 'No notes.' }; if (a.stage === 'reviewed') { a.stage = 'interview'; a.interviewOn = a.interviewOn || TODAY; } log(a, 'Assessment recorded — test ' + a.test.score + '/100'); SP.toast('Assessment saved'); SP.render(); };
SP.act.admAccept = d => { const a = appl(d.id); if (!a.test) return SP.toast('Record the assessment first', 'warn'); to(a, 'accepted', 'Accepted by principal', 'Applicant accepted · issue the admission voucher next'); };
SP.act.admRejectModal = d => SP.openModal('reject', { id: d.id });
SP.modals.reject = function (a) {
  const ap = appl(a.id);
  return '<div class="m-h"><h3>Reject application</h3><button class="btn ghost icon" data-act="closeModal">' + I('x') + '</button></div><div class="m-b">' + SP.person(ap.name, 'Grade ' + ap.grade + ' · ' + ap.ref) +
    '<div class="field" style="margin-top:14px"><label>Reason (shared with the parent)</label><select class="input" id="rj-r"><option>No seat available in this grade</option><option>Did not meet the entrance criteria</option><option>Incomplete documents</option><option>Applicant withdrew</option></select></div></div><div class="m-f">' + SP.btn('Cancel', 'closeModal') + SP.btn('Reject application', 'admReject', { c: 'danger', d: { id: a.id } }) + '</div>';
};
SP.act.admReject = d => { const a = appl(d.id), r = $v('rj-r'); a.note = r; SP.ui.modal = null; to(a, 'rejected', 'Rejected — ' + r, 'Application rejected · parent notified'); };
SP.act.admReopen = d => { const a = appl(d.id); a.note = ''; to(a, 'reviewed', 'Reopened', 'Application reopened'); };
SP.act.admVoucher = d => { const a = appl(d.id); a.fee.issued = true; a.voucherIssued = true; SP.deliver({ title: 'Admission voucher · ' + a.name, total: 1, channels: ['whatsapp', 'sms'], note: 'Voucher for ' + SP.pkr(a.fee.amount) + ' sent to ' + a.parent }); log(a, 'Admission voucher issued (' + SP.pkr(a.fee.amount) + ')'); SP.ui.f.adm_tab = 'fee'; SP.render(); };
SP.act.admRemind = d => { const a = appl(d.id); SP.deliver({ title: 'Fee reminder · ' + a.name, total: 1, channels: ['sms', 'whatsapp'] }); log(a, 'Fee reminder sent'); SP.render(); };
SP.act.admPay = d => { const a = appl(d.id), m = $v('af-m') || 'Cash'; a.fee.paid = true; a.fee.method = m; a.fee.paidOn = TODAY; log(a, 'Admission fee received via ' + m); SP.toast('Payment recorded · ready to admit'); SP.render(); };
SP.act.admPayOnline = d => { const a = appl(d.id); a.fee.paid = true; a.fee.method = 'JazzCash'; a.fee.paidOn = TODAY; log(a, 'Parent paid online via JazzCash'); SP.toast(a.parent + ' paid ' + SP.pkr(a.fee.amount) + ' online · ready to admit'); SP.render(); };
SP.act.admWaive = d => { const a = appl(d.id); a.fee.waived = true; log(a, 'Admission fee waived (scholarship approved by principal)'); SP.toast('Fee waived · ready to admit'); SP.render(); };
SP.act.admAdmit = d => {
  const S = SP.S, a = appl(d.id); if (!SP.admFeeReady(a)) return SP.toast('Admission fee is still pending', 'warn');
  const cid = $v('adm-sec') || SP.CLASSES.filter(c => c.grade === a.grade)[0].id, c = SP.cls(cid);
  const n = S.newStudents.length + 1, pid = 'PN' + (S.newParents.length + 1), sid = 'SN' + n, sur = a.parent.split(' ').slice(-1)[0];
  const par = { id: pid, name: a.parent, sur, rel: a.rel, phone: a.phone, email: a.parent.toLowerCase().replace(/ /g, '.') + '@gmail.com' };
  const stu = { id: sid, first: a.name.split(' ')[0], name: a.name, gender: a.gender, classId: c.id, grade: a.grade, roll: SP.inClass(c.id).length + 1, parentId: pid, admNo: 'SP-2026-' + (900 + n), dob: a.dob, address: 'House 5, Street 2, Model Town', transport: false, ability: .7, pref: 'New admission — assign a buddy for the first week', eContact: { name: 'Uncle ' + sur, phone: '0300-1234567' } };
  S.newParents.push(par); S.newStudents.push(stu); SP.PARENTS.push(par); SP.PARENT_MAP[pid] = par; SP.STUDENTS.push(stu); SP.STU_MAP[sid] = stu;
  const heads = [['Admission fee', 5000], ['Tuition fee', c.fee]];
  S.fees[sid] = [{ id: 'V2609-A' + n, month: '2026-09', heads, total: 5000 + c.fee, due: TODAY, paid: true, paidOn: TODAY, method: a.fee.waived ? 'Waived' : a.fee.method || 'Cash', sent: true }];
  S.attToday[sid] = 'P'; a.studentId = sid; a.section = cid; a.stage = 'admitted';
  log(a, 'Admitted to ' + c.label + ' (' + stu.admNo + ')'); SP.toast(a.name + ' admitted to ' + c.label + ' — student record created, parent app activated'); SP.render();
};
})();
