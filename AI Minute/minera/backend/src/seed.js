// Demo seeder — populates a rich dataset for instant demoing.
import { db } from "./database/db.js";

const users = [
  ["alice@minera.ai", 8200], ["bob@minera.ai", 5400], ["carol@minera.ai", 3100], ["dave@minera.ai", 1500],
];
for (const [email, bal] of users) {
  const seed = Math.abs([...email].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,0)).toString(16);
  const addr = "0x" + (seed+"0000").slice(0,4) + "..." + (seed+"7f3a").slice(-4);
  const ex = db.prepare("SELECT 1 FROM users WHERE email=?").get(email);
  if (!ex) db.prepare("INSERT INTO users (address,email,balance,created) VALUES (?,?,?,?)").run(addr,email,bal,Date.now());
}
const op = db.prepare("SELECT address FROM users LIMIT 1").get()?.address;

if (db.prepare("SELECT COUNT(*) c FROM subnets").get().c === 0 && op) {
  db.prepare("INSERT INTO subnets (name,domain,operator,cut,calls,revenue,ts) VALUES (?,?,?,?,?,?,?)")
    .run("MedMind","Medical",op,0.25,128,1280,Date.now());
  db.prepare("INSERT INTO subnets (name,domain,operator,cut,calls,revenue,ts) VALUES (?,?,?,?,?,?,?)")
    .run("CodeForge","CodeGen",op,0.30,512,5120,Date.now());
}
if (db.prepare("SELECT COUNT(*) c FROM proposals").get().c === 0 && op) {
  db.prepare("INSERT INTO proposals (title,body,creator,yes,no,ends,ts) VALUES (?,?,?,?,?,?,?)")
    .run("Raise compute reward to 1.2 MINE/sec","Boost miner incentives for 30 days.",op,8200,1500,Date.now()+5*86400000,Date.now());
}
console.log("[seed] demo data ready");
process.exit(0);
