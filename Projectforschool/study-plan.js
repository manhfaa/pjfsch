// study-plan.js - Enhanced with Firebase, Animations & User Data

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
  updateDoc,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ================== FIREBASE CONFIG ================== */
const firebaseConfig = {
  apiKey: "AIzaSyAp_GKrqzBIH5RFTrKSakrt6_o9V23xV7k",
  authDomain: "projectfschool.firebaseapp.com",
  projectId: "projectfschool",
  appId: "1:546456514153:web:PUT_YOUR_REAL_APPID_HERE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================== DOM ELEMENTS ================== */
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logout");
const progressCards = document.querySelectorAll('.progress-card');
const continueBtns = document.querySelectorAll('.continue-btn');
const downloadBtns = document.querySelectorAll('.download-btn');
const taskElements = document.querySelectorAll('.task');

/* ================== ANIMATION HELPERS ================== */
function initRippleEffects() {
  const buttons = document.querySelectorAll('.continue-btn, .download-btn, .logout');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      createRipple(e);
    });
  });
}

function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
  circle.classList.add("ripple");

  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) ripple.remove();

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

function animateProgressCircles() {
  const circles = document.querySelectorAll('.circle');
  circles.forEach(circle => {
    const card = circle.closest('.progress-card');
    const percent = card.querySelector('.progress-circle').getAttribute('data-percent');
    
    // Animation delay based on card position
    const delay = Array.from(progressCards).indexOf(card) * 200;
    
    setTimeout(() => {
      circle.style.strokeDasharray = `${percent}, 100`;
      circle.style.transition = 'stroke-dasharray 1.2s ease-out';
    }, delay);
  });
}

function addHoverEffects() {
  const cards = document.querySelectorAll('.stat-card, .resource-card, .tip-card, .progress-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px) scale(1.02)';
      card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });
  });
}

function addPulseAnimation() {
  const currentTasks = document.querySelectorAll('.task.current');
  currentTasks.forEach(task => {
    setInterval(() => {
      task.style.boxShadow = task.style.boxShadow ? '' : '0 0 0 2px rgba(25, 118, 255, 0.3)';
    }, 1500);
  });
}

/* ================== FIREBASE DATA MANAGEMENT ================== */
async function loadUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      updateUIWithUserData(userData);
      updateStudyPlanBasedOnAnswers(userData);
      return userData;
    }
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
  }
  return null;
}

function updateUIWithUserData(userData) {
  // Hiển thị tên người dùng
  if (userData.userProfile) {
    const displayName = userData.userProfile.displayName || userData.email || "Bạn";
    userNameEl.textContent = displayName;
  }
}

function updateStudyPlanBasedOnAnswers(userData) {
  if (!userData.userProfile) return;

  const profile = userData.userProfile;
  
  // Cập nhật mục tiêu điểm số
  if (profile.target) {
    updateTargetScore(profile.target.answer);
  }
  
  // Cập nhật môn học cần cải thiện
  if (profile.weak_subject) {
    highlightWeakSubject(profile.weak_subject.answer);
  }
  
  // Cập nhật thời gian học
  if (profile.study_time) {
    adjustStudySchedule(profile.study_time.answer);
  }
  
  // Cập nhật phương pháp học
  if (profile.learning_style) {
    recommendResources(profile.learning_style.answer);
  }
}

function updateTargetScore(targetAnswer) {
  const targetElement = document.querySelector('.stat-card:last-child .stat-number');
  if (targetElement) {
    const targetMap = {
      "Trường công lập top đầu (≥ 8.0 điểm/môn)": "8.0+",
      "Trường chuyên/lớp chọn (≥ 8.5 điểm/môn)": "8.5+", 
      "Trường công lập chất lượng cao (7.0-8.0 điểm/môn)": "7.5+",
      "Hoàn thành tốt kỳ thi (6.5-7.0 điểm/môn)": "7.0+",
      "Đỗ vào trường mong muốn theo năng lực": "Target"
    };
    targetElement.textContent = targetMap[targetAnswer] || "8.0+";
  }
}

function highlightWeakSubject(subjectAnswer) {
  const subjectMap = {
    "Toán - Đại số & Hình học": "Toán học",
    "Ngữ Văn - Văn học & Tập làm văn": "Ngữ Văn", 
    "Tiếng Anh - Ngữ pháp & Từ vựng": "Tiếng Anh",
    "Toán & Ngữ Văn (đồng đều)": ["Toán học", "Ngữ Văn"],
    "Tất cả môn (cần cân bằng)": ["Toán học", "Ngữ Văn", "Tiếng Anh"]
  };
  
  const targetSubjects = subjectMap[subjectAnswer];
  if (targetSubjects) {
    const subjects = Array.isArray(targetSubjects) ? targetSubjects : [targetSubjects];
    
    subjects.forEach(subjectName => {
      const progressCards = document.querySelectorAll('.progress-info h3');
      progressCards.forEach(card => {
        if (card.textContent === subjectName) {
          const progressCard = card.closest('.progress-card');
          progressCard.style.border = '2px solid var(--brand)';
          progressCard.style.background = 'var(--brand-50)';
          
          // Thêm badge ưu tiên
          const priorityBadge = document.createElement('div');
          priorityBadge.className = 'priority-badge';
          priorityBadge.textContent = 'Ưu tiên';
          priorityBadge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: var(--brand);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 800;
          `;
          progressCard.style.position = 'relative';
          progressCard.appendChild(priorityBadge);
        }
      });
    });
  }
}

function adjustStudySchedule(studyTimeAnswer) {
  const timeIntensityMap = {
    "Dưới 1 giờ - Ôn tập nhẹ nhàng": "light",
    "1-2 giờ - Lộ trình tiêu chuẩn": "standard",
    "2-3 giờ - Lộ trình tăng tốc": "intensive", 
    "3-4 giờ - Lộ trình chuyên sâu": "advanced",
    "Trên 4 giờ - Lộ trình cao cấp": "premium"
  };
  
  const intensity = timeIntensityMap[studyTimeAnswer] || "standard";
  updateTaskCountBasedOnIntensity(intensity);
}

function updateTaskCountBasedOnIntensity(intensity) {
  const taskCountMap = {
    light: 1,
    standard: 2,
    intensive: 3,
    advanced: 4,
    premium: 5
  };
  
  const targetCount = taskCountMap[intensity] || 2;
  const dayCards = document.querySelectorAll('.day-card');
  
  dayCards.forEach(card => {
    const tasks = card.querySelectorAll('.task');
    tasks.forEach((task, index) => {
      if (index >= targetCount) {
        task.style.display = 'none';
      }
    });
  });
}

function recommendResources(learningStyleAnswer) {
  const styleResourceMap = {
    "Học qua video & hình ảnh": [3, 0], // Video resources first
    "Làm bài tập thực hành": [2, 0], // Practice resources first
    "Học lý thuyết tóm tắt": [0, 1], // Theory resources first
    "Luyện đề & thi thử": [3, 2], // Exam resources first
    "Kết hợp đa dạng phương pháp": [0, 1, 2, 3] // All resources
  };
  
  const preferredOrder = styleResourceMap[learningStyleAnswer] || [0, 1, 2, 3];
  reorderResources(preferredOrder);
}

function reorderResources(preferredOrder) {
  const resourcesContainer = document.querySelector('.resources-grid');
  const resourceCards = Array.from(resourcesContainer.children);
  
  // Sắp xếp lại resource cards theo thứ tự ưu tiên
  const sortedCards = preferredOrder.map(index => resourceCards[index]).filter(Boolean);
  
  // Xóa và thêm lại theo thứ tự mới
  resourcesContainer.innerHTML = '';
  sortedCards.forEach(card => resourcesContainer.appendChild(card));
}

/* ================== STUDY PROGRESS TRACKING ================== */
async function markTaskComplete(taskId, uid) {
  try {
    await updateDoc(doc(db, "users", uid), {
      completedTasks: arrayUnion(taskId),
      lastActivity: serverTimestamp(),
      progress: {
        lastCompleted: taskId,
        completedAt: serverTimestamp()
      }
    });
    
    showCompletionAnimation(taskId);
    updateProgressCircles(uid);
  } catch (error) {
    console.error("Lỗi khi cập nhật tiến độ:", error);
  }
}

function showCompletionAnimation(taskId) {
  const taskElement = document.querySelector(`[data-task="${taskId}"]`);
  if (taskElement) {
    taskElement.classList.add('completed');
    taskElement.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      taskElement.style.transform = 'scale(1)';
      taskElement.style.transition = 'transform 0.3s ease';
    }, 300);
    
    createMiniConfetti(taskElement);
  }
}

function createMiniConfetti(element) {
  const confettiCount = 8;
  const colors = ['#1976ff', '#0d5fd1', '#4dabf7', '#74c0fc'];
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: absolute;
      width: 6px;
      height: 6px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 1px;
      pointer-events: none;
      z-index: 100;
    `;
    
    const rect = element.getBoundingClientRect();
    confetti.style.left = `${rect.left + rect.width/2}px`;
    confetti.style.top = `${rect.top + rect.height/2}px`;
    
    document.body.appendChild(confetti);
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = 20 + Math.random() * 30;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    let posX = rect.left + rect.width/2;
    let posY = rect.top + rect.height/2;
    
    function animate() {
      posX += vx;
      posY += vy;
      vy += 0.5; // gravity
      
      confetti.style.left = `${posX}px`;
      confetti.style.top = `${posY}px`;
      confetti.style.opacity = `${1 - (posY - rect.top) / 300}`;
      
      if (posY < window.innerHeight && parseFloat(confetti.style.opacity) > 0) {
        requestAnimationFrame(animate);
      } else {
        confetti.remove();
      }
    }
    
    animate();
  }
}

async function updateProgressCircles(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const completedTasks = userData.completedTasks || [];
      
      // Cập nhật tiến độ các môn học dựa trên tasks completed
      const mathProgress = calculateSubjectProgress('math', completedTasks);
      const literatureProgress = calculateSubjectProgress('literature', completedTasks);
      const englishProgress = calculateSubjectProgress('english', completedTasks);
      
      updateProgressCircle('Toán học', mathProgress);
      updateProgressCircle('Ngữ Văn', literatureProgress);
      updateProgressCircle('Tiếng Anh', englishProgress);
    }
  } catch (error) {
    console.error("Lỗi cập nhật tiến độ:", error);
  }
}

function calculateSubjectProgress(subject, completedTasks) {
  const subjectTasks = completedTasks.filter(task => task.includes(subject));
  return Math.min((subjectTasks.length / 5) * 100, 100); // Giả sử mỗi môn có 5 tasks
}

function updateProgressCircle(subjectName, progress) {
  const progressCards = document.querySelectorAll('.progress-info h3');
  progressCards.forEach(card => {
    if (card.textContent === subjectName) {
      const progressCircle = card.closest('.progress-card').querySelector('.progress-circle');
      const circlePath = progressCircle.querySelector('.circle');
      const percentageText = progressCircle.querySelector('.percentage');
      
      progressCircle.setAttribute('data-percent', Math.round(progress));
      circlePath.style.strokeDasharray = `${progress}, 100`;
      percentageText.textContent = `${Math.round(progress)}%`;
    }
  });
}

/* ================== AUTHENTICATION & INITIALIZATION ================== */
function initStudyPlan() {
  initRippleEffects();
  addHoverEffects();
  addPulseAnimation();
  
  // Thêm CSS cho ripple effect
  const style = document.createElement('style');
  style.textContent = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple-animation 0.6s linear;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .continue-btn, .download-btn, .logout {
      position: relative;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

// Xử lý đăng xuất
logoutBtn.addEventListener("click", () => {
  // Hiệu ứng loading trước khi đăng xuất
  logoutBtn.textContent = "Đang đăng xuất...";
  logoutBtn.disabled = true;
  
  setTimeout(() => {
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  }, 800);
});

// Xử lý click tiếp tục học
continueBtns.forEach(btn => {
  btn.addEventListener('click', function(e) {
    const subject = this.closest('.progress-card').querySelector('h3').textContent;
    showLoadingMessage(`Đang mở khóa học ${subject}...`);
    
    // Mô phỏng tải nội dung
    setTimeout(() => {
      alert(`Chuyển đến khóa học ${subject}`);
    }, 1000);
  });
});

// Xử lý download tài liệu
downloadBtns.forEach(btn => {
  btn.addEventListener('click', function(e) {
    const resourceCard = this.closest('.resource-card');
    const resourceName = resourceCard.querySelector('h3').textContent;
    
    showLoadingMessage(`Đang tải xuống ${resourceName}...`);
    
    // Mô phỏng download
    setTimeout(() => {
      showSuccessMessage(`Đã tải xuống ${resourceName} thành công!`);
    }, 1500);
  });
});

// Xử lý hoàn thành task
taskElements.forEach(task => {
  task.addEventListener('click', function() {
    if (!this.classList.contains('completed')) {
      const taskId = this.getAttribute('data-task') || `task-${Date.now()}`;
      const user = auth.currentUser;
      
      if (user) {
        markTaskComplete(taskId, user.uid);
      }
    }
  });
});

function showLoadingMessage(message) {
  // Tạo toast loading
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--brand);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 1000;
    box-shadow: var(--shadow-md);
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

function showSuccessMessage(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #22c55e;
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 1000;
    box-shadow: var(--shadow-md);
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// Thêm animation keyframes
const animationStyle = document.createElement('style');
animationStyle.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(animationStyle);

/* ================== AUTH STATE MANAGEMENT ================== */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Chưa đăng nhập → chuyển hướng về trang đăng nhập
    window.location.href = "index.html";
    return;
  }

  // Đã đăng nhập, khởi tạo study plan
  initStudyPlan();
  
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    if (!userData.onboardingCompleted) {
      // Chưa hoàn thành khảo sát → chuyển hướng về dashboard
      window.location.href = "dashboard.html";
      return;
    }
    
    // Đã hoàn thành khảo sát, tải dữ liệu người dùng
    await loadUserData(user.uid);
    
    // Khởi động animations sau khi load dữ liệu
    setTimeout(() => {
      animateProgressCircles();
    }, 500);
    
  } catch (error) {
    console.error("Lỗi kiểm tra trạng thái người dùng:", error);
    // Trong trường hợp lỗi, vẫn hiển thị trang nhưng với dữ liệu mặc định
    animateProgressCircles();
  }
});

/* ================== DEBUG UTILITIES ================== */
window.__debugRefreshData = async () => {
  const user = auth.currentUser;
  if (user) {
    await loadUserData(user.uid);
    animateProgressCircles();
  }
};

window.__debugSimulateProgress = () => {
  updateProgressCircle('Toán học', 75);
  updateProgressCircle('Ngữ Văn', 50);
  updateProgressCircle('Tiếng Anh', 25);
};