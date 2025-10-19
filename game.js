document.addEventListener('DOMContentLoaded', function () {

    // --- 1. CONFIGURAÇÃO DO MAPA ---
    const map = L.map('map').setView([-23.622, -46.560], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

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

    // 🔹 Gabarito: 7 pontos corretos (substitua conforme quiser)
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

    // Segurança: se algum elemento obrigatório não existir, avisar
    if (!startScreen || !startButton || !startNameInput) {
        console.error("Elementos da tela inicial não encontrados. Verifique os IDs: 'start-screen', 'startButton', 'startName'.");
        return;
    }

    // Desativa o submitButton inicialmente
    submitButton.disabled = true;

    // --- 4. INICIAR O JOGO (overlay -> ocultar + liberar mapa) ---
    startButton.addEventListener('click', () => {
        const name = startNameInput.value.trim();
        if (!name) {
            alert('Digite seu nome para começar!');
            return;
        }
        playerName = name;

        // Força esconder o overlay (duas formas para compatibilidade)
        startScreen.classList.add('hidden');
        startScreen.style.display = 'none';

        // libera a interação com o mapa (remove classe que bloqueia)
        if (mapDiv) {
            mapDiv.classList.remove('map-disabled');
        }

        // mostra UI do jogo
        gameInfoDiv.classList.remove('hidden');
        submitButton.classList.remove('hidden');

        // evita múltiplos cliques no Start
        startButton.disabled = true;

        gameState = 'playing';
        console.log('Jogo iniciado por:', playerName);
    });

    // --- 5. CRIA OS MARCADORES (30 opções) ---
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
                // remove seleção
                if (marker.selectedCircle) {
                    map.removeLayer(marker.selectedCircle);
                    marker.selectedCircle = null;
                }
                userSelections = userSelections.filter(m => m !== marker);
            } else if (userSelections.length < MAX_SELECTIONS) {
                // adiciona seleção (e sinal visual)
                const highlight = L.circleMarker(point, {
                    radius: 10,
                    color: '#007bff',
                    fillColor: '#007bff',
                    fillOpacity: 0.9
                }).addTo(map);
                marker.selectedCircle = highlight;
                userSelections.push(marker);
            } else {
                // limite alcançado -> mensagem opcional
                // alert(`Você já selecionou ${MAX_SELECTIONS} pontos.`);
            }

            updateUI();
        });
    });

    function updateUI() {
        pointsSelectedSpan.innerText = userSelections.length;
        submitButton.disabled = (userSelections.length < MAX_SELECTIONS) || (gameState !== 'playing');
    }

    // --- 6. SUBMETER E CALCULAR PONTUAÇÃO ---
    submitButton.addEventListener('click', () => {
        if (userSelections.length !== MAX_SELECTIONS || gameState !== 'playing') return;

        gameState = 'finished';
        let totalScore = 0;

        userSelections.forEach(marker => {
            let closest = Infinity;
            const pos = marker.getLatLng();
            correctPoints.forEach(c => {
                const d = map.distance(pos, c);
                if (d < closest) closest = d;
            });
            const pointScore = Math.max(0, 14.3 * (1 - (closest / 1000))); // escala para ~100 total
            totalScore += pointScore;
        });

        const finalScore = Math.round(totalScore);
        showResults(finalScore);
    });

    function showResults(score) {
        scoreSpan.innerText = score;
        feedbackText.innerText =
            score > 90 ? "Excelente!" :
            score > 70 ? "Muito bom!" :
            score > 40 ? "Bom trabalho!" :
            "Continue tentando!";

        // mostra gabarito visualmente
        correctPoints.forEach(p => {
            L.circleMarker(p, {
                radius: 9,
                color: '#00cc66',
                fillColor: '#00cc66',
                fillOpacity: 0.9
            }).addTo(map).bindPopup("Ponto ideal");
        });

        // salva no ranking local
        const ranking = JSON.parse(localStorage.getItem("ranking") || "[]");
        ranking.push({ name: playerName, score });
        ranking.sort((a,b) => b.score - a.score);
        localStorage.setItem("ranking", JSON.stringify(ranking));

        // atualiza UI
        gameInfoDiv.classList.add('hidden');
        submitButton.classList.add('hidden');
        resultDiv.classList.remove('hidden');
    }

    playAgainButton.addEventListener('click', () => location.reload());

});
