console.log("About page loaded");

document.addEventListener("DOMContentLoaded", () => {
    const container = document.createElement("div");
    container.id = "about-page";
    container.className = "page-content";
    container.innerHTML = `
      <div class="header">
        <div class="welcome-text">
          <div class="welcome-title">Tentang SeismoSens ℹ</div>
          <div class="welcome-subtitle">Informasi aplikasi & tim</div>
        </div>
      </div>
      <div style="padding:20px;">
        <p><b>Versi Aplikasi:</b> 2.1.0</p>
        <p><b>Pengembang:</b> SeismoSens Dev Team</p>
        <p><b>Deskripsi:</b> Aplikasi monitoring sensor seismik berbasis IoT & Firebase.</p>
        <button onclick="showSetting('Profile')" class="btn-delete-account" style="margin-top:25px;">⬅ Kembali</button>
      </div>
    `;
    document.body.appendChild(container);
  });
  