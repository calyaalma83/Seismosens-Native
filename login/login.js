console.log("Login script loaded");
import { auth, signInWithEmailAndPassword, deleteUser, redirectIfAuthenticated } from "../auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";

  // redirect normal hanya jika user sudah login dan bukan delete account
  const alreadyRedirected = await redirectIfAuthenticated();
  if (alreadyRedirected && !fromDelete) return;

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (fromDelete) {
        try {
          await deleteUser(userCredential.user);
          alert("✅ Akun berhasil dihapus permanen");
          sessionStorage.removeItem("fromDeleteAccount"); // hapus flag setelah sukses
          window.location.href = "../onboarding/onboarding.html"; // absolute path
        } catch (err) {
          alert("❌ Gagal hapus akun: " + err.message);
        }
      } else {
        window.location.href = "../seismosens.html"; // absolute path
      }
    } catch (error) {
      alert("Login gagal: " + error.message);
    }
  });
});
