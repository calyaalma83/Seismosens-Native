import { db, checkAuthState } from "./auth.js";
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadNews() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = "/public/login.html";
    return;
  }

  const container = document.getElementById("news-list");
  container.innerHTML = `<p class="muted">Memuat berita...</p>`;

  try {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `<p class="muted">Belum ada berita terkini.</p>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate().toLocaleString("id-ID") ?? "";
      const newsId = docSnap.id;

      // Hanya tampilkan judul + tanggal
      container.innerHTML += `
        <div class="news-card" onclick="window.location.href='news-detail.html?id=${newsId}'">
          <h3 class="news-title">${data.title}</h3>
          <p class="news-meta">${date} · ${data.authorName ?? "Admin"}</p>
        </div>
      `;
    });
        
  } catch (err) {
    console.error("❌ Gagal load berita:", err);
    container.innerHTML = `<p class="muted">Gagal memuat berita.</p>`;
  }
}

loadNews();