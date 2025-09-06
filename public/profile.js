export async function saveProfile() {
    const name = document.getElementById("editName").value.trim();
    const username = document.getElementById("editUsername").value.trim();
    const user = window._firebase.auth.currentUser;
    if (!user) return alert("Anda belum login");
    try {
      await user.updateProfile({ displayName: name || user.displayName });
      alert("Profil diperbarui!");
      if (window.updateProfileUI) window.updateProfileUI();
      window.switchPage("profile");
    } catch (err) {
      alert("Error: " + err.message);
    }
  }
  window.saveProfile = saveProfile;

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
  
  