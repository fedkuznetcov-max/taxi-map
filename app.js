const TG = window.Telegram.WebApp;
TG.expand();

console.log('Карта загружена, версия 2.0');

let map, marker;
let selectedCoords = null;

const LEBEDYAN = [52.965, 39.157];

function initMap() {
    console.log('Инициализация карты...');
    
    map = L.map('map').setView(LEBEDYAN, 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userCoords = [position.coords.latitude, position.coords.longitude];
                console.log('Геолокация получена:', userCoords);
                map.setView(userCoords, 15);
                L.circleMarker(userCoords, {
                    color: '#007aff',
                    radius: 8,
                    fillOpacity: 0.8
                }).addTo(map).bindTooltip('Вы здесь', {permanent: false});
            },
            error => {
                console.log('Геолокация не доступна, используем центр города');
            }
        );
    }

    map.on('click', onMapClick);
}

async function onMapClick(e) {
    const coords = [e.latlng.lat, e.latlng.lng];
    console.log('Клик по карте:', coords);
    
    if (marker) {
        map.removeLayer(marker);
    }
    
    marker = L.marker(coords, {
        draggable: true,
        autoPan: true
    }).addTo(map);
    
    marker.on('dragend', function(e) {
        const newCoords = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        console.log('Метка перемещена:', newCoords);
        updateAddress(newCoords);
    });
    
    await updateAddress(coords);
}

async function updateAddress(coords) {
    selectedCoords = coords;
    console.log('Обновление адреса для координат:', coords);
    
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
        console.log('Ответ от Nominatim:', data);
        
        let address = 'Адрес не найден';
        if (data.display_name) {
            address = data.display_name;
        }
        
        document.getElementById('selectedAddress').innerHTML = `📍 ${address}`;
        
        // Активируем кнопку
        const confirmBtn = document.getElementById('confirmBtn');
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
        
    } catch (error) {
        console.error('Ошибка геокодирования:', error);
        document.getElementById('selectedAddress').innerHTML = `📍 ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
        
        const confirmBtn = document.getElementById('confirmBtn');
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
    }
}

// Обработчик кнопки подтверждения
document.getElementById('confirmBtn').addEventListener('click', function() {
    console.log('Кнопка подтверждения нажата');
    
    if (!selectedCoords) {
        console.log('Нет выбранных координат');
        return;
    }
    
    console.log('Отправка координат:', selectedCoords);
    
    // Формируем данные
    const data = JSON.stringify({
        lat: selectedCoords[0],
        lng: selectedCoords[1]
    });
    
    console.log('Отправляемые данные:', data);
    
    // Отправляем в бота
    TG.sendData(data);
    
    console.log('Данные отправлены');
});

// Обработчик кнопки отмены
document.getElementById('cancelBtn').addEventListener('click', function() {
    console.log('Отмена');
    TG.close();
});

// Добавляем обработчик на случай, если пользователь нажмёт кнопку назад
TG.BackButton.onClick(function() {
    console.log('Нажата кнопка назад');
    TG.close();
});

window.onload = initMap;