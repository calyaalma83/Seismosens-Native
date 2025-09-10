// Import auth functions
import { 
  getFirebase, 
  getFirebaseAuth, 
  getFirestore, 
  getRealtimeDatabase 
} from '../auth.js';

// Initialize Firebase services
let auth, db, onAuthStateChanged, signOut, collection, getDocs, doc, deleteDoc, setDoc, updateDoc, serverTimestamp, getDoc, onSnapshot, getDatabase, ref, onValue;

// Initialize function that will be called from admin.html
async function initAdmin() {
  try {
    // Initialize Firebase services
    const firebase = await getFirebase();
    const authModule = await getFirebaseAuth();
    const firestore = await getFirestore();
    const database = await getRealtimeDatabase();
    
    // Extract needed functions
    ({ onAuthStateChanged, signOut } = authModule);
    ({ collection, getDocs, doc, deleteDoc, setDoc, updateDoc, serverTimestamp, getDoc, onSnapshot } = firestore);
    ({ getDatabase, ref, onValue } = database);
    
    // Set auth and db
    auth = firebase.auth;
    db = firestore;
    
    // Initialize the rest of the admin functionality
    initAuthListener();
    
    // Set up tab switching
    setupTabNavigation();
    
    // Setup logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Setup news form if it exists
    const newsForm = document.getElementById('news-form');
    if (newsForm) {
      newsForm.addEventListener('submit', handleNewsSubmit);
    }
    
    // Show loading indicator while initializing
    const loading = document.querySelector('.loading');
    if (loading) loading.style.display = 'flex';
    
    // Hide loading indicator when done
    setTimeout(() => {
      if (loading) loading.style.display = 'none';
    }, 1000);
    
  } catch (error) {
    console.error('Error initializing admin:', error);
    window.location.href = '/login.html';
  }
}

// Check if user is admin
function checkAdmin(user) {
  return new Promise(async (resolve) => {
    if (!user) {
      resolve(false);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      resolve(false);
    }
  });
}

function listenUserDevices(userId) {
  const sessionsRef = collection(db, "userDevices", userId, "sessions");
  onSnapshot(sessionsRef, (snapshot) => {
    console.log("Realtime devices:", snapshot.docs.map(d => d.data()));
  });
}

async function loadPresence() {
  const presenceList = document.getElementById("presenceList");
  presenceList.innerHTML = "<p>Memuat data...</p>";

  const rtdb = getDatabase();
  const presenceRef = ref(rtdb, "presence");

  onValue(presenceRef, (snapshot) => {
    presenceList.innerHTML = "";
    const data = snapshot.val() || {};
    Object.keys(data).forEach(uid => {
      const p = data[uid];
      const div = document.createElement("div");
      div.className = "device-card";
      div.innerHTML = `
        <strong>${p.email}</strong><br>
        Device: ${p.device}<br>
        Status: <span style="color:${p.online ? 'green':'red'}">${p.online ? 'Online':'Offline'}</span><br>
        Last Seen: ${new Date(p.lastActive).toLocaleString("id-ID")}
      `;
      presenceList.appendChild(div);
    });
  });
}

document.addEventListener("DOMContentLoaded", loadPresence);


// Initialize authentication listener
function initAuthListener() {
  onAuthStateChanged(auth, async (user) => {
    try {
      const isAdmin = await checkAdmin(user);
      
      if (!isAdmin) {
        // Redirect to login if not admin
        window.location.href = '/login.html';
        return;
      }
      
      // User is admin, load admin content
      const adminInfo = document.getElementById('admin-info');
      if (adminInfo) {
        adminInfo.textContent = `Logged in as: ${user.email}`;
      }
      
      // Show the admin interface
      document.body.style.display = 'block';
      
      // Load initial content
      showSection('users');
      loadUsers();
      
    } catch (error) {
      console.error('Error in auth state change:', error);
      window.location.href = '/login.html';
    }
  });
}

// Set up tab navigation
function setupTabNavigation() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-tab');
      showSection(section);
      
      // Load the appropriate content
      if (section === 'users') {
        loadUsers();
      } else if (section === 'news') {
        loadNewsAdmin();
      } else if (section === 'support') {
        if (typeof loadSupportTickets === 'function') {
          loadSupportTickets();
        }
      } else if (section === 'presence') {
        // Load presence data if needed
        if (typeof loadPresence === 'function') {
          loadPresence();
        }
      }
    });
  });
}

// Handle logout
function handleLogout() {
  signOut(auth).then(() => {
    window.location.href = '/login.html';
  }).catch(error => {
    console.error('Error signing out:', error);
  });
}

// Handle news form submission
async function handleNewsSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('title')?.value;
  const content = document.getElementById('content')?.value;
  
  if (!title || !content) {
    alert('Judul dan konten berita harus diisi');
    return;
  }
  
  try {
    await setDoc(doc(collection(db, 'news')), {
      title,
      content,
      createdAt: serverTimestamp(),
      author: auth.currentUser?.email || 'Admin',
      authorId: auth.currentUser?.uid || 'system'
    });
    alert('Berita berhasil ditambahkan!');
    e.target.reset();
    loadNewsAdmin();
  } catch (error) {
    console.error('Error adding news:', error);
    alert('Gagal menambahkan berita: ' + (error.message || 'Terjadi kesalahan'));
  }
}

// Load users for admin
async function loadUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
      const user = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.displayName || '-'}</td>
        <td>${user.email || '-'}</td>
        <td>${user.role || 'user'}</td>
        <td>${user.createdAt?.toDate?.().toLocaleDateString() || '-'}</td>
        <td>
          <button class="btn btn-small btn-danger" onclick="deleteUser('${doc.id}')">
            <i class="fas fa-trash"></i> Hapus
          </button>
        </td>
      `;
      userList.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Make deleteUser function available globally
window.deleteUser = async (userId) => {
  if (!confirm('Yakin ingin menghapus pengguna ini?')) return;
  
  try {
    await deleteDoc(doc(db, 'users', userId));
    alert('Pengguna berhasil dihapus');
    loadUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Gagal menghapus pengguna');
  }
};

// ============= SUPPORT MESSAGES =============
async function loadSupportMessages() {
  try {
    const snapshot = await getDocs(collection(db, "supportMessages"));
    const supportList = document.getElementById("support-list");
    supportList.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const date = data.time?.toDate().toLocaleString("id-ID") ?? "-";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${data.uid || "-"}</td>
        <td>${data.email || "-"}</td>
        <td>${data.message || "-"}</td>
        <td>${date}</td>
        <td>
          <button class="btn btn-small btn-danger delete-support" data-id="${docSnap.id}">🗑 Hapus</button>
        </td>
      `;
      supportList.appendChild(row);
    });

    // tombol hapus pesan
    document.querySelectorAll(".delete-support").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Yakin mau hapus pesan ini?")) {
          try {
            await deleteDoc(doc(db, "supportMessages", id));
            alert("✅ Pesan support dihapus!");
            loadSupportMessages();
          } catch (err) {
            console.error("❌ Gagal hapus pesan:", err);
            alert("Tidak bisa menghapus pesan.");
          }
        }
      });
    });

  } catch (err) {
    console.error("❌ Gagal load support:", err);
    alert("Tidak bisa memuat pesan support.");
  }
}


// ============= DAFTAR BERITA =============
async function loadNewsAdmin() {
  try {
    const snapshot = await getDocs(collection(db, "news"));
    const newsList = document.getElementById("news-list");
    newsList.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const date = data.createdAt?.toDate().toLocaleString("id-ID") ?? "-";

      const row = `
        <tr>
          <td>${data.title}</td>
          <td>${data.content.substring(0, 50)}...</td>
          <td>${date}</td>
          <td>
            <button class="btn btn-small btn-warning edit-news" data-id="${id}">✏️ Edit</button>
            <button class="btn btn-small btn-danger delete-news" data-id="${id}">🗑 Hapus</button>
          </td>
        </tr>
      `;
      newsList.innerHTML += row;
    });

    // Hapus berita
    document.querySelectorAll(".delete-news").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Yakin mau hapus berita ini?")) {
          try {
            await deleteDoc(doc(db, "news", id));
            alert("✅ Berita berhasil dihapus!");
            loadNewsAdmin();
          } catch (err) {
            console.error("❌ Gagal hapus berita:", err);
            alert("Tidak bisa menghapus berita.");
          }
        }
      });
    });

    // Edit berita
    document.querySelectorAll(".edit-news").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        try {
          const snap = await getDoc(doc(db, "news", id));
          if (!snap.exists()) {
            alert("Berita tidak ditemukan.");
            return;
          }
          const data = snap.data();

          // tampilkan section edit
          document.getElementById("edit-section").style.display = "block";
          document.getElementById("edit-title").value = data.title;
          document.getElementById("edit-content").value = data.content;

          // handle update
          const editForm = document.getElementById("edit-form");
          editForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
              await updateDoc(doc(db, "news", id), {
                title: document.getElementById("edit-title").value,
                content: document.getElementById("edit-content").value,
                updatedAt: serverTimestamp()
              });
              alert("✅ Berita berhasil diperbarui!");
              editForm.reset();
              document.getElementById("edit-section").style.display = "none";
              loadNewsAdmin();
            } catch (err) {
              console.error("❌ Gagal update:", err);
              alert("Tidak bisa update berita.");
            }
          };

          // handle cancel
          document.getElementById("cancel-edit").onclick = () => {
            document.getElementById("edit-section").style.display = "none";
            editForm.reset();
          };

        } catch (err) {
          console.error("❌ Gagal ambil berita:", err);
        }
      });
    });

  } catch (err) {
    console.error("❌ Gagal load berita:", err);
    alert("Tidak bisa memuat daftar berita.");
  }
}

// Function to show a specific section and hide others
function showSection(sectionId) {
  // Hide all sections first
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show the selected section
  const selectedSection = document.getElementById(`${sectionId}Section`);
  if (selectedSection) {
    selectedSection.style.display = 'block';
  } else {
    console.warn(`Section with ID '${sectionId}Section' not found`);
  }
  
  // Add active class to the clicked button
  const activeButton = document.querySelector(`.tab-btn[data-tab="${sectionId}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  } else {
    console.warn(`Tab button for section '${sectionId}' not found`);
  }
  
  // Load data for the section if needed
  if (sectionId === 'users') {
    loadUsers();
  } else if (sectionId === 'news') {
    // Show both add news and news list sections
    document.getElementById('addNewsSection').style.display = 'block';
    document.getElementById('newsSection').style.display = 'block';
    loadNewsAdmin();
  } else if (sectionId === 'presence') {
    loadPresence();
  } else if (sectionId === 'support') {
    if (typeof loadSupportTickets === 'function') {
      loadSupportTickets();
    }
  }
}

// Make functions available globally if needed
window.deleteUser = deleteUser;
window.loadUsers = loadUsers;
window.loadNewsAdmin = loadNewsAdmin;
window.loadPresence = loadPresence;

// Export the initAdmin function as default
export default initAdmin;
