import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AlzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.appspot.com",
  messagingSenderId: "358453169511",
  appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const nama = document.getElementById("nama").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Password dan konfirmasi password tidak sama!");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("✅ User berhasil dibuat:", user);

      // Update profile (nama)
      return updateProfile(user, { displayName: nama });
    })
    .then(() => {
      alert(`Selamat datang, ${nama}! Registrasi berhasil ✅`);
      localStorage.setItem("hasAccount", "true"); // typo sudah diperbaiki
      console.log("➡️ Redirect ke ../seismosens.html");
      window.location.href = "../seismosens.html";
    })
    .catch((error) => {
      console.error("❌ Error saat register:", error);
      alert("Gagal daftar: " + error.message);
    });
});
