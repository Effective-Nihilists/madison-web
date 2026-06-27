# Unified Edit Mode — design

**Date:** 2026-06-27
**Status:** approved (design); implementation pending
**Scope:** madison-web (317010.xyz) client shell + admin routing

## Problem

Editing the site is split across two disconnected concepts:

1. **In-place "edit site"** — `EditModeBar` (floating top-right, admin-only) toggles
   `editMode` for inline text editing (`Editable`), widget/sidebar drag-reorder &
   resize, and a colors/fonts customizer.
2. **`/admin` dashboard** — a separate set of CMS pages (Articles, Comments,
   Media & Music, Wheels, Galleries) reached only by typing the URL.

There is no link between them. The owner wants **one editing concept**: both
surfaces unified, linked, and reached the same way.

## Decisions (from brainstorming)

- **Direction:** one mode, both surfaces linked (keep inline editing *and* the CMS).
- **Control surface:** a **top edit bar**.
- **Visibility:** the bar appears **only in edit mode** — by default the site is
  fully public even to the admin (no persistent bar).
- **Entry:** a **small floating "edit" button**, admin-only, in a corner. Click →
  enter edit mode (raise the bar); the button hides while editing.
- **Dashboard:** **remove** the `/admin` overview grid; bar links go directly to
  each CMS section. Redirect the `admin` route → `admin/articles` for old links.
- **Contextual shortcuts:** **yes** — live pages show in-context "edit" deep-links
  to the right manager while in edit mode.
- **`editMode` lifetime:** stays **session-only / transient** (resets on reload;
  re-enter via the button). Matches current `siteConfigContext` behavior.

## Architecture

`editMode` (already in `siteConfigContext`, session-only `useState`) remains the
**single source of truth** for "am I editing." Everything keys off it. `admin`
(from `whoAmI`) gates all admin UI. No new global state is introduced.

### Components

**`EditEntryButton`** (new, or the trimmed remainder of `EditModeBar`)
- Renders `null` unless `admin`.
- Renders `null` when `editMode` is true.
- A single small floating button (corner). Click → `setEditMode(true)`.

**`EditBar`** (new)
- Renders `null` unless `admin && editMode`.
- Full-width, pinned at the top, `z-index` above `.topbar`; site content shifts
  down by the bar's height (a body/shell padding class toggled with edit mode).
- Contents:
  - `EDITING` label.
  - Section links (router `push` to existing routes): Articles
    (`admin/articles`), Comments (`admin/comments`), Media & Music
    (`admin/media`), Wheels (`admin/wheels`), and **Galleries** as a small
    dropdown listing the entry corners (`ENTRY_CORNER_KEYS`), each item pushing to
    `admin/entries/:corner`.
  - **colors & fonts** — toggles the existing customizer panel (moved out of the
    old `EditModeBar` into a standalone panel component reused here).
  - **Done** → `setEditMode(false)`.
- Rendered globally in `AppShell`, so it **persists across navigation** — both on
  live pages (inline tools active) and on CMS pages (full-page managers). One
  continuous session until "Done."
- Responsive: links wrap or horizontally scroll on narrow screens.

**`EditLink`** (new, small reusable)
- Renders `null` unless `admin && editMode`.
- A compact "edit ▸" affordance that `push`es to a manager route. Placed on:
  - Article page → `admin/articles/:id` ("edit this article")
  - Music player → `admin/media` ("manage tracks")
  - Article comments → `admin/comments` ("moderate")
  - Gallery / entry corners → `admin/entries/:corner` ("manage entries")
  - Wheel page → `admin/wheels` ("edit wheel")

**Colors & fonts panel**
- Extract the customizer markup currently inside `EditModeBar` into its own
  component; open it from `EditBar`. Behavior unchanged (`save({ theme, fonts })`).

### Inline tools — unchanged

`Editable` text, `useDragReorder`, widget resize all stay exactly as they are,
still gated on `editMode`. Only the *trigger* moves from the old floating toolbar
to the floating button + bar.

### Routing changes

- Delete `AdminDashboard.tsx`.
- Repurpose the `admin` route to **redirect** to `admin/articles` (a tiny
  component that `useRouter().push('admin/articles', {})` on mount), so existing
  bookmarks/links keep working. Keep `auth: true`.
- All `admin/*` sub-pages keep their `AdminGate` wrapper unchanged.

## Gating & edge cases

- **Non-admins:** see neither the floating button nor the bar; CMS routes remain
  `auth: true` + `AdminGate`-protected.
- **Logged-out:** unchanged — framework auth guard handles login on `admin/*`.
- **Mobile:** floating button is touch-friendly; bar links wrap/scroll; content
  offset still applies.
- **Reload while editing:** `editMode` resets (transient); the floating button
  returns. Acceptable per decision.

## Testing

- e2e (playwright): as admin → floating edit button visible → click → bar appears
  → a section link navigates to its CMS page (bar still present) → "Done" hides
  bar and returns floating button. As non-admin → neither button nor bar present.
- e2e/regression: a tall page (Tarot Guide / a CMS list) **scrolls** to the
  bottom — guards the global scroll fix shipped alongside this work.
- Unit: `EditBar` / `EditEntryButton` / `EditLink` render `null` when
  `!admin` or `!editMode`.

## Out of scope (separate follow-up spec)

- **buttons.gif custom images + links** — new collection + endpoints + admin
  manager + widget rewrite (the current 88×31 badges are hardcoded and only emit
  the now-removed toast). Once built, it slots in as a "manage buttons" `EditLink`
  + an EditBar link.

## Already shipped alongside this design (separate, smaller fixes)

- Removed the bottom-center toast pill (`shellContext` `toast` is now a no-op,
  the `.toast` element no longer renders).
- Fixed a **global scroll lock**: `index.html` had `html, body, #root { height:
  100% }`, which clipped any page taller than the viewport (Tarot Guide, the admin
  pages, etc.). Changed to `min-height: 100%` so the document grows and scrolls.
