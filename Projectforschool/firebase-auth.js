// firebase-auth.js – Firebase Authentication + Firestore + Redirect
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ==== Firebase config của bạn (projectfschool) ==== */
const firebaseConfig = {
  apiKey: "AIzaSyAp_GKrqzBIH5RFTrKSakrt6_o9V23xV7k",
  authDomain: "projectfschool.firebaseapp.com",
  projectId: "projectfschool",
  storageBucket: "projectfschool.appspot.com",
  messagingSenderId: "546456514153",
  appId: "1:546456514153:web:PUT_YOUR_REAL_APPID_HERE" // <-- thay bằng appId thật
};

// Init
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const provider = new GoogleAuthProvider();

/* ===== DOM ===== */
const signupForm = document.getElementById('signupForm');
const loginForm  = document.getElementById('loginForm');
const googleBtn  = document.getElementById('googleSignIn');

/* ===== Redirect helper ===== */
const goDashboard = () => { window.location.href = 'dashboard.html'; };

/* ===== Sign up ===== */
signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const className = document.getElementById('className').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Lưu hồ sơ vào Firestore
    await setDoc(doc(db, "users", user.uid), {
      fullName, className, email, createdAt: serverTimestamp()
    });

    // Tự đăng nhập và chuyển trang
    await signInWithEmailAndPassword(auth, email, password);
    goDashboard();

  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      // Email đã tồn tại → chuyển sang tab đăng nhập & gợi ý reset
      document.getElementById('loginTab')?.click();
      const loginEmail = document.getElementById('loginEmail');
      if (loginEmail) loginEmail.value = email;

      const reset = confirm('Email này đã được đăng ký. Bấm OK để gửi email đặt lại mật khẩu, hoặc Cancel nếu bạn nhớ mật khẩu.');
      if (reset) {
        try {
          await sendPasswordResetEmail(auth, email);
          alert('Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư của bạn.');
        } catch (e2) {
          alert('Không gửi được email đặt lại mật khẩu: ' + (e2?.message || 'Lỗi không xác định'));
        }
      }
      return;
    }
    alert('Đăng ký thất bại: ' + (err?.message || 'Lỗi không xác định'));
  }
});

/* ===== Sign in (Email/Password) ===== */
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    goDashboard(); // ✅ chuyển sang trang khác
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      alert('Tài khoản chưa tồn tại. Hãy đăng ký trước.');
    } else if (err.code === 'auth/wrong-password') {
      alert('Sai mật khẩu. Vui lòng thử lại.');
    } else if (err.code === 'auth/operation-not-allowed') {
      alert('Provider chưa bật hoặc domain chưa được cho phép. Kiểm tra Sign-in method & Authorized domains.');
    } else {
      alert('Đăng nhập thất bại: ' + (err?.message || 'Lỗi không xác định'));
    }
  }
});

/* ===== Google Sign-In ===== */
googleBtn?.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // tạo/ghi hồ sơ tối thiểu
    await setDoc(doc(db, "users", user.uid), {
      fullName: user.displayName || '',
      className: '',
      email: user.email || '',
      createdAt: serverTimestamp()
    }, { merge: true });

    goDashboard();
  } catch (err) {
    if (err.code === 'auth/operation-not-allowed') {
      alert('Google Sign-In chưa được bật hoặc domain chưa được phép.');
    } else {
      alert('Google Sign-In lỗi: ' + (err?.message || 'Lỗi không xác định'));
    }
  }
});

/* ===== Giữ người dùng nếu đã đăng nhập ===== */
// Ví dụ: tự chuyển sang dashboard nếu đã đăng nhập và đang ở trang index
onAuthStateChanged(auth, (user) => {
  // if (user && location.pathname.endsWith('index.html')) goDashboard();
});
