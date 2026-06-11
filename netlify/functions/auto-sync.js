const { schedule } = require("@netlify/functions");
const { syncResults } = require("./_sync-core");

// Synchronisation AUTOMATIQUE.
// Cette fonction est planifiée : Netlify la lance tout seul toutes les 30 min.
// Elle va chercher les scores des matchs terminés et les enregistre dans la
// base. Aucune action manuelle, aucun mot de passe : c'est Netlify qui déclenche.
//
// Le rythme est défini par l'expression cron "*/30 * * * *" (toutes les 30 min).
// Pour changer : "0 * * * *" = toutes les heures, "*/15 * * * *" = toutes les 15 min.
exports.handler = schedule("*/30 * * * *", async () => {
  try {
    const result = await syncResults();
    console.log("[auto-sync] OK", JSON.stringify(result));
    return { statusCode: 200 };
  } catch (error) {
    console.error("[auto-sync] ERREUR", error.message);
    // On renvoie quand même 200 pour ne pas faire échouer la planification ;
    // l'erreur est tracée dans les logs Netlify.
    return { statusCode: 200 };
  }
});
