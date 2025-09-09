// firebase.js - Firebase initialization and utilities
console.log('firebase.js: Starting Firebase initialization');

// Import Firebase modules
import * as firebaseApp from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import * as firebaseAuth from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import * as firebaseFirestore from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import * as firebaseDatabase from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD07M2-79Yh0CzotaQeGYYy4WLZoevTdWY",
  authDomain: "seismosens-a048e.firebaseapp.com",
  projectId: "seismosens-a048e",
  storageBucket: "seismosens-a048e.appspot.com",
  messagingSenderId: "358453169511",
  appId: "1:358453169511:web:fccc32bf22ede39ff0b3c2",
  databaseURL: "https://seismosens-a048e-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
let app, auth, db, rtdb;

try {
  // Initialize Firebase app
  app = firebaseApp.initializeApp(firebaseConfig);
  
  // Initialize services
  auth = firebaseAuth.getAuth(app);
  db = firebaseFirestore.getFirestore(app);
  rtdb = firebaseDatabase.getDatabase(app);
  
  // Set auth persistence
  firebaseAuth.setPersistence(auth, firebaseAuth.browserSessionPersistence);
  
  // Make them globally available for backward compatibility
  window._firebase = { 
    app, 
    auth, 
    db,
    rtdb,
    firebase: {
      ...firebaseApp,
      ...firebaseAuth,
      ...firebaseFirestore,
      ...firebaseDatabase
    }
  };
  
  console.log('firebase.js: Firebase initialized successfully');
  console.log('firebase.js: _firebase object:', {
    app: !!app,
    auth: !!auth,
    db: !!db,
    rtdb: !!rtdb
  });
  
  // Dispatch event when Firebase is ready
  document.dispatchEvent(new Event('firebase-initialized'));
  
} catch (error) {
  console.error('firebase.js: Error initializing Firebase:', error);
  throw error; // Re-throw to ensure the app doesn't continue with broken Firebase
}

// Export individual services
export { app, auth, db, rtdb };

// Export commonly used functions
export const { 
  ref, 
  onValue, 
  set,
  getAuth,
  getFirestore,
  getDatabase,
  browserSessionPersistence
} = { ...firebaseAuth, ...firebaseFirestore, ...firebaseDatabase };

// Export all Firebase modules for advanced usage
export { firebaseApp, firebaseAuth, firebaseFirestore, firebaseDatabase };
