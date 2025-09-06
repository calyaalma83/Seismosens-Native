import { auth, checkAuthState, deleteUser } from "./auth.js";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
                        <label class="form-label">Nama Lengkap</label>
                        <input type="text" id="editName" class="form-control" placeholder="Masukkan nama lengkap">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" id="editUsername" class="form-control" placeholder="Masukkan username">
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
                
                <p class="copyright">© 2023 SeismoSens. Seluruh hak cipta dilindungi.</p>
            </div>
        `
    };

    return contents[settingName] || null;
}

/**
 * Save profile changes
 */
function saveProfile() {
    try {
        // Get form values
        const fullName = document.getElementById('editName')?.value || '';
        const username = document.getElementById('editUsername')?.value || '';
        
        // Get the current user from Firebase
        const user = auth.currentUser;
        
        if (!user) {
            console.error('No user is signed in');
            alert('Anda harus masuk terlebih dahulu');
            return;
        }
        
        // Update the user's profile
        updateProfile(user, {
            displayName: fullName,
            // Note: To update email, you need to re-authenticate the user
        }).then(() => {
            // Update successful
            console.log('Profile updated successfully');
            alert('Profil berhasil diperbarui');
            
            // Update the UI
            if (fullName) {
                const profileName = document.getElementById('profileName');
                if (profileName) profileName.textContent = fullName;
                
                // Update avatar initial
                const avatar = document.getElementById('profileAvatar');
                if (avatar) avatar.textContent = fullName.charAt(0).toUpperCase();
            }
            
            // Return to profile page
            showSetting('Profile');
            
        }).catch((error) => {
            // An error occurred
            console.error('Error updating profile:', error);
            alert('Gagal memperbarui profil: ' + error.message);
        });
        
    } catch (error) {
        console.error('Error in saveProfile:', error);
        alert('Terjadi kesalahan saat menyimpan profil');
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

        // Update profile stats
        updateProfileStats();
        
    } catch (error) {
        console.error('Error initializing profile:', error);
    }
}

/**
 * Update the profile statistics
 */
function updateProfileStats() {
    // TODO: Load real stats from your data source
    const stats = {
        devices: 3,
        activeDays: 42,
        dataUsage: '1.2 GB'
    };
    
    document.getElementById('devicesCount').textContent = stats.devices;
    document.getElementById('activeDays').textContent = stats.activeDays;
    document.getElementById('dataUsage').textContent = stats.dataUsage;
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
    listenSensorData();
    listenDevices();
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
      await window.auth.signOut();
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

        const el = document.getElementById("profileDevicesCount");
        if (el) el.textContent = myCount;
    });
}

function updateActiveDays(userCreatedAt) {
    const now = new Date();
    const created = new Date(userCreatedAt);
    const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    const el = document.getElementById("profileActiveDays");
    if (el) el.textContent = diff;
}

function listenUserDataUsage() {
    const { db } = window._firebase;
    const usageRef = doc(db, "users", uid);

    onSnapshot(usageRef, (snap) => {
        const usage = snap.data().dataUsage || 0;
        const el = document.getElementById("profileDataUsage");
        if (el) el.textContent = `${(usage / (1024*1024*1024)).toFixed(1)}GB`;
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
    const elDevicesCount = document.getElementById("profileDevicesCount");
    const elActiveDays   = document.getElementById("profileActiveDays");
    const elDataUsage    = document.getElementById("profileDataUsage");

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

window.deleteAccount = async function () {
  if (confirm('Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.')) {
    try {
      const user = window._firebase.auth.currentUser;
      if (user) {
        await fbDeleteUser(user);
        alert('Akun berhasil dihapus');
        window.location.href = '/login.html';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Gagal menghapus akun: ' + error.message);
    }
  }
};

function listenSensorData() {
  console.log("listenSensorData dummy aktif.");
}

function listenDevices() {
  console.log("listenDevices dummy aktif.");
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
  updateStats: typeof window.updateStats,
  updateTime: typeof window.updateTime,
  logout: typeof window.logout,
  updateProfileUI: typeof window.updateProfileUI,
  addForumPost: typeof window.addForumPost,
  loadForumPosts: typeof window.loadForumPosts,
  deleteAccount: typeof window.deleteAccount
});