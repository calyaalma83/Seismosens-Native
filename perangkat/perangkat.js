document.addEventListener("DOMContentLoaded", () => {
    const devices = document.querySelectorAll(".device-card");

    devices.forEach(device => {
        device.addEventListener("click", () => {
            alert("Detail perangkat: " + device.querySelector("h2".textContent))
        });
    });
});