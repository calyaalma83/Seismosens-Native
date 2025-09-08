import { auth, checkAuthState, deleteUser } from "./auth.js";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { updateProfile,  EmailAuthProvider, reauthenticateWithCredential} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const db = window._firebase.db;
if (!db) {
  console.error("Firestore belum siap. Pastikan firebase init di <head> sudah jalan.");
}

const surakartaCenter = [-7.566667, 110.816667];

let map;
let mapInitialized = false;
let chart;

// ===== Navigation =====
function switchPage(pageName, event) {
  if (event) event.preventDefault();

  // reset nav
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  const clickedItem = event?.target.closest(".nav-item") ||
    document.querySelector(`.nav-item[onclick*="${pageName}"]`);
  if (clickedItem) clickedItem.classList.add("active");

  // reset pages
  document.querySelectorAll(".page-content").forEach(p => p.classList.remove("active"));

  const targetPage = document.getElementById(`${pageName}-page`);
  if (targetPage) {
    targetPage.classList.add("active");

    // refresh map & chart
    if (pageName === "map" && !mapInitialized) setTimeout(initializeMap, 300);
    if (pageName === "home") initChart();
  } else {
    console.warn(`switchPage: Halaman "${pageName}-page" tidak ditemukan`);
  }
}

// ===== Profile & Settings Functions =====

/**
 * Show a specific setting/page in the profile section
 * @param {string} settingName - The name of the setting/page to show
 */
function showSetting(settingName) {
  // Hide semua page-content dulu
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.remove('active');
  });

  // buat id untuk page
  const pageId = `${settingName.toLowerCase().replace(/\s+/g, '-')}-page`;
  const targetPage = document.getElementById(pageId);

  if (targetPage) {
    targetPage.classList.add('active');
    return;
  }

  // ambil konten setting dari mapping
  const pageContent = getSettingContent(settingName);
  if (!pageContent) {
    console.warn(`No content found for setting: ${settingName}`);
    return;
  }

  // mapping key judul berdasarkan settingName
  const titleKeys = {
    "Edit Profil": "edit_title",
    "Notifikasi": "notif_title",
    "Bahasa": "bahasa_title",
    "Tema": "tema_title",
    "Bantuan": "bantuan_title",
    "Tentang": "about_title"
  };

  const titleKey = titleKeys[settingName] || "";

  // Create and append the new page
  const newPage = document.createElement('div');
  newPage.id = pageId;
  newPage.className = 'page-content';
  newPage.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="showSetting('Profile')">
        <i class="icon-arrow">←</i> <span data-i18n="back">Kembali</span>
      </button>
      <h2 data-i18n="${titleKey}">${settingName}</h2>
    </div>
    <div class="page-content-inner">
      ${pageContent}
    </div>
  `;

  document.querySelector('.main-content').appendChild(newPage);
  newPage.classList.add('active');

  // 🔹 langsung apply translate ke halaman baru
  if (typeof applyTranslations === "function") {
    const savedLang = localStorage.getItem("lang") || "id";
    fetch(`./lang/${savedLang}.json`)
      .then(res => res.json())
      .then(translations => applyTranslations(translations));
  }
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
                        <label class="form-label" data-i18n="usn_edit">Username</label>
                        <input type="text" id="editUsername" class="form-control" placeholder="Masukkan username" data-i18n-placeholder="masuk_usn">
                    </div>
                    <div class="form-group">
                        <label class="form-label" data-i18n="pw_edit">Password Lama (Untuk konfirmasi)</label>
                        <input type="password" id="confirmPassword" class="form-control" placeholder="Masukkan password lama" data-i18n-placeholder="pw_lama">
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="saveProfile()" data-i18n="save_btn">Simpan Perubahan</button>
                        <button class="btn btn-outline" onclick="showSetting('Profile')" data-i18n="cancel_btn">Batal</button>
                    </div>
                </div>
            </div>
        `,
        'Notifikasi': `
            <div class="settings-section">
                <div class="setting-item">
                    <div class="setting-info">
                        <h3 data-i18n="notif_app">Notifikasi Aplikasi</h3>
                        <p data-i18n="notif_desc">Aktifkan atau nonaktifkan notifikasi</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="notificationsEnabled" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <div class="setting-info">
                        <h3 data-i18n="notif_email">Notifikasi Email</h3>
                        <p data-i18n="notif_email_desc">Terima pemberitahuan melalui email</p>
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
              <div class="setting-item" onclick="setLanguage('ko')">
                <div class="setting-icon">🇰🇷</div>
                <div class="setting-info">
                  <h3>한국어</h3>
                </div>
              </div>
            </div>
        `,
        'Tema': `
            <div class="settings-section">
                <div class="setting-item" onclick="setTheme('light')">
                    <div class="setting-icon">☀️</div>
                    <div class="setting-info">
                        <h3 data-i18n="tema_light">Terang</h3>
                        <p data-i18n="tema_light_desc">Tema terang standar</p>
                    </div>
                    <div class="setting-arrow">›</div>
                </div>
                <div class="setting-item" onclick="setTheme('dark')">
                    <div class="setting-icon">🌙</div>
                    <div class="setting-info">
                        <h3 data-i18n="tema_dark">Gelap</h3>
                        <p data-i18n="tema_dark_desc">Tema gelap yang nyaman di malam hari</p>
                    </div>
                    <div class="setting-arrow">›</div>
                </div>
                <div class="setting-item" onclick="setTheme('system')">
                    <div class="setting-icon">🖥️</div>
                    <div class="setting-info">
                        <h3 data-i18n="tema_system">Sesuai Perangkat</h3>
                        <p data-i18n="tema_system_desc">Mengikuti pengaturan tema perangkat</p>
                    </div>
                    <div class="setting-arrow">›</div>
                </div>
            </div>
        `,
        'Bantuan': `
            <div class="help-section">
                <h3 data-i18n="help_title">Pusat Bantuan</h3>
                <p data-i18n="help_desc">Berikut adalah beberapa pertanyaan yang sering diajukan:</p>
                
                <div class="help-item">
                    <div class="help-content">
                        <h4 data-i18n="help_q1">Bagaimana cara mengubah password?</h4>
                        <p data-i18n="help_a1">Untuk mengubah password, buka Pengaturan > Keamanan > Ubah Password.</p>
                    </div>
                </div>
                
                <div class="help-item">
                    <div class="help-content">
                        <h4 data-i18n="help_q2">Bagaimana cara menghubungi dukungan?</h4>
                        <p data-i18n="help_a2">Anda dapat menghubungi tim dukungan kami melalui email di support@seismosens.id</p>
                    </div>
                </div>
                
                <div class="contact-support">
                    <p data-i18n="help_not_found">Tidak menemukan jawaban yang Anda cari?</p>
                    <button class="btn btn-primary" data-i18n="help_contact_btn"onclick="showSetting('Hubungi Kami')">Hubungi Dukungan</button>
                </div>
            </div>
        `,
        'Tentang': `
            <div class="about-container">
                <div class="app-logo">🌋</div>
                <h1 data-i18n="about_seis">SeismoSens</h1>
                <p class="version" data-i18n="about_version">Versi 2.1.0</p>
                
                <div class="about-section">
                    <p data-i18n="about_desc">SeismoSens adalah aplikasi monitoring gempa yang membantu Anda tetap aman dengan memberikan peringatan dini dan informasi gempa terkini.</p>
                </div>
                
                <div class="about-section">
                    <h3 data-i18n="about_team_title">Tim Pengembang</h3>
                    <p data-i18n="about_team_desc">Dikembangkan dengan ❤️ oleh Tim SeismoSens</p>
                </div>
                
                <div class="about-links">
                    <a href="#" class="link" data-i18n="about_privacy">Kebijakan Privasi</a>
                    <span>•</span>
                    <a href="#" class="link" data-i18n="about_terms">Syarat & Ketentuan</a>
                </div>
                
                <p class="copyright" data-i18n="about_copyright">© 2025 SeismoSens. Seluruh hak cipta dilindungi.</p>
            </div>
        `
    };

    return contents[settingName] || null;
}

/**
 * Save profile changes
 */
// 🔹 Simpan perubahan username
export async function saveProfile() {
  const username = document.getElementById("editUsername")?.value.trim();
  const oldPassword = document.getElementById("confirmPassword")?.value.trim();

  const user = window._firebase?.auth.currentUser;
  if (!user) return alert("❌ Kamu harus login dulu!");
  if (!username) return alert("⚠️ Username tidak boleh kosong!");
  if (!oldPassword) return alert("⚠️ Password lama wajib diisi!");

  try {
    // 🔹 Re-authenticate dengan password lama
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);

    // 🔹 Update displayName di Firebase Auth
    await updateProfile(user, { displayName: username });

    // 🔹 Simpan ke Firestore
    const userRef = doc(window._firebase.db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, {
        username: username,
        email: user.email
      });
    } else {
      await setDoc(userRef, {
        username: username,
        email: user.email,
        createdAt: new Date()
      });
    }

    // 🔹 Simpan ke Realtime DB
    await window._firebase.set(
      window._firebase.ref(window._firebase.rtdb, `users/${user.uid}/profile`),
      {
        username: username,
        email: user.email
      }
    );

    // 🔹 Refresh UI
    if (window.updateProfileUI) window.updateProfileUI();

    alert("✅ Username berhasil diperbarui");
    window.switchPage?.("profile");
  } catch (err) {
    console.error("❌ Gagal update username:", err);
    alert("❌ Gagal update username: " + err.message);
  }
}

/**
 * Set the application theme
 * @param {string} theme - The theme to set ('light', 'dark', or 'system')
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // TODO: Save theme preference to localStorage
    console.log('Theme set to:', theme);
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


// Initialize profile when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initProfile();
    
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
});

// Make functions available globally
window.showSetting = showSetting;
window.saveProfile = saveProfile;
window.setTheme = setTheme;

// ===== App Init =====
async function initApp() {
  try {
    const user = await checkAuthState();
    console.log("App initialized with user:", user ? {
      uid: user.uid, email: user.email, displayName: user.displayName
    } : "No user");

    await updateProfileUI();
    switchPage("home");

    updateTime();
    setInterval(updateTime, 1000);

    listenDeviceStats();
    loadForumPosts();

    if (window.location.hash === "#map") initializeMap();
  } catch (error) {
    console.error("Error initializing app:", error);
  }
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
                    userMarker = L.marker([lat, lng], {
                        icon: L.icon({
                            iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
                            iconSize: [32, 32]
                        })
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
  try {
    if (window.auth && typeof window.auth.signOut === "function") {
      await auth.signOut();
    }
    window.location.href = "/login.html";
  } catch (error) {
    console.error("Error signing out:", error);
    alert("Gagal keluar. Silakan coba lagi.");
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
    const user = await checkAuthState();
    const greetingName   = document.getElementById("greetingName");
    const profileName    = document.getElementById("profileName");
    const profileEmail   = document.getElementById("profileEmail");
    const profileAvatar  = document.getElementById("profileAvatar");
    const elDevicesCount = document.getElementById("devicesCount");
    const elActiveDays   = document.getElementById("activeDays");
    const elDataUsage    = document.getElementById("dataUsage");

    if (user) {
      const displayName = user.displayName || "Pengguna";
      if (greetingName)  greetingName.textContent  = displayName;
      if (profileName)   profileName.textContent   = displayName;
      if (profileEmail)  profileEmail.textContent  = user.email || "";
      if (profileAvatar) profileAvatar.textContent = (displayName[0] || "U").toUpperCase();

      const { rtdb, ref, onValue } = window._firebase;

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
      });

      // 🔹 2. Hitung hari aktif (pakai tanggal akun dibuat dari Firebase Auth)
      if (user.metadata?.creationTime) {
        const created = new Date(user.metadata.creationTime);
        const diff = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
        if (elActiveDays) elActiveDays.textContent = diff;
      }

      // 🔹 3. Data usage
      const userRef = ref(rtdb, `users/${user.uid}/dataUsage`);
      onValue(userRef, (snap) => {
        if (snap.exists()) {
          // Kalau ada dataUsage → langsung pakai
          const usage = snap.val(); // byte
          const gb = (usage / (1024*1024*1024)).toFixed(1);
          if (elDataUsage) elDataUsage.textContent = `${gb}GB`;
        } else {
          // 🔹 Fallback: hitung dari semua perangkat user
          const devicesRef = ref(rtdb, "devices");
          onValue(devicesRef, (snapshot) => {
            if (!snapshot.exists()) return;
            const devices = snapshot.val();
            let totalBytes = 0;

            Object.values(devices).forEach(dev => {
              if (dev.ownerUid === user.uid && dev.dataUsage) {
                totalBytes += dev.dataUsage; // asumsinya tiap device simpan dataUsage
              }
            });

            const gb = (totalBytes / (1024*1024*1024)).toFixed(1);
            if (elDataUsage) elDataUsage.textContent = `${gb}GB`;
          });
        }
      });

    } else {
      // 🔹 User belum login
      if (greetingName)  greetingName.textContent  = "Tamu";
      if (profileName)   profileName.textContent   = "Tamu";
      if (profileEmail)  profileEmail.textContent  = "—";
      if (profileAvatar) profileAvatar.textContent = "T";
      if (elDevicesCount) elDevicesCount.textContent = "0";
      if (elActiveDays)   elActiveDays.textContent   = "0";
      if (elDataUsage)    elDataUsage.textContent    = "0GB";
    }
  } catch (error) {
    console.error("Error in updateProfileUI:", error);
  }
}

// ===== Chart.js =====
// Chart variable is already declared at the top of the file

function updateChart(displacement, vibration) {
  if (!chart) return;
  
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
}

function initChart() {
  const canvas = document.getElementById("myChart");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
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
        scales: { y: { beginAtZero: true } }
    }
  });
}

// (biar chart aman, kita inisialisasi ulang pas masuk home)
document.addEventListener("DOMContentLoaded", () => {
  console.log("SeismoSens app initialized");
  initApp();
});

// ===== Forum =====
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

    localStorage.setItem("lang", langCode);

    // 🔹 apply ke semua elemen yg ada di halaman
    applyTranslations(translations);

  } catch (err) {
    console.error("Gagal load bahasa:", err);
  }
}

function applyTranslations(translations) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[key]) {
      el.textContent = translations[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[key]) {
      el.setAttribute("placeholder", translations[key]);
    }
  });
}


// Saat halaman pertama kali dibuka → load bahasa terakhir dipilih
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("lang") || "id";
  setLanguage(savedLang);
});

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

    // Step 4: Hapus akun
    await deleteUser(user);
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

// ===== Debug =====
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