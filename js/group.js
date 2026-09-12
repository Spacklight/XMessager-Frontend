requireLogin();
const groupId = new URLSearchParams(window.location.search).get("id");
const me = getUser();
if (!groupId) window.location.href = "groups.html";

async function loadThread() {
  const threadEl = document.getElementById("thread");
  try {
    const data = await social(`/api/groups/${groupId}/messages`);
    document.getElementById("groupName").textContent = data.group.name;
    document.getElementById("groupAvatar").textContent = initials(data.group.name);

    if (!data.messages.length) {
      threadEl.innerHTML = `<div class="empty">No messages yet. Be the first to say something.</div>`;
    } else {
      threadEl.innerHTML = data.messages.map(renderBubble).join("");
    }
    threadEl.scrollTop = threadEl.scrollHeight;
  } catch (err) {
    threadEl.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
    document.getElementById("composer").style.display = "none";
  }
}

function renderBubble(m) {
  const mine = m.sender_id === me.id;
  let mediaHtml = "";
  if (m.media_url && m.media_type === "image") mediaHtml = `<img src="${m.media_url}">`;
  return `<div class="bubble ${mine ? "mine" : "theirs"}">
    ${mediaHtml}
    ${m.content ? escapeHtml(m.content) : ""}
    <span class="stamp">${new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
  </div>`;
}

document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("msgInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const content = input.value.trim();
  if (!content) return;
  input.value = "";
  try {
    await social(`/api/groups/${groupId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
    loadThread();
  } catch (err) {
    toast(err.message);
  }
}

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  toast("Uploading photo...");
  try {
    const form = new FormData();
    form.append("file", file);
    const media = await social("/api/media/upload", { method: "POST", body: form });
    await social(`/api/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: "", media_url: media.media_url, media_type: media.media_type }),
    });
    loadThread();
  } catch (err) {
    toast(err.message);
  }
  e.target.value = "";
});

loadThread();
setInterval(loadThread, 5000);
