const { json, getSupabase, requireAdmin } = require("./_utils");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    requireAdmin(event);
    const { employee_id, match_id, score_a, score_b } = JSON.parse(event.body || "{}");
    if (!employee_id || !match_id) return json(400, { error:"employee_id et match_id obligatoires." });
    const { error } = await getSupabase().from("predictions").upsert({
      employee_id:Number(employee_id), match_id,
      score_a: score_a === null || score_a === "" ? null : Number(score_a),
      score_b: score_b === null || score_b === "" ? null : Number(score_b),
      updated_at:new Date().toISOString()
    }, {onConflict:"employee_id,match_id"});
    if (error) throw error;
    return json(200, {ok:true});
  } catch (error) { return json(error.statusCode || 500, { error: error.message }); }
};