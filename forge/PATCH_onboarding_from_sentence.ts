// ── ONE-SENTENCE ONBOARDING ───────────────────────────────────────────────
// The "intoxicating first 60 seconds": user types one free-text sentence,
// the LLM parses it into structured onboarding fields. Time-to-value hook.
// POST body: { sentence: string, confirm?: boolean }
//  - confirm falsy → returns the parsed plan for the user to review (fast, no DB writes)
//  - confirm true  → provisions the workspace (agents, credits, nightly run) and returns subdomain
app.post('/api/onboarding/from-sentence', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { sentence, confirm } = req.body || {};
  if (!sentence || typeof sentence !== 'string' || sentence.trim().length < 4) {
    res.status(400).json({ success: false, error: 'Describe your business in one sentence.' }); return;
  }

  const validTypes = Object.keys(BIZ_AGENT_TEMPLATES);
  let parsed: any;
  try {
    const llm = getUserLLMKey(userId);
    if (!llm || !llm.apiKey) { res.status(400).json({ success: false, error: 'NO_LLM_KEY', message: 'Add an LLM API key in settings to use one-sentence setup.' }); return; }
    const sys = [
      'You convert one sentence about a business into a strict JSON object for onboarding.',
      'Return ONLY JSON, no prose, no code fences. Schema:',
      '{ "businessName": string, "businessType": one of ' + JSON.stringify(validTypes) + ' (best fit, else "other"),',
      '  "cities": string[] (locations mentioned, else []), "services": string[] (3-6 core services/products, infer if unstated),',
      '  "pain": string (the main problem this owner likely wants solved, one short phrase) }',
    ].join(' ');
    const out = await callLLM(llm.provider, llm.apiKey, llm.model, [
      { role: 'system', content: sys },
      { role: 'user', content: sentence.trim() },
    ]);
    let txt = (out.content || '').trim().replace(/^```(json)?/i, '').replace(/```$/,'').trim();
    parsed = JSON.parse(txt);
  } catch (e: any) {
    res.status(502).json({ success: false, error: 'PARSE_FAILED', message: 'Could not understand that sentence — try rephrasing, or use the full form.' }); return;
  }

  // Normalize + guard
  const businessType = validTypes.includes(parsed.businessType) ? parsed.businessType : 'other';
  const businessName = (parsed.businessName || 'My Business').toString().slice(0, 80);
  const cities = Array.isArray(parsed.cities) ? parsed.cities.slice(0, 20).map((c: any) => String(c).slice(0,60)) : [];
  const services = Array.isArray(parsed.services) ? parsed.services.slice(0, 10).map((s: any) => String(s).slice(0,80)) : [];
  const pain = (parsed.pain || '').toString().slice(0, 240);
  const previewAgents = (BIZ_AGENT_TEMPLATES[businessType] || BIZ_AGENT_TEMPLATES.other || []).map(a => ({ role: a.role, icon: a.icon }));

  // Preview only — let the user confirm before any DB writes
  if (!confirm) {
    res.json({ success: true, data: { preview: true, parsed: { businessName, businessType, cities, services, pain }, agents: previewAgents, agentCount: previewAgents.length } });
    return;
  }

  // Confirmed → provision (mirrors the structured /api/onboarding logic)
  const subdomain = businessName.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,30) + '-' + userId.slice(0,6);
  db.prepare(`UPDATE users SET business_name=?,business_type=?,business_cities=?,business_services=?,business_pain=?,onboarding_complete=1,subdomain=? WHERE id=?`)
    .run(businessName, businessType, JSON.stringify(cities), JSON.stringify(services), pain, subdomain, userId);
  db.prepare(`INSERT OR IGNORE INTO subscriptions (id,user_id,plan,tokens_limit,tokens_used) VALUES (?,?,'starter',5000000,0)`).run(`sub_${uuidv4()}`, userId);

  const agents = BIZ_AGENT_TEMPLATES[businessType] || BIZ_AGENT_TEMPLATES.other || [];
  for (const a of agents) {
    const pid = `persona_${uuidv4()}`;
    try { db.prepare('INSERT OR IGNORE INTO personas (id,user_id,name,icon,system_prompt,model,created_at) VALUES (?,?,?,?,?,?,datetime(\'now\'))').run(pid, userId, a.role, a.icon, a.prompt, 'auto'); } catch {}
  }
  const nightlyId = `sch_nightly_${userId.slice(0,8)}`;
  try {
    db.prepare('INSERT OR IGNORE INTO schedules (id,user_id,name,cron_expression,prompt,enabled) VALUES (?,?,?,?,?,1)')
      .run(nightlyId, userId, 'Nightly Forge Run', '0 2 * * *', `Run the nightly autonomous pipeline for business type: ${businessType}. Generate SEO pages, check review requests, fill content calendar gaps. Store results as pending approvals.`);
  } catch {}

  res.json({ success: true, data: { subdomain, businessName, businessType, agentsCreated: agents.length, parsed: { cities, services, pain } } });
});
