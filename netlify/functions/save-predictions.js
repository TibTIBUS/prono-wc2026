const { json, getSupabase, requireAdmin } = require("./_utils");

// Sauvegarde TOUS les pronos d'un salarié en UNE seule requête atomique.
// Remplace la boucle fragile (1 requête par match) qui pouvait s'interrompre
// en cours de route et ne sauver qu'une partie des matchs.
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    requireAdmin(event);
    const { employee_id, predictions } = JSON.parse(event.body || "{}");
    if (!employee_id) return json(400, { error: "employee_id obligatoire." });
    if (!Array.isArray(predictions)) return json(400, { error: "predictions doit être un tableau." });

    const empId = Number(employee_id);
    const rows = predictions
      .filter(p => p && p.match_id)
      .map(p => ({
        employee_id: empId,
        match_id: p.match_id,
        score_a: p.score_a === null || p.score_a === "" || p.score_a === undefined ? null : Number(p.score_a),
        score_b: p.score_b === null || p.score_b === "" || p.score_b === undefined ? null : Number(p.score_b),
        updated_at: new Date().toISOString()
      }));

    if (!rows.length) return json(200, { ok: true, saved: 0 });

    const { error } = await getSupabase()
      .from("predictions")
      .upsert(rows, { onConflict: "employee_id,match_id" });
    if (error) throw error;

    return json(200, { ok: true, saved: rows.length });
  } catch (error) {
    return json(error.statusCode || 500, { error: error.message });
  }
};
