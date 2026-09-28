(function(){
"use strict";

/* ============================= mobile preview plumbing =============================
   The "Mobile" switcher entry loads this same page again inside an iframe, at real
   phone width, so every @media (max-width) rule applies for real instead of being
   faked with a CSS zoom/scale trick. A "?preview=1" query flag on that iframe's src
   is how the nested instance knows it's the preview copy (separate localStorage
   namespace, and it never offers its own nested "Mobile" entry). */
var IN_MOBILE_PREVIEW = /(^|[?&])preview=1(&|$)/.test(location.search);

/* ============================= seeded rng ============================= */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
var rng = mulberry32(20260928);
function pick(arr){return arr[Math.floor(rng()*arr.length)];}
function int(min,max){return Math.floor(rng()*(max-min+1))+min;}
function chance(p){return rng()<p;}

/* ============================= name pools ============================= */
var BOY_FIRST=["Ahmed","Ali","Hamza","Bilal","Usman","Zain","Hassan","Hussain","Fahad","Danish","Rayyan","Arham","Umar","Talha","Saad","Shayan","Ibrahim","Haris","Faizan","Moiz"];
var GIRL_FIRST=["Ayesha","Fatima","Zainab","Maria","Sana","Hira","Amna","Eman","Areeba","Noor","Laiba","Mahnoor","Sadia","Alishba","Rida","Kinza","Farwa","Anaya","Mishal","Warda"];
var SURNAMES=["Khan","Malik","Sheikh","Butt","Chaudhry","Raza","Javed","Iqbal","Farooq","Aslam","Siddiqui","Qureshi","Abbasi","Hashmi","Bhatti","Awan","Niazi","Rizvi","Baig","Soomro"];
var ADULT_FIRST_M=["Muhammad","Imran","Tariq","Shahid","Naveed","Kamran","Asif","Waqas","Adnan","Zahid","Rashid","Salman","Junaid","Faisal","Shoaib"];
var ADULT_FIRST_F=["Nadia","Farzana","Shazia","Rubina","Samina","Uzma","Naila","Yasmin","Saima","Rukhsana","Tahira","Bushra","Shabana","Asma","Nasreen"];
function fullName(pool){return pick(pool)+" "+pick(SURNAMES);}
function initials(name){return name.split(" ").map(function(w){return w[0];}).slice(0,2).join("");}

/* ============================= school structure ============================= */
var GRADES=[1,2,3,4,5];
var SECTIONS=["A","B"];
var SUBJECTS=["Mathematics","English","Urdu","Science","Social Studies","Art & Craft","Computer Studies","Islamiyat","Physical Education","Music"];
var CLASSES=[]; // {id, label, grade, section, teacherId, feePerMonth}
GRADES.forEach(function(g){SECTIONS.forEach(function(s){CLASSES.push({id:"g"+g+s, label:"Grade "+g+" - "+s, grade:g, section:s, feePerMonth:3000+(g-1)*400});});});

var TEACHERS=CLASSES.map(function(c,i){
  var male=chance(.5);
  var name=fullName(male?ADULT_FIRST_M:ADULT_FIRST_F);
  var t={id:"t"+i, name:name, subject:SUBJECTS[i%SUBJECTS.length], classId:c.id, phone:"03"+int(10,49)+"-"+int(1000000,9999999)};
  c.teacherId=t.id;
  return t;
});

var STAFF_ROLES=["Principal","Vice Principal","Head of Admissions","Accountant","Front Desk Officer","Librarian","IT Support Officer","Exam Coordinator","Facilities Manager","Office Assistant"];
var STAFF=STAFF_ROLES.map(function(role,i){
  var male=chance(.5);
  return {id:"s"+i, name:fullName(male?ADULT_FIRST_M:ADULT_FIRST_F), role:role, phone:"03"+int(10,49)+"-"+int(1000000,9999999)};
});

var STUDENTS=[]; var sid=0;
CLASSES.forEach(function(c){
  for(var i=1;i<=10;i++){
    var girl=chance(.48);
    var sname=fullName(girl?GIRL_FIRST:BOY_FIRST);
    var pMale=chance(.5);
    var pname=fullName(pMale?ADULT_FIRST_M:ADULT_FIRST_F);
    var stu={
      id:"st"+sid, name:sname, gender:girl?"F":"M", classId:c.id, roll:i,
      parentName:pname, parentRel:pMale?"Father":"Mother", parentPhone:"03"+int(10,49)+"-"+int(1000000,9999999)
    };
    STUDENTS.push(stu); sid++;
  }
});

function classOf(id){return CLASSES.find(function(c){return c.id===id;});}
function teacherOf(classId){return TEACHERS.find(function(t){return t.classId===classId;});}
function studentsIn(classId){return STUDENTS.filter(function(s){return s.classId===classId;});}
function studentById(id){return STUDENTS.find(function(s){return s.id===id;});}

/* ============================= fee vouchers (Sept 2026) ============================= */
var VOUCHERS={}; // studentId -> {amount, paid, dueDate, paidOn}
STUDENTS.forEach(function(s){
  var c=classOf(s.classId);
  var paid=chance(.65);
  var due = paid ? "2026-09-10" : (chance(.55) ? "2026-09-10" : "2026-10-05");
  VOUCHERS[s.id]={amount:c.feePerMonth, paid:paid, dueDate:due, paidOn: paid?"2026-09-0"+int(3,9):null, month:"September 2026"};
});

/* ============================= attendance history (past week, seeded) ============================= */
var HIST_DATES=["2026-09-21","2026-09-22","2026-09-23","2026-09-24","2026-09-25"];
var ATT_HISTORY={}; // studentId -> [{date,status}]
STUDENTS.forEach(function(s){
  ATT_HISTORY[s.id]=HIST_DATES.map(function(d){
    var r=rng();
    var status = r<.90?"present": r<.96?"leave":"absent";
    return {date:d, status:status};
  });
});
var TODAY="2026-09-28";

/* ============================= diary + announcements (seeded) ============================= */
var DIARY_SEED_TEXT=[
  "Please bring completed worksheets tomorrow — we'll review them in class.",
  "Reminder: notebooks should be covered and labeled with the student's name.",
  "We started a new chapter today. A short recap will help at home.",
  "Please ensure water bottles are sent daily; the weather is still warm.",
  "Class went well today. A few students need extra practice — see me if you'd like guidance."
];
var DIARY=[]; var did=0;
CLASSES.forEach(function(c){
  var t=teacherOf(c.id);
  [ "2026-09-24","2026-09-26" ].forEach(function(d){
    DIARY.push({id:"d"+did, classId:c.id, teacherId:t.id, date:d, text:pick(DIARY_SEED_TEXT)});
    did++;
  });
});
var ANNOUNCEMENTS=[
  {id:"a0", date:"2026-09-20", title:"Mid-term exams from Oct 6", body:"Mid-term exams begin Monday, October 6. A detailed timetable will follow next week."},
  {id:"a1", date:"2026-09-15", title:"Annual Sports Day — Oct 15", body:"Sports Day is planned for October 15. Students should wear house colours; details to follow."}
];

/* ============================= notifications (parent feed) ============================= */
var NOTIFS=[]; var nid=0;
function pushNotif(studentId, kind, title, body, when){
  NOTIFS.unshift({id:"n"+(nid++), studentId:studentId, kind:kind, title:title, body:body, ts:when||"now", read:false});
}
STUDENTS.forEach(function(s){
  var v=VOUCHERS[s.id];
  pushNotif(s.id,"fee","Fee voucher issued","September fee of Rs "+v.amount.toLocaleString()+" is now due.","Sep 1");
  var hist=ATT_HISTORY[s.id];
  hist.forEach(function(h){
    if(h.status==="absent") pushNotif(s.id,"attendance","Marked absent",s.name+" was marked absent on "+niceDate(h.date)+".",niceDate(h.date));
  });
});
NOTIFS.reverse();

/* ============================= module / feature-flag registry ============================= */
var MODULES=[
  {name:"Admissions & student database", locked:false, icon:"users"},
  {name:"Parent & staff database", locked:false, icon:"users2"},
  {name:"Fee voucher generation & delivery", locked:false, icon:"cash"},
  {name:"Attendance marking", locked:false, icon:"check"},
  {name:"Push notifications", locked:false, icon:"bell"},
  {name:"Daily diary", locked:false, icon:"book"},
  {name:"Quizzes & gradebook", locked:true, icon:"clip"},
  {name:"Online fee payment (card/wallet)", locked:true, icon:"cash"},
  {name:"Settlement reporting", locked:true, icon:"doc"},
  {name:"Extracurricular tracking", locked:true, icon:"megaphone"}
];

/* ============================= utils ============================= */
function fmtPKR(n){return "Rs "+n.toLocaleString();}
function niceDate(iso){
  var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var p=iso.split("-"); return months[+p[1]-1]+" "+ (+p[2]);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function icon(name){
  var I={
    home:'<path d="M3 10l9-7 9 7"/><path d="M5 9v10h14V9"/>',
    users:'<circle cx="9" cy="8" r="3.2"/><path d="M2.5 19a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15 12.5a5.2 5.2 0 0 1 6.5 5"/>',
    cash:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    users2:'<circle cx="8" cy="8" r="3.2"/><path d="M2 19a6 6 0 0 1 12 0"/><rect x="14" y="5" width="7.5" height="14" rx="1.5"/>',
    grid:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    bell:'<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    check:'<path d="M20 6L9 17l-5-5"/>',
    x:'<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    clip:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 10h6M9 14h6"/>',
    chevron:'<path d="M9 6l6 6-6 6"/>',
    megaphone:'<path d="M3 10v4h4l6 4V6l-6 4H3Z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
    doc:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
    rotate:'<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    wand:'<path d="M15 4V2M15 10V8M20 6h2M10 6h2M17.5 3.5l1.4-1.4M17.5 8.5l1.4 1.4M12.5 3.5l-1.4-1.4M4 20l9-9M14.5 8.5l1 1"/>',
    arrLeft:'<path d="M15 6l-6 6 6 6"/>',
    arrRight:'<path d="M9 6l6 6-6 6"/>',
    sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>',
    chevDown:'<path d="M6 9l6 6 6-6"/>',
    phone:'<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
    print:'<path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><path d="M6 14h12v7H6z"/>'
  };
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+(I[name]||"")+'</svg>';
}
/* original mortarboard-and-book monogram — the app's brand mark, reused for the
   topbar, printed vouchers and the favicon so every appearance matches. */
function logoMark(){
  return '<svg viewBox="0 0 24 24" fill="none">'+
    '<path d="M4 8.6 12 5l8 3.6-8 3.6-8-3.6Z" fill="currentColor"/>'+
    '<path d="M7.5 10.6V15c0 .9 2 2 4.5 2s4.5-1.1 4.5-2v-4.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="M19 9.4V14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'+
  '</svg>';
}

/* ============================= state ============================= */
var STORAGE_KEY = IN_MOBILE_PREVIEW ? "sp_demo_v1_preview" : "sp_demo_v1";
function freshState(){
  return {
    role:"admin",
    adminTab:"dashboard",
    teacherId:TEACHERS[0].id,
    teacherTab:"attendance",
    parentStudentId:STUDENTS[0].id,
    parentTab:"home",
    studentTab:"home",
    vouchers: JSON.parse(JSON.stringify(VOUCHERS)),
    todayAttendance: {}, // classId -> {studentId:status}
    diary: JSON.parse(JSON.stringify(DIARY)),
    notifs: JSON.parse(JSON.stringify(NOTIFS)),
    notifSeen: {}
  };
}
var state;
try{
  var raw=localStorage.getItem(STORAGE_KEY);
  state = raw ? JSON.parse(raw) : freshState();
}catch(e){ state = freshState(); }
function save(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }
function resetDemo(){ state = freshState(); save(); tour.active=false; render(); toast("check","Demo data reset.");}

/* ============================= toasts ============================= */
function toast(ic,msg){
  var wrap=document.getElementById("toasts");
  var el=document.createElement("div");
  el.className="toast";
  el.innerHTML='<span class="ic">'+icon(ic)+'</span><span>'+escapeHtml(msg)+'</span>';
  wrap.appendChild(el);
  setTimeout(function(){ el.style.transition="opacity .3s"; el.style.opacity="0"; setTimeout(function(){el.remove();},300); },2600);
}

/* ============================= push notification banner (simulation) ============================= */
function pushBanner(title,body){
  var wrap=document.getElementById("push-root");
  var el=document.createElement("div");
  el.className="push-banner";
  el.innerHTML='<div class="push-ic">'+icon("bell")+'</div>'+
    '<div class="push-body"><div class="push-top"><span class="push-app">School Portal · Preview</span><span class="push-time">now</span></div>'+
    '<div class="push-title">'+escapeHtml(title)+'</div><div class="push-text">'+escapeHtml(body)+'</div></div>';
  wrap.appendChild(el);
  setTimeout(function(){ el.classList.add("leaving"); setTimeout(function(){el.remove();},250); },3400);
}

/* ============================= notification helper ============================= */
function addNotif(studentId,kind,title,body){
  state.notifs.unshift({id:"n"+Date.now()+Math.random(), studentId:studentId, kind:kind, title:title, body:body, ts:"Just now", read:false});
}
function unreadCountFor(studentId){
  return state.notifs.filter(function(n){return n.studentId===studentId && !state.notifSeen[n.id];}).length;
}

/* ============================= modal (bottom sheet) ============================= */
function openModal(html){
  document.getElementById("modal-root").innerHTML =
    '<div class="modal-backdrop" data-close-modal>'+
      '<div class="modal" role="dialog"><div class="drag-handle"></div>'+html+'</div>'+
    '</div>';
  wireCloseModal();
}
function closeModal(){ document.getElementById("modal-root").innerHTML=""; }
// Wires every [data-close-modal] element currently in the DOM. Must be called
// again any time modal-root's HTML is (re)written, since those nodes are new
// and start out with no listeners. A BUTTON (the "x" close button) closes on
// any click including its inner icon's svg/path; a backdrop DIV only closes
// when the click lands on the backdrop itself, not on the modal card it wraps.
function wireCloseModal(){
  document.querySelectorAll("[data-close-modal]").forEach(function(b){
    b.addEventListener("click", function(e){
      if(b.tagName==="BUTTON" || e.target===b) closeModal();
    });
  });
}

/* ============================= activity ring svg ============================= */
function ring(pct, color, size, label){
  size=size||40;
  var r=(size-6)/2, c=2*Math.PI*r;
  pct=Math.max(0,Math.min(100,pct));
  var dash=(pct/100)*c;
  return '<div class="ring-wrap" style="width:'+size+'px;height:'+size+'px;">'+
    '<svg class="ring-svg" viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'">'+
      '<circle class="ring-track" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" stroke-width="4.5"/>'+
      '<circle class="ring-val" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" stroke-width="4.5" stroke="'+color+'" stroke-dasharray="'+dash.toFixed(1)+' '+c.toFixed(1)+'"/>'+
    '</svg></div>';
}

/* ============================= guided demo flows ============================= */
var TOUR_FLOWS=[
  {
    id:"enroll-fee", title:"Look up a student & handle their fee voucher", role:"Admin", icon:"users",
    desc:"Search the student database, open a profile, then settle a fee voucher.",
    steps:[
      {role:"admin", tab:"students", target:"stu-search", text:"Admin ▸ Students. Search finds any student or parent by name instantly."},
      {role:"admin", tab:"students", target:"stu-row-0", text:"Tap a row to open the student's full profile — guardian contact, fee status, attendance."},
      {role:"admin", tab:"fees", target:"fee-mark-paid-0", text:"Admin ▸ Fee vouchers. The moment a parent pays at the office, mark that voucher paid here — the parent app updates immediately."}
    ]
  },
  {
    id:"attendance-notify", title:"Mark today's attendance & notify parents", role:"Teacher", icon:"check",
    desc:"Mark a class present/absent/leave and send the notification in one tap.",
    steps:[
      {role:"teacher", tab:"attendance", target:"attend-seg-0", text:"Teacher ▸ Attendance. Tap P / A / L for each student — today's roster for your homeroom class."},
      {role:"teacher", tab:"attendance", target:"save-attendance", text:"Save & notify parents sends an attendance alert to every parent whose child was marked absent or on leave."}
    ]
  },
  {
    id:"parent-check", title:"A parent checks fees & attendance", role:"Parent", icon:"home",
    desc:"See the app exactly as a guardian would, for one child.",
    steps:[
      {role:"parent", tab:"home", target:"parent-home-card", text:"Parent ▸ Home. A parent's dashboard: this month's fee status and today's attendance, at a glance."},
      {role:"parent", tab:"fees", target:"parent-fee-pass", text:"Parent ▸ Fees. The voucher renders like a wallet pass — clear amount, due date, and status."},
      {role:"parent", tab:"attendance", target:"parent-att-table", text:"Parent ▸ Attendance. The last five school days, plus today, for this child only."}
    ]
  },
  {
    id:"diary-post", title:"Post a daily diary note for a class", role:"Teacher", icon:"book",
    desc:"Send a short note that every parent in the class can see immediately.",
    steps:[
      {role:"teacher", tab:"diary", target:"diary-text", text:"Teacher ▸ Daily diary. Write a short note for the whole class — homework, reminders, how the day went."},
      {role:"teacher", tab:"diary", target:"post-diary", text:"Post to class publishes it instantly and notifies every parent in this class."}
    ]
  },
  {
    id:"modules", title:"See what's live now vs. coming soon", role:"Admin", icon:"grid",
    desc:"An honest look at what's switched on today, and what's still being built.",
    steps:[
      {role:"admin", tab:"modules", target:"module-grid", text:"Admin ▸ Modules. Six modules are live for this school today — turned on and confirmed working."},
      {role:"admin", tab:"modules", target:"module-locked-0", text:"Locked modules are already in progress — built and tested before they're ever switched on for a real school."}
    ]
  }
];
var tour={active:false, flowIdx:0, step:0};

function tourFlow(){ return TOUR_FLOWS[tour.flowIdx]; }
function startTour(idx){
  tour.active=true; tour.flowIdx=idx; tour.step=0;
  applyTourNav();
  closeTourSheet();
  render();
}
function endTour(){ tour.active=false; closeModal(); render(); }
function applyTourNav(){
  closeModal(); // never leave a modal (e.g. a student profile) stranded on top of the next step
  var f=tourFlow(); var st=f.steps[tour.step];
  state.role=st.role;
  if(st.role==="admin") state.adminTab=st.tab;
  if(st.role==="teacher") state.teacherTab=st.tab;
  if(st.role==="parent") state.parentTab=st.tab;
}
function tourNext(){
  var f=tourFlow();
  if(tour.step<f.steps.length-1){ tour.step++; applyTourNav(); render(); }
  else { endTour(); toast("check","Flow complete: "+f.title); }
}
function tourPrev(){
  if(tour.step>0){ tour.step--; applyTourNav(); render(); }
}
function openTourSheet(){
  document.getElementById("modal-root").innerHTML =
    '<div class="modal-backdrop" data-close-modal>'+
      '<div class="modal" role="dialog"><div class="drag-handle"></div>'+
        '<div class="modal-head"><div><h3>Guided demo flows</h3><p style="margin:3px 0 0;color:var(--label3);font-size:12px;">Scripted walkthroughs for a live school demo — real features only.</p></div>'+
        '<button class="btn ghost sm press" data-close-modal>'+icon("x")+'</button></div>'+
        '<div style="margin-top:8px;">'+
          TOUR_FLOWS.map(function(f,i){
            return '<button class="tour-flow press" data-start-tour="'+i+'"><div class="tour-flow-ic">'+icon(f.icon)+'</div>'+
              '<div><div class="tt">'+f.title+'</div><div class="td">'+f.desc+'</div><span class="role-tag">'+f.role+'</span></div></button>';
          }).join("")+
        '</div>'+
      '</div>'+
    '</div>';
  document.querySelectorAll("[data-start-tour]").forEach(function(b){
    b.addEventListener("click", function(){ startTour(+b.getAttribute("data-start-tour")); });
  });
  wireCloseModal();
}
function closeTourSheet(){ closeModal(); }

function renderTourUI(){
  var root=document.getElementById("tour-root");
  if(!tour.active){ root.innerHTML=""; return; }
  var f=tourFlow(); var n=f.steps.length; var st=f.steps[tour.step];
  root.innerHTML =
    '<div class="guide-bar">'+
      '<div class="guide-top"><span class="guide-step">'+f.title+' · Step '+(tour.step+1)+' of '+n+'</span>'+
      '<button class="guide-end" id="tour-end">End</button></div>'+
      '<div class="guide-text">'+escapeHtml(st.text)+'</div>'+
      '<div class="guide-actions">'+
        '<button class="btn sm press" id="tour-prev" '+(tour.step===0?"disabled":"")+'>'+icon("arrLeft")+' Back</button>'+
        '<button class="btn sm primary press" id="tour-next" style="flex:1; justify-content:center;">'+(tour.step===n-1?"Finish":"Next")+' '+icon("arrRight")+'</button>'+
      '</div>'+
      '<div class="guide-progress">'+f.steps.map(function(s,i){return '<span class="'+(i<=tour.step?"done":"")+'"></span>';}).join("")+'</div>'+
    '</div>';
  var endBtn=document.getElementById("tour-end"); if(endBtn) endBtn.addEventListener("click", endTour);
  var prevBtn=document.getElementById("tour-prev"); if(prevBtn) prevBtn.addEventListener("click", tourPrev);
  var nextBtn=document.getElementById("tour-next"); if(nextBtn) nextBtn.addEventListener("click", tourNext);

  if(st.target){
    var el=document.querySelector('[data-tour="'+st.target+'"]');
    if(el){ el.classList.add("tour-glow"); el.scrollIntoView({block:"center", behavior:"smooth"}); }
  }
}

/* ============================= main render dispatch ============================= */
var root=document.getElementById("app");

function render(){
  save();
  root.innerHTML = shellHtml();
  wireGlobal();
  renderTourUI();
  if(state.role==="mobile"){
    var mf=document.getElementById("mobile-preview-frame");
    if(mf && !mf.src) mf.src = "index.html?preview=1";
  }
}

var ROLE_DEFS=[
  {key:"admin", label:"Admin", icon:"grid"},
  {key:"teacher", label:"Teacher", icon:"book"},
  {key:"parent", label:"Parent", icon:"users"},
  {key:"student", label:"Student", icon:"users2"},
  {key:"mobile", label:"Mobile preview", shortLabel:"Mobile", icon:"phone"}
];
function availableRoles(){
  // a mobile-preview instance never offers another nested "Mobile" entry
  return IN_MOBILE_PREVIEW ? ROLE_DEFS.filter(function(r){return r.key!=="mobile";}) : ROLE_DEFS;
}

function shellHtml(){
  var role=state.role;
  var body = role==="mobile"
    ? '<div class="phone-frame-wrap">'+
        '<div class="phone-frame"><div class="notch"></div><iframe id="mobile-preview-frame" title="Mobile preview of School Portal" loading="lazy"></iframe></div>'+
        '<p class="phone-caption">Live, interactive preview at real phone width (390×844) — role and tabs work inside the frame just like on a real device.</p>'+
      '</div>'
    : '<div class="layout">'+
        sidebarHtml()+
        '<div class="main"><div class="view">'+ mainHtml() +'</div></div>'+
      '</div>'+
      tabbarHtml();
  return ''+
  '<div class="topbar">'+
    '<div class="brand"><div class="brand-mark">'+logoMark()+'</div><div><div class="brand-word">School Portal</div></div><span class="brand-tag">Demo · seeded data</span></div>'+
    roleMenuHtml()+
    roleActorPicker()+
  '</div>'+
  body+
  (role==="mobile" ? '' : '<button class="tour-fab press" id="tour-fab" title="Guided demo flows">'+icon("wand")+'</button>');
}
function cap(s){return s[0].toUpperCase()+s.slice(1);}

function roleMenuHtml(){
  var roles=availableRoles();
  var current = roles.find(function(r){return r.key===state.role;}) || roles[0];
  return '<div class="role-menu" id="role-menu">'+
    '<button class="role-menu-btn press" id="role-menu-btn" type="button" aria-haspopup="true">'+
      '<span class="rm-ic">'+icon(current.icon)+'</span><span class="rm-label">'+(current.shortLabel||current.label)+'</span>'+
      '<span class="rm-chev">'+icon("chevDown")+'</span>'+
    '</button>'+
    '<div class="role-menu-panel" id="role-menu-panel" style="display:none;">'+
      roles.map(function(r){
        return '<button class="role-menu-item press '+(r.key===state.role?"active":"")+'" data-role="'+r.key+'" type="button">'+
          '<span class="ic">'+icon(r.icon)+'</span>'+r.label+
          (r.key===state.role?'<span class="rm-check">'+icon("check")+'</span>':'')+
        '</button>';
      }).join("")+
    '</div>'+
  '</div>';
}

function roleActorPicker(){
  if(state.role==="mobile"){
    return '';
  }
  if(state.role==="teacher"){
    return '<div class="actor-pick"><select id="teacher-pick">'+
      TEACHERS.map(function(t){return '<option value="'+t.id+'" '+(t.id===state.teacherId?"selected":"")+'>'+t.name+' — '+classOf(t.classId).label+'</option>';}).join("")+
      '</select></div>';
  }
  if(state.role==="parent"){
    var unread=unreadCountFor(state.parentStudentId);
    return '<div class="actor-pick"><select id="parent-pick">'+
      STUDENTS.map(function(s){return '<option value="'+s.id+'" '+(s.id===state.parentStudentId?"selected":"")+'>'+s.parentName+' ('+s.name+', '+classOf(s.classId).label+')</option>';}).join("")+
      '</select>'+
      '<button class="bell press" id="bell-btn">'+icon("bell")+(unread?'<span class="dot"></span>':'')+'</button>'+
      '</div>';
  }
  if(state.role==="student"){
    return '<div class="actor-pick"><select id="student-pick">'+
      STUDENTS.map(function(s){return '<option value="'+s.id+'" '+(s.id===state.parentStudentId?"selected":"")+'>'+s.name+' ('+classOf(s.classId).label+')</option>';}).join("")+
      '</select></div>';
  }
  return '<div class="actor-pick"><button class="reset-link" id="reset-btn">Reset demo data</button></div>';
}

function sidebarHtml(){
  if(state.role==="admin"){
    return '<div class="sidebar">'+
      navLink("dashboard","home","Dashboard", state.adminTab)+
      navLink("students","users","Students &amp; parents", state.adminTab)+
      navLink("fees","cash","Fee vouchers", state.adminTab)+
      navLink("staff","users2","Staff", state.adminTab)+
      navLink("modules","grid","Modules", state.adminTab)+
    '</div>';
  }
  if(state.role==="teacher"){
    return '<div class="sidebar">'+
      navLink("attendance","check","Attendance", state.teacherTab, "teacherTab")+
      navLink("diary","book","Daily diary", state.teacherTab, "teacherTab")+
      navLink("roster","users","My class", state.teacherTab, "teacherTab")+
    '</div>';
  }
  if(state.role==="student"){
    return '<div class="sidebar">'+
      navLink("home","home","Home", state.studentTab, "studentTab")+
      navLink("attendance","calendar","Attendance", state.studentTab, "studentTab")+
      navLink("fees","cash","Fees", state.studentTab, "studentTab")+
      navLink("diary","book","Diary", state.studentTab, "studentTab")+
    '</div>';
  }
  return '<div class="sidebar">'+
    navLink("home","home","Home", state.parentTab, "parentTab")+
    navLink("fees","cash","Fees", state.parentTab, "parentTab")+
    navLink("attendance","calendar","Attendance", state.parentTab, "parentTab")+
    navLink("notifs","bell","Notifications", state.parentTab, "parentTab")+
  '</div>';
}
function navLink(key,ic,label,current,stateKey){
  stateKey=stateKey||"adminTab";
  var active=current===key;
  return '<button class="side-link press '+(active?"active":"")+'" data-nav="'+stateKey+':'+key+'" data-tour="nav-'+stateKey+'-'+key+'"><span class="ic">'+icon(ic)+'</span>'+label+'</button>';
}
function tabbarHtml(){
  var items;
  if(state.role==="admin") items=[["dashboard","home","Home"],["students","users","Students"],["fees","cash","Fees"],["staff","users2","Staff"],["modules","grid","Modules"]];
  else if(state.role==="teacher") items=[["attendance","check","Attend."],["diary","book","Diary"],["roster","users","Class"]];
  else if(state.role==="student") items=[["home","home","Home"],["attendance","calendar","Attend."],["fees","cash","Fees"],["diary","book","Diary"]];
  else items=[["home","home","Home"],["fees","cash","Fees"],["attendance","calendar","Attend."],["notifs","bell","Alerts"]];
  var stateKey = state.role==="admin"?"adminTab": state.role==="teacher"?"teacherTab": state.role==="student"?"studentTab":"parentTab";
  var current = state[stateKey];
  return '<div class="tabbar">'+items.map(function(it){
    return '<button data-nav="'+stateKey+':'+it[0]+'" class="'+(current===it[0]?"active":"")+'">'+icon(it[1])+'<span>'+it[2]+'</span></button>';
  }).join("")+'</div>';
}

function mainHtml(){
  if(state.role==="admin") return adminMain();
  if(state.role==="teacher") return teacherMain();
  if(state.role==="student") return studentMain();
  return parentMain();
}

/* ============================= ADMIN ============================= */
function adminMain(){
  var t=state.adminTab;
  if(t==="students") return adminStudents();
  if(t==="fees") return adminFees();
  if(t==="staff") return adminStaff();
  if(t==="modules") return adminModules();
  return adminDashboard();
}

function adminDashboard(){
  var totalStudents=STUDENTS.length;
  var totalStaff=TEACHERS.length+STAFF.length;
  var vArr=Object.keys(state.vouchers).map(function(k){return state.vouchers[k];});
  var paidCount=vArr.filter(function(v){return v.paid;}).length;
  var collectedPct=Math.round(paidCount/vArr.length*100);
  var overdue=vArr.filter(function(v){return !v.paid && v.dueDate<TODAY;}).length;
  var markedToday=Object.keys(state.todayAttendance).reduce(function(sum,cid){return sum+Object.keys(state.todayAttendance[cid]).length;},0);
  var presentToday=0;
  Object.keys(state.todayAttendance).forEach(function(cid){var m=state.todayAttendance[cid]; Object.keys(m).forEach(function(sid){if(m[sid]==="present")presentToday++;});});
  var attPct = markedToday? Math.round(presentToday/markedToday*100) : null;

  var recent=recentActivity(6);

  return ''+
  '<div class="main-head"><div><h1>Dashboard</h1><p>Monday, 28 September 2026 · School Portal</p></div></div>'+
  '<div class="grid tiles">'+
    tile("Total students", totalStudents, totalStudents+" across "+CLASSES.length+" sections")+
    tile("Staff", totalStaff, TEACHERS.length+" teachers, "+STAFF.length+" office")+
    tile("Fees collected", collectedPct+"%", overdue+" vouchers overdue", overdue>0?"warn":"up", ring(collectedPct,"var(--green)"))+
    tile("Attendance today", attPct===null? "—" : attPct+"%", markedToday? presentToday+" of "+markedToday+" marked present" : "Not yet marked — see Portal", markedToday?"up":"")+
  '</div>'+
  '<div class="section-title">Recent activity</div>'+
  '<div class="card" style="padding:0 16px;">'+
    (recent.length? recent.map(function(r){return notifRow(r);}).join("") : '<div class="empty">No activity yet — actions from the Portal and Parent app will show up here.</div>')+
  '</div>'+
  '<div class="hero-note" style="margin-top:22px;">'+icon("grid")+'<p><b>How this ties together:</b> generate a fee voucher below, then switch to <b>Parent</b> for that student — the voucher and a push notification are already waiting. Mark attendance from <b>Teacher</b> the same way. Try the <b>guided flows</b> button in the corner for a scripted walkthrough.</p></div>';
}
function tile(k,v,d,cls,ringHtml){
  return '<div class="tile"><div class="top"><div><div class="k">'+k+'</div><div class="v mono">'+v+'</div></div>'+(ringHtml||'')+'</div><div class="d '+(cls||"")+'">'+d+'</div></div>';
}
function recentActivity(n){
  return state.notifs.slice(0,n);
}
function notifDotColor(kind){
  if(kind==="fee") return "var(--orange)";
  if(kind==="attendance") return "var(--red)";
  if(kind==="diary") return "var(--accent)";
  return "var(--green)";
}
function notifRow(n){
  var s=studentById(n.studentId);
  return '<div class="notif-item"><span class="notif-dot" style="background:'+notifDotColor(n.kind)+';"></span>'+
    '<div class="notif-body" style="flex:1;"><div class="t">'+escapeHtml(n.title)+(s?' <span style="color:var(--label3); font-weight:400;">· '+s.name+'</span>':'')+'</div>'+
    '<div class="d">'+escapeHtml(n.body)+'</div><div class="ts">'+escapeHtml(n.ts)+'</div></div></div>';
}

function adminStudents(){
  return ''+
  '<div class="main-head"><div><h1>Students &amp; parents</h1><p>'+STUDENTS.length+' students · one guardian contact each, on file</p></div>'+
    '<button class="btn sm press" id="export-students-btn">'+icon("doc")+' Export CSV</button></div>'+
  '<div class="toolbar">'+
    '<input type="search" id="stu-search" data-tour="stu-search" placeholder="Search by student or parent name…">'+
    '<select id="stu-class-filter"><option value="">All classes</option>'+CLASSES.map(function(c){return '<option value="'+c.id+'">'+c.label+'</option>';}).join("")+'</select>'+
  '</div>'+
  '<div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Roll</th><th>Guardian</th><th>Phone</th><th>Fee status</th></tr></thead>'+
  '<tbody id="stu-tbody">'+studentRows(STUDENTS)+'</tbody></table></div>';
}
function studentRows(list){
  if(!list.length) return '<tr><td colspan="6"><div class="empty">No students match.</div></td></tr>';
  return list.map(function(s,i){
    var c=classOf(s.classId); var v=state.vouchers[s.id];
    return '<tr class="row-btn" data-student="'+s.id+'" '+(i===0?'data-tour="stu-row-0"':'')+'>'+
      '<td><div class="stack"><div class="avatar">'+initials(s.name)+'</div><div class="namewrap"><div class="n">'+s.name+'</div><div class="s">'+(s.gender==="F"?"Female":"Male")+'</div></div></div></td>'+
      '<td>'+c.label+'</td><td class="mono">'+s.roll+'</td>'+
      '<td>'+s.parentName+' <span style="color:var(--label3); font-size:11.5px;">('+s.parentRel+')</span></td>'+
      '<td class="mono">'+s.parentPhone+'</td>'+
      '<td>'+voucherPill(v)+'</td>'+
    '</tr>';
  }).join("");
}
function voucherPill(v){
  if(v.paid) return '<span class="pill good">'+icon("check")+' Paid</span>';
  if(v.dueDate<TODAY) return '<span class="pill bad">Overdue</span>';
  return '<span class="pill warn">Due '+niceDate(v.dueDate)+'</span>';
}

function studentModal(id){
  var s=studentById(id); var c=classOf(s.classId); var v=state.vouchers[id]; var hist=ATT_HISTORY[id];
  var presentN=hist.filter(function(h){return h.status==="present";}).length;
  return '<div class="modal-head"><div><h3>'+s.name+'</h3><p style="margin:2px 0 0; color:var(--label3); font-size:12px;">'+c.label+' · Roll '+s.roll+'</p></div>'+
    '<button class="btn ghost sm press" data-close-modal>'+icon("x")+'</button></div>'+
    '<div class="kv"><span class="k">Guardian</span><span class="v">'+s.parentName+' ('+s.parentRel+')</span></div>'+
    '<div class="kv"><span class="k">Phone</span><span class="v mono">'+s.parentPhone+'</span></div>'+
    '<div class="kv"><span class="k">September fee</span><span class="v">'+fmtPKR(v.amount)+'</span></div>'+
    '<div class="kv"><span class="k">Status</span><span class="v">'+voucherPill(v)+'</span></div>'+
    '<div class="kv"><span class="k">Attendance, last 5 days</span><span class="v">'+presentN+' / '+hist.length+' present</span></div>'+
    '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">'+
      (v.paid? '' : '<button class="btn primary sm press" data-action="markpaid" data-student="'+id+'">Mark voucher paid</button>')+
      '<button class="btn sm press" data-action="view-voucher" data-student="'+id+'">View voucher</button>'+
      '<button class="btn sm press" data-action="resend-voucher" data-student="'+id+'">Resend voucher notice</button>'+
    '</div>';
}

function adminFees(){
  var vArr=STUDENTS.map(function(s){return {s:s, v:state.vouchers[s.id]};});
  var totalDue=vArr.reduce(function(sum,x){return sum+(x.v.paid?0:x.v.amount);},0);
  var totalCollected=vArr.reduce(function(sum,x){return sum+(x.v.paid?x.v.amount:0);},0);
  return ''+
  '<div class="main-head"><div><h1>Fee vouchers</h1><p>September 2026 · '+STUDENTS.length+' vouchers</p></div>'+
    '<div style="display:flex; gap:8px; flex-wrap:wrap;">'+
      '<button class="btn sm press" id="export-fees-btn">'+icon("doc")+' Export CSV</button>'+
      '<button class="btn press" id="gen-all-btn">'+icon("cash")+' Generate next month\'s vouchers</button>'+
    '</div></div>'+
  '<div class="grid tiles" style="grid-template-columns:repeat(3,1fr);">'+
    tile("Collected", fmtPKR(totalCollected), "this month", "up")+
    tile("Outstanding", fmtPKR(totalDue), (vArr.filter(function(x){return !x.v.paid;}).length)+" vouchers unpaid","warn")+
    tile("Classes", CLASSES.length, "5 grades × 2 sections")+
  '</div>'+
  '<div class="toolbar" style="margin-top:22px;">'+
    '<select id="fee-class-filter"><option value="">All classes</option>'+CLASSES.map(function(c){return '<option value="'+c.id+'">'+c.label+'</option>';}).join("")+'</select>'+
    '<select id="fee-status-filter"><option value="">Any status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="overdue">Overdue</option></select>'+
  '</div>'+
  '<div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Amount</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody id="fee-tbody">'+feeRows(STUDENTS)+'</tbody></table></div>';
}
function feeRows(list){
  if(!list.length) return '<tr><td colspan="6"><div class="empty">No vouchers match.</div></td></tr>';
  var unpaidSeen=0;
  return list.map(function(s){
    var v=state.vouchers[s.id]; var c=classOf(s.classId);
    var tourAttr="";
    if(!v.paid && unpaidSeen===0){ tourAttr='data-tour="fee-mark-paid-0"'; unpaidSeen++; }
    return '<tr><td><div class="stack"><div class="avatar">'+initials(s.name)+'</div><div class="namewrap"><div class="n">'+s.name+'</div><div class="s">'+s.parentName+'</div></div></div></td>'+
    '<td>'+c.label+'</td><td class="mono">'+fmtPKR(v.amount)+'</td><td class="mono">'+niceDate(v.dueDate)+'</td>'+
    '<td>'+voucherPill(v)+'</td>'+
    '<td><div style="display:flex; gap:6px; justify-content:flex-end;">'+
      '<button class="btn sm ghost press" data-action="view-voucher" data-student="'+s.id+'">View</button>'+
      (v.paid?'':'<button class="btn sm primary press" '+tourAttr+' data-action="markpaid" data-student="'+s.id+'">Mark paid</button>')+
    '</div></td></tr>';
  }).join("");
}

function adminStaff(){
  return ''+
  '<div class="main-head"><div><h1>Staff</h1><p>'+TEACHERS.length+' teachers · '+STAFF.length+' office staff</p></div></div>'+
  '<div class="section-title">Teachers <span class="cnt">'+TEACHERS.length+'</span><button class="btn sm press" id="export-teachers-btn" style="margin-left:auto;">'+icon("doc")+' Export CSV</button></div>'+
  '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Subject</th><th>Homeroom class</th><th>Phone</th></tr></thead><tbody>'+
  TEACHERS.map(function(t){return '<tr><td><div class="stack"><div class="avatar">'+initials(t.name)+'</div>'+t.name+'</div></td><td>'+t.subject+'</td><td>'+classOf(t.classId).label+'</td><td class="mono">'+t.phone+'</td></tr>';}).join("")+
  '</tbody></table></div>'+
  '<div class="section-title">Office staff <span class="cnt">'+STAFF.length+'</span><button class="btn sm press" id="export-staff-btn" style="margin-left:auto;">'+icon("doc")+' Export CSV</button></div>'+
  '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Phone</th></tr></thead><tbody>'+
  STAFF.map(function(s){return '<tr><td><div class="stack"><div class="avatar">'+initials(s.name)+'</div>'+s.name+'</div></td><td>'+s.role+'</td><td class="mono">'+s.phone+'</td></tr>';}).join("")+
  '</tbody></table></div>';
}

function adminModules(){
  var lockedSeen=0;
  return ''+
  '<div class="main-head"><div><h1>Modules</h1><p>What\'s switched on for this school right now</p></div></div>'+
  '<div class="hero-note">'+icon("lock")+'<p>New features are built, tested against real data, then flipped on one school at a time — never dropped in half-finished. Locked modules below are already in progress.</p></div>'+
  '<div class="module-list" data-tour="module-grid">'+
    MODULES.map(function(m){
      var tourAttr="";
      if(m.locked && lockedSeen===0){ tourAttr='data-tour="module-locked-0"'; lockedSeen++; }
      var toggleHtml = m.locked
        ? '<span class="toggle-tip"><button class="toggle" disabled></button><span class="tip-bubble">Coming after your first month</span></span>'
        : '<button class="toggle on" disabled></button>';
      return '<div class="module-row '+(m.locked?"locked":"")+'" '+tourAttr+'>'+
        '<div class="m-ic">'+icon(m.icon)+'</div>'+
        '<div class="m-text"><h4>'+m.name+'</h4><p>'+(m.locked?"In testing — enabled once verified":"Live for this school")+'</p></div>'+
        '<span class="m-status '+(m.locked?"locked":"live")+'">'+(m.locked?"In testing":"Live")+'</span>'+
        toggleHtml+
      '</div>';
    }).join("")+
  '</div>';
}

/* ============================= TEACHER ============================= */
function teacherMain(){
  var t=state.teacherTab;
  if(t==="diary") return teacherDiary();
  if(t==="roster") return teacherRoster();
  return teacherAttendance();
}
function currentTeacher(){return TEACHERS.find(function(t){return t.id===state.teacherId;});}

function teacherAttendance(){
  var teacher=currentTeacher(); var c=classOf(teacher.classId);
  var roster=studentsIn(c.id);
  var marks=state.todayAttendance[c.id]||{};
  var markedN=Object.keys(marks).length;
  return ''+
  '<div class="main-head"><div><h1>Attendance</h1><p>'+c.label+' · '+niceDate(TODAY)+', today · '+markedN+' of '+roster.length+' marked</p></div>'+
    '<div style="display:flex; gap:8px; flex-wrap:wrap;">'+
      '<button class="btn sm press" id="export-attendance-btn">'+icon("doc")+' Export CSV</button>'+
      '<button class="btn primary press" id="save-attendance" data-tour="save-attendance" '+(markedN? "":"disabled")+'>'+icon("check")+' Save &amp; notify parents</button>'+
    '</div></div>'+
  '<div class="table-wrap"><table><thead><tr><th>Roll</th><th>Student</th><th>Last 5 days</th><th>Today</th></tr></thead><tbody>'+
  roster.map(function(s,i){
    var hist=ATT_HISTORY[s.id];
    var mark=marks[s.id]||"";
    return '<tr><td class="mono">'+s.roll+'</td><td><div class="stack"><div class="avatar">'+initials(s.name)+'</div>'+s.name+'</div></td>'+
    '<td>'+hist.map(function(h){return miniDot(h.status);}).join("")+'</td>'+
    '<td><div class="seg" '+(i===0?'data-tour="attend-seg-0"':'')+' data-attend-seg data-student="'+s.id+'">'+
      '<button data-mark="present" class="'+(mark==="present"?"on":"")+'">P</button>'+
      '<button data-mark="absent" class="'+(mark==="absent"?"on absent":"")+'">A</button>'+
      '<button data-mark="leave" class="'+(mark==="leave"?"on leave":"")+'">L</button>'+
    '</div></td></tr>';
  }).join("")+
  '</tbody></table></div>';
}
function miniDot(status){
  var col = status==="present"?"var(--green)": status==="leave"?"var(--orange)":"var(--red)";
  return '<span title="'+status+'" style="display:inline-block; width:6px; height:6px; border-radius:50%; background:'+col+'; margin-right:3px;"></span>';
}

function teacherRoster(){
  var teacher=currentTeacher(); var c=classOf(teacher.classId); var roster=studentsIn(c.id);
  return ''+
  '<div class="main-head"><div><h1>My class</h1><p>'+c.label+' · '+teacher.subject+' · '+roster.length+' students</p></div></div>'+
  '<div class="table-wrap"><table><thead><tr><th>Roll</th><th>Student</th><th>Guardian</th><th>Phone</th><th>Fee status</th></tr></thead><tbody>'+
  roster.map(function(s){var v=state.vouchers[s.id]; return '<tr><td class="mono">'+s.roll+'</td><td><div class="stack"><div class="avatar">'+initials(s.name)+'</div>'+s.name+'</div></td><td>'+s.parentName+'</td><td class="mono">'+s.parentPhone+'</td><td>'+voucherPill(v)+'</td></tr>';}).join("")+
  '</tbody></table></div>';
}

function teacherDiary(){
  var teacher=currentTeacher(); var c=classOf(teacher.classId);
  var entries=state.diary.filter(function(d){return d.classId===c.id;}).sort(function(a,b){return a.date<b.date?1:-1;});
  return ''+
  '<div class="main-head"><div><h1>Daily diary</h1><p>'+c.label+' · visible to every parent in this class</p></div></div>'+
  '<div class="card" style="margin-bottom:20px;">'+
    '<div class="field-row"><label class="field">New entry</label><textarea id="diary-text" data-tour="diary-text" placeholder="What should parents know about today?"></textarea></div>'+
    '<button class="btn primary press" id="post-diary" data-tour="post-diary">'+icon("book")+' Post to class</button>'+
  '</div>'+
  '<div class="section-title">Recent entries</div>'+
  (entries.length? entries.map(function(d){return '<div class="diary-card"><div class="meta">'+niceDate(d.date)+' · '+teacher.name+'</div><div class="body">'+escapeHtml(d.text)+'</div></div>';}).join(""): '<div class="empty">No entries yet.</div>');
}

/* ============================= PARENT ============================= */
function parentMain(){
  var t=state.parentTab;
  if(t==="fees") return parentFees();
  if(t==="attendance") return parentAttendance();
  if(t==="notifs") return parentNotifs();
  return parentHome();
}
function currentChild(){return studentById(state.parentStudentId);}

function parentHome(){
  var s=currentChild(); var c=classOf(s.classId); var v=state.vouchers[s.id];
  var todayMark=(state.todayAttendance[c.id]||{})[s.id];
  var lastDiary=state.diary.filter(function(d){return d.classId===c.id;}).sort(function(a,b){return a.date<b.date?1:-1;})[0];
  var latestAnn=ANNOUNCEMENTS[0];
  return ''+
  '<div class="main-head"><div><h1>Hi, '+s.parentName.split(" ")[0]+'</h1><p>'+s.name+' · '+c.label+'</p></div></div>'+
  '<div class="grid" style="grid-template-columns:1fr 1fr; gap:1px; border:1px solid var(--sep); border-radius:var(--radius); overflow:hidden;" data-tour="parent-home-card">'+
    '<div class="tile"><div class="k">Fee status</div>'+
      '<div style="margin-top:9px;">'+voucherPill(v)+'</div>'+
      '<div class="mono" style="font-size:21px; font-weight:600; margin-top:9px;">'+fmtPKR(v.amount)+'</div>'+
      (v.paid? '<p style="color:var(--label3); font-size:11.5px; margin:6px 0 0;">Paid '+niceDate(v.paidOn||v.dueDate)+'</p>' : '<button class="btn primary sm press" style="margin-top:10px;" data-action="pay" data-student="'+s.id+'">Pay now</button>')+
    '</div>'+
    '<div class="tile"><div class="k">Today\'s attendance</div>'+
      '<div style="margin-top:9px;">'+(todayMark? attendancePill(todayMark) : '<span class="pill flat">Not marked yet</span>')+'</div>'+
      '<p style="color:var(--label3); font-size:11.5px; margin:11px 0 0;">'+c.label+' · '+teacherOf(c.id).name+'</p>'+
    '</div>'+
  '</div>'+
  '<div class="section-title">Latest from the teacher</div>'+
  (lastDiary? '<div class="diary-card"><div class="meta">'+niceDate(lastDiary.date)+' · '+teacherOf(c.id).name+'</div><div class="body">'+escapeHtml(lastDiary.text)+'</div></div>' : '<div class="empty">Nothing posted yet.</div>')+
  '<div class="section-title">School announcement</div>'+
  '<div class="diary-card"><div class="meta">'+niceDate(latestAnn.date)+'</div><div class="body"><b>'+latestAnn.title+'</b><br>'+latestAnn.body+'</div></div>';
}
function attendancePill(mark){
  if(mark==="present") return '<span class="pill good">Present</span>';
  if(mark==="leave") return '<span class="pill warn">On leave</span>';
  return '<span class="pill bad">Absent</span>';
}

function parentFees(){
  var s=currentChild(); var v=state.vouchers[s.id];
  var hash=0; for(var i=0;i<s.id.length;i++){ hash=(hash*31+s.id.charCodeAt(i))>>>0; }
  var bars=Array.from({length:30}).map(function(_,i){ var h=((hash>>(i%24))&7)*8+18; return '<span style="height:'+h+'%;"></span>'; }).join("");
  return ''+
  '<div class="main-head"><div><h1>Fees</h1><p>'+s.name+'</p></div></div>'+
  '<div class="wallet-pass '+(v.paid?"paid":"")+'" data-tour="parent-fee-pass">'+
    '<div class="wp-row"><span class="wp-label">'+v.month+'</span>'+voucherPill(v)+'</div>'+
    '<div class="wp-amount mono">'+fmtPKR(v.amount)+'</div>'+
    '<div class="wp-meta"><span>Due '+niceDate(v.dueDate)+'</span><span>'+s.name+'</span></div>'+
    '<div class="wp-barcode">'+bars+'</div>'+
  '</div>'+
  '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:16px;">'+
    (v.paid? '' : '<button class="btn primary press" data-action="pay" data-student="'+s.id+'">'+icon("cash")+' Pay '+fmtPKR(v.amount)+'</button>')+
    '<button class="btn press" data-action="view-voucher" data-student="'+s.id+'">'+icon("doc")+' View / print voucher</button>'+
  '</div>'+
  '<div class="hero-note" style="margin-top:18px;">'+icon("lock")+'<p>Card and wallet payments (JazzCash, Easypaisa, Raast) are in testing — this button marks the voucher paid for the demo.</p></div>';
}

/* ============================= STUDENT ============================= */
function studentMain(){
  var t=state.studentTab;
  if(t==="attendance") return studentAttendance();
  if(t==="fees") return studentFees();
  if(t==="diary") return studentDiary();
  return studentHome();
}
function studentHome(){
  var s=currentChild(); var c=classOf(s.classId); var v=state.vouchers[s.id];
  var todayMark=(state.todayAttendance[c.id]||{})[s.id];
  var lastDiary=state.diary.filter(function(d){return d.classId===c.id;}).sort(function(a,b){return a.date<b.date?1:-1;})[0];
  var latestAnn=ANNOUNCEMENTS[0];
  return ''+
  '<div class="main-head"><div><h1>Hi, '+s.name.split(" ")[0]+'</h1><p>'+c.label+' · Roll '+s.roll+'</p></div></div>'+
  '<div class="grid" style="grid-template-columns:1fr 1fr; gap:1px; border:1px solid var(--sep); border-radius:var(--radius); overflow:hidden;">'+
    '<div class="tile"><div class="k">Fee status</div><div style="margin-top:9px;">'+voucherPill(v)+'</div>'+
      '<p style="color:var(--label3); font-size:11.5px; margin:9px 0 0;">'+v.month+' · '+fmtPKR(v.amount)+'</p>'+
    '</div>'+
    '<div class="tile"><div class="k">Today\'s attendance</div><div style="margin-top:9px;">'+(todayMark? attendancePill(todayMark) : '<span class="pill flat">Not marked yet</span>')+'</div>'+
      '<p style="color:var(--label3); font-size:11.5px; margin:11px 0 0;">'+c.label+' · '+teacherOf(c.id).name+'</p>'+
    '</div>'+
  '</div>'+
  '<div class="section-title">Latest from your teacher</div>'+
  (lastDiary? '<div class="diary-card"><div class="meta">'+niceDate(lastDiary.date)+' · '+teacherOf(c.id).name+'</div><div class="body">'+escapeHtml(lastDiary.text)+'</div></div>' : '<div class="empty">Nothing posted yet.</div>')+
  '<div class="section-title">School announcement</div>'+
  '<div class="diary-card"><div class="meta">'+niceDate(latestAnn.date)+'</div><div class="body"><b>'+latestAnn.title+'</b><br>'+latestAnn.body+'</div></div>';
}
function studentAttendance(){
  var s=currentChild(); var c=classOf(s.classId); var hist=ATT_HISTORY[s.id].slice().reverse();
  var todayMark=(state.todayAttendance[c.id]||{})[s.id];
  return ''+
  '<div class="main-head"><div><h1>My attendance</h1><p>'+s.name+' · '+c.label+'</p></div></div>'+
  '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>'+
    '<tr><td>'+niceDate(TODAY)+' <span style="color:var(--label3); font-size:11.5px;">(today)</span></td><td>'+(todayMark?attendancePill(todayMark):'<span class="pill flat">Not marked yet</span>')+'</td></tr>'+
    hist.map(function(h){return '<tr><td>'+niceDate(h.date)+'</td><td>'+attendancePill(h.status)+'</td></tr>';}).join("")+
  '</tbody></table></div>';
}
function studentFees(){
  var s=currentChild(); var v=state.vouchers[s.id];
  return ''+
  '<div class="main-head"><div><h1>Fees</h1><p>'+s.name+'</p></div></div>'+
  '<div class="card">'+
    '<div class="kv"><span class="k">'+v.month+'</span>'+voucherPill(v)+'</div>'+
    '<div class="kv"><span class="k">Amount</span><span class="v mono">'+fmtPKR(v.amount)+'</span></div>'+
    '<div class="kv"><span class="k">Due date</span><span class="v">'+niceDate(v.dueDate)+'</span></div>'+
    '<div style="margin-top:14px;"><button class="btn press" data-action="view-voucher" data-student="'+s.id+'">'+icon("doc")+' View / print voucher</button></div>'+
  '</div>';
}
function studentDiary(){
  var s=currentChild(); var c=classOf(s.classId);
  var entries=state.diary.filter(function(d){return d.classId===c.id;}).sort(function(a,b){return a.date<b.date?1:-1;});
  return ''+
  '<div class="main-head"><div><h1>Diary</h1><p>'+c.label+' · notes from '+teacherOf(c.id).name+'</p></div></div>'+
  (entries.length? entries.map(function(d){return '<div class="diary-card"><div class="meta">'+niceDate(d.date)+' · '+teacherOf(c.id).name+'</div><div class="body">'+escapeHtml(d.text)+'</div></div>';}).join(""): '<div class="empty">No entries yet.</div>');
}

/* ============================= fee voucher document (printable) ============================= */
function voucherDocHtml(studentId){
  var s=studentById(studentId); var c=classOf(s.classId); var v=state.vouchers[studentId];
  var tuition=Math.round(v.amount*0.8);
  var fund=Math.round(v.amount*0.12);
  var misc=v.amount-tuition-fund;
  var ref="SP-"+c.grade+c.section+"-"+(s.roll<10?"0"+s.roll:s.roll)+"-0926";
  function half(tag){
    return '<div class="vd-half">'+
      '<div class="vd-tag">'+tag+'</div>'+
      '<div class="vd-school"><div class="brand-mark">'+logoMark()+'</div><div><b>School Portal</b><span>Fee voucher · '+v.month+'</span></div></div>'+
      '<div class="kv"><span class="k">Student</span><span class="v">'+s.name+'</span></div>'+
      '<div class="kv"><span class="k">Class / Roll</span><span class="v">'+c.label+' · '+s.roll+'</span></div>'+
      '<div class="kv"><span class="k">Guardian</span><span class="v">'+s.parentName+'</span></div>'+
      '<div class="kv"><span class="k">Reference</span><span class="v mono">'+ref+'</span></div>'+
      '<table><tbody>'+
        '<tr><td>Tuition fee</td><td class="mono" style="text-align:right;">'+fmtPKR(tuition)+'</td></tr>'+
        '<tr><td>Development fund</td><td class="mono" style="text-align:right;">'+fmtPKR(fund)+'</td></tr>'+
        '<tr><td>Miscellaneous</td><td class="mono" style="text-align:right;">'+fmtPKR(misc)+'</td></tr>'+
        '<tr class="vd-total"><td>Total payable</td><td class="mono" style="text-align:right;">'+fmtPKR(v.amount)+'</td></tr>'+
      '</tbody></table>'+
      '<div class="kv"><span class="k">Due date</span><span class="v">'+niceDate(v.dueDate)+'</span></div>'+
      '<div class="kv" style="border-bottom:none;"><span class="k">Status</span>'+voucherPill(v)+'</div>'+
    '</div>';
  }
  return '<div class="modal-head"><div><h3>Fee voucher</h3><p style="margin:2px 0 0; color:var(--label3); font-size:12px;">'+s.name+' · '+v.month+'</p></div>'+
    '<button class="btn ghost sm press no-print" data-close-modal>'+icon("x")+'</button></div>'+
    '<div class="voucher-doc" style="margin-top:10px;">'+half("Bank Copy")+half("School Copy")+'</div>'+
    '<div class="no-print" style="display:flex; gap:8px; margin-top:4px;">'+
      '<button class="btn primary press" id="voucher-print-btn">'+icon("print")+' Print voucher</button>'+
    '</div>';
}

function parentAttendance(){
  var s=currentChild(); var c=classOf(s.classId); var hist=ATT_HISTORY[s.id].slice().reverse();
  var todayMark=(state.todayAttendance[c.id]||{})[s.id];
  return ''+
  '<div class="main-head"><div><h1>Attendance</h1><p>'+s.name+' · '+c.label+'</p></div></div>'+
  '<div class="table-wrap" data-tour="parent-att-table"><table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>'+
    '<tr><td>'+niceDate(TODAY)+' <span style="color:var(--label3); font-size:11.5px;">(today)</span></td><td>'+(todayMark?attendancePill(todayMark):'<span class="pill flat">Not marked yet</span>')+'</td></tr>'+
    hist.map(function(h){return '<tr><td>'+niceDate(h.date)+'</td><td>'+attendancePill(h.status)+'</td></tr>';}).join("")+
  '</tbody></table></div>';
}

function parentNotifs(){
  var s=currentChild();
  var mine=state.notifs.filter(function(n){return n.studentId===s.id;});
  mine.forEach(function(n){state.notifSeen[n.id]=true;});
  return ''+
  '<div class="main-head"><div><h1>Notifications</h1><p>'+s.name+'</p></div></div>'+
  '<div class="card" style="padding:0 16px;">'+
    (mine.length? mine.map(function(n){return notifRow(n);}).join("") : '<div class="empty">No notifications yet.</div>')+
  '</div>';
}

/* ============================= CSV export ============================= */
function csvEscape(v){
  v=String(v==null?"":v);
  if(/[",\n]/.test(v)) v='"'+v.replace(/"/g,'""')+'"';
  return v;
}
function downloadCSV(filename, headers, rows){
  var lines=[headers.map(csvEscape).join(",")].concat(rows.map(function(r){return r.map(csvEscape).join(",");}));
  var csvText=lines.join("\r\n");
  function fallbackSave(){
    // Used outside the claude.ai artifact viewer (e.g. opened as a plain local file),
    // where the platform's downloads capability isn't present.
    var blob=new Blob([csvText], {type:"text/csv;charset=utf-8;"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); },150);
    toast("check","Downloaded "+filename);
  }
  if(window.claude && window.claude.use){
    window.claude.use("downloads").then(function(d){
      if(!d){ fallbackSave(); return; }
      d.save({filename:filename, data:csvText}).then(function(){
        toast("check","Downloaded "+filename);
      }).catch(function(err){
        if(err && err.code==="declined") return; // viewer said no — don't nag with a fallback
        fallbackSave();
      });
    }).catch(fallbackSave);
  } else {
    fallbackSave();
  }
}

/* ============================= wiring ============================= */
// role-menu open/close is wired once, outside render(), so it survives every
// re-render without stacking duplicate document-level listeners.
document.addEventListener("click", function(e){
  var menu=document.getElementById("role-menu");
  var panel=document.getElementById("role-menu-panel");
  if(!menu || !panel) return;
  var btn=document.getElementById("role-menu-btn");
  if(btn && btn.contains(e.target)){
    var willOpen = panel.style.display==="none";
    panel.style.display = willOpen ? "block" : "none";
    menu.classList.toggle("open", willOpen);
    return;
  }
  if(!menu.contains(e.target)){
    panel.style.display="none";
    menu.classList.remove("open");
  }
});

function wireGlobal(){
  root.querySelectorAll("[data-role]").forEach(function(b){
    b.addEventListener("click", function(){ state.role=b.getAttribute("data-role"); render(); });
  });
  root.querySelectorAll("[data-nav]").forEach(function(b){
    b.addEventListener("click", function(){
      var parts=b.getAttribute("data-nav").split(":");
      state[parts[0]]=parts[1]; render();
    });
  });
  var resetBtn=document.getElementById("reset-btn");
  if(resetBtn) resetBtn.addEventListener("click", function(){ resetDemo(); });

  var teacherPick=document.getElementById("teacher-pick");
  if(teacherPick) teacherPick.addEventListener("change", function(){ state.teacherId=teacherPick.value; render(); });

  var parentPick=document.getElementById("parent-pick");
  if(parentPick) parentPick.addEventListener("change", function(){ state.parentStudentId=parentPick.value; render(); });

  var studentPick=document.getElementById("student-pick");
  if(studentPick) studentPick.addEventListener("change", function(){ state.parentStudentId=studentPick.value; render(); });

  var bellBtn=document.getElementById("bell-btn");
  if(bellBtn) bellBtn.addEventListener("click", function(){ state.parentTab="notifs"; render(); });

  var tourFab=document.getElementById("tour-fab");
  if(tourFab) tourFab.addEventListener("click", function(){ openTourSheet(); });

  // student search / filter (admin students tab)
  var stuSearch=document.getElementById("stu-search");
  var stuFilter=document.getElementById("stu-class-filter");
  function applyStudentFilter(){
    var q=(stuSearch&&stuSearch.value||"").toLowerCase();
    var cid=(stuFilter&&stuFilter.value)||"";
    var list=STUDENTS.filter(function(s){
      var matchesQ = !q || s.name.toLowerCase().indexOf(q)>-1 || s.parentName.toLowerCase().indexOf(q)>-1;
      var matchesC = !cid || s.classId===cid;
      return matchesQ && matchesC;
    });
    document.getElementById("stu-tbody").innerHTML=studentRows(list);
    wireRows();
  }
  if(stuSearch) stuSearch.addEventListener("input", applyStudentFilter);
  if(stuFilter) stuFilter.addEventListener("change", applyStudentFilter);

  // fee filters
  var feeClass=document.getElementById("fee-class-filter");
  var feeStatus=document.getElementById("fee-status-filter");
  function applyFeeFilter(){
    var cid=(feeClass&&feeClass.value)||""; var st=(feeStatus&&feeStatus.value)||"";
    var list=STUDENTS.filter(function(s){
      if(cid && s.classId!==cid) return false;
      var v=state.vouchers[s.id];
      if(st==="paid" && !v.paid) return false;
      if(st==="unpaid" && v.paid) return false;
      if(st==="overdue" && !(!v.paid && v.dueDate<TODAY)) return false;
      return true;
    });
    document.getElementById("fee-tbody").innerHTML=feeRows(list);
    wireActions();
  }
  if(feeClass) feeClass.addEventListener("change", applyFeeFilter);
  if(feeStatus) feeStatus.addEventListener("change", applyFeeFilter);

  // CSV exports — each reads the toolbar's current filter state, so the export matches what's on screen
  var expStudents=document.getElementById("export-students-btn");
  if(expStudents) expStudents.addEventListener("click", function(){
    var q=(stuSearch&&stuSearch.value||"").toLowerCase();
    var cid=(stuFilter&&stuFilter.value)||"";
    var list=STUDENTS.filter(function(s){
      var matchesQ = !q || s.name.toLowerCase().indexOf(q)>-1 || s.parentName.toLowerCase().indexOf(q)>-1;
      var matchesC = !cid || s.classId===cid;
      return matchesQ && matchesC;
    });
    var rows=list.map(function(s){
      var c=classOf(s.classId); var v=state.vouchers[s.id];
      return [s.name, c.label, s.roll, s.parentName, s.parentRel, s.parentPhone, v.paid?"Paid":(v.dueDate<TODAY?"Overdue":"Due "+v.dueDate)];
    });
    downloadCSV("students.csv", ["Student","Class","Roll","Guardian","Relation","Phone","Fee status"], rows);
  });

  var expFees=document.getElementById("export-fees-btn");
  if(expFees) expFees.addEventListener("click", function(){
    var cid=(feeClass&&feeClass.value)||""; var st=(feeStatus&&feeStatus.value)||"";
    var list=STUDENTS.filter(function(s){
      if(cid && s.classId!==cid) return false;
      var v=state.vouchers[s.id];
      if(st==="paid" && !v.paid) return false;
      if(st==="unpaid" && v.paid) return false;
      if(st==="overdue" && !(!v.paid && v.dueDate<TODAY)) return false;
      return true;
    });
    var rows=list.map(function(s){
      var c=classOf(s.classId); var v=state.vouchers[s.id];
      return [s.name, c.label, v.amount, v.dueDate, v.paid?"Paid":(v.dueDate<TODAY?"Overdue":"Unpaid")];
    });
    downloadCSV("fee-vouchers.csv", ["Student","Class","Amount (PKR)","Due date","Status"], rows);
  });

  var expTeachers=document.getElementById("export-teachers-btn");
  if(expTeachers) expTeachers.addEventListener("click", function(){
    var rows=TEACHERS.map(function(t){return [t.name, t.subject, classOf(t.classId).label, t.phone];});
    downloadCSV("teachers.csv", ["Name","Subject","Homeroom class","Phone"], rows);
  });

  var expStaff=document.getElementById("export-staff-btn");
  if(expStaff) expStaff.addEventListener("click", function(){
    var rows=STAFF.map(function(s){return [s.name, s.role, s.phone];});
    downloadCSV("office-staff.csv", ["Name","Role","Phone"], rows);
  });

  var expAttendance=document.getElementById("export-attendance-btn");
  if(expAttendance) expAttendance.addEventListener("click", function(){
    var teacher=currentTeacher(); var c=classOf(teacher.classId); var roster=studentsIn(c.id);
    var marks=state.todayAttendance[c.id]||{};
    var rows=roster.map(function(s){return [s.roll, s.name, marks[s.id]||"Not marked"];});
    downloadCSV("attendance-"+c.label.replace(/\s+/g,"-")+".csv", ["Roll","Student","Today's status"], rows);
  });

  var genAll=document.getElementById("gen-all-btn");
  if(genAll) genAll.addEventListener("click", function(){
    toast("cash", "October vouchers generated for all "+STUDENTS.length+" students.");
  });

  var saveAtt=document.getElementById("save-attendance");
  if(saveAtt) saveAtt.addEventListener("click", function(){
    var teacher=currentTeacher(); var c=classOf(teacher.classId);
    var marks=state.todayAttendance[c.id]||{};
    var absentN=0;
    Object.keys(marks).forEach(function(sid){
      if(marks[sid]==="absent"){ absentN++; addNotif(sid,"attendance","Marked absent", studentById(sid).name+" was marked absent today.", "Just now"); }
      if(marks[sid]==="leave"){ addNotif(sid,"attendance","On leave", studentById(sid).name+" was marked on leave today.", "Just now"); }
    });
    save();
    toast("check","Attendance saved. "+absentN+" parent"+(absentN===1?"":"s")+" notified.");
    if(absentN>0) pushBanner("Attendance update", absentN+" parent"+(absentN===1?"":"s")+" just received an absence notification.");
    if(tour.active) tourNext(); else render();
  });

  var postDiary=document.getElementById("post-diary");
  if(postDiary) postDiary.addEventListener("click", function(){
    var ta=document.getElementById("diary-text");
    var text=ta.value.trim();
    if(!text){ toast("x","Write something first."); return; }
    var teacher=currentTeacher();
    state.diary.unshift({id:"d"+Date.now(), classId:teacher.classId, teacherId:teacher.id, date:TODAY, text:text});
    studentsIn(teacher.classId).forEach(function(s){ addNotif(s.id,"diary","New diary entry", teacher.name+" posted a note for "+classOf(teacher.classId).label+".", "Just now"); });
    save();
    toast("book","Posted to "+classOf(teacher.classId).label+".");
    pushBanner("New diary entry", teacher.name+" posted a note for "+classOf(teacher.classId).label+".");
    if(tour.active) tourNext(); else render();
  });

  wireRows();
  wireActions();
  wireAttendanceSeg();
  wireCloseModal();
}

function wireRows(){
  document.querySelectorAll("[data-student].row-btn").forEach(function(tr){
    tr.addEventListener("click", function(){ openModal(studentModal(tr.getAttribute("data-student"))); wireModalActions(); });
  });
}
function wireModalActions(){ wireActions(); }

function wireActions(){
  document.querySelectorAll('[data-action="markpaid"]').forEach(function(b){
    b.addEventListener("click", function(e){
      e.stopPropagation();
      var sid=b.getAttribute("data-student");
      state.vouchers[sid].paid=true; state.vouchers[sid].paidOn=TODAY;
      addNotif(sid,"fee","Payment received","Thank you — the September fee has been marked paid.","Just now");
      save(); closeModal();
      toast("check","Voucher marked paid.");
      pushBanner("Payment received", studentById(sid).name+"'s September fee has been marked paid.");
      if(tour.active) tourNext(); else render();
    });
  });
  document.querySelectorAll('[data-action="view-voucher"]').forEach(function(b){
    b.addEventListener("click", function(e){
      e.stopPropagation();
      var sid=b.getAttribute("data-student");
      openModal(voucherDocHtml(sid));
      wireModalActions();
      var printBtn=document.getElementById("voucher-print-btn");
      if(printBtn) printBtn.addEventListener("click", function(){ window.print(); });
    });
  });
  document.querySelectorAll('[data-action="resend-voucher"]').forEach(function(b){
    b.addEventListener("click", function(e){
      e.stopPropagation();
      var sid=b.getAttribute("data-student");
      addNotif(sid,"fee","Fee voucher resent","A reminder for the September fee was sent again.","Just now");
      save(); toast("cash","Voucher notice resent.");
      pushBanner("Voucher notice resent", "A reminder was sent to "+studentById(sid).parentName+".");
    });
  });
  document.querySelectorAll('[data-action="pay"]').forEach(function(b){
    b.addEventListener("click", function(e){
      e.stopPropagation();
      var sid=b.getAttribute("data-student");
      state.vouchers[sid].paid=true; state.vouchers[sid].paidOn=TODAY;
      save(); render(); toast("check","Payment recorded. Thank you!");
    });
  });
}

function wireAttendanceSeg(){
  document.querySelectorAll("[data-attend-seg]").forEach(function(seg){
    seg.querySelectorAll("button").forEach(function(b){
      b.addEventListener("click", function(){
        var sid=seg.getAttribute("data-student");
        var teacher=currentTeacher(); var cid=teacher.classId;
        state.todayAttendance[cid]=state.todayAttendance[cid]||{};
        state.todayAttendance[cid][sid]=b.getAttribute("data-mark");
        save(); render();
      });
    });
  });
}

/* ============================= boot ============================= */
function start(){ render(); }
if(window.claude && window.claude.hot){
  window.claude.hot.ready ? window.claude.hot.ready(start) : start();
} else {
  start();
}
})();
