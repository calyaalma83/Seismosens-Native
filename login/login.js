import { auth } from "../firebase.js";
import { signInWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login berhasil 🎉");
      window.location.href = "../seismosens.html";
    })
    .catch(error => alert("Login gagal: " + error.message));
});
