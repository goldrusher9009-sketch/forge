# Forge Platform — CLAUDE.md

## What This Is
Client-portal SaaS where users bring their own LLM API keys (Anthropic, OpenAI, Gemini, Groq, Mistral, OpenRouter). No server-side env vars for user keys. Admin can set platform-wide keys via DB.

## Live URLs
- Frontend: https://forge-sand-two.vercel.app (Vercel, auto-deploys from main)
- Backend: https://forge-production-2692.up.railway.app (Railway, auto-deploys from main)
- Repo: C:\Users\teste\OneDrive\Documents\Claude\Projects\forge

## Folder Structure
```
forge/
├── forge-platform/          # Backend (Node/TypeScript, Express, SQLite)
│   └── src/index.ts         # Main server file — ALL routes, agent logic, DB setup
├── forge-web-studio/        # Frontend (Next.js)
│   └── app/components/ForgeApp.tsx  # Main UI component (BOM-encoded, use bash grep)
└── VERSION.md               # Changelog
```

## Currently Building
- SaaS billing: Stripe subscriptions + usage-based overage charging
- Admin revenue dashboard, billing routes module
- Backend on Railway with SQLite at /data/forge.db (volume: forge-volume)

## Architecture
- `getUserKey()` checks: per-user DB key → `platform_api_keys` table → `PROVIDER_ENV_KEYS` env vars
- `/api/keys` endpoint returns `has_anthropic`, `has_openai` etc. — drives model dropdown
- Model auto-select order: Anthropic → OpenAI → Gemini → Groq → Mistral → OpenRouter

## Common Mistakes to Avoid
- **ForgeApp.tsx has BOM encoding** — use `bash grep` not the Grep tool
- **PowerShell git** needs: `& 'C:\Program Files\Git\cmd\git.exe'` syntax
- **Never truncate index.ts** — it's 2350 lines; always use Edit not full Write for changes
- **Read before edit** — always Read the target section before editing large files
- **Don't re-read after edit** — Edit errors if it fails; no need to verify by re-reading
- **Railway deploys on push to main** — broken TypeScript = broken backend for all users
- **SQLite DB is persistent** on Railway volume; don't drop tables without migration plan
- After session: summarize what changed, never re-read whole chat
- **Use task list** for all multi-step work — create tasks upfront, mark done when complete, no narration
- **Minimize messages** — keep token count low, don't explain what you're doing, just do it
