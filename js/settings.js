if (requireLogin()) {
  document.getElementById("logoImg").src = LOGO_URL;
  document.getElementById("navSlot").outerHTML = renderBottomNav("settings");
  loadProfile();
}

async function loadProfile() {
  try {
    const me = await social("/api/me");
    setSession(getToken(), me);
    const avatarEl = document.getElementById("profAvatar");
    if (me.profile_picture_url) avatarEl.outerHTML = `<img class="avatar avatar-lg" style="margin:0 auto 12px" src="${me.profile_picture_url}">`;
    else avatarEl.textContent = initials(me.display_name);
    document.getElementById("profName").textContent = me.display_name;
    document.getElementById("profEmail").textContent = me.email;
    document.getElementById("profLocation").textContent = [me.region, me.country].filter(Boolean).join(", ");
  } catch (err) {
    toast(err.message);
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "login.html";
});
