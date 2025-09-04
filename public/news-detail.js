import { db, checkAuthState } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadNewsDetail() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = "/public/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    document.body.innerHTML = "<p>❌ ID berita tidak ditemukan.</p>";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "news", id));
    if (!snap.exists()) {
      document.body.innerHTML = "<p>❌ Berita tidak ditemukan.</p>";
      return;
    }

    const data = snap.data();
    document.getElementById("news-title").textContent = data.title;
    document.getElementById("news-meta").textContent =
      (data.createdAt?.toDate().toLocaleString("id-ID") ?? "") +
      " · " +
      (data.authorName ?? "Admin");
    document.getElementById("news-content").textContent = data.content;
  } catch (err) {
    console.error("❌ Gagal ambil detail:", err);
    document.body.innerHTML = "<p>❌ Gagal memuat berita.</p>";
  }
}

loadNewsDetail();
