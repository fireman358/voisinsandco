-- One-shot : supprime les fiches OSM de l'ancien seed (POI hors Wallonie :
-- Aix-la-Chapelle, Lille, Ixelles, etc.) qui ne sont plus dans le seed actuel.
-- Les fiches revendiquées sont conservées. Le seed qui suit ce commit
-- réinsère les 22 076 sociétés wallonnes à jour.
DELETE FROM businesses
WHERE id LIKE 'osm-%'
  AND id NOT IN (SELECT business_id FROM claims);
