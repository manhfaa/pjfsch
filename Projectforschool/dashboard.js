// dashboard.js - Auth gate + Onboarding câu hỏi + lưu Firestore (phiên bản tối ưu)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ================== CẤU HÌNH FIREBASE ================== */
const firebaseConfig = {
  apiKey: "AIzaSyAp_GKrqzBIH5RFTrKSakrt6_o9V23xV7k",
  authDomain: "projectfschool.firebaseapp.com",
  projectId: "projectfschool",
  appId: "1:546456514153:web:PUT_YOUR_REAL_APPID_HERE"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================== DOM ELEMENTS ================== */
const onboarding = document.getElementById("onboarding");
const mainArea = document.getElementById("mainArea");
const appNav = document.getElementById("appNav");
const userNameEls = [
  document.getElementById("userName"),
  document.getElementById("userName2")
];

const promptEl = document.getElementById("prompt");
const optList = document.getElementById("optList");
const btnNext = document.getElementById("btnNext");

/* ================== CÂU HỎI KHẢO SÁT ĐƯỢC CẢI THIỆN ================== */
const QUESTIONS = [
  {
    id: "target",
    prompt: "Mục tiêu thi vào 10 của bạn là gì?",
    options: [
      "Trường công lập top đầu (≥ 8.0 điểm/môn)",
      "Trường chuyên/lớp chọn (≥ 8.5 điểm/môn)", 
      "Trường công lập chất lượng cao (7.0-8.0 điểm/môn)",
      "Hoàn thành tốt kỳ thi (6.5-7.0 điểm/môn)",
      "Đỗ vào trường mong muốn theo năng lực"
    ]
  },
  {
    id: "current_level",
    prompt: "Trình độ hiện tại của bạn đang ở đâu?",
    options: [
      "Mất gốc, cần học lại từ đầu",
      "Nắm được kiến thức cơ bản",
      "Khá, cần củng cố kiến thức",
      "Tốt, cần luyện đề nâng cao",
      "Xuất sắc, ôn luyện chuyên sâu"
    ]
  },
  {
    id: "study_time",
    prompt: "Thời gian học mỗi ngày bạn có thể dành ra?",
    options: [
      "Dưới 1 giờ - Ôn tập nhẹ nhàng",
      "1-2 giờ - Lộ trình tiêu chuẩn", 
      "2-3 giờ - Lộ trình tăng tốc",
      "3-4 giờ - Lộ trình chuyên sâu",
      "Trên 4 giờ - Lộ trình cao cấp"
    ]
  },
  {
    id: "weak_subject",
    prompt: "Môn học bạn cần cải thiện nhiều nhất?",
    options: [
      "Toán - Đại số & Hình học",
      "Ngữ Văn - Văn học & Tập làm văn",
      "Tiếng Anh - Ngữ pháp & Từ vựng",
      "Toán & Ngữ Văn (đồng đều)",
      "Tất cả môn (cần cân bằng)"
    ]
  },
  {
    id: "learning_style", 
    prompt: "Phong cách học tập phù hợp với bạn?",
    options: [
      "Học qua video & hình ảnh",
      "Làm bài tập thực hành",
      "Học lý thuyết tóm tắt", 
      "Luyện đề & thi thử",
      "Kết hợp đa dạng phương pháp"
    ]
  }
];

/* ================== STATE MANAGEMENT ================== */
let currentStep = 0;
let userAnswers = {};
let selectedOptionIndex = -1;

/* ================== UI FUNCTIONS ================== */
function updateUserUI(user) {
  const displayName = user.displayName || user.email || "Bạn";
  userNameEls.forEach(el => {
    if (el) el.textContent = displayName;
  });
}

function showMainInterface() {
  onboarding.classList.add("hidden");
  mainArea.style.display = "block";
  appNav.style.display = "flex";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showOnboardingInterface() {
  onboarding.classList.remove("hidden");
  mainArea.style.display = "none";
  appNav.style.display = "none";
  currentStep = 0;
  userAnswers = {};
  renderCurrentStep();
}

function renderCurrentStep() {
  const question = QUESTIONS[currentStep];
  if (!question) return;

  // Cập nhật prompt
  promptEl.textContent = question.prompt;
  
  // Xóa và render options mới
  optList.innerHTML = "";
  selectedOptionIndex = -1;
  
  // Reset button state
  btnNext.classList.remove("ready");
  btnNext.disabled = true;

  // Tạo options
  question.options.forEach((optionText, index) => {
    const optionElement = document.createElement("div");
    optionElement.className = "opt";
    optionElement.innerHTML = `
      <div class="bars">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </div>
      <div>${optionText}</div>
    `;
    
    optionElement.addEventListener("click", () => selectOption(index, optionElement));
    optList.appendChild(optionElement);
  });

  // Cập nhật button text
  btnNext.textContent = currentStep < QUESTIONS.length - 1 ? "TIẾP TỤC" : "HOÀN TẤT";
}

function selectOption(index, element) {
  // Bỏ chọn tất cả options
  document.querySelectorAll(".opt").forEach(opt => opt.classList.remove("active"));
  
  // Chọn option hiện tại
  element.classList.add("active");
  selectedOptionIndex = index;
  
  // Kích hoạt button tiếp tục
  btnNext.classList.add("ready");
  btnNext.disabled = false;
}

/* ================== DATA MANAGEMENT ================== */
async function saveAnswersAndRedirect(uid) {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        onboardingCompleted: true,
        onboardingAt: serverTimestamp(),
        userProfile: userAnswers,
        lastUpdated: serverTimestamp()
      },
      { merge: true }
    );
    
    // Chuyển hướng sang trang study-plan với màu chủ đạo được giữ nguyên
    window.location.href = "study-plan.html";
    
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu:", error);
    alert("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
  }
}

/* ================== EVENT HANDLERS ================== */
btnNext.addEventListener("click", async () => {
  if (selectedOptionIndex < 0) return;
  
  const currentQuestion = QUESTIONS[currentStep];
  userAnswers[currentQuestion.id] = {
    answer: currentQuestion.options[selectedOptionIndex],
    step: currentStep + 1
  };

  if (currentStep < QUESTIONS.length - 1) {
    // Chuyển đến câu hỏi tiếp theo
    currentStep++;
    renderCurrentStep();
  } else {
    // Hoàn thành khảo sát
    const user = auth.currentUser;
    if (user) {
      btnNext.textContent = "ĐANG XỬ LÝ...";
      btnNext.disabled = true;
      await saveAnswersAndRedirect(user.uid);
    }
  }
});

// Xử lý đăng xuất
document.getElementById("logout").addEventListener("click", () => signOut(auth));
document.getElementById("logout2").addEventListener("click", () => signOut(auth));

/* ================== AUTH STATE MANAGEMENT ================== */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  updateUserUI(user);

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    if (userData.onboardingCompleted) {
      showMainInterface();
    } else {
      showOnboardingInterface();
    }
  } catch (error) {
    console.warn("Lỗi đọc Firestore, chuyển sang onboarding:", error);
    showOnboardingInterface();
  }
});

/* ================== DEBUG UTILITIES ================== */
window.__debugShowOnboarding = () => showOnboardingInterface();
window.__debugResetOnboarding = async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    await setDoc(
      doc(db, "users", user.uid),
      { onboardingCompleted: false },
      { merge: true }
    );
    showOnboardingInterface();
  } catch (error) {
    console.error("Debug reset error:", error);
  }
};