const me = getUser();

if (requireLogin()) {
  document.getElementById("logoImg").src = LOGO_URL;
  document.getElementById("navSlot").outerHTML = renderBottomNav("home");
  const avatarEl = document.getElementById("myAvatar");
  if (me?.profile_picture_url) avatarEl.outerHTML = `<img class="avatar" src="${me.profile_picture_url}">`;
  else avatarEl.textContent = initials(me?.display_name);
  loadFeed();
}

let currentVideoId = null;
let videosById = {};

async function loadFeed() {
  const wrap = document.getElementById("reelWrap");
  try {
    const data = await brain(`/api/feed?user_id=${encodeURIComponent(me.id)}`);
    if (!data.videos.length) {
      wrap.innerHTML = `<div class="empty" style="color:#fff">No ads yet. Be the first to grow your business here.</div>`;
      return;
    }
    videosById = {};
    data.videos.forEach(v => videosById[v.id] = v);

    wrap.innerHTML = data.videos.map(renderReel).join("");
    setupAutoplay(data.videos);
  } catch (err) {
    wrap.innerHTML = `<div class="empty" style="color:#fff">${escapeHtml(err.message)}</div>`;
  }
}

function renderReel(v) {
  const displayName = v.uploader_type === "page" ? (v.page_name || "Page") : (v.uploader || "Individual");
  return `<div class="reel">
    <video src="${v.url}" loop muted playsinline preload="metadata"></video>
    <div class="info">
      <div class="uploader-row"><strong>${escapeHtml(displayName)}</strong></div>
      <h3 style="margin:0 0 4px">${escapeHtml(v.title)}${v.viral ? " 🔥" : ""}</h3>
      <p style="margin:0">${escapeHtml(v.description || "")}</p>
      ${v.location_description ? `<p class="loc">📍 ${escapeHtml(v.location_description)}</p>` : ""}
    </div>
    <div class="side">
      <div class="side-avatar-wrap">
        <div class="avatar">${initials(displayName)}</div>
        <div class="side-follow-badge" id="follow-${v.id}" onclick="toggleFollow('${v.id}')">+</div>
      </div>
      <button class="side-btn ${v.liked_by_me ? "active" : ""}" id="like-${v.id}" onclick="toggleLike('${v.id}')">❤️<span id="like-count-${v.id}">${fmtCount(v.like_count)}</span></button>
      <button class="side-btn" onclick="openComments('${v.id}')">💬<span>${fmtCount(v.comment_count)}</span></button>
      <button class="side-btn ${v.saved_by_me ? "active" : ""}" id="save-${v.id}" onclick="toggleSave('${v.id}')">🔖<span id="save-count-${v.id}">${fmtCount(v.save_count)}</span></button>
      <button class="side-btn" onclick="shareVideo('${v.id}')">↗️<span id="share-count-${v.id}">${fmtCount(v.share_count)}</span></button>
    </div>
  </div>`;
}

async function toggleLike(id) {
  try {
    const res = await brain(`/api/videos/${id}/like`, { method: "POST", body: JSON.stringify({ user_id: me.id }) });
    document.getElementById(`like-${id}`).classList.toggle("active", res.liked);
    document.getElementById(`like-count-${id}`).textContent = fmtCount(res.like_count);
  } catch (err) {
    toast(err.message);
  }
}

async function toggleSave(id) {
  try {
    const res = await brain(`/api/videos/${id}/save`, { method: "POST", body: JSON.stringify({ user_id: me.id }) });
    document.getElementById(`save-${id}`).classList.toggle("active", res.saved);
    document.getElementById(`save-count-${id}`).textContent = fmtCount(res.save_count);
  } catch (err) {
    toast(err.message);
  }
}

async function shareVideo(id) {
  try {
    await brain(`/api/videos/${id}/share`, { method: "POST" });
    const v = videosById[id];
    if (v) v.share_count = (v.share_count || 0) + 1;
    document.getElementById(`share-count-${id}`).textContent = fmtCount(v ? v.share_count : 1);
    toast("Shared!");
  } catch (err) {
    toast(err.message);
  }
}

async function toggleFollow(id) {
  const v = videosById[id];
  if (!v) return;
  const followedType = v.uploader_type === "page" ? "page" : "individual";
  const followedId = v.uploader_type === "page" ? v.page_id : v.uploader_user_id;
  if (!followedId) { toast("This ad has no linked account to follow"); return; }
  try {
    const res = await brain("/api/videos/follow", {
      method: "POST",
      body: JSON.stringify({ followed_type: followedType, followed_id: followedId, follower_user_id: me.id }),
    });
    const badge = document.getElementById(`follow-${id}`);
    badge.textContent = res.following ? "✓" : "+";
    badge.classList.toggle("following", res.following);
  } catch (err) {
    toast(err.message);
  }
}

function openComments(id) {
  currentVideoId = id;
  document.getElementById("videoCommentsOverlay").classList.remove("hidden");
  loadVideoComments(id);
}

async function loadVideoComments(id) {
  const list = document.getElementById("videoCommentList");
  list.innerHTML = `<div class="empty">Loading...</div>`;
  try {
    const data = await brain(`/api/videos/${id}/comments`);
    list.innerHTML = data.comments.length
      ? data.comments.map(c => `
        <div class="comment-row">
          <div class="avatar" style="width:28px;height:28px;font-size:.7rem">${initials(c.user_name)}</div>
          <div><div class="bubble-name">${escapeHtml(c.user_name)}</div><div class="bubble-text">${escapeHtml(c.content)}</div></div>
        </div>`).join("")
      : `<div class="empty">No comments yet.</div>`;
  } catch (err) {
    list.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

document.getElementById("videoCommentsOverlay").addEventListener("click", (e) => {
  if (e.target.id === "videoCommentsOverlay") e.currentTarget.classList.add("hidden");
});

document.getElementById("videoCommentSend").addEventListener("click", async () => {
  const input = document.getElementById("videoCommentInput");
  const content = input.value.trim();
  if (!content || !currentVideoId) return;
  input.value = "";
  try {
    await brain(`/api/videos/${currentVideoId}/comments`, {
      method: "POST",
      body: JSON.stringify({ user_id: me.id, user_name: me.display_name, content }),
    });
    loadVideoComments(currentVideoId);
  } catch (err) {
    toast(err.message);
  }
});

function setupAutoplay(videos) {
  const wrap = document.getElementById("reelWrap");
  const reels = [...wrap.querySelectorAll(".reel")];
  const counted = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector("video");
      const idx = reels.indexOf(entry.target);
      if (entry.isIntersecting) {
        video.play().catch(() => {});
        if (!counted.has(idx)) {
          counted.add(idx);
          brain(`/api/videos/${videos[idx].id}/view`, { method: "POST" }).catch(() => {});
        }
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.6 });

  reels.forEach((r) => observer.observe(r));
}
