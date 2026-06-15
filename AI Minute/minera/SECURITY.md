# Security Policy

## Reporting
This is a research/demo build — **do not use in production with real funds.**
The wallet/auth layer is mocked; on-chain mode is opt-in and unaudited.

If you find a vulnerability, please open a private report rather than a public issue.

## Known limitations (by design, demo scope)
- Auth is email→mock-wallet; no real signature verification.
- Balances are DB-authoritative in demo mode; on-chain mirror is best-effort.
- Smart contracts are **unaudited** — do not deploy to mainnet as-is.
- Rate limiting is in-memory (per-process), not distributed.

## Hardening already in place
- Rate limiting (300/min/IP), security headers, input validation, error handler.
- API keys for metered inference; webhooks are outbound-only.
