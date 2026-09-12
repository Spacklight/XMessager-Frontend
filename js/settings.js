if (requireLogin()) {
  document.getElementById("logoImg").src = LOGO_URL;
  document.getElementById("navSlot").outerHTML = renderBottomNav("settings");
  loadProfile();
}

let currentPictureUrl = null;

async function loadProfile() {
  try {
    const me = await social("/api/me");
    setSession(getToken(), me);
    currentPictureUrl = me.profile_picture_url;
    renderAvatar(me);
    document.getElementById("profEmail").textContent = me.email;
    document.getElementById("profLocation").textContent = [me.region, me.country].filter(Boolean).join(", ");
    document.getElementById("nameInput").value = me.display_name || "";
    document.getElementById("bioInput").value = me.bio || "";
  } catch (err) {
    toast(err.message);
  }
}

function renderAvatar(user) {
  const existing = document.getElementById("profAvatar");
  if (user.profile_picture_url) {
    const img = document.createElement("img");
    img.className = "avatar avatar-lg";
    img.id = "profAvatar";
    img.style.margin = "0 auto 12px";
    img.src = user.profile_picture_url;
    existing.replaceWith(img);
  } else {
    existing.textContent = initials(user.display_name);
  }
}

document.getElementById("picInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  toast("Uploading photo...");
  try {
    const form = new FormData();
    form.append("file", file);
    const media = await social("/api/media/upload", { method: "POST", body: form });
    const updated = await social("/api/me", { method: "POST", body: JSON.stringify({ profile_picture_url: media.media_url }) });
    setSession(getToken(), updated);
    currentPictureUrl = updated.profile_picture_url;
    renderAvatar(updated);
    toast("Profile picture updated");
  } catch (err) {
    toast(err.message);
  }
  e.target.value = "";
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const errEl = document.getElementById("saveErr");
  errEl.textContent = "";
  const display_name = document.getElementById("nameInput").value.trim();
  const bio = document.getElementById("bioInput").value.trim();
  if (!display_name) { errEl.textContent = "Display name cannot be empty."; return; }
  try {
    const updated = await social("/api/me", { method: "POST", body: JSON.stringify({ display_name, bio, profile_picture_url: currentPictureUrl }) });
    setSession(getToken(), updated);
    toast("Profile saved");
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "login.html";
});
