import { auth, checkAuthState, deleteUser } from "./auth.js";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const db = window._firebase.db;
if (!db) {
    console.error("Firestore belum siap. Passtikan firebase init di <head> sudah jalan.");
}

const surakartaCenter = [-7.566667, 110.816667];

let map;
let mapInitialized = false;

// ===== Navigation =====
function switchPage(pageName, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  let clickedItem = null;
  if (event) {
    clickedItem = event.target.closest('.nav-item') ||
      (event.target.closest('.bottom-nav')?.querySelector(`[onclick*="${pageName}"]`) ?? null);
  } else {
    clickedItem = document.querySelector(`.nav-item[onclick*="${pageName}"]`);
  }
  if (clickedItem) clickedItem.classList.add('active');

  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));

  const targetPage = document.getElementById(`${pageName}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
    if (pageName === 'map' && !mapInitialized) setTimeout(initializeMap, 300);
  } else {
    console.error('Target page not found:', `${pageName}-page`);
  }
}

// ===== App Init =====
async function initApp() {
  try {
    const user = await checkAuthState();
    console.log('App initialized with user:', user ? {
      uid: user.uid, email: user.email, displayName: user.displayName
    } : 'No user');

    await updateProfileUI();
    switchPage('home');

    updateTime();
    setInterval(updateTime, 1000);

    updateStats();
    setInterval(updateStats, 10000);

    if (window.location.hash === '#map') initializeMap();

  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// ===== Map =====
function initializeMap() {
  try {
    if (typeof L === 'undefined') {
      setTimeout(initializeMap, 100);
      return;
    }

    map = L.map('map').setView(surakartaCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    devices.forEach(device => {
      const marker = L.marker([device.lat, device.lng]).addTo(map);
      marker.bindPopup(`<b>${device.name}</b><br>${device.category}`);
    });

    mapInitialized = true;
  } catch (error) {
    console.error('Error initializing map:', error);
    const mapElement = document.getElementById('map');
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
function showNotifications() { alert('Notifikasi akan ditampilkan di sini'); }
function showDeviceDetail(deviceName) { console.log('Device detail:', deviceName); }
function showLocationDetail(locationName) { console.log('Location detail:', locationName); }
function showSetting(settingName) { console.log('Setting:', settingName); }
function showQuickActions() {
  const el = document.getElementById('quickActions');
  if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

async function logout() {
  try {
    if (window.auth && typeof window.auth.signOut === 'function') {
      await window.auth.signOut();
    }
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Error signing out:', error);
    alert('Gagal keluar. Silakan coba lagi.');
  }
}

function updateStats() {
  const stats = {
    activeDevices: Math.floor(Math.random() * 50) + 50,
    alerts: Math.floor(Math.random() * 10),
    avgResponse: (Math.random() * 2 + 1).toFixed(2) + 's'
  };
  document.querySelectorAll('.stat-value').forEach(el => {
    const t = el.getAttribute('data-stat');
    if (t in stats) el.textContent = stats[t];
  });
}

function updateTime() {
  const now = new Date();
  const timeString = now.getHours().toString().padStart(2, '0') + ':' +
                     now.getMinutes().toString().padStart(2, '0');
  const timeElement = document.querySelector('.status-bar div');
  if (timeElement) timeElement.textContent = timeString;
}

// ===== Sample devices =====
const devices = [
  { lat: -7.5694, lng: 110.8192, type: 'normal', name: 'Balai Kota Surakarta', category: 'Pemerintahan' },
  { lat: -7.5695, lng: 110.8096, type: 'normal', name: 'RSUD Dr. Moewardi', category: 'Rumah Sakit' },
  { lat: -7.56043, lng: 110.856619, type: 'warning', name: 'UNS Kentingan', category: 'Universitas' },
  { lat: -7.5648, lng: 110.8242, type: 'normal', name: 'SMAN 1 Surakarta', category: 'Sekolah' },
];

// ===== Profile (ke Beranda & Profil harus tampil) =====
async function updateProfileUI() {
  try {
    const user = await checkAuthState();
    if (user) {
      await user.reload();

      const displayName = user.displayName || 'Pengguna';
      const greetingName = document.getElementById('greetingName');
      const profileName  = document.getElementById('profileName');
      const profileEmail = document.getElementById('profileEmail');
      const profileAvatar = document.getElementById('profileAvatar');

      if (greetingName) greetingName.textContent = displayName;
      if (profileName)  profileName.textContent  = displayName;
      if (profileEmail) profileEmail.textContent = user.email || '';
      if (profileAvatar) profileAvatar.textContent = (displayName[0] || 'U').toUpperCase();
    } else {
      // [NEW] Fallback biar gak "Memuat..." terus
      const greetingName = document.getElementById('greetingName');
      const profileName  = document.getElementById('profileName');
      const profileEmail = document.getElementById('profileEmail');
      const profileAvatar = document.getElementById('profileAvatar');

      if (greetingName) greetingName.textContent = 'Tamu';
      if (profileName)  profileName.textContent  = 'Tamu';
      if (profileEmail) profileEmail.textContent = '—';
      if (profileAvatar) profileAvatar.textContent = 'T';
    }
  } catch (error) {
    console.error('Error in updateProfileUI:', error);
  }
}

// ===== Chart.js (pastikan muncul) =====
function initChart() {
  const canvas = document.getElementById('myChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext("2d");
  // (Tetap sama seperti punyamu)
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
      datasets: [{
        label: "Data Sensor",
        data: [12, 19, 7, 15, 10, 8, 17],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.3)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// [FIX] Jangan panggil langsung (dulu: document.addEventListener("DOMContentLoaded", initChart()))
document.addEventListener("DOMContentLoaded", initChart);

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

// Tambah balasan di postingan
async function addReply(postId, replyText, parentId = null) {
    const user = window._firebase.auth.currentUser;
    if (!user) {
        alert("Anda harus login untuk membalas.");
        return;
    }
    if (!replyText.trim()) return;

    try {
        const postRef = doc(db, "forumPosts", postId);
        await addDoc(collection(postRef, "replies"), {
            text: replyText,
            author: user.displayName || user.email || "Anonim",
            uid: user.uid,
            parentId: parentId,
            time: serverTimestamp()
        });
    } catch (error) {
        console.error("Error menambahkan balasan:", error);
        alert("Gagal menambahakan balasan.");
    }
}

function renderReply(replyData, container, postId, level = 0) {
  const template = document.getElementById("replyTemplate");
  if (!template) return;

  const clone = template.content.cloneNode(true);
  clone.querySelector(".reply-text").textContent = replyData.text;
  clone.querySelector(".reply-author").textContent = `${replyData.author} • ${replyData.time?.toDate?.().toLocaleString?.() || "-"}`;

  // kalau level > 0, kasih class nested
  if (level > 0) clone.querySelector(".reply-card").classList.add("reply-nested");

  // Tambahkan interaksi ke tulisan "Balas"
  const replyAction = clone.querySelector(".reply-actions");
  replyAction.addEventListener("click", () => {
    const input = document.getElementById(`replyInput-${postId}`);
    if (input) {
      input.placeholder = `Balas ${replyData.author}...`;
      input.focus();
      // (opsional) kasih attribute biar nanti tau sedang balas siapa
      input.setAttribute("data-reply-to", replyData.author);
    }
  });

  container.appendChild(clone);
}

function renderForumPost(postData, container, postId) {
  const post = document.createElement('div');
  post.className = "device-card";

  let timeText = "-";
  if (postData.time && typeof postData.time.toDate === 'function') {
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
    snapshot.forEach((doc) => {
        replies.push({ id: doc.id, ...doc.data() });
    });

    if (replies.length > 1) {
      // tampilkan hanya 1 komentar terakhir
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
      // kalau cuma 1 atau 0, tampilkan semua
      replies.forEach(r => renderReply(r, repliesContainer, postId));
    }
  });
}

// untuk menentukan target balasan
let currentReplyTarget = null;
function setReplyTarget(postId, replyId, authorName) {
    const input = document.getElementById(`replyInput-${postId}`);
    if (input) {
        input.placeholder = `Balas ${authorName}...`;
        input.focus();
        currentReplyTarget = { postId, replyId };
    }
}

// fungsii kirim balasan
window.sendReply = function (postId){
    const input = document.getElementById(`replyInput-${postId}`);
    if (input && input.value.trim()) {
        const replyText = input.value.trim();
        const parentId = (currentReplyTarget && currentReplyTarget.postId === postId)
            ? currentReplyTarget.replyId
            : null;

        addReply(postId, replyText, parentId);
        input.value = "";
        input.placeholder = "Tulis balasan...";
        currentReplyTarget = null;
    }
};

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

window.sendReply = function (postId){
    const input = document.getElementById(`replyInput-${postId}`);
    if (input && input.value.trim()) {
        addReply(postId, input.value.trim());
        input.value = "";
    }
};

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('SeismoSens app initialized');

  initApp();

  document.querySelectorAll('.device-card, .settings-item, .nav-item').forEach(el => {
    el.addEventListener('touchstart', function(){ this.style.transform = 'scale(0.98)'; });
    el.addEventListener('touchend',   function(){ this.style.transform = ''; });
    el.addEventListener('touchcancel',function(){ this.style.transform = ''; });
  });

  updateProfileUI();
  loadForumPosts();
});

// ===== Expose ke window (SATU KALI, rapih) =====
window.switchPage = switchPage;
window.initApp = initApp;
window.initializeMap = initializeMap;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.centerMap = centerMap;
window.showNotifications = showNotifications;
window.showDeviceDetail = showDeviceDetail;
window.showLocationDetail = showLocationDetail;
window.showSetting = showSetting;
window.showQuickActions = showQuickActions;
window.updateStats = updateStats;
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
