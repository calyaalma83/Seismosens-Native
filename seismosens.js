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
        let mapInitialized = false;
        
        // Surakarta coordinates
        const surakartaCenter = [-7.5755, 110.8243];
        
        // Device locations in Surakarta
        const deviceLocations = [
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
            if (pageName === 'map' && !mapInitialized) {
                setTimeout(initializeMap, 300);
            }
        }

        // Initialize map
        function initializeMap() {
            try {
                if (typeof L === 'undefined') {
                    console.log('Leaflet not loaded yet');
                    return;
                }

                const mapElement = document.getElementById('map');
                if (!mapElement) {
                    console.log('Map element not found');
                    return;
                }

                // Create map
                map = L.map('map').setView(surakartaCenter, 13);
                
                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18
                }).addTo(map);
                
                // Add markers
                deviceLocations.forEach(device => {
                    const color = device.type === 'normal' ? '#10b981' :
                                 device.type === 'warning' ? '#f59e0b' :
                                 device.type === 'offline' ? '#ef4444' : '#3b82f6';
                    
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
                            <span style="color: ${color};">
                                ${device.type === 'normal' ? '● Normal' :
                                  device.type === 'warning' ? '⚠ Warning' :
                                  device.type === 'offline' ? '● Offline' : '● Perangkat Anda'}
                            </span>
                        </div>
                    `);
                });
                
                mapInitialized = true;
                console.log('Map initialized successfully');
                
            } catch (error) {
                console.error('Error initializing map:', error);
                
                // Fallback content
                const mapElement = document.getElementById('map');
                if (mapElement) {
                    mapElement.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8fafc; color: #64748b; text-align: center;">
                            <div>
                                <div style="font-size: 24px; margin-bottom: 10px;">🗺</div>
                                <div>Peta Surakarta</div>
                                <div style="font-size: 12px; margin-top: 5px;">Interactive map akan dimuat</div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // Map controls
        function zoomIn() {
            if (map) map.zoomIn();
        }

        function zoomOut() {
            if (map) map.zoomOut();
        }

        function centerMap() {
            if (map) map.setView(surakartaCenter, 13);
        }

        // Interactive functions
        function showNotifications() {
            alert('🔔 Notifikasi Terbaru:\n\n• SMS-USER-003 offline sejak 2 jam lalu\n• Update firmware v2.1.0 tersedia\n• Backup data berhasil (3 hari lalu)\n• Sistem monitoring berjalan normal\n\nKlik OK untuk menutup.');
        }

        function showDeviceDetail(deviceName) {
            alert('Detail ${deviceName}:\n\n📍 Lokasi: Surakarta\n⚡ Status: Online\n💚 Health: 95%\n🔋 Battery: 85%\n📡 Signal: Strong\n⏰ Last Update: 2 menit lalu\n\nKlik OK untuk kembali.');
        }

        function showLocationDetail(locationName) {
            alert(`${locationName}\n\n📍 Status: Normal\n🏢 Kategori: Fasilitas Publik\n📊 Health: 98%\n⏰ Last Update: 1 menit lalu\n\nKlik OK untuk kembali.`);
        }

        function showSetting(settingName) {
            alert(`Membuka ${settingName}...\n\nFitur akan tersedia di versi lengkap aplikasi.\n\nDemo mode - SeismoSens Indonesia Inventors Day 2025`);
        }

        function showQuickActions() {
            const actions = [
                '📱 Tambah Perangkat Baru',
                '📊 Export Data (2.3MB)',
                '🔄 Sync Manual dengan Server',
                '🚨 Emergency Alert Mode'
            ];
            
            const choice = prompt('Quick Actions - Pilih aksi:\n\n1. ' + actions[0] + '\n2. ' + actions[1] + '\n3. ' + actions[2] + '\n4. ' + actions[3] + '\n\nMasukkan nomor (1-4):');
            
            if (choice >= 1 && choice <= 4) {
                alert(`Menjalankan: ${actions[choice-1]}\n\n✅ Aksi berhasil dijalankan!\n\n(Demo mode - SeismoSens Indonesia Inventors Day 2025`);
            }
        }

        function logout() {
            if (confirm('Yakin ingin keluar dari akun SeismoSens?')) {
                alert('✅ Berhasil logout!\n\nTerima kasih telah menggunakan SeismoSens.\n\n(Demo mode - Indonesia Inventors Day 2025)');
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