import { auth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, redirectIfAuthenticated } from "./auth.js";

console.log("Register script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  // Redirect jika sudah login
  await redirectIfAuthenticated();

  const form = document.getElementById("registerForm");
  if (!form) {
    console.error('Register form not found!');
    return;
  }

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
      console.log("Registering user:", email);
      
      // Buat user baru
      console.log('Creating user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created, updating profile with name:', nama);
      
      // Pastikan user sudah terautentikasi sebelum update profile
      if (auth.currentUser) {
        // Update profile dengan nama
        await updateProfile(auth.currentUser, { 
          displayName: nama 
        });
        
        // Refresh token untuk memastikan data terupdate
        await auth.currentUser.reload();
        
        console.log('Profile updated, verifying displayName:', auth.currentUser.displayName);
      } else {
        console.error('No authenticated user found after registration');
        throw new Error('Authentication failed after registration');
      }

      // Login otomatis setelah registrasi tidak diperlukan karena sudah login
      console.log('Registration successful, user data:', {
        displayName: auth.currentUser.displayName,
        email: auth.currentUser.email,
        uid: auth.currentUser.uid
      });
      
      // Redirect ke halaman utama
      console.log('Redirecting to main page');
      window.location.href = '/seismosens.html';
      
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