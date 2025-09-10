import { redirectIfAuthenticated } from "./auth.js";

console.log("Login script loaded");

// Helper function to show error messages
function showError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => { errorElement.style.display = 'none'; }, 5000);
  } else {
    alert(message);
  }
}

// Ambil Firebase services dari window._firebase
const { 
  auth,
  db,
  signInWithEmailAndPassword,
  deleteUser,
  doc,
  getDoc
} = window._firebase;

// Init login
async function initializeLogin() {
  console.log('Initializing login...');

  const form = document.getElementById("loginForm");
  if (!form) {
    console.error('Login form not found!');
    return;
  }

  form.addEventListener("submit", handleLogin);

  // Redirect jika sudah login
  try {
    const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";
    const alreadyRedirected = await redirectIfAuthenticated();
    if (alreadyRedirected && !fromDelete) return;
  } catch (error) {
    console.error('Error checking authentication:', error);
    showError('Terjadi kesalahan saat memeriksa autentikasi');
  }
}

// Handle login form
async function handleLogin(e) {
  e.preventDefault();
  console.log('Login form submission handled');

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitButton = document.querySelector('button[type="submit"]');
  const errorElement = document.getElementById('error-message');

  if (errorElement) {
    errorElement.style.display = 'none';
    errorElement.textContent = '';
  }

  if (!email || !password) {
    showError('Email dan password harus diisi!');
    return;
  }

  try {
    console.log('Attempting login with', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login berhasil:', userCredential.user.uid);

    // Ambil role
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    const userData = userDoc.data();
    const role = userData?.role || "user";

    if (role === "admin") {
      window.location.href = "./admin/admin.html";
    } else {
      window.location.href = "./seismosens.html";
    }

  } catch (error) {
    console.error("Login error:", error);
    switch (error.code) {
      case "auth/user-not-found":
        showError("Email tidak terdaftar");
        break;
      case "auth/wrong-password":
        showError("Password salah");
        break;
      default:
        showError("Login gagal: " + error.message);
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Masuk ke SeismoSens";
    }
  }
}

// Run init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
  initializeLogin();
}