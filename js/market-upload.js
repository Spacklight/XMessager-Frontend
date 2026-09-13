requireLogin();
const me = getUser();

document.querySelectorAll('input[name="uploaderType"]').forEach((radio) => {
  radio.addEventListener("change", async (e) => {
    const pageWrap = document.getElementById("pageSelectWrap");
    if (e.target.value === "page") {
      pageWrap.style.display = "block";
      try {
        const data = await social("/api/my/pages");
        const myPages = data.pages.filter(p => p.my_role === "owner");
        const select = document.getElementById("pageSelect");
        select.innerHTML = myPages.length
          ? myPages.map(p => `<option value="${p.id}" data-name="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join("")
          : `<option value="">You don't own any pages yet — create one first</option>`;
      } catch (err) {
        toast(err.message);
      }
    } else {
      pageWrap.style.display = "none";
    }
  });
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const errEl = document.getElementById("uploadErr");
  errEl.textContent = "";
  const category = document.getElementById("categorySelect").value;
  const title = document.getElementById("titleInput").value.trim();
  const description = document.getElementById("descInput").value.trim();
  const file = document.getElementById("mediaInput").files[0];
  const uploaderType = document.querySelector('input[name="uploaderType"]:checked').value;

  if (!title || !file) { errEl.textContent = "Title and a photo/video are required."; return; }

  let pageId = null, pageName = null;
  if (uploaderType === "page") {
    const select = document.getElementById("pageSelect");
    pageId = select.value;
    pageName = select.selectedOptions[0] ? select.selectedOptions[0].dataset.name : null;
    if (!pageId) { errEl.textContent = "Select a page to post as, or choose Individual."; return; }
  }

  const btn = document.getElementById("uploadBtn");
  btn.textContent = "Uploading...";
  btn.disabled = true;

  try {
    const form = new FormData();
    form.append("video", file);
    form.append("title", title);
    form.append("description", description);
    form.append("uploader", me.display_name);
    form.append("category", category);
    form.append("uploader_type", uploaderType);
    form.append("uploader_user_id", me.id);
    if (pageId) form.append("page_id", pageId);
    if (pageName) form.append("page_name", pageName);

    await brain("/api/upload", { method: "POST", body: form });
    toast("Upload successful");
    window.location.href = "market.html";
  } catch (err) {
    errEl.textContent = err.message;
    btn.textContent = "Upload";
    btn.disabled = false;
  }
});
