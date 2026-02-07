import * as THREE from "three";

console.log(THREE);

const AUTH_KEY = "demo_auth_user";
const REMEMBER_KEY = "demo_auth_remember";

function getAuthUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setLoggedOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

function updateAuthUI() {
  const user = getAuthUser();

  const greetingEl = document.getElementById("authGreeting");
  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    greetingEl.textContent = `${user.name}님`;
    loginLink.hidden = true;
    logoutBtn.hidden = false;
  } else {
    greetingEl.textContent = "";
    loginLink.hidden = false;
    logoutBtn.hidden = true;
  }
}

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    setLoggedOut();
    updateAuthUI();
  });
}

// Video autoplay assist (some browsers)
const bgVideo = document.getElementById("bgVideo");
if (bgVideo) {
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (prefersReduced) {
    bgVideo.pause();
  } else {
    bgVideo.play().catch(() => {
      bgVideo.pause();
    });
  }
}

// Init
updateAuthUI();
