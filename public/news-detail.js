import { getFirebase, checkAuthState } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadNewsDetail() {
  // pastikan user login
  const user = await checkAuthState();
  if (!user) {
    window.location.href = "/login.html"; 
    return;
  }

  // ambil id dari URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    document.body.innerHTML = "<p>❌ ID berita tidak ditemukan.</p>";
    return;
  }

  try {
    // ambil firestore instance
    const { db } = await getFirebase();
    if (!db) {
      console.error("❌ Firestore belum siap (db undefined).");
      document.body.innerHTML = "<p>❌ Database belum siap, coba reload halaman.</p>";
      return;
    }

    // ambil dokumen berita
    const snap = await getDoc(doc(db, "news", id));
    if (!snap.exists()) {
      console.warn("❌ Dokumen berita tidak ditemukan di Firestore:", id);
      document.body.innerHTML = "<p>❌ Berita tidak ditemukan.</p>";
      return;
    }

    // isi konten berita ke DOM
    const data = snap.data();
    const date = data.createdAt?.toDate().toLocaleString("id-ID") ?? "-";
    const author = data.author ?? "Admin";

    document.getElementById("news-title").textContent =
      data.title || "Judul tidak tersedia";
    document.getElementById("news-meta").textContent = `${date} · ${author}`;
    document.getElementById("news-content").innerHTML =
      data.content || "Konten tidak tersedia";

    // hapus indikator loading
    document.querySelectorAll(".loading").forEach(el =>
      el.classList.remove("loading")
    );

    console.log("✅ Berita berhasil dimuat:", { id, ...data });
  } catch (err) {
    console.error("❌ Gagal ambil detail:", err);
    document.body.innerHTML = "<p>❌ Gagal memuat berita.</p>";
  }
}

loadNewsDetail();