requireLogin();
const pageId = new URLSearchParams(window.location.search).get("id");
const me = getUser();
if (!pageId) window.location.href = "pages.html";

async function loadPage() {
  const postsEl = document.getElementById("posts");
  try {
    const data = await social(`/api/pages/${pageId}/posts`);
    document.getElementById("pageName").textContent = data.page.name;
    document.getElementById("pageAvatar").textContent = initials(data.page.name);

    if (data.page.owner_id === me.id) {
      document.getElementById("composerCard").style.display = "block";
    }

    if (!data.posts.length) {
      postsEl.innerHTML = `<div class="empty">No posts yet.</div>`;
    } else {
      postsEl.innerHTML = data.posts.map(p => `
        <div class="card">
          ${p.media_url && p.media_type === "image" ? `<img src="${p.media_url}" style="width:100%;border-radius:10px;margin-bottom:8px">` : ""}
          <p style="color:var(--text-dark)">${escapeHtml(p.content)}</p>
          <div class="row"><span class="tag">${timeAgo(p.created_at)}</span></div>
        </div>
      `).join("");
    }
  } catch (err) {
    postsEl.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

document.getElementById("postBtn").addEventListener("click", async () => {
  const content = document.getElementById("postContent").value.trim();
  if (!content) return;
  try {
    await social(`/api/pages/${pageId}/posts`, { method: "POST", body: JSON.stringify({ content }) });
    document.getElementById("postContent").value = "";
    loadPage();
  } catch (err) {
    toast(err.message);
  }
});

loadPage();
