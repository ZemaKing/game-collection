# Production verification — owner flows (manual)

The E2E suite (`e2e/`, ROADMAP Phase 40) is **read-only by decision** (Open decision 3), so the
flows that write are checked by hand. Run this checklist after a release that touches forms,
images, auth or the database (and in Phase 41's final sweep), signed in as the owner. Use
throw-away items named **`ZZ check …`** and delete them at the end, so the live collection is
left as it was.

Automated backing for the same rules: `npm run verify:rls` (anon and non-admin writes refused,
admin CRUD works), and the component/unit tests for `ItemForm` (validation, submit, unsaved-
changes guard), `ConfirmDialog`, `imageApi` (WebP upload and rollback order) and `duplicates`.

Do each flow at **Desktop**, then spot-check **Tablet** and **Mobile** (the form's mobile
Back/Next/Save bar and the bottom tab bar's + button).

## Sign in / out

- [ ] `/login` with the owner account → signed in; the + "Add New Item" button and the ⋮ "More actions" button next to each grid card's title (Edit, Delete) appear
- [ ] A signed-out visitor sees neither; `/games/<id>/edit` redirects to `/login`
- [ ] Sign out → back to the public view

## Create

- [ ] `/items/new` → Game → fill title, platform, genre, condition → Save → lands on the new detail page with everything shown
- [x] The RAWG autofill finds a game and imports its cover plus up to 3 screenshots (cover first, the cover marked as cover), each stored as `.webp` + `.thumb.webp` + `.small.webp` (the Phase 36 open check)
- [ ] One more type with its own fields (e.g. a Figure: manufacturer, character, scale)

## Duplicate warning

- [x] Add a second Game titled exactly like the first (different case/spaces, e.g. `zz CHECK game `) → "This might already be in your collection" lists it
- [x] "View Existing" opens it; "Add Anyway" saves the duplicate (then delete it)
- [x] A DLC titled "Season Pass" on a game without one doesn't warn about other games' Season Passes

## Edit and the unsaved-changes guard

- [x] Edit → change the title → Save → the detail page shows the change
- [x] Edit → change a field → click a sidebar link → "Discard changes?" → Cancel keeps you on the form with the change; confirming leaves without saving
- [x] A page reload or tab close while dirty asks the browser's own "Leave site?" question (the browser Back button is deliberately not guarded — `useUnsavedChangesGuard`)

## Images

- [x] Upload a phone photo (~4–8 MB JPEG) and a transparent PNG → each tile goes queued → optimising → uploading → done; the stored files are WebP (~100–200 KB full + a `.thumb.webp`)
- [x] Set a different cover → the card and the detail page use it
- [x] Edit alt text, replace a file, delete one image → the Storage objects of a deleted image are gone (Dashboard → Storage)
- [x] Open the viewer on the new item: next/previous, zoom, swipe on a phone

## Delete

- [x] Delete each `ZZ check …` item from its detail page → confirm dialog → gone from the listing; its images are gone from Storage
- [x] Nothing named `ZZ check` remains (`/items?q=zz+check` shows the empty state)

## Record

| Date | Release / commit | Result | Notes |
| --- | --- | --- | --- |
| 2026-10-10 | `47529a6` (production) | Pass | Owner: RAWG autofill (cover + 3 screenshots, each `.webp` + `.thumb.webp` + `.small.webp`), duplicate warning, edit + unsaved-changes guard, images, delete. Not yet recorded: sign in/out, plain create, the Tablet/Mobile spot-check |
