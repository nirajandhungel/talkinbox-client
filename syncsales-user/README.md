# SyncSales Frontend — Version 3.0

Production-grade SaaS frontend for multi-channel sales management.

## Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** — fast build tooling
- **TailwindCSS** — utility-first styling
- **Zustand** — client UI state management
- **TanStack Query v5** — server state, caching, pagination
- **React Router v6** — lazy-loaded routes
- **Framer Motion** — subtle animations
- **Recharts** — data visualization
- **React Hook Form + Zod** — form validation
- **Lucide React** — icon system

## Getting Started

```bash
npm install
npm run dev
```

## Architecture

```
src/
├── app/           # App shell, router, providers, layout
├── features/      # Feature-based modules (dashboard, inbox, orders...)
├── components/    # Shared UI components (ui/, tables/, charts/, dialogs/)
├── hooks/         # Reusable custom hooks
├── store/         # Zustand stores (UI, auth, toast, confirm)
├── api/           # API service layer (mock-ready for real API)
├── types/         # TypeScript domain types
├── lib/           # Utilities, mock data
└── constants/     # App-wide constants
```

## Features

- **Dashboard** — clickable KPI cards, revenue chart, stock alerts, inbox preview
- **Inbox** — paginated conversation list, message panel, AI-handled indicator
- **Orders** — paginated table with status/platform filters, search
- **Inventory** — bulk select/delete, stock alerts, paginated
- **Customers** — paginated with tier & platform badges
- **Analytics** — overview + dedicated Revenue page with daily/weekly/monthly/yearly filters
- **Accounting** — ERP-style ledger with P&L charts, expense breakdown
- **Automation** — toggle automations on/off
- **Integrations** — connect/disconnect sales channels
- **Settings** — store info, notifications, security, appearance
- **AI Panel** — contextual assistant panel

## Performance

- Route-based code splitting via `React.lazy()`
- TanStack Query caching (2min stale, 10min gc)
- Debounced search inputs
- Skeleton loaders on all data-heavy views
- Memoized components where beneficial

## Running Lints & Type Checks

```bash
npm run type-check
npm run lint
```
