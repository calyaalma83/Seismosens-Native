// Variables global
let map;
let mapInitialized = false;

// Ekspor fungsi-fungsi yang diperlukan
export function switchPage(pageName, event) {
    // Prevent default if event exists (for anchor tags)
    if (event) {
        event.preventDefault();
    }
    
    console.log('Switching to page:', pageName);
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active to clicked nav item
    let clickedItem = null;
    if (event) {
        clickedItem = event.target.closest('.nav-item');
        if (!clickedItem) {
            // If click was on a child element, find the parent nav-item
            clickedItem = event.target.closest('.bottom-nav').querySelector(`[onclick*="${pageName}"]`);
        }
    } else {
        clickedItem = document.querySelector(`.nav-item[onclick*="${pageName}"]`);
    }
    
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Target page not found:', pageName + '-page');
    }
    
    // Initialize map if switching to map page
    if (pageName === 'map' && !mapInitialized) {
        setTimeout(initializeMap, 300);
    }
}

// Make functions available globally
window.switchPage = switchPage;

// Initialize the application
export function initApp() {
  console.log('Initializing app...');
  
  // Initial page load - show home page by default
  switchPage('home');
  
  // Update time every second
  setInterval(updateTime, 1000);
  
  // Update stats periodically
  updateStats();
  setInterval(updateStats, 30000); // Update every 30 seconds
  
  // Initialize map if on map page
  if (window.location.hash === '#map') {
    initializeMap();
  }
}

// Make initApp available globally
window.initApp = initApp;

// Map related functions
export function initializeMap() {
  console.log('Initializing map...');
  map = L.map('map').setView([-7.566667, 110.816667], 13); // Center on Solo
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Add markers from devices array
  devices.forEach(device => {
    const marker = L.marker([device.lat, device.lng]).addTo(map);
    marker.bindPopup(`<b>${device.name}</b><br>${device.category}`);
  });
  
  mapInitialized = true;
}

// Map controls
export function zoomIn() {
  if (map) map.zoomIn();
}

export function zoomOut() {
  if (map) map.zoomOut();
}

export function centerMap() {
  if (map) map.setView([-7.566667, 110.816667], 13);
}

// Interactive functions
export function showNotifications() {
  alert('Fitur notifikasi akan segera hadir!');
}

export function showDeviceDetail(deviceName) {
  alert(`Detail perangkat: ${deviceName}`);
}

export function showLocationDetail(locationName) {
  alert(`Detail lokasi: ${locationName}`);
}

export function showSetting(settingName) {
  alert(`Pengaturan: ${settingName}`);
}

export function showQuickActions() {
  const quickActions = document.getElementById('quickActions');
  if (quickActions) {
    quickActions.style.display = quickActions.style.display === 'block' ? 'none' : 'block';
  }
}

// Real-time data updates
export function updateStats() {
  // Update metrics
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

export function updateTime() {
  const now = new Date();
  const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                   now.getMinutes().toString().padStart(2, '0');
  const timeElement = document.querySelector('.status-bar div');
  if (timeElement) {
    timeElement.textContent = timeString;
  }
}

// Make all functions available globally
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.centerMap = centerMap;
window.showNotifications = showNotifications;
window.showDeviceDetail = showDeviceDetail;
window.showLocationDetail = showLocationDetail;
window.showSetting = showSetting;
window.showQuickActions = showQuickActions;

// Make logout function available globally
window.logout = logout;

// Devices data
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

// Navigation function
function switchPage(pageName, event) {
    // Prevent default if event exists (for anchor tags)
    if (event) {
        event.preventDefault();
    }
    
    console.log('Switching to page:', pageName);
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active to clicked nav item
    let clickedItem = null;
    if (event) {
        clickedItem = event.target.closest('.nav-item');
        if (!clickedItem) {
            // If click was on a child element, find the parent nav-item
            clickedItem = event.target.closest('.bottom-nav').querySelector(`[onclick*="${pageName}"]`);
        }
    } else {
        clickedItem = document.querySelector(`.nav-item[onclick*="${pageName}"]`);
    }
    
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Target page not found:', pageName + '-page');
    }
    
    // Initialize map if switching to map page
    if (pageName === 'map' && !mapInitialized) {
        setTimeout(initializeMap, 300);
    }
}

// Make switchPage available globally
window.switchPage = switchPage;

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

        // Initialize the application
function initApp() {
  console.log('Initializing app...');
  
  // Initial page load - show home page by default
  // Use 'home' instead of 'beranda' to match the page IDs
  switchPage('home');
  
  // Update time every second
  setInterval(updateTime, 1000);
  
  // Update stats periodically
  updateStats();
  setInterval(updateStats, 30000); // Update every 30 seconds
  
  // Initialize map if on map page
  if (window.location.hash === '#map') {
    switchPage('map');
  }
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