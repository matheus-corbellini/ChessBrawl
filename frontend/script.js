document.addEventListener('DOMContentLoaded', () => {
    let jogadores = [];  // Armazena os jogadores
    let rodadas = [];    // Armazena as rodadas sorteadas
    let partidaAtual = null;  // Armazena a partida que está sendo administrada

    // Função para cadastrar jogador
    document.getElementById('form-jogador').addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const nickname = document.getElementById('nickname').value;
        const ranking = parseInt(document.getElementById('ranking').value);

        if (ranking < 1 || ranking > 15000) {
            alert("Ranking deve ser entre 1 e 15000!");
            return;
        }

        const jogador = { nome, nickname, ranking, pontos: 70, eventos: { jogadasOriginais: 0, gafes: 0, posicionamentosVantajosos: 0, desrespeito: 0, ataquesFuria: 0 }};
        jogadores.push(jogador);

        alert(`Jogador ${nome} cadastrado com sucesso!`);
        
        // Limpar os campos após o cadastro
        document.getElementById('nome').value = '';
        document.getElementById('nickname').value = '';
        document.getElementById('ranking').value = '';
    });

    // Função para carregar o ranking
    document.getElementById('carregar-ranking').addEventListener('click', () => {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '';  // Limpa a lista antes de exibir novamente

        const sortedJogadores = jogadores.sort((a, b) => b.pontos - a.pontos);  // Ordenando os jogadores pela pontuação

        sortedJogadores.forEach(jogador => {
            const li = document.createElement('li');
            li.textContent = `${jogador.nome} (${jogador.nickname}) - Pontuação: ${jogador.pontos}`;
            rankingList.appendChild(li);
        });
    });

    // Função para sortear as partidas
    document.getElementById('sortear-partidas').addEventListener('click', () => {
        if (jogadores.length < 4 || jogadores.length % 2 !== 0) {
            alert('O número de jogadores deve ser par e pelo menos 4 jogadores!');
            return;
        }

        // Embaralhar os jogadores
        const jogadoresEmbaralhados = [...jogadores];
        for (let i = jogadoresEmbaralhados.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [jogadoresEmbaralhados[i], jogadoresEmbaralhados[j]] = [jogadoresEmbaralhados[j], jogadoresEmbaralhados[i]];
        }

        // Criar rodadas
        rodadas = [];
        for (let i = 0; i < jogadoresEmbaralhados.length; i += 2) {
            rodadas.push([jogadoresEmbaralhados[i], jogadoresEmbaralhados[i + 1]]);
        }

        // Exibir as rodadas sorteadas
        const rodadasDiv = document.getElementById('rodadas');
        rodadasDiv.innerHTML = '';  // Limpa as rodadas anteriores
        rodadas.forEach((partida, index) => {
            const partidaDiv = document.createElement('div');
            partidaDiv.textContent = `Partida ${index + 1}: ${partida[0].nome} vs ${partida[1].nome}`;
            rodadasDiv.appendChild(partidaDiv);
        });

        alert('Partidas sorteadas com sucesso!');
    });

    // Função para administrar partidas
    document.getElementById('rodadas').addEventListener('click', (e) => {
        if (e.target && e.target.nodeName === 'DIV') {
            const partidaId = e.target.textContent.split(':')[0].split(' ')[1] - 1;
            partidaAtual = rodadas[partidaId];
            document.getElementById('partida-selecionada').textContent = `Partida selecionada: ${partidaAtual[0].nome} vs ${partidaAtual[1].nome}`;
        }
    });

    // Função para aplicar eventos
    function aplicarEvento(partida, evento) {
        partida[0].eventos[evento] += 1;
        partida[1].eventos[evento] += 1;

        if (evento === 'jogadaOriginal') {
            partida[0].pontos += 5;
            partida[1].pontos += 5;
        } else if (evento === 'gafe') {
            partida[0].pontos -= 3;
            partida[1].pontos -= 3;
        } else if (evento === 'posicionamentoVantajoso') {
            partida[0].pontos += 2;
            partida[1].pontos += 2;
        } else if (evento === 'desrespeito') {
            partida[0].pontos -= 5;
            partida[1].pontos -= 5;
        } else if (evento === 'ataqueFuria') {
            partida[0].pontos -= 7;
            partida[1].pontos -= 7;
        }

        // Calcular vencedor
        let vencedor = partida[0].pontos > partida[1].pontos ? partida[0] : partida[1];
        vencedor.pontos += 30; // Adiciona 30 pontos ao vencedor

        alert(`${vencedor.nome} é o vencedor!`);
    }

    // Função para gerar resultados finais
    document.getElementById('mostrar-resultados').addEventListener('click', () => {
        const tabelaResultados = document.getElementById('tabela-resultados');
        tabelaResultados.innerHTML = '';

        jogadores.forEach(jogador => {
            const li = document.createElement('li');
            li.textContent = `${jogador.nome} - Pontuação Final: ${jogador.pontos}`;
            tabelaResultados.appendChild(li);
        });
    });
});
