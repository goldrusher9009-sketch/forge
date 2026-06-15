-- Minera SQLite schema (single-file DB, no server needed)
CREATE TABLE IF NOT EXISTS insights (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt    TEXT NOT NULL,
  response  TEXT,
  status    TEXT NOT NULL DEFAULT 'pending',   -- pending|verified|rejected|licensed
  reward    INTEGER NOT NULL DEFAULT 0,
  confidence REAL DEFAULT 0,
  ts        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bonds (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT NOT NULL DEFAULT 'GENERAL',
  title       TEXT NOT NULL,
  reward      INTEGER NOT NULL,
  days_left   INTEGER NOT NULL DEFAULT 30,
  miners      INTEGER NOT NULL DEFAULT 0,
  submissions INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS data_uploads (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  cid       TEXT NOT NULL,
  ts        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  address   TEXT PRIMARY KEY,
  email     TEXT,
  balance   REAL NOT NULL DEFAULT 0,
  created   INTEGER NOT NULL
);

-- ===== schema v2 =====
CREATE TABLE IF NOT EXISTS transactions (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  type    TEXT NOT NULL,            -- mining|insight|license|predict|bond|withdraw|stake|burn-fee
  amount  REAL NOT NULL,           -- +credit / -debit
  note    TEXT,
  ts      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bond_submissions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  bond_id   INTEGER NOT NULL,
  address   TEXT NOT NULL,
  insight   TEXT NOT NULL,
  ts        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_id INTEGER NOT NULL,
  address   TEXT NOT NULL,
  side      TEXT NOT NULL,          -- yes|no
  stake     REAL NOT NULL,
  settled   INTEGER NOT NULL DEFAULT 0,
  payout    REAL DEFAULT 0,
  ts        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_id INTEGER NOT NULL,
  licensee  TEXT NOT NULL,
  amount    REAL NOT NULL,
  ts        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS burn_events (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  source TEXT NOT NULL,
  ts     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS protocol (
  k TEXT PRIMARY KEY,
  v REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  text    TEXT NOT NULL,
  read    INTEGER NOT NULL DEFAULT 0,
  ts      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subnets (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  domain    TEXT NOT NULL,
  operator  TEXT,
  cut       REAL NOT NULL DEFAULT 0.25,   -- operator share 20-30%
  calls     INTEGER NOT NULL DEFAULT 0,
  revenue   REAL NOT NULL DEFAULT 0,
  ts        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  key     TEXT NOT NULL UNIQUE,
  calls   INTEGER NOT NULL DEFAULT 0,
  spent   REAL NOT NULL DEFAULT 0,
  ts      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS proposals (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  title   TEXT NOT NULL,
  body    TEXT,
  creator TEXT,
  status  TEXT NOT NULL DEFAULT 'open',  -- open|passed|rejected
  yes     REAL NOT NULL DEFAULT 0,
  no      REAL NOT NULL DEFAULT 0,
  ends    INTEGER NOT NULL,
  ts      INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS votes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  address     TEXT NOT NULL,
  side        TEXT NOT NULL,
  weight      REAL NOT NULL,
  ts          INTEGER NOT NULL,
  UNIQUE(proposal_id, address)
);
CREATE TABLE IF NOT EXISTS stakes (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  address  TEXT NOT NULL,
  amount   REAL NOT NULL,
  apr      REAL NOT NULL DEFAULT 0.18,
  start_ts INTEGER NOT NULL,
  active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS knowledge_assets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_id INTEGER NOT NULL,
  ual        TEXT NOT NULL,
  novel      INTEGER NOT NULL DEFAULT 1,
  contributors TEXT,
  ts         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS royalty_payouts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_id INTEGER NOT NULL,
  address    TEXT NOT NULL,
  role       TEXT NOT NULL,
  amount     REAL NOT NULL,
  ts         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer    TEXT NOT NULL,
  referee     TEXT NOT NULL UNIQUE,
  rewarded    INTEGER NOT NULL DEFAULT 0,
  ts          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  code    TEXT NOT NULL,
  ts      INTEGER NOT NULL,
  UNIQUE(address, code)
);

CREATE TABLE IF NOT EXISTS activity (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  type  TEXT NOT NULL,
  data  TEXT,
  ts    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chain_events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL,
  args    TEXT,
  tx_hash TEXT,
  block   INTEGER,
  ts      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notif_prefs (
  address TEXT PRIMARY KEY,
  insight INTEGER NOT NULL DEFAULT 1,
  license INTEGER NOT NULL DEFAULT 1,
  referral INTEGER NOT NULL DEFAULT 1,
  achievement INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS treasury_actions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  kind      TEXT NOT NULL,        -- burn|grant|param
  amount    REAL NOT NULL DEFAULT 0,
  detail    TEXT,
  proposer  TEXT,
  status    TEXT NOT NULL DEFAULT 'pending',  -- pending|executed|cancelled
  threshold INTEGER NOT NULL DEFAULT 2,
  ts        INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS treasury_approvals (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  action_id INTEGER NOT NULL,
  signer    TEXT NOT NULL,
  ts        INTEGER NOT NULL,
  UNIQUE(action_id, signer)
);

CREATE TABLE IF NOT EXISTS webhooks (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  url     TEXT NOT NULL,
  events  TEXT NOT NULL DEFAULT '*',
  active  INTEGER NOT NULL DEFAULT 1,
  ts      INTEGER NOT NULL
);
