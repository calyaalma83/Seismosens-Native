export function saveNotificationSettings() {
    const sys = document.getElementById("notifSystem").checked;
    const dev = document.getElementById("notifDevice").checked;
    localStorage.setItem("notifSettings", JSON.stringify({ sys, dev }));
    alert("Pengaturan notifikasi disimpan!");
  }
  window.saveNotificationSettings = saveNotificationSettings;
  