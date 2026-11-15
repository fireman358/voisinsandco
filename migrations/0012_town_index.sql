-- Accélère les pages par commune (WHERE town = ?) et la liste des villes du sitemap.
CREATE INDEX IF NOT EXISTS idx_businesses_town ON businesses (town);
