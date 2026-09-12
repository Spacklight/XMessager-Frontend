requireLogin();
const groupId = new URLSearchParams(window.location.search).get("id");
const me = getUser();
document.getElementById("backLink").href = "group.html?id=" + groupId;
if (!groupId) window.location.href = "groups.html";

let currentPictureUrl = null;

async function load() {
  try {
    const data = await social(`/api/groups/${groupId}/messages`);
    const group = data.group;
    if (group.owner_id !== me.id) {
      document.querySelector("main").innerHTML = `<div class="empty">Only the group owner can access settings.</div>`;
      return;
    }
    currentPictureUrl = group.picture_url;
    renderAvatar(group);
    document.getElementById("nameInput").value = group.name;
    document.getElementById("descInput").value = group.description || "";
    document.getElementById("visibilityInput").value = group.visibility;
    document.getElementById("permissionInput").value = group.post_permission;
    document.getElementById("enabledInput").checked = !!group.posts_enabled;
  } catch (err) {
    toast(err.message);
  }
}

function renderAvatar(group) {
  const existing = document.getElementById("groupAvatar");
  if (group.picture_url) {
    const img = document.createElement("img");
    img.className = "avatar avatar-lg";
    img.id = "groupAvatar";
    img.style.margin = "0 auto 12px";
    img.src = group.picture_url;
    existing.replaceWith(img);
  } else {
    existing.textContent = initials(group.name);
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
    const updated = await social(`/api/groups/${groupId}/settings`, { method: "POST", body: JSON.stringify({ picture_url: media.media_url }) });
    currentPictureUrl = updated.picture_url;
    renderAvatar(updated);
    toast("Group logo updated");
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
  if (!name) { errEl.textContent = "Group name cannot be empty."; return; }
  try {
    await social(`/api/groups/${groupId}/settings`, {
      method: "POST",
      body: JSON.stringify({ name, description, visibility, post_permission, posts_enabled, picture_url: currentPictureUrl }),
    });
    toast("Settings saved");
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById("deleteBtn").addEventListener("click", async () => {
  if (!confirm("Delete this group permanently? This cannot be undone.")) return;
  try {
    await social(`/api/groups/${groupId}/delete`, { method: "POST" });
    window.location.href = "home.html";
  } catch (err) {
    toast(err.message);
  }
});

load();
