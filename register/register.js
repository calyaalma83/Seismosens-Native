document.getElementById("registerForm")?.addEventListener("submit", function(e) {
    e.preventDefault();

    const fullname = document.getElementById("fullname")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const confirmPassword = document.getElementById("confirmPassword")?.value;
    const agree = document.getElementById("agree")?.checked;

    if (!fullname || !email || !password || !confirmPassword){
        alert("Semua field wajib diisi!");
        return;
    }

    if (password !== confirmPassword){
        alert("Password dan konfirmasi password tidak cocok!");
        return;
    }

    if (!agree){
        alert("Anda harus menyetujui Syarat & Ketentuan");
        return;
    }

    localStorage.setItem("hasAccount", "true");
    localStorage.setItem("userEmail", email);

    alert("Registrasi berhasil! Silahkan login.");
    window.location.href = "login.html";
});