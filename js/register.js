document.getElementById("logoImg").src = LOGO_URL;
if (getToken()) window.location.href = "home.html";

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  const errEl = document.getElementById("err");
  errEl.textContent = "";
  btn.textContent = "Creating account...";
  btn.disabled = true;
  try {
    const display_name = document.getElementById("displayName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const data = await social("/api/auth/signup", { method: "POST", body: JSON.stringify({ display_name, email, password }) });
    setSession(data.token, data.user);
    window.location.href = "home.html";
  } catch (err) {
    errEl.textContent = err.message;
    btn.textContent = "Create account";
    btn.disabled = false;
  }
});
