// firebase.js

// 1. Import fungsi yang dibutuhkan dari SDK
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged as _onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser as deleteAuthUser
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off, 
  push 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// 2. Konfigurasi Firebase Anda (ini sudah benar)
const firebaseConfig = {
    apiKey: "AIzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
    authDomain: "seismosens-a048e.firebaseapp.com",
    projectId: "seismosens-a048e",
    storageBucket: "seismosens-a048e.appspot.com",
    messagingSenderId: "358453169511",
    appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2",
    databaseURL: "https://seismosens-a048e-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// 3. Inisialisasi Firebase HANYA SEKALI di sini
let app;

try {
  // Coba dapatkan app yang sudah ada
  app = getApp();
} catch (e) {
  // Jika belum ada, inisialisasi baru
  app = initializeApp(firebaseConfig);
}

// 4. Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// 5. Export everything that might be needed
export {
  // App
  app,
  
  // Auth
  auth,
  _onAuthStateChanged as onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteAuthUser,
  
  // Firestore
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  
  // Realtime Database
  rtdb,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  push
};

// Make sure Firebase is only initialized once
if (!window._firebaseInitialized) {
  window._firebaseInitialized = true;
  console.log('Firebase initialized successfully!');
}

console.log("Firebase initialized successfully!");