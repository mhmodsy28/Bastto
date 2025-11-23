// ==== Firebase Initialization ====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

let currentUser = null;
let adminPassword = "aalmwt10";

// ==== UI Helpers ====
function showHeader(show){
  document.getElementById("header").style.display = show ? "flex" : "none";
}

// ==== Pages ====
function loginPage(){
  showHeader(false);
  document.getElementById("app").innerHTML=`
    <div class="container">
      <div class="box">
        <h2 style="text-align:center;">تسجيل الدخول</h2>
        <input id="loginEmail" type="email" placeholder="البريد الإلكتروني">
        <input id="loginPass" type="password" placeholder="كلمة المرور">
        <button onclick="login()">تسجيل الدخول</button>
        <button onclick="registerPage()" style="background:#444;color:white;">إنشاء حساب</button>
      </div>
    </div>`;
}

function registerPage(){
  showHeader(false);
  document.getElementById("app").innerHTML=`
    <div class="container">
      <div class="box">
        <h2 style="text-align:center;">إنشاء حساب جديد</h2>
        <input id="regName" placeholder="الاسم الكامل">
        <input id="regEmail" type="email" placeholder="البريد الإلكتروني">
        <input id="regPass" type="password" placeholder="كلمة المرور">
        <button onclick="register()">تسجيل</button>
        <button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
      </div>
    </div>`;
}

// ==== Firebase Auth ====
async function register(){
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPass").value;

  if(!name || !email || !pass){ alert("يرجى ملء جميع الحقول"); return; }

  try{
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    await setDoc(doc(db, "users", uid), {
      name: name,
      email: email,
      balance: 0,
      tasksCompleted: 0,
      depositRequests: [],
      withdrawRequests: []
    });
  }catch(err){ alert("خطأ: "+err.message); return; }
}

async function login(){
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;
  try{
    const userCredential = await signInWithEmailAndPassword(auth,email,pass);
    currentUser = userCredential.user;
    homePage();
  }catch(err){ alert("بيانات غير صحيحة"); }
}

// ==== Main Pages ====
onAuthStateChanged(auth, async (user)=>{
  if(user){
    currentUser = user;
    homePage();
  }else{
    loginPage();
  }
});

// ==== Home Page & Tasks ====
async function homePage(){
  showHeader(true);
  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  let tasksHtml = "";
  let depositAmount = 10;
  let reward = 20;
  for(let i=1;i<=25;i++){
    let locked = i > (data.tasksCompleted + 1);
    tasksHtml += `
      <div class="task ${locked?'locked':''}">
        <i class="fa-solid fa-rocket"></i>
        <div class="task-content">
          <h3>المهمة رقم ${i}</h3>
          <p>الإيداع المطلوب: <b>${depositAmount}$</b></p>
          <p>الربح عند الإنجاز: <b>${reward}$</b></p>
          <button onclick="openTask(${i},${depositAmount},${reward})" ${locked?'disabled':''}>تنفيذ المهمة</button>
        </div>
      </div>`;
    depositAmount *= 2; reward *= 2;
  }

  document.getElementById("app").innerHTML = `
    <div class="container">
      <div class="box">
        <h2>مرحبا ${data.name}</h2>
        <p>رصيدك: <b>${data.balance}$</b></p>
      </div>
      ${tasksHtml}
    </div>`;
}

// ==== Task Execution ====
async function openTask(num,dep,rew){
  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  document.getElementById("app").innerHTML=`
    <div class="container">
      <div class="box">
        <h2>المهمة رقم ${num}</h2>
        <p>الإيداع المطلوب: ${dep}$</p>
        <p>الربح بعد الإنجاز: ${rew}$</p>
        <button onclick="completeTask(${num},${dep},${rew})">تنفيذ المهمة</button>
        <button class="back-btn" onclick="homePage()">رجوع</button>
      </div>
    </div>`;
}

async function completeTask(num,dep,rew){
  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  // Check if user deposited enough for this task
  let totalDeposited = 0;
  data.depositRequests.forEach(r=> totalDeposited += r.amount);

  if(totalDeposited < dep){
    alert("❌ يجب إيداع المبلغ المطلوب لتنفيذ هذه المهمة");
    return;
  }

  if(num <= data.tasksCompleted){
    alert("❌ تم تنفيذ المهمة سابقاً");
    return;
  }

  await updateDoc(docRef, {
    balance: data.balance + rew,
    tasksCompleted: num
  });

  alert("✅ تم تنفيذ المهمة!");
  homePage();
}

// ==== Deposit Page ====
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

async function submitDeposit(){
  const amount = parseFloat(document.getElementById("depositAmount").value);
  const imageFile = document.getElementById("depositImage").files[0];
  if(!amount || !imageFile){ alert("يرجى إدخال المبلغ ورفع الصورة"); return; }

  const reader = new FileReader();
  reader.onload = async ()=>{
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    const newRequests = data.depositRequests || [];
    newRequests.push({amount,image:reader.result,date:new Date().toLocaleString()});
    await updateDoc(docRef,{depositRequests:newRequests});
    alert("✅ تم إرسال طلب الإيداع");
    homePage();
  }
  reader.readAsDataURL(imageFile);
}

// ==== Withdraw Page ====
async function withdrawPage(){
  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  if(data.tasksCompleted < 20){ alert("❌ لا يمكن السحب قبل المهمة 20"); return; }

  document.getElementById("app").innerHTML=`
    <div class="container">
      <div class="box">
        <h2>سحب الأموال</h2>
        <p>رصيدك: ${data.balance}$</p>
        <input id="withdrawWallet" placeholder="أدخل محفظتك">
        <button onclick="submitWithdraw()">طلب سحب</button>
        <button class="back-btn" onclick="homePage()">رجوع</button>
      </div>
    </div>`;
}

async function submitWithdraw(){
  const wallet = document.getElementById("withdrawWallet").value;
  if(!wallet){ alert("يرجى إدخال المحفظة"); return; }

  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const withdraws = data.withdrawRequests || [];
  withdraws.push({wallet:wallet,amount:data.balance,date:new Date().toLocaleString()});

  await updateDoc(docRef,{balance:0,withdrawRequests:withdraws});
  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ==== Account Page ====
async function accountPage(){
  showHeader(true);
  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  document.getElementById("app").innerHTML=`
    <div class="container">
      <h2 class="account-title">📄 بيانات الحساب</h2>
      <div class="account-box">
        <p><span class="label">الاسم:</span>${data.name}</p>
        <p><span class="label">البريد الإلكتروني:</span>${data.email}</p>
        <p><span class="label">رصيدك:</span>${data.balance}$</p>
        <p><span class="label">المهام المكتملة:</span>${data.tasksCompleted}</p>
        <button class="back-btn" onclick="homePage()">رجوع</button>
      </div>
    </div>`;
}

// ==== Logout ====
function logout(){
  auth.signOut();
  showHeader(false);
}

// ==== Admin Login (simple prompt) ====
async function adminLogin(){
  const pwd = prompt("ادخل كلمة مرور الادمن:");
  if(pwd !== adminPassword){ alert("كلمة مرور خاطئة"); return; }

  showHeader(false);

  const usersSnapshot = await getDoc(doc(db, "users", currentUser.uid));
  // For simplicity, you can list deposits of all users manually or expand later
  alert("لوحة الإدارة جاهزة (يمكن التوسيع لاحقاً)");
    }
