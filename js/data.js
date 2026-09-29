/* Seeded, deterministic fake data. Everything here is generated — no real people. */
(function () {
'use strict';
const SP = window.SP = window.SP || {};

const TODAY = '2026-09-29'; // Tuesday
const NOW_MIN = 10 * 60 + 20; // demo clock starts 10:20
SP.TODAY = TODAY;

/* ---------- rng ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function R(seed) {
  const r = mulberry32(seed);
  return { f: r, pick: a => a[Math.floor(r() * a.length)], int: (a, b) => Math.floor(r() * (b - a + 1)) + a, chance: p => r() < p };
}
function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
const pad = (n, w) => String(n).padStart(w || 2, '0');
SP.hash01 = hash01; SP.pad = pad;

/* ---------- dates ---------- */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const D = SP.D = {
  add(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); },
  dow(iso) { return new Date(iso + 'T00:00:00Z').getUTCDay(); },
  dowName(iso) { return DOW[D.dow(iso)]; },
  nice(iso) { const p = iso.split('-'); return (+p[2]) + ' ' + MON[+p[1] - 1]; },
  niceY(iso) { const p = iso.split('-'); return (+p[2]) + ' ' + MON[+p[1] - 1] + ' ' + p[0]; },
  long(iso) { const p = iso.split('-'); return DOW[D.dow(iso)] + ', ' + (+p[2]) + ' ' + MONL[+p[1] - 1] + ' ' + p[0]; },
  monthLabel(ym) { const p = ym.split('-'); return MONL[+p[1] - 1] + ' ' + p[0]; },
  isSchoolDay(iso) { const w = D.dow(iso); return w >= 1 && w <= 5; },
  time(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60); },
  ts(iso, min) { return iso + ' ' + D.time(min); },
  niceTs(ts) { const d = ts.slice(0, 10), t = ts.slice(11); if (d === TODAY) return 'Today ' + t; if (d === D.add(TODAY, -1)) return 'Yesterday ' + t; return D.nice(d) + ' ' + t; }
};
// last 30 school days before today, oldest first
SP.DAYS = (() => { const out = []; let d = TODAY; while (out.length < 30) { d = D.add(d, -1); if (D.isSchoolDay(d)) out.unshift(d); } return out; })();

/* ---------- names ---------- */
const BOY = ['Ahmed', 'Ali', 'Hamza', 'Bilal', 'Usman', 'Zain', 'Hassan', 'Hussain', 'Fahad', 'Danish', 'Rayyan', 'Arham', 'Umar', 'Talha', 'Saad', 'Shayan', 'Ibrahim', 'Haris', 'Faizan', 'Moiz', 'Aahil', 'Yousuf', 'Abdullah', 'Zaid'];
const GIRL = ['Ayesha', 'Fatima', 'Zainab', 'Maria', 'Sana', 'Hira', 'Amna', 'Eman', 'Areeba', 'Noor', 'Laiba', 'Mahnoor', 'Sadia', 'Alishba', 'Rida', 'Kinza', 'Farwa', 'Anaya', 'Mishal', 'Warda', 'Maham', 'Hania', 'Rania', 'Zoya'];
const SUR = ['Khan', 'Malik', 'Sheikh', 'Butt', 'Chaudhry', 'Raza', 'Javed', 'Iqbal', 'Farooq', 'Aslam', 'Siddiqui', 'Qureshi', 'Abbasi', 'Hashmi', 'Bhatti', 'Awan', 'Niazi', 'Rizvi', 'Baig', 'Soomro', 'Aziz', 'Arshad', 'Nadeem', 'Ameen'];
const MAN = ['Muhammad', 'Imran', 'Tariq', 'Shahid', 'Naveed', 'Kamran', 'Asif', 'Waqas', 'Adnan', 'Zahid', 'Rashid', 'Salman', 'Junaid', 'Faisal', 'Shoaib', 'Usman', 'Athar', 'Zubair'];
const WOMAN = ['Nadia', 'Farzana', 'Shazia', 'Rubina', 'Samina', 'Uzma', 'Naila', 'Yasmin', 'Saima', 'Rukhsana', 'Tahira', 'Bushra', 'Shabana', 'Asma', 'Nasreen', 'Humaira', 'Sadia', 'Mehreen'];
const AREAS = ['Model Town', 'Gulberg', 'Johar Town', 'Garden Town', 'Iqbal Town', 'Township', 'Cantt', 'Faisal Town', 'Wapda Town', 'Bahria Town'];

/* ---------- structure ---------- */
const SUBJECTS = ['English', 'Urdu', 'Mathematics', 'Science', 'Social Studies', 'Islamiyat', 'Computer', 'Art'];
const CLASSES = [];
[1, 2, 3, 4, 5, 6, 7, 8].forEach(g => ['A', 'B'].forEach(s => CLASSES.push({ id: g + s, label: 'Grade ' + g + '-' + s, short: g + s, grade: g, section: s, fee: 3500 + (g - 1) * 450 })));

const rt = R(11);
const TEACHERS = [];
for (let i = 0; i < 24; i++) {
  const m = rt.chance(.45);
  const nm = rt.pick(m ? MAN : WOMAN) + ' ' + rt.pick(SUR);
  TEACHERS.push({ id: 'T' + pad(i + 1), name: nm, gender: m ? 'M' : 'F', phone: '03' + rt.int(10, 49) + '-' + rt.int(1000000, 9999999), role: 'Teacher', classId: i < 16 ? CLASSES[i].id : null, title: i < 16 ? 'Class teacher, ' + CLASSES[i].label : 'Subject specialist' });
}
CLASSES.forEach((c, i) => { c.teacherId = TEACHERS[i].id; });
const ALLOC = {}; // classId -> subject -> teacherId
CLASSES.forEach((c, ci) => { ALLOC[c.id] = {}; SUBJECTS.forEach((s, si) => { ALLOC[c.id][s] = TEACHERS[(ci * 5 + si * 3) % TEACHERS.length].id; }); });
const OFFICE = ['Principal', 'Vice Principal', 'Admissions Officer', 'Accountant', 'Front Desk Officer', 'Librarian', 'IT Support', 'Exam Coordinator', 'Facilities Manager', 'Office Assistant'];
const STAFF_OFFICE = OFFICE.map((role, i) => { const m = rt.chance(.55); return { id: 'O' + pad(i + 1), name: rt.pick(m ? MAN : WOMAN) + ' ' + rt.pick(SUR), gender: m ? 'M' : 'F', phone: '03' + rt.int(10, 49) + '-' + rt.int(1000000, 9999999), role, title: role }; });
const STAFF_ALL = TEACHERS.concat(STAFF_OFFICE);

/* ---------- parents & students ---------- */
const rs = R(2026);
const PARENTS = [], STUDENTS = [];
CLASSES.forEach((c, ci) => {
  const n = 19 + (ci % 4);
  for (let i = 1; i <= n; i++) {
    const girl = rs.chance(.48), male = rs.chance(.62), sur = rs.pick(SUR);
    const first = rs.pick(male ? MAN : WOMAN);
    const pid = 'P' + pad(PARENTS.length + 1, 3);
    PARENTS.push({ id: pid, name: first + ' ' + sur, sur, rel: male ? 'Father' : 'Mother', phone: '03' + rs.int(10, 49) + '-' + rs.int(1000000, 9999999), email: (first + sur + rs.int(1, 99)).toLowerCase() + '@gmail.com' });
    const sf = rs.pick(girl ? GIRL : BOY);
    STUDENTS.push({
      id: 'S' + pad(STUDENTS.length + 1, 4), first: sf, name: sf + ' ' + sur, gender: girl ? 'F' : 'M', classId: c.id, grade: c.grade, roll: i, parentId: pid,
      admNo: 'SP-' + (2027 - c.grade) + '-' + pad(100 + STUDENTS.length, 4), dob: (2026 - 5 - c.grade) + '-' + pad(rs.int(1, 12)) + '-' + pad(rs.int(1, 27)),
      address: 'House ' + rs.int(1, 240) + ', Street ' + rs.int(1, 30) + ', ' + rs.pick(AREAS), transport: rs.chance(.3), ability: .45 + rs.f() * .5,
      pref: rs.pick(['Prefers visual explanations; front-row seat', 'Works best in small groups', 'Needs extra reading support', 'Strong in maths; enjoys challenge tasks', 'Shy — encourage class participation', 'Enjoys art and hands-on projects'])
    });
  }
});
// siblings: merge some pairs of students in different grades under one parent
for (let k = 0, guard = 0; k < 30 && guard < 500; guard++) {
  const a = STUDENTS[rs.int(0, STUDENTS.length - 1)], b = STUDENTS[rs.int(0, STUDENTS.length - 1)];
  if (a.grade === b.grade || a.parentId === b.parentId) continue;
  if (STUDENTS.filter(s => s.parentId === a.parentId || s.parentId === b.parentId).length > 2) continue;
  const pa = PARENTS.find(p => p.id === a.parentId);
  b.parentId = a.parentId; b.name = b.first + ' ' + pa.sur; k++;
}
const used = {}; STUDENTS.forEach(s => { used[s.parentId] = 1; });
for (let i = PARENTS.length - 1; i >= 0; i--) if (!used[PARENTS[i].id]) PARENTS.splice(i, 1);
const PARENT_MAP = {}, STU_MAP = {};
PARENTS.forEach(p => { PARENT_MAP[p.id] = p; });
STUDENTS.forEach(s => { STU_MAP[s.id] = s; });
STUDENTS.forEach(s => { s.eContact = { name: (s.id.charCodeAt(4) % 2 ? 'Uncle ' : 'Aunt ') + SUR[(+s.id.slice(1)) % SUR.length], phone: '03' + (10 + (+s.id.slice(1)) % 39) + '-' + (2000000 + (+s.id.slice(1)) * 7919 % 7000000) }; });

/* ---------- history: attendance / gate / staff ---------- */
const ATT = {}; // studentId -> string aligned to SP.DAYS ('P','A','L')
STUDENTS.forEach(s => {
  const ap = hash01('ap' + s.id); // absenteeism propensity
  const pa = .015 + ap * ap * .16, pl = .02;
  ATT[s.id] = SP.DAYS.map((d, i) => { const r = hash01(s.id + d); return r < pa ? 'A' : r < pa + pl ? 'L' : 'P'; }).join('');
});
const STAFF_ATT = {}; // staffId -> array aligned to last 14 days of SP.DAYS: 'P','A','L','T'(late)
STAFF_ALL.forEach(s => { STAFF_ATT[s.id] = SP.DAYS.slice(-14).map(d => { const r = hash01(s.id + d); return r < .025 ? 'A' : r < .07 ? 'L' : r < .13 ? 'T' : 'P'; }); });
SP.inMin = (id, date) => 7 * 60 + 35 + Math.floor(hash01('in' + id + date) * 50);
SP.outMin = (id, date) => 13 * 60 + 30 + Math.floor(hash01('out' + id + date) * 40);
SP.LATE_AFTER = 8 * 60 + 10;

/* ---------- timetable ---------- */
const PERIODS = [['08:00', '08:40'], ['08:40', '09:20'], ['09:20', '10:00'], ['10:00', '10:30', 'Break'], ['10:30', '11:10'], ['11:10', '11:50'], ['11:50', '12:30'], ['12:30', '13:10']];
function timetable(classId, day) {
  const ci = CLASSES.findIndex(c => c.id === classId); let k = 0;
  return PERIODS.map(p => {
    if (p[2]) return { from: p[0], to: p[1], subject: 'Break', teacherId: null };
    const sub = SUBJECTS[(k + day * 2 + ci) % SUBJECTS.length]; k++;
    return { from: p[0], to: p[1], subject: sub, teacherId: ALLOC[classId][sub] };
  });
}

/* ---------- quizzes (results derived) ---------- */
const rq = R(909);
const QUIZ_TITLES = ['Chapter 3 quiz', 'Unit test 1', 'Weekly quiz', 'Vocabulary check', 'Mental maths', 'Practical viva'];
const QUIZZES = [];
CLASSES.forEach(c => { for (let i = 0; i < 3; i++) { const sub = SUBJECTS[(i * 3 + c.grade) % SUBJECTS.length]; QUIZZES.push({ id: 'Q' + pad(QUIZZES.length + 1, 3), classId: c.id, subject: sub, title: sub + ' — ' + rq.pick(QUIZ_TITLES), date: D.add(TODAY, -(4 + i * 6 + rq.int(0, 2))), total: rq.pick([10, 20, 25]) }); } });
SP.quizScore = (q, s) => { const raw = s.ability + (hash01(q.id + s.id) - .5) * .35; return Math.max(0, Math.min(q.total, Math.round(q.total * Math.min(.99, Math.max(.2, raw))))); };

/* ---------- misc pools ---------- */
const PAY_METHODS = ['Cash', 'Bank Deposit', 'JazzCash', 'Easypaisa', 'Card'];
const METHOD_RATE = { 'Cash': 0, 'Bank Deposit': 0, 'JazzCash': .015, 'Easypaisa': .015, 'Card': .025 };

/* ---------- seed builders (mutable state) ---------- */
function seedFees() {
  const r = R(555), out = {};
  const months = ['2026-07', '2026-08', '2026-09'];
  let seq = 1;
  STUDENTS.forEach(s => {
    const c = CLASSES.find(x => x.id === s.classId);
    const dp = hash01('dp' + s.id);
    out[s.id] = months.map((m, mi) => {
      const heads = [['Tuition fee', c.fee]]; if (s.transport) heads.push(['Transport', 2200]);
      const total = heads.reduce((a, h) => a + h[1], 0);
      const paid = mi === 0 ? dp > .03 : mi === 1 ? dp > .13 : dp > .40;
      const day = mi === 2 ? r.int(1, 27) : r.int(1, 14);
      const roll = r.f(); const method = roll < .34 ? 'Cash' : roll < .6 ? 'Bank Deposit' : roll < .78 ? 'JazzCash' : roll < .92 ? 'Easypaisa' : 'Card';
      return { id: 'V' + m.slice(2, 4) + m.slice(5) + '-' + pad(seq++, 4), month: m, heads, total, due: m + '-10', paid, paidOn: paid ? m + '-' + pad(day) : null, method: paid ? method : null, sent: true };
    });
  });
  return out;
}

function seedToday() {
  const r = R(31), marks = {}, submitted = {};
  const unmarked = ['5A', '5B', '6A', '7B'];
  STUDENTS.forEach(s => {
    if (unmarked.indexOf(s.classId) > -1) return;
    const x = r.f(), ap = hash01('ap' + s.id);
    marks[s.id] = x < .02 + ap * .05 ? 'A' : x < .05 + ap * .05 ? 'L' : 'P';
    submitted[s.classId] = true;
  });
  return { marks, submitted };
}

function seedApplicants() {
  const r = R(4242);
  const sources = ['portal', 'portal', 'portal', 'walk-in', 'referral'];
  const schools = ['Beaconhouse', 'City School', 'Roots Millennium', 'LGS', 'Home schooled', 'Allied School', 'Punjab Group'];
  const stages = [].concat(Array(14).fill('new'), Array(12).fill('reviewed'), Array(11).fill('interview'), Array(6).fill('accepted'), Array(4).fill('rejected'), Array(6).fill('admitted'));
  return stages.map((st, i) => {
    const girl = r.chance(.5), m = r.chance(.6), sur = r.pick(SUR), g = r.pick([1, 1, 2, 3, 4, 5, 6, 7, 8]);
    const sub = D.add(TODAY, -r.int(0, st === 'new' ? 6 : 24));
    return {
      id: 'A' + pad(i + 1, 3), ref: 'ADM-2609-' + (1000 + Math.floor(r.f() * 8999)).toString(36).toUpperCase(), name: r.pick(girl ? GIRL : BOY) + ' ' + sur, gender: girl ? 'F' : 'M', dob: (2026 - 5 - g) + '-' + pad(r.int(1, 12)) + '-' + pad(r.int(1, 27)),
      grade: g, prevSchool: r.pick(schools), parent: r.pick(m ? MAN : WOMAN) + ' ' + sur, rel: m ? 'Father' : 'Mother', phone: '03' + r.int(10, 49) + '-' + r.int(1000000, 9999999), source: r.pick(sources), submitted: sub,
      stage: st, interviewOn: st === 'interview' ? D.add(TODAY, r.int(-1, 5)) : null, voucherIssued: st === 'accepted' ? r.chance(.5) : st === 'admitted', studentId: null, log: [['Application received', sub]]
    };
  });
}
const APP_QUEUE = [
  { name: 'Hania Farooq', gender: 'F', grade: 3, parent: 'Farooq Ahmed', rel: 'Father', prevSchool: 'City School', phone: '0321-4455667' },
  { name: 'Rayyan Siddiqui', gender: 'M', grade: 1, parent: 'Nadia Siddiqui', rel: 'Mother', prevSchool: 'Home schooled', phone: '0333-9081726' },
  { name: 'Zoya Malik', gender: 'F', grade: 6, parent: 'Imran Malik', rel: 'Father', prevSchool: 'LGS', phone: '0300-7723145' },
  { name: 'Ibrahim Butt', gender: 'M', grade: 4, parent: 'Shazia Butt', rel: 'Mother', prevSchool: 'Roots Millennium', phone: '0345-1209988' }
];

function seedThreads() {
  const picks = [];
  for (let i = 0; i < 16; i++) picks.push(STUDENTS[(i * 37 + 11) % STUDENTS.length]);
  const T = (i, type, subject, msgs, extra) => {
    const s = picks[i], p = PARENT_MAP[s.parentId];
    const list = msgs.map((m, j) => ({ from: m[0], who: m[0] === 'parent' ? p.name : m[2] || 'Front Desk', text: m[1].replace(/\{c\}/g, s.first), ts: m[3] || (D.add(TODAY, -m[4]) + ' ' + m[5]) }));
    const last = list[list.length - 1];
    return Object.assign({ id: 'C' + pad(i + 1), studentId: s.id, type, subject, status: 'open', unreadAdmin: last.from === 'parent', unreadParent: false, messages: list }, extra || {});
  };
  return [
    T(0, 'Leave request', 'Leave request', [['parent', 'Assalamualaikum. {c} will not be able to attend school tomorrow due to fever. Kindly grant one day leave.', '', null, 0, '09:41']], { leave: { date: D.add(TODAY, 1), status: 'pending' } }),
    T(1, 'PTM', 'PTM slot change', [['parent', 'Can we move our PTM slot to Thursday afternoon? Office timing clashes.', '', null, 0, '08:55']]),
    T(2, 'Fee query', 'September fee paid via JazzCash', [['parent', 'I paid the September fee on JazzCash yesterday but the portal still shows it unpaid.', '', null, 1, '17:20'], ['school', 'Walaikum Assalam. Please share the transaction ID and we will verify with accounts.', 'Accountant', null, 1, '17:48'], ['parent', 'TID 88214417 — screenshot sent on WhatsApp too.', '', null, 1, '18:02']]),
    T(3, 'Leave request', 'Leave request', [['parent', '{c} has a dental appointment on Wednesday. Please allow half-day leave.', '', null, 1, '12:10'], ['school', 'Approved. Please collect a gate pass from the front desk.', 'Front Desk', null, 1, '12:40']], { leave: { date: D.add(TODAY, 1), status: 'approved' }, unreadAdmin: false }),
    T(4, 'General', 'School bus timing', [['parent', 'What time does bus route 4 leave in the afternoon now? {c} came home late twice.', '', null, 2, '15:30']]),
    T(5, 'General', 'Copy of result card', [['parent', 'Could you please issue a duplicate result card for {c}?', '', null, 3, '10:05'], ['school', 'Yes, it will be ready at the front desk tomorrow.', 'Front Desk', null, 3, '11:15']], { unreadAdmin: false, status: 'resolved' }),
    T(6, 'Leave request', 'Leave request', [['parent', '{c} is unwell today. Will return on Thursday, insha\'Allah.', '', null, 3, '07:30']], { leave: { date: D.add(TODAY, -1), status: 'pending' } }),
    T(7, 'Fee query', 'Sibling discount', [['parent', 'Is there a sibling discount on tuition for the second child?', '', null, 4, '13:45'], ['school', '10% on the younger sibling\'s tuition. We will apply it from October.', 'Accountant', null, 4, '14:20']], { unreadAdmin: false })
  ];
}

function seedAnnouncements() {
  return [
    { id: 'N1', title: 'Mid-term exams from 6 October', body: 'Mid-term examinations begin on Tuesday, 6 October. The detailed datesheet will be shared by Friday. Please ensure students carry their diaries daily.', audience: 'all', channels: ['push', 'whatsapp'], ts: D.add(TODAY, -2) + ' 09:00', by: 'Principal' },
    { id: 'N2', title: 'Annual Sports Day — 15 October', body: 'Sports Day will be held on 15 October. Students should wear house colours. Parents are warmly invited from 10 AM.', audience: 'all', channels: ['push', 'sms'], ts: D.add(TODAY, -7) + ' 11:30', by: 'Vice Principal' },
    { id: 'N3', title: 'Science fair — Grade 5 & 6', body: 'Grade 5 and 6 students should submit their science fair project titles to their class teacher by Thursday.', audience: '5A', channels: ['push'], ts: D.add(TODAY, -3) + ' 13:10', by: 'Exam Coordinator' },
    { id: 'N4', title: 'Fee reminder — September', body: 'Kindly clear the September fee at the earliest to avoid a late fine. You can pay online from the parent app.', audience: 'all', channels: ['push', 'whatsapp', 'sms'], ts: D.add(TODAY, -5) + ' 10:15', by: 'Accountant' }
  ];
}

function seedDiary() {
  const r = R(707), out = [];
  const hw = ['Complete exercise 4 from the textbook.', 'Learn the spellings from the list on page 32.', 'Revise Chapter 5 for Friday\'s quiz.', 'Draw and label the diagram discussed in class.', 'Read the passage on page 41 and answer the questions.'];
  CLASSES.forEach(c => {
    for (let i = 0; i < 3; i++) {
      const sub = SUBJECTS[(i * 2 + c.grade) % SUBJECTS.length];
      out.push({ id: 'D' + pad(out.length + 1, 3), classId: c.id, subject: sub, type: 'homework', title: sub + ' homework', text: r.pick(hw), date: D.add(TODAY, -(i + 1)), due: D.add(TODAY, 1 + i), teacherId: ALLOC[c.id][sub] });
    }
    out.push({ id: 'D' + pad(out.length + 1, 3), classId: c.id, subject: 'General', type: 'note', title: 'Note from class teacher', text: 'Please send water bottles daily and cover notebooks with labels.', date: D.add(TODAY, -1), due: null, teacherId: c.teacherId });
  });
  return out;
}

/* ---------- exports ---------- */
Object.assign(SP, { SUBJECTS, CLASSES, TEACHERS, STAFF_OFFICE, STAFF_ALL, PARENTS, STUDENTS, PARENT_MAP, STU_MAP, ATT, STAFF_ATT, ALLOC, PERIODS, QUIZZES, PAY_METHODS, METHOD_RATE, APP_QUEUE, NOW_MIN, R, timetable, seedFees, seedToday, seedApplicants, seedThreads, seedAnnouncements, seedDiary, MON, MONL });
})();
