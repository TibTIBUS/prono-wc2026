const { json, getSupabase, loadAllData, buildDetails } = require("./_utils");
// Endpoint PUBLIC mais sûr : ne renvoie que les pronos des matchs déjà terminés
// (voir buildDetails dans _utils.js). Utilisé par la page classement pour le
// détail par joueur, sans jamais exposer les pronos des matchs à venir.
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    const data = await loadAllData(getSupabase());
    return json(200, {
      players: buildDetails(data),
      meta: {
        employees: data.employees.length,
        matches: data.matches.length,
        results: data.results.length,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) { return json(error.statusCode || 500, { error: error.message }); }
};
