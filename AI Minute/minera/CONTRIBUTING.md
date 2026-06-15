# Contributing to Minera

Thanks for your interest! This is a working-name research build.

## Setup
```bash
cd minera && npm install
npm run dev:backend    # :4000
npm run dev:frontend   # :5173
```

## Before opening a PR
- `cd backend && npm test` must pass (29 tests).
- `cd frontend && npm run build` must succeed.
- Keep the one-folder structure (frontend + backend + contracts).
- Match existing style (2-space indent, see `.editorconfig`).

## Project layout
- `backend/` — Express API + SQLite (`src/routes`, `src/services`, `src/database`)
- `frontend/` — React + Vite (`src/components`)
- `contracts/` — Solidity + Hardhat

## Adding a feature end-to-end
1. Schema in `backend/src/database/schema.sql` (+ migration in `db.js` if altering).
2. Route in `backend/src/routes/`, mount in `index.js`.
3. API method in `frontend/src/api.js`, component in `frontend/src/components/`, tab in `App.jsx`.
4. Test in `backend/test/api.test.js`.

## Rebranding
Change `BRAND` / `TOKEN` in `frontend/src/brand.js` and `.env`.
