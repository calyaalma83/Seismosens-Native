function initMap() {
    const surakarta = { lat: -7.5666, lng: 110.8166};

    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: surakarta,
    });

    new google.map.Maker({
        position: surakarta,
        map,
        title: "Surakarta",
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const filterBtns = document.querySelectorAll(".filter-btn");

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    const locationCards = document.querySelectorAll(".location-card");
    locationCards.forEach(card => {
        card.addEventListener("click", () => {
            alert("Membuka detail lokasi: " + card.querySelector("strong").textContent);
        });
    });
});