import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword, deleteUser } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { redirectIfAuthenticated } from "./auth.js";
import { setPresence } from "./presence.js";

console.log("Login script loaded");

// Helper function to show error messages
function showError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

console.log("Login script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  console.log('DOM loaded, initializing login...');
  
  // Initialize fromDelete flag at the top level
  const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";
  
  try {
    // Check if user is already logged in
    const alreadyRedirected = await redirectIfAuthenticated();
    if (alreadyRedirected && !fromDelete) return;
  } catch (error) {
    console.error('Error checking authentication:', error);
    showError('Terjadi kesalahan saat memeriksa autentikasi');
  }

  const form = document.getElementById("loginForm");
  if (!form) {
    console.error('Login form not found!');
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log('Login form submitted');

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    console.log('Form values:', { email, password: password ? '***' : 'empty' });
    const submitButton = form.querySelector('button[type="submit"]');
    const errorElement = document.getElementById('error-message');

    // Clear previous errors
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }

    // Basic validation
    if (!email || !password) {
      showError('Email dan password harus diisi!');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Format email tidak valid');
      return;
    }

    // Disable submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.querySelector('.button-text').textContent = 'Memproses...';
    submitButton.querySelector('.button-loader').style.display = 'inline-block';

    try {
      console.log('Attempting to sign in with:', email);
      
      // Sign in user
      console.log('Calling signInWithEmailAndPassword...');
      console.log('Auth object:', auth);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Authentication successful, user:', userCredential.user?.uid);
      
      // Set presence after successful login
      try {
        await setPresence(userCredential.user);
        console.log('Presence set for user');
      } catch (err) {
        console.error("Presence error:", err);
      }      
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      const role = userData?.role || 'user';
      
      console.log("UserDoc exists:", userDoc.exists(), "Data:", userData);
      
      // Small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect based on role
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
      
      if (redirectAfterLogin) {
        // Clear the redirect URL
        sessionStorage.removeItem('redirectAfterLogin');
        console.log("Redirecting to saved page:", redirectAfterLogin);
        window.location.href = redirectAfterLogin.startsWith('http') ? 
          redirectAfterLogin : 
          `/seismosens.html#${redirectAfterLogin}`;
      } else if (role === 'admin') {
        console.log("Redirecting to admin panel...");
        window.location.href = "./admin/admin.html";
      } else {
        console.log("Redirecting to user dashboard...");
        window.location.href = "./seismosens.html";
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
        case 'auth/user-disabled':
          errorMessage = "Akun ini dinonaktifkan";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Koneksi internet bermasalah. Periksa koneksi Anda";
          break;
        default:
          errorMessage = "Terjadi kesalahan. Silakan coba lagi nanti";
          console.error('Login error details:', error);
      }
      
      showError(errorMessage);

      // Handle delete account flow
      if (fromDelete && error.code === 'auth/wrong-password' && userCredential?.user) {
        try {
          await deleteUser(userCredential.user);
          alert("✅ Akun berhasil dihapus permanen");
          sessionStorage.removeItem("fromDeleteAccount");
          window.location.href = '/index.html';
          return; // Exit early after successful deletion
        } catch (err) {
          console.error("Delete account error:", err);
          alert("❌ Gagal menghapus akun: " + err.message);
        }
      }
    } finally {
      // Re-enable the submit button in all cases
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.querySelector('.button-text').textContent = 'Masuk ke SeismoSens';
        submitButton.querySelector('.button-loader').style.display = 'none';
      }
    }
  });

  // Remove duplicate showError function
});