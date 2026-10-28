PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS orders (
 order_id TEXT PRIMARY KEY, email TEXT NOT NULL, product_id TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('approved','refunded','chargeback')),
 code_hash TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_email ON orders(email,status);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY,email TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS plans (email TEXT PRIMARY KEY,data TEXT NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS webhook_events (event_id TEXT PRIMARY KEY,processed_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
