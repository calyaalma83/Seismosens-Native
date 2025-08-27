console.log('Login script loaded');
import { 
  auth, 
  redirectIfAuthenticated,
  signInWithEmailAndPassword 
} from '../auth.js';

// Redirect to home if already logged in
redirectIfAuthenticated();

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log('Attempting to sign in with:', email);
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('Login successful, user:', userCredential.user.uid);
      // Use absolute path for more reliable redirect
      window.location.href = "/seismosens.html";
    })
    .catch((error) => {
      let errorMessage = "Login gagal: ";
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage += "Email tidak terdaftar";
          break;
        case 'auth/wrong-password':
          errorMessage += "Password salah";
          break;
        case 'auth/too-many-requests':
          errorMessage += "Terlalu banyak percobaan login. Silakan coba lagi nanti";
          break;
        default:
          errorMessage += error.message;
      }
      alert(errorMessage);
    });
});