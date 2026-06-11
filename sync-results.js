const { json, requireAdmin } = require("./_utils");
const { syncResults } = require("./_sync-core");

// Synchronisation MANUELLE : déclenchée depuis l'admin (bouton "Synchroniser").
// Réservé à l'admin. La logique réelle est dans _sync-core.js, partagée avec
// la fonction planifiée auto-sync.js.
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  try {
    requireAdmin(event);
    const result = await syncResults();
    return json(200, result);
  } catch (error) {
    return json(error.statusCode || 500, { error: error.message });
  }
};
