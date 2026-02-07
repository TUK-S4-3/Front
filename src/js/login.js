import * as THREE from "three";

console.log(THREE);

const AUTH_KEY = "demo_auth_user";
const REMEMBER_KEY = "demo_auth_remember";

function setAuthUser(user, remember) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

function showError(msg) {
  const el = document.getElementById("error");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function clearError() {
  const el = document.getElementById("error");
  if (!el) return;
  el.textContent = "";
  el.hidden = true;
}

function normalizeNameFromEmail(email) {
  const at = email.indexOf("@");
  const base = at > 0 ? email.slice(0, at) : email;
  return base.replace(/[._-]+/g, " ").trim() || "사용자";
}

function getReturnUrl() {
  const url = sessionStorage.getItem("returnUrl") || "/index.html";
  sessionStorage.removeItem("returnUrl");
  return url;
}

// UI elements
const form = document.getElementById("loginForm");
const emailEl = document.getElementById("email");
const pwEl = document.getElementById("password");
const rememberEl = document.getElementById("remember");

const togglePwBtn = document.getElementById("togglePw");
if (togglePwBtn && pwEl) {
  togglePwBtn.addEventListener("click", () => {
    const isPw = pwEl.type === "password";
    pwEl.type = isPw ? "text" : "password";
    togglePwBtn.textContent = isPw ? "숨김" : "표시";
  });
}

const forgotLink = document.getElementById("forgotLink");
if (forgotLink) {
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    alert("데모: 비밀번호 재설정은 백엔드/이메일 연동이 필요합니다.");
  });
}

const signupLink = document.getElementById("signupLink");
if (signupLink) {
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    alert("데모: 회원가입은 백엔드 연결 시 구현하세요.");
  });
}

const guestBtn = document.getElementById("guestBtn");
if (guestBtn) {
  guestBtn.addEventListener("click", () => {
    setAuthUser({ name: "게스트", email: "guest@demo.local" }, true);
    window.location.href = getReturnUrl();
  });
}

if (form && emailEl && pwEl && rememberEl) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError();

    const email = (emailEl.value || "").trim();
    const pw = pwEl.value || "";
    const remember = !!rememberEl.checked;

    // Basic validation (demo)
    if (!email) return showError("이메일을 입력하세요.");
    if (!email.includes("@")) return showError("이메일 형식이 올바르지 않습니다.");
    if (pw.length < 4) return showError("비밀번호는 4자 이상 입력하세요.");

    const user = { name: normalizeNameFromEmail(email), email };
    setAuthUser(user, remember);

    window.location.href = getReturnUrl();
  });
}
