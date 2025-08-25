function forgotPassword(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;

  if (!email) {
    alert("Harap masukkan email Anda.");
    return false;
  }

  // Simulasi kirim email reset
  alert(`Link reset password telah dikirim ke ${email}`);

  // Tambahin animasi keluar sebelum redirect
  const container = document.querySelector(".forgot-container");
  container.style.animation = "slideFadeOut 0.5s ease forwards";

  setTimeout(() => {
    window.location.href = "../login/login.html";
  }, 500); // tunggu animasi selesai
  return true;
}
