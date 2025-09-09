// Import Firebase functions
import { 
  auth, 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from '../firebase.js';

// Make sendMessage globally available
window.sendMessage = sendMessage;

// ✅ Gemini API
const API_KEY = "AIzaSyDzHnhIj8QQRTwben9uzDw7kWVjXJg0nBA";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Cari elemen setelah DOM siap
const chatbox = document.getElementById("chatMessages");
const input = document.getElementById("chatInput");

if (!chatbox || !input) {
  console.error("❌ chatMessages atau chatInput tidak ditemukan di DOM!");
}

let userId = null;

// 🔹 Pakai akun login (bukan anonymous)
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    console.log("✅ Logged in:", userId);
    loadHistory();
  } else {
    console.warn("⚠️ Belum login, redirect ke login.html");
    // window.location.href = "login.html"; // aktifkan kalau mau auto redirect
  }
});

// 🔹 Tambah pesan + simpan Firestore
async function addMessage(text, sender, save = true) {
  if (!chatbox) return; // ⬅️ Guard biar ga null error

  const bubble = document.createElement("div");
  bubble.className = "message " + sender;
  bubble.textContent = text;
  chatbox.appendChild(bubble);

  if (save && userId) {
    try {
      await addDoc(collection(db, "users", userId, "chatHistory"), {
        text,
        sender,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("❌ Firestore save error:", e);
    }
  }

  chatbox.scrollTop = chatbox.scrollHeight;
}

// 🔹 Load history
async function loadHistory() {
  if (!userId || !chatbox) return;

  try {
    const q = query(collection(db, "users", userId, "chatHistory"), orderBy("timestamp"));
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      addMessage(msg.text, msg.sender, false);
    });
  } catch (err) {
    console.error("❌ Load history error:", err);
  }
}

// 🔹 Kirim pesan
async function sendMessage() {
  if (!input || !chatbox) return;

  const message = input.value.trim();
  if (!message) return;

  await addMessage(message, "user");
  input.value = "";

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.textContent = "AI sedang mengetik...";
  chatbox.appendChild(loading);
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
      }),
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak bisa menjawab.";

    loading.remove();
    await addMessage(reply, "ai");
  } catch (err) {
    console.error("❌ Gemini API error:", err);
    loading.textContent = "❌ Error koneksi ke server.";
  }
}

// ✅ supaya tombol HTML bisa panggil
window.sendMessage = sendMessage;
