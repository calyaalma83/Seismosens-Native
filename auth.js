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

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.appspot.com",
  messagingSenderId: "358453169511",
  appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2"
};

// 🔹 Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set supaya login bertahan walau refresh
setPersistence(auth, browserLocalPersistence);

// 🔹 Cek state login
function checkAuthState() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// 🔹 Wajib login (kalau belum → redirect ke login)
async function requireAuth() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = '/login/login.html';
    return false;
  }
  return user;
}

// 🔹 Kalau sudah login → redirect ke app
async function redirectIfAuthenticated() {
  const user = await checkAuthState();
  if (user) {
    window.location.href = '/seismosens.html';
    return true;
  }
  return false;
}

// ==================================================
// 🔑 Tambahan untuk Role Management (user / admin)
// ==================================================

// Register user baru (default: role=user)
async function registerUser(email, password, role = "user") {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Simpan ke Firestore
  await setDoc(doc(db, "users", user.uid), {
    email,
    role,
    createdAt: serverTimestamp()
  });

  return user;
}

// Cek apakah user admin
async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    alert("Akses ditolak. Anda bukan admin.");
    window.location.href = "/seismosens.html";
    return false;
  }
  return user;
}

// ==================================================
// 🔹 Export supaya bisa dipakai file lain
// ==================================================
export { 
  auth,
  db,
  checkAuthState, 
  requireAuth, 
  redirectIfAuthenticated,
  registerUser,
  requireAdmin,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
};