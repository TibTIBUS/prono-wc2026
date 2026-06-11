const { json, getSupabase, requireAdmin, loadAllData } = require("./_utils");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    requireAdmin(event); // <-- get-data renvoie TOUS les pronos : réservé à l'admin.
    return json(200, await loadAllData(getSupabase()));
  }
  catch (error) { return json(error.statusCode || 500, { error: error.message }); }
};
