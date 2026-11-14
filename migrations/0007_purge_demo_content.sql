-- Purge unique du contenu de démonstration fictif (agenda, mur, boîte à outils,
-- bons plans). Le contenu publié par les utilisateurs après cette migration
-- n'est jamais purgé : les seeds suivants n'insèrent plus rien dans ces tables.
DELETE FROM deals;
DELETE FROM events;
DELETE FROM needs;
DELETE FROM tools;
