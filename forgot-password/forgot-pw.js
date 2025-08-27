import { auth } from "../firebase.js";
import { sendPasswordResetEmail } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

document.getElementById("forgotForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Harap masukkan email Anda.");
    return;
  }

  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert(`Link reset password telah dikirim ke ${email}`);

      const container = document.querySelector(".forgot-container");
      if (container) {
        container.style.animation = "slideFadeOut 0.5s ease forwards";
      }

      setTimeout(() => {
        window.location.href = "../login/login.html";
      }, 500);
    })
    .catch(error => alert("Gagal mengirim reset password: " + error.message));
});
