// presence.js
import { 
  db, 
  rtdb, 
  doc, 
  setDoc, 
  serverTimestamp, 
  ref, 
  set, 
  onDisconnect 
} from "./firebase.js";

// ==============================
// SET PRESENCE USER
// ==============================
async function setPresence(user) {
  if (!user) return;
  
  try {
    const uid = user.uid;
    
    // Deteksi device info
    const device = `${navigator.platform} | ${navigator.userAgent}`;
    const timestamp = serverTimestamp();
  
    // Firestore → simpan history
    const sessionRef = doc(db, "userDevices", uid, "sessions", "current");
    await setDoc(sessionRef, {
      email: user.email,
      device,
      online: true,
      lastActive: timestamp
    }, { merge: true });
  
    // RTDB → untuk status realtime
    const rtdbRef = ref(rtdb, `presence/${uid}`);
    await set(rtdbRef, {
      online: true,
      lastActive: Date.now(),
      email: user.email,
      device,
      uid: user.uid
    });
  
    // otomatis offline kalau tab ditutup
    await onDisconnect(rtdbRef).set({
      online: false,
      lastActive: Date.now(),
      email: user.email,
      device,
      uid: user.uid
    });
  
    // Update lastActive tiap menit
    setInterval(() => {
      set(rtdbRef, {
        online: true,
        lastActive: Date.now(),
        email: user.email,
        device,
        uid: user.uid
      }).catch(console.error);
    }, 60 * 1000);
  } catch (error) {
    console.error('Error in setPresence:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

// ==============================
// INIT PRESENCE
// ==============================
async function initPresence(user) {
  if (!user) {
    console.warn('No user provided to initPresence');
    return Promise.resolve();
  }
  try {
    await setPresence(user);
    console.log('Presence initialized for user:', user.uid);
  } catch (error) {
    console.error('Error initializing presence:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

export { setPresence, initPresence };