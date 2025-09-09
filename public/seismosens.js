// Import Firebase services from centralized module
import { 
  auth, 
  db, 
  rtdb,
  onAuthStateChanged,
  signOut,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  ref,
  set,
  onValue,
  onDisconnect,
  update,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  deleteUser as firebaseDeleteUser
} from "./firebase-init.js";

// Global state
let isInitialized = false;

const surakartaCenter = [-7.566667, 110.816667];

let map;
let mapInitialized = false;
let chart;

// Protected pages that require authentication
const PROTECTED_PAGES = ['profile', 'devices', 'settings'];

// ===== Navigation =====
async function switchPage(pageName, event) {
  if (event) event.preventDefault();
  console.log('switchPage called with:', pageName);
  
  try {
    // Ensure auth is initialized
    if (!isInitialized) {
      console.log('Waiting for auth initialization...');
      await new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkAuth = () => {
          if (isInitialized) {
            resolve();
          } else if (Date.now() - startTime > 5000) {
            console.warn('Auth initialization timeout, continuing anyway');
            isInitialized = true; // Force continue
            resolve();
          } else {
            setTimeout(checkAuth, 100);
          }
        };
        checkAuth();
      });
    }
    
    // Check if page requires authentication
    const requiresAuth = PROTECTED_PAGES.includes(pageName);
    const currentUser = auth.currentUser;
    
    // If page requires auth but no user is logged in, redirect to login
    if (requiresAuth && !currentUser) {
      console.log('Authentication required, saving target page and redirecting to login');
      sessionStorage.setItem('redirectAfterLogin', pageName);
      window.location.href = '/login.html';
      return;
    }
    
    // Clear any previous redirect URL
    if (sessionStorage.getItem('redirectAfterLogin')) {
      sessionStorage.removeItem('redirectAfterLogin');
    }
    
    // Update active navigation
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    
    // Find and activate the clicked navigation item
    const clickedItem = event?.target?.closest(".nav-item") ||
      document.querySelector(`.nav-item[onclick*="${pageName}"]`);
      
    if (clickedItem) {
      clickedItem.classList.add("active");
    }
    
    // Hide all pages
    document.querySelectorAll(".page-content").forEach(p => p.classList.remove("active"));
    
    // Show the selected page
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
      
      // Initialize specific page content if needed
      try {
        if (pageName === 'map' && !mapInitialized) {
          await initializeMap();
        } else if (pageName === 'profile') {
          await updateProfileUI();
        } else if (pageName === 'forum') {
          await loadForumPosts();
        } else if (pageName === 'home') {
          // Initialize home page components
          if (typeof initChart === 'function') initChart();
          if (typeof listenDeviceStats === 'function') listenDeviceStats();
        }
      } catch (error) {
        console.error(`Error initializing ${pageName} page:`, error);
      }
      
      // Update URL without page reload
      window.history.pushState({ page: pageName }, '', `#${pageName}`);
      
      // Scroll to top of the page
      window.scrollTo(0, 0);
    } else {
      console.error(`Page not found: ${pageName}`);
      // Fallback to home page if target page not found
      if (pageName !== 'home') {
        switchPage('home');
      }
    }
  } catch (error) {
    console.error('Error in switchPage:', error);
  }
}


import { initPresence } from "./presence.js";
import { auth, onAuthStateChanged } from "./firebase-init.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize presence when user is signed in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is signed in, initializing presence");
      initPresence(user);
    } else {
      console.log("No user is signed in");
    }
  });
});

// ===== Profile & Settings Functions =====

/**
 * Show a specific setting/page in the profile section
 * @param {string} settingName - The name of the setting/page to show
 */
function showSetting(settingName) {
    // Hide all page contents first
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page
    const pageId = `${settingName.toLowerCase().replace(/\s+/g, '-')}-page`;
    const targetPage = document.getElementById(pageId);
    
    if (targetPage) {
        targetPage.classList.add('active');
        return;
    }

    // If page doesn't exist, create it
    const pageContent = getSettingContent(settingName);
    if (!pageContent) {
        console.warn(`No content found for setting: ${settingName}`);
        return;
    }

    // Create and append the new page
    const newPage = document.createElement('div');
    newPage.id = pageId;
    newPage.className = 'page-content';
    newPage.innerHTML = `
        <div class="page-header">
            <button class="btn-back" onclick="showSetting('Profile')">
                <i class="icon-arrow">←</i> Kembali
            </button>
            <h2>${settingName}</h2>
        </div>
        <div class="page-content-inner">
            ${pageContent}
        </div>
    `;
    
    document.querySelector('.main-content').appendChild(newPage);
    newPage.classList.add('active');
}

/**
 * Get the HTML content for a specific setting
 * @param {string} settingName - The name of the setting
 * @returns {string} The HTML content for the setting
 */
function getSettingContent(settingName) {
    const contents = {
        'Edit Profil': `
            <div class="edit-profile-container">
                <div class="profile-form">
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" id="editUsername" class="form-control" placeholder="Masukkan username">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password Lama (Untuk konfirmasi)</label>
                        <input type="password" id="confirmPassword" class="form-control" placeholder="Masukkan password lama">
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="saveProfile()">Simpan Perubahan</button>
                        <button class="btn btn-outline" onclick="showSetting('Profile')">Batal</button>
                    </div>
                </div>
            </div>
        `,
        'Notifikasi': `
            <div class="settings-section">
                <div class="setting-item">
                    <div class="setting-info">
                        <h3>Notifikasi Aplikasi</h3>
                        <p>Aktifkan atau nonaktifkan notifikasi</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="notificationsEnabled" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <div class="setting-info">
                        <h3>Notifikasi Email</h3>
                        <p>Terima pemberitahuan melalui email</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="emailNotificationsEnabled" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        `,
        'Bahasa': `
            <div class="settings-section">
              <div class="setting-item" onclick="setLanguage('id')">
                <div class="setting-icon">🇮🇩</div>
                <div class="setting-info">
                  <h3>Bahasa Indonesia</h3>
                </div>
              </div>
              <div class="setting-item" onclick="setLanguage('en')">
                <div class="setting-icon">🇬🇧</div>
                <div class="setting-info">
                  <h3>English</h3>
                </div>
              </div>
              <div class="setting-item" onclick="setLanguage('jp')">
                <div class="setting-icon">🇯🇵</div>
                <div class="setting-info">
                  <h3>日本語</h3>
                </div>
              </div>
            </div>
        `,
        'Tema': `
            <div class="settings-section">
                <div class="setting-item" onclick="setTheme('light')">
                    <div class="setting-icon">☀️</div>
                    <div class="setting-info">
                        <h3>Terang</h3>
                        <p>Tema terang standar</p>
                    </div>
                    <div class="setting-arrow">›</div>
                </div>
                <div class="setting-item" onclick="setTheme('dark')">
                    <div class="setting-icon">🌙</div>
                    <div class="setting-info">
                        <h3>Gelap</h3>
                        <p>Tema gelap yang nyaman di malam hari</p>
                    </div>
                    <div class="setting-arrow">›</div>
                </div>
                <div class="setting-item" onclick="setTheme('system')">
                    <div class="setting-icon">🖥️</div>
                    <div class="setting-info">
                        <h3>Sesuai Perangkat</h3>
                        <p>Mengikuti pengaturan tema perangkat</p>
                    </div>
                    <div class="setting-arrow">›</div>
                </div>
            </div>
        `,
        'Bantuan': `
            <div class="help-section">
                <h3>Pusat Bantuan</h3>
                <p>Berikut adalah beberapa pertanyaan yang sering diajukan:</p>
                
                <div class="help-item">
                    <div class="help-content">
                        <h4>Bagaimana cara mengubah password?</h4>
                        <p>Untuk mengubah password, buka Pengaturan > Keamanan > Ubah Password.</p>
                    </div>
                </div>
                
                <div class="help-item">
                    <div class="help-content">
                        <h4>Bagaimana cara menghubungi dukungan?</h4>
                        <p>Anda dapat menghubungi tim dukungan kami melalui email di support@seismosens.id</p>
                    </div>
                </div>
                
                <div class="contact-support">
                    <p>Tidak menemukan jawaban yang Anda cari?</p>
                    <button class="btn btn-primary" onclick="showSetting('Hubungi Kami')">Hubungi Dukungan</button>
                </div>
            </div>
        `,
        'Hubungi Kami': `
            <div class="contact-container">
                <h3>Kirim Pesan ke Tim Dukungan</h3>
                <p>Silakan isi form di bawah ini untuk menghubungi tim dukungan kami.</p>
                
                <form id="supportForm" class="contact-form">
                    <div class="form-group">
                        <label for="contactName">Nama Lengkap</label>
                        <input type="text" id="contactName" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="contactEmail">Email</label>
                        <input type="email" id="contactEmail" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="contactSubject">Subjek</label>
                        <input type="text" id="contactSubject" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="contactMessage">Pesan</label>
                        <textarea id="contactMessage" rows="5" class="form-control" required></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Kirim Pesan</button>
                </form>
                
                <div id="contactSuccess" class="success-message" style="display: none;">
                    <p>Terima kasih! Pesan Anda telah terkirim. Tim kami akan segera merespons.</p>
                </div>
                
                <div class="contact-info">
                    <h4>Atau hubungi kami melalui:</h4>
                    <p>📧 Email: support@seismosens.id</p>
                    <p>📱 WhatsApp: +62 812-3456-7890</p>
                    <p>🕒 Jam Operasional: Senin - Jumat, 09:00 - 17:00 WIB</p>
                </div>
            </div>
            
            <style>
                .contact-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .contact-form {
                    background: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin: 20px 0;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                
                .form-control {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                }
                
                textarea.form-control {
                    min-height: 120px;
                    resize: vertical;
                }
                
                .contact-info {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                
                .success-message {
                    background: #d4edda;
                    color: #155724;
                    padding: 15px;
                    border-radius: 4px;
                    margin: 15px 0;
                    text-align: center;
                }
            </style>
        `,
        'Tentang': `
            <div class="about-container">
                <div class="app-logo">🌋</div>
                <h1>SeismoSens</h1>
                <p class="version">Versi 2.1.0</p>
                
                <div class="about-section">
                    <p>SeismoSens adalah aplikasi monitoring gempa yang membantu Anda tetap aman dengan memberikan peringatan dini dan informasi gempa terkini.</p>
                </div>
                
                <div class="about-section">
                    <h3>Tim Pengembang</h3>
                    <p>Dikembangkan dengan ❤️ oleh Tim SeismoSens</p>
                </div>
                
                <div class="about-links">
                    <a href="#" class="link">Kebijakan Privasi</a>
                    <span>•</span>
                    <a href="#" class="link">Syarat & Ketentuan</a>
                </div>
                
                <p class="copyright">© 2025 SeismoSens. Seluruh hak cipta dilindungi.</p>
            </div>
        `
    };

    return contents[settingName] || null;
}

/**
 * Save user profile changes
 */
async function saveProfile() {
  try {
    // Get form values
    const usernameInput = document.getElementById("editUsername");
    const oldPasswordInput = document.getElementById("confirmPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    
    const username = usernameInput?.value.trim();
    const oldPassword = oldPasswordInput?.value.trim();
    const newPassword = newPasswordInput?.value.trim();
    const confirmNewPassword = confirmNewPasswordInput?.value.trim();
    
    const user = auth.currentUser;
    if (!user) throw new Error("Anda harus login terlebih dahulu");
    if (!username) throw new Error("Username tidak boleh kosong");
    if (!oldPassword) throw new Error("Password lama wajib diisi");
    
    // Validate passwords if changing
    if (newPassword) {
      if (newPassword !== confirmNewPassword) {
        throw new Error("Password baru tidak cocok");
      }
      if (newPassword.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }
    }
    
    // Show loading state
    const saveBtn = document.querySelector("#profileForm button[type='submit']");
    const originalBtnText = saveBtn?.textContent;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }
    
    // 1. Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    
    // 2. Update display name if changed
    if (user.displayName !== username) {
      await updateProfile(user, { displayName: username });
    }
    
    // 3. Update password if changed
    if (newPassword) {
      await updatePassword(user, newPassword);
    }
    
    // 4. Update user data in Firestore
    const userRef = doc(db, "users", user.uid);
    const userData = {
      username: username,
      email: user.email,
      updatedAt: serverTimestamp(),
      photoURL: user.photoURL || ""
    };
    
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      await updateDoc(userRef, userData);
    } else {
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        devices: []
      });
    }
    
    // 5. Update Realtime Database
    const rtdbRef = ref(rtdb, `users/${user.uid}/profile`);
    await update(rtdbRef, userData);
    
    // Show success message
    showToast("✅ Profil berhasil diperbarui", "success");
    
    // Update UI
    if (typeof updateProfileUI === 'function') {
      await updateProfileUI();
    }
    
    // Switch back to profile view
    window.switchPage?.("profile");
    
  } catch (error) {
    console.error("Gagal memperbarui profil:", error);
    
    let errorMessage = "Gagal memperbarui profil";
    switch (error.code) {
      case "auth/wrong-password":
        errorMessage = "Password lama salah";
        break;
      case "auth/requires-recent-login":
        errorMessage = "Sesi login sudah kadaluwarsa. Silakan login ulang.";
        setTimeout(() => window.location.href = "/login.html", 2000);
        break;
      case "auth/weak-password":
        errorMessage = "Password terlalu lemah. Minimal 6 karakter.";
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    showToast(`❌ ${errorMessage}`, "error");
  } finally {
    // Reset button state
    const saveBtn = document.querySelector("#profileForm button[type='submit']");
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalBtnText || "Simpan Perubahan";
    }
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = "info") {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }, 100);
}

/**
 * Set the application theme to light mode
 */
function setLightTheme() {
    // Set light theme and save preference
    localStorage.setItem('theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
}

/**
 * Initialize the profile page with user data
 */
function initProfile() {
    try {
        const user = window._firebase?.auth.currentUser;
        if (!user) {
            console.log('No user is signed in');
            return;
        }

        // Update profile info
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileAvatar = document.getElementById('profileAvatar');

        if (profileName) profileName.textContent = user.displayName || 'Pengguna';
        if (profileEmail) profileEmail.textContent = user.email || '';
        if (profileAvatar) {
            profileAvatar.textContent = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
            // Add random gradient
            const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
            const color1 = colors[Math.floor(Math.random() * colors.length)];
            const color2 = colors[Math.floor(Math.random() * colors.length)];
            profileAvatar.style.background = `linear-gradient(45deg, ${color1}, ${color2})`;
        }
    } catch (error) {
        console.error('Error initializing profile:', error);
    }
}

// Handle hash-based navigation
function handleHashNavigation() {
    const hash = window.location.hash.substring(1); // Remove the '#'
    if (hash) {
        // If there's a hash, navigate to that page
        switchPage(hash);
    } else {
        // Default to map page if no hash
        switchPage('map');
    }
}

// Initialize authentication state listener
async function initAuthState() {
  try {
    // Wait for Firebase to be ready
    const { auth } = await import('./firebase-init.js');
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        isInitialized = true;
        
        if (user) {
          console.log('User is signed in:', user.uid);
          // Update UI for authenticated user
          updateUIForAuthState(user);
          
          // Check for redirect after login
          const redirectPage = sessionStorage.getItem('redirectAfterLogin') || 'home';
          if (redirectPage) {
            sessionStorage.removeItem('redirectAfterLogin');
            await switchPage(redirectPage);
          }
        } else {
          console.log('No user is signed in');
          // User is signed out, redirect to login if on protected page
          const currentPage = getPageFromUrl();
          if (PROTECTED_PAGES.includes(currentPage)) {
            window.location.href = '/login.html';
          }
          updateUIForAuthState(null);
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Error initializing auth state:', error);
    isInitialized = true; // Continue even if auth fails
    return Promise.resolve();
  }
}

// Update UI based on authentication state
// Update UI based on authentication state
function updateUIForAuthState(user) {
  try {
    const authElements = document.querySelectorAll('[data-auth]');
    const unauthElements = document.querySelectorAll('[data-unauth]');
    
    if (user) {
      // User is signed in
      authElements.forEach(el => el.style.display = '');
      unauthElements.forEach(el => el.style.display = 'none');
      
      // Update user info if elements exist
      const userNameElements = document.querySelectorAll('[data-user-name]');
      const userEmailElements = document.querySelectorAll('[data-user-email]');
      const userAvatarElements = document.querySelectorAll('[data-user-avatar]');
      
      const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
      const firstLetter = displayName.charAt(0).toUpperCase();
      
      userNameElements.forEach(el => el.textContent = displayName);
      userEmailElements.forEach(el => el.textContent = user.email || '');
      
      userAvatarElements.forEach(el => {
        if (el.tagName === 'IMG' && user.photoURL) {
          el.src = user.photoURL;
          el.alt = displayName;
        } else if (el.tagName !== 'IMG') {
          el.textContent = firstLetter;
        }
      });
      
      // Update profile UI if user is signed in
      updateProfileUI();
      if (typeof initPresence === 'function') {
        initPresence(user);
      }
    } else {
      // User is signed out
      authElements.forEach(el => el.style.display = 'none');
      unauthElements.forEach(el => el.style.display = '');
    }
  } catch (error) {
    console.error('Error updating UI for auth state:', error);
  }
}

// Update the form submission handler to use the correct collection name and add better error handling
document.addEventListener('submit', async (e) => {
  if (e.target && e.target.id === 'supportForm') {
      e.preventDefault();
      
      const form = e.target;
      const submitBtn = form.querySelector('button[type="submit"]');
      const successMessage = document.getElementById('contactSuccess');
      
      try {
          // Show loading state
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Mengirim...';
          
          // Get current user
          const user = window._firebase?.auth.currentUser;
          if (!user) {
              throw new Error('Anda harus login terlebih dahulu');
          }

          // Get form data
          const formData = {
              name: document.getElementById('contactName')?.value.trim() || 'No Name',
              email: user.email || document.getElementById('contactEmail')?.value.trim() || 'no-email@example.com',
              subject: document.getElementById('contactSubject')?.value.trim() || 'No Subject',
              message: document.getElementById('contactMessage')?.value.trim() || 'No Message',
              status: 'new',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              userId: user.uid,
              userEmail: user.email || '',
              resolved: false
          };

          console.log('Attempting to save support ticket:', formData);

          // Import Firestore functions
          const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
          
          // Get Firestore instance
          const db = getFirestore();
          
          // Add the document to the 'support' collection (matching your rules)
          const docRef = await addDoc(collection(db, 'support'), {
              ...formData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
          });

          console.log('Support ticket submitted with ID:', docRef.id);
          
          // Show success message
          if (form) form.style.display = 'none';
          if (successMessage) successMessage.style.display = 'block';
          
          // Reset form
          if (form) form.reset();
          
      } catch (error) {
          console.error('Error details:', {
              name: error.name,
              message: error.message,
              code: error.code,
              stack: error.stack
          });
          alert(`Gagal mengirim pesan: ${error.message || 'Terjadi kesalahan. Silakan coba lagi nanti.'}`);
      } finally {
          // Reset button state
          if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Kirim Pesan';
          }
      }
  }
});

// Make functions available globally
window.showSetting = showSetting;
window.saveProfile = saveProfile;
window.setTheme = setTheme;

// ===== App Init =====
async function initApp() {
  try {
    console.log('Initializing app components...');
    
    // Set light theme
    setLightTheme();
    
    // Initialize time display
    updateTime();
    setInterval(updateTime, 1000);
    
    // Initialize map if on map page
    if (window.location.hash === "#map") {
      initializeMap();
    }
    
    // Load public data
    loadForumPosts();
    
    // If user is authenticated, load protected data
    const user = auth.currentUser;
    if (user) {
      console.log("User authenticated:", {
        uid: user.uid, 
        email: user.email, 
        displayName: user.displayName
      });
      
      // Initialize user-specific components
      await updateProfileUI();
      listenDeviceStats();
      listenUserDevicesCount();
      listenUserDataUsage();
      
      // Initialize presence
      initPresence(user);
      
      // Navigate to home or requested page
      const targetPage = getPageFromUrl() || 'home';
      await switchPage(targetPage);
    } else {
      console.log("No authenticated user, showing public content");
      // Navigate to login if trying to access protected page
      const targetPage = getPageFromUrl();
      if (targetPage && PROTECTED_PAGES.includes(targetPage)) {
        window.location.href = '/login.html';
      }
    }
    
    console.log('App initialization complete');
  } catch (error) {
    console.error("Error initializing app:", error);
    // Show error to user if needed
    const errorEl = document.getElementById('app-error');
    if (errorEl) {
      errorEl.textContent = 'Terjadi kesalahan saat memuat aplikasi. Silakan muat ulang halaman.';
      errorEl.style.display = 'block';
    }
  }
}

// Helper function to get target page from URL
function getPageFromUrl() {
  const hash = window.location.hash.replace('#', '');
  return hash || null;
}

// ===== Map =====
let markers = [];
let userMarker = null;

function initializeMap() {
  try {
    if (typeof L === "undefined") {
      setTimeout(initializeMap, 100);
      return;
    }

    map = L.map("map").setView(surakartaCenter, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const { rtdb, ref, onValue } = window._firebase;
    const devicesRef = ref(rtdb, "devices");

    onValue(devicesRef, (snapshot) => {
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        if (snapshot.exists()) {
            const devices = snapshot.val();
            Object.entries(devices).forEach(([id, dev]) => {
                if (dev.lat && dev.lng) {
                    const marker = L.marker([dev.lat, dev.lng]).addTo(map);
                    marker.bindPopup(`<b>${id}</b><br>${dev.name}<br>${dev.status}`);
                    markers.push(marker);
                }
            });
        }
    });

    // untuk pantau lokasi user
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                if (!userMarker) {
                    // Create a custom blue dot icon
                    const blueDotIcon = L.divIcon({
                        className: 'blue-dot-icon',
                        html: '<div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                        popupAnchor: [0, -10]
                    });
                    userMarker = L.marker([lat, lng], {
                        icon: blueDotIcon
                    }).addTo(map).bindPopup("📍 Perangkat Anda");
                } else {
                    userMarker.setLatLng([lat, lng]);
                }
            },
            (err) => {
                console.error("Gagal ambil lokasi user:", err);
                alert("Lokasi tidak bisa diakses. Aktifkan GPS atau izinkan akses lokasi di browser.");
            },
            { enableHighAccuracy: true }
        );
    }

    mapInitialized = true;
  } catch (error) {
    console.error("Error initializing map:", error);
    const mapElement = document.getElementById("map");
    if (mapElement) {
      mapElement.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;
                    background:#f8fafc;color:#64748b;text-align:center;">
          <div>
            <div style="font-size:24px;margin-bottom:10px;">🗺</div>
            <div>Peta Surakarta</div>
            <div style="font-size:12px;margin-top:5px;">Interactive map akan dimuat</div>
          </div>
        </div>`;
    }
    setTimeout(initializeMap, 1000);
  }
}

function zoomIn() { if (map) map.zoomIn(); }
function zoomOut() { if (map) map.zoomOut(); }
function centerMap() { if (map) map.setView(surakartaCenter, 13); }

// ===== UI helpers =====
function showNotifications() { alert("Notifikasi akan ditampilkan di sini"); }
function showDeviceDetail(deviceName) { console.log("Device detail:", deviceName); }
function showLocationDetail(locationName) { console.log("Location detail:", locationName); }
function showQuickActions() {
  const el = document.getElementById("quickActions");
  if (el) el.style.display = el.style.display === "none" ? "flex" : "none";
}

async function logout() {
  if (!confirm('Apakah Anda yakin ingin keluar?')) {
    return;
  }
  
  try {
    // Sign out from Firebase
    await signOut(auth);
    
    // Clear any local storage/session data if needed
    localStorage.removeItem('userToken');
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error during logout:', error);
    alert('Terjadi kesalahan saat mencoba keluar. Silakan coba lagi.');
  }
}

function listenDeviceStats() {
    const { rtdb, ref, onValue } = window._firebase;
    const devicesRef = ref(rtdb, "devices");

    onValue(devicesRef, (snapshot) => {
        if (!snapshot.exists()) return;

        const devices = snapshot.val();
        let total = 0, online = 0, warning = 0, offline = 0, healthSum = 0;

        Object.values(devices).forEach(dev => {
            total ++;
            if (dev.status === "online") online ++;
            else if (dev.status === "warning") warning++;
            else if (dev.status === "offline") offline++;
            if (typeof dev.health === "number") healthSum += dev.health;
        });

        const avgHealth = total > 0 ? Math.round(healthSum / total) : 0;

        //update stats section (kalau ada)
        const stats = {
            activeDevices: total,
            alert: warning,
            avgResponse: `${online} Online / ${offline} Offline`
        };
        document.querySelectorAll(".stat-value").forEach(el => {
            const t = el.getAttribute("data-stat");
            if (t in stats) el.textContent = stats[t];
        });

        //Update quick stats (home header)
        const elTotal = document.querySelector(".quick-stat-value[data-stat='total']");
        const elOnline = document.querySelector(".quick-stat-value[data-stat='online']");
        const elHealth = document.querySelector(".quick-stat-value[data-stat='health']");

        if (elTotal) elTotal.textContent = total;
        if (elOnline) elOnline.textContent = online;
        if (elHealth) elHealth.textContent = avgHealth + "%";
    });
}

//Profile Realtime
function listenUserDevicesCount() {
    const { rtdb, ref, onValue } = window._firebase;
    const devicesRef = ref(rtdb, "devices");
    const user = window._firebase.auth.currentUser;

    if (!user) return;

    onValue(devicesRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const devices = snapshot.val();
        let myCount = 0;

        Object.values(devices).forEach(dev => {
            if (dev.ownerUid === user.uid) myCount++;
        });

        const el = document.getElementById("devicesCount");
        if (el) el.textContent = myCount;
    });
}

function updateActiveDays(userCreatedAt) {
    const now = new Date();
    const created = new Date(userCreatedAt);
    const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    const el = document.getElementById("activeDays");
    if (el) el.textContent = diff;
}

function listenUserDataUsage() {
    const { db } = window._firebase;
    const user = window._firebase.auth.currentUser;
    if (!user) return;

    const usageRef = doc(db, "users", user.uid);

    onSnapshot(usageRef, (snap) => {
        if (snap.exists()) {
            const usage = snap.data().dataUsage || 0;
            const el = document.getElementById("dataUsage");
            if (el) el.textContent = `${(usage / (1024*1024*1024)).toFixed(1)} GB`;
        }
    });
}

function updateTime() {
  const now = new Date();
  const timeString = now.getHours().toString().padStart(2, "0") + ":" +
                     now.getMinutes().toString().padStart(2, "0");
  const timeElement = document.querySelector(".status-bar div");
  if (timeElement) timeElement.textContent = timeString;
}

// ===== Sample devices =====
// const devices = []

// ===== Profile =====
async function updateProfileUI() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("Tidak ada user yang login");
      return;
    }

    const greetingName   = document.getElementById("greetingName");
    const profileName    = document.getElementById("profileName");
    const profileEmail   = document.getElementById("profileEmail");
    const profileAvatar  = document.getElementById("profileAvatar");
    const elDevicesCount = document.getElementById("devicesCount");
    const elActiveDays   = document.getElementById("activeDays");
    const elDataUsage    = document.getElementById("dataUsage");
    const joinDateEl     = document.querySelector(".join-date");

    // Update basic profile info
    const displayName = user.displayName || "Pengguna";
    if (greetingName)  greetingName.textContent  = displayName;
    if (profileName)   profileName.textContent   = displayName;
    if (profileEmail)  profileEmail.textContent  = user.email || "";
    if (profileAvatar) profileAvatar.textContent = (displayName[0] || "U").toUpperCase();

    // Update profile picture if available
    if (user.photoURL) {
      profileAvatar.src = user.photoURL;
      profileAvatar.style.display = 'block';
    }

    // 🔹 1. Hitung jumlah perangkat milik user
    const devicesRef = ref(rtdb, "devices");
    onValue(devicesRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const devices = snapshot.val();
      let myCount = 0;
      Object.values(devices).forEach(dev => {
        if (dev.ownerUid === user.uid) myCount++;
      });
      if (elDevicesCount) elDevicesCount.textContent = myCount;
    }, (error) => {
      console.error("Error fetching devices:", error);
    });

    // 🔹 2. Hitung hari aktif
    if (user.metadata?.creationTime) {
      const created = new Date(user.metadata.creationTime);
      const diff = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
      if (elActiveDays) elActiveDays.textContent = diff;
      
      if (joinDateEl) {
        joinDateEl.textContent = `Bergabung pada ${created.toLocaleDateString('id-ID', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        })}`;
      }
    }

    // 🔹 3. Data usage
    const userRef = ref(rtdb, `users/${user.uid}/dataUsage`);
    onValue(userRef, (snap) => {
      if (snap.exists()) {
        const usage = snap.val(); // byte
        const gb = (usage / (1024*1024*1024)).toFixed(1);
        if (elDataUsage) elDataUsage.textContent = `${gb}GB`;
      } else {
        // Fallback
        const devicesRef = ref(rtdb, "devices");
        onValue(devicesRef, (snapshot) => {
          if (!snapshot.exists()) return;
          const devices = snapshot.val();
          let totalBytes = 0;

          Object.values(devices).forEach(dev => {
            if (dev.ownerUid === user.uid && dev.dataUsage) {
              totalBytes += dev.dataUsage;
            }
          });

          const gb = (totalBytes / (1024*1024*1024)).toFixed(1);
          if (elDataUsage) elDataUsage.textContent = `${gb}GB`;
        });
      }
    });

  } catch (error) {
    console.error("Error in updateProfileUI:", error);
  }
}


// ===== Chart.js =====
// Chart variable is already declared at the top of the file

function updateChart(displacement, vibration) {
  try {
    if (!chart) {
      console.warn('Chart not initialized');
      return;
    }
    
    // Add new data point
    const now = new Date();
    const timeLabel = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
    
    // Add new data
    chart.data.labels.push(timeLabel);
    chart.data.datasets[0].data.push(displacement);
    chart.data.datasets[1].data.push(vibration);
    
    // Keep only last 20 data points for performance
    const maxDataPoints = 20;
    if (chart.data.labels.length > maxDataPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
      chart.data.datasets[1].data.shift();
    }
    
    chart.update();
  } catch (error) {
    console.error('Error updating chart:', error);
  }
}

function initChart() {
  try {
    const canvas = document.getElementById("myChart");
    if (!canvas) {
      console.warn('Chart canvas not found');
      return;
    }
    
    if (typeof Chart === "undefined") {
      console.error('Chart.js is not loaded');
      return;
    }

    // Destroy existing chart instance if it exists
    if (chart) {
      chart.destroy();
      chart = null;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error('Could not get 2D context for chart');
      return;
    }

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Displacement (cm)",
            data: [],
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.3)",
            fill: true,
            tension: 0.4
          },
          {
            label: "Vibration Magnitude",
            data: [],
            borderColor: "rgba(239, 68, 68, 1)",
            backgroundColor: "rgba(239, 68, 68, 0.3)",
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { 
          y: { 
            beginAtZero: true,
            grid: {
              color: 'rgba(200, 200, 200, 0.2)'
            },
            ticks: {
              color: '#666'
            }
          },
          x: {
            grid: {
              color: 'rgba(200, 200, 200, 0.1)'
            },
            ticks: {
              color: '#666'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#666',
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
    
    console.log('Chart initialized successfully');
  } catch (error) {
    console.error('Error initializing chart:', error);
    // Clear the canvas to prevent further errors
    const canvas = document.getElementById("myChart");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }
}

// Make module functions available to the global scope
if (typeof window !== 'undefined') {
  // Store the module version of switchPage with a different name
  window._switchPage = switchPage;
  
  // Override the global switchPage to use the module version
  window.switchPage = function(pageName, event) {
    if (window._switchPage) {
      return window._switchPage(pageName, event);
    }
    // Fallback to the minimal implementation if module not loaded yet
    if (event) event.preventDefault();
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const targetPage = document.getElementById(`${pageName}-page`);
    const clickedNav = event?.currentTarget.closest('.nav-item') || 
                      document.querySelector(`.nav-item[onclick*="${pageName}"]`);
    
    if (targetPage) targetPage.classList.add('active');
    if (clickedNav) clickedNav.classList.add('active');
  };
  
  // Expose other functions that might be needed globally
  window.sendReply = sendReply;
  window.initChart = initChart;
  window.updateChart = updateChart;
  
  console.log('Global functions initialized');
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("SeismoSens app initialized");
  initApp();
});

// ===== Forum =====
// Function to send a reply to a forum post
function sendReply(postId) {
  const input = document.getElementById(`replyInput-${postId}`);
  if (input && input.value.trim()) {
    addReply(postId, input.value.trim());
  }
}

// Tambah postingan
async function addForumPost() {
  const titleInput = document.getElementById('forumTitle');
  const textInput  = document.getElementById('forumInput');

  if (!titleInput || !textInput) return;
  if (titleInput.value.trim() === "" || textInput.value.trim() === "") {
    alert("Judul dan isi posting harus diisi!");
    return;
  }

  const user = window._firebase.auth.currentUser;
  if (!user) {
    alert("Anda harus login untuk membuat posting.");
    return;
  }

  try {
    const ref = await addDoc(collection(db, "forumPosts"), {
      title: titleInput.value.trim(),
      text: textInput.value.trim(),
      author: user.displayName || user.email || "Anonim",
      uid: user.uid,
      time: serverTimestamp()
    });
    console.log("Postingan berhasil disimpan, id:", ref.id)

    titleInput.value = "";
    textInput.value  = "";
  } catch (error) {
    console.error("Error menambahkan post:", error);
    alert("Gagal mengirim posting." + error.message);
  }
}

// Tambah balasan (flat, tidak nested)
async function addReply(postId, replyText) {
  const user = window._firebase.auth.currentUser;
  if (!user) {
    alert("Anda harus login untuk membalas.");
    return;
  }
  if (!replyText.trim()) return;

  const input = document.getElementById(`replyInput-${postId}`);
  const replyToName = input?.getAttribute("data-reply-to") || null;

  // tambahkan @username kalau membalas seseorang
  let finalText = replyText.trim();
  if (replyToName) {
    // cek biar ga dobel @username
    if (!finalText.startsWith(`@${replyToName}`)) {
      finalText = `@${replyToName} ${finalText}`;
    }
  }

  try {
    const postRef = doc(db, "forumPosts", postId);
    await addDoc(collection(postRef, "replies"), {
      text: finalText,
      author: user.displayName || user.email || "Anonim",
      uid: user.uid,
      time: serverTimestamp()
    });

    // reset input setelah kirim
    input.value = "";
    input.removeAttribute("data-reply-to");
    input.placeholder = "Balas...";
  } catch (error) {
    console.error("Error menambahkan balasan:", error);
    alert("Gagal menambahkan balasan.");
  }
}

function renderReply(replyData, container, postId) {
  const template = document.getElementById("replyTemplate");
  if (!template) return;

  const clone = template.content.cloneNode(true);
  const textEl   = clone.querySelector(".reply-text");
  const authorEl = clone.querySelector(".reply-author");
  const actionEl = clone.querySelector(".reply-actions");

  // isi konten balasan
  if (textEl) textEl.textContent = replyData.text;
  if (authorEl) {
    const timeText = replyData.time?.toDate?.().toLocaleString?.() || "-";
    authorEl.textContent = `${replyData.author} • ${timeText}`;
  }

  if (actionEl) {
    // tombol Balas (sudah ada di template HTML)
    const replyBtn = actionEl.querySelector(".reply-reply");
    if (replyBtn) {
      replyBtn.onclick = () => {
        const input = document.getElementById(`replyInput-${postId}`);
        if (input) {
          input.placeholder = `Balas ${replyData.author}...`;
          input.setAttribute("data-reply-to", replyData.author); // ✅ simpan username
          input.focus();
        }
      };
    }

    // kalau user pemilik reply → kasih tombol Hapus
    const user = window._firebase.auth.currentUser;
    if (user && replyData.uid && user.uid === replyData.uid) {
      const deleteLink = document.createElement("span");
      deleteLink.textContent = "Hapus";
      deleteLink.className = "reply-delete";
      deleteLink.onclick = async () => {
        if (confirm("Yakin hapus komentar ini?")) {
          try {
            const replyRef = doc(db, "forumPosts", postId, "replies", replyData.id);
            await deleteDoc(replyRef);
            console.log("✅ Komentar dihapus:", replyData.id);
          } catch (err) {
            console.error("❌ Gagal hapus komentar:", err);
            alert("Komentar gagal dihapus.");
          }
        }
      };

      actionEl.appendChild(document.createTextNode(" • "));
      actionEl.appendChild(deleteLink);
    }
  }

  container.appendChild(clone);
}

function renderForumPost(postData, container, postId) {
  const post = document.createElement("div");
  post.className = "device-card";

  let timeText = "-";
  if (postData.time && typeof postData.time.toDate === "function") {
    timeText = postData.time.toDate().toLocaleString();
  }

  post.innerHTML = `
    <div class="device-header">
      <div class="device-info">
        <h3>${postData.title}</h3>
        <p>${postData.text}</p>
        <small>Diposting oleh ${postData.author} • ${timeText}</small>
      </div>
    </div>
    <div class="replies" id="replies-${postId}"></div>
    <div class="reply-form">
      <input type="text" id="replyInput-${postId}" placeholder="Tulis balasan..." />
      <button onclick="sendReply('${postId}')">Balas</button>
    </div>
  `;
  container.appendChild(post);

  const repliesContainer = post.querySelector(`#replies-${postId}`);
  const postRef = doc(db, "forumPosts", postId);
  const q = query(collection(postRef, "replies"), orderBy("time", "asc"));

  onSnapshot(q, (snapshot) => {
    repliesContainer.innerHTML = "";
    const replies = [];
    snapshot.forEach((docSnap) => replies.push({ id: docSnap.id, ...docSnap.data() }));

    if (replies.length > 1) {
      // tampilkan hanya komentar terakhir
      renderReply(replies[replies.length - 1], repliesContainer, postId);

      // tombol "tampilkan lainnya"
      const btn = document.createElement("button");
      btn.className = "show-more-replies";
      btn.textContent = `Tampilkan ${replies.length - 1} komentar lainnya`;
      btn.onclick = () => {
        repliesContainer.innerHTML = "";
        replies.forEach(r => renderReply(r, repliesContainer, postId));
        btn.remove();
      };
      repliesContainer.prepend(btn);
    } else {
      // kalau cuma 1 atau 0 → tampilkan semua
      replies.forEach(r => renderReply(r, repliesContainer, postId));
    }
  });
}

// Kirim balasan
window.sendReply = function (postId) {
  const input = document.getElementById(`replyInput-${postId}`);
  if (input && input.value.trim()) {
    addReply(postId, input.value.trim());
  }
};

// Load semua post
function loadForumPosts() {
  const postsContainer = document.getElementById('forumPosts');
  if (!postsContainer) return;
  postsContainer.innerHTML = "";

  const q = query(collection(db, "forumPosts"), orderBy("time", "desc"));

  onSnapshot(q, (snapshot) => {
    console.log("Jumlah post:", snapshot.size);
    postsContainer.innerHTML = "";

    snapshot.forEach((docSnap) => {
      console.log("Post data:", docSnap.id, docSnap.data());
      const post = docSnap.data();
      renderForumPost({
        title: post.title || "(Tanpa judul)",
        text: post.text || "",
        author: post.author || "Anonim",
        time: post.time || null
      }, postsContainer, docSnap.id);
    });
  }, (err) => {
    console.error('onSnapshot error:', err);
  });
}

async function setLanguage(langCode) {
  try {
    const res = await fetch(`./lang/${langCode}.json`);
    const translations = await res.json();

    // Simpan pilihan user ke localStorage
    localStorage.setItem("lang", langCode);

    // Update semua elemen yang punya atribut data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[key]) {
        el.textContent = translations[key];
      }
    });

    console.log("Bahasa diganti ke:", langCode);
  } catch (err) {
    console.error("Gagal load bahasa:", err);
  }
}

// Load saved language preference
function initializeLanguage() {
  const savedLang = localStorage.getItem("lang") || "id";
  setLanguage(savedLang);
}

// Initialize language when the app starts
initializeLanguage();

// ===== Expose ke window =====
window.switchPage = switchPage;
window.showSetting = showSetting;
window.initApp = initApp;

// fungsi lain tetap di-expose
window.initializeMap = initializeMap;
window.zoomIn = zoomIn;
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


// Debug initialization
function initializeDebug() {
  console.log('Global functions initialized:', {
    switchPage: typeof window.switchPage,
    initApp: typeof window.initApp,
    initializeMap: typeof window.initializeMap,
    zoomIn: typeof window.zoomIn,
    zoomOut: typeof window.zoomOut,
    centerMap: typeof window.centerMap,
    showNotifications: typeof window.showNotifications,
    showDeviceDetail: typeof window.showDeviceDetail,
    showLocationDetail: typeof window.showLocationDetail,
    showSetting: typeof window.showSetting,
    showQuickActions: typeof window.showQuickActions,
    updateTime: typeof window.updateTime,
    logout: typeof window.logout,
    updateProfileUI: typeof window.updateProfileUI,
    addForumPost: typeof window.addForumPost,
    loadForumPosts: typeof window.loadForumPosts,
    deleteAccount: typeof window.deleteAccount
  });
}

// Initialize debug info when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDebug);