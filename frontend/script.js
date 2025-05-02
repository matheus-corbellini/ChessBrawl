document.addEventListener('DOMContentLoaded', () => {
    let jogadores = [];
    let rodadas = [];
    let partidaAtual = null;
    let torneioIniciado = false;
    let faseAtual = 1;
    let eventosPorRodada = {};

    const UI = {
        nome: document.getElementById('nome'),
        nickname: document.getElementById('nickname'),
        ranking: document.getElementById('ranking'),
        rankingList: document.getElementById('ranking-list'),
        rodadasDiv: document.getElementById('rodadas'),
        partidaSelecionada: document.getElementById('partida-selecionada'),
        placar: document.getElementById('placar'),
        tabelaResultados: document.getElementById('tabela-resultados'),
        partidaActions: document.getElementById('partida-actions'),
        finalizarRodadaBtn: document.getElementById('finalizar-rodada'),
        adminSection: document.getElementById('admin-section'),
        resultadosSection: document.getElementById('resultados-section')
    };

    function initUI() {
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const section = document.getElementById(targetId);
                const arrowIcon = this.querySelector('.arrow i');
                
                section.classList.toggle('active');
                arrowIcon.classList.toggle('fa-chevron-down');
                arrowIcon.classList.toggle('fa-chevron-up');
            });
        });
    
        document.getElementById('cadastro-section').classList.add('active');
        document.getElementById('ranking-section').classList.add('active');
        document.getElementById('admin-section').classList.add('active');
        document.getElementById('resultados-section').classList.add('active');
        
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            const targetId = btn.dataset.target;
            const section = document.getElementById(targetId);
            const arrowIcon = btn.querySelector('.arrow i');
            
            if(section.classList.contains('active')) {
                arrowIcon.classList.remove('fa-chevron-down');
                arrowIcon.classList.add('fa-chevron-up');
            }
        });
    }

    function mostrarMensagem(texto, tipo = 'info') {
        const container = document.getElementById('mensagens');
        const mensagem = document.createElement('div');
        mensagem.className = `message ${tipo}`;
        mensagem.innerHTML = `
            <span>${texto}</span>
            <span class="close">&times;</span>
        `;
        container.appendChild(mensagem);
        
        const timer = setTimeout(() => mensagem.remove(), 5000);
        mensagem.querySelector('.close').addEventListener('click', () => {
            clearTimeout(timer);
            mensagem.remove();
        });
    }

    document.getElementById('form-jogador').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = UI.nome.value.trim();
        const nickname = UI.nickname.value.trim();
        const ranking = parseInt(UI.ranking.value);

        if (!nome || !nickname || isNaN(ranking)) {
            mostrarMensagem("Preencha todos os campos corretamente!", "error");
            return;
        }

        if (ranking < 1 || ranking > 15000) {
            mostrarMensagem("Ranking deve ser entre 1 e 15000!", "error");
            return;
        }

        if (jogadores.some(j => j.nickname.toLowerCase() === nickname.toLowerCase())) {
            mostrarMensagem("Nickname já existe!", "error");
            return;
        }

        const jogador = { 
            nome, 
            nickname, 
            ranking, 
            pontos: 70,
            eventos: {
                jogadaOriginal: 0,
                gafe: 0,
                posicionamentoVantajoso: 0,
                desrespeito: 0,
                ataqueFuria: 0
            },
            vitorias: 0,
            historicoPontos: [70]
        };

        jogadores.push(jogador);
        mostrarMensagem(`${nome} cadastrado com sucesso!`, "success");
        
        e.target.reset();
        atualizarTabelaRanking();
    });

    function atualizarTabelaRanking() {
        const tbody = UI.rankingList;
        tbody.innerHTML = '';

        jogadores.sort((a, b) => b.pontos - a.pontos)
            .forEach((jogador, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${jogador.nome}</td>
                    <td>${jogador.nickname}</td>
                    <td>${jogador.pontos}</td>
                    <td>${jogador.vitorias}</td>
                `;
                tbody.appendChild(row);
            });
    }

    document.getElementById('carregar-ranking').addEventListener('click', atualizarTabelaRanking);

    document.getElementById('sortear-partidas').addEventListener('click', () => {
        if (jogadores.length < 4 || jogadores.length % 2 !== 0) {
            mostrarMensagem("Número de jogadores deve ser par (4, 6 ou 8)!", "error");
            return;
        }

        const jogadoresAtivos = faseAtual === 1 
            ? [...jogadores] 
            : jogadores.filter(j => j.vitorias >= faseAtual - 1);

        if (jogadoresAtivos.length < 2) {
            mostrarMensagem("Não há jogadores suficientes para avançar!", "error");
            return;
        }

        rodadas = [];
        const shuffled = [...jogadoresAtivos].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < shuffled.length; i += 2) {
            rodadas.push({
                id: Date.now() + i,
                jogadores: [shuffled[i], shuffled[i + 1]],
                concluida: false,
                eventos: [],
                pontosIniciais: [shuffled[i].pontos, shuffled[i + 1].pontos]
            });
        }

        eventosPorRodada = {};
        jogadores.forEach(j => {
            eventosPorRodada[j.nickname] = {
                jogadaOriginal: 0,
                gafe: 0,
                posicionamentoVantajoso: 0,
                desrespeito: 0,
                ataqueFuria: 0
            };
        });

        atualizarUIRodadas();
        torneioIniciado = true;
        UI.adminSection.classList.add('active');
        mostrarMensagem(`Fase ${faseAtual} iniciada com ${rodadas.length} partidas!`, "success");
    });


    function atualizarUIRodadas() {
        UI.rodadasDiv.innerHTML = rodadas.map(partida => `
            <div class="match-card ${partida.concluida ? 'concluded' : ''}" data-id="${partida.id}">
                <h3>${partida.jogadores[0].nome} vs ${partida.jogadores[1].nome}</h3>
                <p>Pontos: ${partida.jogadores[0].pontos} - ${partida.jogadores[1].pontos}</p>
                ${partida.concluida ? `<p class="winner"><i class="fas fa-trophy"></i> Vencedor: ${partida.vencedor}</p>` : ''}
            </div>
        `).join('');

        document.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', function() {
                const partidaId = this.dataset.id;
                partidaAtual = rodadas.find(p => p.id == partidaId);

                if (partidaAtual.concluida) {
                    mostrarMensagem("Esta partida já foi concluída!", "error");
                    return;
                }

                UI.partidaSelecionada.innerHTML = `
                    <h3><i class="fas fa-chess-knight"></i> ${partidaAtual.jogadores[0].nome} vs ${partidaAtual.jogadores[1].nome}</h3>
                    <p>Pontos iniciais: ${partidaAtual.pontosIniciais[0]} - ${partidaAtual.pontosIniciais[1]}</p>
                `;

                atualizarPlacar();
                UI.partidaActions.style.display = 'block';
                UI.finalizarRodadaBtn.style.display = 'block';
                UI.adminSection.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    window.aplicarEvento = function(evento) {
        if (!partidaAtual || partidaAtual.concluida) {
            mostrarMensagem("Selecione uma partida válida primeiro!", "error");
            return;
        }
    
        const jogadorIndex = parseInt(document.getElementById('jogador-alvo').value);
        const jogador = partidaAtual.jogadores[jogadorIndex];
        const nickname = jogador.nickname;
    
        if (eventosPorRodada[nickname] && eventosPorRodada[nickname][evento] >= 1) {
            mostrarMensagem(`Cada jogador só pode usar "${evento}" uma vez por rodada!`, "error");
            return;
        }
    
        const eventosConfig = {
            jogadaOriginal: 5,
            gafe: -3,
            posicionamentoVantajoso: 2,
            desrespeito: -5,
            ataqueFuria: -7
        };
    
        if (!eventosPorRodada[nickname]) {
            eventosPorRodada[nickname] = {};
        }
        eventosPorRodada[nickname][evento] = 1;
    
        jogador.pontos += eventosConfig[evento];
        jogador.eventos[evento] += 1;
        
        partidaAtual.eventos.push({
            jogador: jogador.nome,
            evento,
            pontos: eventosConfig[evento],
            timestamp: new Date().toLocaleTimeString()
        });
    
        mostrarMensagem(
            `${jogador.nome}: ${evento} (${eventosConfig[evento] > 0 ? '+' : ''}${eventosConfig[evento]} pts)`,
            "info"
        );
    
        atualizarPlacar();
    };

    function atualizarPlacar() {
        if (!partidaAtual) return;
        
        const [j1, j2] = partidaAtual.jogadores;
        UI.placar.innerHTML = `
            <div class="score-header">
                <h3><i class="fas fa-chess-board"></i> Placar Atual</h3>
                <p>Fase ${faseAtual}</p>
            </div>
            <div class="player-score ${j1.pontos > j2.pontos ? 'leading' : ''}">
                <span>${j1.nome}</span>
                <span>${j1.pontos} pts</span>
            </div>
            <div class="player-score ${j2.pontos > j1.pontos ? 'leading' : ''}">
                <span>${j2.nome}</span>
                <span>${j2.pontos} pts</span>
            </div>
            <div class="event-log">
                <h4><i class="fas fa-history"></i> Histórico da Partida</h4>
                ${partidaAtual.eventos.map(e => `
                    <p>${e.timestamp} - ${e.jogador}: ${e.evento} (${e.pontos > 0 ? '+' : ''}${e.pontos})</p>
                `).join('') || '<p>Nenhum evento registrado ainda</p>'}
            </div>
        `;
    }

    UI.finalizarRodadaBtn.addEventListener('click', () => {
        if (!partidaAtual || partidaAtual.concluida) {
            mostrarMensagem("Nenhuma partida ativa para finalizar!", "error");
            return;
        }

        verificarVencedor();
    });


    function verificarVencedor() {
        const [jogadorA, jogadorB] = partidaAtual.jogadores;
        let vencedor = null;
        let perdedor = null;

        if (jogadorA.pontos > jogadorB.pontos) {
            vencedor = jogadorA;
            perdedor = jogadorB;
        } else if (jogadorB.pontos > jogadorA.pontos) {
            vencedor = jogadorB;
            perdedor = jogadorA;
        } else {
            vencedor = Math.random() > 0.5 ? jogadorA : jogadorB;
            perdedor = vencedor === jogadorA ? jogadorB : jogadorA;
            vencedor.pontos += 2;
            mostrarMensagem(`EMPATE! ${vencedor.nome} ganhou +2 pts na Blitz Match!`, "info");
        }

        
        vencedor.pontos += 30;
        vencedor.vitorias += 1;
        vencedor.historicoPontos.push(vencedor.pontos);
        perdedor.historicoPontos.push(perdedor.pontos);
        
        
        partidaAtual.concluida = true;
        partidaAtual.vencedor = vencedor.nome;
        partidaAtual.pontosFinais = [jogadorA.pontos, jogadorB.pontos];

        mostrarMensagem(`🏆 ${vencedor.nome} venceu! (+30 pts)`, "success");
        
        
        atualizarUIRodadas();
        atualizarTabelaRanking();
        UI.partidaActions.style.display = 'none';
        UI.finalizarRodadaBtn.style.display = 'none';

        
        verificarFase();
    }

    function verificarFase() {
        if (rodadas.every(p => p.concluida)) {
            const jogadoresClassificados = jogadores.filter(j => j.vitorias >= faseAtual);
            
            if (jogadoresClassificados.length >= 2) {
                faseAtual++;
                mostrarMensagem(`Fase ${faseAtual} desbloqueada! Clique em "Sortear Partidas".`, "info");
                UI.resultadosSection.classList.add('active');
            } else {
                finalizarTorneio();
            }
        }
    }

    function finalizarTorneio() {
        const campeao = [...jogadores].sort((a, b) => b.pontos - a.pontos)[0];
        
        UI.tabelaResultados.innerHTML = `
            <div class="champion-card">
                <div class="champion-badge">
                    <i class="fas fa-crown"></i>
                </div>
                <h2>${campeao.nome.toUpperCase()}</h2>
                <p class="champion-title">CAMPEÃO DO TORNEIO</p>
                <div class="champion-stats">
                    <p><span>Pontuação Total:</span> ${campeao.pontos}</p>
                    <p><span>Vitórias:</span> ${campeao.vitorias}</p>
                    <p><span>Ranking:</span> ${campeao.ranking}</p>
                </div>
            </div>
            
            <div class="final-ranking">
                <h3><i class="fas fa-medal"></i> Classificação Final</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Posição</th>
                            <th>Jogador</th>
                            <th>Pontos</th>
                            <th>Vitórias</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${jogadores.sort((a, b) => b.pontos - a.pontos)
                            .map((j, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${j.nome} (${j.nickname})</td>
                                    <td>${j.pontos}</td>
                                    <td>${j.vitorias}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="stats-container">
                <h3><i class="fas fa-chart-bar"></i> Estatísticas</h3>
                <div class="stats-grid">
                    ${jogadores.map(j => `
                        <div class="player-stats">
                            <h4>${j.nome}</h4>
                            <ul>
                                <li>Jogadas Originais: ${j.eventos.jogadaOriginal}</li>
                                <li>Gafes: ${j.eventos.gafe}</li>
                                <li>Posicionamentos: ${j.eventos.posicionamentoVantajoso}</li>
                                <li>Desrespeitos: ${j.eventos.desrespeito}</li>
                                <li>Ataques de Fúria: ${j.eventos.ataqueFuria}</li>
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        mostrarMensagem(`Torneio concluído! ${campeao.nome} é o campeão!`, "success");
    }


    function reiniciarTorneio() {
        jogadores = []; 
        rodadas = [];
        partidaAtual = null;
        torneioIniciado = false;
        faseAtual = 1;
        eventosPorRodada = {};

        const uiElements = [
            'ranking-list', 'rodadas', 'placar', 
            'tabela-resultados', 'partida-selecionada'
        ];
    
        uiElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = id === 'partida-selecionada' 
                    ? '<p>Selecione uma partida para administrar</p>' 
                    : '';
            }
        });

    document.getElementById('partida-actions').style.display = 'none';
    document.getElementById('finalizar-rodada').style.display = 'none';
    
    document.getElementById('form-jogador').reset();
    
    mostrarMensagem("Sistema reiniciado. Cadastre novos jogadores para iniciar.", "success");
    
    setTimeout(() => {
        const nomeInput = document.getElementById('nome');
        if (nomeInput) nomeInput.focus();
    }, 300);
}

    window.aplicarEvento = function(evento) {
        if (!partidaAtual || partidaAtual.concluida) {
            mostrarMensagem("Selecione uma partida válida primeiro!", "error");
            return;
        }

        const jogadorIndex = parseInt(document.getElementById('jogador-alvo').value);
        const jogador = partidaAtual.jogadores[jogadorIndex];
        const nickname = jogador.nickname;

        if (eventosPorRodada[nickname]?.[evento] >= 1) {
            mostrarMensagem(`Cada jogador pode usar "${getEventoNome(evento)}" apenas 1 vez por rodada!`, "error");
            return;
        }

    const pontosEvento = {
        jogadaOriginal: 5,
        gafe: -3,
        posicionamentoVantajoso: 2,
        desrespeito: -5,
        ataqueFuria: -7
    };

    if (!eventosPorRodada[nickname]) eventosPorRodada[nickname] = {};
    eventosPorRodada[nickname][evento] = 1;
    jogador.pontos += pontosEvento[evento];
    jogador.eventos[evento] += 1;

    partidaAtual.eventos.push({
        jogador: jogador.nome,
        evento,
        pontos: pontosEvento[evento],
        timestamp: new Date().toLocaleTimeString()
    });

    mostrarMensagem(
        `${jogador.nome}: ${getEventoNome(evento)} (${pontosEvento[evento] > 0 ? '+' : ''}${pontosEvento[evento]} pts)`,
        pontosEvento[evento] > 0 ? "success" : "error"
    );

    atualizarPlacar();
};


    function getEventoNome(tipo) {
        const nomes = {
            jogadaOriginal: "Jogada Original",
            gafe: "Gafe",
            posicionamentoVantajoso: "Posicionamento Vantajoso",
            desrespeito: "Desrespeito",
            ataqueFuria: "Ataque de Fúria"
        };
        return nomes[tipo] || tipo;
    }

    document.getElementById('novo-torneio').addEventListener('click', reiniciarTorneio);

        
    document.getElementById('simular-partida').addEventListener('click', () => {
         if (!partidaAtual || partidaAtual.concluida) {
            mostrarMensagem("Selecione uma partida válida primeiro!", "error");
            return;
        }

        const eventos = ['jogadaOriginal', 'gafe', 'posicionamentoVantajoso', 'desrespeito', 'ataqueFuria'];
        const jogadorAlvo = Math.floor(Math.random() * 2);
        const eventoAleatorio = eventos[Math.floor(Math.random() * eventos.length)];
        
        document.getElementById('jogador-alvo').value = jogadorAlvo;
        aplicarEvento(eventoAleatorio);
    });

    
    initUI();
});