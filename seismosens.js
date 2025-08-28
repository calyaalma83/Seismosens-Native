// Global variables
let map;
let mapInitialized = false;

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

// Initialize the application
function initApp() {
    console.log('Initializing app...');
    
    // Initial page load - show home page by default
    switchPage('home');
    
    // Update time every second
    setInterval(updateTime, 1000);
    
    // Update stats periodically
    updateStats();
    setInterval(updateStats, 10000);
    
    // Initialize map if on map page
    if (window.location.hash === '#map') {
        initializeMap();
    }
}

// Map related functions
function initializeMap() {
    console.log('Initializing map...');
    try {
        if (typeof L === 'undefined') {
            console.log('Leaflet not loaded yet');
            setTimeout(initializeMap, 100);
            return;
        }
        
        map = L.map('map').setView([-7.566667, 110.816667], 13); // Center on Solo
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add markers from devices array
        devices.forEach(device => {
            const marker = L.marker([device.lat, device.lng]).addTo(map);
            marker.bindPopup(`<b>${device.name}</b><br>${device.category}`);
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
        // Retry after a delay if there was an error
        setTimeout(initializeMap, 1000);
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
    if (map) map.setView([-7.566667, 110.816667], 13);
}

// Interactive functions
function showNotifications() {
    alert('Notifikasi akan ditampilkan di sini');
}

function showDeviceDetail(deviceName) {
    console.log('Showing device details for:', deviceName);
}

function showLocationDetail(locationName) {
    console.log('Showing location details for:', locationName);
}

function showSetting(settingName) {
    console.log('Showing setting:', settingName);
}

function showQuickActions() {
    const quickActions = document.getElementById('quickActions');
    if (quickActions) {
        quickActions.style.display = quickActions.style.display === 'none' ? 'flex' : 'none';
    }
}

// Logout function
async function logout() {
    try {
        if (window.auth && typeof window.auth.signOut === 'function') {
            await window.auth.signOut();
        }
        window.location.href = '/login/login.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Gagal keluar. Silakan coba lagi.');
    }
}

// Real-time data updates
function updateStats() {
    // Simulate real-time data updates
    const stats = {
        activeDevices: Math.floor(Math.random() * 50) + 50, // 50-100
        alerts: Math.floor(Math.random() * 10),
        avgResponse: (Math.random() * 2 + 1).toFixed(2) + 's'
    };
    
    // Update UI
    const statsElements = document.querySelectorAll('.stat-value');
    statsElements.forEach(el => {
        const statType = el.getAttribute('data-stat');
        if (statType in stats) {
            el.textContent = stats[statType];
        }
    });
}

function updateTime() {
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0');
    const timeElement = document.querySelector('.status-bar div');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Devices data
const devices = [
    { lat: -7.5694, lng: 110.8192, type: 'normal', name: 'Balai Kota Surakarta', category: 'Pemerintahan' },
    { lat: -7.5695, lng: 110.8096, type: 'normal', name: 'RSUD Dr. Moewardi', category: 'Rumah Sakit' },
    { lat: -7.56043, lng: 110.856619, type: 'warning', name: 'UNS Kentingan', category: 'Universitas' },
    { lat: -7.5648, lng: 110.8242, type: 'normal', name: 'SMAN 1 Surakarta', category: 'Sekolah' },
    { lat: -7.5556, lng: 110.8235, type: 'normal', name: 'Stasiun Solo Balapan', category: 'Transportasi' },
    { lat: -7.5670, lng: 110.8107, type: 'normal', name: 'Solo Grand Mall', category: 'Pusat Belanja' },
    { lat: -7.5782384, lng: 110.8255062, type: 'normal', name: 'Keraton Surakarta', category: 'Budaya' },
];

// Make all functions available globally
window.switchPage = switchPage;
window.initApp = initApp;
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

// Add touch feedback
document.querySelectorAll('.device-card, .settings-item, .nav-item').forEach(element => {
    element.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
    });
    
    element.addEventListener('touchend', function() {
        this.style.transform = '';
    });
    
    element.addEventListener('touchcancel', function() {
        this.style.transform = '';
    });
});

// Debug log to verify functions are available
console.log('Global functions initialized:', {
    switchPage: typeof window.switchPage,
    initApp: typeof window.initApp,
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
    logout: typeof window.logout
});
