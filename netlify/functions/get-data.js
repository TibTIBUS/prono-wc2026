const { json, getSupabase, loadAllData } = require("./_utils");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try { return json(200, await loadAllData(getSupabase())); }
  catch (error) { return json(error.statusCode || 500, { error: error.message }); }
};