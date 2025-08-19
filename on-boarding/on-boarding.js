const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", () => {
    const hasAccount = localStorage.getItem("hasAccount");

    if (hasAccount === "true") {
        // arahkan ke folder login
        window.location.href = "../login/login.html";
    } else {
        // arahkan ke folder register
        window.location.href = "../register/register.html";
    }
});
