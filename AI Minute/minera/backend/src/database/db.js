// SQLite layer. Single file at minera/backend/data/minera.db — no DB server needed.
import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "data");
mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(join(DATA_DIR, "minera.db"));
db.pragma("journal_mode = WAL");
db.exec(readFileSync(join(__dirname, "schema.sql"), "utf8"));

// --- defensive migrations (add columns if missing) ---
function addColumn(table, col, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
addColumn("bonds", "creator", "TEXT");
addColumn("bonds", "status", "TEXT DEFAULT 'open'");
addColumn("bonds", "winner", "TEXT");
addColumn("users", "display_name", "TEXT");
addColumn("users", "bio", "TEXT");
addColumn("users", "avatar_seed", "TEXT");
addColumn("api_keys", "day_calls", "INTEGER DEFAULT 0");
addColumn("api_keys", "day_start", "INTEGER DEFAULT 0");
addColumn("users", "last_faucet", "INTEGER DEFAULT 0");

// --- protocol counters ---
function setIfMissing(k, v) {
  const row = db.prepare("SELECT v FROM protocol WHERE k = ?").get(k);
  if (!row) db.prepare("INSERT INTO protocol (k,v) VALUES (?,?)").run(k, v);
}
setIfMissing("total_supply", 250_000_000);   // illustrative circulating
setIfMissing("total_burned", 0);
setIfMissing("treasury_usd", 0);
setIfMissing("nodes_online", 3847);

// --- seed once if empty ---
const count = db.prepare("SELECT COUNT(*) c FROM bonds").get().c;
if (count === 0) {
  const now = Date.now();
  const ii = db.prepare("INSERT INTO insights (prompt,status,reward,ts) VALUES (?,?,?,?)");
  ii.run("Novel enzyme pathway for PET breakdown", "verified", 50, now - 8e6);
  ii.run("Climate-resilient wheat gene cluster", "pending", 0, now - 4e6);
  ii.run("Edge-device compression algorithm", "verified", 10, now - 1e6);
  const ib = db.prepare("INSERT INTO bonds (category,title,reward,days_left,miners,submissions,status) VALUES (?,?,?,?,?,?, 'open')");
  ib.run("PHARMA", "Inhibitor for Alzheimer's tau-protein aggregation", 250000, 67, 12, 3);
  ib.run("ENERGY", "Room-temperature superconductor candidate", 1000000, 134, 47, 12);
  ib.run("MATERIALS", "Biodegradable plastic, high tensile strength", 50000, 23, 8, 1);
  console.log("[db] seeded initial data");
}

console.log("[db] SQLite ready at data/minera.db (schema v2)");

// --- shared helpers used across routes ---
export function getUser(address) {
  return db.prepare("SELECT * FROM users WHERE address = ?").get(address);
}
export function tx(address, type, amount, note = "") {
  db.prepare("INSERT INTO transactions (address,type,amount,note,ts) VALUES (?,?,?,?,?)")
    .run(address, type, amount, note, Date.now());
}
export function credit(address, amount, type, note = "") {
  const u = getUser(address);
  if (!u) return null;
  const next = u.balance + amount;
  db.prepare("UPDATE users SET balance = ? WHERE address = ?").run(next, address);
  tx(address, type, amount, note);
  return next;
}
export function debit(address, amount, type, note = "") {
  const u = getUser(address);
  if (!u || u.balance < amount) return null;
  const next = u.balance - amount;
  db.prepare("UPDATE users SET balance = ? WHERE address = ?").run(next, address);
  tx(address, type, -amount, note);
  return next;
}
export function addBurn(amount, source) {
  db.prepare("INSERT INTO burn_events (amount,source,ts) VALUES (?,?,?)").run(amount, source, Date.now());
  db.prepare("UPDATE protocol SET v = v + ? WHERE k = 'total_burned'").run(amount);
  db.prepare("UPDATE protocol SET v = v - ? WHERE k = 'total_supply'").run(amount);
}

export function notifyUser(address, text, category) {
  if (!address) return;
  if (category) {
    const p = db.prepare("SELECT * FROM notif_prefs WHERE address = ?").get(address);
    if (p && p[category] === 0) return; // user muted this category
  }
  db.prepare("INSERT INTO notifications (address,text,ts) VALUES (?,?,?)").run(address, text, Date.now());
}

export function rewardReferrer(refereeAddress, bonus = 50) {
  const ref = db.prepare("SELECT * FROM referrals WHERE referee = ? AND rewarded = 0").get(refereeAddress);
  if (!ref) return null;
  db.prepare("UPDATE referrals SET rewarded = 1 WHERE id = ?").run(ref.id);
  const next = credit(ref.referrer, bonus, "referral", `referral bonus: ${refereeAddress}`);
  notifyUser(ref.referrer, `Referral bonus — your invite earned you +${bonus} MINE`, "referral");
  award(ref.referrer, "referrer");
  return { referrer: ref.referrer, bonus, balance: next };
}

const BADGES = {
  first_insight: "🧠 First Discovery",
  first_license: "💰 First License",
  rich_1k: "💎 1,000 MINE Club",
  staker: "🔒 Staker",
  referrer: "🎁 Recruiter",
};
export function award(address, code) {
  if (!address || !BADGES[code]) return false;
  try {
    db.prepare("INSERT INTO achievements (address,code,ts) VALUES (?,?,?)").run(address, code, Date.now());
    notifyUser(address, `Achievement unlocked — ${BADGES[code]}`, "achievement");
    return true;
  } catch { return false; } // already has it
}
export function badgeName(code){ return BADGES[code] || code; }

export function audit(actor, action, detail = "") {
  try { db.prepare("INSERT INTO audit_log (actor,action,detail,ts) VALUES (?,?,?,?)").run(actor || null, action, detail, Date.now()); } catch {}
}
