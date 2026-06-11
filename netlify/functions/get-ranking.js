const { json, getSupabase, loadAllData, buildRanking } = require("./_utils");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    const data = await loadAllData(getSupabase());
    return json(200, { ranking: buildRanking(data), meta:{employees:data.employees.length, matches:data.matches.length, results:data.results.length, updated_at:new Date().toISOString()} });
  } catch (error) { return json(error.statusCode || 500, { error: error.message }); }
};