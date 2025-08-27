import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence
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
// Set persistence to local so auth state persists across page refreshes
setPersistence(auth, browserLocalPersistence);

// Check authentication state when app loads
function checkAuthState() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Redirect to login if not authenticated
async function requireAuth() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = 'login/login.html';
    return false;
  }
  return true;
}

// Redirect to home if already authenticated
async function redirectIfAuthenticated() {
  const user = await checkAuthState();
  if (user) {
    window.location.href = 'seismosens.html';
    return true;
  }
  return false;
}

// Export all auth functions that might be needed
export { 
  auth, 
  checkAuthState, 
  requireAuth, 
  redirectIfAuthenticated,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
};
