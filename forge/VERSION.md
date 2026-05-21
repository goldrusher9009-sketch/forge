# Forge Platform — Version History

## v5.6 — 2026-05-20 (current)

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Version number in UI** — v5.6 badge visible in sidebar footer next to plan
- **Dynamic model fetching** — `loadProviderModels(provider)` fetches live model list from each provider's API on key save/update. All providers: anthropic, openai, groq, gemini, mistral, together, perplexity, cohere, openrouter. Model selector shows "🔥 Provider (live)" optgroup with all fetched models
- **Context progress bar** — New `context` right panel tab: token usage bar with color coding (green→yellow→red), per-message breakdown, compact button when >70% full
- **Live agent preview (Manus-style)** — New `live` right panel tab: SSE stream of real-time agent activity events (start/thinking/done/error), pulsing green LIVE indicator
- **ForgeBrowser tab** — New `browser` right panel tab: iframe-based browser with back/forward/refresh, URL bar, quick-access bookmarks (Google, GitHub, Anthropic docs, v0.dev, OpenRouter)
- **Terminal tab** — New `terminal` right panel tab: command execution via backend `/api/terminal/exec`, command history (↑/↓), color-coded output
- **Folder/file attachment** — 📎 Files button in bottom bar: attach multiple files, chip display, auto-include file contents in message
- **Bottom bar redesigned** — Quick-access icon buttons for 📊context / 📺live / 🌐browser / 💻terminal / 🚀dispatch / ✅task

### Backend: forge-platform/src/index.ts
- **GET /api/keys/:provider/models** — fetch live model list from any provider's API using saved key
- **GET /api/live/activity** — SSE endpoint broadcasting real-time agent events (start/thinking/done/error) to all connected clients
- **POST /api/terminal/exec** — execute whitelisted shell commands with 10s timeout, 64KB output cap
- Agent activity emitted from `executeDispatchRun` via in-memory pub/sub

---

## v5.5 — 2026-05-20

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Key save pipeline** — `saveOneKey` now awaits: save → loadVault → loadApiKeys → validateVaultKey → loadOpenRouterModels (if openrouter). Same for `updateVaultKey`. Validation and model load happen atomically after every key save
- **Default model from active key** — `loadApiKeys` auto-selects best model based on which provider keys exist (anthropic → claude-sonnet-4-6, openai → gpt-4o, gemini → gemini-2.0-flash, groq → llama, openrouter → first free model)
- **OpenRouter models in navbar dropdown** — model selector now includes OpenRouter free models (top 10) and paid models (top 20) as an optgroup, so you can pick OR models without leaving workspace
- **Refresh button fixed** — shows "⟳ Loading…" spinner while fetching, disabled during load, won't silently fail
- **Loading state** — "⟳ Loading models from OpenRouter…" shown in model grid while fetching

---

## v5.4 — 2026-05-20

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **OpenRouter key fix** — Save button now calls `saveOneKey` with immediate `loadOpenRouterModels()` reload. Inline key entry added directly on the OpenRouter tab so user never has to leave the model browser
- **OpenRouter model browser** — Full openrouter.ai feature clone: stats bar (total/free/paid count), FREE badge on `:free` models, $/1M prompt+completion pricing, context window chip, filter (all/free/paid), sort (name/price↑/price↓/context), 120 results with search refinement prompt
- **Key validation** — `validateVaultKey()` pings backend `/api/keys/:provider/validate`. Each vault row shows ✓ Active / ✗ Invalid / ● Inactive badge + ⚡ Validate button. Keys auto-validate 500ms after being saved
- **Chat Enter fix** — `newThread()` now returns the created thread. `sendMessage` creates thread AND sends in one shot — no double-press needed. Thread title set from first message
- **Voice button** — Purple, pulsing during recording, labeled "● Recording…" vs "Voice"
- **Token counter** — Always visible in navbar (shows 0 when empty, was hidden before)

### Backend: forge-platform/src/index.ts
- **POST /api/keys/:provider/validate** — pings provider API (Anthropic, OpenAI, OpenRouter, Groq, Gemini, Mistral), sets `key_status` to `active` or `invalid` in DB, returns `{ valid, error }`

### Version bumps
- forge-web-studio/package.json: 5.0.0 → 5.4.0
- forge-platform/package.json: 1.0.0 → 5.4.0

---

## v5.3 — 2026-05-20
- JSX structural fixes (div balance errors, adjacent JSX elements, null bytes)
- Vercel + Railway deployment verified end-to-end

---

## v5.2 — 2026-05-20
- Key vault UI, thread sidebar context menu, navbar token counter, Forge Super tab

---

## v5.1 — 2026-05-20

### Frontend: forge-web-studio/app/components/ForgeApp.tsx (1878 lines)
- **Admin panel** — 🛡️ tab visible only to `role=admin` users
  - Stats dashboard: users, threads, messages, revenue, tokens
  - User management: list all users, change role (user ↔ admin)
  - Platform API keys: save encrypted server-side keys for Anthropic, OpenAI, Gemini, Groq, OpenRouter, Mistral, Together, Perplexity — used as fallback for all users
  - Model management: toggle enable/disable per model, see markup
- **Per-provider key save** — each Save button saves ONLY that provider's key
- **savedProviders state** — source of truth for which providers have confirmed saved keys (from backend `has_*` flags)
- **Model dropdown gating** — only shows models whose provider key is confirmed saved
- **Thread recovery** — auto-creates new thread if Railway DB wipe returns THREAD_NOT_FOUND
- **role** added to User interface and populated on login
- **Model list updated** — Claude Opus 4.6, Sonnet 4.6 added; correct model IDs (claude-sonnet-4-6 etc.)

### Backend: forge-platform/src/index.ts (1750 lines)
- **DB persistence** — DB_PATH uses `/data/forge.db` on Railway (add volume mount at /data)
- **platform_models table** — 18 models seeded, admin can enable/disable
- **platform_api_keys table** — encrypted platform-wide keys, fallback for all users
- **platform_settings table** — general KV settings store
- **Admin routes**: GET/PATCH /api/admin/users/:id, GET/POST/DELETE /api/admin/platform-keys, GET/PATCH/POST /api/admin/models, GET /api/admin/stats
- **Public /api/models** — returns enabled models for dynamic frontend loading
- **resolveForgeModel** — correct Anthropic model ID mapping (claude-haiku-4-5-20251001 etc.)
- **getUserKey** — falls back to platform key (from DB) then env var, so users don't need to enter keys if admin has set platform keys
- **Model from request body** — chat endpoint accepts model override per-message

### Deployed URLs
- Frontend: https://forge-sand-two.vercel.app
- Backend: https://forge-production-2692.up.railway.app

### Git commits (both in same repo)
- `bebc30f` — feat: admin routes platform_models platform_api_keys DB persistence
- `bdf6e66` — feat: admin panel with stats users platform keys model toggles
- `0d80016` — fix: per-provider key save, correct model filtering, thread recovery

---

## Post-deploy checklist
1. **Railway volume** — add volume at `/data` in Railway dashboard so DB survives redeploys
2. **Make yourself admin** — run in Railway shell or DB console:
   ```sql
   UPDATE users SET role='admin' WHERE email='goldrusher9009@gmail.com';
   ```
3. **Enter platform API key** — log in as admin → Admin tab → Platform Keys → enter Anthropic key → all users can now chat without entering their own key

---

## v5.0 — previous
- Full workspace rebuild: projects, threads, messages, artifacts, agents, tasks, dispatch, schedule
- ForgeRouter tab with Forge models + direct models + OpenRouter + custom providers
- Billing tab with subscription management
- Platforms/Settings tabs with connected service credentials (stored in localStorage only)
- Per-user encrypted API key storage in SQLite
- JWT auth with refresh tokens

---

## v5.7 — 2026-05-21 (current)

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **OpenRouter model IDs** — `selectedModel` state now stores bare IDs (e.g. `deepseek/deepseek-v4-flash:free`) instead of `openrouter/deepseek/deepseek-v4-flash:free`. Stripped at every `setSelectedModel` call site: loadOpenRouterModels, loadApiKeys, ForgeRouter click, navbar option values. `cleanModel` safety strip kept in sendMessage as fallback.
- **Copy button on messages** — every message has 📋 Copy + 🔊 Read buttons that appear on hover, identical to Claude's UX
- **New conversation fix** — `newThread` has a fallback retry path; errors swallowed silently instead of alerting raw JSON
- **Version badge** — updated to v5.7 in sidebar footer

### forge-web-studio/package.json: 5.6.0 → 5.7.0
### forge-platform/package.json: 5.6.0 → 5.7.0
