import { 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// 🔹 Ambil auth & db dari firebase.js
import { auth, db } from "./firebase.js";

// ================================
// PERSIST LOGIN
// ================================
setPersistence(auth, browserSessionPersistence);

// Supaya bisa diakses global (opsional untuk debug)
window.auth = auth;
window.db = db;

// ================================
// CEK STATE AUTH
// ================================
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
    window.location.href = "/public/login.html";
    return false;
  }
  return user;
}

// 🔹 Redirect ke home kalau sudah login
async function redirectIfAuthenticated() {
  const user = await checkAuthState();
  const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";

  if (user && !fromDelete) {
    window.location.href = "./seismosens.html"; 
    return true;
  }
  return false;
}

// ================================
// REQUIRE ADMIN
// ================================
async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      console.warn("❌ User tidak ada di Firestore");
      alert("Akun belum terdaftar di database.");
      window.location.href = "/public/seismosens.html";
      return false;
    }

    const role = snap.data().role;
    console.log("👤 Login sebagai:", user.email, "| Role:", role);

    if (role !== "admin") {
      alert("Akses ditolak. Kamu bukan admin.");
      window.location.href = "/public/seismosens.html";
      return false;
    }
    return user;
  } catch (err) {
    console.error("❌ Error requireAdmin:", err);
    alert("Gagal memeriksa hak akses admin.");
    window.location.href = "/public/login.html";
  }
}

// ================================
// REGISTER USER
// ================================
async function registerUser(email, password, nama, role = "user") {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    await setDoc(doc(db, "users", user.uid), {
      email,
      nama,
      role,
      createdAt: serverTimestamp()
    });

    await updateProfile(user, { displayName: nama });

    console.log("✅ Register berhasil:", email);
    return user;
  } catch (err) {
    console.error("❌ Error registerUser:", err);
    throw err;
  }
}

// ================================
// LOGOUT USER
// ================================
async function logoutUser() {
  try {
    await signOut(auth);
    console.log("✅ User logout");
    window.location.href = "/public/login.html";
  } catch (err) {
    console.error("❌ Error logoutUser:", err);
  }
}

// ================================
// EXPORT
// ================================
export { 
  auth,
  db,
  checkAuthState, 
  requireAuth, 
  redirectIfAuthenticated,
  registerUser,
  requireAdmin,
  signInWithEmailAndPassword,
  updateProfile,
  logoutUser
};