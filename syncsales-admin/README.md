# SyncSales Admin

Platform administration dashboard for SyncSales.

Connects **only** to `admin-server` at `/admin/v1` — never directly to the business API or AI service.

## Dev

```bash
# Terminal 1 — backend (from syncsales-server/)
pnpm dev:admin

# Terminal 2 — admin UI
cd syncsales-client/syncsales-admin
pnpm install
pnpm dev    # http://localhost:5174
```

## Login

After `pnpm db:seed` in syncsales-server: `admin@syncsales.com` / `Admin@123`

## Pages

- Dashboard — businesses, users, MRR, token usage, system health
- Businesses — all tenants overview
- AI Analytics — token usage per model/tenant, cost estimates
- Subscriptions — plans and billing status
- Logs — auth events and activity audit trail
