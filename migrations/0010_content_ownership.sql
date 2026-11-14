-- 0010 : propriété du contenu publié (jeton de suppression renvoyé à l'auteur,
-- jamais exposé dans les listes) + modération (masquage) + signalements.

ALTER TABLE needs ADD COLUMN owner_token TEXT;
ALTER TABLE needs ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;

ALTER TABLE events ADD COLUMN owner_token TEXT;
ALTER TABLE events ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;

ALTER TABLE tools ADD COLUMN owner_token TEXT;
ALTER TABLE tools ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('need', 'event', 'tool')),
  content_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports (created_at);
