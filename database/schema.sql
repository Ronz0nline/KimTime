-- ============================================================================
-- KinTime: Digital Caregiver Time-Bank
-- Schema Specification V2.4 (SQLite 3.x / PostgreSQL compatible)
-- Core Domain: Social Care Infrastructure (Append-Only Double-Entry Care Ledger)
-- ============================================================================

-- 1. Users & Caregiver Personas
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('caregiver', 'volunteer', 'recipient')),
  role_label TEXT,
  cluster TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  password_hash TEXT,
  aadhaar_number TEXT,
  kyc_status TEXT DEFAULT 'verified_aadhaar',
  pledge_agreed INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Two-Tier Care Requests & Exchange Board
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('tier-1', 'tier-2')),
  tier_label TEXT NOT NULL,
  hours REAL NOT NULL CHECK(hours > 0),
  requester_id TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  cluster TEXT NOT NULL,
  description TEXT NOT NULL,
  details_json TEXT, -- JSON array of criteria
  status TEXT NOT NULL CHECK(status IN ('open', 'claimed', 'completed', 'cancelled')) DEFAULT 'open',
  claimed_by_id TEXT,
  claimed_by_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id)
);

-- 3. Append-Only Double-Entry Care Ledger (No Mutable Balances)
-- Rule 8: Balances are NEVER stored as user.balance += 2.
-- Every hour credit must have a corresponding debit from escrow or counterparty.
CREATE TABLE IF NOT EXISTS ledger_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK(entry_type IN ('DEBIT', 'CREDIT')),
  amount REAL NOT NULL CHECK(amount >= 0),
  task_id TEXT,
  tier TEXT,
  description TEXT NOT NULL,
  counterparty TEXT,
  status TEXT NOT NULL CHECK(status IN ('settled', 'escrow')) DEFAULT 'settled',
  cryptographic_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 4. Good Samaritan Mutual Waivers (Rule 7: Non-Clinical Liability Release)
CREATE TABLE IF NOT EXISTS waivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  signer_id TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  terms_version TEXT NOT NULL DEFAULT 'V2.4',
  scope_acknowledged INTEGER NOT NULL CHECK(scope_acknowledged = 1),
  signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (signer_id) REFERENCES users(id)
);

-- 5. Anti-Accident SOS Emergency Respite Logs (Rule 6 & 9)
CREATE TABLE IF NOT EXISTS sos_dispatches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_code TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  cluster TEXT NOT NULL,
  overdraft_hours_drawn REAL NOT NULL DEFAULT 3.0,
  broadcast_recipients_count INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL CHECK(status IN ('primed', 'dispatched', 'aborted', 'resolved')),
  dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. Computed Double-Entry Balance View
-- Rule 8 & 9: Balances computed purely via SQL sum aggregation
CREATE VIEW IF NOT EXISTS vw_user_balances AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.cluster,
  COALESCE(SUM(CASE 
    WHEN l.entry_type = 'CREDIT' AND l.status = 'settled' THEN l.amount
    WHEN l.entry_type = 'DEBIT' AND l.status = 'settled' THEN -l.amount
    ELSE 0.0
  END), 0.0) AS settled_balance,
  COALESCE(SUM(CASE 
    WHEN l.entry_type = 'DEBIT' AND l.status = 'escrow' THEN l.amount
    ELSE 0.0
  END), 0.0) AS escrow_locked_balance,
  3.0 AS overdraft_grace_buffer,
  (COALESCE(SUM(CASE 
    WHEN l.entry_type = 'CREDIT' AND l.status = 'settled' THEN l.amount
    WHEN l.entry_type = 'DEBIT' AND l.status = 'settled' THEN -l.amount
    ELSE 0.0
  END), 0.0) + 3.0 - COALESCE(SUM(CASE 
    WHEN l.entry_type = 'DEBIT' AND l.status = 'escrow' THEN l.amount
    ELSE 0.0
  END), 0.0)) AS effective_available_hours
FROM users u
LEFT JOIN ledger_entries l ON u.id = l.user_id
GROUP BY u.id, u.name, u.cluster;
