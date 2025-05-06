const SUPABASE_URL = "https://qxdoxcgyhfzdjxxabqrx.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZG94Y2d5aGZ6ZGp4eGFicXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MDU5NjcsImV4cCI6MjA2MjA4MTk2N30.Las0zUE29ywEdwZs7bMuCYaUWVk80GQkEwHCE8Gt7jI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function getJogadores() {
  const { data, error } = await supabase
    .from("jogadores")
    .select("*")
    .order("pontos", { ascending: false });
  return { data, error };
}

export async function addJogador(jogador) {
  const { data, error } = await supabase
    .from("jogadores")
    .insert([
      {
        nome: jogador.nome,
        nickname: jogador.nickname,
        ranking: jogador.ranking,
        pontos: jogador.pontos,
        eventos: jogador.eventos,
      },
    ])
    .select();
  return { data, error };
}

export async function createTorneio() {
  const { data, error } = await supabase.from("torneios").insert([{}]).select();
  return data ? data[0] : null;
}

export async function savePartida(partida) {
  const { data, error } = await supabase
    .from("partidas")
    .insert([
      {
        torneio_id: partida.torneioId,
        jogador1_id: partida.jogador1Id,
        jogador2_id: partida.jogador2Id,
        pontos_jogador1: partida.pontosJogador1,
        pontos_jogador2: partida.pontosJogador2,
        eventos: partida.eventos,
      },
    ])
    .select();
  return data ? data[0] : null;
}

export async function updateJogador(jogadorId, updates) {
  const { data, error } = await supabase
    .from("jogadores")
    .update(updates)
    .eq("id", jogadorId)
    .select();
  return { data, error };
}

export async function getTorneioAtivo() {
  const { data, error } = await supabase
    .from("torneios")
    .select("*")
    .eq("concluido", false)
    .order("created_at", { ascending: false })
    .limit(1);
  return data ? data[0] : null;
}

export function subscribeToUpdates(callback) {
  supabase
    .channel("custom-all-channel")
    .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
      callback(payload);
    })
    .subscribe();
}
