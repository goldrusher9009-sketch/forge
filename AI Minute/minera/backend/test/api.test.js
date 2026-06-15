import { test, before, after } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";

const PORT = 4099, BASE = `http://localhost:${PORT}`;
let srv;
const j = async (m, p, b, h={}) => {
  const r = await fetch(BASE + p, { method:m, headers:{ "Content-Type":"application/json", ...h }, body: b?JSON.stringify(b):undefined });
  return { status: r.status, body: await r.json().catch(()=>({})) };
};

before(async () => {
  srv = spawn("node", ["src/index.js"], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
  for (let i=0;i<30;i++){ try{ await fetch(BASE+"/health"); break; }catch{ await new Promise(r=>setTimeout(r,200)); } }
});
after(() => srv && srv.kill());

test("health", async () => { const r = await j("GET","/health"); assert.equal(r.status,200); assert.ok(r.body.ok); });
test("login creates user", async () => { const r = await j("POST","/api/auth/login",{email:`t${Date.now()}@x.io`}); assert.equal(r.status,200); assert.match(r.body.address,/^0x/); });
test("insight verify credits", async () => {
  const u = (await j("POST","/api/auth/login",{email:`i${Date.now()}@x.io`})).body;
  const r = await j("POST","/api/insights",{prompt:"p",response:"novel "+Date.now(),address:u.address});
  assert.equal(r.status,201); assert.equal(r.body.status,"verified"); assert.equal(r.body.reward,100);
});
test("bonds list", async () => { const r = await j("GET","/api/bonds"); assert.equal(r.status,200); assert.ok(Array.isArray(r.body)); });
test("market license splits", async () => {
  const r = await j("POST","/api/market/2/license",{licensee:"X"});
  assert.ok(r.status===200||r.status===400); // 400 if already licensed in a prior run
});
test("stats shape", async () => { const r = await j("GET","/api/stats"); assert.ok("totalBurned" in r.body); assert.ok("totalSupply" in r.body); });
test("subnet create+query", async () => {
  const u=(await j("POST","/api/auth/login",{email:`s${Date.now()}@x.io`})).body;
  const s=(await j("POST","/api/subnets",{name:"T",domain:"Med",operator:u.address,cut:0.25})).body;
  const q=await j("POST",`/api/subnets/${s.id}/query`,{prompt:"hi"});
  assert.equal(q.status,200); assert.equal(q.body.fee,10);
});
test("api key issue + metered inference", async () => {
  const u=(await j("POST","/api/auth/login",{email:`k${Date.now()}@x.io`})).body;
  const k=(await j("POST",`/api/keys/${u.address}`)).body.key;
  const r=await j("POST","/v1/chat/completions",{messages:[{role:"user",content:"hi"}]},{"x-api-key":k});
  assert.equal(r.status,200); assert.ok(r.body.choices);
});
test("chain status db-only", async () => { const r = await j("GET","/api/chain/status"); assert.equal(r.body.active,false); });

test("insight publishes knowledge asset (UAL)", async () => {
  const u=(await j("POST","/api/auth/login",{email:`ka${Date.now()}@x.io`})).body;
  const r=await j("POST","/api/insights",{prompt:"p",response:"novel ka "+Date.now(),address:u.address});
  assert.equal(r.body.status,"verified"); assert.match(r.body.ual||"", /did:dkg:minera/);
});
test("license distributes royalties", async () => {
  const u=(await j("POST","/api/auth/login",{email:`lic${Date.now()}@x.io`})).body;
  const ins=(await j("POST","/api/insights",{prompt:"p",response:"novel lic "+Date.now(),address:u.address})).body;
  const r=await j("POST",`/api/market/${ins.id}/license`,{licensee:"X",submitterAddress:u.address});
  assert.equal(r.status,200); assert.ok(r.body.distributed);
  const roy=await j("GET",`/api/market/${ins.id}/royalties`);
  assert.ok(roy.body.length>0);
});
test("burn cycle runs", async () => {
  const r=await j("POST","/api/burn/run");
  assert.ok("burned" in r.body);
});
test("referral records + rewards", async () => {
  const a=(await j("POST","/api/auth/login",{email:`refA${Date.now()}@x.io`})).body;
  const bEmail=`refB${Date.now()}@x.io`;
  await j("POST","/api/auth/login",{email:bEmail,ref:a.address});
  const bAddr=(await j("POST","/api/auth/login",{email:bEmail})).body.address;
  await j("POST","/api/insights",{prompt:"p",response:"novel ref "+Date.now(),address:bAddr});
  const rr=await j("GET",`/api/referrals/${a.address}`);
  assert.ok(rr.body.count>=1);
});
test("staking accrues and unstakes", async () => {
  const u=(await j("POST","/api/auth/login",{email:`st${Date.now()}@x.io`})).body;
  await j("POST",`/api/staking/${u.address}`,{amount:100});
  const list=(await j("GET",`/api/staking/${u.address}`)).body;
  assert.ok(list.length>=1);
  const un=await j("POST",`/api/staking/${u.address}/unstake/${list[0].id}`);
  assert.ok(un.body.returned>=100);
});

test("achievements awarded", async () => {
  const u=(await j("POST","/api/auth/login",{email:`ach${Date.now()}@x.io`})).body;
  await j("POST","/api/insights",{prompt:"p",response:"novel ach "+Date.now(),address:u.address});
  const a=await j("GET",`/api/achievements/${u.address}`);
  assert.ok(a.body.some(x=>x.code==="first_insight"));
});
test("global search finds bonds", async () => {
  const r=await j("GET","/api/search?q=plastic");
  assert.ok(Array.isArray(r.body.results));
});

test("price feed returns price + history", async () => {
  const r=await j("GET","/api/price");
  assert.ok(r.body.price>0); assert.ok(Array.isArray(r.body.history));
});
test("presence heartbeat + count", async () => {
  const u=(await j("POST","/api/auth/login",{email:`pr${Date.now()}@x.io`})).body;
  await j("POST","/api/presence/heartbeat",{address:u.address});
  const p=await j("GET","/api/presence");
  assert.ok(p.body.online>=1); assert.ok(p.body.total>=p.body.online);
});

test("E2E full lifecycle: signup→mine→license→stake→govern→cash out", async () => {
  // signup
  const u = (await j("POST","/api/auth/login",{email:`e2e${Date.now()}@x.io`})).body;
  let bal = u.balance; assert.ok(bal > 0);
  // swarm inference
  const gen = await j("POST","/api/generate",{prompt:"e2e prompt"});
  assert.ok(gen.body.response);
  // submit + verify (credits +100, mints KA)
  const ins = (await j("POST","/api/insights",{prompt:"e2e",response:"novel e2e "+Date.now(),address:u.address})).body;
  assert.equal(ins.status,"verified"); assert.match(ins.ual||"",/did:dkg/);
  let after = (await j("GET",`/api/users/${u.address}`)).body.balance;
  assert.ok(after >= bal + 100); bal = after;
  // license that insight -> submitter royalty credited
  const lic = await j("POST",`/api/market/${ins.id}/license`,{licensee:"Buyer",submitterAddress:u.address});
  assert.ok(lic.body.distributed);
  after = (await j("GET",`/api/users/${u.address}`)).body.balance;
  assert.ok(after > bal); bal = after;
  // stake 100 -> balance drops
  await j("POST",`/api/staking/${u.address}`,{amount:100});
  after = (await j("GET",`/api/users/${u.address}`)).body.balance;
  assert.ok(after <= bal); bal = after;
  // governance proposal + vote
  const p = (await j("POST","/api/governance",{title:"e2e prop",creator:u.address})).body;
  const v = await j("POST",`/api/governance/${p.id}/vote`,{address:u.address,side:"yes"});
  assert.ok(v.body.yes > 0);
  // cash out (withdraw)
  const w = await j("POST",`/api/users/${u.address}/withdraw`,{amount:50});
  assert.equal(w.body.withdrew,50);
  // achievements earned along the way
  const ach = (await j("GET",`/api/achievements/${u.address}`)).body;
  assert.ok(ach.some(a=>a.code==="first_insight"));
});

test("profile get + update", async () => {
  const u=(await j("POST","/api/auth/login",{email:`pf${Date.now()}@x.io`})).body;
  await j("PUT",`/api/users/${u.address}/profile`,{display_name:"Miner Mike",bio:"gm"});
  const p=await j("GET",`/api/users/${u.address}/profile`);
  assert.equal(p.body.display_name,"Miner Mike");
});
test("activity logs events", async () => {
  const u=(await j("POST","/api/auth/login",{email:`av${Date.now()}@x.io`})).body;
  await j("POST","/api/insights",{prompt:"p",response:"novel av "+Date.now(),address:u.address});
  const a=await j("GET","/api/activity?type=insight");
  assert.ok(a.body.length>0);
});
test("admin health", async () => {
  const r=await j("GET","/api/admin/health");
  assert.ok(r.body.uptimeSec>=0); assert.ok(r.body.swarm); assert.ok(r.body.counts);
});

test("openapi docs served", async () => {
  const r=await j("GET","/api/docs/openapi.json");
  assert.ok(r.body.openapi); assert.ok(r.body.paths["/api/insights"]);
});
test("digest network summary", async () => {
  const r=await j("GET","/api/digest");
  assert.equal(r.body.window,"24h"); assert.ok("insights" in r.body);
});
test("tx pagination shape", async () => {
  const u=(await j("POST","/api/auth/login",{email:`pg${Date.now()}@x.io`})).body;
  await j("POST","/api/insights",{prompt:"p",response:"novel pg "+Date.now(),address:u.address});
  const r=await j("GET",`/api/users/${u.address}/transactions?limit=10`);
  assert.ok(Array.isArray(r.body.rows)); assert.ok("total" in r.body);
});
test("chain events endpoint", async () => {
  const r=await j("GET","/api/chain/events");
  assert.ok(Array.isArray(r.body));
});

test("treasury transparency", async () => {
  const r=await j("GET","/api/treasury");
  assert.ok(r.body.maxSupply>0); assert.ok("burned" in r.body); assert.ok(Array.isArray(r.body.bySource));
});
test("notif prefs get + update", async () => {
  const u=(await j("POST","/api/auth/login",{email:`np${Date.now()}@x.io`})).body;
  await j("PUT",`/api/prefs/${u.address}`,{license:false});
  const p=await j("GET",`/api/prefs/${u.address}`);
  assert.equal(p.body.license,0);
});

test("multisig: propose, 2 approvals execute burn", async () => {
  const id = (await j("POST","/api/treasury-actions",{kind:"burn",amount:500,threshold:2,proposer:"0xa"})).body.id;
  let r = await j("POST",`/api/treasury-actions/${id}/approve`,{signer:"0xsig1"});
  assert.equal(r.body.executed,false);
  r = await j("POST",`/api/treasury-actions/${id}/approve`,{signer:"0xsig2"});
  assert.equal(r.body.executed,true);
});

test("metrics endpoint", async () => {
  const r=await j("GET","/metrics?format=json");
  assert.ok("requests_total" in r.body); assert.ok(r.body.requests_total>0);
});
test("webhook register + list + delete", async () => {
  const u=(await j("POST","/api/auth/login",{email:`wh${Date.now()}@x.io`})).body;
  const id=(await j("POST",`/api/webhooks/${u.address}`,{url:"https://example.com/hook"})).body.id;
  let list=(await j("GET",`/api/webhooks/${u.address}`)).body;
  assert.ok(list.length>=1);
  await j("DELETE",`/api/webhooks/${u.address}/${id}`);
  list=(await j("GET",`/api/webhooks/${u.address}`)).body;
  assert.equal(list.length,0);
});

test("faucet claim then cooldown", async () => {
  const u=(await j("POST","/api/auth/login",{email:`fc${Date.now()}@x.io`})).body;
  const c1=await j("POST",`/api/faucet/${u.address}/claim`);
  assert.equal(c1.body.claimed,25);
  const c2=await j("POST",`/api/faucet/${u.address}/claim`);
  assert.equal(c2.status,429);
});
test("backup snapshot has tables", async () => {
  const r=await j("GET","/api/admin/backup");
  assert.ok(r.body.tables); assert.ok(r.body.tables.users);
});
