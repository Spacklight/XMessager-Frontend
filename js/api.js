// Backend endpoints
const SOCIAL_BASE = "https://xmessager-social.emalawi.workers.dev";
const BRAIN_BASE = "https://xmessager-brain.emalawi.workers.dev";
const LOGO_URL = "https://raw.githubusercontent.com/Spacklight/Tunnel/main/im.jpeg";

function getToken() { return localStorage.getItem("xm_token"); }
function getUser() { const u = localStorage.getItem("xm_user"); return u ? JSON.parse(u) : null; }
function setSession(token, user) {
  localStorage.setItem("xm_token", token);
  localStorage.setItem("xm_user", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("xm_token");
  localStorage.removeItem("xm_user");
}
function requireLogin() {
  if (!getToken()) { window.location.href = "login.html"; return false; }
  return true;
}

async function api(base, path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  if (opts.body && !(opts.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(base + path, { ...opts, headers });
  let data;
  try { data = await res.json(); } catch (_) { data = {}; }
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const social = (path, opts) => api(SOCIAL_BASE, path, opts);
const brain = (path, opts) => api(BRAIN_BASE, path, opts);

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  return days + "d ago";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function renderBottomNav(active) {
  const items = [
    { key: "home", href: "home.html", icon: "🏠", label: "Home" },
    { key: "chats", href: "home.html#chats", icon: "💬", label: "Chats" },
    { key: "groups", href: "groups.html", icon: "👥", label: "Groups" },
    { key: "pages", href: "pages.html", icon: "🚩", label: "Pages" },
    { key: "settings", href: "settings.html", icon: "⚙️", label: "Settings" },
  ];
  return `<nav class="bottom">${items.map(i =>
    `<a href="${i.href}" class="${active === i.key ? "active" : ""}"><span class="icon">${i.icon}</span>${i.label}</a>`
  ).join("")}</nav>`;
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
