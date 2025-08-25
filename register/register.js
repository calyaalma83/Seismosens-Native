function registerUser(event) {
  event.preventDefault();

  // Ambil input form
  const inputs = document.querySelectorAll(".form-group input");
  const nama = inputs[0].value;
  const email = inputs[1].value;
  const password = inputs[2].value;
  const confirmPassword = inputs[3].value;

  // Validasi password
  if (password !== confirmPassword) {
    alert("Password dan konfirmasi password tidak sama!");
    return false;
  }

  // Simulasi sukses register
  alert(`Selamat datang, ${nama}! Registrasi berhasil.`);
  window.location.href = "../seismosens.html"; // setelah daftar masuk dashboard
  return true;
}

// Event listener untuk link "Masuk"
document.addEventListener("DOMContentLoaded", function() {
  const loginLink = document.getElementById("loginLink");
  if (loginLink) {
    loginLink.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "../login/login.html";
    });
  }
});