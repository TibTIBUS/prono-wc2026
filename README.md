# Prono WC 2026 — V5 Netlify + Supabase

## Pages
- `/` ou `/admin` : administration.
- `/classement.html` ou `/classement` : page publique à donner aux salariés.

## Classement public
Colonnes :
- Rang
- Salarié
- Total
- Scores exacts
- Bons résultats

## Règlement
- Score exact : 5 points
- Bon résultat sans score exact : 2 points
- Mauvais résultat : 0 point
- Match sans résultat : ignoré

## Installation Supabase
1. Créer un projet Supabase.
2. Ouvrir SQL Editor.
3. Exécuter `supabase/schema.sql`.
4. Exécuter `supabase/seed.sql`.
5. Copier `Project URL` et `service_role key`.

## Installation Netlify
Variables d’environnement à créer :
```text
SUPABASE_URL=ton_url_supabase
SUPABASE_SERVICE_ROLE_KEY=ta_service_role_key
ADMIN_PASSWORD=ton_mot_de_passe_admin
```

## Test local
```bash
npm install
npx netlify dev
```

Puis :
```text
http://localhost:8888
http://localhost:8888/classement.html
```

## Import V3
Dans la page admin :
1. Entre le mot de passe admin.
2. Sélectionne le JSON exporté depuis la V3.
3. Clique sur `Importer vers Supabase`.
