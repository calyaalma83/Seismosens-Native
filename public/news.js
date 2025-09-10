import { getFirebase, checkAuthState } from "./auth.js";
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadNews() {
  const container = document.getElementById("news-list");
  if (!container) return;

  try {
    // cek auth
    const user = await checkAuthState();
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    // init firestore
    const { db } = await getFirebase();
    container.innerHTML = `<p class="text-muted">⏳ Memuat berita...</p>`;

    // query koleksi "news"
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = `<p class="text-muted">Belum ada berita terkini.</p>`;
      return;
    }

    // render berita
    const newsHTML = snapshot.docs.map(docSnap => {
      const d = docSnap.data();
      const date = d.createdAt?.toDate?.().toLocaleString("id-ID") || "-";
      const id = docSnap.id;
      const rawContent = d.content || "Konten tidak tersedia";
      const snippet = rawContent.length > 100 ? rawContent.substring(0, 100) + "..." : rawContent;

      return `
        <div class="news-item" onclick="window.location.href='news-detail.html?id=${id}'">
          <h5 class="card-title">${d.title || "Judul tidak tersedia"}</h5>
          <h6 class="card-subtitle">${date}</h6>
          <p class="card-text">${snippet}</p>
        </div>
      `;
    }).join("");

    container.innerHTML = newsHTML;

  } catch (err) {
    console.error("❌ Gagal load berita:", err);
    container.innerHTML = `
      <div class="alert alert-error">
        Gagal memuat berita. Silakan muat ulang halaman atau coba lagi nanti.
      </div>
    `;
  }
}

loadNews();