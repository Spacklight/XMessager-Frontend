if (requireLogin()) {
  document.getElementById("logoImg").src = LOGO_URL;
  document.getElementById("navSlot").outerHTML = renderBottomNav("pages");
  loadPages();
}

async function loadPages() {
  const list = document.getElementById("list");
  try {
    const data = await social("/api/pages");
    if (!data.pages.length) {
      list.innerHTML = `<div class="empty">No public pages yet — be the first to create one.</div>`;
      return;
    }
    list.innerHTML = data.pages.map(p => `
      <div class="card">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description || "")}</p>
        <div class="row">
          <span class="tag">${p.country || p.continent || "Global"}</span>
          <button class="btn" style="width:auto;padding:8px 16px" onclick="followPage('${p.id}')">Follow</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

async function followPage(id) {
  try {
    await social(`/api/pages/${id}/follow`, { method: "POST" });
    window.location.href = "page.html?id=" + id;
  } catch (err) {
    toast(err.message);
  }
}

document.getElementById("createBtn").addEventListener("click", async () => {
  const errEl = document.getElementById("createErr");
  errEl.textContent = "";
  const name = document.getElementById("pName").value.trim();
  const description = document.getElementById("pDesc").value.trim();
  const visibility = document.getElementById("pVisibility").value;
  if (!name) { errEl.textContent = "Page name is required."; return; }
  try {
    const page = await social("/api/pages", { method: "POST", body: JSON.stringify({ name, description, visibility }) });
    window.location.href = "page.html?id=" + page.id;
  } catch (err) {
    errEl.textContent = err.message;
  }
});
