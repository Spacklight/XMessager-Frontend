if (requireLogin()) {
  document.getElementById("logoImg").src = LOGO_URL;
  document.getElementById("navSlot").outerHTML = renderBottomNav("home");
  const user = getUser();
  const avatarEl = document.getElementById("myAvatar");
  if (user?.profile_picture_url) avatarEl.outerHTML = `<img class="avatar" src="${user.profile_picture_url}">`;
  else avatarEl.textContent = initials(user?.display_name);

  const homePromise = loadHome();
  finishPageLoad(homePromise);

  const overlay = document.getElementById("sheetOverlay");
  document.getElementById("fabBtn").addEventListener("click", () => overlay.classList.remove("hidden"));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.add("hidden"); });
}

async function loadHome() {
  const content = document.getElementById("content");
  try {
    const [chatsRes, groupsRes, pagesRes] = await Promise.all([
      social("/api/chats"),
      social("/api/my/groups"),
      social("/api/my/pages"),
    ]);

    let html = "";

    html += `<div class="section-label">Private Chats</div>`;
    if (!chatsRes.chats.length) {
      html += `<div class="empty">No chats yet. Start one from a group member's profile, or search a friend's email below.</div>
        <div style="padding:0 18px 8px"><a href="new-chat.html" class="btn secondary">Start a new chat</a></div>`;
    } else {
      html += chatsRes.chats.map(c => {
        const other = c.other_user || { display_name: "Unknown" };
        return `<a class="list-row" href="chat.html?id=${c.id}">
          ${avatarHtml(other.profile_picture_url, other.display_name)}
          <div class="meta">
            <div class="name">${escapeHtml(other.display_name)}</div>
            <div class="preview">${escapeHtml(c.last_message || "Say hello 👋")}</div>
          </div>
          <div class="time">${timeAgo(c.last_message_at)}</div>
        </a>`;
      }).join("");
    }

    html += `<div class="section-label">Group Chats</div>`;
    if (!groupsRes.groups.length) {
      html += `<div class="empty">You haven't joined any groups yet.</div>`;
    } else {
      html += groupsRes.groups.map(g => `
        <a class="list-row" href="group.html?id=${g.id}">
          ${avatarHtml(g.picture_url, g.name)}
          <div class="meta">
            <div class="name">${escapeHtml(g.name)}</div>
            <div class="preview">${escapeHtml(g.last_message || "No messages yet")}</div>
          </div>
          <div class="time">${timeAgo(g.last_message_at)}</div>
        </a>`).join("");
    }

    html += `<div class="section-label">Pages</div>`;
    if (!pagesRes.pages.length) {
      html += `<div class="empty">You haven't followed or created any pages yet.</div>`;
    } else {
      html += pagesRes.pages.map(p => `
        <a class="list-row" href="page.html?id=${p.id}">
          ${avatarHtml(p.profile_picture_url, p.name)}
          <div class="meta">
            <div class="name">${escapeHtml(p.name)} ${p.my_role === "owner" ? '<span class="badge">Owner</span>' : ''}</div>
            <div class="preview">${escapeHtml(p.description || "")}</div>
          </div>
        </a>`).join("");
    }

    content.innerHTML = html;
  } catch (err) {
    content.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

function avatarHtml(url, name) {
  if (url) return `<img class="avatar" src="${url}">`;
  return `<div class="avatar">${initials(name)}</div>`;
}
