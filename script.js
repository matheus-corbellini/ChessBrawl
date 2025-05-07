document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    MAX_JOGADORES: 8,
    PONTOS_INICIAIS: 70,
    PONTOS_VITORIA: 30,
    PONTOS_EMPATE: 2,
    EVENTOS: {
      jogadaOriginal: 5,
      gafe: -3,
      posicionamentoVantajoso: 2,
      desrespeito: -5,
      ataqueFuria: -7,
    },
  };

  const state = {
    jogadores: [],
    rodadas: [],
    partidaAtual: null,
    torneioIniciado: false,
    faseAtual: 1,
    eventosPorRodada: {},
  };

  const profecias = [
    {
      id: 1,
      texto: "Vença uma partida sem cometer gafes",
      icone: "🧹",
      recompensa: { pontos: 5, titulo: "O Precisa" },
      dificuldade: "media",
    },
    {
      id: 2,
      texto: "Use 3 'Jogadas Originais' em uma partida",
      icone: "🎨",
      recompensa: { pontos: 3, vantagem: "1 evento extra na próxima rodada" },
      dificuldade: "alta",
    },
    {
      id: 3,
      texto: "Termine com exatamente 120 pontos",
      icone: "🎯",
      recompensa: { pontos: 8 },
      dificuldade: "altissima",
    },
    {
      id: 4,
      texto: "Vença após estar 10pts atrás",
      icone: "🔄",
      recompensa: { pontos: 7, titulo: "O Comeback" },
      dificuldade: "alta",
    },
    {
      id: 5,
      texto: "Tenha mais 'Desrespeitos' que o oponente e vença",
      icone: "😈",
      recompensa: { pontos: 6 },
      dificuldade: "media",
    },
    {
      id: 6,
      texto: "Não use 'Posicionamento Vantajoso' em nenhuma partida",
      icone: "🚫",
      recompensa: { pontos: 4, titulo: "O Instintivo" },
      dificuldade: "baixa",
    },
    {
      id: 7,
      texto: "Faça 2 'Ataques de Fúria' consecutivos",
      icone: "⚡",
      recompensa: { pontos: 5 },
      dificuldade: "media",
    },
    {
      id: 8,
      texto: "Vença o torneio sem repetir nenhum evento",
      icone: "🌈",
      recompensa: { pontos: 10, titulo: "O Versátil" },
      dificuldade: "altissima",
    },
  ];

  const UI = {
    nome: document.getElementById("nome"),
    nickname: document.getElementById("nickname"),
    ranking: document.getElementById("ranking"),

    rankingList: document.getElementById("ranking-list"),

    rodadasDiv: document.getElementById("rodadas"),

    partidaSelecionada: document.getElementById("partida-selecionada"),
    placar: document.getElementById("placar"),
    partidaActions: document.getElementById("partida-actions"),
    finalizarRodadaBtn: document.getElementById("finalizar-rodada"),

    tabelaResultados: document.getElementById("tabela-resultados"),

    jogadorProfeciaSelect: document.getElementById("jogador-profecia"),
    listaProfecias: document.getElementById("lista-profecias"),

    mensagensContainer: document.getElementById("mensagens"),
  };

  function init() {
    initUI();
    initEventListeners();
    atualizarDropdownJogadores();
  }

  function initUI() {
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const targetId = this.dataset.target;
        const section = document.getElementById(targetId);
        const arrowIcon = this.querySelector(".arrow i");

        section.classList.toggle("active");
        arrowIcon.classList.toggle("fa-chevron-down");
        arrowIcon.classList.toggle("fa-chevron-up");
      });
    });

    [
      "cadastro-section",
      "ranking-section",
      "profecias-section",
      "torneio-section",
      "admin-section",
      "resultados-section",
    ].forEach((id) => {
      document.getElementById(id).classList.add("active");
    });
  }

  function initEventListeners() {
    document
      .getElementById("form-jogador")
      .addEventListener("submit", cadastrarJogador);

    document
      .getElementById("cadastro-rapido")
      .addEventListener("click", cadastroRapido);

    document
      .getElementById("sortear-partidas")
      .addEventListener("click", sortearPartidas);
    document
      .getElementById("carregar-ranking")
      .addEventListener("click", atualizarTabelaRanking);

    UI.finalizarRodadaBtn.addEventListener("click", finalizarPartida);
    document
      .getElementById("simular-partida")
      .addEventListener("click", simularPartida);

    document
      .getElementById("mostrar-resultados")
      .addEventListener("click", mostrarResultadosFinais);
    document
      .getElementById("novo-torneio")
      .addEventListener("click", reiniciarTorneio);
    document
      .getElementById("atribuir-profecia")
      .addEventListener("click", abrirSelecaoProfecia);
    document
      .getElementById("sortear-profecia")
      .addEventListener("click", sortearProfecia);
    document
      .getElementById("cancelar-profecia")
      .addEventListener("click", fecharModalProfecia);
  }

  function cadastrarJogador(e) {
    e.preventDefault();

    const nome = UI.nome.value.trim();
    const nickname = UI.nickname.value.trim();
    const ranking = parseInt(UI.ranking.value);

    function isNomeValido(nome) {
      const regex = /^[A-Za-z\s]+$/;
      return regex.test(nome);
    }

    if (state.jogadores.length >= CONFIG.MAX_JOGADORES) {
      mostrarMensagem("Máximo de 8 jogadores atingido!", "error");
      return;
    }

    if (!nome || !nickname || isNaN(ranking)) {
      mostrarMensagem("Preencha todos os campos corretamente!", "error");
      return;
    }

    if (ranking < 1 || ranking > 15000) {
      mostrarMensagem("Ranking deve ser entre 1 e 15000!", "error");
      return;
    }

    if (
      state.jogadores.some(
        (j) => j.nickname.toLowerCase() === nickname.toLowerCase()
      )
    ) {
      mostrarMensagem("Nickname já existe!", "error");
      return;
    }

    if (!isNomeValido(nome)) {
      mostrarMensagem("Nome inválido, tente outro!", "error");
      return;
    }

    const jogador = {
      nome,
      nickname,
      ranking,
      pontos: CONFIG.PONTOS_INICIAIS,
      eventos: {
        jogadaOriginal: 0,
        gafe: 0,
        posicionamentoVantajoso: 0,
        desrespeito: 0,
        ataqueFuria: 0,
      },
      vitorias: 0,
      historicoPontos: [CONFIG.PONTOS_INICIAIS],
      profecias: null,
    };

    state.jogadores.push(jogador);
    mostrarMensagem(`${nome} cadastrado com sucesso!`, "success");
    e.target.reset();
    atualizarTabelaRanking();
    atualizarDropdownJogadores();
  }

  function cadastroRapido() {
    const jogadoresFicticios = [
      { nome: "Matheus", nickname: "FischerX", ranking: 8500 },
      { nome: "Ana", nickname: "AnaChess", ranking: 4200 },
      { nome: "Magnus Silva", nickname: "MagnusBR", ranking: 13500 },
      { nome: "Joao Oliveira", nickname: "JoaoP", ranking: 7800 },
      { nome: "Garry", nickname: "GarryK", ranking: 11200 },
      { nome: "Lucas Silva", nickname: "SilvaKing", ranking: 6500 },
      { nome: "Pedro", nickname: "Pedrinho", ranking: 14300 },
      { nome: "Artur silva", nickname: "ArturS", ranking: 9500 },
    ];

    state.jogadores = [];

    jogadoresFicticios.forEach((jogador) => {
      state.jogadores.push({
        nome: jogador.nome,
        nickname: jogador.nickname,
        ranking: jogador.ranking,
        pontos: CONFIG.PONTOS_INICIAIS,
        eventos: {
          jogadaOriginal: 0,
          gafe: 0,
          posicionamentoVantajoso: 0,
          desrespeito: 0,
          ataqueFuria: 0,
        },
        vitorias: 0,
        historicoPontos: [CONFIG.PONTOS_INICIAIS],
        profecias: null,
      });
    });

    mostrarMensagem("8 jogadores cadastrados com sucesso!", "success");
    atualizarTabelaRanking();
    atualizarDropdownJogadores();
  }

  function atualizarTabelaRanking() {
    const tbody = UI.rankingList;
    tbody.innerHTML = "";

    state.jogadores
      .sort((a, b) => b.pontos - a.pontos)
      .forEach((jogador, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${jogador.nome}</td>
          <td>${jogador.nickname}</td>
          <td>${jogador.pontos}</td>
          <td>${jogador.vitorias}</td>
          <td>${jogador.titulo || ""}</td>
        `;
        tbody.appendChild(row);
      });
  }

  function sortearPartidas() {
    if (
      state.jogadores.length < 4 ||
      state.jogadores.length > 8 ||
      state.jogadores.length % 2 !== 0
    ) {
      mostrarMensagem("Número de jogadores deve ser par (4, 6 ou 8)!", "error");
      return;
    }

    const jogadoresAtivos =
      state.faseAtual === 1
        ? [...state.jogadores]
        : state.jogadores.filter((j) => j.vitorias >= state.faseAtual - 1);

    if (jogadoresAtivos.length < 2) {
      mostrarMensagem("Não há jogadores suficientes para avançar!", "error");
      return;
    }

    state.rodadas = [];
    const shuffled = [...jogadoresAtivos].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i += 2) {
      state.rodadas.push({
        id: Date.now() + i,
        jogadores: [shuffled[i], shuffled[i + 1]],
        concluida: false,
        eventos: [],
        pontosIniciais: [shuffled[i].pontos, shuffled[i + 1].pontos],
      });
    }

    state.eventosPorRodada = {};
    state.jogadores.forEach((j) => {
      state.eventosPorRodada[j.nickname] = {
        jogadaOriginal: 0,
        gafe: 0,
        posicionamentoVantajoso: 0,
        desrespeito: 0,
        ataqueFuria: 0,
      };
    });

    state.torneioIniciado = true;
    atualizarUIRodadas();
    mostrarMensagem(
      `Fase ${state.faseAtual} iniciada com ${state.rodadas.length} partidas!`,
      "success"
    );
  }

  function atualizarUIRodadas() {
    UI.rodadasDiv.innerHTML = state.rodadas
      .map(
        (partida) => `
        <div class="match-card ${
          partida.concluida ? "concluded" : ""
        }" data-id="${partida.id}">
          <h3>${partida.jogadores[0].nome} vs ${partida.jogadores[1].nome}</h3>
          <p>Pontos: ${partida.jogadores[0].pontos} - ${
          partida.jogadores[1].pontos
        }</p>
          ${
            partida.concluida
              ? `<p class="winner"><i class="fas fa-trophy"></i> Vencedor: ${partida.vencedor}</p>`
              : ""
          }
        </div>
      `
      )
      .join("");

    document.querySelectorAll(".match-card").forEach((card) => {
      card.addEventListener("click", function () {
        const partidaId = this.dataset.id;
        state.partidaAtual = state.rodadas.find((p) => p.id == partidaId);

        if (state.partidaAtual.concluida) {
          mostrarMensagem("Esta partida já foi concluída!", "error");
          return;
        }

        UI.partidaSelecionada.innerHTML = `
          <h3><i class="fas fa-chess-knight"></i> ${state.partidaAtual.jogadores[0].nome} vs ${state.partidaAtual.jogadores[1].nome}</h3>
          <p>Pontos iniciais: ${state.partidaAtual.pontosIniciais[0]} - ${state.partidaAtual.pontosIniciais[1]}</p>
        `;

        atualizarPlacar();
        UI.partidaActions.style.display = "block";
        UI.finalizarRodadaBtn.style.display = "block";
      });
    });
  }

  window.aplicarEvento = function (evento) {
    if (!state.partidaAtual || state.partidaAtual.concluida) {
      mostrarMensagem("Selecione uma partida válida primeiro!", "error");
      return;
    }

    const jogadorIndex = parseInt(
      document.getElementById("jogador-alvo").value
    );
    const jogador = state.partidaAtual.jogadores[jogadorIndex];
    const nickname = jogador.nickname;

    if (state.eventosPorRodada[nickname]?.[evento] >= 1) {
      mostrarMensagem(
        `Cada jogador pode usar "${evento}" apenas 1 vez por rodada!`,
        "error"
      );
      return;
    }

    const pontosEvento = CONFIG.EVENTOS[evento];

    if (!state.eventosPorRodada[nickname])
      state.eventosPorRodada[nickname] = {};
    state.eventosPorRodada[nickname][evento] = 1;
    jogador.pontos += pontosEvento;
    jogador.eventos[evento] += 1;

    state.partidaAtual.eventos.push({
      jogador: jogador.nome,
      evento,
      pontos: pontosEvento,
      timestamp: new Date().toLocaleTimeString(),
    });

    mostrarMensagem(
      `${jogador.nome}: ${evento} (${
        pontosEvento > 0 ? "+" : ""
      }${pontosEvento} pts)`,
      pontosEvento > 0 ? "success" : "error"
    );

    atualizarPlacar();
  };

  function atualizarPlacar() {
    if (!state.partidaAtual) return;

    const [j1, j2] = state.partidaAtual.jogadores;
    UI.placar.innerHTML = `
      <div class="score-header">
        <h3><i class="fas fa-chess-board"></i> Placar Atual</h3>
        <p>Fase ${state.faseAtual}</p>
      </div>
      <div class="player-score ${j1.pontos > j2.pontos ? "leading" : ""}">
        <span>${j1.nome}</span>
        <span>${j1.pontos} pts</span>
      </div>
      <div class="player-score ${j2.pontos > j1.pontos ? "leading" : ""}">
        <span>${j2.nome}</span>
        <span>${j2.pontos} pts</span>
      </div>
      <div class="event-log">
        <h4><i class="fas fa-history"></i> Histórico da Partida</h4>
        ${
          state.partidaAtual.eventos
            .map(
              (e) => `
          <p>${e.timestamp} - ${e.jogador}: ${e.evento} (${
                e.pontos > 0 ? "+" : ""
              }${e.pontos})</p>
        `
            )
            .join("") || "<p>Nenhum evento registrado ainda</p>"
        }
      </div>
    `;
  }

  function simularPartida() {
    if (!state.partidaAtual || state.partidaAtual.concluida) {
      mostrarMensagem("Selecione uma partida válida primeiro!", "error");
      return;
    }

    const eventos = Object.keys(CONFIG.EVENTOS);
    const jogadorAlvo = Math.floor(Math.random() * 2);
    const eventoAleatorio = eventos[Math.floor(Math.random() * eventos.length)];

    document.getElementById("jogador-alvo").value = jogadorAlvo;
    aplicarEvento(eventoAleatorio);
  }

  function finalizarPartida() {
    if (!state.partidaAtual || state.partidaAtual.concluida) {
      mostrarMensagem("Nenhuma partida ativa para finalizar!", "error");
      return;
    }

    const [jogadorA, jogadorB] = state.partidaAtual.jogadores;
    let vencedor = null;
    let perdedor = null;
    let mensagemExtra = "";

    if (jogadorA.pontos > jogadorB.pontos) {
      vencedor = jogadorA;
      perdedor = jogadorB;
    } else if (jogadorB.pontos > jogadorA.pontos) {
      vencedor = jogadorB;
      perdedor = jogadorA;
    } else {
      vencedor = Math.random() > 0.5 ? jogadorA : jogadorB;
      perdedor = vencedor === jogadorA ? jogadorB : jogadorA;
      vencedor.pontos += CONFIG.PONTOS_EMPATE;
      mensagemExtra = `EMPATE! Blitz Match: ${vencedor.nome} ganhou +${CONFIG.PONTOS_EMPATE} pts no sorteio!`;
    }

    vencedor.pontos += CONFIG.PONTOS_VITORIA;
    vencedor.vitorias += 1;
    vencedor.historicoPontos.push(vencedor.pontos);
    perdedor.historicoPontos.push(perdedor.pontos);

    state.partidaAtual.concluida = true;
    state.partidaAtual.vencedor = vencedor.nome;
    state.partidaAtual.pontosFinais = [jogadorA.pontos, jogadorB.pontos];

    verificarProfecias(state.partidaAtual);

    if (mensagemExtra) {
      mostrarMensagem(mensagemExtra, "info");
    }
    mostrarMensagem(
      `🏆 ${vencedor.nome} venceu! (+${CONFIG.PONTOS_VITORIA} pts)`,
      "success"
    );

    atualizarUIRodadas();
    atualizarTabelaRanking();
    UI.partidaActions.style.display = "none";
    UI.finalizarRodadaBtn.style.display = "none";

    verificarFase();
  }

  function verificarFase() {
    if (state.rodadas.every((p) => p.concluida)) {
      const jogadoresClassificados = state.jogadores.filter(
        (j) => j.vitorias >= state.faseAtual
      );

      if (jogadoresClassificados.length >= 2) {
        state.faseAtual++;
        mostrarMensagem(
          `Fase ${state.faseAtual} desbloqueada! Clique em "Sortear Partidas".`,
          "info"
        );
      } else {
        finalizarTorneio();
      }
    }
  }

  function atualizarDropdownJogadores() {
    UI.jogadorProfeciaSelect.innerHTML =
      '<option value="">Selecione um jogador</option>';
    state.jogadores.forEach((jogador) => {
      const option = document.createElement("option");
      option.value = jogador.nickname;
      option.textContent = `${jogador.nome} (${jogador.nickname})`;
      UI.jogadorProfeciaSelect.appendChild(option);
    });
  }

  function abrirSelecaoProfecia() {
    const nickname = UI.jogadorProfeciaSelect.value;
    if (!nickname) {
      mostrarMensagem("Selecione um jogador primeiro!", "error");
      return;
    }

    const jogador = state.jogadores.find((j) => j.nickname === nickname);
    if (!jogador) return;

    document.getElementById(
      "jogador-profecia-nome"
    ).textContent = `${jogador.nome} (${jogador.nickname})`;

    document.getElementById("profecia-dialog").showModal();
  }

  function sortearProfecia() {
    const nickname = UI.jogadorProfeciaSelect.value;
    const jogador = state.jogadores.find((j) => j.nickname === nickname);
    if (!jogador) return;

    const profeciaSorteada =
      profecias[Math.floor(Math.random() * profecias.length)];
    atribuirProfecia(jogador, profeciaSorteada.id);
    fecharModalProfecia();
  }

  function atribuirProfecia(jogador, idProfecia) {
    const profecia = profecias.find((p) => p.id === idProfecia);
    if (!profecia) return;

    jogador.profecias = {
      ...profecia,
      cumprida: false,
    };

    mostrarMensagem(`Profecia atribuída a ${jogador.nome}!`, "success");
    atualizarListaProfecias();
  }

  function verificarProfecias(partida) {
    partida.jogadores.forEach((jogador) => {
      if (!jogador.profecias || jogador.profecias.cumprida) return;

      let cumpriu = false;

      switch (jogador.profecias.id) {
        case 1:
          cumpriu =
            jogador.eventos.gafe === 0 && partida.vencedor === jogador.nome;
          break;
        case 2:
          cumpriu = jogador.eventos.jogadaOriginal >= 3;
          break;
        case 3:
          cumpriu = jogador.pontos === 120;
          break;
        case 4:
          const pontosIniciais =
            partida.pontosIniciais[jogador === partida.jogadores[0] ? 0 : 1];
          cumpriu =
            jogador.pontos - pontosIniciais <= -10 &&
            partida.vencedor === jogador.nome;
          break;
        case 5:
          const oponente = partida.jogadores.find((j) => j !== jogador);
          cumpriu =
            jogador.eventos.desrespeito > oponente.eventos.desrespeito &&
            partida.vencedor === jogador.nome;
          break;
        case 6:
          cumpriu = jogador.eventos.posicionamentoVantajoso === 0;
          break;
        case 7:
          const eventos = partida.eventos.filter(
            (e) => e.jogador === jogador.nome && e.evento === "ataqueFuria"
          );
          cumpriu = eventos.length >= 2;
          break;
        case 8:
          const eventosUnicos = new Set(
            partida.eventos
              .filter((e) => e.jogador === jogador.nome)
              .map((e) => e.evento)
          );
          cumpriu =
            eventosUnicos.size ===
              partida.eventos.filter((e) => e.jogador === jogador.nome)
                .length && partida.vencedor === jogador.nome;
          break;
      }

      if (cumpriu) {
        jogador.profecias.cumprida = true;
        jogador.pontos += jogador.profecias.recompensa.pontos;
        if (jogador.profecias.recompensa.titulo) {
          jogador.titulo = jogador.profecias.recompensa.titulo;
        }
        mostrarMensagem(
          `🎉 ${jogador.nome} cumpriu a profecia "${jogador.profecias.texto}"!`,
          "destaque"
        );
      }
    });

    atualizarListaProfecias();
  }

  function atualizarListaProfecias() {
    UI.listaProfecias.innerHTML = "";

    state.jogadores
      .filter((j) => j.profecias)
      .forEach((jogador) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${jogador.nome}</td>
        <td>${jogador.profecias.texto}</td>
        <td class="${
          jogador.profecias.cumprida ? "profecia-cumprida" : "profecia-pendente"
        }">
          ${jogador.profecias.cumprida ? "✅ Cumprida" : "⌛ Pendente"}
        </td>
      `;
        UI.listaProfecias.appendChild(tr);
      });
  }

  function fecharModalProfecia() {
    document.getElementById("profecia-dialog").close();
  }

  function finalizarTorneio() {
    const campeao = [...state.jogadores].sort((a, b) => b.pontos - a.pontos)[0];

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
            ${state.jogadores
              .sort((a, b) => b.pontos - a.pontos)
              .map(
                (j, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${j.nome} (${j.nickname})</td>
                  <td>${j.pontos}</td>
                  <td>${j.vitorias}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      
      <div class="stats-container">
        <h3><i class="fas fa-chart-bar"></i> Estatísticas</h3>
        <div class="stats-grid">
          ${state.jogadores
            .map(
              (j) => `
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
          `
            )
            .join("")}
        </div>
      </div>
    `;

    mostrarMensagem(
      `Torneio concluído! ${campeao.nome} é o campeão!`,
      "success"
    );
  }

  function mostrarResultadosFinais() {
    const campeao = [...state.jogadores].sort((a, b) => b.pontos - a.pontos)[0];

    this.elements.tabelaResultados.innerHTML = `
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
              ${state.jogadores
                .sort((a, b) => b.pontos - a.pontos)
                .map(
                  (j, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${j.nome} (${j.nickname})</td>
                    <td>${j.pontos}</td>
                    <td>${j.vitorias}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        
        <div class="stats-container">
          <h3><i class="fas fa-chart-bar"></i> Estatísticas</h3>
          <div class="stats-grid">
            ${state.jogadores
              .map(
                (j) => `
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
            `
              )
              .join("")}
          </div>
        </div>
      `;
  }

  async function reiniciarTorneio() {
    const confirmado = await confirmarAcao();
    if (!confirmado) {
      mostrarMensagem("Reinício cancelado", "info");
      return;
    }

    state.jogadores = [];
    state.rodadas = [];
    state.partidaAtual = null;
    state.torneioIniciado = false;
    state.faseAtual = 1;
    state.eventosPorRodada = {};

    UI.rankingList.innerHTML = "";
    UI.rodadasDiv.innerHTML = "";
    UI.placar.innerHTML = "";
    UI.tabelaResultados.innerHTML = "";

    const listaProfecias = document.getElementById("lista-profecias");
    if (listaProfecias) {
      listaProfecias.innerHTML = "";
    }

    const jogadorProfeciaDropdown = document.getElementById("jogador-profecia");
    if (jogadorProfeciaDropdown) {
      jogadorProfeciaDropdown.innerHTML =
        '<option value="">Selecione um jogador</option>';
    }

    UI.partidaSelecionada.innerHTML =
      "<p>Selecione uma partida para administrar</p>";
    UI.partidaActions.style.display = "none";
    UI.finalizarRodadaBtn.style.display = "none";

    document.getElementById("form-jogador").reset();
    atualizarDropdownJogadores();

    mostrarMensagem(
      "Torneio reiniciado com sucesso! Cadastre novos jogadores.",
      "success"
    );
    setTimeout(() => UI.nome.focus(), 100);
  }

  function confirmarAcao() {
    return new Promise((resolve) => {
      const dialog = document.getElementById("confirm-dialog");
      dialog.showModal();

      document.getElementById("confirm-yes").onclick = () => {
        dialog.close();
        resolve(true);
      };

      document.getElementById("confirm-no").onclick = () => {
        dialog.close();
        resolve(false);
      };
    });
  }

  function mostrarMensagem(texto, tipo = "info") {
    const container = UI.mensagensContainer;
    const mensagem = document.createElement("div");
    mensagem.className = `message ${tipo}`;

    if (tipo === "destaque") {
      mensagem.innerHTML = `
            <div class="profecia-icon">✨</div>
            <div class="profecia-content">
                <span>${texto}</span>
            </div>
            <span class="close">&times;</span>
        `;
    } else {
      mensagem.innerHTML = `
            <span>${texto}</span>
            <span class="close">&times;</span>
        `;
    }

    container.appendChild(mensagem);

    mensagem.style.animation = "slideIn 0.5s ease";

    const timer = setTimeout(() => {
      mensagem.style.animation = "fadeOut 0.5s ease";
      setTimeout(() => mensagem.remove(), 500);
    }, 5000);

    mensagem.querySelector(".close").addEventListener("click", () => {
      clearTimeout(timer);
      mensagem.style.animation = "fadeOut 0.5s ease";
      setTimeout(() => mensagem.remove(), 500);
    });
  }

  init();
});
