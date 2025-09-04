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

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ✅ Gunakan app yang sudah diinisialisasi di seismosens.html
const auth = getAuth(window._firebase.app);
const db = getFirestore(window._firebase.app);

// Set persistence supaya login nggak hilang setelah refresh
setPersistence(auth, browserSessionPersistence);

window.auth = auth;

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

// Redirect ke home kalau sudah login
async function redirectIfAuthenticated() {
  const user = await checkAuthState();
  const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";

  if (user && !fromDelete) {
    window.location.href = '/seismosens.html';
    return true;
  }
  return false;
}

// ==================================================
// 🔑 Role Management (user / admin)
// ==================================================
async function registerUser(email, password, role = "user") {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    email,
    role,
    createdAt: serverTimestamp()
  });

  return user;
}

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
  updateProfile,
  fbDeleteUser as deleteUser
};