import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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

const errEl = document.getElementById("err");
const googleBtn = document.getElementById("googleBtn");

async function completeSignIn(firebaseUser) {
  const idToken = await firebaseUser.getIdToken();
  const data = await social("/api/auth/google", { method: "POST", body: JSON.stringify({ id_token: idToken }) });
  setSession(data.token, data.user);
  window.location.href = "home.html";
}

googleBtn.addEventListener("click", async () => {
  errEl.textContent = "";
  googleBtn.disabled = true;
  try {
    const result = await signInWithPopup(auth, provider);
    await completeSignIn(result.user);
  } catch (err) {
    if (["auth/popup-blocked", "auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/operation-not-supported-in-this-environment"].includes(err.code)) {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (err2) {
        errEl.textContent = err2.message || "Sign-in failed";
      }
    } else {
      errEl.textContent = err.message || "Sign-in failed";
    }
    googleBtn.disabled = false;
  }
});

getRedirectResult(auth)
  .then((result) => { if (result) return completeSignIn(result.user); })
  .catch((err) => { errEl.textContent = err.message || "Sign-in failed"; });
