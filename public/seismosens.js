// Import Firebase services from our centralized firebase.js
import { 
  auth,
  db,
  rtdb,
  // Auth functions
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  onAuthStateChanged,
  // Firestore functions
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  deleteDoc,
  // Realtime Database functions
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  push
} from './firebase.js';

const surakartaCenter = [-7.566667, 110.816667];

let map;
let mapInitialized = false;
let chart;

// Protected pages that require authentication
const PROTECTED_PAGES = ['profile', 'devices', 'settings'];

// ===== Navigation =====
// Store the real implementation
const realSwitchPage = function(pageName, event) {
  if (event) event.preventDefault();

  try {
    // reset nav
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    const clickedItem = event?.target.closest(".nav-item") ||
      document.querySelector(`.nav-item[onclick*="${pageName}"]`);
    if (clickedItem) clickedItem.classList.add("active");

    // reset pages
    document.querySelectorAll(".page-content").forEach(p => p.classList.remove("active"));
    
    // show target page
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
      targetPage.classList.add("active");
    } else {
      console.warn(`switchPage: Halaman "${pageName}-page" tidak ditemukan`);
      return false;
    }
    
    // update URL
    window.history.pushState({}, '', `#${pageName}`);
    
    // scroll to top
    window.scrollTo(0, 0);
    
    // special handling for specific pages
    if (pageName === 'home') {
      if (typeof chart !== 'undefined' && chart) chart.update();
      if (!mapInitialized) initializeMap();
    } else if (pageName === 'map') {
      if (!mapInitialized) initializeMap();
      // Force map to resize when tab becomes visible
      setTimeout(() => {
        if (typeof map !== 'undefined' && map) map.invalidateSize();
      }, 100);
    }
    
    return true;
  } catch (error) {
    console.error('Error in switchPage:', error);
    return false;
  }
};

// ===== Profile & Settings Functions =====

// ...

// Initialize language when the app starts
initializeLanguage();

// ===== Expose to window =====
window._realSwitchPage = realSwitchPage;
window.switchPage = realSwitchPage;
window.showSetting = showSetting;
window.initApp = initApp;

// fungsi lain tetap di-expose
window.initializeMap = initializeMap;
// ...
window.zoomOut = zoomOut;
window.centerMap = centerMap;
window.showNotifications = showNotifications;
window.showDeviceDetail = showDeviceDetail;
window.showLocationDetail = showLocationDetail;
window.showQuickActions = showQuickActions;
window.listenDeviceStats = listenDeviceStats;
window.updateTime = updateTime;
window.logout = logout;
window.updateProfileUI = updateProfileUI;
window.addForumPost = addForumPost;
window.loadForumPosts = loadForumPosts;
window.deleteAccountFlow = deleteAccountFlow;
window.setLanguage = setLanguage;

window.deleteAccount = async function () {
  if (confirm('Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.')) {
    try {
      const user = window._firebase.auth.currentUser;
      if (user) {
        await deleteUser(user);
        alert('Akun berhasil dihapus');
        window.location.href = '/login.html';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Gagal menghapus akun: ' + error.message);
    }
  }
};

async function deleteAccountFlow() {
  try {
    // Step 1: Konfirmasi awal
    const confirmed = confirm("⚠️ Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.");
    if (!confirmed) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Tidak ada user yang login.");
      return;
    }

    // Step 2: Minta password
    const password = prompt("Masukkan password anda agar bisa menghapus akun:");
    if (!password) {
      alert("Password wajib diisi untuk menghapus akun.");
      return;
    }

    // Step 3: Re-authenticate
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Step 4: Hapus data pengguna dari Firestore terlebih dahulu
    try {
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);
    } catch (error) {
      console.warn("Gagal menghapus data pengguna dari Firestore:", error);
      // Lanjutkan meskipun gagal hapus dari Firestore
    }

    // Step 5: Hapus akun
    await firebaseDeleteUser(user);
    alert("✅ Akun berhasil dihapus.");
    window.location.href = "/login.html";

  } catch (error) {
    console.error("Error deleting account:", error);
    if (error.code === "auth/wrong-password") {
      alert("❌ Password salah. Akun tidak dihapus.");
    } else if (error.code === "auth/requires-recent-login") {
      alert("Demi keamanan, silakan login ulang sebelum menghapus akun.");
      window.location.href = "/login.html";
    } else {
      alert("Gagal menghapus akun: " + error.message);
    }
  }
}

// Debug
function initializeDebug() {
  try {
    // Add debug info to the page
    const debugInfo = document.createElement('div');
    debugInfo.id = 'debug-info';
    debugInfo.style.position = 'fixed';
    debugInfo.style.bottom = '10px';
    debugInfo.style.right = '10px';
    debugInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugInfo.style.color = 'white';
    debugInfo.style.padding = '10px';
    debugInfo.style.borderRadius = '5px';
    debugInfo.style.fontFamily = 'monospace';
    debugInfo.style.fontSize = '12px';
    debugInfo.style.zIndex = '9999';
    
    // Add debug info content
    debugInfo.innerHTML = 'Debug Info:<br>Loading...';
    document.body.appendChild(debugInfo);
    
    // Update debug info periodically
    setInterval(() => {
      try {
        const user = auth.currentUser;
        debugInfo.innerHTML = `
          <strong>Debug Info:</strong><br>
          User: ${user ? user.email : 'Not logged in'}<br>
          UID: ${user ? user.uid : 'N/A'}<br>
          Time: ${new Date().toLocaleTimeString()}
        `;
      } catch (error) {
        console.error('Error updating debug info:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('Error initializing debug info:', error);
  }
}

// Initialize debug info when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeDebug();
    
    // Check auth state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is signed in:', user.uid);
      } else {
        console.log('No user is signed in');
      }
    });
    
    // Initialize other components
    initChart();
    
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});