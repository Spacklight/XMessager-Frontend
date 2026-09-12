requireLogin();
const chatId = new URLSearchParams(window.location.search).get("id");
const me = getUser();
if (!chatId) window.location.href = "home.html";

let isSending = false;

async function loadThread() {
  const threadEl = document.getElementById("thread");
  try {
    const data = await social(`/api/chats/${chatId}/messages`);
    const other = data.other_user || { display_name: "User" };
    document.getElementById("otherName").textContent = other.display_name;

    // Safe avatar update: replace the WRAPPER's contents, never an element's
    // own id, so this works correctly no matter how many times it re-runs.
    const wrap = document.getElementById("otherAvatarWrap");
    wrap.innerHTML = other.profile_picture_url
      ? `<img class="avatar" src="${other.profile_picture_url}">`
      : `<div class="avatar">${initials(other.display_name)}</div>`;

    if (!data.messages.length) {
      threadEl.innerHTML = `<div class="empty">No messages yet. Say hello 👋</div>`;
    } else {
      threadEl.innerHTML = data.messages.map(renderBubble).join("");
    }
    threadEl.scrollTop = threadEl.scrollHeight;
  } catch (err) {
    // Only show the error if we don't already have messages on screen —
    // a transient poll failure shouldn't wipe out a working conversation.
    if (!threadEl.querySelector(".bubble")) {
      threadEl.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
    }
  }
}

function renderBubble(m) {
  const mine = m.sender_id === me.id;
  let mediaHtml = "";
  if (m.media_url && m.media_type === "image") mediaHtml = `<img src="${m.media_url}">`;
  if (m.media_url && m.media_type === "audio") mediaHtml = `<audio controls src="${m.media_url}" style="width:100%"></audio>`;
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
    await social(`/api/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
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
    await social(`/api/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: "", media_url: media.media_url, media_type: media.media_type }),
    });
    loadThread();
  } catch (err) {
    toast(err.message);
  }
  e.target.value = "";
});

// ---------- voice notes ----------
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

document.getElementById("micBtn").addEventListener("click", async () => {
  if (isRecording) {
    mediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      isRecording = false;
      document.getElementById("micBtn").textContent = "🎤";
      document.getElementById("micBtn").classList.remove("ghost");
      if (isSending) return;
      isSending = true;
      toast("Sending voice note...");
      try {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const form = new FormData();
        form.append("file", blob, "voice-note.webm");
        const media = await social("/api/media/upload", { method: "POST", body: form });
        await social(`/api/chats/${chatId}/messages`, {
          method: "POST",
          body: JSON.stringify({ content: "", media_url: media.media_url, media_type: media.media_type }),
        });
        loadThread();
      } catch (err) {
        toast(err.message);
      }
      isSending = false;
    };
    mediaRecorder.start();
    isRecording = true;
    document.getElementById("micBtn").textContent = "⏹";
    document.getElementById("micBtn").classList.add("ghost");
    toast("Recording... tap again to send");
  } catch (err) {
    toast("Microphone access denied or unavailable");
  }
});

loadThread();
setInterval(loadThread, 5000);
