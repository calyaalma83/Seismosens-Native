import { auth, signInWithEmailAndPassword, deleteUser, redirectIfAuthenticated, db } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

console.log("Login script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";

  // Redirect jika sudah login dan bukan dari delete account
  const alreadyRedirected = await redirectIfAuthenticated();
  if (alreadyRedirected && !fromDelete) return;

  const form = document.getElementById("loginForm");
  if (!form) {
    console.error('Login form not found!');
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Email dan password harus diisi!");
      return;
    }

    try {
      console.log('Attempting to sign in with:', email);
      
      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check user role in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.exists() ? userDoc.data().role : "user";

      // Redirect based on role
      if (role === "admin") {
        console.log("Login as admin");
        window.location.href = "../admin/admin.html";
      } else {
        console.log("Login as normal user");
        window.location.href = '/public/seismosens.html';
      }
      
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login gagal: ";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "Email tidak terdaftar";
          break;
        case 'auth/wrong-password':
          errorMessage = "Password salah";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Terlalu banyak percobaan login. Silakan coba lagi nanti";
          break;
        case 'auth/invalid-email':
          errorMessage = "Format email tidak valid";
          break;
        default:
          errorMessage += error.message;
      }
      
      alert(errorMessage);

      // Handle delete account flow
      if (fromDelete && error.code === 'auth/wrong-password') {
        try {
          await deleteUser(userCredential?.user);
          alert("✅ Akun berhasil dihapus permanen");
          sessionStorage.removeItem("fromDeleteAccount");
          window.location.href = '/public/index.html';
        } catch (err) {
          console.error("Delete account error:", err);
          alert("❌ Gagal menghapus akun: " + err.message);
        }
      }
    }
  });
});