import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getFirebase, checkAuthState, getFirestore } from "./auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

function renderDevices(devices, container, user) {
  if (!devices || devices.length === 0) {
    container.innerHTML = "<p>Belum ada perangkat login.</p>";
    return;
  }

  container.innerHTML = '';
  
  devices.forEach(device => {
    const status = device.status === 'online' ? "🟢 Online" : "⚪ Offline";
    const lastSeen = device.lastSeen || "-";
    const deviceName = device.name || "Perangkat Tidak Dikenal";
    
    const deviceCard = document.createElement('div');
    deviceCard.className = 'device-card';
    deviceCard.innerHTML = `
      <h3>${deviceName}</h3>
      <p>Status: ${status}</p>
      <small>Terakhir aktif: ${lastSeen}</small><br>
    `;
    
    container.appendChild(deviceCard);
  });
}

async function loadDevices() {
  try {
    const user = await checkAuthState();
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    // Initialize Firebase services
    const { db } = await getFirebase();
    const firestore = await getFirestore();

    const container = document.getElementById("devices-list");
    if (!container) {
      console.error('Container with id "devices-list" not found');
      return;
    }
    
    container.innerHTML = "<p>Memuat perangkat...</p>";

    // 🔹 Get device history from Firestore
    const fsSnap = await getDocs(collection(firestore, "users", user.uid, "devices"));
    const historyMap = {};
    fsSnap.forEach(docSnap => {
      historyMap[docSnap.id] = docSnap.data();
    });

    // 🔹 Get live status from Realtime DB
    const rtdb = getDatabase();
    const presenceRef = ref(rtdb, `presence/${user.uid}`);
    
    onValue(presenceRef, (snapshot) => {
      try {
        const data = snapshot.val() || {};
        const devices = Object.entries(data).map(([deviceId, deviceData]) => ({
          id: deviceId,
          name: deviceData.name || deviceId,
          lastSeen: deviceData.lastSeen || 'Tidak ada data',
          status: deviceData.status || 'offline',
          ...(historyMap[deviceId] || {})
        }));
        
        renderDevices(devices, container, user);
      } catch (error) {
        console.error('Error processing device data:', error);
        container.innerHTML = `
          <div class="alert alert-error">
            Gagal memproses data perangkat: ${error.message}
          </div>
        `;
      }
    }, (error) => {
      console.error('Error listening to presence updates:', error);
      container.innerHTML = `
        <div class="alert alert-error">
          Gagal memuat status perangkat. Silakan muat ulang halaman.
        </div>
      `;
    });
  } catch (error) {
    console.error('Error in loadDevices:', error);
    const container = document.getElementById("devices-list") || document.body;
    container.innerHTML = `
      <div class="alert alert-error">
        Terjadi kesalahan: ${error.message}
      </div>
    `;
  }
}

// Start loading devices when the page loads
document.addEventListener('DOMContentLoaded', loadDevices);