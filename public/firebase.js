// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Konfigurasi Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.appspot.com",
  messagingSenderId: "358453169511",
  appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2",
  databaseURL: "https://seismosens-a048e-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Export auth & db biar bisa dipakai di file lain
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

window._firebase = window._firebase || {};
window._firebase.app = app;
window._firebase.auth = auth;
window._firebase.db = db;
window._firebase.rtdb = rtdb;
window._firebase.ref = ref;
window._firebase.onValue = onValue;
window._firebase.set = set;

export { auth, db, rtdb };
