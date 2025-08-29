import { db, checkAuthState } from "./auth.js";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadNews() {
  const user = await checkAuthState();
  if (!user) {
    // kalau belum login, paksa balik ke login
    window.location.href = "/login/login.html";
    return;
  }

  const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const container = document.getElementById("news-list");
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = `<p class="muted">Belum ada berita terkini.</p>`;
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const date = data.createdAt?.toDate().toLocaleString("id-ID") ?? "";

    container.innerHTML += `
      <div class="device-card">
        <div class="device-header">
          <div class="device-info">
            <h3>${data.title}</h3>
            <p style="color:#64748b; font-size:13px;">${date}</p>
          </div>
        </div>
        <div class="device-metrics">
          <p style="font-size:15px; line-height:1.5; color:#1e293b;">
            ${data.content}
          </p>
        </div>
      </div>
    `;
  });
}

loadNews();
