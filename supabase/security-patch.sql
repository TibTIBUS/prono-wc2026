-- Renforcement de sécurité (optionnel mais recommandé).
--
-- Le code de l'appli n'accède à Supabase que côté serveur via la service_role
-- key, qui ignore le RLS. La page publique ne lit jamais Supabase directement :
-- elle passe par les fonctions Netlify. Sécuriser la fonction get-data suffit
-- donc en pratique.
--
-- Ce patch ajoute une protection en profondeur : il retire l'autorisation de
-- lecture publique sur la table des pronos, au cas où quelqu'un connaîtrait
-- l'URL Supabase + la clé "anon". Les fonctions Netlify continueront de
-- fonctionner (elles utilisent la service_role key).
--
-- À exécuter dans Supabase > SQL Editor.

drop policy if exists "Public read predictions" on predictions;

-- (On garde la lecture publique sur employees, matches et results :
--  ce sont des infos non sensibles, affichées sur la page classement.)
