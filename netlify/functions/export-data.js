const { json, getSupabase, requireAdmin, loadAllData, buildRanking } = require("./_utils");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    requireAdmin(event);
    const data = await loadAllData(getSupabase());
    return json(200, {...data, ranking:buildRanking(data)});
  } catch (error) { return json(error.statusCode || 500, { error: error.message }); }
};