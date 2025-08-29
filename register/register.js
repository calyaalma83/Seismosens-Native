import { 
  registerUser,
  redirectIfAuthenticated,
  updateProfile,
  signInWithEmailAndPassword,
  auth
} from '../auth.js';

// Debug info
console.log('Register script loaded');

// Kalau sudah login → redirect ke home
redirectIfAuthenticated().then(() => {
  const form = document.getElementById('registerForm');
  if (!form) {
    console.error('Register form not found!');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nama = document.getElementById("nama").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Password dan konfirmasi password tidak sama!");
      return;
    }

    try {
      console.log("Registering user:", email);

      // 🔹 Panggil registerUser dari auth.js (default role = user)
      const user = await registerUser(email, password, "user");

      // Update profile (nama)
      await updateProfile(user, { displayName: nama });

      // Login ulang biar state sinkron
      await signInWithEmailAndPassword(auth, email, password);

      // Redirect ke home
      window.location.href = "/seismosens.html";

    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registrasi gagal: ";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Email sudah terdaftar";
          break;
        case 'auth/weak-password':
          errorMessage = "Password terlalu lemah, minimal 6 karakter";
          break;
        case 'auth/invalid-email':
          errorMessage = "Format email tidak valid";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Koneksi internet bermasalah. Silakan coba lagi.";
          break;
        default:
          errorMessage = `Terjadi kesalahan: ${error.message}`;
      }
      alert(errorMessage);
    }
  });
});