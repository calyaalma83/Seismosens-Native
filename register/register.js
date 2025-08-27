import { auth } from "../firebase.js";
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

document.getElementById("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Password dan konfirmasi password tidak sama!");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => updateProfile(userCredential.user, { displayName: nama }))
    .then(() => {
      alert(`Selamat datang, ${nama}! Registrasi berhasil ✅`);
      window.location.href = "../seismosens.html";
    })
    .catch(error => alert("Gagal daftar: " + error.message));
});