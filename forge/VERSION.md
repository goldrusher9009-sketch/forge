# Forge Platform — Version History

## v6.27 — 2026-05-25 (current)

### Superagent Skills/Connectors Wiring Fix

- **Fix `enabledSkills`/`enabledConnectors` undefined in `/api/superagent/chat`** — these variables were used but never destructured from `req.body`; superagent chat now correctly receives and applies active skills/connectors sent from the frontend

---

## v6.26 — 2026-05-25

### Agentic Engineer Persona + Magic/Ask Modes + Visual Output + Connector Fix + Context Usage Fix

- **Vibe-coder system prompt** — Forge AI now embeds a world-class agentic engineer persona (Karpathy + Pieter Levels + DHH) injected into every request
- **Magic mode** — `forge_mode=magic` in request body; AI never asks questions, picks best approach autonomously, delivers complete working result
- **Ask mode** — `forge_mode=ask`; collaborative, asks one focused question if needed, shows thinking, offers downloads
- **`forge_mode` wired end-to-end** — frontend maps `superMode` ('forgeMagic'/'forgeAsk') → backend system prompt injection
- **Visual output / HTML artifacts** — HTML code blocks auto-show in Preview mode; `💾 Download` button added to inline preview toolbar; `extractCodeBlock` parses "Save as:" hint for filename
- **`downloadCode` helper** — Blob URL download for any code artifact with correct filename + extension
- **Auto-preview for HTML** — `previewMode` defaults to `'preview'` when `isHtml` is true
- **MCP Connector modal** — "Connect via Platforms →" now opens setup modal with instructions, env key name, "Get API Key →" link, "⚡ Activate Now" button
- **Context Usage fix** — `getContextLimit()` strips `openrouter/` prefix, checks live `openRouterModels` context_length, falls back to pattern matching (deepseek/gemini/claude/gpt/llama/mistral/qwen)
- **Stats endpoint** — `GET /api/threads/:id/stats` added (was missing); returns total_tokens, token_history, model_breakdown, recent_calls
- **Column fix** — stats query uses `COALESCE(m.tokens,0)` (correct column name); `model` column migration added
- **Assistant messages now store model** — INSERT includes model field; shows under each message bubble

---

## v6.25 — 2026-05-25

### Context Usage Panel — Per-Model LLM Breakdown
- **New backend endpoint** `GET /api/threads/:id/stats` — returns total_tokens, token_history (with model/role per message), per-model breakdown from usage_logs, recent calls
- **Context Usage panel** now shows per-model usage: provider color dots, model name, requests, total tokens (k), input/output token split, cost
- **Message breakdown** updated: 👤/🤖 role icons, color-coded bars (user vs AI), filters out zero-token entries
- **Model colors** per provider: Anthropic=amber, OpenAI=green, OpenRouter=purple, Groq=red, Mistral=blue, Gemini=yellow, Morph=cyan

---

## v6.24 — 2026-05-25

### Tools for All Providers + Manus Live Feed + Clarification UI
- **`callOpenAICompatWithTools`** — full tool_use loop for OpenRouter, OpenAI, Groq, Mistral. DeepSeek and any OpenRouter model now calls web_search, browser_action, run_code etc.
- **Manus-style live activity feed** — expanded panel shows every step with timeline dots, tool detail rows (query/URL/command), live tool call cards with expand/collapse during thinking
- **Clarification question UI** — when AI asks a numbered question, frontend renders clickable option buttons; clicking sends that option immediately
- **Clarification instructions in system prompt** — AI told exactly how to format numbered option questions
- **`browser_action` icon** 🖱️ added to tool icon map

---

## v6.23 — 2026-05-25

### Browser Automation + Persistent State + Iron-Clad Execution
- **`browser_action` tool** — Real headless Chromium via Playwright: navigate/click/type/fill_form/screenshot/get_text/evaluate/scroll. Persistent sessions (reuse session_id across calls). Auto-cleanup after 5 min.
- **Skills/Connectors persist** — Active skills & connectors saved to localStorage; survive page refresh
- **Strengthened system prompt** — 10 non-negotiable execution rules; AI MUST use tools, NEVER refuses, chains tools autonomously

---

## v6.22 — 2026-05-25

### Critical Fix: AI Now Uses Tools (Never Refuses)
- **`FORGE_SYSTEM_PROMPT`** — injected on every chat request; tells AI it CAN browse web, run code, scrape URLs
- AI will no longer say "I cannot browse the internet" or "I don't have real-time access"
- Explicit instructions: call `web_search` for any current info, `web_scrape` for any URL, `run_code` for any computation
- System prompt prepended before all user/skill/project prompts on every Anthropic call

---

## v6.21 — 2026-05-25

### Full Autonomous Tool Suite
- **8 real tools** wired into backend: `web_search`, `web_scrape`, `run_code`, `shell_exec`, `read_file`, `write_file`, `list_directory`, `http_request`
- **`web_search`** — DuckDuckGo instant answers API + HTML fallback; returns titles, snippets, URLs
- **`web_scrape`** — fetches any URL, extracts headings/links/code blocks/tables, returns clean text (up to 32KB)
- **`run_code`** — sandboxed Node.js `vm` (JavaScript) + `python3` child_process (Python); timeout-safe
- **`shell_exec`** — unrestricted shell: any command, any cwd, up to 60s timeout; no allowlist
- **`read_file` / `write_file`** — filesystem I/O with auto-mkdir, append mode, truncation at configurable byte limit
- **`list_directory`** — directory listing with sizes and types
- **`http_request`** — arbitrary HTTP (GET/POST/PUT/DELETE/PATCH) with headers and body; JSON auto-pretty
- **`/api/tools/run`** endpoint — frontend can call any tool directly
- **`/api/tools/list`** endpoint — returns full tool schemas
- **`/api/terminal/exec`** now unrestricted (removed command allowlist)
- **Anthropic native `tool_use`** — chat handler uses Anthropic's built-in tool loop (up to 8 iterations per message) instead of text-parsing JSON hacks; tools execute reliably
- **Tool call SSE events** — `tool_call` events emitted mid-stream with tool name, args, and result preview
- **Inline tool call cards** — frontend renders collapsible tool call cards above each response showing icon, args, and output
- **`apiFetchSSE` upgraded** — now accepts optional `onEvent` callback for mid-stream event handling

---

## v6.20 — 2026-05-25

### Frontend + Backend
- **Skills/connectors/hooks** injected into LLM system prompt on every chat request
- **Manus-style thinking panel** — step-by-step agent activity (📚 context → 🧩 skills → 🤖 model → ✅ done)
- **Parallel message spawning** — second message while AI is thinking opens a new thread instead of queuing
- **Post-login crash fixed** — removed undeclared `artifactView` reference
- **Thread context menu** — Rename (inline edit), Pin/Unpin, Archive/Unarchive, Copy title, Delete
- **Runs tab scheduler** — create cron-scheduled AI tasks with preset schedules and custom cron syntax
- **Mode pills moved** to chat input toolbar (❓ Ask / ✨ Magic)
- **Language selector** in navbar (12 languages: EN/ES/FR/DE/PT/IT/ZH/JA/KO/AR/HI/RU)
- **Active skills/connectors summary** in right panel Tools tab
- **Language sent** in chat API body for non-English responses

---

## v6.17 — 2026-05-24

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **New: Full Skills Catalog** — 120+ skills across 18 categories (document, analytics, content, engineering, design, sales, product, legal, finance, operations, support, enterprise, seo, integrations, productivity, smallbiz, ai) — loaded dynamically from SKILLS_CATALOG.json via window.FORGE_CATALOG_DATA
- **New: Full Connectors Catalog** — 30 MCP connectors across 10 categories (communication, knowledge, storage, engineering, finance, sales, data, design, ai, research) — each with tool chips, status badge (available/connect), and Connect via Platforms button
- **New: Category filter pills** — skills and connectors filterable by category with emoji icons
- **New: Connector tool chips** — each connector shows its tool names inline (send_email, search_threads, etc.)
- **New: Connect flow** — unavailable connectors route to Platforms tab for setup

### SKILLS_CATALOG.json
- Rebuilt from 11 → 120+ skills; 9 → 30 connectors with status, icon, category, tools fields

---

## v6.16 — 2026-05-24

---

## v6.15 — 2026-05-24

### Backend: forge-platform/src/index.ts
- **Fix: OpenRouter timeout 60s** — OR `fetchWithTimeout` 22s→60s, Promise.race outer guard 20s→60s (OR only), safety timer 25s→65s. Slow OR models (large context, high load) no longer time out prematurely
- **Fix: Stream tool visibility** — backend `/superagent/chat` now accepts `enabledSkills` + `enabledConnectors` arrays per request
- **New: SKILLS_CATALOG.json** — skills + connectors catalog served/referenced by frontend

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **New: Sidebar tool visibility** — right sidebar shows active skills (with icons + close ✕) and active connectors in real-time as they're enabled
- **New: ForgeMagic auto-matching** — `superMode='forgeMagic'` auto-enables skills/connectors from `window.FORGE_CATALOG_DATA` based on message keywords; sidebar updates live
- **New: window.FORGE_CATALOG_DATA global** — catalog data hoisted to window scope so both super tab and skills tab share same data without prop drilling
- **New: Multiple skills/connectors in single request** — `sendMessage` passes `enabledSkills`/`enabledConnectors` arrays to superagent endpoint
- **New: Interactive chat elements** — tool activity, skill/connector chips rendered inline in chat
- **Fix: Catalog scope bug** — sidebar skill/connector lookup was referencing undefined local `catalogData`; fixed to use `window.FORGE_CATALOG_DATA`

---

## v6.14 — 2026-05-23

### Backend: forge-platform/src/index.ts
- **Fix: Heartbeat keep-alive** — `app.post('/api/threads/:id/messages')` now sends a `setInterval` heartbeat every 5s (`res.write(' ')`) while the LLM runs. Railway 30s idle timeout can never fire because bytes are sent continuously. `endRes()` helper clears the interval and flushes the real JSON payload.

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Fix: apiFetch POST timeout** — raised 28s → 60s (backend heartbeats keep connection alive, so longer timeouts are safe now)
- **Fix: safetyTimer** — raised 30s → 55s (gives LLM up to 55s before UI auto-unsticks; backend will have responded well before that)
- **Version badge** — v6.10 → v6.14

---

## v6.13 — 2026-05-23

### Backend: forge-platform/src/index.ts
- **Fix: Railway keep-alive complete** — `app.post('/api/threads/:id/messages')` now sends headers + `res.write(' ')` immediately on request, then uses `res.end(JSON.stringify(...))` for all response paths (NO_API_KEY, success, LLM_ERROR). Prevents Railway 30s idle timeout from killing Workspace chat.

---

## v6.12 — 2026-05-23

### Backend: forge-platform/src/index.ts
- **Fix: deepseek/qwen OR models routed to Groq** — `getProviderForModel` was routing `deepseek*` and `qwen*` to Groq. Removed them from Groq list; `includes('/')` catch-all now correctly routes all slash-ID models (deepseek/*, qwen/*, etc.) to OpenRouter.
- **Fix: OR timeout increased** — OpenRouter timeout 20s→26s (just under Railway 30s kill).

---

## v6.11 — 2026-05-23

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Fix: OR models shown with no key** — `loadOpenRouterModels` no longer falls back to public endpoint; only loads when user has confirmed OR key.
- **Fix: Stuck thinking** — `apiFetch` POST timeout 180s→28s, safety timer 65s→30s. UI unsticks within 30s max.
- **Fix: OR load gated on key** — `loadApiKeys` only calls `loadOpenRouterModels()` when OR key confirmed.

---

## v6.10 — 2026-05-23

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Fix: OpenRouter auto-select prefers paid model** — When OR models load, now picks `deepseek/deepseek-chat-v3-0324` (fast, reliable) instead of first free model. Free models (Baidu CoBuddy etc.) are slow and cause stuck-thinking.

---

## v6.9 — 2026-05-23

### Backend: forge-platform/src/index.ts
- **New: Setup endpoint** — `POST /api/setup/platform-key` (secret-protected) sets platform API keys without admin login. `POST /api/setup/reset-password` resets any user's password. Both protected by `SETUP_SECRET` env var (default: `forge-setup-2026`).

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Fix: OpenRouter default model** — When user only has OpenRouter key, default to `deepseek/deepseek-chat-v3-0324` (reliable paid model) instead of keeping a stale `:free` model that causes stuck-thinking.

---

## v6.8 — 2026-05-23

### Backend: forge-platform/src/index.ts
- **Fix: Stuck-thinking root cause** — Railway has a 30s HTTP response timeout. All backend LLM call timeouts were 50-60s, causing Railway to kill connections before errors returned, leaving frontend permanently stuck. All LLM timeouts reduced to 25s (Anthropic, OpenAI, Groq, Gemini, Mistral, Morph, OpenRouter) so errors always return before Railway drops the connection.

---

## v6.7 — 2026-05-23

### Backend: forge-platform/src/index.ts
- **Fix: Gemini system message** — System messages now passed via `systemInstruction` (proper Gemini API field) instead of being converted to user messages. Eliminates 400 errors from consecutive same-role messages.
- **Fix: Gemini alternating roles** — Consecutive same-role messages merged before sending to Gemini API.
- **Fix: Gemini model resolution** — Added full GEMINI_MODEL_MAP: 2.5-pro, 2.5-flash, 2.0-flash, 2.0-flash-lite, 1.5-pro, 1.5-flash all resolve to correct API model IDs.
- **Fix: max_tokens 4096** — Anthropic, OpenAI, Groq, Mistral all now send max_tokens 4096 (was 2048).
- **New: Gemini 2.5 Pro/Flash** — Added to platform_models seed and model resolution.
- **New: o4-mini, o3, GPT-4.1 Mini** — Added to platform_models seed.
- **New: Groq model map** — Proper model ID resolution for all Groq models.
- **New: Mistral model map** — Proper model ID resolution including codestral.
- **Fix: OpenAI models filter** — o4-* models now included in model list fetch.

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **New models in dropdown** — Gemini 2.5 Pro/Flash, o4-mini, o3, GPT-4.1 Mini, Codestral, Gemini 1.5 Flash, Claude 3.7 Sonnet, legacy Anthropic group.
- **Context limits** — Added Gemini 2.5 Flash, 1.5 Pro, 1.5 Flash to context limit map.

## v6.6 — 2026-05-22

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Fix: Stuck-thinking on no model** — Early `return` when no model selected now calls `setSending(false)/setTyping(false)` before returning, so the UI never gets permanently frozen in "Thinking…" state.
- **Fix: OpenRouter priority ordering** — OpenRouter key check moved to end of auto-select priority list so Anthropic/OpenAI/Gemini/Groq/Mistral are tried first. Prevents empty `selectedModel` when only OpenRouter key exists but models haven't loaded yet.
- **Version badge** — Updated to v6.6 in sidebar footer.

### Backend: forge-platform/src/index.ts
- **Fix: GET /api/keys includes platform/env keys** — `has_anthropic` (and other `has_*` flags) now return `true` when a platform API key (admin-set) or Railway env var exists for that provider, even if the user hasn't entered their own key. This means the model dropdown populates correctly for users who rely on admin-configured platform keys.

---

## v6.5 — 2026-05-22

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Fix: Inline live activity strip removed** — Entire "Live Activity ✕ ⚡Model generating response…" overlay removed from chat view. It was triggered by `typing` state and appeared as a full-width blocking strip on every message send.
- **Fix: Subtle typing indicator** — Replaced the intrusive overlay with a small 🤖 icon + three pulsing dots at the bottom of the message list.
- **Version badge** — Updated to v6.5 in sidebar footer.

---

## v6.4 — 2026-05-22

### Frontend: forge-web-studio/app/components/ForgeApp.tsx
- **Fix: Morph fully purged (all locations)** — Removed from: DIRECT_MODELS array, providers list in loadApiKeys, dynamicGroups filter (navbar model selector), loadProviderModels guard, ForgeRouter filter. Morph no longer appears anywhere unless a Morph API key is explicitly saved.
- **Version badge** — Updated to v6.4 in sidebar footer.

---

## v6.3 — 2026-05-22

### Frontend: forge-web-studio/app/components/ForgeApp.tsx

- **Fix: Chat shows reply directly** — AI response is now appended to the chat from the POST response body directly, eliminating the race condition where `loadMessages()` would re-fetch before the DB write completed, causing messages to vanish. `loadMessages` is still called in the background to sync but no longer blocks the UI.
- **Fix: Morph fully purged** — Removed from `DIRECT_MODELS` array (was still rendering tabs) AND from the Admin platform keys list. Morph is now completely gone from all UI surfaces.
- **Fix: No auto-tab hijack** — Removed the line that forced the live tab open on every message send, keeping the user in the chat view.
- **Version badge** — Updated to v6.3 in sidebar footer.

---

## v6.2 — 2026-05-22

### Frontend: forge-web-studio/app/components/ForgeApp.tsx

- **Fix: "Thinking then disappears"** — Backend returns HTTP 200 with `{success:false, error:'NO_API_KEY'}`. Added `checkResp()` helper in `sendMessage` that detects this and shows a clear in-chat error: *"No [provider] API key found. Go to Settings → LLM Providers."*
- **Fix: Default model silent fail** — Changed `selectedModel` initial state from `'forge-pro'` (no key → silent fail) to `''`. `loadApiKeys` now auto-selects the first model the user actually has a key for: Anthropic → OpenAI → Gemini → Groq → Mistral.
- **Fix: Morph fully removed** — Filtered from model selector tabs (no Morph tab unless Morph key is saved) AND removed from the LLM Providers settings list. Morph is gone from the UI entirely unless a user explicitly adds a key.
- **Stop button** — Red ■ Stop button appears next to Send while AI is thinking. Cancels in-flight fetch via AbortController.
- **Message queue while thinking** — If you type and press Enter while AI is responding, the message is queued and auto-sent immediately after the current response completes.
- **180s timeout** — `AbortSignal.timeout` raised from 95s to 180s to handle Railway cold-start + long LLM responses.
- **Live 📺 status** — TV icon button shows real-time activity text while AI is working (e.g. "🤖 Thinking…").
- **Website credential vault** — New section in Settings: store per-site logins (URL, email, password) in browser localStorage only — never sent to any server. Dynamic add/edit/delete per entry.
- **Version badge** — Updated to v6.2 in sidebar footer.

---



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
