import { auth, checkAuthState, deleteUser } from "./auth.js";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
    targetPage.classList.add("active");

    if (pageName === "map" && !mapInitialized) setTimeout(initializeMap, 300);
    if (pageName === "home") initChart(); // [FIX] chart di-refresh tiap buka home
  } else {
    console.error("❌ Target page tidak ditemukan:", `${pageName}-page`);
  }
}

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

function listenSensorData() {
    const { rtdb, ref, onValue } = window._firebase;
    const sensorRef = ref(rtdb, "sensor/data");

    onValue(sensorRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("Data sensor realtime: ", data);

            // contoh update ke UI
            const el = document.getElementById("sensorData");
            if (el) el.textContent = JSON.stringify(data, null, 2);

            //masukin ke grafik
            if (data.displacement_cm !== undefined && data.vibrationMagnitude !== undefined) {
                updateChart(data.displacement_cm, data.vibrationMagnitude);
            }

            let normal = 0, warning = 0;
            if (data.vibrationMagnitude > 0.5 || data.displacement_cm > 1) {
                warning++;
            } else {
                normal ++;
            }

            const elNormal = document.getElementById("legend-normal");
            const elWarning = document.getElementById("legend-warning");
            const elUser = document.getElementById("legend-user");

            if (elNormal) elNormal.textContent = normal;
            if (elWarning) elWarning.textContent = warning;
            if (elUser) elUser.textContent = 1;
        } else {
            console.log("Belum ada data sensor");
        }
    });
}

function renderDeviceCard(id, dev) {
    let statusClass = "";
    let statusLabel = "";

    switch (dev.status) {
        case "online":
            statusClass = "online";
            statusLabel = `● Online (${dev.batteryStatus || 100}%)`;
            break;
        case "warning":
            statusClass = "warning";
            statusLabel = `⚠ Warning (${dev.batteryStatus || 70}%)`;
            break;
        case "offline":
            statusClass = "offline"
            statusLabel = `● Offline`;
            break;
    }

    return `
    <div class="device-card ${statusClass}">
      <div class="device-header">
        <div class="device-info">
          <h3>${id}</h3>
          <p>${dev.name || "Perangkat"} • ${dev.address || "Alamat tidak tersedia"}</p>
        </div>
        <div class="device-status ${statusClass}">
          ${statusLabel}
        </div>
      </div>
    </div>
    `;
}

function listenDevices() {
    const { rtdb, ref, onValue } = window._firebase;
    const devicesRef = ref(rtdb, "devices");

    onValue(devicesRef, (snapshot) => {
        const listEl = document.getElementById("devicesContainer");
        if (!listEl) return;

        listEl.innerHTML = ""; 

        if (snapshot.exists()) {
            const devices = snapshot.val();
            Object.entries(devices).forEach(([id, dev]) => {
                listEl.innerHTML += renderDeviceCard(id, dev);
            });
        } else {
            listEl.innerHTML = "<p>Tidak ada perangkat yang terhubung</p>";
        }
    });
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
function showSetting(settingName) { console.log("Setting:", settingName); }
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