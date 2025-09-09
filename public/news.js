import { getFirebase, checkAuthState } from "./auth.js";
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadNews() {
  try {
    const user = await checkAuthState();
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    // Initialize Firebase and get db instance
    const { db } = await getFirebase();
    
    const container = document.getElementById("news-list");
    container.innerHTML = `<p class="text-muted">Memuat berita...</p>`;

    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `<p class="text-muted">Belum ada berita terkini.</p>`;
      return;
    }

    let newsHTML = '';
    snapshot.forEach(docSnap => {
      try {
        const data = docSnap.data();
        const date = data.createdAt?.toDate() ? 
          data.createdAt.toDate().toLocaleString("id-ID") : 
          'Tanggal tidak tersedia';
        const newsId = docSnap.id;

        newsHTML += `
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">${data.title || 'Judul tidak tersedia'}</h5>
              <h6 class="card-subtitle mb-2 text-muted">${date}</h6>
              <p class="card-text">${data.content || 'Konten tidak tersedia'}</p>
            </div>
          </div>
        `;
      } catch (error) {
        console.error('Error processing news item:', error);
        newsHTML += `
          <div class="alert alert-warning">
            Gagal memuat berita. Silakan muat ulang halaman.
          </div>
        `;
      }
    });
    
    container.innerHTML = newsHTML;
        
  } catch (err) {
    console.error("❌ Gagal load berita:", err);
    const container = document.getElementById("news-list") || document.body;
    container.innerHTML = `
      <div class="alert alert-error">
        Gagal memuat berita. Silakan muat ulang halaman atau coba lagi nanti.
      </div>
    `;
  }
}

loadNews();