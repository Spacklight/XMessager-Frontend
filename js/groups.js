if (requireLogin()) {
  document.getElementById("logoImg").src = LOGO_URL;
  document.getElementById("navSlot").outerHTML = renderBottomNav("groups");
  loadGroups();
}

async function loadGroups() {
  const list = document.getElementById("list");
  try {
    const data = await social("/api/groups");
    if (!data.groups.length) {
      list.innerHTML = `<div class="empty">No public groups yet — be the first to create one.</div>`;
      return;
    }
    list.innerHTML = data.groups.map(g => `
      <div class="card">
        <h3>${escapeHtml(g.name)}</h3>
        <p>${escapeHtml(g.description || "")}</p>
        <div class="row">
          <span class="tag">${g.country || g.continent || "Global"}</span>
          <button class="btn" style="width:auto;padding:8px 16px" onclick="joinGroup('${g.id}')">Join</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

async function joinGroup(id) {
  try {
    await social(`/api/groups/${id}/join`, { method: "POST" });
    window.location.href = "group.html?id=" + id;
  } catch (err) {
    toast(err.message);
  }
}

document.getElementById("createBtn").addEventListener("click", async () => {
  const errEl = document.getElementById("createErr");
  errEl.textContent = "";
  const name = document.getElementById("gName").value.trim();
  const description = document.getElementById("gDesc").value.trim();
  const visibility = document.getElementById("gVisibility").value;
  if (!name) { errEl.textContent = "Group name is required."; return; }
  try {
    const group = await social("/api/groups", { method: "POST", body: JSON.stringify({ name, description, visibility }) });
    window.location.href = "group.html?id=" + group.id;
  } catch (err) {
    errEl.textContent = err.message;
  }
});
