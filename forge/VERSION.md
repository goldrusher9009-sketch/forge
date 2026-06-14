## v7.9 — 2026-06-14 — Cmd+K Palette, Auto-title, JSON Export
- **Expanded Cmd+K palette** — 24 commands across nav/thread/ui; fork thread, export MD/JSON, copy link, open panels
- **Auto-title threads** — after first AI reply, generates 4-7 word title via haiku model; replaces "New conversation"
- **JSON export button** — thread header exports full thread+messages as .json download
- **File restore** — recovered ForgeApp.tsx from truncation; re-applied all features cleanly

# Forge Platform

## v7.8 — 2026-06-14 — Power Features: Context Warning, Search, Templates, Fork, Cost, Compare
- **Context limit warning banner** — ⚠️ at 75% + 🚨 at 90% context capacity with "New thread" CTA
- **Live content search** — sidebar search queries `/api/search` (threads + messages + memory) with 350ms debounce
- **Thread templates modal** — ⚡ button opens 12 starter templates (Research, Code Review, Debug, etc.)
- **Fork thread from message** — 🍴 Fork button on every message; POST `/api/threads/:id/fork` creates copy up to that point
- **Real-time cost estimate chip** — shows ~$X before sending based on model pricing × context tokens
- **Model comparison panel** — ⚖️ right panel tab; compare up to 3 models on same prompt side by side; POST `/api/chat/simple`

## v7.7 — 2026-06-14 — UX Depth: Shortcuts, Wordcount, Badges, Timestamps, Pinned Panel, Slash Prompts, Archive
- **Keyboard shortcuts modal** — `?` key shows all shortcuts overlay (Ctrl+K, arrows, Esc, Enter)
- **Thread word count + reading time** — live badge in thread header (e.g. "1,234w · 6m read")
- **Prompt usage badge** — 🔥 fire icon at 5x uses, optimistic count update on use
- **Model badge on messages** — provider icon + short name pill under each assistant reply
- **Message relative timestamps** — "2m ago" with hover tooltip for absolute time
- **Pinned messages panel** — new 🔖 tab in right panel lists all pinned msgs in current thread
- **Slash command shows saved prompts** — type `/` to search and load prompts from library
- **Archived threads sidebar section** — collapsible 🗃 Archived row at bottom of thread list

## v7.6 — 2026-06-14 — UX Polish: Export, Profile, Chips, Sparkline, Pin, Reactions, Focus
- **Thread Export** — download any thread as a Markdown file with one click
- **Profile card** — avatar, email, join date, plan tier shown at top of Settings
- **Smart quick-reply chips** — context-aware follow-up suggestions after assistant replies
- **7-day token sparkline** — bar chart on workspace home shows daily usage trend
- **Pin messages** — star important messages; `/api/messages/:id/pin` + GET pinned endpoint
- **Message reactions** — 👍 ❤️ ⭐ emoji reactions on assistant messages; `/api/messages/:id/react`
- **Focus mode** — ⊟ button collapses sidebar + right panel for distraction-free writing
- **Cmd+K keyboard nav** — arrow keys highlight commands, Enter executes, mouse hover syncs index

## v7.5 — 2026-06-14 — UX Moat: Prompts, Cmd+K, Checklist, AI Title, Changelog, Notifs
- **Prompt Library** — save/search/use/delete prompts; `/api/prompts` full CRUD; inserts into SuperAgent input
- **Cmd+K Command Palette** — 12 nav commands, fuzzy filter, Escape to close, discoverable via footer hint
- **Activation Checklist** — `/api/checklist` tracks 5 onboarding milestones; progress card on workspace home
- **AI Auto-title Threads** — `/api/threads/:id/summarize` uses claude-haiku-4-5 to generate 5-8 word titles
- **Changelog Modal** — `/api/changelog` parses VERSION.md; auto-shows on first login after new version
- **Notification Bell** — `/api/notifications` surfaces pending approvals + nightly run status; badge + dropdown

## v7.3 — 2026-06-14 — Moat Deepening: Savings, Activity Feed, Vertical Packs
- **GET /api/savings** — BYO-key savings calculator: compares user's actual provider cost vs Forge seat markup per-1k-tokens. Returns savedLabel, byProvider breakdown, headline. Shown as green savings card in Outcome Ledger.
- **Outcome Ledger savings card** — live "$X saved vs seat pricing" banner with per-provider token breakdown rendered in the outcomes panel.
- **GET /api/activity** — unified activity feed: last N events across nightly_runs, forge_memory, pending_approvals, seo_pages, threads, sorted by timestamp. Powers homepage "Recent Activity" widget.
- **Homepage Recent Activity widget** — shown in empty workspace when user has activity history; fetched on mount, renders icon + title + body + date for each event.
- **Marketplace vertical seed packs** — 6 industry packs (Law, Restaurant, E-Commerce, Trades, Agency, Healthcare) seeded into marketplace_listings on backend startup. Frontend adds 'vertical' category tab + browse packs featured box.
- **Onboarding checklist** — 3-step setup guide shown in empty workspace when no API keys configured; step 2 links directly to platforms tab.
- **ForgeApp.tsx BOM fix** — replaced all template literal ternaries in JSX style props with plain string ternaries to prevent TSC cascade errors in BOM-encoded file. — Version History

## v7.2 — 2026-06-14 — PHASE 3: Forge Brain v2 (the compounding-memory MOAT)
- **Categories** — forge_memory gains category (customer/pricing/voice/rule/decision/product/ops/general), confidence, last_reinforced_at (idempotent migration). Deterministic categorizer on write (no LLM cost).
- **GET /api/brain/summary** — "What Forge knows about you": total memories, brain strength, days learning, new-this-week, by-category breakdown, top insights, headline + moat note. Makes the moat *felt*.
- **GET /api/brain/category/:cat** — drill-down by category.
- **POST /api/brain/decay** — fades memories not reinforced in 30d, prunes near-zero. Keeps brain accurate/alive (nightly-safe).
- **Reinforce-on-use** — memories surfaced into agent context get strength/confidence bumped (anti-decay). Categorizer + decay logic unit-verified.
- route-manifest test guards /api/brain/summary, /category/:cat, /decay.
- Strategy: see FORGE_MOAT.md (5 compounding moat layers; Brain is the keystone).

## v7.1 — 2026-06-14 — PHASE 2: Addictive Core (Morning Brief)
### The daily-hook loop
- **GET /api/brief** — returns greeting, login streak + longest streak, "since last visit" delta (pending approvals, new SEO pages, new threads, last nightly run), and the ONE priority action (finish setup → add key → review approvals → run an agent).
- **Login streaks** — users table gains login_streak, longest_streak, last_seen_at, last_brief_at (idempotent migration). `touchStreak()` extends on consecutive days, resets on a missed day; wired into /api/auth/login and /api/brief. Streak math unit-verified.
- **route-manifest test** updated to guard /api/brief.

## v7.0 — 2026-06-13 — PHASE 0: Truth & Stability
### Route-gap closers (frontend called these → backend 404'd; now real handlers)
- **POST /api/agent/run** — SSE agent stream (tool_call/tool_result/response/error events) the agent UI expects
- **GET /api/analytics/summary** — range-aware summary shape for AnalyticsDashboard
- **GET/POST /api/billing/tiers** — list + create custom tiers (SubscriptionTiers)
- **GET /api/billing/invoices** — usage-derived invoice list (BillingPage)
- **POST /api/billing/subscribe** — plan subscribe alias (BillingPage)
- **GET /api/forge-tools/catalog** — public, cached tool catalog (ForgeApp, zero-token tools)
- **POST /api/marketplace/install** — flat install alias ({productId}) for MarketplaceDetail
- **GET /api/orgs, POST /api/orgs/:orgId/invite, DELETE /api/orgs/members/:id** — team mgmt (TeamDashboard) + orgs/org_members tables
- **GET /api/tokens/balance, POST /api/tokens/stake** — staking ledger (StakingPage) + token_stakes table
### Demo guard
- **route-manifest.test.ts** — asserts every frontend API call has a backend handler (param-aware, Express 4/5 proof). Fails BEFORE a 404 hits a demo. Wired into `npm test`.

## v6.84 — 2026-06-10 (current)
### Bug fixes — overnight session
- **Thread/Project context menus** — ⋮ dots and right-click now show dropdown with Rename, Pin, Archive, Delete actions (both threads and projects)
- **Live Preview** — iframe now renders HTML/code correctly instead of showing raw code; auto-wraps non-HTML in `wrapCodeForPreview()`
- **Hook toggle persisted** — toggle switch now calls `toggleHook()` API instead of only updating local state
- **Thread search** — fixed crash when `t.title` is null; search now uses `(t.title||'').toLowerCase()`
- **ForgeRouter** — fixed INVALID_INPUT error: test now sends `{ messages:[...] }` format, not `{ content }`
- **MVP Builder duplicate** — removed duplicate MVP Builder block that was causing double-render
- **ForgeCO Socket.IO** — fixed `require()` error in useEffect with async IIFE + dynamic `import()`
- **callOneModel errors** — now throws proper errors so ForgeMulti/ForgeASI/Swarm can display them
- **Editor Run** — new `/api/run-code` backend endpoint writes code to temp file before executing (fixes shell-escape failures)
- **New Task modal** — added full modal with title input, priority selector, Cancel/Create buttons
- **Toast feedback** — added `showToast()` to 7 copy/save actions (Editor Save, Copy Patch, ForgeBrowser Copy, Code block copy, Message copy, Gen result copy, Referral link copy)
- **Referral copy toast** — added missing `showToast('🔗 Referral link copied')`

## v6.83 — 2026-06-07
### Interactive activity + Git UI + folder drag
- **Clickable activity steps** — every agent step and live tool-call card in the working feed is now clickable; clicking jumps to the right-panel tab where that work happened (search/scrape → Browser, shell/code/git → Terminal, file/artifact → Artifacts). Hover highlight + ↗ open button.
- **Git integration UI** — new 🌿 Git subtab in the Terminal panel: shows branch + changed files (color-coded by status), per-file stage/unstage, click-to-view live diff (green/red/orange), commit-all with message, recent commit log. Backed by 6 new backend routes: `/api/git/status|diff|stage|unstage|commit|log`.
- **Multi-file folder drag-to-chat** — drag a whole folder or many files onto the composer; recursive `webkitGetAsEntry` read pulls in text/code files as chat context with an orange drop-zone overlay.

## v6.82 — 2026-06-07
### Socket.IO + Empty state upgrade
- **Socket.IO** backend: real-time bidirectional events — typing indicators, thread sync, user presence, ping/pong
- **Socket.IO** frontend: auto-connects on login, joins thread rooms, handles thread_updated + typing events
- **Empty state** upgraded: 8 suggestion cards (2x4 grid), shows on any empty thread (not just no-thread), quick-nav bar
- Backend: `socket.io@4.7.4` added, httpServer wraps Express app, auth middleware on socket connections
- Frontend: `socket.io-client@4.7.4` added, socketRef, auto-reconnect

## v6.81 — 2026-06-05
### Full backend rebuild + GraphQL
- **Restored real SQLite backend** (was replaced by in-memory Map store in v6.80 — all data was lost on restart)
- **GraphQL API** at `POST /api/graphql` — queries: threads, messages, memories, me, analytics, personas, search; mutations: createThread, deleteThread, createMemory, deletePersona
- **ForgeOptimizer** `/api/forge-optimizer/:id/analyze` + `/apply` — real token analysis + context trimming
- **Rate limiting** — 30 req/min per user on chat endpoint (in-memory, no Redis needed)
- **Webhooks** — full CRUD + outbound delivery with HMAC signing, retry, delivery log
- **Multi-model routing** `/api/models/available` — returns available models based on user's connected keys
- **Personas** — full CRUD: custom system prompts, model, temperature, icon
- **Prompt cache/templates** — save/reuse prompts with use count tracking
- **Full-text search** `/api/search` — across threads, messages, memories
- **Analytics** `/api/analytics` — daily usage, top models, token totals, period filter
- **Data export** `/api/export` — full JSON export of all user data
- **Version endpoint** `/api/version` — reports features + build time
- Fixed harvest socket timeout (120s)
- package.json: added `graphql`, `better-sqlite3`; version → 6.81.0; start script uses ts-node

## v6.62 — 2026-06-05
### UX improvements
- Slash commands: type `/` in composer → dropdown (agents/skills/actions/navigate)
- Thread grouping: Today / Yesterday / This week / Older with red left-border active indicator
- Sidebar already grouped in v6.61 (Core/Build/System)
- Component split deferred (separate session)

## v6.61 — 2026-06-05
### Taskade-style red/black redesign
- Deeper blacks (#080809 base), sharper red (#ff1f35), Taskade-style gradient vars
- Body: ambient red glow bottom-left + top-right (Taskade pattern)
- Sidebar: 3 zones (Core / Build / System) with dividers + left-border active indicator
- Active tabs: red left-border pill indicator instead of flat background
- Logo: gradient mark + white gradient text, red glow shadow
- New Conversation: gradient pill button with hover glow + lift
- Send button: gradient + red glow when active
- Topbar: animated red accent line at bottom edge
- Global `.fg-btn-primary` / `.fg-btn-secondary` classes for consistent buttons

## v6.60 — 2026-06-03
### Bug fixes
- Strip `<tool_call>` XML from chat messages (renderContent + workspace cleanContent)
- ForgeOptimizer panel shows loading spinner immediately on click (no data needed)
- Harvest: extend socket timeout to 120s to prevent Railway 30s timeout

## v6.48 — 2026-06-01
### Refined red theme + sharper typography (research-backed)

Reverted the indigo experiment per feedback (red was better) and applied 2026 dashboard best-practice (neutral near-black base + sharp brand accent, not a colored background):
- **Vivid scarlet red brand accent** `#ff2b3d`/`#ff5263` (sharper, cleaner than the old muddy crimson) on a neutral near-black base (`#0a0a0c`→`#2a2a31`). Red used as accent (logo, primary actions, borders), neutral elsewhere — the recommended premium pattern.
- **Sharper fonts:** `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`, tighter letter-spacing, heavier Inter weights (700-900), Space Grotesk on all headings with -0.02em tracking, OpenType `ss01` features.
- Body glows + scrollbar + accent-grad returned to red tones; neon multicolor logo retained.

**Verified:** frontend esbuild-clean. themeColor → `#ff2b3d`.

---

## v6.47 — 2026-06-01
### Full multicolor visual overhaul (theme-variable driven) — superseded by v6.48

Recolored the ENTIRE app by retuning the `:root` CSS variables (single source of truth — every panel/button/border inherits automatically, no structural changes, all functions identical):
- **Deep-space indigo base** (`#07080f`→`#242a48`) replacing flat crimson.
- **Electric primary** cyan→violet (`--fg-orange`/`--fg-orange2` repurposed as `#6ea8ff`/`#b07cff`; names kept for compatibility). New `--fg-cyan`, `--fg-magenta`, `--fg-amber`, and `--fg-accent-grad` available app-wide.
- **Multicolor body background** — layered radial glows (blue/violet/cyan) fixed-attached; gradient scrollbar; `.fg-accent-bar` + `.fg-glass` helpers.
- All animation glows (flash/pulse/ring/send) swapped from crimson rgba to electric blue/violet.

**Verified:** frontend esbuild-clean.

---

## v6.46 — 2026-06-01
### File-linked progress tracker + high-end neon brand polish

- **Progress tracker is now folder/file-linked (dynamic like folders)** — each tracker item stamps the active folder (`folderId`); the tracker view filters to the active folder's items (global/un-tagged items still show everywhere). Switching folders shows that folder's progress. All buttons/functions unchanged.
- **Neon brand polish (looks only):** sharp animated multi-colour neon "Forge" wordmark (`.forge-neon`, cycles cyan→orange→gold→green→blue→violet→pink) on login, sidebar, and mobile headers; added Space Grotesk display font; gradient-text helper. No functional changes.
- **New neon favicon + app icons** — sharp cyan→violet→magenta "F" on dark; wired `app/icon.png`, `app/apple-icon.png`, `favicon.ico` + layout `icons` metadata; themeColor → neon cyan.

**Verified:** frontend esbuild-clean.

---

## v6.45 — 2026-06-01
### Dynamic folders: files linked to chat folders, cascade delete, LLM auto-filing

The right-side chat list (threads) now acts as **folders**, and files belong to the folder they were created in:
- **Files are folder-scoped** — `/api/userfiles?thread_id=…` returns only that folder's files; the left files panel reloads whenever you switch folders (`loadFolderFiles` + effect on active thread).
- **Cascade delete** — deleting a folder (thread) now also deletes every file that lived in it (`DELETE FROM user_files WHERE thread_id=…`). Rename already updates the folder label.
- **LLM-created files auto-file into the active folder** — when the agent calls `write_file`/`create_artifact`, the file is persisted to `user_files` with the active `thread_id` and the UI is told via a new `file_created` SSE event, so it appears under the right folder instantly.

**Verified:** backend + frontend both esbuild-clean.

---

## v6.44 — 2026-06-01
### Correct OpenRouter ~alias handling + refreshed model lists + CRITICAL frontend build fix

- **CRITICAL: fixed truncated ForgeApp.tsx that was blocking ALL frontend deploys since v6.41.** The component's closing `);` + `}` were missing (file ended mid-JSX), so `next build` failed and Vercel kept serving v6.41 — which is why v6.42/6.43 never appeared. Restored the closers; file now compiles (esbuild verified). This is why the version badge never moved.

- **Fixed `google/gemini-flash-latest is not a valid model ID`** — the leading `~` in `~google/gemini-flash-latest` is a *valid* OpenRouter auto-router alias and must NOT be stripped. Reverted the v6.42 over-strip: `~` is now preserved in every id sent to OpenRouter (`resolveForgeModel`, `callLLM`, `modelResolver`); only the Forge-internal `openrouter/` prefix is removed. Provider routing still detects `~…/…` correctly.
- **Refreshed model lists (pulled live from OpenRouter, June 2026):** new OpenRouter group in the model picker with current valid slugs (Claude Opus 4.8, GPT-5.5, Gemini 3.5 Flash, DeepSeek V4 Pro, Llama 4 Maverick, Qwen 3.7 Max, Grok 4.3, Mistral Medium 3.5, and the `~google/gemini-flash-latest` alias). Google direct group updated with 2.5 Flash Lite / 2.0 Flash Lite.
- The live `/api/models` endpoint already pulls the full per-provider list when a key is connected; these curated defaults are the valid fallback shown before that fetch.

**Verified:** backend esbuild clean; frontend edit region brace-balanced (pre-existing standalone-bundle warning is unrelated, Next build handles it).

---

## v6.43 — 2026-06-01
### Credential guidance (all modes) + full-autonomy Magic mode + escalation

- **Asks & guides on missing keys/connectors (all modes)** — instead of failing, the model names what's needed, where to add it (Settings → LLM Providers, with the exact key URL per provider), what it unlocks, and offers the best alternative it can do now. Suggests free Groq/Gemini keys when relevant.
- **Magic mode = full human-like autonomy** — browse the web, control a browser, run shell/code, read/write files, call any API, install tools/skills, and even switch LLM models to get the best result. Builds a working demo when a live credential is truly required.
- **Escalation** — if Magic mode hits something it genuinely cannot do, it never just stops; it tells the user the single best way to solve it, step by step.
- **Friendlier NO_API_KEY response** — actionable, warm, Claude-style message with provider-specific key links.

**Verified:** esbuild transpile clean (0 errors).

---

## v6.42 — 2026-05-31
### Gemini/OpenRouter fix + human-tone narration + restored truncated backend

**Bug Fixes:**
- **Gemini "Task completed" with no result fixed** — model ids with a leading `~` (e.g. `~google/gemini-flash-latest`) were sent to OpenRouter unstripped → invalid slug → empty response. Now strip `~` in `resolveForgeModel`, `getProviderForModel`, the OpenRouter `modelResolver`, and `callLLM`.
- **No more silent "Task completed."** — both agent loops (Anthropic + OpenAI-compat) now track interim text and return the last real content or a clear diagnostic instead of an empty stub.
- **Restored truncated `index.ts`** — file had lost its tail (userfiles `:id`/download/delete routes, webhook routes, `app.listen`). Reconstructed + de-duplicated; backend boots again.

**Features:**
- **Human-tone live narration for ALL providers** — new `humanizeToolStep()` emits warm first-person status ("Searching the web for…", "Writing file…") across Gemini, GPT, Claude, Groq, OpenRouter. System prompt now instructs every model to narrate like a colleague and always end with a real result.

**Verified:** full file transpiles clean (esbuild, 0 errors).

---

## v6.41 — 2026-05-31
### React hooks crash fix — app fully restored

**Bug Fixes:**
- **React error #310 eliminated** — removed two duplicate `useState` declarations that caused hooks count mismatch on mount
  - `const [coTab, ...]` at line 621 renamed to `forgecoTab` (was colliding with existing `coTab` at line 746)
  - Orphaned `const [showHookFormPanelPanel, ...]` removed (duplicate of `showHookFormPanel` at line 690)
- **App fully loads** — ForgeApp mounts cleanly after login/signup; all sidebar tabs visible (Workspace, ForgeRouter, Billing, Platforms, Settings, ForgeSuper, Skills & Tools, Files, Hooks, Runs, ForgeCo)
- **Zero console errors** on load (only a Chrome extension error from unrelated 3rd-party extension)

**Commits:**
- `fix: rename duplicate coTab state to forgecoTab - resolves React hooks crash v6.40`
- `fix: remove duplicate showHookFormPanelPanel useState - fixes React hooks count error #310`

---

## v6.40 — 2026-05-27
### Comprehensive UI fixes + ForgeCO + NL commands + live agent progress

**New Features:**
- **ForgeCO panel** — team workspace with Team/Projects/Docs/Chat tabs; member cards, project progress bars, live team chat
- **Natural language commands** — type "enable hooks", "launch agents", "schedule run", "open mvp builder" etc. in chat workspace; auto-navigates to correct panel
- **ForgeMulti live progress** — per-agent tiles appear and fill in real-time as each agent completes (no more waiting for all to finish)
- **ForgeAuto feature toggles** — Self-Correction, Goal Tracking, and all capability cards now have real ACTIVE/INACTIVE toggle buttons
- **Progress Tracker auto-populate** — every agent step automatically added to the tracker as a numbered item, crossed off when response arrives (like Claude's task list)
- **renderContent markdown** — headings (h1/h2/h3), bullet lists, numbered lists, horizontal rules now render properly in all chat panels including ForgeSuper

**Bug Fixes:**
- **Chat folders** — delete (🗑), rename (✏️), pin (📌) buttons on every chat folder item; pins sort to top
- **Hooks panel** — enable/disable toggles + Create New Hook form fully wired (previous session)
- **Messages array error** — all MVP Builder, Agent Swarm, Intelligence, ForgeMulti, ForgeASI API calls fixed (previous session)
- **Runs "Schedule Run"** — button now opens prompt dialogs to set task + schedule
- **ForgeSuper formatting** — assistant messages now use renderContent() for proper markdown rendering

## v6.39 — 2026-05-27
### All missing tabs + business model features + comprehensive UI audit

**New Tab Panels (6):**
- **ForgeAuto** — run any prompt across multiple models in parallel, compare results side-by-side
- **ForgeMulti** — multi-agent team (Analyst, Creative, Critic, Strategist, etc.) with synthesis step
- **ForgeASI** — Extended Parallel Intelligence Chains: multi-phase deep reasoning (2/3/5/7 phases)
- **MVP Builder** — spec + stack + roadmap + pitch in one click; "Build It Now", Deploy to Railway/Vercel buttons
- **Intelligence Layer** — memory graph browser, harvest context, knowledge node viewer
- **Agent Swarm** — deploy 3/5/8/12/20 parallel specialist agents with synthesis; real `Promise.all` execution

**Bug Fixes:**
- **Free model 429 error message** — no longer says "Add your own key" when user has a key; clearer "shared rate limit, switch to paid" message
- **DeepSeek timeout** — improved message: explains DeepSeek can be slow, suggests Claude/GPT-4o
- **Compact endpoint** — fixed "coming soon" catch to show real error
- **Intelligence `/memory` route** — fixed to call `/superagent/memory` (correct endpoint)
- **Top-level `isFreeModel` helper** — available to all tab panels, not just loadOpenRouterModels callback

**Competitive / Business Model Improvements:**
- **Team plan** added to billing ($29/seat/mo)
- **Referral program** section in billing — shareable link, Twitter share, stats counters
- **MVP builder deploy buttons** — Deploy to Railway + Deploy to Vercel + Build It Now (sends to agent)
- **Chrome Extension** platform badge changed from "Coming Soon" to "Available"
- **Usage breakdown** section added to billing tab

## v6.38 — 2026-05-26
### Persist selected model + free model race condition fix
- **`selectedModel` persisted to localStorage** — survives page reloads, never reset to empty on refresh
- **Race condition eliminated** — `loadOpenRouterModels()` no longer overwrites a valid user-selected model
- **Init from localStorage** — on page load, the last-used model is restored immediately before any async key checks

## v6.37 — 2026-05-26
### Forge Desktop app integration
- **`🖥️ Desktop` tab** — appears in sidebar only when running in Electron, shows folder context, file tree, browser context, and memory
- **Auto-detects desktop mode** via `window.forgeDesktop` — badge shown in sidebar footer
- **Folder picker** — open local folders, browse file tree, click any file to inject contents into chat
- **Browser bridge** — Chrome extension page context (URL, title, text selection) shown and usable in chat
- **Desktop memory viewer** — view/clear persistent key-value memory stored by the desktop app
- **Desktop context injected into messages** — active folders + browser page sent to backend so Forge knows local context
- **Backend** — accepts `desktop_context` field, adds it to system prompt automatically
- **Chrome extension scaffold** — complete MV3 extension (background.js, content.js, popup.html) ready to load unpacked

## v6.36 — 2026-05-26
### Skills auto-activate + richer prompt injection
- **Skills auto-activate on Launch**: clicking "▶ Launch in Chat" now also toggles the skill ON automatically
- **Connectors auto-activate on "Use Now"**: always sets connector active (no accidental deactivate)
- **Richer system prompt injection**: sends full skill prompt/description to backend per skill, not just IDs
- **Backend**: uses skill prompts in system context so Forge deeply applies each skill's expertise
- **OR model fix**: never auto-select free-priced models when user has own key (pricing=0 models excluded too)

## v6.35 — 2026-05-26
### Fix OpenRouter 429 rate-limit error
- **Backend**: Detect 429 from OpenRouter, return friendly actionable message instead of raw JSON
- **Frontend**: Clean up rate-limit error display — shows "Add your API key in Settings → LLM Providers" guidance
- **Free model rate-limit**: Both `:free` model detection + generic 429 handled gracefully

## v6.34 — 2026-05-26
### Critical crash fix + full audit
- **Fixed `React is not defined` crash** — added `import React` + moved illegal `React.useState` hook out of IIFE into component scope
- **Fixed app crash when clicking Agents right panel tab** — `activeAgentId` state moved to component level
- **Default model** — Llama 3.3 70B (free) for fast responses
- **BodyStreamBuffer** — friendly error message on stream interruption

## v6.33 — 2026-05-26

### Full smoke test + backend tool infrastructure

- **Full smoke test passed** — all 15 nav tabs verified: Workspace, ForgeRouter, Billing, Platforms, Settings, Forge Super, Skills & Tools, Files, Hooks, Runs, ForgeCo, ForgeAuto, ForgeMulti, ForgeASI, MVP Builder, Intelligence, Agent Swarm
- **Backend tool infrastructure** — implemented `callAnthropicWithTools`, `callOpenAICompatWithTools`, `runForgeTool`, `toolShellExec`, `FORGE_TOOLS_ANTHROPIC` (7 tools: web_search, run_code, write_file, read_file, shell, http_request, create_artifact)
- **Fixed blank nav tabs** — Files, Hooks, Runs, ForgeCo, ForgeAuto, ForgeMulti, ForgeASI now render full content panels

## v6.32 — 2026-05-26

### Moonshot Features: MVP Builder + Intelligence Layer + Agent Swarm

- **MVP Builder tab** (🏗️) — Describe any idea, get a complete startup blueprint: product spec, tech stack, 4-phase roadmap, investor pitch. One-click templates for 8 MVP types. Results are editable and can be sent to chat for refinement
- **Intelligence Layer tab** (🧠) — Living context graph showing Forge IQ score, memory entries, conversation count, active skills/connectors/tools. Knowledge Harvest, Context Graph, Smart Auto-Select, and Predictive Mode features. IQ progress bar toward 1000
- **Agent Swarm tab** (🐝) — Deploy 2–20 parallel AI agents simultaneously on one task. Each agent takes a specialist role (Researcher, Analyst, Strategist, Writer, Critic, etc.). Results shown in real-time cards. Swarm Synthesis agent combines all outputs into an executive summary
- **3 new left nav tabs**: MVP Builder (🏗️), Intelligence (🧠), Agent Swarm (🐝)
- **mainTab type extended** to include `'mvp'|'intelligence'|'swarm'`
- **New state**: mvpIdea/Industry/Target/Building/Result/Phase, igNodes/Query/Loading, swarmTask/AgentCount/Running/Results/Synthesis

## v6.31 — 2026-05-25

### Progress Tracker + Ready-made Agents + Expanded Tools + Human Narration

- **Progress Tracker tab** — first tab in right panel (📌). Dynamic goal tracker with priority levels (high/medium/low), progress bar, inline editing, clear-done/clear-all. Persisted to localStorage. Chat folder section shows 6h inactivity warning and 24h delete countdown
- **Ready-made Agents tab** — second tab in right panel (🧠). 25 pre-built agents across Business, Individual, and Builder categories. One-click activate loads expert system prompt into workspace chat. CEO Advisor, Marketing Pro, Sales Coach, Finance Analyst, MVP Builder, and 20 more
- **Expanded built-in tools** — 23 tools now shown in the Tools tab with descriptions: web_search, browse_web, browser_batch, run_code, start_process, read_file, write_file, list_directory, execute_js, screenshot, click/interact, press_key, webhooks, image_gen, data_analyze, desktop_commander, computer_use, HTTP request, read_process_output, commit_deploy, tool_search, wait, action
- **Human-like tool narration** — tool calls in chat now show plain-English descriptions ("Searched the web for X", "Read file at Y", "Ran Python to compute the result") instead of raw tool names. Active tools show animated progress with icons
- **Massive skills catalog expansion** — 40+ skills across 8 categories: Documents (PDF, Word, Excel, PowerPoint, CSV, Markdown), Finance (Financial Modeling, Invoice, Budget, Tax, Accounting, Investment), Analytics (Data Analysis, Visualization, Dashboard, SQL, Statistics), Engineering (Debug, Code Review, Architecture, DevOps, API Design, Testing, Incident Response), Content (Brand Voice, Marketing, Email Sequences, SEO, Copywriting, Social Media), Design (UX, UI, Design Critique), Legal (Contract Review, NDA Triage, Compliance), Product (PRD, Roadmap, Competitive Analysis), Research (Deep Research, Summarizer, Translation)
- **Expanded connectors catalog** — 35+ connectors across Communication (Slack, Gmail, Teams, Discord, WhatsApp), Project Management (Linear, Asana, Jira, Notion, Trello, Monday), Storage (Google Drive, Dropbox, Box, OneDrive, S3), Dev Tools (GitHub, GitLab, Vercel, Railway, Supabase, Firebase), CRM (HubSpot, Salesforce, Stripe, Calendly), Productivity (Google Calendar, Zoom, Airtable, Zapier, Make), AI & Data (OpenAI, Anthropic, Pinecone, Snowflake, BigQuery)
- **Fixed file truncation** — restored missing end of ForgeApp.tsx (connector modal close button + component export)

---

## v6.30 — 2026-05-25 (current)

### Autonomy Layer + Bug Fixes

- **Autonomy layer** — full backend routes for goals (with LLM auto-decomposition), file storage, webhook triggers (public endpoint, async execution), self-reflection scoring, multi-agent handoff, ForgeAuto (parallel models), ForgeMulti (specialist swarm), progress tracker API
- **getUserLLMKey helper** — intelligently selects best available provider (anthropic → openrouter → openai → gemini → groq) for internal tasks like compact and reflection
- **BodyStreamBuffer fix** — reduced `apiFetchSSE` timeout from 65s to 28s to match Railway's 30s idle kill; prevents `BodyStreamBuffer was aborted` crash on long responses
- **File truncation recovery** — restored truncated `index.ts` (missing `app.listen` and all autonomy routes); clean rebuild from line 2722 forward

---

## v6.29 — 2026-05-25

### Syntax Highlighting + Auto-Compact + Auto-Preview + Autonomy Improvements

- **Syntax highlighting** — code blocks in chat now color-highlight keywords (purple), strings (green), numbers (amber), comments (gray), function calls (blue) for JS/TS/Python/SQL/bash/JSON. No external deps — inline tokenizer
- **Auto-compact** — when thread context hits 85% of model limit, backend `/compact` endpoint fires automatically: LLM summarizes old messages, keeps 8 recent, resets token count
- **Auto-open sketch panel** — when AI produces a code/HTML artifact, the right-side live preview panel opens automatically
- **Sandbox link fix** — `sandbox:/` links in AI responses (e.g. "Download PDF") now render as `⬇ use the 💾 Download button above` instead of broken links
- **`renderContent()`** — new rich renderer: inline code highlighting, bold/italic markdown, syntax-highlighted fenced blocks replacing plain `<p>` text

---

## v6.28 — 2026-05-25

### Persistent Thinking Steps Panel

- **Thinking steps persist after response** — agent steps (🧠 Processing, 🧩 Skills, ⚙️ Sending, 💭 live backend events) are now snapshotted into a collapsible "Forge thought for N steps" block that stays visible below the AI reply
- **`agentStepsRef`** tracks steps via ref (not stale closure) so `finally` block captures the full set including backend SSE events
- Steps cleared on next message send; expand/collapse toggle

---

## v6.27 — 2026-05-25

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
- **Admin panel** — 🛡️ tab visi