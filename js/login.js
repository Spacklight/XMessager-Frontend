document.getElementById("logoImg").src = LOGO_URL;
if (getToken()) window.location.href = "home.html";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  const errEl = document.getElementById("err");
  errEl.textContent = "";
  btn.textContent = "Logging in...";
  btn.disabled = true;
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const data = await social("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setSession(data.token, data.user);
    window.location.href = "home.html";
  } catch (err) {
    errEl.textContent = err.message;
    btn.textContent = "Log in";
    btn.disabled = false;
  }
});
