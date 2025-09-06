import { ref, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import {
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// 🔹 Simpan perubahan username
export async function saveProfile() {
  const username = document.getElementById("editUsername")?.value.trim();
  const oldPassword = document.getElementById("confirmPassword")?.value.trim();

  const user = window._firebase?.auth.currentUser;
  if (!user) return alert("❌ Kamu harus login dulu!");
  if (!username) return alert("⚠️ Username tidak boleh kosong!");
  if (!oldPassword) return alert("⚠️ Password lama wajib diisi!");

  try {
    // 🔹 Re-authenticate dengan password lama
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);

    // 🔹 Update displayName di Firebase Auth
    await updateProfile(user, { displayName: username });

    // 🔹 Simpan ke Firestore
    const userRef = doc(window._firebase.db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, {
        username: username,
        email: user.email
      });
    } else {
      await setDoc(userRef, {
        username: username,
        email: user.email,
        createdAt: new Date()
      });
    }

    // 🔹 Simpan ke Realtime DB
    await set (
      ref(window._firebase.rtdb, `users/${user.uid}/profile`),
      {
        username: username,
        email: user.email
      }
    );

    // 🔹 Refresh UI
    if (window.updateProfileUI) window.updateProfileUI();

    alert("✅ Username berhasil diperbarui");
    window.switchPage?.("profile");
  } catch (err) {
    console.error("❌ Gagal update username:", err);
    alert("❌ Gagal update username: " + err.message);
  }
}

// 🔹 Update UI profil
export function updateProfileUI() {
  const user = window._firebase?.auth.currentUser;
  if (!user) return;

  const nameElement = document.getElementById("profileName");
  const emailElement = document.getElementById("profileEmail");
  const avatarElement = document.getElementById("profileAvatar");

  if (nameElement) {
    nameElement.textContent = user.displayName || "Pengguna";
  }

  if (emailElement) {
    emailElement.textContent = user.email || "";
  }

  if (avatarElement) {
    avatarElement.textContent = "";
    const initial = user.displayName
      ? user.displayName.charAt(0).toUpperCase()
      : "U";
    avatarElement.textContent = initial;
  }
}

// 🔹 Biar fungsi bisa dipanggil dari HTML
window.saveProfile = saveProfile;
window.updateProfileUI = updateProfileUI;
