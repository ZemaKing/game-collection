# game-collection

A personal collection of video games, special editions, steelbooks, artbooks, figures, and other gaming collectibles.

Anyone can browse the whole collection; only the owner, signed in and listed in `public.admin_users`, can add, edit or delete. Built with React 19, TypeScript, Vite, Tailwind CSS v4 and Supabase (Postgres, Auth, Storage), deployed on Vercel. The UI is in Serbian and English.

- [`ROADMAP.md`](ROADMAP.md): the live plan and status (Phases 31+). [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) is the history of Phases 1–28.
- [`CLAUDE.md`](CLAUDE.md): architecture and conventions in detail.

## Setup

Needs Node 22+ (CI uses 22).

```bash
npm install
cp .env.local.example .env.local   # then fill it in, see below
npm run dev                        # http://localhost:5173
```

### Environment (`.env.local`, git-ignored)

| Variable | Used by | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | the app | Required: the app throws at startup without them. Local dev uses the **same Supabase project as production** |
| `RAWG_API_KEY` | `/api/*` (games autofill) | Server-only (no `VITE_`). Locally the Vite dev server mounts the same routes; on Vercel set it in the project's environment variables |
| `SUPABASE_SERVICE_ROLE_KEY` | maintenance scripts | Bypasses RLS. Never `VITE_`-prefixed, never committed |
| `RLS_ADMIN_*`, `RLS_USER_*` | `npm run verify:rls` | An admin login and a signed-in non-admin login |

## Database

The schema lives in [`supabase/migrations/`](supabase/migrations/). There is no CLI pipeline: each migration is applied **by hand in the Supabase SQL editor**, in timestamp order.

- `20260915120000_initial_schema.sql` is the baseline. It creates the whole schema in one go and is for a **new** database only; never re-run it on the live one.
- Every later change is a new timestamped file after it. A change that adds columns to an item table usually also needs the `all_items` view updated.
- `supabase/seed.sql` is idempotent (fixed UUIDs + upserts) and safe to re-run.
- Row Level Security enforces the rules: public read, writes only for `(select public.is_admin())`. The admin allow-list `public.admin_users` is managed in the SQL editor, and sign-ups are disabled in the dashboard. `npm run verify:rls` proves it against the live project.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `preview` | Vite dev server · type-check + production build · serve `dist/` on :4173 |
| `npm run lint` / `typecheck` / `format` | ESLint · `tsc -b` · Prettier |
| `npm run test` | Vitest: unit and component tests, plus the pure helpers in `scripts/` |
| `npm run test:e2e` | Playwright journeys at desktop/tablet/mobile against the live data, **read-only** ([`e2e/README.md`](e2e/README.md)) |
| `npm run verify:rls` | Proves the RLS rules with an admin and a non-admin login (creates and deletes `ZZ RLS …` fixtures) |
| `npm run db:export` | JSON export of every table to `backups/db/` |
| `npm run images:audit` | Bucket inventory, orphans and sizes → `docs/images-audit.md` (metadata only) |
| `npm run images:backup` | Plan; `-- --apply` downloads new objects to `backups/images/`; `-- --verify` re-hashes them |
| `npm run images:migrate` / `images:check` / `images:flip` / `images:verify` | The Phase 33–34 WebP migration ([`scripts/migrate-images/README.md`](scripts/migrate-images/README.md)) |
| `npm run images:static` | Regenerates the static images in `public/` from `static-src/` |
| `npm run perf:vitals` | Lab Web Vitals of `npm run preview` ([`docs/performance.md`](docs/performance.md)) |

Every script that downloads from the bucket prints the size first and needs `--apply`. The backup and restore routine is in [`docs/backup.md`](docs/backup.md).

## Images

Uploads are converted **in the browser** to a full WebP (fits 1600 px) plus a thumbnail (fits 600×750), both stored in the public `item-images` bucket. Cards and strips load the thumbnail, and the detail page and viewer load the full image. Since Phase 34 every existing image is served this way too. The pre-WebP originals stay in Storage, referenced by `original_path`, until Phase 37 retires them.

## Testing and CI

`.github/workflows/ci.yml` (Node 22) runs lint, typecheck, unit tests and the build on every push to `main` and on pull requests. A separate E2E job runs once the `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` repository secrets exist. E2E never writes, so the owner flows (add/edit/delete, images, sign-in) are a manual checklist: [`docs/production-verification.md`](docs/production-verification.md).

## Deployment

Vercel builds from GitHub: pushes to `main` go to production, and other branches get preview deployments. [`vercel.json`](vercel.json) rewrites every path to `index.html` (SPA) and sets the security and caching headers. The `api/` folder holds the serverless RAWG autofill proxy; it needs `RAWG_API_KEY` in the Vercel environment (Production + Preview).

## Monthly quota check

The project is on Supabase **Free**, and its organization shares **5 GB egress/month** and **1 GB Storage** with another app. The cycle resets on the 10th. Once a month, and before anything that downloads the bucket:

1. Dashboard → Organization → Usage: note Storage size, egress and cached egress, and whether uploads are restricted.
2. `npm run images:audit`: the bucket's exact size, by format and type, from metadata only (≈ 0 egress).
3. If Storage is near 1 GB: look for orphans in the audit; after Phase 37 the bucket should be ≈ 0.4 GB.
