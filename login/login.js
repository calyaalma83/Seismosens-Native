function loginUser(event) {
  event.preventDefault();

  const inputs = document.querySelectorAll(".form-group input");
  const email = inputs[0].value;
  const password = inputs[1].value;

  if (!email || !password) {
    alert("Email dan Password harus diisi!");
    return false;
  }

  // Simulasi login sukses
  alert(`Selamat datang kembali, ${email}!`);
  window.location.href = "index.html"; // arahkan ke halaman utama
  return true;
}
