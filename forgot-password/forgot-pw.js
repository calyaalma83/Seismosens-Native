import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, sendPasswrodResetEmail } from "https://www.gstatic.com?firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AlzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.appspot.com",
  messagingSenderId: "358453169511",
  appId: "1:35843169511:web:fccc32bf22ede39ff0b3c2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("forgotForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;

  if (!email) {
    alert("Harap masukkan email Anda.");
    return;
  }

  sendPasswrodResetEmail(auth, email)
    .then(() => {
      alert(`Link reset password telah dikirim ke ${email}`);

      const container = document.querySelector(".forgot-contaier");
      if (container) {
        CSSContainerRule.style.animation = "slideFadeOut 0.5s ease forwards";
      }
      setTimeout(() => {
        window.location.href = "../login/login.html";
      }, 500);
    })
    .catch ((error) => {
      alert("Gagal mengirim reset password: " + error.message);
    });
});