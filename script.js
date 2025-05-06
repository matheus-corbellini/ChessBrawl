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
    NOMES_EVENTOS: {
      jogadaOriginal: "Jogada Original",
      gafe: "Gafe",
      posicionamentoVantajoso: "Posicionamento Vantajoso",
      desrespeito: "Desrespeito",
      ataqueFuria: "Ataque de Fúria",
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

  const UI = {
    elements: {
      nome: document.getElementById("nome"),
      nickname: document.getElementById("nickname"),
      ranking: document.getElementById("ranking"),
      rankingList: document.getElementById("ranking-list"),
      rodadasDiv: document.getElementById("rodadas"),
      partidaSelecionada: document.getElementById("partida-selecionada"),
      placar: document.getElementById("placar"),
      tabelaResultados: document.getElementById("tabela-resultados"),
      partidaActions: document.getElementById("partida-actions"),
      finalizarRodadaBtn: document.getElementById("finalizar-rodada"),
      adminSection: document.getElementById("admin-section"),
      resultadosSection: document.getElementById("resultados-section"),
    },

    init() {
      document.querySelectorAll(".toggle-btn").forEach((btn) => {
        btn.addEventListener("click", () =>
          this.toggleSection(btn.dataset.target)
        );
      });

      [
        "cadastro-section",
        "ranking-section",
        "admin-section",
        "resultados-section",
      ].forEach((id) => {
        document.getElementById(id).classList.add("active");
        const btn = document.querySelector(`[data-target="${id}"]`);
        if (btn) {
          const icon = btn.querySelector(".arrow i");
          icon.classList.remove("fa-chevron-down");
          icon.classList.add("fa-chevron-up");
        }
      });
    },

    toggleSection(targetId) {
      const section = document.getElementById(targetId);
      const arrowIcon = document.querySelector(
        `[data-target="${targetId}"] .arrow i`
      );

      section.classList.toggle("active");
      arrowIcon.classList.toggle("fa-chevron-down");
      arrowIcon.classList.toggle("fa-chevron-up");
    },

    mostrarMensagem(texto, tipo = "info") {
      const container = document.getElementById("mensagens");
      const mensagem = document.createElement("div");
      mensagem.className = `message ${tipo}`;
      mensagem.innerHTML = `
        <span>${texto}</span>
        <span class="close">&times;</span>
      `;
      container.appendChild(mensagem);

      const timer = setTimeout(() => mensagem.remove(), 2000);
      mensagem.querySelector(".close").addEventListener("click", () => {
        clearTimeout(timer);
        mensagem.remove();
      });
    },

    atualizarTabelaRanking() {
      const tbody = this.elements.rankingList;
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
          `;
          tbody.appendChild(row);
        });
    },

    atualizarUIRodadas() {
      this.elements.rodadasDiv.innerHTML = state.rodadas
        .map(
          (partida) => `
          <div class="match-card ${
            partida.concluida ? "concluded" : ""
          }" data-id="${partida.id}">
            <h3>${partida.jogadores[0].nome} vs ${
            partida.jogadores[1].nome
          }</h3>
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
        card.addEventListener("click", () =>
          this.selecionarPartida(card.dataset.id)
        );
      });
    },

    selecionarPartida(partidaId) {
      state.partidaAtual = state.rodadas.find((p) => p.id == partidaId);

      if (state.partidaAtual.concluida) {
        this.mostrarMensagem("Esta partida já foi concluída!", "error");
        return;
      }

      this.elements.partidaSelecionada.innerHTML = `
        <h3><i class="fas fa-chess-knight"></i> ${state.partidaAtual.jogadores[0].nome} vs ${state.partidaAtual.jogadores[1].nome}</h3>
        <p>Pontos iniciais: ${state.partidaAtual.pontosIniciais[0]} - ${state.partidaAtual.pontosIniciais[1]}</p>
      `;

      this.atualizarPlacar();
      this.elements.partidaActions.style.display = "block";
      this.elements.finalizarRodadaBtn.style.display = "block";
      this.elements.adminSection.scrollIntoView({ behavior: "smooth" });
    },

    atualizarPlacar() {
      if (!state.partidaAtual) return;

      const [j1, j2] = state.partidaAtual.jogadores;
      this.elements.placar.innerHTML = `
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
            <p>${e.timestamp} - ${e.jogador}: ${
                  CONFIG.NOMES_EVENTOS[e.evento]
                } (${e.pontos > 0 ? "+" : ""}${e.pontos})</p>
          `
              )
              .join("") || "<p>Nenhum evento registrado ainda</p>"
          }
        </div>
      `;
    },

    mostrarResultadosFinais() {
      const campeao = [...state.jogadores].sort(
        (a, b) => b.pontos - a.pontos
      )[0];

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
    },
  };

  const Tournament = {
    validarJogador(jogador) {
      const errors = [];

      if (!jogador.nome || !/^[A-Za-z\s]+$/.test(jogador.nome)) {
        errors.push("Nome inválido");
      }

      if (
        state.jogadores.some(
          (j) => j.nickname.toLowerCase() === jogador.nickname.toLowerCase()
        )
      ) {
        errors.push("Nickname já existe");
      }

      if (jogador.ranking < 1 || jogador.ranking > 15000) {
        errors.push("Ranking deve ser entre 1 e 15000");
      }

      return errors;
    },

    criarJogador(dados) {
      return {
        ...dados,
        pontos: CONFIG.PONTOS_INICIAIS,
        eventos: Object.keys(CONFIG.EVENTOS).reduce((acc, evento) => {
          acc[evento] = 0;
          return acc;
        }, {}),
        vitorias: 0,
        historicoPontos: [CONFIG.PONTOS_INICIAIS],
      };
    },

    cadastrarJogador(dados) {
      if (state.jogadores.length >= CONFIG.MAX_JOGADORES) {
        return { success: false, errors: ["Máximo de jogadores atingido!"] };
      }

      const errors = this.validarJogador(dados);
      if (errors.length > 0) {
        return { success: false, errors };
      }

      const novoJogador = this.criarJogador(dados);
      state.jogadores.push(novoJogador);

      return { success: true, jogador: novoJogador };
    },

    cadastroRapido() {
      state.jogadores = [];

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

      jogadoresFicticios.forEach((jogador) => {
        state.jogadores.push(this.criarJogador(jogador));
      });

      UI.atualizarTabelaRanking();
      return { success: true, count: jogadoresFicticios.length };
    },

    sortearPartidas() {
      if (
        state.jogadores.length < 4 ||
        state.jogadores.length > 8 ||
        state.jogadores.length % 2 !== 0
      ) {
        return {
          success: false,
          message: "Número de jogadores deve ser par (4, 6 ou 8)!",
        };
      }

      const jogadoresAtivos =
        state.faseAtual === 1
          ? [...state.jogadores]
          : state.jogadores.filter((j) => j.vitorias >= state.faseAtual - 1);

      if (jogadoresAtivos.length < 2) {
        return {
          success: false,
          message: "Não há jogadores suficientes para avançar!",
        };
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
        state.eventosPorRodada[j.nickname] = Object.keys(CONFIG.EVENTOS).reduce(
          (acc, evento) => {
            acc[evento] = 0;
            return acc;
          },
          {}
        );
      });

      state.torneioIniciado = true;
      UI.atualizarUIRodadas();

      return {
        success: true,
        message: `Fase ${state.faseAtual} iniciada com ${state.rodadas.length} partidas!`,
      };
    },

    aplicarEvento(evento, jogadorIndex) {
      if (!state.partidaAtual || state.partidaAtual.concluida) {
        return {
          success: false,
          message: "Selecione uma partida válida primeiro!",
        };
      }

      const jogador = state.partidaAtual.jogadores[jogadorIndex];
      const nickname = jogador.nickname;

      const eventoJaAplicado = state.partidaAtual.eventos.some(
        (e) => e.jogador === jogador.nome && e.evento === evento
      );

      if (eventoJaAplicado) {
        return {
          success: false,
          message: `${jogador.nome} já usou ${CONFIG.NOMES_EVENTOS[evento]} nesta partida! Cada jogador pode usar cada evento apenas 1 vez por partida.`,
        };
      }

      if (state.eventosPorRodada[nickname]?.[evento] >= 1) {
        return {
          success: false,
          message: `Cada jogador pode usar "${CONFIG.NOMES_EVENTOS[evento]}" apenas 1 vez por rodada!`,
        };
      }

      const pontosEvento = CONFIG.EVENTOS[evento];

      if (!state.eventosPorRodada[nickname]) {
        state.eventosPorRodada[nickname] = {};
      }

      state.eventosPorRodada[nickname][evento] = 1;
      jogador.pontos += pontosEvento;
      jogador.eventos[evento] += 1;

      state.partidaAtual.eventos.push({
        jogador: jogador.nome,
        evento,
        pontos: pontosEvento,
        timestamp: new Date().toLocaleTimeString(),
      });

      return {
        success: true,
        message: `${jogador.nome}: ${CONFIG.NOMES_EVENTOS[evento]} (${
          pontosEvento > 0 ? "+" : ""
        }${pontosEvento} pts)`,
        tipoMensagem: pontosEvento > 0 ? "success" : "error",
      };
    },

    finalizarPartida() {
      if (!state.partidaAtual || state.partidaAtual.concluida) {
        return {
          success: false,
          message: "Nenhuma partida ativa para finalizar!",
          tipo: "error",
        };
      }

      const [jogadorA, jogadorB] = state.partidaAtual.jogadores;
      let vencedor, perdedor;
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

      UI.atualizarUIRodadas();
      UI.atualizarTabelaRanking();
      UI.elements.partidaActions.style.display = "none";
      UI.elements.finalizarRodadaBtn.style.display = "none";

      if (mensagemExtra) {
        UI.mostrarMensagem(mensagemExtra, "info");
      }
      UI.mostrarMensagem(
        `🏆 ${vencedor.nome} venceu! (+${CONFIG.PONTOS_VITORIA} pts)`,
        "success"
      );

      this.verificarFase();

      return {
        success: true,
        message: `🏆 ${vencedor.nome} venceu! (+${CONFIG.PONTOS_VITORIA} pts)`,
        partida: state.partidaAtual,
      };
    },

    verificarFase() {
      if (state.rodadas.every((p) => p.concluida)) {
        const jogadoresClassificados = state.jogadores.filter(
          (j) => j.vitorias >= state.faseAtual
        );

        if (jogadoresClassificados.length >= 2) {
          state.faseAtual++;
          return {
            success: true,
            message: `Fase ${state.faseAtual} desbloqueada! Clique em "Sortear Partidas".`,
            novaFase: state.faseAtual,
          };
        } else {
          this.finalizarTorneio();
          return {
            success: true,
            message: "Torneio finalizado!",
            finalizado: true,
          };
        }
      }
      return { success: false };
    },

    finalizarTorneio() {
      UI.mostrarResultadosFinais();
      UI.elements.resultadosSection.classList.add("active");

      const campeao = [...state.jogadores].sort(
        (a, b) => b.pontos - a.pontos
      )[0];
      return {
        success: true,
        message: `Torneio concluído! ${campeao.nome} é o campeão!`,
        campeao,
      };
    },

    async reiniciarTorneio() {
      const confirmado = await this.confirmarAcao();
      if (!confirmado) {
        return { success: false, message: "Reinício cancelado" };
      }

      state.jogadores = [];
      state.rodadas = [];
      state.partidaAtual = null;
      state.torneioIniciado = false;
      state.faseAtual = 1;
      state.eventosPorRodada = {};

      UI.elements.rankingList.innerHTML = "";
      UI.elements.rodadasDiv.innerHTML = "";
      UI.elements.placar.innerHTML = "";
      UI.elements.tabelaResultados.innerHTML = "";
      UI.elements.partidaSelecionada.innerHTML =
        "<p>Selecione uma partida para administrar</p>";
      UI.elements.partidaActions.style.display = "none";
      UI.elements.finalizarRodadaBtn.style.display = "none";

      document.getElementById("form-jogador").reset();

      return {
        success: true,
        message: "Torneio reiniciado com sucesso! Cadastre novos jogadores.",
      };
    },

    confirmarAcao() {
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
    },

    simularPartida() {
      if (!state.partidaAtual || state.partidaAtual.concluida) {
        return {
          success: false,
          message: "Selecione uma partida válida primeiro!",
        };
      }

      const eventosDisponiveis = Object.keys(CONFIG.EVENTOS).filter(
        (evento) => {
          const jogador0 = state.partidaAtual.jogadores[0];
          const jogador1 = state.partidaAtual.jogadores[1];

          return !state.partidaAtual.eventos.some(
            (e) =>
              (e.jogador === jogador0.nome && e.evento === evento) ||
              (e.jogador === jogador1.nome && e.evento === evento)
          );
        }
      );

      if (eventosDisponiveis.length === 0) {
        return {
          success: false,
          message: "Todos os eventos já foram usados nesta partida!",
        };
      }

      const jogadorAlvo = Math.floor(Math.random() * 2);
      const eventoAleatorio =
        eventosDisponiveis[
          Math.floor(Math.random() * eventosDisponiveis.length)
        ];

      return this.aplicarEvento(eventoAleatorio, jogadorAlvo);
    },
  };

  UI.init();

  document
    .getElementById("form-jogador")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const dados = {
        nome: UI.elements.nome.value.trim(),
        nickname: UI.elements.nickname.value.trim(),
        ranking: parseInt(UI.elements.ranking.value),
      };

      const resultado = Tournament.cadastrarJogador(dados);

      if (resultado.success) {
        UI.mostrarMensagem(`${dados.nome} cadastrado com sucesso!`, "success");
        e.target.reset();
        UI.atualizarTabelaRanking();
      } else {
        UI.mostrarMensagem(resultado.errors.join(", "), "error");
      }
    });

  document.getElementById("cadastro-rapido").addEventListener("click", () => {
    const resultado = Tournament.cadastroRapido();
    if (resultado.success) {
      UI.mostrarMensagem(
        `${resultado.count} jogadores cadastrados com sucesso!`,
        "success"
      );
    }
  });

  document.getElementById("sortear-partidas").addEventListener("click", () => {
    const resultado = Tournament.sortearPartidas();
    if (resultado.success) {
      UI.mostrarMensagem(resultado.message, "success");
      UI.elements.adminSection.classList.add("active");
    } else {
      UI.mostrarMensagem(resultado.message, "error");
    }
  });

  UI.elements.finalizarRodadaBtn.addEventListener("click", () => {
    const resultado = Tournament.finalizarPartida();
  });

  document
    .getElementById("novo-torneio")
    .addEventListener("click", async () => {
      const resultado = await Tournament.reiniciarTorneio();
      UI.mostrarMensagem(
        resultado.message,
        resultado.success ? "success" : "info"
      );
      if (resultado.success) {
        setTimeout(() => UI.elements.nome.focus(), 100);
      }
    });

  document.getElementById("simular-partida").addEventListener("click", () => {
    const resultado = Tournament.simularPartida();
    if (resultado.success) {
      UI.mostrarMensagem(resultado.message, resultado.tipoMensagem);
      UI.atualizarPlacar();
    } else {
      UI.mostrarMensagem(resultado.message, "error");
    }
  });

  document.getElementById("carregar-ranking").addEventListener("click", () => {
    UI.atualizarTabelaRanking();
  });

  window.aplicarEvento = function (evento) {
    const jogadorIndex = parseInt(
      document.getElementById("jogador-alvo").value
    );
    const resultado = Tournament.aplicarEvento(evento, jogadorIndex);

    if (resultado.success) {
      UI.mostrarMensagem(resultado.message, resultado.tipoMensagem);
      UI.atualizarPlacar();
    } else {
      UI.mostrarMensagem(resultado.message, "error");
    }
  };
});
