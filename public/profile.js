export async function saveProfile() {
    const name = document.getElementById("editName")?.value.trim();
    const username = document.getElementById("editUsername")?.value.trim();
    const user = window._firebase?.auth.currentUser;
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
  
  export function updateProfileUI() {
    const user = window._firebase?.auth.currentUser;
    if (!user) return;

    const nameElement = document.getElementById('profileName');
    const emailElement = document.getElementById('profileEmail');
    const avatarElement = document.getElementById('profileAvatar');

    if (nameElement) {
        nameElement.textContent = user.displayName || 'Pengguna';
    }
    
    if (emailElement) {
        emailElement.textContent = user.email || '';
    }
    
    if (avatarElement && !avatarElement.querySelector('img')) {
        const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';
        avatarElement.textContent = initial;
    }
}

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
    
    // Initialize profile data when page loads
    if (window.updateProfileUI) window.updateProfileUI();
    
    // Set up auth state listener
    window._firebase?.auth?.onAuthStateChanged((user) => {
        if (user) {
            if (window.updateProfileUI) window.updateProfileUI();
        }
    });
});

// Make functions available globally
window.saveProfile = saveProfile;
window.updateProfileUI = updateProfileUI;