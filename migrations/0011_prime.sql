-- 0011 : « mise en avant exclusive de secteur » (+5 €/mois, priorité au-dessus du Pro).
ALTER TABLE businesses ADD COLUMN prime INTEGER NOT NULL DEFAULT 0;
