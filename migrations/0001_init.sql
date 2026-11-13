-- Voisins & Co — schéma Cloudflare D1 (SQLite)
-- Appliquer en local :  wrangler d1 execute voisins-and-co-db --local --file=schema.sql
-- Appliquer en prod :   wrangler d1 execute voisins-and-co-db --remote --file=schema.sql
-- (ou via les migrations : wrangler d1 migrations apply voisins-and-co-db --remote)
-- Le seed est dans seed.sql (voir migrations/0002_seed.sql).

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('alimentation', 'artisan', 'horeca', 'distributeur')),
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'verified', 'pro')),
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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_businesses_lat ON businesses (lat);
CREATE INDEX IF NOT EXISTS idx_businesses_lng ON businesses (lng);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL,
  original_price REAL,
  quantity INTEGER NOT NULL DEFAULT 1,
  remaining INTEGER NOT NULL DEFAULT 1,
  pickup TEXT NOT NULL DEFAULT '',
  town TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_deals_lat ON deals (lat);
CREATE INDEX IF NOT EXISTS idx_deals_lng ON deals (lng);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organizer TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  town TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_date ON events (date);
CREATE INDEX IF NOT EXISTS idx_events_lat ON events (lat);
CREATE INDEX IF NOT EXISTS idx_events_lng ON events (lng);

CREATE TABLE IF NOT EXISTS needs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL CHECK (kind IN ('entraide', 'artisan')),
  artisan_category TEXT,
  author TEXT NOT NULL DEFAULT 'Voisin',
  town TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'taken')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_needs_lat ON needs (lat);
CREATE INDEX IF NOT EXISTS idx_needs_lng ON needs (lng);

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  town TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tools_lat ON tools (lat);
CREATE INDEX IF NOT EXISTS idx_tools_lng ON tools (lng);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reservations_deal ON reservations (deal_id);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loan_requests (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  requester TEXT NOT NULL DEFAULT '',
  dates TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
