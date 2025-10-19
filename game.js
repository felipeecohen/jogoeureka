document.addEventListener('DOMContentLoaded', function () {

    // --- 1. CONFIGURAÇÃO DO MAPA ---
    const map = L.map('map').setView([-23.622, -46.560], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // --- 1.1. CARREGAR CONTOUR DA CIDADE ---
    fetch('Sao Caetano Do Sul.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    color: '#ff6600',    // cor da borda do contorno
                    weight: 3,           // espessura da linha
                    fill: false          // sem preenchimento
                }
            }).addTo(map);
        })
        .catch(err => console.error('Erro ao carregar geojson:', err));

    // --- 2. DADOS (30 opções e 7 corretos / gabarito) ---
    const selectablePoints = [
        [-23.614, -46.569], [-23.620, -46.574], [-23.618, -46.555], [-23.625, -46.563],
        [-23.630, -46.558], [-23.622, -46.551], [-23.611, -46.561], [-23.628, -46.572],
        [-23.619, -46.565], [-23.623, -46.549], [-23.632, -46.567], [-23.615, -46.552],
        [-23.627, -46.559], [-23.610, -46.570], [-23.621, -46.578], [-23.635, -46.553],
        [-23.609, -46.556], [-23.626, -46.568], [-23.613, -46.563], [-23.629, -46.550],
        [-23.617, -46.576], [-23.624, -46.557], [-23.631, -46.562], [-23.612, -46.548],
        [-23.625, -46.575], [-23.616, -46.559], [-23.633, -46.571], [-23.608, -46.564],
        [-23.622, -46.569], [-23.619, -46.553]
    ];

    const correctPoints = [
        [-23.614, -46.569], [-23.620, -46.574], [-23.630, -46.558],
        [-23.611, -46.561], [-23.628, -46.572], [-23.619, -46.565], [-23.623, -46.549]
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

    if (!startScreen || !startButton || !startNameInput) {
        console.error("Elementos da tela inicial não encontrados. Verifique os IDs.");
        return;
    }

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

        if (mapDiv) mapDiv.classList.remove('map-disabled');

        gameInfoDiv.classList.remove('hidden');
        submitButton.classList.remove('hidden');

        startButton.disabled = true;
        gameState = 'playing';

        // Corrige tamanho do mapa após overlay sumir
        setTimeout(() => map.invalidateSize(), 120);
        console.log('Jogo iniciado por:', playerName);
    });

    // --- 5. CRIA OS MARCADORES ---
    selectablePoints.forEach((point, index) => {
        const marker = L.circleMarker(point, {
            radius: 7,
            color: 'green',
            fillColor: '#4CAF50',
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
                    color: '#007bff',
                    fillColor: '#007bff',
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

        // mostra gabarito
        correctPoints.forEach(p => {
            L.circleMarker(p, {
                radius: 9,
                color: '#00cc66',
                fillColor: '#00cc66',
                fillOpacity: 0.9
            }).addTo(map).bindPopup("Ponto ideal");
        });

        // contar acertos
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
