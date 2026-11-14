-- 0009 : ajoute le tier « visibility » (Pack Visibilité 9 €/mois) au CHECK,
-- absent du schéma initial 0001. SQLite ne permet pas de modifier une contrainte
-- CHECK : on reconstruit la table en conservant les données.

ALTER TABLE businesses RENAME TO businesses_0001;

CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('alimentation', 'artisan', 'horeca', 'distributeur')),
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'verified', 'visibility', 'pro')),
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  town TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  phone TEXT,
  website TEXT,
  hours TEXT,
  bce TEXT,
  news TEXT,
  subcategory TEXT NOT NULL DEFAULT '',
  paid_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO businesses (
  id, name, category, tier, description, address, town, postal_code,
  lat, lng, phone, website, hours, bce, news, subcategory, paid_until, created_at
)
SELECT
  id, name, category, tier, description, address, town, postal_code,
  lat, lng, phone, website, hours, bce, news, subcategory, paid_until, created_at
FROM businesses_0001;

DROP TABLE businesses_0001;

CREATE INDEX IF NOT EXISTS idx_businesses_lat ON businesses (lat);
CREATE INDEX IF NOT EXISTS idx_businesses_lng ON businesses (lng);
