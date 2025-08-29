import { auth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, redirectIfAuthenticated } from "../auth.js";

console.log("Register script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  await redirectIfAuthenticated(); // redirect normal jika sudah login

  const form = document.getElementById("registerForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = document.getElementById("nama").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Password dan konfirmasi password tidak sama!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: nama });

      // login langsung user baru
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "../seismosens.html"; // absolute path
    } catch (error) {
      let msg = "Registrasi gagal: ";
      switch (error.code) {
        case "auth/email-already-in-use": msg = "Email sudah terdaftar"; break;
        case "auth/weak-password": msg = "Password terlalu lemah, minimal 6 karakter"; break;
        case "auth/invalid-email": msg = "Format email tidak valid"; break;
        default: msg += error.message;
      }
      alert(msg);
    }
  });
});
