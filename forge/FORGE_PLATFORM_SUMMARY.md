# Forge Platform — Full Summary

## Overview
Forge is a client-portal SaaS that lets users bring their own LLM API keys (Anthropic, OpenAI, Gemini, Groq, Mistral, OpenRouter). No server-side storage of user keys. Admins can set platform-wide keys via database. Full SaaS billing with Stripe subscriptions and usage-based overage charging.

## Live URLs
- **Frontend:** https://forge-sand-two.vercel.app (Vercel, auto-deploys from main)
- **Backend:** https://forge-production-2692.up.railway.app (Railway, auto-deploys from main)
- **Repository:** C:\Users\teste\OneDrive\Documents\Claude\Projects\forge

## Codebase Structure
```
forge/
├── forge-platform/          # Backend (Node/TypeScript, Express, SQLite)
│   ├── src/
│   │   └── index.ts         # Main server (2350 lines, ALL routes, agent logic, DB setup)
│   ├── package.json
│   └── .env (local development only)
├── forge-web-studio/        # Frontend (Next.js)
│   ├── app/
│   │   ├── components/
│   │   │   └── ForgeApp.tsx  # Main UI (BOM-encoded, use bash grep)
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── public/
│   └── package.json
├── VERSION.md               # Changelog (v6.46 current)
└── CLAUDE.md               # Project instructions (DO NOT CHANGE)
```

## Tech Stack
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite at `/data/forge.db` (Railway volume: forge-volume)
- **Frontend:** Next.js + React + TypeScript
- **Deployment:** Railway (backend), Vercel (frontend) — auto-deploy on main push
- **Payments:** Stripe (subscriptions + usage-based overage)
- **LLM Integrations:** Anthropic, OpenAI, Gemini, Groq, Mistral, OpenRouter

## Core Features
1. **Multi-LLM Support**
   - Users provide their own API keys per provider
   - Fallback order: Anthropic → OpenAI → Gemini → Groq → Mistral → OpenRouter
   - Admin platform-wide keys via `platform_api_keys` table

2. **Agent Execution**
   - `/api/agent` endpoint for agentic workflows
   - Tool use support (file ops, web search, etc.)
   - Streaming responses

3. **File Management**
   - Upload/download via `/api/upload` and `/api/download`
   - Cloud storage integration (Firebase)

4. **SaaS Billing**
   - Stripe subscription tiers (Free, Pro, Enterprise)
   - Usage-based overage charging (per 1M tokens)
   - Admin revenue dashboard
   - Billing routes module (incomplete — see "Currently Building")

5. **Admin Dashboard**
   - User management
   - Revenue tracking
   - Platform API key configuration

## Key Architecture Patterns
- **Key Resolution:** `getUserKey()` checks (1) per-user DB key → (2) `platform_api_keys` table → (3) `PROVIDER_ENV_KEYS` env vars
- **API Endpoint:** `/api/keys` returns `has_anthropic`, `has_openai`, etc. (drives model dropdown)
- **Streaming:** All LLM responses stream to frontend
- **Database:** SQLite with schema migrations (Railway volume persists)

## Currently Building
- ✅ Stripe integration (subscriptions)
- ✅ Overage charging (usage-based)
- ✅ Admin dashboard (revenue view)
- ✅ Sales playbook (pricing tiers, features)
- ⏳ **Billing routes module** (incomplete — `/api/billing/*` endpoints)
- 🔜 Task #40: Skills auto-activate
- 🔜 Task #41: Desktop app / browser extension

## Recent Work (v6.46)
- Gemini API alias fix (streaming response format)
- Dynamic folder structure for file uploads
- File-linked task tracker
- Neon branding (UI refresh)

## Common Mistakes to Avoid
1. **ForgeApp.tsx has BOM encoding** — use `bash grep`, not the Grep tool
2. **PowerShell git:** Use `& 'C:\Program Files\Git\cmd\git.exe'` syntax
3. **Never truncate index.ts** — always use Edit, not full Write
4. **Read before edit** — always Read the target section first on large files
5. **Don't re-read after Edit** — the tool errors if it fails; no need to verify
6. **Railway auto-deploys on push to main** — broken TypeScript = broken backend for all users
7. **SQLite DB persists** on Railway volume — migrations needed for schema changes
8. **Token efficiency:** Minimize messages, don't narrate actions, just execute
9. **Use task lists** for multi-step work

## Key Files to Know
- `forge-platform/src/index.ts` — **Everything** (routes, agent logic, DB, Stripe webhooks, streaming)
- `forge-web-studio/app/components/ForgeApp.tsx` — Main UI component
- `VERSION.md` — Changelog (current v6.46)
- `.env` files — Local dev only; Railway uses env vars in dashboard

## Deployment Flow
1. Commit to main branch
2. GitHub → Vercel (frontend auto-deploys in ~30s)
3. GitHub → Railway (backend auto-deploys in ~2min)
4. SQLite DB persists on Railway volume across deployments

## Database Schema (Key Tables)
- `users` — user profiles, API keys (encrypted)
- `platform_api_keys` — admin-set fallback keys
- `subscriptions` — Stripe subscription records
- `usage` — token usage tracking for billing
- `billing_events` — overage charges and invoice records

## Support & Debugging
- Check Railway logs for backend errors
- Vercel dashboard for frontend build/deploy status
- SQLite queries via Railway terminal or local dev
- Stripe webhook logs in Stripe dashboard

## Vision & Moat
Forge is building a **defensible LLM SaaS** by:
1. Removing API key management friction (BYOK model)
2. Providing a unified interface across all major LLM providers
3. Usage-based billing that rewards efficiency
4. Platform-wide keys for enterprise + SMBs without personal keys
5. Extensible agent framework with file ops, web search, tool use

Revenue streams:
- Subscription tiers (Free, Pro, Enterprise)
- Overage charges (per 1M tokens above tier limit)
- White-label licensing (future)
- Enterprise support (future)

---

**Last Updated:** 2026-06-05  
**Current Version:** v6.46  
**Active Developers:** Scott (goldrusher9009@gmail.com)
