// Import Firebase services from centralized configuration
import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from './firebase.js';

let firebaseInitialized = true; // We're using ES modules, so this is always true

// Wait for Firebase to be initialized
document.addEventListener('firebase-initialized', () => {
    console.log('auth.js: Firebase initialized event received');
    
    // Set auth persistence
    // Note: This is now handled by the Firebase SDK's default behavior
    // which is 'local' persistence by default globally for debugging
    window.auth = auth;
    window.db = db;
});

// Export a function to wait for Firebase to be ready
const getFirebase = async () => {
    if (firebaseInitialized) return { auth, db };
    
    return new Promise((resolve) => {
        const checkInitialized = () => {
            if (firebaseInitialized) {
                resolve({ auth, db });
            } else {
                setTimeout(checkInitialized, 100);
            }
        };
        checkInitialized();
    });
};

// Import Firebase modules dynamically when needed
const getFirestore = async () => {
    const { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } = 
            await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
    return { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp };
};

// Helper function to get Realtime Database functions
async function getRealtimeDatabase() {
  return await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js');
}

// Presence (online offline)
async function setPresence(user) {
  try {
    const { db, rtdb } = await getFirebase();
    const { doc, setDoc, serverTimestamp } = await getFirestore();
    const { ref, onValue, onDisconnect, set } = await getRealtimeDatabase();
    
    const uid = user.uid;
    
    // deteksi device
    const device = `${navigator.platform} - ${navigator.userAgent}`;

  // Firestore (untuk history/log)
  const sessionRef = doc(db, "userDevices", uid, "sessions", "current");
  await setDoc(sessionRef, {
    email: user.email,
    device,
    online: true,
    lastActive: serverTimestamp()
  }, { merge: true });

  // RTDB (untuk real-time presence)
  const userStatusRef = ref(rtdb, `status/${uid}`);
  const isOfflineForDatabase = {
    state: 'offline',
    last_changed: serverTimestamp()
  };

  const isOnlineForDatabase = {
    state: 'online',
    last_changed: serverTimestamp()
  };

  const connectedRef = ref(rtdb, '.info/connected');
  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === false) {
      return;
    }

    onDisconnect(userStatusRef)
      .set(isOfflineForDatabase)
      .then(() => {
        set(userStatusRef, isOnlineForDatabase);
      })
      .catch(error => {
        console.error('Error setting up presence:', error);
      });
  });
} catch (error) {
  console.error('Error in setPresence:', error);
}
}

// Initialize auth state listener when Firebase is ready
(async function initAuthListener() {
  try {
    const { auth } = await getFirebase();
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Auth state changed: User signed in', user.uid);
        setPresence(user).catch(console.error);
      } else {
        console.log('Auth state changed: User signed out');
      }
    });
  } catch (error) {
    console.error('Error initializing auth listener:', error);
  }
})();

// 🔹 Wajib login (kalau belum → redirect ke login)
async function requireAuth() {
  try {
    const { auth } = await getFirebase();
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    
    const user = await checkAuthState();
    if (!user) {
      window.location.href = "/login.html";
      return null;
    }
    
    // Verify the user exists in Firestore
    const { doc, getDoc } = await getFirestore();
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      console.warn("User not found in Firestore");
      await logoutUser();
      window.location.href = "/login.html";
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error in requireAuth:", error);
    window.location.href = "/login.html";
    return null;
  }
}

// 🔹 Redirect ke home kalau sudah login
async function redirectIfAuthenticated() {
  try {
    console.log('Checking authentication state...');
    const user = await checkAuthState();
    const fromDelete = sessionStorage.getItem("fromDeleteAccount") === "true";
    
    console.log('Auth state check result:', { user: user ? 'authenticated' : 'not authenticated', fromDelete });

    if (user && !fromDelete) {
      console.log('User is authenticated, redirecting to /seismosens.html');
      window.location.href = "/seismosens.html"; 
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in redirectIfAuthenticated:', error);
    return false;
  }
}

async function requireAdmin() {
  try {
    const user = await requireAuth();
    if (!user) return false;
    
    const { db } = await getFirebase();
    const { doc, getDoc } = await getFirestore();
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      console.warn("❌ User tidak ada di Firestore");
      alert("Akun belum terdaftar di database.");
      window.location.href = "/seismosens.html";
      return false;
    }

    const role = userDoc.data().role;
    console.log("👤 Login sebagai:", user.email, "| Role:", role);

    if (role !== "admin") {
      alert("Akses ditolak. Kamu bukan admin.");
      window.location.href = "/seismosens.html";
      return false;
    }
    
    return user;
  } catch (error) {
    console.error("❌ Error in requireAdmin:", error);
    alert("Gagal memeriksa hak akses admin: " + (error.message || 'Unknown error'));
    window.location.href = "/login.html";
    return false;
  }
}

// ================================
// REGISTER USER
// ================================
async function registerUser(email, password, nama, role = "user") {
  try {
    const { auth, db } = await getFirebase();
    const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    const { doc, setDoc, serverTimestamp } = await getFirestore();
    
    console.log('Registering user:', { email, nama, role });
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created, updating profile and creating document...');

    // Update user profile with display name
    await updateProfile(user, { displayName: nama });
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email,
      nama,
      role,
      emailVerified: user.emailVerified || false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    // Reload user to get updated profile
    await user.reload();

    console.log("✅ Register berhasil:", { 
      uid: user.uid, 
      email: user.email, 
      displayName: user.displayName,
      role: role
    });
    
    return user;
  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    throw new Error(error.message || 'Failed to register user');
  }
}

// ================================
// LOGOUT USER
// ================================
async function logoutUser() {
    try {
        const { auth } = await getFirebase();
        const { signOut } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
        
        await signOut(auth);
        console.log("✅ User logout");
        window.location.href = "/login.html";
    } catch (err) {
        console.error("❌ Error logoutUser:", err);
    }
}

// ================================
// GOOGLE LOGIN
// ================================
async function loginWithGoogle() {
  try {
    const { auth, db } = await getFirebase();
    const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    const { doc, getDoc, setDoc, serverTimestamp } = await getFirestore();
    
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("✅ Login Google berhasil:", user);

    // Simpan user ke Firestore (jika belum ada)
    const userDoc = doc(db, "users", user.uid);
    const snap = await getDoc(userDoc);
    
    if (!snap.exists()) {
      await setDoc(userDoc, {
        email: user.email,
        nama: user.displayName || "Pengguna",
        role: "user",
        createdAt: serverTimestamp()
      });
    }

    // Redirect ke dashboard
    window.location.href = "./seismosens.html";
  } catch (error) {
    console.error("❌ Error login Google:", error);
    alert("Login dengan Google gagal: " + error.message);
  }
}

// Make it available globally for HTML
window.loginWithGoogle = loginWithGoogle;

// ================================
// DELETE USER
// ================================
async function deleteUser(user) {
  try {
    const { auth } = await getFirebase();
    const { deleteUser: deleteAuthUser } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    
    if (!user) {
      user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
    }
    
    await deleteAuthUser(user);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// ================================
// CEK STATE AUTH
// ================================
async function checkAuthState() {
  try {
    const { auth } = await getFirebase();
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      }, (error) => {
        console.error('Auth state error:', error);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Error in checkAuthState:', error);
    return null;
  }
}

// ================================
// EXPORT
// ================================
export { 
  getFirebase,
  checkAuthState, 
  requireAuth, 
  redirectIfAuthenticated, 
  requireAdmin, 
  registerUser, 
  loginWithGoogle, 
  logoutUser, 
  deleteUser,
  setPresence,
  auth,
  db
};