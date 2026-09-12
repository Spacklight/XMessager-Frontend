requireLogin();

document.getElementById("findBtn").addEventListener("click", async () => {
  const errEl = document.getElementById("err");
  errEl.textContent = "";
  const email = document.getElementById("email").value.trim();
  if (!email) { errEl.textContent = "Enter an email address."; return; }
  try {
    const user = await social("/api/users/search?email=" + encodeURIComponent(email));
    const chat = await social("/api/chats", { method: "POST", body: JSON.stringify({ user_id: user.id }) });
    window.location.href = "chat.html?id=" + chat.id;
  } catch (err) {
    errEl.textContent = err.message;
  }
});
