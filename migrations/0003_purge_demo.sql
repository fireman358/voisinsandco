-- Retire les fiches de démonstration fictives (ids « b-… ») restées d'un seed antérieur,
-- ainsi que les bons plans qui s'y réfèrent. Les sociétés réelles OpenStreetMap (ids « osm-… »)
-- et le contenu communautaire (agenda, mur, boîte à outils) sont conservés.
DELETE FROM deals WHERE business_id LIKE 'b-%';
DELETE FROM businesses WHERE id LIKE 'b-%';
