// ======== Firebase Aliases ========
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let userData = null;

// ======== Helper ========
function showHeader(show){
  document.getElementById("header").style.display = show ? "flex" : "none";
}

// ======== تسجيل الدخول / إنشاء حساب ========
function loginPage(){
  showHeader(false);
  document.getElementById("app").innerHTML=`
  <div class="container"><div class="box">
  <h2 style="text-align:center;">تسجيل الدخول</h2>
  <input id="loginEmail" type="email" placeholder="البريد الإلكتروني">
  <input id="loginPass" type="password" placeholder="كلمة المرور">
  <button onclick="loginUser()">تسجيل الدخول</button>
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
  <input id="regPhone" placeholder="رقم الهاتف">
  <select id="regCountry">
  <option value="+963">🇸🇾 سوريا +963</option>
  <option value="+20">🇪🇬 مصر +20</option>
  <option value="+971">🇦🇪 الإمارات +971</option>
  <option value="+90">🇹🇷 تركيا +90</option>
  </select>
  <input id="regPass" type="password" placeholder="كلمة المرور">
  <button onclick="registerUser()">تسجيل</button>
  <button onclick="loginPage()" style="background:#444;color:white;">رجوع</button>
  </div></div>`;
}

async function registerUser(){
  let name = document.getElementById("regName").value;
  let email = document.getElementById("regEmail").value;
  let phone = document.getElementById("regPhone").value;
  let country = document.getElementById("regCountry").value;
  let pass = document.getElementById("regPass").value;

  if(!name || !email || !phone || !pass){ alert("يرجى ملء جميع الحقول"); return; }

  try{
    let cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection("users").doc(cred.user.uid).set({
      name,email,phone,country,
      balance:0,
      tasksCompleted:0,
      depositRequests:[],
      withdrawRequests:[]
    });
    alert("تم إنشاء الحساب بنجاح");
    loginUser(email,pass);
  }catch(e){ alert("خطأ: "+e.message);}
}

async function loginUser(emailInput, passInput){
  let email = emailInput || document.getElementById("loginEmail").value;
  let pass = passInput || document.getElementById("loginPass").value;
  try{
    let cred = await auth.signInWithEmailAndPassword(email, pass);
    currentUser = cred.user;
    await loadUserData();
    homePage();
  }catch(e){ alert("خطأ في تسجيل الدخول: "+e.message);}
}

// ======== Load User Data ========
async function loadUserData(){
  let docSnap = await db.collection("users").doc(currentUser.uid).get();
  if(docSnap.exists){ userData = docSnap.data(); }
}

// ======== حساب المستخدم ========
async function accountPage(){
  await loadUserData();
  showHeader(true);
  document.getElementById("app").innerHTML=`
  <div class="container">
    <h2 class="account-title">📄 بيانات الحساب</h2>
    <div class="account-box">
      <p><span class="label">الاسم:</span>${userData.name}</p>
      <p><span class="label">البريد الإلكتروني:</span>${userData.email}</p>
      <p><span class="label">رقم الهاتف:</span>${userData.phone}</p>
      <p><span class="label">الدولة:</span>${userData.country}</p>
      <p><span class="label">رصيدك:</span>${userData.balance}$</p>
      <p><span class="label">المهام المكتملة:</span>${userData.tasksCompleted}</p>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

// ======== الصفحة الرئيسية + المهام ========
async function homePage(){
  await loadUserData();
  showHeader(true);

  let tasksHtml = "";
  let depositAmount = 10;
  let reward = 20;

  for(let i=1;i<=25;i++){
    let locked = userData.balance < depositAmount || i > userData.tasksCompleted + 1;
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
    depositAmount*=2; reward*=2;
  }

  document.getElementById("app").innerHTML=`<div class="container">${tasksHtml}</div>`;
}

// ======== فتح المهمة ========
function openTask(num,dep,rew){
  document.getElementById("app").innerHTML=`
  <div class="container">
    <div class="box">
      <h2>المهمة رقم ${num}</h2>
      <p>المطلوب قبل التنفيذ: إيداع ${dep}$</p>
      <p>ربحك بعد الإنجاز: ${rew}$</p>
      <button onclick="completeTask(${num},${dep},${rew})">تنفيذ المهمة</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

async function completeTask(num,dep,rew){
  await loadUserData();
  if(userData.balance < dep){ alert("❌ يجب إيداع المبلغ المطلوب لفتح المهمة"); return; }
  if(userData.tasksCompleted >= num){ alert("❌ هذه المهمة تم تنفيذها مسبقاً"); return; }

  userData.balance += rew;
  userData.tasksCompleted = num;

  await db.collection("users").doc(currentUser.uid).update(userData);
  alert("✅ تم تنفيذ المهمة وتم إضافة الأرباح!");
  homePage();
}

// ======== الإيداع ========
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
  let amount = parseFloat(document.getElementById("depositAmount").value);
  let image = document.getElementById("depositImage").files[0];
  if(!amount || !image){ alert("يرجى إدخال المبلغ ورفع الصورة"); return; }

  let reader = new FileReader();
  reader.onload = async function(){
    let depositReq = {amount,image:reader.result,date:new Date().toLocaleString()};
    userData.depositRequests.push(depositReq);
    await db.collection("users").doc(currentUser.uid).update({depositRequests:userData.depositRequests});
    alert("✅ تم إرسال طلب الإيداع");
    homePage();
  }
  reader.readAsDataURL(image);
}

// ======== السحب ========
function withdrawPage(){
  if(userData.tasksCompleted < 20){ alert("❌ لا يمكن السحب قبل المهمة 20"); return; }
  document.getElementById("app").innerHTML=`
  <div class="container">
    <div class="box">
      <h2>سحب الأموال</h2>
      <p>رصيدك: ${userData.balance}$</p>
      <input id="withdrawWallet" placeholder="أدخل محفظتك">
      <button onclick="submitWithdraw()">طلب سحب</button>
      <button class="back-btn" onclick="homePage()">رجوع</button>
    </div>
  </div>`;
}

async function submitWithdraw(){
  let w = document.getElementById("withdrawWallet").value;
  if(!w){ alert("يرجى إدخال المحفظة"); return; }
  userData.withdrawRequests.push({wallet:w,amount:userData.balance,date:new Date().toLocaleString()});
  userData.balance = 0;
  await db.collection("users").doc(currentUser.uid).update({withdrawRequests:userData.withdrawRequests,balance:0});
  alert("✅ تم إرسال طلب السحب");
  homePage();
}

// ======== تسجيل الخروج ========
function logout(){ auth.signOut(); currentUser=null; userData=null; showHeader(false); loginPage(); }

// ======== بدء التطبيق ========
auth.onAuthStateChanged(async user=>{
  if(user){ currentUser = user; await loadUserData(); homePage(); }
  else loginPage();
});
