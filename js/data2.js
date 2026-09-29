/* Seeds and derived data for the learning, exams, calendar, circulars/consents, admissions and system-status features.
   Big fixed content lives here as constants; only edits and responses are stored in SP.S. */
(function () {
'use strict';
const SP = window.SP, D = SP.D, TODAY = SP.TODAY, pad = SP.pad, hash01 = SP.hash01, R = SP.R;
const SUBJECTS = SP.SUBJECTS, CLASSES = SP.CLASSES;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* ---------- question bank (question, right answer, three wrong answers) ---------- */
const QB = {
  Science: [['Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Saturn'], ['Which gas do plants absorb from the air?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'], ['At sea level, water boils at:', '100°C', '50°C', '90°C', '120°C'], ['Which organ pumps blood around the body?', 'Heart', 'Lungs', 'Liver', 'Kidney'], ['The closest star to Earth is:', 'The Sun', 'Sirius', 'Polaris', 'Alpha Centauri'], ['Which state of matter has a fixed shape?', 'Solid', 'Liquid', 'Gas', 'Vapour'], ['Which force pulls objects towards the Earth?', 'Gravity', 'Friction', 'Magnetism', 'Tension'], ['Plants make their food by:', 'Photosynthesis', 'Respiration', 'Digestion', 'Evaporation']],
  English: [['Choose the correct plural of "child".', 'Children', 'Childs', 'Childes', 'Childrens'], ['Which word is a noun?', 'Teacher', 'Quickly', 'Beautiful', 'Run'], ['A synonym of "happy" is:', 'Joyful', 'Sad', 'Angry', 'Tired'], ['"She ___ to school every day."', 'goes', 'go', 'going', 'gone'], ['The opposite of "ancient" is:', 'Modern', 'Old', 'Historic', 'Aged'], ['Which sentence is correct?', 'They are playing outside.', 'They is playing outside.', 'They playing are outside.', 'They be playing outside.'], ['A word that describes a verb is an:', 'Adverb', 'Adjective', 'Noun', 'Pronoun'], ['Which is a proper noun?', 'Lahore', 'city', 'river', 'school']],
  Urdu: [['"Ilm" means:', 'Knowledge', 'Wealth', 'Journey', 'Garden'], ['The national language of Pakistan is:', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto'], ['"Kitab" is a:', 'Book', 'Pen', 'Chair', 'Table'], ['The opposite of "Din" (day) is:', 'Raat', 'Subah', 'Shaam', 'Dopahar'], ['"Dost" means:', 'Friend', 'Enemy', 'Teacher', 'Stranger'], ['The national poet of Pakistan is:', 'Allama Iqbal', 'Ghalib', 'Faiz', 'Mir'], ['Urdu is written from:', 'Right to left', 'Left to right', 'Top to bottom', 'Bottom to top'], ['"Pani" means:', 'Water', 'Fire', 'Air', 'Earth']],
  'Social Studies': [['The capital of Pakistan is:', 'Islamabad', 'Karachi', 'Lahore', 'Peshawar'], ['The founder of Pakistan is:', 'Quaid-e-Azam M. A. Jinnah', 'Liaquat Ali Khan', 'Allama Iqbal', 'Sir Syed Ahmad Khan'], ['The longest river in Pakistan is the:', 'Indus', 'Ravi', 'Jhelum', 'Chenab'], ['The second highest peak in the world is:', 'K2', 'Nanga Parbat', 'Tirich Mir', 'Rakaposhi'], ['Pakistan\'s Independence Day is:', '14 August', '23 March', '6 September', '25 December'], ['How many provinces does Pakistan have?', '4', '3', '5', '6'], ['Which city is called the "City of Lights"?', 'Karachi', 'Lahore', 'Multan', 'Quetta'], ['The national flower of Pakistan is:', 'Jasmine', 'Rose', 'Tulip', 'Lotus']],
  Islamiyat: [['How many pillars of Islam are there?', '5', '4', '6', '7'], ['The first revealed surah is:', 'Al-Alaq', 'Al-Fatiha', 'Al-Baqarah', 'Yaseen'], ['The month of fasting is:', 'Ramadan', 'Shawwal', 'Rajab', 'Muharram'], ['How many daily prayers are there?', '5', '3', '4', '6'], ['The Kaaba is in:', 'Makkah', 'Madinah', 'Jerusalem', 'Taif'], ['The last Prophet is:', 'Muhammad (PBUH)', 'Isa (AS)', 'Musa (AS)', 'Ibrahim (AS)'], ['The first Kalima is:', 'Tayyiba', 'Shahadat', 'Tamjeed', 'Tauheed'], ['Zakat is given to:', 'The needy', 'Friends', 'Neighbours only', 'Teachers']],
  Computer: [['CPU stands for:', 'Central Processing Unit', 'Central Program Unit', 'Computer Personal Unit', 'Core Power Unit'], ['Which is an input device?', 'Keyboard', 'Monitor', 'Speaker', 'Printer'], ['Which is an output device?', 'Monitor', 'Mouse', 'Scanner', 'Microphone'], ['The "brain" of the computer is the:', 'CPU', 'RAM', 'Hard disk', 'Mouse'], ['A Word document usually ends with:', '.docx', '.xlsx', '.pptx', '.png'], ['Which software is used to browse the internet?', 'Web browser', 'Compiler', 'Spreadsheet', 'Antivirus'], ['One byte equals how many bits?', '8', '4', '16', '2'], ['The shortcut to copy is:', 'Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + Z']],
  Art: [['The primary colours are:', 'Red, Blue, Yellow', 'Green, Orange, Purple', 'Black, White, Grey', 'Pink, Brown, Green'], ['Blue mixed with yellow gives:', 'Green', 'Orange', 'Purple', 'Brown'], ['Red mixed with yellow gives:', 'Orange', 'Green', 'Purple', 'Pink'], ['A drawing made with a pencil is a:', 'Sketch', 'Sculpture', 'Mosaic', 'Collage'], ['Which is a warm colour?', 'Red', 'Blue', 'Green', 'Purple'], ['Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Picasso', 'Van Gogh', 'Monet'], ['Shaping clay into objects is called:', 'Pottery', 'Weaving', 'Printing', 'Stitching'], ['Which tool is used to paint?', 'Brush', 'Scissors', 'Ruler', 'Compass']]
};
function mathQs(grade, n, seed) {
  const r = R(seed), out = [];
  for (let i = 0; i < n; i++) {
    const hi = grade <= 2 ? 20 : grade <= 4 ? 12 : 30; let a = r.int(2, hi), b = r.int(2, hi), q, ans;
    const op = r.pick(grade <= 2 ? ['+', '-'] : ['+', '-', '×', '÷']);
    if (op === '+') { q = a + ' + ' + b; ans = a + b; } else if (op === '-') { if (b > a) { const t = a; a = b; b = t; } q = a + ' − ' + b; ans = a - b; } else if (op === '×') { b = r.int(2, 12); q = a + ' × ' + b; ans = a * b; } else { b = r.int(2, 12); ans = r.int(2, 12); a = b * ans; q = a + ' ÷ ' + b; }
    const opts = [ans, ans + r.int(1, 4), ans - r.int(1, 4), ans + r.int(5, 9)].map(String);
    out.push(['What is ' + q + '?'].concat(opts));
  }
  return out;
}
// Build quiz questions: [{q, o:[4 options], a:index}], options shuffled deterministically
SP.questionsFor = function (subject, grade, n, seed) {
  const rows = subject === 'Mathematics' ? mathQs(grade, n, seed || 5) : (QB[subject] || QB.Science).slice();
  const base = subject === 'Mathematics' ? rows : rows.map((x, i) => [i, hash01(subject + (seed || 0) + i)]).sort((x, y) => x[1] - y[1]).map(x => rows[x[0]]);
  return base.slice(0, n).map((row, i) => {
    const opts = row.slice(1).map((t, j) => ({ t, ok: j === 0, k: hash01(row[0] + t + (seed || 0)) })).sort((x, y) => x.k - y.k);
    return { q: row[0], o: opts.map(x => x.t), a: opts.findIndex(x => x.ok) };
  });
};

/* ---------- subject notes + resources ---------- */
const TOPICS = {
  English: ['Nouns and pronouns', 'Tenses revision', 'Comprehension skills', 'Letter writing'], Urdu: ['Ism aur zameer', 'Mazmoon nigari', 'Muhavray', 'Nazm — Meri maa'],
  Mathematics: ['Fractions', 'Multiplication tables', 'Geometry basics', 'Word problems'], Science: ['Plants and photosynthesis', 'States of matter', 'The solar system', 'The human body'],
  'Social Studies': ['Provinces of Pakistan', 'Rivers and mountains', 'Our national heroes', 'Map skills'], Islamiyat: ['Pillars of Islam', 'Seerat of the Prophet (PBUH)', 'Duas to memorise', 'Good manners'],
  Computer: ['Parts of a computer', 'Typing practice', 'Intro to MS Word', 'Safe internet use'], Art: ['Colour wheel', 'Sketching basics', 'Pakistani truck art', 'Paper craft']
};
const KINDS = ['pdf', 'ppt', 'doc', 'video', 'pdf', 'link'];
SP.KIND = { pdf: ['PDF', 'file', '#d70015'], ppt: ['Slides', 'chart', '#a55500'], doc: ['Document', 'doc', '#0062c4'], video: ['Video', 'phone', '#6b3fb0'], link: ['Link', 'right', '#248a3d'], img: ['Image', 'star', '#b0245c'] };
const NOTES = [];
CLASSES.forEach((c, ci) => SUBJECTS.forEach((sub, si) => {
  for (let i = 0; i < 2; i++) {
    const t = TOPICS[sub][(c.grade + i + si) % 4], kind = KINDS[(ci + si + i) % KINDS.length];
    NOTES.push({ id: 'NT' + pad(NOTES.length + 1, 4), classId: c.id, subject: sub, title: t + (kind === 'video' ? ' — lesson video' : kind === 'ppt' ? ' — class slides' : ' — notes'), chapter: 'Chapter ' + (i + 1 + (si % 3)), kind, size: kind === 'video' ? (18 + (si * 7 + i * 5) % 40) + ' MB' : kind === 'link' ? '' : (0.4 + ((ci + si + i) % 9) * 0.35).toFixed(1) + ' MB', ts: D.add(TODAY, -(3 + i * 9 + (si + ci) % 6)) + ' 0' + (8 + (si % 2)) + ':30', teacherId: SP.ALLOC[c.id][sub], views: 6 + Math.floor(hash01(c.id + sub + i) * 15) });
  }
}));
SP.NOTES = NOTES; SP.TOPICS = TOPICS;

const RES_CATS = ['Syllabus', 'Date sheets', 'Past papers', 'Worksheets', 'Parent guides', 'Policies & forms', 'Learning links'];
const RES = [
  ['Syllabus 2026–27 — Grades 1–4', 'Syllabus', '', 0, 'pdf', '1.8 MB'], ['Syllabus 2026–27 — Grades 5–8', 'Syllabus', '', 0, 'pdf', '2.1 MB'],
  ['Mid-Term datesheet — Grades 1–4', 'Date sheets', '', 0, 'pdf', '0.3 MB'], ['Mid-Term datesheet — Grades 5–8', 'Date sheets', '', 0, 'pdf', '0.3 MB'],
  ['Mathematics past paper — Unit Test 1', 'Past papers', 'Mathematics', 0, 'pdf', '0.9 MB'], ['Science past paper — Unit Test 1', 'Past papers', 'Science', 0, 'pdf', '1.1 MB'], ['English past paper — Unit Test 1', 'Past papers', 'English', 0, 'pdf', '0.8 MB'],
  ['Times tables practice pack', 'Worksheets', 'Mathematics', 0, 'pdf', '0.6 MB'], ['Grammar worksheets — nouns & verbs', 'Worksheets', 'English', 0, 'pdf', '0.7 MB'], ['Science diagrams to label', 'Worksheets', 'Science', 0, 'pdf', '1.4 MB'],
  ['How to help your child read at home', 'Parent guides', '', 0, 'pdf', '0.5 MB'], ['Exam-week routine and nutrition guide', 'Parent guides', '', 0, 'pdf', '0.4 MB'], ['Screen-time guidelines for children', 'Parent guides', '', 0, 'pdf', '0.4 MB'],
  ['School uniform policy', 'Policies & forms', '', 0, 'pdf', '0.2 MB'], ['Fee & fine policy 2026–27', 'Policies & forms', '', 0, 'pdf', '0.3 MB'], ['Leave application form', 'Policies & forms', '', 0, 'doc', '0.1 MB'], ['Anti-bullying policy', 'Policies & forms', '', 0, 'pdf', '0.3 MB'],
  ['Khan Academy — free maths practice', 'Learning links', 'Mathematics', 0, 'link', ''], ['National Geographic Kids', 'Learning links', 'Science', 0, 'link', ''], ['Oxford Owl — free reading library', 'Learning links', 'English', 0, 'link', '']
].map((r, i) => ({ id: 'RS' + pad(i + 1, 3), title: r[0], cat: r[1], subject: r[2], grade: r[3], kind: r[4], size: r[5], ts: D.add(TODAY, -(4 + i * 3)) + ' 10:00', by: r[1] === 'Parent guides' || r[1] === 'Policies & forms' ? 'Principal\'s office' : 'Academic office', dl: 12 + Math.floor(hash01('rs' + i) * 120) }));
SP.RES_CATS = RES_CATS; SP.RESOURCES = RES;
SP.FILES = ['Lecture_notes.pdf', 'Worksheet_solved.pdf', 'Class_slides.pptx', 'Practice_questions.docx', 'Lesson_recording.mp4', 'Revision_summary.pdf'];

/* ---------- assignments (seeded; submissions are derived unless a real one exists in SP.S.subs) ---------- */
const AT = {
  English: ['Write a paragraph about your hero', 'Comprehension: The Honest Woodcutter', 'Grammar exercise — tenses'], Urdu: ['Mazmoon: Meri pyari school', 'Muhavray likhain aur jumlay banayen', 'Nazm yaad karain'],
  Mathematics: ['Worksheet: fractions', 'Multiplication tables practice', 'Word problems set B'], Science: ['Draw and label a plant', 'States of matter table', 'Solar system model — poster'],
  'Social Studies': ['Map work: provinces of Pakistan', 'Rivers of Pakistan — fact file', 'Biography: Quaid-e-Azam'], Islamiyat: ['Learn Surah Al-Ikhlas with meaning', 'Five pillars — chart', 'Manners at home and school'],
  Computer: ['Typing test screenshots', 'Slide deck about my city', 'Label the parts of a computer'], Art: ['Colour wheel poster', 'Truck art design', 'Pencil shading practice']
};
const ASSIGN = [];
CLASSES.forEach((c, ci) => {
  [[-9, -5, 0], [-3, 1, 1], [-1, 4, 2]].forEach((p, k) => {
    const sub = SUBJECTS[(ci * 3 + k * 3 + c.grade) % SUBJECTS.length];
    ASSIGN.push({ id: 'AS' + pad(ASSIGN.length + 1, 3), classId: c.id, subject: sub, title: AT[sub][k], text: ['Complete this in your notebook neatly and upload a clear photo.', 'Read the instructions in the attached sheet. Show all working.', 'Write in your own words. Copying will lose marks.'][k], posted: D.add(TODAY, p[0]), due: D.add(TODAY, p[1]), total: [10, 20, 25][k], teacherId: SP.ALLOC[c.id][sub], type: ['file', 'both', 'text'][k], attach: k === 1 ? { name: 'Worksheet.pdf', size: '0.4 MB' } : null, graded: k === 0, seeded: true });
  });
});
SP.ASSIGN = ASSIGN;

/* ---------- exams ---------- */
SP.EXAMS = [
  { id: 'E1', name: 'Unit Test 1', period: 'August 2026', total: 50, status: 'published', derived: true },
  { id: 'E2', name: 'Unit Test 2', period: '21–25 September 2026', total: 50, status: 'marking' },
  { id: 'E3', name: 'Mid-Term Examinations', period: '6–14 October 2026', total: 100, status: 'upcoming', from: '2026-10-06', to: '2026-10-14' }
];
SP.grade = p => p >= 90 ? ['A1', 'green'] : p >= 80 ? ['A', 'green'] : p >= 70 ? ['B', 'blue'] : p >= 60 ? ['C', 'blue'] : p >= 50 ? ['D', 'amber'] : p >= 40 ? ['E', 'amber'] : ['F', 'red'];
SP.exam = id => SP.S.exams.find(e => e.id === id);
const BIAS = { English: 0, Urdu: .02, Mathematics: -.06, Science: -.02, 'Social Studies': .03, Islamiyat: .07, Computer: .04, Art: .09 };
// is marking done for this exam/class/subject? (seeded ~78% entered for the in-progress exam)
SP.entered = function (ex, cid, sub) {
  const S = SP.S; if (S.markSaved[ex.id + '|' + cid + '|' + sub]) return true;
  if (ex.status === 'published' || ex.derived) return true; if (ex.status === 'upcoming') return false;
  return hash01(ex.id + cid + sub) < .78;
};
SP.markDerive = (ex, s, sub) => Math.round(ex.total * clamp(s.ability + (hash01(ex.id + s.id + sub) - .5) * .32 + (BIAS[sub] || 0), .3, .99));
SP.markOf = function (ex, s, sub) {
  const S = SP.S, m = S.marks[ex.id] && S.marks[ex.id][s.id] && S.marks[ex.id][s.id][sub]; if (m != null) return m;
  return SP.entered(ex, s.classId, sub) ? SP.markDerive(ex, s, sub) : null;
};
SP.examCard = function (ex, s) {
  const rows = SUBJECTS.map(sub => ({ sub, m: SP.markOf(ex, s, sub) })), got = rows.filter(r => r.m != null), tot = got.reduce((a, r) => a + r.m, 0), max = got.length * ex.total;
  const pc = max ? Math.round(100 * tot / max) : 0; return { rows, tot, max, pct: pc, grade: SP.grade(pc), complete: got.length === rows.length };
};
SP.classRank = function (ex, s) {
  const c = SP.inClass(s.classId).map(x => ({ id: x.id, p: SP.examCard(ex, x).pct })).sort((a, b) => b.p - a.p), i = c.findIndex(x => x.id === s.id); return { pos: i + 1, of: c.length };
};
SP.remark = p => p >= 90 ? 'Outstanding performance. Keep it up!' : p >= 80 ? 'Very good work and consistent effort.' : p >= 70 ? 'Good progress; aim higher with regular revision.' : p >= 60 ? 'Satisfactory. More practice needed in weaker subjects.' : p >= 50 ? 'Needs more focus and daily revision.' : 'Requires close support — please meet the class teacher.';

/* ---------- quizzes: accessor over seeded past quizzes + live/draft quizzes in state ---------- */
SP.allQuizzes = () => SP.QUIZZES.map(q => Object.assign({ status: 'closed', seeded: true, mins: 20 }, q)).concat(SP.S.qz);
SP.quiz = id => SP.allQuizzes().find(q => q.id === id);
SP.attempt = (q, s) => { const a = SP.S.att2[q.id] && SP.S.att2[q.id][s.id]; if (a) return a; if (q.seeded) return { score: SP.quizScore(q, s), of: q.total, seeded: true }; return null; };
SP.quizTotal = q => q.qs ? q.qs.length : q.total;
SP.quizStats = function (q) {
  const studs = SP.inClass(q.classId), rows = studs.map(s => ({ s, a: SP.attempt(q, s) })), done = rows.filter(r => r.a), tot = SP.quizTotal(q);
  const scores = done.map(r => r.a.score); return { n: studs.length, done: done.length, avg: scores.length ? Math.round(100 * scores.reduce((a, b) => a + b, 0) / (scores.length * tot)) : 0, hi: scores.length ? Math.max.apply(null, scores) : 0, lo: scores.length ? Math.min.apply(null, scores) : 0, rows };
};

/* ---------- assignment submissions: real ones from state, derived for the rest of the school ---------- */
SP.isDemoKid = sid => { const s = SP.stu(sid); return !!(s && SP.S.childId && s.parentId === SP.stu(SP.S.childId).parentId); };
SP.sub = function (a, s) {
  const real = SP.S.subs[a.id] && SP.S.subs[a.id][s.id]; if (real) return real;
  if (SP.isDemoKid(s.id) && !a.graded) return null;
  const r = hash01(a.id + s.id), p = .55 + s.ability * .4;
  if (a.graded) { if (r > p) return null; return { status: 'graded', ts: D.add(a.due, -1) + ' 17:' + pad(Math.floor(r * 59)), marks: Math.round(a.total * clamp(s.ability + (hash01(s.id + a.id) - .5) * .3, .35, .98)), fb: '', seeded: true }; }
  if (!a.seeded) return null; // brand-new assignments: only real submissions
  if (r > p * .6) return null;
  return { status: 'submitted', ts: TODAY + ' 0' + (7 + Math.floor(r * 2)) + ':' + pad(Math.floor(r * 599) % 60), marks: null, fb: '', seeded: true };
};
SP.assignStats = function (a) {
  const studs = SP.inClass(a.classId), rows = studs.map(s => ({ s, sub: SP.sub(a, s) })), sub = rows.filter(r => r.sub), gr = sub.filter(r => r.sub.status === 'graded');
  const marks = gr.map(r => r.sub.marks); return { n: studs.length, sub: sub.length, graded: gr.length, missing: studs.length - sub.length, avg: marks.length ? Math.round(100 * marks.reduce((x, y) => x + y, 0) / (marks.length * a.total)) : 0, rows };
};
SP.allAssign = () => SP.ASSIGN.map(a => Object.assign({}, a)).concat(SP.S.assign);
SP.assign = id => SP.allAssign().find(a => a.id === id);
SP.assignState = a => a.closed ? 'closed' : a.due < TODAY ? 'closed' : a.due === TODAY ? 'today' : 'active';

/* ---------- notes accessor ---------- */
SP.allNotes = () => SP.S.notes.concat(SP.NOTES);
SP.allRes = () => SP.S.res.concat(SP.RESOURCES);

/* ---------- calendar events ---------- */
SP.EV_TYPES = { holiday: ['Holiday', 'green'], exam: ['Exam', 'red'], ptm: ['Parent meeting', 'blue'], sports: ['Sports', 'amber'], trip: ['Trip', 'brand'], event: ['School event', 'gray'], deadline: ['Deadline', 'amber'] };
const EV = [
  ['2026-09-21', '2026-09-25', 'Unit Test 2', 'exam', 'all', 'Unit Test 2 for all grades. Results will be published after marking.', '', '08:00'],
  ['2026-10-02', null, 'Science fair — Grades 5 & 6', 'event', 'grade:5,6', 'Project displays in the school hall. Parents welcome from 11 AM.', 'School hall', '09:30'],
  ['2026-10-06', '2026-10-14', 'Mid-Term Examinations', 'exam', 'all', 'Mid-Term exams for all grades. Datesheet available in Resources.', '', '08:00'],
  ['2026-10-09', null, 'Book fair', 'event', 'all', 'Books at 20–40% off. Students visit by class rotation.', 'Library', '10:00'],
  ['2026-10-15', null, 'Annual Sports Day', 'sports', 'all', 'House colours, races, tug of war and the parents\' race. Parents invited from 10 AM.', 'School ground', '10:00', true],
  ['2026-10-22', null, 'Parent–Teacher Meeting', 'ptm', 'all', 'Meet your child\'s teachers and collect the Mid-Term progress report. Please confirm attendance.', 'Classrooms', '09:00', true],
  ['2026-10-30', null, 'Field trip — Lahore Fort', 'trip', 'grade:6,7,8', 'A guided visit to Lahore Fort for Grades 6–8. Signed consent required.', 'Lahore Fort', '08:30', true],
  ['2026-11-09', null, 'Iqbal Day', 'holiday', 'all', 'School closed for Iqbal Day.', '', ''],
  ['2026-11-13', null, 'Career counselling talk', 'event', 'grade:7,8', 'Guest speakers on careers and subject choices.', 'Auditorium', '11:00'],
  ['2026-11-20', null, 'Fee deadline — November', 'deadline', 'all', 'Last date for the November fee without a late fine.', '', ''],
  ['2026-11-28', null, 'Annual Day', 'event', 'all', 'Performances, prize distribution and the principal\'s address. Invitation cards have been sent.', 'School ground', '17:00', true],
  ['2026-12-25', null, 'Quaid-e-Azam Day', 'holiday', 'all', 'School closed.', '', ''],
  ['2026-12-21', '2026-12-31', 'Winter break', 'holiday', 'all', 'Winter vacations. School reopens on 4 January.', '', '']
].map((e, i) => ({ id: 'EV' + pad(i + 1, 2), date: e[0], end: e[1], title: e[2], type: e[3], audience: e[4], desc: e[5], place: e[6], time: e[7], rsvp: !!e[8], seeded: true }));

SP.allEvents = () => SP.S.events.concat(EV).filter(e => !SP.S.evDel[e.id]);
SP.eventOn = function (iso, evs) { return (evs || SP.allEvents()).filter(e => e.date <= iso && iso <= (e.end || e.date)); };
SP.audOk = function (aud, cid) { if (aud === 'all') return true; const c = SP.cls(cid); if (aud.indexOf('grade:') === 0) return aud.slice(6).split(',').indexOf(String(c.grade)) > -1; return aud === cid; };
SP.audLabel = a => a === 'all' ? 'Whole school' : a.indexOf('grade:') === 0 ? 'Grade ' + a.slice(6).replace(/,/g, ', ') : (SP.cls(a) ? SP.cls(a).label : a);
SP.audStudents = a => SP.STUDENTS.filter(s => SP.audOk(a, s.classId));
SP.audParents = a => { const seen = {}, out = []; SP.audStudents(a).forEach(s => { if (!seen[s.parentId]) { seen[s.parentId] = 1; out.push(s); } }); return out; }; // first student per parent
SP.rsvp = (ev, parentId) => (SP.S.rsvps[ev.id] && SP.S.rsvps[ev.id][parentId]) || (ev.seeded && !SP.isDemoParent(parentId) && ev.rsvp ? (hash01(ev.id + parentId) < .58 ? 'yes' : hash01(ev.id + parentId) < .66 ? 'no' : null) : null);
SP.isDemoParent = pid => !!(SP.S.childId && SP.stu(SP.S.childId).parentId === pid);

/* ---------- circulars, consent forms (state seeds) ---------- */
SP.seedCirculars = () => [
  { id: 'CR1', kind: 'invitation', title: 'Invitation: Annual Day 2026', body: 'You are cordially invited to the Annual Day on Saturday, 28 November at 5 PM. Students should report by 3 PM in full uniform.', audience: 'all', ts: D.add(TODAY, -3) + ' 11:00', by: 'Principal', needsAck: false, rsvp: true, eventId: 'EV11', ack: {}, attach: 'Invitation_card.pdf' },
  { id: 'CR2', kind: 'circular', title: 'Mid-Term exam guidelines', body: 'Students must bring their own stationery and admit cards. Mobile phones and smart watches are not allowed in exam halls. Please make sure your child sleeps early during exam week.', audience: 'all', ts: D.add(TODAY, -2) + ' 09:30', by: 'Exam Coordinator', needsAck: true, seededAck: .62, ack: {}, attach: 'Exam_guidelines.pdf' },
  { id: 'CR3', kind: 'circular', title: 'Change in school timings — winter schedule', body: 'From 1 November, school will run from 8:30 AM to 1:30 PM. Bus timings will be adjusted accordingly.', audience: 'all', ts: D.add(TODAY, -6) + ' 12:00', by: 'Vice Principal', needsAck: true, seededAck: .81, ack: {}, attach: null },
  { id: 'CR4', kind: 'circular', title: 'Reminder: uniform and grooming', body: 'Students of Grades 5–8 are reminded to follow the winter uniform policy from 15 October. Sweaters must be plain navy blue.', audience: 'grade:5,6,7,8', ts: D.add(TODAY, -8) + ' 10:15', by: 'Vice Principal', needsAck: false, ack: {}, attach: null }
];
SP.seedForms = () => [
  { id: 'CF1', title: 'Field trip — Lahore Fort', type: 'trip', desc: 'Grades 6–8 will visit Lahore Fort on 30 October. Departure 8:30 AM, return 2 PM. Lunch and transport are provided. Trip fee Rs 800 will be added to the November voucher.', audience: 'grade:6,7,8', deadline: '2026-10-12', ts: D.add(TODAY, -4) + ' 10:00', by: 'Vice Principal', fee: 800, seeded: true },
  { id: 'CF2', title: 'Photo & video release', type: 'photo', desc: 'Permission for the school to use photographs and videos of your child in newsletters, the website and social media. You can withdraw consent at any time.', audience: 'all', deadline: '2026-10-05', ts: D.add(TODAY, -9) + ' 09:00', by: 'Principal\'s office', fee: 0, seeded: true },
  { id: 'CF3', title: 'Sports Day participation & medical fitness', type: 'sports', desc: 'Confirms your child is medically fit to take part in Sports Day races and activities on 15 October. Please mention any allergies or conditions with the class teacher.', audience: 'all', deadline: '2026-10-10', ts: D.add(TODAY, -2) + ' 14:00', by: 'Sports coordinator', fee: 0, seeded: true }
];
SP.consent = function (f, sid) {
  const real = SP.S.consents[f.id] && SP.S.consents[f.id][sid]; if (real) return real;
  if (!f.seeded || SP.isDemoKid(sid)) return null;
  const r = hash01(f.id + sid), p = f.id === 'CF1' ? .5 : f.id === 'CF2' ? .74 : .3; return r < p ? { v: r < p * .93 ? 'yes' : 'no', ts: D.add(TODAY, -Math.floor(r * 6)) + ' 1' + Math.floor(r * 9) + ':10' } : null;
};
SP.consentStats = function (f) {
  const studs = SP.audStudents(f.audience); let yes = 0, no = 0; studs.forEach(s => { const c = SP.consent(f, s.id); if (c) c.v === 'yes' ? yes++ : no++; });
  return { n: studs.length, yes, no, pending: studs.length - yes - no, studs };
};
SP.circStats = function (c) {
  const ps = SP.audParents(c.audience); let ack = 0, yes = 0, no = 0;
  ps.forEach(x => { if (c.ack[x.parentId] || (c.seededAck && hash01(c.id + x.parentId) < c.seededAck && !SP.isDemoParent(x.parentId))) ack++; if (c.kind === 'invitation') { const r = c.rsvpMap && c.rsvpMap[x.parentId] || (!SP.isDemoParent(x.parentId) ? (hash01(c.id + x.parentId) < .6 ? 'yes' : hash01(c.id + x.parentId) < .68 ? 'no' : null) : null); if (r === 'yes') yes++; else if (r === 'no') no++; } });
  return { n: ps.length, ack, yes, no, read: Math.min(ps.length, Math.round(ps.length * (.72 + hash01(c.id) * .2))) };
};
SP.circAcked = (c, pid) => !!(c.ack[pid] || (c.seededAck && hash01(c.id + pid) < c.seededAck && !SP.isDemoParent(pid)));
SP.pendingForms = pid => { const kids = SP.kids(pid); return SP.S.forms.filter(f => kids.some(k => SP.audOk(f.audience, k.classId) && !SP.consent(f, k.id))); };

/* ---------- admissions: documents, entrance test, fee ---------- */
SP.DOCS = [['bform', 'Student B-Form / CRC', true], ['cnic', 'Guardian CNIC copy', true], ['photo', 'Passport photographs (4)', true], ['result', 'Previous result card', false], ['leaving', 'School leaving certificate', false]];
SP.enrichApplicant = function (a, i) {
  const r = hash01('app' + a.id), st = a.stage, adv = ['reviewed', 'interview', 'accepted', 'admitted'].indexOf(st) > -1;
  a.docs = {}; SP.DOCS.forEach((d, j) => { a.docs[d[0]] = adv ? (d[2] || hash01(a.id + j) < .8) : (st === 'new' ? (j < 2 ? hash01(a.id + j) < .6 : false) : (j < 3 && hash01(a.id + j) < .5)); });
  a.test = ['interview', 'accepted', 'admitted'].indexOf(st) > -1 ? { score: Math.round(52 + r * 44), by: 'Exam Coordinator', rating: 3 + Math.floor(r * 3), note: r > .5 ? 'Confident, good vocabulary. Recommended for admission.' : 'Shy at first but answers well. Needs support in maths.' } : null;
  const fee = 5000 + SP.cls(a.grade + 'A').fee;
  a.fee = { amount: fee, issued: !!a.voucherIssued, paid: st === 'admitted', method: st === 'admitted' ? 'Cash' : null, paidOn: st === 'admitted' ? D.add(TODAY, -3) : null, waived: false };
  if (st === 'accepted' && a.voucherIssued && r > .55) { a.fee.paid = true; a.fee.method = 'JazzCash'; a.fee.paidOn = D.add(TODAY, -1); }
  a.section = null; a.note = '';
  return a;
};

/* ---------- visitors (front desk) ---------- */
SP.seedVisitors = () => [
  ['Mr. Imran Butt', 'Parent of Hamza (4B)', 'Meet class teacher', '08:20', '08:55'], ['Ms. Saima Farooq', 'Parent of Anaya (2A)', 'Fee query', '09:05', '09:30'], ['Zeeshan (TCS courier)', 'Courier', 'Deliver parcel to office', '09:40', '09:48'],
  ['Mr. Rashid Aslam', 'Parent of Ali (6B)', 'Collect duplicate result card', '10:02', null], ['Dr. Sara Ahmed', 'Vendor — book fair', 'Meet Vice Principal', '10:10', null]
].map((v, i) => ({ id: 'VS' + (i + 1), name: v[0], who: v[1], purpose: v[2], inn: v[3], out: v[4], pass: 'GP-' + (2400 + i) }));

/* ---------- system status (seeded numbers; a health check re-rolls latencies) ---------- */
SP.SERVICES = [
  ['api', 'Portal API', 'Web & mobile back end', 'cloud', 99.98, 84], ['db', 'Database', 'Primary + replica', 'list', 99.99, 12], ['push', 'Push notifications', 'iOS & Android delivery', 'bell', 99.95, 210],
  ['wa', 'WhatsApp Business', 'Templates & messaging', 'whatsapp', 99.9, 640], ['sms', 'SMS gateway', 'Local operator routes', 'sms', 99.7, 890], ['pay', 'Payment gateway', 'JazzCash · Easypaisa · Raast · Cards', 'card', 99.96, 420],
  ['erp', 'ERPNext sync', 'Invoices & payments', 'doc', 99.9, 310], ['gate', 'Gate readers', '4 of 4 devices online', 'scan', 100, 45], ['files', 'File storage', 'Notes, documents, photos', 'file', 99.99, 95], ['jobs', 'Scheduled jobs', 'Reminders, reports, backups', 'clock', 100, 20]
];
SP.INCIDENTS = [
  { ts: D.add(TODAY, -6) + ' 14:12', sev: 'minor', title: 'SMS gateway — delayed delivery', body: 'Operator route slow for 22 minutes. Traffic automatically switched to the backup route; 41 queued messages were delivered.', dur: '22 min' },
  { ts: D.add(TODAY, -19) + ' 03:40', sev: 'info', title: 'Scheduled maintenance completed', body: 'Database upgrade and index optimisation completed during the maintenance window. No user impact.', dur: '18 min' },
  { ts: D.add(TODAY, -34) + ' 09:05', sev: 'minor', title: 'Payment gateway — intermittent timeouts', body: 'Provider-side timeouts on card payments. Resolved by the provider; 3 payments re-verified automatically.', dur: '14 min' }
];
const _ub = {};
SP.uptimeBar = key => _ub[key] || (_ub[key] = Array.from({ length: 60 }, (_, i) => { const r = hash01(key + i); return r < .0035 ? 'x' : r < .03 ? 'w' : 'o'; }));
})();
(function () {
const SP = window.SP;
SP.evStats = function (ev) { const ps = SP.audParents(ev.audience); let yes = 0, no = 0; ps.forEach(x => { const r = SP.rsvp(ev, x.parentId); if (r === 'yes') yes++; else if (r === 'no') no++; }); return { n: ps.length, yes, no, pending: ps.length - yes - no }; };
})();
