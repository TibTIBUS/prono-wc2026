const { json, getSupabase, requireAdmin } = require("./_utils");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    requireAdmin(event);
    const { match_id, score_a, score_b } = JSON.parse(event.body || "{}");
    if (!match_id || score_a === undefined || score_b === undefined) return json(400, { error:"match_id, score_a et score_b obligatoires." });
    const { error } = await getSupabase().from("results").upsert({match_id, score_a:Number(score_a), score_b:Number(score_b), updated_at:new Date().toISOString()}, {onConflict:"match_id"});
    if (error) throw error;
    return json(200, {ok:true});
  } catch (error) { return json(error.statusCode || 500, { error: error.message }); }
};