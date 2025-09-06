import { updatePassword as fbUpdatePassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

export async function updatePassword() {
  const newPass = document.getElementById("newPassword").value;
  const user = window._firebase.auth.currentUser;
  if (!user) return alert("Anda belum login");
  try {
    await fbUpdatePassword(user, newPass);
    alert("Password diperbarui!");
  } catch (err) {
    alert("Error: " + err.message);
  }
}

export function enable2FA() {
  alert("2FA diaktifkan (simulasi).");
}

window.updatePassword = updatePassword;
window.enable2FA = enable2FA;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.createElement("div");
  container.id = "edit-profile-page";
  container.className = "page-content";
  container.innerHTML = `
    <h2>Edit Profil</h2>
    <p>Form edit nama, email, foto profil ada di sini.</p>
    <button onclick="showSetting('Profile')">⬅ Kembali</button>
  `;
  document.body.appendChild(container);
});

