import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZV-J01dW_a2ZGm4HFIIyHGIDeWqXdH3Y",
  authDomain: "registerapp-68127.firebaseapp.com",
  projectId: "registerapp-68127",
  storageBucket: "registerapp-68127.firebasestorage.app",
  messagingSenderId: "102783072556",
  appId: "1:102783072556:web:28fc8c5857e881bd281489",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

document.getElementById("logoImg").src = LOGO_URL;
if (getToken()) window.location.href = "home.html";

document.getElementById("googleBtn").addEventListener("click", () => {
  signInWithRedirect(auth, provider);
});

const errEl = document.getElementById("err");

getRedirectResult(auth)
  .then(async (result) => {
    if (!result) return;
    const idToken = await result.user.getIdToken();
    const data = await social("/api/auth/google", { method: "POST", body: JSON.stringify({ id_token: idToken }) });
    setSession(data.token, data.user);
    window.location.href = "home.html";
  })
  .catch((err) => {
    errEl.textContent = err.message || "Sign-in failed";
  });
