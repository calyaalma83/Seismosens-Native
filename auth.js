import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  deleteUser as fbDeleteUser
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.firebasestorage.app",
  messagingSenderId: "358453169511",
  appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence supaya login nggak hilang setelah refresh
setPersistence(auth, browserSessionPersistence);

window.auth = auth;

// Check authentication state ketika app load
function checkAuthState() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Redirect ke login kalau belum login
async function requireAuth() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = '../login/login.html';
    return false;
  }
  return true;
}

// Redirect ke home kalau sudah login
async function redirectIfAuthenticated() {
  const user = await checkAuthState();
  const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";

  // Hanya redirect normal kalau user sudah login dan bukan proses delete
  if (user && !fromDelete) {
    window.location.href = '../seismosens.html';
    return true;
  }

  // Jangan hapus flag di sini, biar login + delete tetap aman
  return false;
}

// Export semua function penting
export { 
  auth, 
  checkAuthState, 
  requireAuth, 
  redirectIfAuthenticated,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  fbDeleteUser as deleteUser
};
