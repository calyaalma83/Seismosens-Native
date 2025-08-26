// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Firebase config (sama persis dengan register.js)
const firebaseConfig = {
  apiKey: "AlzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.appspot.com",
  messagingSenderId: "358453169511",
  appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Cek user login
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ User terdeteksi:", user.email);

    // Update nama di greeting (home)
    document.getElementById("greetingName").textContent = user.displayName || "User";

    // Update profil (profile page)
    const profileName = document.querySelector("#profile-page .header div div:nth-child(2)");
    const profileEmail = document.querySelector("#profile-page .header div div:nth-child(3)");

    if (profileName) profileName.textContent = user.displayName || "User";
    if (profileEmail) profileEmail.textContent = user.email;
  } else {
    console.warn("❌ Tidak ada user login, redirect ke login.html");
    window.location.href = "login/login.html";
  }
});

// Fungsi logout (ganti alert jadi Firebase signOut)
function logout() {
  if (confirm("Yakin ingin keluar dari akun SeismoSens?")) {
    signOut(auth)
      .then(() => {
        alert("✅ Berhasil logout!");
        window.location.href = "login/login.html";
      })
      .catch((error) => {
        alert("❌ Gagal logout: " + error.message);
      });
  }
}

let map;
let markers = [];
let deviceMarkers = [];

// Initialize home map
function initHomeMap() {
    if (!homeMapInitialized && document.getElementById('home-map')) {
        homeMap = L.map('home-map').setView([-7.5591, 110.8443], 12); // Center on Surakarta
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(homeMap);
        
        // Add device markers
        addDeviceMarkers(homeMap);
        homeMapInitialized = true;
    }
}

// Initialize fullscreen map
function initFullscreenMap() {
    if (!mapInitialized && document.getElementById('fullscreen-map')) {
        fullscreenMap = L.map('fullscreen-map').setView([-7.5591, 110.8443], 12); // Center on Surakarta
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(fullscreenMap);
        
        // Add device markers and legend
        addDeviceMarkers(fullscreenMap);
        addMapLegend(fullscreenMap);
        
        // Add map controls
        L.control.zoom({
            position: 'bottomright'
        }).addTo(fullscreenMap);
        
        mapInitialized = true;
    }
}

// Add device markers to map
function addDeviceMarkers(map) {
    // Example device data - replace with your actual device data
    const devices = [
        { lat: -7.5591, lng: 110.8443, status: 'online', name: 'Device 1' },
        { lat: -7.56, lng: 110.85, status: 'warning', name: 'Device 2' },
        { lat: -7.555, lng: 110.84, status: 'offline', name: 'Device 3' }
    ];
    
    devices.forEach(device => {
        const color = device.status === 'online' ? '#4CAF50' : 
                     device.status === 'warning' ? '#FFC107' : '#F44336';
                     
        const marker = L.circleMarker([device.lat, device.lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
        
        marker.bindPopup(`<b>${device.name}</b><br>Status: ${device.status}`);
    });
}

// Add legend to map
function addMapLegend(map) {
    const legend = L.control({ position: 'topright' });
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'info legend');
        const magnitudes = [0, 2, 4, 6];
        const labels = [];
        
        // Add title
        div.innerHTML = '<h4>Magnitude</h4>';
        
        // Add magnitude ranges
        for (let i = 0; i < magnitudes.length; i++) {
            const from = magnitudes[i];
            const to = magnitudes[i + 1];
            let color = '';
            
            if (from === 6) color = '#F44336';
            else if (from === 4) color = '#FF9800';
            else if (from === 2) color = '#FFC107';
            else color = '#4CAF50';
            
            labels.push(
                `<i style="background: ${color}"></i> ${from}${to ? '–' + to + '<br>' : '+'}`
            );
        }
        
        div.innerHTML += labels.join('');
        return div;
    };
    legend.addTo(map);
}

// Clear all earthquake markers
function clearEarthquakeMarkers() {
    earthquakeMarkers.forEach(markerObj => {
        if (markerObj.map && markerObj.map.hasLayer(markerObj.marker)) {
            markerObj.map.removeLayer(markerObj.marker);
        }
    });
    earthquakeMarkers = [];
}

// Fetch and display earthquake data
async function fetchEarthquakeData() {
    try {
        // Clear existing markers
        clearEarthquakeMarkers();
        
        // Fetch USGS data
        const usgsResponse = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        const usgsData = await usgsResponse.json();
        
        // Process USGS data
        usgsData.features.forEach(feature => {
            const { coordinates } = feature.geometry;
            const { mag, place, time, url } = feature.properties;
            
            if (homeMap) {
                createEarthquakeMarker(homeMap, coordinates[1], coordinates[0], mag, place, time, url, 'USGS');
            }
            if (fullscreenMap) {
                createEarthquakeMarker(fullscreenMap, coordinates[1], coordinates[0], mag, place, time, url, 'USGS');
            }
        });
        
        // Fetch BMKG data
        try {
            const bmkgResponse = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
            const bmkgData = await bmkgResponse.json();
            
            if (bmkgData.Infogempa && bmkgData.Infogempa.gempa) {
                const quake = bmkgData.Infogempa.gempa;''
                const mag = parseFloat(quake.Magnitude);
                
                if (homeMap) {
                    createEarthquakeMarker(homeMap, parseFloat(quake.Lintang), parseFloat(quake.Bujur), 
                        mag, quake.Wilayah, quake.Tanggal + ' ' + quake.Jam, '#', 'BMKG');
                }
                if (fullscreenMap) {
                    createEarthquakeMarker(fullscreenMap, parseFloat(quake.Lintang), parseFloat(quake.Bujur), 
                        mag, quake.Wilayah, quake.Tanggal + ' ' + quake.Jam, '#', 'BMKG');
                }
            }
        } catch (error) {
            console.error('Error fetching BMKG data:', error);
        }
        
    } catch (error) {
        console.error('Error fetching earthquake data:', error);
        showNotification('Error loading earthquake data', 'error');
    }
}

// Create earthquake marker on map
function createEarthquakeMarker(map, lat, lng, mag, place, time, url, source) {
    let color = '#4CAF50'; // Default color for small earthquakes
    if (mag >= 7.0) color = '#F44336';
    else if (mag >= 6.0) color = '#FF9800';
    else if (mag >= 4.0) color = '#FFC107';
    
    const size = Math.max(5, Math.min(10, mag * 2)) * 2;
    
    const icon = L.divIcon({
        className: 'earthquake-marker',
        html: `<div style="background: ${color}; width: ${size}px; height: ${size}px; 
               border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);">
              </div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
    });
    
    const marker = L.marker([lat, lng], { icon }).addTo(map);
    
    const formattedTime = new Date(time).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    marker.bindPopup(`
        <div style="font-weight: bold; margin-bottom: 5px;">${source === 'BMKG' ? 'Gempa Terkini' : 'Earthquake'}</div>
        <div><b>Magnitude:</b> ${mag.toFixed(1)}</div>
        <div><b>Lokasi:</b> ${place}</div>
        <div><b>Waktu:</b> ${formattedTime}</div>
        ${url !== '#' ? `<a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: none;">More info →</a>` : ''}
    `);
    
    earthquakeMarkers.push({ marker, map });
}

// Initialize maps when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize home map
    initHomeMap();
    
    // Initialize fullscreen map if on map page
    if (document.getElementById('fullscreen-map')) {
        initFullscreenMap();
    }
    
    // Fetch earthquake data
    fetchEarthquakeData();
    
    // Set up periodic refresh (every 5 minutes)
    setInterval(fetchEarthquakeData, 5 * 60 * 1000);
});

// Update page switching function
function switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page and set active nav item
    document.getElementById(pageName + '-page').style.display = 'block';
    document.querySelector(`.nav-item[on*="${pageName}"]`).classList.add('active');
    
    // Initialize map if switching to map page
    if (pageName === 'map') {
        setTimeout(initFullscreenMap, 100); // Small delay to ensure DOM is ready
    }
    
    // Refresh map sizes when switching pages
    setTimeout(() => {
        if (homeMap) homeMap.invalidateSize();
        if (fullscreenMap) fullscreenMap.invalidateSize();
    }, 100);
}

// Navigation function
function switchPage(pageName) {
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active to clicked nav item
    event.target.closest('.nav-item').classList.add('active');
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    document.getElementById(pageName + '-page').classList.add('active');
    
    // Initialize map if switching to map page
    if (pageName === 'map') {
        if (!mapInitialized) {
            initFullscreenMap();
            mapInitialized = true;
        }
        // Refresh data when switching to map page
        fetchEarthquakeData();
    }
}

// Map controls
function zoomIn() {
    if (fullscreenMap) {
        fullscreenMap.zoomIn();
    }
}

function zoomOut() {
    if (fullscreenMap) {
        fullscreenMap.zoomOut();
    }
}

function centerMap() {
    if (fullscreenMap) {
        fullscreenMap.setView([-2.5, 118.0], 5);
    }
}

// Interactive functions
function showNotifications() {
    alert(' Notifikasi Terbaru:\n\n• SMS-USER-003 offline sejak 2 jam lalu\n• Update firmware v2.1.0 tersedia\n• Backup data berhasil (3 hari lalu)\n• Sistem monitoring berjalan normal\n\nKlik OK untuk menutup.');
}

function showDeviceDetail(deviceName) {
    alert(`Detail ${deviceName}:\n\n Lokasi: Surakarta\n Status: Online\n Health: 95%\n Battery: 85%\n Signal: Strong\n Last Update: 2 menit lalu\n\nKlik OK untuk kembali.`);
}

function showLocationDetail(locationName) {
    alert(`${locationName}\n\n Status: Normal\n Kategori: Fasilitas Publik\n Health: 98%\n Last Update: 1 menit lalu\n\nKlik OK untuk kembali.`);
}

function showSetting(settingName) {
    alert(`Membuka ${settingName}...\n\nFitur akan tersedia di versi lengkap aplikasi.\n\nDemo mode - SeismoSens Indonesia Inventors Day 2025`);
}

function showQuickActions() {
    const actions = [
        ' Tambah Perangkat Baru',
        ' Export Data (2.3MB)',
        ' Sync Manual dengan Server',
        ' Emergency Alert Mode'
    ];
    
    const choice = prompt('Quick Actions - Pilih aksi:\n\n1. ' + actions[0] + '\n2. ' + actions[1] + '\n3. ' + actions[2] + '\n4. ' + actions[3] + '\n\nMasukkan nomor (1-4):');
    
    if (choice >= 1 && choice <= 4) {
        alert(`Menjalankan: ${actions[choice-1]}\n\n Aksi berhasil dijalankan!\n\n(Demo mode - SeismoSens Indonesia Inventors Day 2025`);
    }
}

function logout() {
    if (confirm('Yakin ingin keluar dari akun SeismoSens?')) {
        alert(' Berhasil logout!\n\nTerima kasih telah menggunakan SeismoSens.\n\n(Demo mode - Indonesia Inventors Day 2025)');
    }
}

// Real-time data updates
function updateStats() {
    const metrics = document.querySelectorAll('.metric-value');
    metrics.forEach(metric => {
        if (metric.textContent.includes('%')) {
            const current = parseInt(metric.textContent);
            const newValue = current + (Math.random() - 0.5) * 2;
            metric.textContent = Math.max(70, Math.min(100, newValue)).toFixed(0) + '%';
        }
    });
    
    // Update quick stats
    const quickStats = document.querySelectorAll('.quick-stat-value');
    if (quickStats[2]) {
        const current = parseInt(quickStats[2].textContent);
        const newValue = current + (Math.random() - 0.5) * 2;
        quickStats[2].textContent = Math.max(85, Math.min(100, newValue)).toFixed(0) + '%';
    }
}

function updateTime() {
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0');
    document.querySelector('.status-bar div').textContent = timeString;
}

// BMKG Prediction Functions
let lastPredictionUpdate = null;
let predictions = [];

// Initialize prediction section
document.addEventListener('DOMContentLoaded', function() {
    // Set initial update time
    updatePredictionTime();
    
    // Load predictions
    loadPredictions();
    
    // Setup refresh button
    document.getElementById('refresh-prediction').addEventListener('click', refreshPredictions);
    
    // Simulate periodic updates (every 1 hour)
    setInterval(refreshPredictions, 60 * 60 * 1000);
});

function updatePredictionTime() {
    const now = new Date();
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
        hour12: false
    };
    
    const formatter = new Intl.DateTimeFormat('id-ID', options);
    const formattedDate = formatter.format(now);
    
    document.getElementById('prediction-update').textContent = formattedDate + ' WIB';
    lastPredictionUpdate = now;
}

async function loadPredictions() {
    try {
        // In a real app, this would be an API call to your backend
        // const response = await fetch('https://api.yourdomain.com/bmkg/predictions');
        // predictions = await response.json();
        
        // Mock data for demonstration
        predictions = [
            {
                id: 'south-java',
                location: 'Pesisir Selatan Jawa Tengah',
                probability: 75,
                magnitude: '5.8 - 6.2 SR',
                period: '27-29 Agustus 2024',
                risk: 'high',
                details: 'Peningkatan aktivitas seismik terdeteksi di zona subduksi lempeng Indo-Australia dan Eurasia. Wilayah pesisir selatan Jawa Tengah perlu waspada terhadap potensi gempa dengan magnitudo menengah hingga tinggi.'
            },
            {
                id: 'sesar-lembang',
                location: 'Sesar Lembang, Jawa Barat',
                probability: 45,
                magnitude: '4.5 - 5.0 SR',
                period: '28-30 Agustus 2024',
                risk: 'medium',
                details: 'Aktivitas sesar Lembang menunjukkan peningkatan pergerakan. Warga di sekitar wilayah Bandung Raya disarankan untuk waspada terhadap potensi gempa dangkal dengan kekuatan sedang.'
            }
        ];
        
        renderPredictions();
    } catch (error) {
        console.error('Gagal memuat prediksi:', error);
        showNotification('error', 'Gagal memuat prediksi terbaru');
    }
}

function renderPredictions() {
    const container = document.querySelector('.content-section:nth-of-type(3)');
    if (!container) return;
    
    // Clear existing predictions (except the first one which is the header)
    const existingPredictions = container.querySelectorAll('.prediction-card');
    existingPredictions.forEach(pred => pred.remove());
    
    // Add each prediction to the DOM
    predictions.forEach(pred => {
        const predictionElement = createPredictionElement(pred);
        container.insertBefore(predictionElement, container.querySelector('.prediction-info'));
    });
}

function createPredictionElement(prediction) {
    const warningText = prediction.risk === 'high' ? '⛔ WASPADA TINGGI' : '⚠ WASPADA';
    const riskClass = prediction.risk || 'medium';
    
    const element = document.createElement('div');
    element.className = `prediction-card ${riskClass}`;
    element.innerHTML = `
        <div class="prediction-card-header">
            <span class="prediction-warning">${warningText}</span>
            <span class="prediction-probability">${prediction.probability}%</span>
        </div>
        <h3 class="prediction-location">${prediction.location}</h3>
        <div class="prediction-details">
            <div class="prediction-detail">
                <span>Perkiraan Magnitudo</span>
                <strong>${prediction.magnitude}</strong>
            </div>
            <div class="prediction-detail">
                <span>Periode Waspada</span>
                <strong>${prediction.period}</strong>
            </div>
        </div>
        <div class="prediction-actions">
            <button class="btn-outline" onclick="viewPredictionDetails('${prediction.id}')">Detail</button>
            <button class="btn-primary" onclick="showEvacuationRoutes('${prediction.id}')">Rute Evakuasi</button>
        </div>
    `;
    
    return element;
}

async function refreshPredictions() {
    const refreshBtn = document.getElementById('refresh-prediction');
    const originalText = refreshBtn.textContent;
    
    try {
        refreshBtn.textContent = 'Memperbarui...';
        refreshBtn.style.opacity = '0.7';
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await loadPredictions();
        updatePredictionTime();
        showNotification('success', 'Prediksi berhasil diperbarui');
    } catch (error) {
        console.error('Gagal memperbarui prediksi:', error);
        showNotification('error', 'Gagal memperbarui prediksi');
    } finally {
        refreshBtn.textContent = originalText;
        refreshBtn.style.opacity = '1';
    }
}

function viewPredictionDetails(predictionId) {
    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) return;
    
    // In a real app, this would open a modal or navigate to a detail page
    alert(`Detail Prediksi: ${prediction.location}\n\n${prediction.details}\n\nStatus: ${prediction.risk === 'high' ? 'Waspada Tinggi' : 'Waspada'}\nProbabilitas: ${prediction.probability}%\nPeriode: ${prediction.period}`);
}

function showEvacuationRoutes(predictionId) {
    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) return;
    
    // In a real app, this would open a map with evacuation routes
    alert(`Menampilkan rute evakuasi untuk: ${prediction.location}\n\nFitur ini akan menampilkan peta dengan rute evakuasi terdekat menuju titik kumpul yang aman.`);
    
    // Here you would integrate with your map component
    // For example: showEvacuationOnMap(prediction.location);
}

// Utility function for showing notifications
function showNotification(type, message) {
    // In a real app, you might want to use a proper notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Example of showing a simple notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add some basic notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 9999;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        background: #10b981;
    }
    
    .notification.error {
        background: #ef4444;
    }
`;
document.head.appendChild(style);

// Add touch feedback
document.querySelectorAll('.device-card, .settings-item, .nav-item').forEach(element => {
    element.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
    });
    
    element.addEventListener('touchend', function() {
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('SeismoSens Mobile App loaded successfully!');
    
    // Update time every minute
    setInterval(updateTime, 60000);
    
    // Update stats every 5 seconds
    setInterval(updateStats, 5000);
});

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    // Other initialization code...
});

// Initialize the map
function initMap() {
    // Center on Surakarta (Solo) coordinates
    const soloCoords = [-7.5591, 110.8443];
    
    // Create the map
    map = L.map('map').setView(soloCoords, 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add sample markers (replace with real data)
    addSampleMarkers();
}

// Add sample markers to the map
function addSampleMarkers() {
    // Sample device data (replace with real data)
    const devices = [
        { lat: -7.5591, lng: 110.8443, status: 'normal', title: 'Balai Kota Surakarta', type: 'government' },
        { lat: -7.5565, lng: 110.8317, status: 'normal', title: 'RSUD Dr. Moewardi', type: 'hospital' },
        { lat: -7.5614, lng: 110.8556, status: 'warning', title: 'UNS Kentingan', type: 'university' },
        { lat: -7.5659, lng: 110.8215, status: 'offline', title: 'Pasar Klewer', type: 'market' },
        { lat: -7.5755, lng: 110.8243, status: 'normal', title: 'Stasiun Solo Balapan', type: 'transportation' },
    ];
    
    // Add markers to the map
    devices.forEach(device => {
        const marker = L.marker([device.lat, device.lng], {
            icon: getMarkerIcon(device.status)
        }).addTo(map);
        
        marker.bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px;">${device.title}</h3>
                <p style="margin: 0 0 5px 0; font-size: 13px; color: #666;">
                    Status: <span style="color: ${getStatusColor(device.status)}; font-weight: 500;">
                        ${device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                    </span>
                </p>
                <p style="margin: 0; font-size: 12px; color: #888;">
                    ${getLocationType(device.type)}
                </p>
            </div>
        `);
        
        markers.push(marker);
    });
}

// Get appropriate marker icon based on status
function getMarkerIcon(status) {
    const size = 32;
    const html = `
        <div style="width: ${size}px; height: ${size}px; 
            background: ${getStatusColor(status)}; 
            border-radius: 50%; 
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;">
            ${status === 'normal' ? '✓' : status === 'warning' ? '!' : '✕'}
        </div>
    `;
    
    return L.divIcon({
        html: html,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
    });
}

// Get status color
function getStatusColor(status) {
    switch(status) {
        case 'normal': return '#10b981';
        case 'warning': return '#f59e0b';
        case 'offline': return '#ef4444';
        case 'user': return '#3b82f6';
        default: return '#94a3b8';
    }
}

// Get location type in Indonesian
function getLocationType(type) {
    const types = {
        'government': 'Pemerintahan',
        'hospital': 'Rumah Sakit',
        'university': 'Universitas',
        'market': 'Pasar',
        'transportation': 'Transportasi',
        'residential': 'Pemukiman'
    };
    return types[type] || type;
}

// Map control functions
function zoomIn() {
    map.zoomIn();
}

function zoomOut() {
    map.zoomOut();
}

function centerMap() {
    map.setView([-7.5591, 110.8443], 13);
}

// Filter markers based on status
function filterMarkers(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide markers based on filter
    markers.forEach(marker => {
        const status = marker.options.icon.options.status;
        if (filter === 'all' || status === filter) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
}

// Add click handlers for map controls
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
<<<<<<< HEAD
    });
});
=======

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            console.log('SeismoSens Mobile App loaded successfully!');
            
            // Update time every minute
            setInterval(updateTime, 60000);
            
            // Update stats every 5 seconds
            setInterval(updateStats, 5000);
            
            // Try to initialize map after a delay
            setTimeout(() => {
                if (typeof L !== 'undefined') {
                    console.log('Leaflet is ready');
                } else {
                    console.log('Leaflet not loaded yet, will retry when map page is opened');
                }
            }, 2000);
        });

        // Prevent default touch behaviors for better mobile experience
        document.addEventListener('touchmove', function(e) {
            if (e.target.closest('.main-content')) {
                return; // Allow scrolling in main content
            }
            e.preventDefault();
        }, { passive: false });
>>>>>>> c1fe6bdae70a0dd064264d0a438f4f45ceb5e10f
