import { Router } from "express";
import { db, tx } from "../database/db.js";
const r = Router();

r.post("/login", (req, res) => {
  const { email, ref } = req.body || {};
  if (!email) return res.status(400).json({ error: "email required" });
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    const seed = Math.abs([...email].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)).toString(16);
    const address = "0x" + (seed + "0000").slice(0, 4) + "..." + (seed + "7f3a").slice(-4);
    db.prepare("INSERT INTO users (address,email,balance,created) VALUES (?,?,?,?)")
      .run(address, email, 1234.56, Date.now());
    tx(address, "grant", 1234.56, "welcome balance");
    // record referral (referrer must exist, no self-ref)
    if (ref && ref !== address) {
      const refUser = db.prepare("SELECT 1 FROM users WHERE address = ?").get(ref);
      if (refUser) {
        try { db.prepare("INSERT INTO referrals (referrer,referee,ts) VALUES (?,?,?)").run(ref, address, Date.now()); } catch {}
      }
    }
    user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  }
  res.json({ address: user.address, email: user.email, balance: user.balance });
});
export default r;
