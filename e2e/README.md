# End-to-end tests (ROADMAP Phase 40)

```bash
npm run test:e2e                          # build + preview on :4175, then every journey × 3 layouts
npx playwright test e2e/detail.spec.ts    # one file
npx playwright test --project=mobile      # one layout: desktop | tablet | mobile
npx playwright test -g "viewer"           # by test name
npm run test:e2e:report                   # open the HTML report of the last run
```

**Read-only against production, by the owner's decision (Open decision 3).** The suite runs a
production build of this checkout against the Supabase project in `.env.local`, which holds the
live collection, and **never writes**. `fixtures.ts` aborts every non-GET/HEAD request from the
page to Supabase and fails the test that sent it, so a write test can't slip in by accident.
Nothing here signs in.

- **Egress:** Storage image requests are answered with a 1×1 PNG and never reach Supabase, so a
  full run (63 tests × 3 layouts) costs about **2 MB** (≈ 1.5 MB of API JSON plus ≈ 0.12 MB of
  oracle data per worker; measured 2026-10-09), not the hundreds of MB the photos would.
- **Where the expected values come from:** `support/data.ts` reads `all_items`, `platforms` and
  `item_images` straight from PostgREST with the anon key. It doesn't use `src/features`, so a bug
  in the app's queries or filters can't also shift what the tests expect. Counts follow the live
  data, so adding an item never breaks the suite.
- **Layouts:** `desktop` (1280×900), `tablet` (iPad Mini, 768×1024, touch: sidebar layout with
  infinite scroll) and `mobile` (Pixel 7, touch: bottom tab bar, menu sheet, `/search` page).
  Every spec runs on all three and branches where the interaction differs (`isPhoneLayout`).
- **English UI:** the fixture seeds `settings` with `locale: 'en'` when a page has none, so
  controls are found by their English accessible names. The settings tests switch it themselves.
- **Browser:** the locally installed Microsoft Edge (`channel: 'msedge'`), so there's no
  Playwright browser download. `E2E_CHANNEL=chrome` uses Chrome (CI does).
- **Failures** keep a trace, a screenshot and an `error-context.md` (the page's accessibility
  tree) in `test-results/e2e/<test>/`. Open a trace with
  `npx playwright show-trace test-results/e2e/<test>/trace.zip`. There are no retries, so a flaky
  test shows up instead of being hidden.
- **Against a deployed site:** `E2E_BASE_URL=https://game-collection-six.vercel.app npm run test:e2e`
  (PowerShell: `$env:E2E_BASE_URL="…"; npm run test:e2e`) skips the local build and tests that URL,
  for a Vercel preview before promoting it or for production after. The site must use the same
  Supabase project as `.env.local`. The read-only guard and the image stub still apply.
- **CI:** the `e2e` job in `.github/workflows/ci.yml` runs after `verify`, once the repository
  secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist (it's skipped with a notice until
  then). Keep it out of the required checks: it depends on the live project being awake.
- **Needs** the network and the Supabase project awake.

| File               | Covers                                                                                                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `browse.spec.ts`   | dashboard (hero, newest items), every type's count vs the database, the next page (Load More, or infinite scroll on touch/narrow screens), platform page, navigation per layout (sidebar / bottom tabs + menu sheet), card → detail, unknown item id, no sideways scrolling |
| `filters.spec.ts`  | platform filter via the sheet (Apply only on Apply, URL, reload, chip removal), multi-type deep link + Clear All, listing search box → `?q=`, empty state + Clear filters, grid/list remembered but not in the URL                                                          |
| `search.spec.ts`   | search → result → detail (dialog on tablet/desktop, `/search` on phones), Ctrl K + Escape + focus, no-results message (on screen and announced)                                                                                                                             |
| `detail.spec.ts`   | detail page title, gallery, no owner actions when signed out; viewer open, next/previous (keys or buttons), strip, Escape, focus back on the trigger                                                                                                                        |
| `settings.spec.ts` | theme, language (`<html lang>`) and default view apply at once and survive a reload                                                                                                                                                                                         |

**Not covered here** (read-only by decision): sign-in and every owner flow (create, edit,
delete, image upload, duplicate warning, unsaved-changes guard). Those are in the manual
checklist in `docs/production-verification.md`, backed by `npm run verify:rls` (real logins,
throw-away `zz-rls-*` fixtures) and the component tests (`ItemForm`, `ConfirmDialog`,
`imageApi`, `duplicates`).
