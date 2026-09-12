requireLogin();
const pageId = new URLSearchParams(window.location.search).get("id");
const me = getUser();
if (!pageId) window.location.href = "pages.html";

async function loadPage() {
  const postsEl = document.getElementById("posts");
  try {
    const data = await social(`/api/pages/${pageId}/posts`);
    const page = data.page;
    document.getElementById("pageName").textContent = page.name;

    const wrap = document.getElementById("pageAvatarWrap");
    wrap.innerHTML = page.profile_picture_url
      ? `<img class="avatar" src="${page.profile_picture_url}">`
      : `<div class="avatar">${initials(page.name)}</div>`;

    const isOwner = page.owner_id === me.id;
    if (isOwner) {
      const link = document.getElementById("settingsLink");
      link.style.display = "inline";
      link.href = "page-settings.html?id=" + pageId;
    }

    const showComposer = page.posts_enabled && (isOwner || page.post_permission === "followers");
    document.getElementById("composerCard").style.display = showComposer ? "block" : "none";

    if (!data.posts.length) {
      postsEl.innerHTML = `<div class="empty">No posts yet.</div>`;
    } else {
      postsEl.innerHTML = data.posts.map(renderPost).join("");
    }
  } catch (err) {
    postsEl.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

function renderPost(p) {
  let mediaHtml = "";
  if (p.media_url) {
    if (p.media_type === "image") mediaHtml = `<img src="${p.media_url}" style="width:100%;border-radius:10px;margin-bottom:8px">`;
    else if (p.media_type === "video") mediaHtml = `<video src="${p.media_url}" controls style="width:100%;border-radius:10px;margin-bottom:8px"></video>`;
    else if (p.media_type === "audio") mediaHtml = `<audio src="${p.media_url}" controls style="width:100%;margin-bottom:8px"></audio>`;
    else if (p.media_type === "pdf") mediaHtml = `<a href="${p.media_url}" target="_blank" class="btn secondary" style="margin-bottom:8px;display:block">📄 View PDF attachment</a>`;
  }
  return `<div class="card" data-post-id="${p.id}">
    ${mediaHtml}
    <p style="color:var(--text-dark)">${escapeHtml(p.content)}</p>
    <div class="row"><span class="tag">${timeAgo(p.created_at)}</span></div>
    <div class="post-actions">
      <button class="like-btn ${p.liked_by_me ? "liked" : ""}" onclick="toggleLike('${p.id}', this)">❤️ <span class="like-count">${p.like_count}</span></button>
      <button onclick="toggleComments('${p.id}')">💬 <span class="comment-count">${p.comment_count}</span></button>
      <button onclick="sharePost('${p.id}', this)">↗️ <span class="share-count">${p.share_count || 0}</span></button>
    </div>
    <div class="comments-panel" id="comments-${p.id}">
      <div class="comment-list" id="comment-list-${p.id}"></div>
      <div class="comment-input-row">
        <input type="text" id="comment-input-${p.id}" placeholder="Write a comment...">
        <button class="icon-btn" style="width:34px;height:34px" onclick="addComment('${p.id}')">➤</button>
      </div>
    </div>
  </div>`;
}

async function toggleLike(postId, btn) {
  try {
    const res = await social(`/api/pages/${pageId}/posts/${postId}/like`, { method: "POST" });
    btn.classList.toggle("liked", res.liked);
    btn.querySelector(".like-count").textContent = res.like_count;
  } catch (err) {
    toast(err.message);
  }
}

async function toggleComments(postId) {
  const panel = document.getElementById(`comments-${postId}`);
  const isOpen = panel.classList.toggle("open");
  if (isOpen) await loadComments(postId);
}

async function loadComments(postId) {
  const listEl = document.getElementById(`comment-list-${postId}`);
  listEl.innerHTML = `<div class="empty" style="padding:8px">Loading...</div>`;
  try {
    const data = await social(`/api/pages/${pageId}/posts/${postId}/comments`);
    listEl.innerHTML = data.comments.length
      ? data.comments.map(c => `
        <div class="comment-row">
          ${c.profile_picture_url ? `<img class="avatar" style="width:28px;height:28px" src="${c.profile_picture_url}">` : `<div class="avatar" style="width:28px;height:28px;font-size:.7rem">${initials(c.display_name)}</div>`}
          <div><div class="bubble-name">${escapeHtml(c.display_name)}</div><div class="bubble-text">${escapeHtml(c.content)}</div></div>
        </div>`).join("")
      : `<div class="empty" style="padding:8px">No comments yet.</div>`;
  } catch (err) {
    listEl.innerHTML = `<div class="empty" style="padding:8px">${escapeHtml(err.message)}</div>`;
  }
}

async function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;
  input.value = "";
  try {
    await social(`/api/pages/${pageId}/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) });
    await loadComments(postId);
    const card = document.querySelector(`[data-post-id="${postId}"]`);
    const countEl = card.querySelector(".comment-count");
    countEl.textContent = parseInt(countEl.textContent, 10) + 1;
  } catch (err) {
    toast(err.message);
  }
}

async function sharePost(postId, btn) {
  try {
    await social(`/api/pages/${pageId}/posts/${postId}/share`, { method: "POST" });
    const countEl = btn.querySelector(".share-count");
    countEl.textContent = parseInt(countEl.textContent, 10) + 1;
    const url = `${window.location.origin}/page.html?id=${pageId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast("Link copied to clipboard"));
    } else {
      toast("Shared!");
    }
  } catch (err) {
    toast(err.message);
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

document.getElementById("inviteLink").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = prompt("Enter your friend's email to invite them to this page:");
  if (!email) return;
  try {
    const user = await social("/api/users/search?email=" + encodeURIComponent(email.trim()));
    await social(`/api/pages/${pageId}/invite`, { method: "POST", body: JSON.stringify({ user_id: user.id }) });
    toast("Invited " + user.display_name);
  } catch (err) {
    toast(err.message);
  }
});

loadPage();
