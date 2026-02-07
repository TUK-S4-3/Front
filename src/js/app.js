import * as THREE from "three";

console.log(THREE);

const AUTH_KEY = "demo_auth_user";
const REMEMBER_KEY = "demo_auth_remember";

// 인증 사용자 조회
function getAuthUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 로그아웃 처리
function setLoggedOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

// 인증 UI 업데이트
function updateAuthUI() {
  const user = getAuthUser();
  const greetingEl = document.getElementById("authGreeting");

  if (user) {
    greetingEl.textContent = `${user.name}님`;
  } else {
    greetingEl.textContent = "";
  }
}

// 로그인 확인: 비로그인 사용자는 login.html로 리다이렉트
function checkAuth() {
  const user = getAuthUser();
  if (!user) {
    // 로그인되지 않음 -> 로그인 페이지로 이동
    sessionStorage.setItem("returnUrl", "/app.html");
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

// 로그아웃 버튼
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    setLoggedOut();
    window.location.href = "/index.html";
  });
}

// 초기화
if (!checkAuth()) {
  // 리다이렉트 처리 중이므로 이후 코드는 실행하지 않음
} else {
  updateAuthUI();
  
  // 여기서부터 app 기능 코드 추가
  // ...
}