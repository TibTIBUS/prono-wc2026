const { createClient } = require("@supabase/supabase-js");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    },
    body: JSON.stringify(body)
  };
}
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes.");
  return createClient(url, key);
}
function requireAdmin(event) {
  const expected = process.env.ADMIN_PASSWORD;
  const received = event.headers["x-admin-password"] || event.headers["X-Admin-Password"];
  if (!expected) throw new Error("ADMIN_PASSWORD non configuré.");
  if (received !== expected) {
    const err = new Error("Mot de passe admin incorrect.");
    err.statusCode = 401;
    throw err;
  }
}
function outcome(a,b){ if(a>b)return "A"; if(a<b)return "B"; return "D"; }
function pointsFor(pred, real) {
  if (!pred || !real || pred.score_a === null || pred.score_b === null) return {points:0, exact:false, good:false};
  if (pred.score_a === real.score_a && pred.score_b === real.score_b) return {points:5, exact:true, good:true};
  if (outcome(pred.score_a, pred.score_b) === outcome(real.score_a, real.score_b)) return {points:2, exact:false, good:true};
  return {points:0, exact:false, good:false};
}
async function loadAllData(supabase) {
  const [employeesRes, matchesRes, predictionsRes, resultsRes] = await Promise.all([
    supabase.from("employees").select("*").order("display_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("matches").select("*").order("position", { ascending: true }),
    supabase.from("predictions").select("*"),
    supabase.from("results").select("*")
  ]);
  for (const res of [employeesRes, matchesRes, predictionsRes, resultsRes]) if (res.error) throw res.error;
  return {employees:employeesRes.data||[], matches:matchesRes.data||[], predictions:predictionsRes.data||[], results:resultsRes.data||[]};
}
function buildRanking(data) {
  const resultsByMatch = new Map(data.results.map(r => [r.match_id, r]));
  const predictionsByEmployee = new Map();
  for (const p of data.predictions) {
    if (!predictionsByEmployee.has(p.employee_id)) predictionsByEmployee.set(p.employee_id, new Map());
    predictionsByEmployee.get(p.employee_id).set(p.match_id, p);
  }
  return data.employees.map(employee => {
    let total=0, exact=0, good=0;
    const byMatch = predictionsByEmployee.get(employee.id) || new Map();
    for (const match of data.matches) {
      const real = resultsByMatch.get(match.id);
      if (!real) continue;
      const calc = pointsFor(byMatch.get(match.id), real);
      total += calc.points;
      if (calc.exact) exact += 1;
      else if (calc.good) good += 1;
    }
    return {employee_id:employee.id, employee:employee.name, total, exact, good};
  }).sort((a,b)=>b.total-a.total || b.exact-a.exact || b.good-a.good || a.employee.localeCompare(b.employee))
    .map((r,index)=>({rank:index+1, ...r}));
}
function buildDetails(data) {
  // Détail par joueur. IMPORTANT : ne renvoie QUE les matchs ayant déjà un
  // résultat. Les pronos des matchs non joués ne sortent jamais d'ici, donc
  // cet endpoint peut être public sans risque de copie.
  const resultsByMatch = new Map(data.results.map(r => [r.match_id, r]));
  const predictionsByEmployee = new Map();
  for (const p of data.predictions) {
    if (!predictionsByEmployee.has(p.employee_id)) predictionsByEmployee.set(p.employee_id, new Map());
    predictionsByEmployee.get(p.employee_id).set(p.match_id, p);
  }
  const playedMatches = data.matches.filter(m => resultsByMatch.has(m.id));
  return data.employees.map(employee => {
    const byMatch = predictionsByEmployee.get(employee.id) || new Map();
    let total = 0, exact = 0, good = 0;
    const matches = playedMatches.map(match => {
      const real = resultsByMatch.get(match.id);
      const pred = byMatch.get(match.id) || null;
      const calc = pointsFor(pred, real);
      total += calc.points;
      if (calc.exact) exact += 1; else if (calc.good) good += 1;
      return {
        match_id: match.id,
        group_name: match.group_name,
        team_a: match.team_a,
        team_b: match.team_b,
        real_a: real.score_a, real_b: real.score_b,
        pred_a: pred && pred.score_a !== null && pred.score_a !== undefined ? pred.score_a : null,
        pred_b: pred && pred.score_b !== null && pred.score_b !== undefined ? pred.score_b : null,
        points: calc.points, exact: calc.exact, good: calc.good
      };
    });
    return { employee_id: employee.id, employee: employee.name, total, exact, good, matches };
  }).sort((a,b)=>b.total-a.total || b.exact-a.exact || b.good-a.good || a.employee.localeCompare(b.employee))
    .map((r,index)=>({rank:index+1, ...r}));
}
module.exports = { json, getSupabase, requireAdmin, loadAllData, buildRanking, buildDetails };
