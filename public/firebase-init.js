// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  deleteUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  browserSessionPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  update
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

console.log("Firebase init script loaded");

// 🔹 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.appspot.com",
  messagingSenderId: "358453169511",
  appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2",
  databaseURL:
    "https://seismosens-a048e-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// 🔹 Init Firebase
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// 🔹 Set persistence ke SESSION
setPersistence(auth, browserSessionPersistence)
  .then(() => console.log("Auth persistence set to SESSION"))
  .catch((err) => console.error("Error setting persistence:", err));

// 🔹 Global expose → semua file lain cukup pakai window._firebase
window._firebase = {
  app,
  auth,
  db,
  rtdb,

  // Auth
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  deleteUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,

  // Firestore
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,

  // Realtime Database
  ref,
  set,
  onValue,
  onDisconnect,
  update
};

// 🔹 Trigger event biar file lain bisa nunggu
window.dispatchEvent(new Event("firebase-initialized"));
console.log("✅ Firebase initialized successfully!");