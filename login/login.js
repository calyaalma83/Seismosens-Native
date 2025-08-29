console.log('Login script loaded');
import { 
  auth, 
  redirectIfAuthenticated,
  signInWithEmailAndPassword,
  db
} from '../auth.js';

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Kalau sudah login → redirect
redirectIfAuthenticated();

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    console.log('Attempting to sign in with:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🔹 cek role di Firestore
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : "user";

    if (role === "admin") {
      console.log("Login as admin");
      window.location.href = "/admin/admin.html";
    } else {
      console.log("Login as normal user");
      window.location.href = "/seismosens.html";
    }

  } catch (error) {
    let errorMessage = "Login gagal: ";
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage += "Email tidak terdaftar";
        break;
      case 'auth/wrong-password':
        errorMessage += "Password salah";
        break;
      case 'auth/too-many-requests':
        errorMessage += "Terlalu banyak percobaan login. Silakan coba lagi nanti";
        break;
      default:
        errorMessage += error.message;
    }
    alert(errorMessage);
  }
});
