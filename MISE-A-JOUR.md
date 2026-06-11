# Mise à jour — Sécurité, résultats auto, classement vivant

Trois améliorations ont été ajoutées. Voici ce qui change et comment déployer.

---

## 1. Sécurisation de `get-data`

**Avant :** la fonction `get-data` était publique et renvoyait tous les pronos
de tout le monde à qui connaissait l'URL.

**Maintenant :** elle exige le mot de passe admin (`requireAdmin`). La page admin
a été adaptée pour l'envoyer.

Fichiers : `netlify/functions/get-data.js`, `public/js/admin.js`.

> La page admin ne charge plus les données automatiquement : entre ton mot de passe
> puis clique « Recharger les données ». (L'aperçu du classement reste visible sans mot de passe.)

**Patch SQL optionnel (recommandé) :** exécute `supabase/security-patch.sql`
dans Supabase pour retirer aussi la lecture publique de la table des pronos
(défense en profondeur). Les fonctions continuent de marcher.

---

## 2. Détail par joueur sans fuite — nouvel endpoint `get-details`

Nouvelle fonction `netlify/functions/get-details.js`. Elle renvoie, pour chaque
joueur, le détail de ses pronos **uniquement sur les matchs déjà terminés**.
Les pronos des matchs à venir ne sortent jamais de cet endpoint : il peut donc
rester public sans permettre de copier les pronos des autres.

Fichiers : `netlify/functions/get-details.js`, logique `buildDetails` dans `_utils.js`.

---

## 3. Résultats automatiques via l'API football

Nouvelle fonction `netlify/functions/sync-results.js` + bouton
**« ⚡ Synchroniser les résultats (API) »** dans la page admin.
Elle récupère les scores des matchs terminés sur **football-data.org** et les
enregistre automatiquement.

### À configurer (Netlify > Site settings > Environment variables)

```
FOOTBALL_API_KEY=ta_cle_football_data_org
FOOTBALL_COMPETITION=WC     (optionnel, défaut "WC")
```

La clé gratuite s'obtient sur https://www.football-data.org/client/register

### Correspondance des noms d'équipes

L'API renvoie les noms en anglais, ta base est en français : la table
`netlify/functions/_team-map.js` fait le lien. Si la synchro signale des équipes
« non mappées », ajoute la ligne correspondante dans ce fichier.

> ⚠️ La synchro associe un match par **groupe + paire d'équipes**. Si le tirage réel
> de la Coupe du Monde diffère des équipes saisies dans ta base (`seed.sql`), certains
> matchs ne seront pas associés : la synchro te le signalera sans rien écraser, et tu
> pourras toujours saisir ces résultats à la main.

---

## 4. Classement plus vivant

Page `classement.html` :
- **Podium top 3** visuel au-dessus du tableau.
- **Détail par joueur** : un clic sur un joueur (tableau ou podium) ouvre une
  fenêtre montrant, match par match terminé, le résultat réel, son prono et les
  points gagnés (badge vert = score exact, orange = bon résultat).

Fichiers : `public/classement.html`, `public/js/classement.js`, `public/css/style.css`.

---

## Récapitulatif des fichiers

| Fichier | Action |
|---------|--------|
| `netlify/functions/get-data.js` | modifié (admin requis) |
| `netlify/functions/get-details.js` | **nouveau** |
| `netlify/functions/sync-results.js` | **nouveau** |
| `netlify/functions/_team-map.js` | **nouveau** |
| `netlify/functions/_utils.js` | modifié (`buildDetails`) |
| `public/js/admin.js` | modifié (auth + bouton synchro) |
| `public/index.html` | modifié (bouton synchro) |
| `public/js/classement.js` | modifié (podium + détail) |
| `public/classement.html` | modifié (podium + modal) |
| `public/css/style.css` | modifié (styles podium/modal) |
| `supabase/security-patch.sql` | **nouveau** (optionnel) |

## Déploiement

1. Ajoute les variables d'environnement (point 3) dans Netlify.
2. (Optionnel) exécute `supabase/security-patch.sql` dans Supabase.
3. Redéploie le dossier `app/` sur Netlify (git push ou glisser-déposer).
4. Teste : page admin → mot de passe → « Recharger », puis « Synchroniser »,
   puis vérifie le podium et le clic sur un joueur sur la page classement.

## Variables d'environnement complètes (rappel)

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
FOOTBALL_API_KEY=...           (nouveau)
FOOTBALL_COMPETITION=WC        (nouveau, optionnel)
```
