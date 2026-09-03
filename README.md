# Techcentrix Inc. — Quotation System

A web app for building quotations, modeled on the company's existing Excel template. It has two synced views of the same quote:

- **Editor** — the full working view, including the internal "gray zone" costing columns (supplier cost, % markup, unit selling price, total cost, total selling price, markup, margin).
- **Client Printable / Export view** — only the client-facing "white zone" (client info, quote #/date, item table, subtotal/VAT/grand total, terms & conditions, signature). Never shows cost or margin data. Exports via the browser's Print → Save as PDF dialog.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). A SQLite database is created automatically at `data/techcentrix.db` on first run, seeded with a sample quotation based on the reference template.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- **SQLite (via `better-sqlite3`)** — a real, file-based relational database shared by every browser/device that hits this server (see `src/lib/server/db.ts` and `src/lib/server/quotesRepo.ts`). No separate DB server to install.
- REST API routes under `src/app/api/**` for all quote CRUD
- Client-side data layer (`src/lib/store.ts`) does optimistic UI updates + debounced autosave against the API, with a "Saving.../Saved" indicator in the editor

## Project Structure

- `src/lib/types.ts` — data model (`Client`, `LineItem`, `Quote`, `Terms`, `PreparedBy`)
- `src/lib/calc.ts` — pricing/costing calculations (unit selling price, margin, quote totals)
- `src/lib/server/db.ts` — SQLite connection + schema bootstrap
- `src/lib/server/quotesRepo.ts` — server-side data access (list/get/insert/replace/delete quotes, recent clients, seeding)
- `src/app/api/quotes/route.ts`, `src/app/api/quotes/[id]/route.ts`, `src/app/api/quotes/[id]/duplicate/route.ts`, `src/app/api/clients/recent/route.ts` — REST API
- `src/lib/store.ts` — client-side cache + React hooks (`useQuotes`, `useQuote`, `useRecentClients`, `useSavingStatus`) backed by `fetch` calls to the API, with optimistic updates and per-quote debounced autosave (`createQuote`, `updateQuote`, `duplicateQuote`, `deleteQuote`)
- `src/app/page.tsx` — dashboard (search, create, duplicate, delete)
- `src/app/quotes/[id]/page.tsx` — full editor
- `src/app/quotes/[id]/print/page.tsx` — client-facing printable view
- `src/components/editor/*` — editor UI (line items, client panel, totals, terms, signature)
- `src/components/print/PrintableQuote.tsx` — the white-zone-only printable layout

## Deploying beyond one machine

Right now the app and its SQLite file run together on one server/process. To make quotations reachable from other computers/devices (true multi-device access), deploy this Next.js app to a host with persistent disk.

### Hostinger Node.js Web Apps (no VPS)

See **[HOSTINGER.md](./HOSTINGER.md)** for exact hPanel settings. Connect the GitHub repo and deploy as a Node.js app — not as static `public_html` files.

### Other hosts

Platforms like Railway, Render, or Fly.io also work if they give you a persistent disk for `data/techcentrix.db`. If you outgrow SQLite's single-writer model (many concurrent editors), swapping `src/lib/server/quotesRepo.ts` for Postgres is a contained change since all DB access is isolated behind the repo layer.

## Notes

- Quote numbers follow the `Q_MMDDYY###` scheme from the source template (e.g. `Q_0713001`).
- VAT defaults to 12% and is editable per quote.
- Each line item's Unit Price defaults to the computed "suggested" selling price (cost × (1 + markup%)) but can be manually overridden — the app tracks actual margin against whatever price is ultimately quoted.
- Data is stored in SQLite at `data/techcentrix.db` (shared by every browser that hits this server).
