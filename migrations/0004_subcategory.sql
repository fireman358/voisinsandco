-- Sous-catégorie d'activité (valeur OpenStreetMap : shop/craft/amenity)
ALTER TABLE businesses ADD COLUMN subcategory TEXT NOT NULL DEFAULT '';
