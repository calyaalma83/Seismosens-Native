import { 
  collection, getDocs, doc, deleteDoc, setDoc, updateDoc, serverTimestamp, getDoc 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
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

// panggil saat halaman admin load
loadNewsAdmin();