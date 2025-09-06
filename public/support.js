import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
const db = window._firebase.db;

export async function sendSupportMessage() {
  const msg = document.getElementById("supportMsg").value.trim();
  if (!msg) return alert("Pesan kosong!");
  const user = window._firebase.auth.currentUser;
  try {
    await addDoc(collection(db, "supportMessages"), {
      uid: user?.uid || "anon",
      email: user?.email || "anonim",
      message: msg,
      time: serverTimestamp()
    });
    alert("Pesan terkirim ke support!");
    document.getElementById("supportMsg").value = "";
  } catch (err) {
    alert("Error: " + err.message);
  }
}
window.sendSupportMessage = sendSupportMessage;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.createElement("div");
  container.id = "support-page";
  container.className = "page-content";
  container.innerHTML = `
    <div class="header">
      <div class="welcome-text">
        <div class="welcome-title">Bantuan & Support ❓</div>
        <div class="welcome-subtitle">Tanya jawab & kirim pesan ke admin</div>
      </div>
    </div>
    <div style="padding:20px;">
      <div id="aiChatBox" style="border:1px solid #e2e8f0;padding:10px;border-radius:12px;height:250px;overflow-y:auto;">
        <p><b>AI Asisten:</b> Halo! Ada yang bisa saya bantu?</p>
      </div>
      <div style="margin-top:10px;display:flex;gap:5px;">
        <input id="aiInput" type="text" placeholder="Tulis pertanyaan..."
          style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:12px;"/>
        <button onclick="sendAIMessage()" class="btn-delete-account" style="background:#10b981;">Kirim</button>
      </div>
      <textarea id="supportMsg" placeholder="Atau tulis pesan untuk admin..."
        style="margin-top:15px;width:100%;height:100px;padding:12px;border-radius:12px;border:1px solid #e2e8f0;"></textarea>
      <button onclick="sendSupportMessage()" class="btn-delete-account" style="background:#3b82f6;margin-top:10px;">Kirim ke Admin</button>
      <button onclick="showSetting('Profile')" class="btn-delete-account" style="margin-top:15px;">⬅ Kembali</button>
    </div>
  `;
  document.body.appendChild(container);
});

// Fake AI
window.sendAIMessage = function() {
  const input = document.getElementById("aiInput");
  const box = document.getElementById("aiChatBox");
  if (!input.value.trim()) return;
  box.innerHTML += `<p><b>Anda:</b> ${input.value}</p>`;
  setTimeout(() => {
    box.innerHTML += `<p><b>AI Asisten:</b> Saya akan bantu jawab: "${input.value}"</p>`;
    box.scrollTop = box.scrollHeight;
  }, 800);
  input.value = "";
};

// Simpan pesan ke admin (simulasi, bisa dikaitkan Firestore)
window.sendSupportMessage = function() {
  const msg = document.getElementById("supportMsg").value.trim();
  if (!msg) return alert("Pesan kosong!");
  alert("✅ Pesan terkirim ke admin: " + msg);
  document.getElementById("supportMsg").value = "";
};

