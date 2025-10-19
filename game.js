document.addEventListener('DOMContentLoaded', function () {

    // --- 1. CONFIGURAÇÃO DO MAPA ---
    const map = L.map('map').setView([-23.622, -46.560], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // --- 1.1. CARREGAR CONTOUR DA CIDADE ---
    fetch('SCS.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    color: '#0d2dfc',
                    weight: 3,
                    fill: false
                }
            }).addTo(map);
        })
        .catch(err => {
            console.error('Erro ao carregar GeoJSON:', err);
            alert("Não foi possível carregar o contorno da cidade.");
        });

    // --- 2. DADOS (30 opções e 7 corretos) ---
    const selectablePoints = [
    [-23.62909, -46.56753],
    [-23.62554, -46.57502],
    [-23.64662, -46.57615],
    [-23.64019, -46.57460],
    [-23.61782, -46.56961],
    [-23.61835, -46.57463],
    [-23.60667, -46.56602],
    [-23.63209, -46.56488],
    [-23.62274, -46.55676],
    [-23.61319, -46.57705],
    [-23.61590, -46.56925],
    [-23.63309, -46.58313],
    [-23.62187, -46.58150],
    [-23.62503, -46.55721],
    [-23.63547, -46.55407],
    [-23.61743, -46.55275],
    [-23.63500, -46.55839],
    [-23.62896, -46.57504],
    [-23.64273, -46.56068],
    [-23.62710, -46.56801],
    [-23.61073, -46.55121],
    [-23.60359, -46.57058],
    [-23.62600, -46.55724],
    [-23.61255, -46.56821],
    [-23.61148, -46.57334],
    [-23.60232, -46.57687],
    [-23.64809, -46.55629],
    [-23.63880, -46.56394],
    [-23.62168, -46.54903],
    [-23.64842, -46.57071],
    [-23.63652, -46.55885]
];

    const correctPoints = [
    [-23.62909, -46.56753],
    [-23.64019, -46.57460],
    [-23.63209, -46.56488],
    [-23.62274, -46.55676],
    [-23.61590, -46.56925],
    [-23.63547, -46.55407],
    [-23.64273, -46.56068]
];

    const MAX_SELECTIONS = 7;
    let userSelections = [];
    let playerName = '';
    let gameState = 'waiting';

    // --- 3. ELEMENTOS DO DOM ---
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('startButton');
    const startNameInput = document.getElementById('startName');

    const pointsSelectedSpan = document.getElementById('points-selected');
    const submitButton = document.getElementById('submit-button');
    const resultDiv = document.getElementById('result');
    const scoreSpan = document.getElementById('score');
    const feedbackText = document.getElementById('feedback-text');
    const playAgainButton = document.getElementById('play-again-button');
    const gameInfoDiv = document.querySelector('.game-info');
    const mapDiv = document.getElementById('map');

    submitButton.disabled = true;

    // --- 4. INICIAR O JOGO ---
    startButton.addEventListener('click', () => {
        const name = startNameInput.value.trim();
        if (!name) {
            alert('Digite seu nome para começar!');
            return;
        }
        playerName = name;

        startScreen.classList.add('hidden');
        startScreen.style.display = 'none';

        gameInfoDiv.classList.remove('hidden');
        submitButton.classList.remove('hidden');

        if (mapDiv) mapDiv.classList.remove('map-disabled');

        startButton.disabled = true;
        gameState = 'playing';

        // Corrige renderização do mapa
        setTimeout(() => {
            map.invalidateSize();
            map.fitBounds(L.featureGroup(selectablePoints.map(p => L.latLng(p))).getBounds());
        }, 150);
    });

    // --- 5. CRIA OS MARCADORES ---
   selectablePoints.forEach((point, index) => {
    const marker = L.circleMarker(point, {
        radius: 7,
        color: '#818281',    // cinza
        fillColor: '#818281', 
        fillOpacity: 0.8
    }).addTo(map).bindTooltip(`Ponto ${index + 1}`);

    marker.on('click', function () {
        if (gameState !== 'playing') return;

        if (userSelections.includes(marker)) {
            if (marker.selectedCircle) {
                map.removeLayer(marker.selectedCircle);
                marker.selectedCircle = null;
            }
            userSelections = userSelections.filter(m => m !== marker);
        } else if (userSelections.length < MAX_SELECTIONS) {
            const highlight = L.circleMarker(point, {
                radius: 10,
                color: '#FFB300',   // amarelo mais escuro
                fillColor: '#FFB300',
                fillOpacity: 0.9
            }).addTo(map);
            marker.selectedCircle = highlight;
            userSelections.push(marker);
        }

        updateUI();
    });
});

    function updateUI() {
        pointsSelectedSpan.innerText = userSelections.length;
        submitButton.disabled = (userSelections.length < MAX_SELECTIONS) || (gameState !== 'playing');
    }

    // --- 6. SUBMETER E CALCULAR ACERTOS ---
    submitButton.addEventListener('click', () => {
        if (userSelections.length !== MAX_SELECTIONS || gameState !== 'playing') return;

        gameState = 'finished';

        const toleranciaMetros = 150;
        const correctMatched = new Array(correctPoints.length).fill(false);
        let acertos = 0;

        userSelections.forEach(marker => {
            const pos = marker.getLatLng();
            let closestIdx = -1;
            let closestDist = Infinity;

            correctPoints.forEach((c, idx) => {
                if (correctMatched[idx]) return;
                const d = map.distance(pos, c);
                if (d < closestDist) {
                    closestDist = d;
                    closestIdx = idx;
                }
            });

            if (closestIdx !== -1 && closestDist <= toleranciaMetros) {
                acertos += 1;
                correctMatched[closestIdx] = true;
            }
        });

       // mostra gabarito apenas com borda verde
correctPoints.forEach(p => {
    L.circleMarker(p, {
        radius: 10,
        color: 'green',       // borda verde
        weight: 4,            // borda mais espessa
        fillColor: 'transparent',
        fillOpacity: 0
    }).addTo(map).bindPopup("Ponto ideal");
});

        showResults(acertos);
    });

    function showResults(acertos) {
        scoreSpan.innerText = `${acertos}/${MAX_SELECTIONS}`;

        feedbackText.innerText =
            acertos === MAX_SELECTIONS ? "Perfeito! Você acertou todos os pontos!" :
            acertos >= 5 ? "Excelente! Suas escolhas foram muito boas!" :
            acertos >= 3 ? "Bom trabalho, mas dá pra melhorar." :
            "Continue tentando! Veja onde estão os pontos verdes.";

        if (playerName) {
            const ranking = JSON.parse(localStorage.getItem("ranking") || "[]");
            ranking.push({ name: playerName, hits: acertos, score: `${acertos}/${MAX_SELECTIONS}` });
            ranking.sort((a, b) => b.hits - a.hits);
            localStorage.setItem("ranking", JSON.stringify(ranking));
        }

        gameInfoDiv.classList.add('hidden');
        submitButton.classList.add('hidden');
        resultDiv.classList.remove('hidden');
    }

    playAgainButton.addEventListener('click', () => location.reload());

});

