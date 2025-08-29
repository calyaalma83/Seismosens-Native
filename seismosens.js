import { auth, checkAuthState, deleteUser } from "./auth.js";

let map;
let mapInitialized = false;
const surakartaCenter = [-7.566667, 110.816667];

// Devices Data
const devices = [
  { lat: -7.5694, lng: 110.8192, type: 'normal', name: 'Balai Kota Surakarta', category: 'Pemerintahan' },
  { lat: -7.5695, lng: 110.8096, type: 'normal', name: 'RSUD Dr. Moewardi', category: 'Rumah Sakit' },
  { lat: -7.5596, lng: 110.7715, type: 'warning', name: 'UNS Kentingan', category: 'Universitas' },
  { lat: -7.5648, lng: 110.8242, type: 'normal', name: 'SMAN 1 Surakarta', category: 'Sekolah' },
  { lat: -7.5556, lng: 110.8235, type: 'normal', name: 'Stasiun Solo Balapan', category: 'Transportasi' },
  { lat: -7.5670, lng: 110.8107, type: 'normal', name: 'Solo Grand Mall', category: 'Pusat Belanja' },
  { lat: -7.5755, lng: 110.8243, type: 'normal', name: 'Keraton Surakarta', category: 'Budaya' },
  { lat: -7.5642, lng: 110.8189, type: 'user', name: 'SMS-USER-001', category: 'Rumah Tinggal' },
  { lat: -7.5701, lng: 110.8221, type: 'user', name: 'SMS-USER-002', category: 'Kantor' },
  { lat: -7.5588, lng: 110.8301, type: 'user', name: 'SMS-USER-003', category: 'Gudang' }
];

// Navigation
export function switchPage(pageName, event) {
  if (event) event.preventDefault();
  console.log('Switching to page:', pageName);

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const clickedItem = event
    ? event.target.closest('.nav-item')
    : document.querySelector(`.nav-item[onclick*="${pageName}"]`);
  if (clickedItem) clickedItem.classList.add('active');

  document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(pageName + '-page');
  if (targetPage) {
    targetPage.classList.add('active');
  } else {
    console.error('Target page not found:', pageName + '-page');
  }

  if (pageName === 'map' && !mapInitialized) {
    setTimeout(initializeMap, 300);
  }
}
window.switchPage = switchPage;

// Map
export function initializeMap() {
  try {
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded yet');
      return;
    }

    if (!document.getElementById('map')) {
      console.warn('Map element not found');
      return;
    }

    map = L.map('map').setView(surakartaCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    devices.forEach(device => {
      const color =
        device.type === 'normal'
          ? '#10b981'
          : device.type === 'warning'
          ? '#f59e0b'
          : device.type === 'offline'
          ? '#ef4444'
          : '#3b82f6';

      const marker = L.circleMarker([device.lat, device.lng], {
        radius: 8,
        fillColor: color,
        color: 'white',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif;">
          <strong>${device.name}</strong><br>
          <small>${device.category}</small><br>
          <span style="color:${color};">
            ${
              device.type === 'normal'
                ? '● Normal'
                : device.type === 'warning'
                ? '⚠ Warning'
                : device.type === 'offline'
                ? '● Offline'
                : '● Perangkat Anda'
            }
          </span>
        </div>
      `);
    });

    mapInitialized = true;
    console.log('Map initialized successfully');
  } catch (err) {
    console.error('Error initializing map:', err);
  }
}
window.initializeMap = initializeMap;

export function zoomIn() { if (map) map.zoomIn(); }
export function zoomOut() { if (map) map.zoomOut(); }
export function centerMap() { if (map) map.setView(surakartaCenter, 13); }
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.centerMap = centerMap;

// Interactions
export function showNotifications() {
  alert('🔔 Notifikasi Terbaru:\n\n• SMS-USER-003 offline\n• Update firmware v2.1.0 tersedia\n• Backup data berhasil\n• Sistem monitoring berjalan normal');
}
export function showDeviceDetail(name) { alert(`Detail perangkat: ${name}`); }
export function showLocationDetail(name) { alert(`Detail lokasi: ${name}`); }
export function showSetting(name) { alert(`Membuka ${name} (demo mode)`); }
export function showQuickActions() {
  const actions = ['📱 Tambah Perangkat Baru', '📊 Export Data', '🔄 Sync Manual', '🚨 Emergency Alert Mode'];
  const choice = prompt('Quick Actions:\n' + actions.map((a, i) => `${i+1}. ${a}`).join('\n'));
  if (choice >= 1 && choice <= 4) alert(`Menjalankan: ${actions[choice-1]} ✅`);
}

// ✅ Delete Account
async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ Tidak ada user yang login");
    return;
  }

  const confirmDelete = confirm("⚠️ Apakah kamu yakin ingin menghapus akun ini secara permanen?");
  if (!confirmDelete) return;

  try {
    await deleteUser(user); // langsung hapus jika recent-login
    alert("✅ Akun berhasil dihapus");
    window.location.href = "../onboarding/onboarding.html";
  } catch (err) {
    if (err.code === "auth/requires-recent-login") {
      alert("⚠️ Demi keamanan, silakan login ulang sebelum menghapus akun.");
      await auth.signOut(); // logout dulu
      sessionStorage.setItem("fromDeleteAccount", "true"); // flag login ulang untuk delete
      window.location.href = "../login/login.html"; // redirect ke login
    } else {
      alert("⚠️ Gagal menghapus akun: " + err.message);
    }
  }
}

window.showNotifications = showNotifications;
window.showDeviceDetail = showDeviceDetail;
window.showLocationDetail = showLocationDetail;
window.showSetting = showSetting;
window.showQuickActions = showQuickActions;
window.deleteAccount = deleteAccount;

// Real-time Data
export function updateStats() {
  document.querySelectorAll('.metric-value').forEach(metric => {
    if (metric.textContent.includes('%')) {
      const current = parseInt(metric.textContent);
      const newValue = current + (Math.random() - 0.5) * 2;
      metric.textContent = Math.max(70, Math.min(100, newValue)).toFixed(0) + '%';
    }
  });
  const quickStats = document.querySelectorAll('.quick-stat-value');
  if (quickStats[2]) {
    const current = parseInt(quickStats[2].textContent);
    const newValue = current + (Math.random() - 0.5) * 2;
    quickStats[2].textContent = Math.max(85, Math.min(100, newValue)).toFixed(0) + '%';
  }
}
export function updateTime() {
  const now = new Date();
  const t = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const el = document.querySelector('.status-bar div');
  if (el) el.textContent = t;
}
window.updateStats = updateStats;
window.updateTime = updateTime;

// ✅ Update Profile Info dari Firebase User
async function updateProfileUI() {
  const user = await checkAuthState();
  if (user) {
    const greetingName = document.getElementById('greetingName');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');

    if (greetingName) greetingName.textContent = user.displayName || 'Pengguna';
    if (profileName) profileName.textContent = user.displayName || 'Pengguna';
    if (profileEmail) profileEmail.textContent = user.email || '';
    if (profileAvatar) profileAvatar.textContent = (user.displayName ? user.displayName[0] : 'U').toUpperCase();
  }
}

// Init App
export function initApp() {
  console.log('Initializing app...');
  updateProfileUI(); // ✅ update profile pas init

  switchPage('home');
  setInterval(updateTime, 1000);
  updateStats();
  setInterval(updateStats, 30000);
  if (window.location.hash === '#map') switchPage('map');
}
window.initApp = initApp;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('SeismoSens Mobile App loaded successfully!');
  setInterval(updateTime, 60000);
  setInterval(updateStats, 5000);
  updateProfileUI(); // ✅ jaga-jaga kalau belum keupdate
});
