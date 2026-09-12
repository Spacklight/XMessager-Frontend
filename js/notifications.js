requireLogin();

const ICONS = {
  chat_message: "💬",
  group_invite: "👥",
  page_invite: "🚩",
  post_like: "❤️",
  post_comment: "💬",
};

async function loadNotifications() {
  const list = document.getElementById("list");
  try {
    const data = await social("/api/notifications");
    if (!data.notifications.length) {
      list.innerHTML = `<div class="empty">No notifications yet.</div>`;
      return;
    }
    list.innerHTML = data.notifications.map(n => `
      <a class="list-row" href="#" onclick="openNotif('${n.id}', '${n.link || ""}'); return false;" style="opacity:${n.is_read ? ".6" : "1"}">
        <div class="avatar">${ICONS[n.type] || "🔔"}</div>
        <div class="meta">
          <div class="name">${escapeHtml(n.message)}</div>
          <div class="preview">${timeAgo(n.created_at)}</div>
        </div>
        ${!n.is_read ? '<div class="badge">New</div>' : ""}
      </a>
    `).join("");
  } catch (err) {
    list.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

async function openNotif(id, link) {
  try { await social(`/api/notifications/${id}/read`, { method: "POST" }); } catch (_) {}
  if (link) window.location.href = link;
  else loadNotifications();
}

document.getElementById("markAllLink").addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await social("/api/notifications/read-all", { method: "POST" });
    loadNotifications();
    refreshNotifBadge();
  } catch (err) {
    toast(err.message);
  }
});

loadNotifications();
