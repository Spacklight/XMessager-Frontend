if (requireLogin()) {
  document.getElementById("logoImg").src = LOGO_URL;
  document.getElementById("navSlot").outerHTML = renderBottomNav("home");
  const user = getUser();
  const avatarEl = document.getElementById("myAvatar");
  if (user?.profile_picture_url) avatarEl.outerHTML = `<img class="avatar" src="${user.profile_picture_url}">`;
  else avatarEl.textContent = initials(user?.display_name);
  loadFeed();
}

async function loadFeed() {
  const wrap = document.getElementById("reelWrap");
  try {
    const data = await brain("/api/feed");
    if (!data.videos.length) {
      wrap.innerHTML = `<div class="empty" style="color:#fff">No videos yet. Check back soon.</div>`;
      return;
    }
    wrap.innerHTML = data.videos.map(v => `
      <div class="reel">
        <video src="${v.url}" loop muted playsinline preload="metadata"></video>
        <div class="info">
          <h3>${escapeHtml(v.title)}${v.viral ? " 🔥" : ""}</h3>
          <p>${escapeHtml(v.description || "")}</p>
        </div>
        <div class="side">
          <div class="stat"><span class="ico">❤️</span>${v.view_count || 0}</div>
          <div class="stat"><span class="ico">💬</span>0</div>
          <div class="stat"><span class="ico">↗️</span>Share</div>
        </div>
      </div>
    `).join("");

    setupAutoplay(data.videos);
  } catch (err) {
    wrap.innerHTML = `<div class="empty" style="color:#fff">${escapeHtml(err.message)}</div>`;
  }
}

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
