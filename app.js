const auth = firebase.auth();
const db = firebase.firestore();

// ============ واجهات ============

function showLogin() {
    document.getElementById("app").innerHTML = `
        <h2>تسجيل الدخول</h2>
        <input id="email" placeholder="البريد الإلكتروني">
        <input id="pass" placeholder="كلمة المرور" type="password">
        <button onclick="login()">دخول</button>
        <p>لا تملك حساب؟ <a href="#" onclick="showRegister()">إنشاء حساب</a></p>
    `;
}

function showRegister() {
    document.getElementById("app").innerHTML = `
        <h2>إنشاء حساب</h2>
        <input id="email" placeholder="البريد الإلكتروني">
        <input id="pass" placeholder="كلمة المرور" type="password">
        <button onclick="register()">إنشاء</button>
        <p>لديك حساب؟ <a href="#" onclick="showLogin()">تسجيل الدخول</a></p>
    `;
}

function showDashboard(user, balance) {
    document.getElementById("balance").innerText = "الرصيد: " + balance + "$";

    document.getElementById("app").innerHTML = `
        <h2>المهمات</h2>

        <div class="task">
            <h3>المهمة الأولى – سعر الفتح: 10$</h3>
            <button onclick="doTask(1, 10)">تنفيذ</button>
        </div>

        <div class="task">
            <h3>المهمة الثانية – سعر الفتح: 20$</h3>
            <button onclick="doTask(2, 20)">تنفيذ</button>
        </div>

        <h2>الإيداع</h2>
        <input type="number" id="deposit" placeholder="المبلغ">
        <button onclick="requestDeposit()">طلب إيداع</button>

        <br><br>
        <button onclick="showAdminLogin()">لوحة الإدارة</button>
    `;
}

function showAdminLogin() {
    document.getElementById("app").innerHTML = `
        <h2>دخول الإدارة</h2>
        <input id="adminPass" type="password" placeholder="كلمة مرور الأدمن">
        <button onclick="adminLogin()">دخول</button>
    `;
}

function showAdminPanel(requests) {
    let html = `<h2>لوحة الإدارة</h2>`;

    requests.forEach(r => {
        html += `
            <div class="admin-box">
                <p>معرّف المستخدم: ${r.user}</p>
                <p>المبلغ: ${r.amount}$</p>
                <button onclick="approveDeposit('${r.id}', '${r.user}', ${r.amount})">موافقة</button>
            </div>
        `;
    });

    document.getElementById("app").innerHTML = html;
}

// ============ وظائف المستخدم ============

async function register() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("pass").value;

    const user = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection("users").doc(user.user.uid).set({
        balance: 0,
        task1: false,
        task2: false
    });

    alert("تم إنشاء الحساب");
}

async function login() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("pass").value;
    await auth.signInWithEmailAndPassword(email, pass);
}

async function logout() {
    await auth.signOut();
}

// ============ نظام المهمات ============

async function doTask(taskNumber, required) {
    const uid = auth.currentUser.uid;
    const ref = db.collection("users").doc(uid);
    const user = await ref.get();

    let balance = user.data().balance;

    if (balance < required) {
        alert("يجب إيداع " + required + "$ لفتح هذه المهمة");
        return;
    }

    await ref.update({
        balance: balance + 10
    });

    alert("تم جمع المهمة +10$");
}

// ============ نظام الإيداع ============

async function requestDeposit() {
    const amount = parseFloat(document.getElementById("deposit").value);
    const uid = auth.currentUser.uid;

    await db.collection("deposits").add({
        user: uid,
        amount: amount,
        status: "pending"
    });

    alert("تم إرسال طلب الإيداع");
}

// ============ نظام الإدارة ============

function adminLogin() {
    const pass = document.getElementById("adminPass").value;
    if (pass !== "aalmwt10") {
        alert("خطأ في كلمة المرور");
        return;
    }

    db.collection("deposits").where("status", "==", "pending")
        .get().then(snap => {
            let reqs = [];
            snap.forEach(doc => reqs.push({ id: doc.id, ...doc.data() }));
            showAdminPanel(reqs);
        });
}

async function approveDeposit(id, uid, amount) {
    const ref = db.collection("users").doc(uid);
    const user = await ref.get();
    let bal = user.data().balance;

    await ref.update({ balance: bal + amount });
    await db.collection("deposits").doc(id).update({ status: "approved" });

    alert("تمت إضافة الرصيد");
}

// ============ متابعة الدخول ============

auth.onAuthStateChanged(async user => {
    if (!user) return showLogin();

    const ref = db.collection("users").doc(user.uid);
    const data = await ref.get();

    showDashboard(user, data.data().balance);
});
