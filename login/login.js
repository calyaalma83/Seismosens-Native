document.getElementById("loginForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const email = emailInput ? emailInput.value : "";
    const password = passwordInput ? passwordInput.value : "";

    if (email && password){
        alert("Login berhasil! (sementara)");
        window.location.href = "dashboard/dashboard.html";
    } else {
        alert("Email dan password wajib diisi!");
    }
});