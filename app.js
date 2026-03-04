const TG = window.Telegram.WebApp;
TG.expand();

let map, marker;
let selectedCoords = null;

const LEBEDYAN = [52.965, 39.157];

function initMap() {
    map = L.map('map').setView(LEBEDYAN, 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userCoords = [position.coords.latitude, position.coords.longitude];
                map.setView(userCoords, 15);
                L.circleMarker(userCoords, {
                    color: '#007aff',
                    radius: 8,
                    fillOpacity: 0.8
                }).addTo(map).bindTooltip('Вы здесь', {permanent: false});
            },
            error => {
                console.log('Геолокация не доступна');
            }
        );
    }

    map.on('click', onMapClick);
}

async function onMapClick(e) {
    const coords = [e.latlng.lat, e.latlng.lng];
    
    if (marker) {
        map.removeLayer(marker);
    }
    
    marker = L.marker(coords, {
        draggable: true,
        autoPan: true
    }).addTo(map);
    
    marker.on('dragend', function(e) {
        const newCoords = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        updateAddress(newCoords);
    });
    
    await updateAddress(coords);
}

async function updateAddress(coords) {
    selectedCoords = coords;
    
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'TaxiLebedyanBot/1.0 (fedkuznetcov@gmail.com)'
                }
            }
        );
        
        const data = await response.json();
        
        let address = 'Адрес не найден';
        if (data.display_name) {
            address = data.display_name;
        }
        
        document.getElementById('selectedAddress').innerHTML = `📍 ${address}`;
        document.getElementById('confirmBtn').disabled = false;
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('selectedAddress').innerHTML = `📍 ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
        document.getElementById('confirmBtn').disabled = false;
    }
}

document.getElementById('confirmBtn').addEventListener('click', () => {
    if (selectedCoords) {
        TG.sendData(JSON.stringify({
            lat: selectedCoords[0],
            lng: selectedCoords[1]
        }));
    }
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    TG.close();
});

window.onload = initMap;