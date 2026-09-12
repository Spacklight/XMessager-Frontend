requireLogin();
const pageId = new URLSearchParams(window.location.search).get("id");
const me = getUser();
document.getElementById("backLink").href = "page.html?id=" + pageId;
if (!pageId) window.location.href = "pages.html";

let currentPictureUrl = null;

async function load() {
  try {
    const data = await social(`/api/pages/${pageId}/posts`);
    const page = data.page;
    if (page.owner_id !== me.id) {
      document.querySelector("main").innerHTML = `<div class="empty">Only the page owner can access settings.</div>`;
      return;
    }
    currentPictureUrl = page.profile_picture_url;
    renderAvatar(page);
    document.getElementById("nameInput").value = page.name;
    document.getElementById("descInput").value = page.description || "";
    document.getElementById("visibilityInput").value = page.visibility;
    document.getElementById("permissionInput").value = page.post_permission;
    document.getElementById("enabledInput").checked = !!page.posts_enabled;
  } catch (err) {
    toast(err.message);
  }
}

function renderAvatar(page) {
  const existing = document.getElementById("pageAvatar");
  if (page.profile_picture_url) {
    const img = document.createElement("img");
    img.className = "avatar avatar-lg";
    img.id = "pageAvatar";
    img.style.margin = "0 auto 12px";
    img.src = page.profile_picture_url;
    existing.replaceWith(img);
  } else {
    existing.textContent = initials(page.name);
  }
}

document.getElementById("picInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  toast("Uploading logo...");
  try {
    const form = new FormData();
    form.append("file", file);
    const media = await social("/api/media/upload", { method: "POST", body: form });
    const updated = await social(`/api/pages/${pageId}/settings`, { method: "POST", body: JSON.stringify({ profile_picture_url: media.media_url }) });
    currentPictureUrl = updated.profile_picture_url;
    renderAvatar(updated);
    toast("Page logo updated");
  } catch (err) {
    toast(err.message);
  }
  e.target.value = "";
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const errEl = document.getElementById("saveErr");
  errEl.textContent = "";
  const name = document.getElementById("nameInput").value.trim();
  const description = document.getElementById("descInput").value.trim();
  const visibility = document.getElementById("visibilityInput").value;
  const post_permission = document.getElementById("permissionInput").value;
  const posts_enabled = document.getElementById("enabledInput").checked;
  if (!name) { errEl.textContent = "Page name cannot be empty."; return; }
  try {
    await social(`/api/pages/${pageId}/settings`, {
      method: "POST",
      body: JSON.stringify({ name, description, visibility, post_permission, posts_enabled, profile_picture_url: currentPictureUrl }),
    });
    toast("Settings saved");
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById("deleteBtn").addEventListener("click", async () => {
  if (!confirm("Delete this page permanently? This cannot be undone.")) return;
  try {
    await social(`/api/pages/${pageId}/delete`, { method: "POST" });
    window.location.href = "home.html";
  } catch (err) {
    toast(err.message);
  }
});

load();
