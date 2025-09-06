export function loadStorageInfo() {
    const el = document.getElementById("storageInfo");
    el.textContent = "Menghitung...";
    setTimeout(() => {
      el.textContent = "2.3GB dari 8GB terpakai";
    }, 500);
  }
  window.addEventListener("DOMContentLoaded", loadStorageInfo);
  

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.createElement("div");
    container.id = "storage-page";
    container.className = "page-content";
    container.innerHTML = `
      <div class="header">
        <div class="welcome-text">
          <div class="welcome-title">Penyimpanan 💾</div>
          <div class="welcome-subtitle">Kelola backup & penggunaan storage</div>
        </div>
      </div>
      <div style="padding:20px;">
        <p id="storageInfo">Sedang menghitung...</p>
        <button onclick="backupData()" class="btn-delete-account" style="background:#06b6d4;">Backup Data</button>
        <button onclick="exportData()" class="btn-delete-account" style="background:#f59e0b;margin-left:10px;">Export Data</button>
        <button onclick="showSetting('Profile')" class="btn-delete-account" style="margin-top:15px;">⬅ Kembali</button>
      </div>
    `;
    document.body.appendChild(container);
  
    // Simulasi data storage
    setTimeout(() => {
      document.getElementById("storageInfo").textContent = "2.3GB dari 8GB terpakai";
    }, 800);
  });
  
  window.backupData = function() {
    alert("✅ Data berhasil di-backup (simulasi).");
  };
  
  window.exportData = function() {
    alert("✅ Data berhasil di-export (simulasi).");
  };
  