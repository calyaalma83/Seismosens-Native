import { auth, checkAuthState, deleteUser } from "./auth.js";

// Constants
const surakartaCenter = [-7.566667, 110.816667];

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
            const bottomNav = event.target.closest('.bottom-nav');
            if (bottomNav) {
                clickedItem = bottomNav.querySelector(`[onclick*="${pageName}"]`);
            }
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
        
        // Initialize map if switching to map page
        if (pageName === 'map' && !mapInitialized) {
            setTimeout(initializeMap, 300);
        }
    } else {
        console.error('Target page not found:', pageName + '-page');
    }
}

// Initialize the application
async function initApp() {
    console.log('Initializing app...');
    
    try {
        // Wait for auth state to be ready
        const user = await checkAuthState();
        console.log('App initialized with user:', user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        } : 'No user signed in');
        
        // Update user profile info
        await updateProfileUI();
        
        // Initial page load - show home page by default
        switchPage('home');
        
        // Update time every second
        updateTime();
        setInterval(updateTime, 1000);
        
        // Update stats periodically
        updateStats();
        setInterval(updateStats, 10000);
        
        // Initialize map if on map page
        if (window.location.hash === '#map') {
            initializeMap();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
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
];

// Export functions to window
window.switchPage = switchPage;
window.initializeMap = initializeMap;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.centerMap = centerMap;
window.showNotifications = showNotifications;
window.showDeviceDetail = showDeviceDetail;
window.showLocationDetail = showLocationDetail;
window.showSetting = showSetting;
window.showQuickActions = showQuickActions;
window.logout = logout;
window.updateStats = updateStats;
window.updateTime = updateTime;

// Update Profile Info dari Firebase User
async function updateProfileUI() {
    console.log('Updating profile UI...');
    try {
        const user = await checkAuthState();
        console.log('User data from checkAuthState:', user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified
        } : 'No user');
        
        if (user) {
            // Force refresh user data
            await user.reload();
            console.log('Refreshed user data:', {
                displayName: user.displayName,
                email: user.email
            });
            
            const displayName = user.displayName || 'Pengguna';
            console.log('Setting display name to:', displayName);
            
            const greetingName = document.getElementById('greetingName');
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profileAvatar = document.getElementById('profileAvatar');

            console.log('DOM elements found:', {
                greetingName: !!greetingName,
                profileName: !!profileName,
                profileEmail: !!profileEmail,
                profileAvatar: !!profileAvatar
            });

            if (greetingName) {
                greetingName.textContent = displayName;
                console.log('Updated greeting name to:', greetingName.textContent);
            }
            if (profileName) {
                profileName.textContent = displayName;
                console.log('Updated profile name to:', profileName.textContent);
            }
            if (profileEmail) {
                profileEmail.textContent = user.email || '';
                console.log('Updated profile email to:', profileEmail.textContent);
            }
            if (profileAvatar) {
                const initial = displayName[0].toUpperCase();
                profileAvatar.textContent = initial;
                console.log('Updated profile avatar to:', profileAvatar.textContent);
            }
        } else {
            console.log('No user is currently signed in');
        }
    } catch (error) {
        console.error('Error in updateProfileUI:', error);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('SeismoSens app initialized');
    
    // Initialize app
    initApp();
    
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
    
    // Update profile UI
    updateProfileUI();
});

// Export functions to window
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
window.updateProfileUI = updateProfileUI;
window.deleteAccount = async function() {
    if (confirm('Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.')) {
        try {
            const user = auth.currentUser;
            if (user) {
                await deleteUser(user);
                alert('Akun berhasil dihapus');
                window.location.href = '/login/login.html';
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Gagal menghapus akun: ' + error.message);
        }
    }
};

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
    logout: typeof window.logout,
    updateProfileUI: typeof window.updateProfileUI,
    deleteAccount: typeof window.deleteAccount
});
