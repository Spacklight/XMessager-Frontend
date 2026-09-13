const me = getUser();

if (requireLogin()) {
  document.getElementById("logoImg").src = LOGO_URL;
  document.getElementById("navSlot").outerHTML = renderBottomNav("home");
  const avatarEl = document.getElementById("myAvatar");
  if (me?.profile_picture_url) avatarEl.outerHTML = `<img class="avatar" src="${me.profile_picture_url}">`;
  else avatarEl.textContent = initials(me?.display_name);
  finishPageLoad(loadFeed());
}

let currentVideoId = null;
let videosById = {};
let soundEnabled = false;

function toggleSound() {
  soundEnabled = !soundEnabled;
  document.querySelectorAll(".reel video").forEach((v) => { v.muted = !soundEnabled; });
  document.querySelectorAll(".mute-toggle").forEach((b) => { b.textContent = soundEnabled ? "🔊" : "🔇"; });
}

const ICONS = {
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C12 21 4 14.2 4 9.2C4 6.3 6.3 4 9.2 4C10.7 4 12 4.9 12 4.9C12 4.9 13.3 4 14.8 4C17.7 4 20 6.3 20 9.2C20 14.2 12 21 12 21Z"/></svg>`,
  comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18v13H8l-5 5V4z"/><line x1="6.5" y1="8" x2="17.5" y2="8"/><line x1="6.5" y1="11.5" x2="17.5" y2="11.5"/><line x1="6.5" y1="15" x2="14" y2="15"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="2.8"/><circle cx="6" cy="12" r="2.8"/><circle cx="18" cy="19" r="2.8"/><line x1="8.3" y1="10.5" x2="15.5" y2="6.5"/><line x1="8.3" y1="13.5" x2="15.5" y2="17.5"/></svg>`,
};

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
    await waitFirstVideoReady();
  } catch (err) {
    wrap.innerHTML = `<div class="empty" style="color:#fff">${escapeHtml(err.message)}</div>`;
  }
}

function waitFirstVideoReady() {
  return new Promise((resolve) => {
    const firstVideo = document.querySelector(".reel video");
    if (!firstVideo || firstVideo.readyState >= 1) return resolve();
    firstVideo.addEventListener("loadedmetadata", () => resolve(), { once: true });
    setTimeout(resolve, 2000);
  });
}

function renderReel(v) {
  const displayName = v.uploader_type === "page" ? (v.page_name || "Page") : (v.uploader || "Individual");
  return `<div class="reel" data-video-id="${v.id}">
    <div class="video-shimmer" id="shimmer-${v.id}"></div>
    <video src="${v.url}" loop playsinline preload="metadata" muted></video>
    <button class="mute-toggle" onclick="toggleSound()">${soundEnabled ? "🔊" : "🔇"}</button>
    <div class="info">
      <div class="uploader-row">
        <strong>${escapeHtml(displayName)}</strong>
        <button class="follow-btn ${v.is_following ? "following" : ""}" id="follow-${v.id}" onclick="toggleFollow('${v.id}')">${v.is_following ? "Following" : "Follow"}</button>
      </div>
      <h3 style="margin:0 0 4px">${escapeHtml(v.title)}${v.viral ? " 🔥" : ""}</h3>
      <p style="margin:0">${escapeHtml(v.description || "")}</p>
      ${v.location_description ? `<p class="loc">📍 ${escapeHtml(v.location_description)}</p>` : ""}
    </div>
    <div class="side">
      <div class="side-item">
        <button class="side-btn ${v.liked_by_me ? "active" : ""}" id="like-${v.id}" onclick="toggleLike('${v.id}')">${ICONS.heart}</button>
        <span class="side-count" id="like-count-${v.id}">${fmtCount(v.like_count)}</span>
      </div>
      <div class="side-item">
        <button class="side-btn" onclick="openComments('${v.id}')">${ICONS.comment}</button>
        <span class="side-count">${fmtCount(v.comment_count)}</span>
      </div>
      <div class="side-item">
        <button class="side-btn ${v.saved_by_me ? "active" : ""}" id="save-${v.id}" onclick="toggleSave('${v.id}')">${ICONS.bookmark}</button>
        <span class="side-count" id="save-count-${v.id}">${fmtCount(v.save_count)}</span>
      </div>
      <div class="side-item">
        <button class="side-btn" onclick="shareVideo('${v.id}')">${ICONS.share}</button>
        <span class="side-count" id="share-count-${v.id}">${fmtCount(v.share_count)}</span>
      </div>
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
    const btn = document.getElementById(`follow-${id}`);
    btn.textContent = res.following ? "Following" : "Follow";
    btn.classList.toggle("following", res.following);
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

  reels.forEach((reel) => {
    const video = reel.querySelector("video");
    const shimmer = reel.querySelector(".video-shimmer");

    const hideShimmer = () => { shimmer.classList.add("shimmer-hidden"); };
    if (video.readyState >= 3) hideShimmer();
    video.addEventListener("canplay", hideShimmer);
    video.addEventListener("waiting", () => shimmer.classList.remove("shimmer-hidden"));
    video.addEventListener("playing", hideShimmer);

    // Tap the video to pause/resume manually.
    video.addEventListener("click", () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector("video");
      const idx = reels.indexOf(entry.target);
      if (entry.isIntersecting) {
        video.muted = !soundEnabled;
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
