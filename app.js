// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD5JFl4rzZSDJiWUMuAHlcuQ1rfl9UEKG8",
  authDomain: "bastetaks-f504c.firebaseapp.com",
  projectId: "bastetaks-f504c",
  storageBucket: "bastetaks-f504c.appspot.com",
  messagingSenderId: "797678107422",
  appId: "1:797678107422:web:59ee72846c5911b8e1670f",
  measurementId: "G-P6ZSHWC3S2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
const adminPassword = "aalmwt10";

// ==== Helpers ====
function showHeader(show){document.getElementById("header").style.display = show ? "flex" : "none";}

// ==== تسجيل الدخول / إنشاء حساب ====
function loginPage(){
  showHeader(false);
  document.getElementById("app").innerHTML=`
  <div class="container"><div class="box">
    <h2 style="text-align:center;">تسجيل الدخول</h2>
    <input id="loginEmail" type="email" placeholder="البريد الإلكتروني">
    <input id="loginPass" type="password" placeholder="كلمة المرور">
    <button onclick="login()">تسجيل الدخول</button>
    <button onclick="registerPage()" style="background:#444;color:white;">إنشاء حساب</button>
  </div></div>`;
}

function registerPage(){
  showHeader(false);
  document.getElementById("app").innerHTML=`
  <div class="container"><div class="box">
    <h2 style="text-align:center;">إنشاء حساب جديد</h2>
    <input id="regName" placeholder="الاسم الكامل">
    <input id="regEmail" type="email" placeholder="البريد الإلكتروني">
    <input id="regPass" type="password" placeholder="كلمة المرور">
    <button onclick="register()">تسجيل</button>
    <button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
  </div></div>`;
}

function register(){
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPass").value;
  if(!name || !email || !pass){ alert("يرجى ملء جميع الحقول"); return; }

  auth.createUserWithEmailAndPassword(email, pass)
    .then(cred=>{
      currentUser = {
        uid:cred.user.uid,
        name,
        email,
        balance:0,
        tasksCompleted:0,
        depositRequests:[],
        withdrawRequests:[]
      };
      db.collection("users").doc(cred.user.uid).set(currentUser)
        .then(()=>homePage());
    })
    .catch(err=>alert(err.message));
}

function login(){
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(cred=>{
      db.collection("users").doc(cred.user.uid).get()
        .then(doc=>{
          if(doc.exists){
            currentUser = doc.data();
            homePage();
          }
        });
    })
    .catch(err=>alert(err.message));
}

function logout(){ auth.signOut(); currentUser=null; showHeader(false); loginPage(); }

// ==== صفحة الحساب ====
function accountPage(){
  showHeader(true);
  document.getElementById("app").innerHTML=`
  <div class="container">
    <h2 class="account-title">📄 بيانات الحساب</h2>
    <div class="account-box">
      <p><span class="label">الاسم:</span>${currentUser.name}</p>
      <p><span class="label">البريد الإلكتروني:</span>${currentUser.email}</p>
      <p><span class="label">الرصيد:</span>${currentUser.balance}$</p>
      <p><span class="label">المهام المكتملة:</span>${currentUser.tasksCompleted}</p>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ==== الصفحة الرئيسية + المهام ====
function homePage(){
  showHeader(true);
  const taskRequirements = [10,20,40,80,160,320,640,1280,2560,5120,10240,20480,40960,81920,163840,327680,655360,1310720,2621440,5242880,10485760,20971520,41943040,83886080,167772160];
  const taskRewards = [20,40,80,160,320,640,1280,2560,5120,10240,20480,40960,81920,163840,327680,655360,1310720,2621440,5242880,10485760,20971520,41943040,83886080,167772160];

  let tasksHtml = '';
  for(let i=1;i<=25;i++){
    const requiredDeposit = taskRequirements[i-1];
    const reward = taskRewards[i-1];
    const locked = currentUser.balance < requiredDeposit || currentUser.tasksCompleted+1 < i;
    tasksHtml += `
      <div class="task ${locked?'locked':''}">
        <i class="fa-solid fa-rocket"></i>
        <div class="task-content">
          <h3>المهمة رقم ${i}</h3>
          <p>الإيداع المطلوب: <b>${requiredDeposit}$</b></p>
          <p>الربح عند الإنجاز: <b>${reward}$</b></p>
          <button onclick="openTask(${i},${requiredDeposit},${reward})" ${locked?'disabled':''}>تنفيذ المهمة</button>
        </div>
      </div>`;
  }
  document.getElementById("app").innerHTML=`<div class="container">${tasksHtml}</div>`;
}

// ==== فتح المهمة ====
function openTask(num,dep,rew){
  document.getElementById("app").innerHTML=`
  <div class="container">
    <div class="box">
      <h2>المهمة رقم ${num}</h2>
      <p>المطلوب قبل التنفيذ: إيداع ${dep}$</p>
      <p>ربحك بعد الإنجاز: ${rew}$</p>
      <button onclick="executeTask(${num},${dep},${rew})">تنفيذ المهمة</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ==== تنفيذ المهمة ====
function executeTask(num,required,rew){
  if(currentUser.balance < required){
    alert("❌ يجب شحن المبلغ المطلوب قبل فتح المهمة");
    return;
  }
  if(currentUser.tasksCompleted >= num){
    alert("❌ لقد أنجزت هذه المهمة مسبقًا");
    return;
  }

  currentUser.balance += rew;
  currentUser.tasksCompleted = num;
  db.collection("users").doc(currentUser.uid).set(currentUser)
    .then(()=> {
      alert("✅ تم تنفيذ المهمة وإضافة الربح!");
      homePage();
    });
}

// ==== الايداع ====
function depositPage(){
  document.getElementById("app").innerHTML=`
  <div class="container">
    <div class="box">
      <h2>إيداع الأموال</h2>
      <p>لإضافة رصيد، يرجى تحويل المبلغ إلى المحفظة التالية:</p>
      <p style="font-weight:bold;">USDT TRC20: <span style="color:#ff416c;">TQi3mspeUBS1Y4NknPu4zZVFiFG2JU5MkX</span></p>
      <input id="depositAmount" type="number" placeholder="المبلغ الذي حولته">
      <input id="depositImage" type="file" accept="image/*">
      <button onclick="submitDeposit()">تقديم طلب الإيداع</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

function submitDeposit(){
  const amount = parseFloat(document.getElementById("depositAmount").value);
  const imageFile = document.getElementById("depositImage").files[0];
  if(!amount || !imageFile){ alert("يرجى إدخال المبلغ ورفع الصورة"); return; }

  const reader = new FileReader();
  reader.onload = function(){
    currentUser.depositRequests.push({amount,date:new Date().toLocaleString(),image:reader.result});
    db.collection("users").doc(currentUser.uid).set(currentUser)
      .then(()=>{ alert("✅ تم إرسال طلب الإيداع"); homePage(); });
  }
  reader.readAsDataURL(imageFile);
}

// ==== السحب بعد المهمة 20 ====
function withdrawPage(){
  if(currentUser.tasksCompleted < 20){ alert("❌ لا يمكن السحب قبل إتمام المهمة 20"); return; }
  document.getElementById("app").innerHTML=`
  <div class="container">
    <div class="box">
      <h2>سحب الأموال</h2>
      <p>رصيدك: ${currentUser.balance}$</p>
      <input id="withdrawWallet" placeholder="أدخل محفظتك">
      <button onclick="submitWithdraw()">طلب سحب</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

function submitWithdraw(){
  const wallet = document.getElementById("withdrawWallet").value;
  if(!wallet){ alert("❌ يرجى إدخال المحفظة"); return; }
  currentUser.withdrawRequests.push({wallet,amount:currentUser.balance,date:new Date().toLocaleString()});
  currentUser.balance = 0;
  db.collection("users").doc(currentUser.uid).set(currentUser)
    .then(()=> { alert("✅ تم إرسال طلب السحب"); homePage(); });
}

// ==== لوحة الإدارة ====
function adminLogin(){
  const pwd = prompt("ادخل كلمة مرور الادمن:");
  if(pwd !== adminPassword){ alert("❌ كلمة مرور خاطئة"); return; }

  db.collection("users").get().then(snapshot=>{
    let html = '';
    snapshot.forEach(doc=>{
      const u = doc.data();
      u.depositRequests.forEach((r,i)=>{
        html += `
          <div class="admin-request">
            <p><b>المستخدم:</b> ${u.name} | ${u.email}</p>
            <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${r.date}</p>
            <img src="${r.image}" alt="صورة الإيداع">
            <div style="display:flex;gap:10px;">
              <button onclick="approveDeposit('${u.uid}',${i})">✅ قبول</button>
              <button class="reject" onclick="rejectDeposit('${u.uid}',${i})">❌ رفض</button>
            </div>
          </div>`;
      });
    });
    document.getElementById("app").innerHTML=`<div class="container"><div class="admin-box"><h2>طلبات الإيداع</h2>${html}<button class="back-btn" onclick="homePage()">رجوع</button></div></div>`;
  });
}

function approveDeposit(uid,index){
  db.collection("users").doc(uid).get().then(doc=>{
    const u = doc.data();
    const req = u.depositRequests[index];
    u.balance += req.amount;
    u.depositRequests.splice(index,1);
    db.collection("users").doc(uid).set(u).then(()=>{
      if(currentUser.uid===uid) currentUser = u;
      adminLogin();
    });
  });
}

function rejectDeposit(uid,index){
  db.collection("users").doc(uid).get().then(doc=>{
    const u = doc.data();
    u.depositRequests.splice(index,1);
    db.collection("users").doc(uid).set(u).then(()=>adminLogin());
  });
}

// ==== بدء التطبيق ====
auth.onAuthStateChanged(user=>{
  if(user){
    db.collection("users").doc(user.uid).get().then(doc=>{
      currentUser = doc.data();
      homePage();
    });
  } else {
    loginPage();
  }
});
