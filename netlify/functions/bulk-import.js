const { json, getSupabase, requireAdmin } = require("./_utils");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    requireAdmin(event);
    const payload = JSON.parse(event.body || "{}");
    const supabase = getSupabase();

    if (Array.isArray(payload.results) && payload.results.length) {
      const rows = payload.results.map(r => ({match_id:r.match_id, score_a:Number(r.score_a), score_b:Number(r.score_b), updated_at:new Date().toISOString()}));
      const { error } = await supabase.from("results").upsert(rows, {onConflict:"match_id"});
      if (error) throw error;
    }

    if (Array.isArray(payload.pronostics)) {
      const { data: employees, error: empError } = await supabase.from("employees").select("*");
      if (empError) throw empError;
      const byName = new Map(employees.map(e => [e.name, e.id]));
      const rows = [];
      for (const item of payload.pronostics) {
        const employeeId = byName.get(item.employee);
        if (!employeeId || !item.predictions) continue;
        for (const [matchId, score] of Object.entries(item.predictions)) {
          rows.push({
            employee_id: employeeId,
            match_id: matchId,
            score_a: score && score[0] !== null && score[0] !== "" ? Number(score[0]) : null,
            score_b: score && score[1] !== null && score[1] !== "" ? Number(score[1]) : null,
            updated_at: new Date().toISOString()
          });
        }
      }
      for (let i=0; i<rows.length; i+=500) {
        const { error } = await supabase.from("predictions").upsert(rows.slice(i, i+500), {onConflict:"employee_id,match_id"});
        if (error) throw error;
      }
    }
    return json(200, {ok:true});
  } catch (error) { return json(error.statusCode || 500, { error: error.message }); }
};