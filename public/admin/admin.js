// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.appspot.com",
  messagingSenderId: "358453169511",
  appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

// Handle authentication state
onAuthStateChanged(auth, async (user) => {
  const isAdmin = await checkAdmin(user);
  
  if (!isAdmin) {
    // Redirect to login if not admin
    window.location.href = '/login.html';
    return;
  }
  
  // User is admin, load admin content
  document.getElementById('admin-info').textContent = `Logged in as: ${user.email}`;
  
  // Load initial content
  showSection('users');
  loadUsers();
  
  // Set up tab switching
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
        // Trigger the loadSupportTickets function from support.js
        if (typeof loadSupportTickets === 'function') {
          loadSupportTickets();
        }
      }
    });
  });
  
  // Setup logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
      window.location.href = '/login.html';
    });
  });
  
  // Setup news form
  document.getElementById('news-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    
    try {
      await setDoc(doc(collection(db, 'news')), {
        title,
        content,
        createdAt: serverTimestamp(),
        author: user.email,
        authorId: user.uid
      });
      alert('Berita berhasil ditambahkan!');
      e.target.reset();
      loadNewsAdmin();
    } catch (error) {
      console.error('Error adding news:', error);
      alert('Gagal menambahkan berita');
    }
  });
});

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
  
  // Show the selected section and activate its button
  const section = document.getElementById(sectionId + 'Section');
  const button = document.querySelector(`.tab-btn[data-tab="${sectionId}"]`);
  
  if (section) section.style.display = 'block';
  if (button) button.classList.add('active');
  
  // Load data for the section if needed
  if (sectionId === 'users') {
    loadUsers();
  } else if (sectionId === 'news') {
    // Show both add news and news list sections
    document.getElementById('addNewsSection').style.display = 'block';
    document.getElementById('newsSection').style.display = 'block';
    loadNewsAdmin();
  } else if (sectionId === 'support') {
    if (typeof loadSupportTickets === 'function') {
      loadSupportTickets();
    }
  }
}

// panggil saat halaman admin load
showSection('users');