// admin.js
import { 
    auth, 
    db, 
    signOut, 
    requireAdmin 
  } from "../auth.js";
  
  import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    serverTimestamp 
  } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
  
  // 🔹 Pastikan hanya admin bisa akses halaman ini
  requireAdmin();
  
  // ============= DAFTAR USER =============
  async function loadUsers() {
    const snapshot = await getDocs(collection(db, "users"));
    const userList = document.getElementById("user-list");
    userList.innerHTML = "";
  
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate().toLocaleString("id-ID") ?? "-";
      const roleBadge = data.role === "admin" 
        ? '<span class="badge badge-admin">Admin</span>' 
        : '<span class="badge badge-user">User</span>';
  
      const row = `
        <tr>
          <td>${data.email}</td>
          <td>${roleBadge}</td>
          <td>${date}</td>
        </tr>
      `;
      userList.innerHTML += row;
    });
  }
  
  // ============= TAMBAH BERITA =============
  const form = document.getElementById("news-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
  
    if (!title || !content) {
      alert("Judul dan isi berita wajib diisi!");
      return;
    }
  
    try {
      const newsRef = doc(collection(db, "news"));
      await setDoc(newsRef, {
        title,
        content,
        createdAt: serverTimestamp()
      });
  
      alert("Berita berhasil ditambahkan!");
      form.reset();
    } catch (err) {
      console.error("Gagal tambah berita:", err);
      alert("Gagal menambahkan berita. Coba lagi.");
    }
  });
  
  // ============= LOGOUT =============
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "/login/login.html";
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
  
  // Load awal
  loadUsers();
  