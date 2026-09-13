requireLogin();
const me = getUser();

async function loadStats() {
  const summaryEl = document.getElementById("summaryCard");
  const listEl = document.getElementById("videoList");
  try {
    const pagesData = await social("/api/my/pages");
    const myPageIds = pagesData.pages.filter(p => p.my_role === "owner").map(p => p.id);

    const params = new URLSearchParams({ user_id: me.id });
    if (myPageIds.length) params.set("page_ids", myPageIds.join(","));
    const stats = await brain(`/api/my/stats?${params}`);

    summaryEl.innerHTML = `
      <div class="row" style="justify-content:space-around;text-align:center">
        <div><h3 style="margin:0">${fmtCount(stats.total_followers)}</h3><p>Followers</p></div>
        <div><h3 style="margin:0">${fmtCount(stats.total_views)}</h3><p>Total views</p></div>
        <div><h3 style="margin:0">${fmtCount(stats.total_likes)}</h3><p>Total likes</p></div>
      </div>`;

    if (!stats.videos.length) {
      listEl.innerHTML = `<div class="empty">You haven't uploaded any ads yet.</div>`;
      return;
    }

    listEl.innerHTML = stats.videos.map(v => `
      <div class="card">
        <h3 style="margin:0 0 4px">${escapeHtml(v.title)}</h3>
        <p style="margin:0 0 8px">${escapeHtml(v.description || "")}</p>
        <div class="row" style="justify-content:flex-start;gap:18px">
          <span class="tag">👁 ${fmtCount(v.view_count)}</span>
          <span class="tag">❤️ ${fmtCount(v.like_count)}</span>
          <span class="tag">💬 ${fmtCount(v.comment_count)}</span>
          <span class="tag">🔖 ${fmtCount(v.save_count)}</span>
        </div>
      </div>
    `).join("");
  } catch (err) {
    summaryEl.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
    listEl.innerHTML = "";
  }
}

loadStats();
