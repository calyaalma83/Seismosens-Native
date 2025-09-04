import { auth, db, registerUser, redirectIfAuthenticated } from "./auth.js"; 
// ✅ karena register.js & auth.js sama-sama di /public/

console.log("Register script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  // 🔹 Redirect kalau sudah login
  await redirectIfAuthenticated();

  const form = document.getElementById("registerForm");
  if (!form) {
    console.error("Register form not found!");
    return;
  }

  // 🔹 Toggle show/hide password
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.getAttribute("data-target"));
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈"; // ubah jadi hide
      } else {
        input.type = "password";
        btn.textContent = "👁️"; // ubah jadi show
      }
    });
  });

  // 🔹 Handle submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Password dan konfirmasi password tidak sama!");
      return;
    }

    try {
      console.log("Registering user:", email);

      // 🔹 Buat user baru + simpan ke Firestore & Auth
      await registerUser(email, password, nama);

      console.log("Registrasi berhasil:", { nama, email });

      // 🔹 Redirect ke halaman utama setelah sukses
      window.location.href = "./seismosens.html"; // ✅ karena seismosens.html ada di /public/

    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registrasi gagal: ";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email sudah terdaftar";
          break;
        case "auth/weak-password":
          errorMessage = "Password terlalu lemah, minimal 6 karakter";
          break;
        case "auth/invalid-email":
          errorMessage = "Format email tidak valid";
          break;
        default:
          errorMessage += error.message;
      }

      alert(errorMessage);
    }
  });
});
