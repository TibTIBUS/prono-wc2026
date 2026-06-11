const { getSupabase } = require("./_utils");
const TEAM_MAP = require("./_team-map");

// Coeur de la synchronisation des résultats depuis football-data.org.
// Utilisé à la fois par :
//   - sync-results.js  (déclenchement MANUEL par l'admin)
//   - auto-sync.js     (déclenchement AUTOMATIQUE toutes les 30 min)
//
// Variables d'environnement Netlify nécessaires :
//   FOOTBALL_API_KEY        = ta clé API gratuite football-data.org
//   FOOTBALL_COMPETITION    = (optionnel) code de la compétition, défaut "WC"

function frName(apiName) {
  if (!apiName) return null;
  return TEAM_MAP[apiName] || TEAM_MAP[String(apiName).trim()] || null;
}
function groupLetter(m) {
  const g = m.group || m.stage || "";
  const match = String(g).match(/GROUP[_\s]?([A-L])/i);
  return match ? match[1].toUpperCase() : null;
}

// Récupère les résultats des matchs TERMINÉS et les enregistre dans "results".
// Renvoie un récapitulatif { ok, fetched, saved, unmatched }.
async function syncResults() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_API_KEY non configuré dans Netlify.");
  const comp = process.env.FOOTBALL_COMPETITION || "WC";

  const url = `https://api.football-data.org/v4/competitions/${comp}/matches?status=FINISHED`;
  const resp = await fetch(url, { headers: { "X-Auth-Token": apiKey } });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`API football ${resp.status} : ${txt.slice(0, 200)}`);
  }
  const payload = await resp.json();
  const apiMatches = payload.matches || [];

  const supabase = getSupabase();
  const { data: ourMatches, error: mErr } = await supabase.from("matches").select("*");
  if (mErr) throw mErr;

  // Index de nos matchs par : lettre de groupe + paire d'équipes (ordre indifférent).
  const keyFor = (group, a, b) => `${group}|${[a, b].sort().join("~")}`;
  const idx = new Map();
  for (const m of ourMatches) idx.set(keyFor(m.group_name, m.team_a, m.team_b), m);

  const toUpsert = [];
  const unmatched = [];
  for (const am of apiMatches) {
    const g = groupLetter(am);
    const ft = am.score && am.score.fullTime;
    if (!g || !ft || ft.home === null || ft.away === null) continue; // pas un match de poule terminé
    const homeFr = frName(am.homeTeam && am.homeTeam.name);
    const awayFr = frName(am.awayTeam && am.awayTeam.name);
    const homeRaw = (am.homeTeam && am.homeTeam.name) || "?";
    const awayRaw = (am.awayTeam && am.awayTeam.name) || "?";
    if (!homeFr || !awayFr) { unmatched.push(`${homeRaw} - ${awayRaw} (nom non mappé dans _team-map.js)`); continue; }
    const our = idx.get(keyFor(g, homeFr, awayFr));
    if (!our) { unmatched.push(`Groupe ${g}: ${homeFr} - ${awayFr} (match introuvable dans ta base)`); continue; }
    // Aligne le score sur l'ordre de TA base (team_a / team_b), pas sur home/away.
    const score_a = our.team_a === homeFr ? ft.home : ft.away;
    const score_b = our.team_a === homeFr ? ft.away : ft.home;
    toUpsert.push({ match_id: our.id, score_a: Number(score_a), score_b: Number(score_b), updated_at: new Date().toISOString() });
  }

  let saved = 0;
  if (toUpsert.length) {
    const { error } = await supabase.from("results").upsert(toUpsert, { onConflict: "match_id" });
    if (error) throw error;
    saved = toUpsert.length;
  }
  return { ok: true, fetched: apiMatches.length, saved, unmatched };
}

module.exports = { syncResults };
