import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, arrayUnion, arrayRemove, collection, getDocs } from "firebase/firestore";

// ==== Firebase Config ====
const firebaseConfig = {
  apiKey: "AIzaSyD5JFl4rzZSDJiWUMuAHlcuQ1rfl9UEKG8",
  authDomain: "bastetaks-f504c.firebaseapp.com",
  projectId: "bastetaks-f504c",
  storageBucket: "bastetaks-f504c.firebasestorage.app",
  messagingSenderId: "797678107422",
  appId: "1:797678107422:web:59ee72846c5911b8e1670f",
  measurementId: "G-P6ZSHWC3S2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUID = null;

// ==== Helper: Show Header ====
function showHeader(show){document.getElementById("header").style.display=show?"flex":"none";}

// ==== Register Page ====
window.registerPage = function(){
  showHeader(false);
  document.getElementById("app").innerHTML = `
  <div class="container"><div class="box">
    <h2 style="text-align:center;">إنشاء حساب جديد</h2>
    <input id="regName" placeholder="الاسم الكامل">
    <input id="regEmail" type="email" placeholder="البريد الإلكتروني">
    <input id="regPass" type="password" placeholder="كلمة المرور">
    <button onclick="registerFirebase()">تسجيل</button>
    <button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
  </div></div>`;
};

// ==== Login Page ====
window.loginPage = function(){
  showHeader(false);
  document.getElementById("app").innerHTML=`
  <div class="container"><div class="box">
    <h2 style="text-align:center;">تسجيل الدخول</h2>
    <input id="loginEmail" type="email" placeholder="البريد الإلكتروني">
    <input id="loginPass" type="password" placeholder="كلمة المرور">
    <button onclick="loginFirebase()">تسجيل الدخول</button>
    <button onclick="registerPage()" style="background:#444;color:white;">إنشاء حساب</button>
  </div></div>`;
};

// ==== Firebase Register ====
window.registerFirebase = async function(){
  let email = document.getElementById("regEmail").value;
  let pass = document.getElementById("regPass").value;
  let name = document.getElementById("regName").value;
  if(!email || !pass || !name){ alert("يرجى ملء جميع الحقول"); return;}
  try{
    const userCredential = await createUserWithEmailAndPassword(auth,email,pass);
    const user = userCredential.user;
    await setDoc(doc(db,"users",user.uid),{
      name:name,email:email,balance:0,tasksCompleted:0,depositRequests:[],withdrawRequests:[]
    });
    currentUID = user.uid;
    homePageFirebase();
  }catch(err){ alert(err.message);}
};

// ==== Firebase Login ====
window.loginFirebase = async function(){
  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;
  try{
    const userCredential = await signInWithEmailAndPassword(auth,email,pass);
    currentUID = userCredential.user.uid;
    homePageFirebase();
  }catch(err){ alert(err.message);}
};

// ==== Home Page with Tasks ====
window.homePageFirebase = async function(){
  if(!currentUID) return loginPage();
  showHeader(true);
  const userDoc = await getDoc(doc(db,"users",currentUID));
  if(!userDoc.exists()) return;
  const data = userDoc.data();
  document.querySelector(".header-left").innerHTML = `TaskMaster Pro | رصيد: ${data.balance}$`;
  let html="";
  let deposit=10; let reward=20;
  for(let i=1;i<=25;i++){
    let locked = i>data.tasksCompleted+1;
    html+=`
    <div class="task ${locked?'locked':''}">
      <i class="fa-solid fa-rocket"></i>
      <div class="task-content">
        <h3>المهمة رقم ${i}</h3>
        <p>الإيداع المطلوب: <b>${deposit}$</b></p>
        <p>الربح عند الإنجاز: <b>${reward}$</b></p>
        <button onclick="openTaskFirebase(${i},${deposit},${reward})" ${locked?'disabled':''}>تنفيذ المهمة</button>
      </div>
    </div>`;
    deposit*=2; reward*=2;
  }
  document.getElementById("app").innerHTML=`<div class="container">${html}</div>`;
};

// ==== Open Task ====
window.openTaskFirebase = function(num,dep,rew){
  document.getElementById("app").innerHTML=`
  <div class="container"><div class="box">
    <h2>المهمة رقم ${num}</h2>
    <p>المطلوب قبل التنفيذ: إيداع ${dep}$</p>
    <p>ربحك بعد الإنجاز: ${rew}$</p>
    <button onclick="completeTaskFirebase(${num},${dep},${rew})">تنفيذ المهمة</button>
    <button class="back-btn" onclick="homePageFirebase()">رجوع</button>
  </div></div>`;
};

// ==== Complete Task ====
window.completeTaskFirebase = async function(num,dep,rew){
  const userRef = doc(db,"users",currentUID);
  const userDoc = await getDoc(userRef);
  const data = userDoc.data();
  if(data.balance < dep){ alert("❌ يجب إيداع المبلغ المطلوب قبل فتح المهمة"); return;}
  if(data.tasksCompleted+1 !== num){ alert("❌ يجب إكمال المهمة السابقة أولاً"); return;}
  await updateDoc(userRef,{
    balance: increment(rew),
    tasksCompleted: increment(1)
  });
  alert("✅ تم تنفيذ المهمة وإضافة الأرباح!");
  homePageFirebase();
};

// ==== Deposit Page ====
window.depositPage = function(){
  document.getElementById("app").innerHTML=`
  <div class="container"><div class="box">
    <h2>إيداع الأموال</h2>
    <p>لإضافة رصيد، يرجى تحويل المبلغ إلى المحفظة التالية:</p>
    <p style="font-weight:bold;">USDT TRC20: <span style="color:#ff416c;">TQi3mspeUBS1Y4NknPu4zZVFiFG2JU5MkX</span></p>
    <input id="depositAmount" type="number" placeholder="المبلغ الذي حولته">
    <input id="depositImage" type="file" accept="image/*">
    <button onclick="submitDepositFirebase()">تقديم طلب الإيداع</button>
    <button class="back-btn" onclick="homePageFirebase()">رجوع</button>
  </div></div>`;
};

// ==== Submit Deposit ====
window.submitDepositFirebase = async function(){
  let amount = parseFloat(document.getElementById("depositAmount").value);
  let image = document.getElementById("depositImage").files[0];
  if(!amount || !image){ alert("❌ يرجى إدخال المبلغ ورفع الصورة"); return;}
  const reader = new FileReader();
  reader.onload = async function(){
    const userRef = doc(db,"users",currentUID);
    await updateDoc(userRef,{depositRequests: arrayUnion({amount,image:reader.result,date:new Date().toLocaleString()})});
    alert("✅ تم إرسال طلب الإيداع");
    homePageFirebase();
  }
  reader.readAsDataURL(image);
};

// ==== Withdraw Page ====
window.withdrawPage = async function(){
  const userRef = doc(db,"users",currentUID);
  const userDoc = await getDoc(userRef);
  const data = userDoc.data();
  if(data.tasksCompleted < 20){ alert("❌ لا يمكن السحب قبل المهمة 20"); return;}
  document.getElementById("app").innerHTML=`
  <div class="container"><div class="box">
    <h2>سحب الأموال</h2>
    <p>رصيدك: ${data.balance}$</p>
    <input id="withdrawWallet" placeholder="أدخل محفظتك">
    <button onclick="submitWithdrawFirebase()">طلب سحب</button>
    <button class="back-btn" onclick="homePageFirebase()">رجوع</button>
  </div></div>`;
};

// ==== Submit Withdraw ====
window.submitWithdrawFirebase = async function(){
  const wallet = document.getElementById("withdrawWallet").value;
  if(!wallet){ alert("❌ يرجى إدخال المحفظة"); return;}
  const userRef = doc(db,"users",currentUID);
  const userDoc = await getDoc(userRef);
  const data = userDoc.data();
  await updateDoc(userRef,{
    withdrawRequests: arrayUnion({wallet,amount:data.balance,date:new Date().toLocaleString()}),
    balance: 0
  });
  alert("✅ تم إرسال طلب السحب");
  homePageFirebase();
};

// ==== Account Page ====
window.accountPage = async function(){
  const userRef = doc(db,"users",currentUID);
  const userDoc = await getDoc(userRef);
  const data = userDoc.data();
  document.getElementById("app").innerHTML=`
  <div class="container"><h2 class="account-title">📄 بيانات الحساب</h2>
    <div class="account-box">
      <p><span class="label">الاسم:</span>${data.name}</p>
      <p><span class="label">البريد الإلكتروني:</span>${data.email}</p>
      <p><span class="label">رصيدك:</span>${data.balance}$</p>
      <p><span class="label">المهام المكتملة:</span>${data.tasksCompleted}</p>
      <button class="back-btn" onclick="homePageFirebase()">رجوع</button>
    </div>
  </div>`;
};

// ==== Logout ====
window.logout = function(){currentUID=null;showHeader(false);loginPage();};

// ==== Admin Panel ====
const adminPassword = "aalmwt10";
window.adminLogin = async function(){
  let pwd = prompt("ادخل كلمة مرور الادمن:");
  if(pwd !== adminPassword){ alert("❌ كلمة مرور خاطئة"); return;}

  const usersSnapshot = await getDocs(collection(db, "users"));
  let requestsHtml = "";

  usersSnapshot.forEach(uDoc => {
    const u = uDoc.data();
    u.depositRequests.forEach((r, i) => {
      requestsHtml += `
      <div class="admin-request">
        <p><b>المستخدم:</b> ${u.name} | ${u.email}</p>
        <p><b>المبلغ:</b> ${r.amount}$ | التاريخ: ${r.date}</p>
        <img src="${r.image}" alt="صورة الإيداع">
        <div style="display:flex;gap:10px;">
          <button onclick="approveDeposit('${uDoc.id}', ${i})">✅ قبول</button>
          <button class="reject" onclick="rejectDeposit('${uDoc.id}', ${i})">❌ رفض</button>
        </div>
      </div>`;
    });
  });

  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="admin-box">
      <h2>طلبات الإيداع</h2>
      ${requestsHtml || "<p>لا توجد طلبات حالياً</p>"}
      <button class="back-btn" onclick="homePageFirebase()">رجوع</button>
    </div>
  </div>`;
};

// ==== Approve Deposit ====
window.approveDeposit = async function(userId, index){
  const userRef = doc(db,"users",userId);
  const userSnap = await getDoc(userRef);
  if(!userSnap.exists()) return;
  const userData = userSnap.data();
  const deposit = userData.depositRequests[index];
  await updateDoc(userRef,{
    balance: increment(deposit.amount),
    depositRequests: arrayRemove(deposit)
  });
  alert("✅ تم إضافة الرصيد للمستخدم");
  adminLogin();
};

// ==== Reject Deposit ====
window.rejectDeposit = async function(userId, index){
  const userRef = doc(db,"users",userId);
  const userSnap = await getDoc(userRef);
  if(!userSnap.exists()) return;
  const userData = userSnap.data();
  const deposit = userData.depositRequests[index];
  await updateDoc(userRef,{
    depositRequests: arrayRemove(deposit)
  });
  alert("❌ تم رفض طلب الإيداع");
  adminLogin();
};

// ==== Init ====
loginPage();
