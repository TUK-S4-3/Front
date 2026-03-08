import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";


async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== "true") return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

function mountFatal(message: string) {
  const id = "fatal-bootstrap-error";
  const existing = document.getElementById(id);
  if (existing) {
    existing.textContent = message;
    return;
  }

  const node = document.createElement("div");
  node.id = id;
  node.style.position = "fixed";
  node.style.inset = "0";
  node.style.zIndex = "99999";
  node.style.background = "#111";
  node.style.color = "#ffb4b4";
  node.style.padding = "16px";
  node.style.font = "12px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  node.style.whiteSpace = "pre-wrap";
  node.textContent = message;
  document.body.appendChild(node);
}

function isBenignRejection(reason: unknown) {
  const text = String(
    reason instanceof Error
      ? reason.stack ?? reason.message
      : reason
  );

  return (
    text.includes("AbortedPromiseError") ||
    text.includes("Scene disposed") ||
    text.includes("AbortError") ||
    text.includes("NS_BINDING_ABORTED")
  );
}

window.addEventListener("error", (event) => {
  const message = event?.error instanceof Error ? event.error.stack ?? event.error.message : String(event.message ?? "");
  mountFatal(`[window.error]\n${message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  if (isBenignRejection(event.reason)) {
    event.preventDefault();
    return;
  }
  const reason = event.reason instanceof Error ? event.reason.stack ?? event.reason.message : String(event.reason ?? "");
  mountFatal(`[window.unhandledrejection]\n${reason}`);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  mountFatal("Root element '#root' not found.");
  throw new Error("Root element '#root' not found.");
}

const root = ReactDOM.createRoot(rootElement);
let mounted = false;
let forceTimer = 0;

function renderApp() {
  if (mounted) return;
  mounted = true;
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

forceTimer = window.setTimeout(() => {
  console.warn("[bootstrap] enableMocking timeout, rendering app.");
  renderApp();
}, 3000);

void enableMocking()
  .catch((error) => {
    console.error("[bootstrap] enableMocking failed", error);
  })
  .finally(() => {
    window.clearTimeout(forceTimer);
    renderApp();
  });
