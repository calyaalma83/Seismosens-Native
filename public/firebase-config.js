// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1v_3pYp3Z5Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1",
  authDomain: "seismosens.firebaseapp.com",
  projectId: "seismosens",
  storageBucket: "seismosens.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence().catch((err) => {
  console.error('Firebase persistence error:', err);
});

export { auth, db };
