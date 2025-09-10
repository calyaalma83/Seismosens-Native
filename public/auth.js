import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const {
  auth,
  db,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  deleteUser,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} = window._firebase;

// =======================================
// Auth state listener (log info doang)
// =======================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Auth state changed: User signed in", user.uid);
  } else {
    console.log("Auth state changed: User signed out");
  }
});

// =======================================
// Auth utils
// =======================================
async function checkAuthState() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => resolve(user || null));
  });
}

async function requireAuth() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = "/login.html";
    return null;
  }
  return user;
}

async function redirectIfAuthenticated() {
  const user = await checkAuthState();
  const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";
  if (user && !fromDelete) {
    window.location.href = "/seismosens.html";
    return true;
  }
  return false;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return false;

  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (!userDoc.exists()) {
    alert("Akun belum terdaftar di database.");
    window.location.href = "/seismosens.html";
    return false;
  }

  const role = userDoc.data().role;
  if (role !== "admin") {
    alert("Akses ditolak. Kamu bukan admin.");
    window.location.href = "/seismosens.html";
    return false;
  }

  return user;
}

// =======================================
// Register user
// =======================================
async function registerUser(email, password, nama, role = "user") {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: nama });

  await setDoc(doc(db, "users", user.uid), {
    email,
    nama,
    role,
    emailVerified: user.emailVerified || false,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });

  return user;
}

// =======================================
// Logout
// =======================================
async function logoutUser() {
  await signOut(auth);
  console.log("✅ User logout");
  window.location.href = "/login.html";
}

// =======================================
// Google login
// =======================================
async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = doc(db, "users", user.uid);
    const snap = await getDoc(userDoc);

    if (!snap.exists()) {
      await setDoc(userDoc, {
        email: user.email,
        nama: user.displayName || "Pengguna",
        role: "user",
        createdAt: serverTimestamp(),
      });
    }

    window.location.href = "./seismosens.html";
  } catch (error) {
    console.error("Error login Google:", error);
    alert("Login dengan Google gagal: " + error.message);
  }
}

window.loginWithGoogle = loginWithGoogle;

// =======================================
// Delete user
// =======================================
async function deleteUserAccount(user) {
  if (!user) user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await deleteUser(user);
  return true;
}

function getFirebase() {
  return window._firebase || {};
}

// =======================================
// Export
// =======================================
export {
  checkAuthState,
  requireAuth,
  redirectIfAuthenticated,
  requireAdmin,
  registerUser,
  loginWithGoogle,
  logoutUser,
  deleteUserAccount,
  getFirebase,
};