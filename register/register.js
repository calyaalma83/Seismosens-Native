import { 
  auth, 
  redirectIfAuthenticated,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword 
} from '../auth.js';

// Debug info
console.log('Register script loaded');

// Redirect to home if already logged in
redirectIfAuthenticated().then(() => {
  console.log('Auth check completed');
  
  const form = document.getElementById('registerForm');
  if (!form) {
    console.error('Register form not found!');
    return;
  }
  
  console.log('Adding submit event listener to form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    console.log("Form submitted");

  const nama = document.getElementById("nama").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  
  console.log("Form values:", { nama, email, password: '***', confirmPassword: '***' });

  if (password !== confirmPassword) {
    alert("Password dan konfirmasi password tidak sama!");
    return;
  }

  console.log("Attempting to create user...");
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("User created successfully:", userCredential.user.uid);
      // Update user profile with display name
      return updateProfile(userCredential.user, {
        displayName: nama
      });
    })
    .then(() => {
      console.log("Attempting to sign in...");
      return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log("Signed in successfully:", userCredential.user.uid);
          return userCredential;
        });
    })
    .then(() => {
      console.log("Redirecting to home page...");
      // Use absolute path for more reliable redirect
      window.location.href = "/seismosens.html";
    })
    .catch((error) => {
      console.error("Registration error:", error);
      let errorMessage = "Registrasi gagal: ";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Email sudah terdaftar";
          break;
        case 'auth/weak-password':
          errorMessage = "Password terlalu lemah, minimal 6 karakter";
          break;
        case 'auth/invalid-email':
          errorMessage = "Format email tidak valid";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Koneksi internet bermasalah. Silakan coba lagi.";
          break;
        default:
          errorMessage = `Terjadi kesalahan: ${error.message}`;
      }
      alert(errorMessage);
    });
  });
});