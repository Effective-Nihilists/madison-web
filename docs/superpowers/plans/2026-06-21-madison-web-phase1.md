# madison-web — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the madison-web app shell + a self-hosted (magic-link) admin CMS that can author markdown+image blog articles, plus the public reading experience (Random Thoughts home feed, article reader, moderated comments), ported from the approved `design-mocks/v3-01-retro-earthy-milkdrop.html`.

**Architecture:** Standard ugly-app project (React SPA + Express dev server + Cloudflare Workers prod). Data in framework collections (Postgres docs). Auth is **Mode B / `auth.mode: 'self'`** (magic-link email); a single admin (Madison) is gated by an `adminUser` allowlist seeded on first login from `ADMIN_EMAIL`. Server request handlers live in ONE shared module imported by BOTH `server/index.ts` (dev) and `server/workers.ts` (prod) — the two-entry split is a known footgun. The UI is a faithful React port of the v3-01 mock: a global stylesheet + a handful of focused components (theme, Milkdrop bg, ribbon cursor, scanlines, sidebar→drawer, floating music player, widget rail, secret eggs).

**Tech Stack:** ugly-app ^0.1.652, React 18, TypeScript (no `any`), Zod 4, Butterchurn (Milkdrop) via CDN already proven in the mock, `ugly-app/markdown` for article rendering, framework `storage` for uploads.

## Global Constraints

- TypeScript only; `noExplicitAny` enforced — never add `any`.
- Every new collection: after editing `shared/collections.ts` run `pnpm run db:schema-gen && pnpm run db:migrate`.
- Every endpoint defined in `shared/api.ts` AND handled in the shared handler module wired into BOTH `server/index.ts` and `server/workers.ts` (prod deploys `workers.ts`; a handler missing there → `[Router] not registered`).
- Expensive endpoints (uploads, comment submit, magic-link) declare `rateLimit`.
- Client never reads `process.env` — use `import.meta.env.VITE_*`.
- No emojis in UI controls — inline SVG (lucide-style) icons; decorative typographic glyphs (★ ✶) allowed as ornament (matches the mock).
- Palette = muted rainbow (no neon); light = medieval book, dark = techy space. Article body must stay readable.
- Navigate with `useRouter().push(...)` / `Link`, never bare `<a href>`. Popups via `useRouter().openPopup`.
- Domain/deploy already provisioned (CF zone + Neon for 317010.xyz); deploy is out of scope for Phase 1 (local dev + tests only).

## File Structure

**Create:**
- `shared/blog.ts` — Zod schemas + types for blog domain (Article, Comment, RandomThought, MediaAsset, MusicTrack, ButtonImage), and the `CORNERS` list constant.
- `server/handlers.ts` — the single `RequestHandlers` object (public + admin), `requireAdmin`, exported for both entries.
- `server/admin.ts` — `isAdmin(db,userId)`, `seedAdminOnCreate(user)` helper.
- `client/theme.ts` — theme context (`'light' | 'dark'`, persisted), `useTheme`.
- `client/components/shell/AppShell.tsx` — top bar (HOME/READ toggle removed — real routes now; theme toggle; CRT toggle; hamburger), sidebar slot, widget rail slot, fixed layers.
- `client/components/shell/MilkdropBackground.tsx` — Butterchurn canvas + synth, always-on/audio-reactive (port of the mock's viz + audio graph; exposes `connectTrackAudio`).
- `client/components/shell/CursorRibbon.tsx` — Reading-Rainbow ribbon canvas (port).
- `client/components/shell/Scanlines.tsx` — CRT/scanline overlay + toggle.
- `client/components/shell/Sidebar.tsx` — corners nav (image-backed buttons), mobile drawer.
- `client/components/shell/WidgetRail.tsx` — visitor counter, webring, status (now-playing), 88x31 wall, marquee.
- `client/components/shell/MusicPlayer.tsx` — floating CMS player (X/reopen, transport, volume, tracks from API, `.wav/.mp4` upload in admin).
- `client/components/shell/SecretEggs.tsx` — the 5 eggs (Konami etc.).
- `client/components/Markdown.tsx` — renders article markdown via `ugly-app/markdown`.
- `client/components/Win9xWindow.tsx` — reusable beveled window panel (title bar + pixel buttons).
- `client/pages/HomePage.tsx` — REPLACE scaffold: Random Thoughts feed + recent published articles.
- `client/pages/ArticlePage.tsx` — reader: cover, markdown body, approved comments, comment form.
- `client/pages/CornerPage.tsx` — lists articles in a corner.
- `client/pages/admin/AdminGate.tsx` — wraps admin pages; shows `<MagicLinkForm>`/not-admin notice.
- `client/pages/admin/AdminDashboard.tsx`, `ArticleListPage.tsx`, `ArticleEditorPage.tsx`, `CommentModerationPage.tsx`, `MediaMusicPage.tsx`.
- `client/madison.css` — the ported global stylesheet (muted-rainbow vars, both themes, Win9x chrome, pixel scrollbar, fonts, widget styles). Imported from `client/styles.css`.

**Modify:**
- `.uglyapp` — add `auth: { mode: 'self', magicLinkExpiresMin: 15 }`.
- `shared/collections.ts` — add blog collections.
- `shared/api.ts` — add blog endpoints.
- `shared/pages.ts` + `client/allPages.ts` — add routes.
- `server/index.ts` — import shared handlers; set `onUserCreate`; keep conversation/collab as-is.
- `server/workers.ts` — import the SAME shared handlers into `requestHandlers`.
- `client/styles.css` — `@import './madison.css';` and Google Fonts.

---

## Task 1: Blog data model + collections

**Files:**
- Create: `shared/blog.ts`
- Modify: `shared/collections.ts`
- Test: `tests/unit/blog.test.ts`

**Interfaces — Produces:**
- `ArticleSchema`, `CommentSchema`, `RandomThoughtSchema`, `MediaAssetSchema`, `MusicTrackSchema`, `ButtonImageSchema`, `AdminUserSchema` (Zod) + inferred types `Article`, `Comment`, `RandomThought`, `MediaAsset`, `MusicTrack`, `ButtonImage`.
- `CORNERS: readonly { key: string; label: string }[]` — the sidebar/corner list.
- collections added: `article`, `comment`, `randomThought`, `mediaAsset`, `musicTrack`, `buttonImage`, `adminUser`.

- [ ] **Step 1: Write `shared/blog.ts`**

```typescript
import { z } from 'zod';
import type { InferDocType } from 'ugly-app/shared';

export const CORNERS = [
  { key: 'witchcraft', label: 'Witchcraft Corner' },
  { key: 'sci', label: 'Sci Corner' },
  { key: 'health', label: 'Health Corner' },
  { key: 'random', label: 'Random Thoughts' },
  { key: 'wheel', label: 'Wheel of Fortune' },
  { key: 'art', label: 'Art Blog' },
  { key: 'music', label: 'Music Player' },
  { key: 'books', label: 'Book Tracker' },
  { key: 'movies', label: 'Fav Movies' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'restaurants', label: 'Fav Restaurants' },
  { key: 'travel', label: 'Travel Map' },
  { key: 'vision', label: 'Vision Board' },
  { key: 'memes', label: 'Meme Gallery' },
  { key: 'animals', label: 'Animal Gallery' },
] as const;
export const CORNER_KEYS = CORNERS.map((c) => c.key) as [string, ...string[]];

export const ArticleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  corner: z.enum(CORNER_KEYS),
  excerpt: z.string().default(''),
  bodyMarkdown: z.string().default(''),
  coverImageUrl: z.string().nullable().default(null),
  status: z.enum(['draft', 'published']).default('draft'),
  authorId: z.string(),
  publishedAt: z.number().nullable().default(null),
});
export type Article = InferDocType<typeof ArticleSchema>;

export const CommentSchema = z.object({
  articleId: z.string(),
  name: z.string().min(1).max(60),
  body: z.string().min(1).max(2000),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});
export type Comment = InferDocType<typeof CommentSchema>;

export const RandomThoughtSchema = z.object({
  body: z.string().min(1).max(4000),
  authorId: z.string(),
});
export type RandomThought = InferDocType<typeof RandomThoughtSchema>;

export const MediaAssetSchema = z.object({
  url: z.string(),
  kind: z.enum(['image', 'audio', 'video']),
  name: z.string(),
  ownerId: z.string(),
});
export type MediaAsset = InferDocType<typeof MediaAssetSchema>;

export const MusicTrackSchema = z.object({
  title: z.string().min(1),
  url: z.string(),
  kind: z.enum(['wav', 'mp4']),
  order: z.number().default(0),
});
export type MusicTrack = InferDocType<typeof MusicTrackSchema>;

export const ButtonImageSchema = z.object({
  key: z.string(),   // e.g. corner key or button id
  url: z.string(),
});
export type ButtonImage = InferDocType<typeof ButtonImageSchema>;

export const AdminUserSchema = z.object({ email: z.string() });
export type AdminUser = InferDocType<typeof AdminUserSchema>;
```

- [ ] **Step 2: Add collections to `shared/collections.ts`** (append inside `defineCollections({ ... })`, importing the schemas):

```typescript
  article: { schema: ArticleSchema, meta: { cache: false, trackable: true, public: true, cascadeFrom: null, trackKeys: ['corner'] } },
  comment: { schema: CommentSchema, meta: { cache: false, trackable: true, public: true, cascadeFrom: 'article', trackKeys: ['articleId'] } },
  randomThought: { schema: RandomThoughtSchema, meta: { cache: false, trackable: true, public: true, cascadeFrom: null } },
  mediaAsset: { schema: MediaAssetSchema, meta: { cache: false, trackable: false, public: false, cascadeFrom: null } },
  musicTrack: { schema: MusicTrackSchema, meta: { cache: false, trackable: true, public: true, cascadeFrom: null } },
  buttonImage: { schema: ButtonImageSchema, meta: { cache: false, trackable: true, public: true, cascadeFrom: null } },
  adminUser: { schema: AdminUserSchema, meta: { cache: true, trackable: false, public: false, cascadeFrom: null } },
```

- [ ] **Step 3: Test** — `tests/unit/blog.test.ts` asserts `ArticleSchema.parse` rejects an empty title and accepts a valid corner; `CORNERS` has 15 entries.
- [ ] **Step 4: Run** `pnpm test -- blog` → PASS.
- [ ] **Step 5: Schema-gen + migrate** `pnpm run db:schema-gen && pnpm run db:migrate` (dev DB up via `pnpm run dev` Docker, or point at Neon). Verify tables `docs_article` … `docs_adminUser` exist.
- [ ] **Step 6: Commit** `feat(data): blog collections + schemas`.

## Task 2: API surface (`shared/api.ts`)

**Files:** Modify `shared/api.ts`. **Interfaces — Produces:** request names below (consumed by Task 4 handlers + client).

- [ ] **Step 1** Add to `defineRequests({...})` (use `req` for public, `authReq` for admin; import `req` from `ugly-app/shared`):

Public (`req`): `listArticles({ corner?: string })→{ articles: Article[] }`, `getArticle({ slug })→{ article: Article | null }`, `listRandomThoughts({ limit?: number })→{ thoughts: RandomThought[] }`, `listApprovedComments({ articleId })→{ comments: Comment[] }`, `submitComment({ articleId, name, body })→{ ok: boolean }` (rateLimit 5/60), `listMusicTracks()→{ tracks: MusicTrack[] }`, `listButtonImages()→{ images: ButtonImage[] }`.

Admin (`authReq`): `whoAmI()→{ admin: boolean }`, `adminListArticles()→{ articles: Article[] }`, `saveArticle({ id?: string, ...ArticleInput })→{ id: string }`, `deleteArticle({ id })→{ ok }`, `createRandomThought({ body })→{ id }`, `deleteRandomThought({ id })→{ ok }`, `adminListComments({ status? })→{ comments: Comment[] }`, `moderateComment({ id, action: 'approve'|'reject' })→{ ok }`, `uploadMedia({ kind, name, dataBase64 })→{ url: string }` (rateLimit 30/60), `addMusicTrack({ title, url, kind })→{ id }`, `deleteMusicTrack({ id })→{ ok }`, `setButtonImage({ key, url })→{ ok }`.

(Define explicit Zod input/output for each; `ArticleInput` = title, slug, corner, excerpt, bodyMarkdown, coverImageUrl, status.)

- [ ] **Step 2** Typecheck `pnpm exec tsc -p tsconfig.json --noEmit` → no errors (handlers come next; api file alone compiles).
- [ ] **Step 3: Commit** `feat(api): blog + cms endpoints`.

## Task 3: Self-hosted magic-link auth + admin allowlist

**Files:** Modify `.uglyapp`, `server/index.ts`; Create `server/admin.ts`. **Interfaces — Produces:** `isAdmin(db, userId): Promise<boolean>`, `seedAdminOnCreate(db, user): Promise<void>`.

- [ ] **Step 1** `.uglyapp` → add `"auth": { "mode": "self", "magicLinkExpiresMin": 15 }` (keep existing `projectId`).
- [ ] **Step 2** `server/admin.ts`:

```typescript
import { collections, type AdminUser } from '../shared/collections';
import { dbDefaults } from 'ugly-app/shared';

const ADMIN_EMAIL = (process.env['ADMIN_EMAIL'] ?? 'justin.mann@gmail.com').toLowerCase();

export async function seedAdminOnCreate(db: AppDb, user: { _id: string; email?: string }): Promise<void> {
  if ((user.email ?? '').toLowerCase() === ADMIN_EMAIL) {
    const doc: AdminUser = { _id: user._id, email: user.email!, ...dbDefaults() };
    await db.setDoc(collections.adminUser, doc);
  }
}
export async function isAdmin(db: AppDb, userId: string): Promise<boolean> {
  return !!(await db.getDoc(collections.adminUser, userId));
}
```

(`AppDb` = the framework db type; import from `ugly-app` — confirm the exported name during impl, fall back to a structural type `{ getDoc; setDoc }`.)

- [ ] **Step 3** In `server/index.ts` configurator: `configurator.setOnUserCreate?.(async (user) => seedAdminOnCreate(app.db, user))` (confirm hook name; README: magic-link verify "calls `onUserCreate` on first login"). Set `ADMIN_EMAIL` for Madison's real email (ask user; default placeholder for now).
- [ ] **Step 4** Manual check: `pnpm run dev`, hit `/admin` → `<MagicLinkForm>` renders (Task 11 wires the gate); requesting a link logs/sends an email in dev.
- [ ] **Step 5: Commit** `feat(auth): self-hosted magic-link + admin allowlist`.

## Task 4: Server handlers (shared across both entries)

**Files:** Create `server/handlers.ts`; Modify `server/index.ts`, `server/workers.ts`. **Interfaces — Consumes:** Task 1 collections, Task 2 requests, Task 3 `isAdmin`. **Produces:** `makeHandlers(db): RequestHandlers<typeof requests>`.

- [ ] **Step 1** Write `server/handlers.ts` exporting `makeHandlers(db)` implementing every Task-2 request. Public reads query published articles / approved comments. Admin handlers call `requireAdmin(db, userId)` (throws `Error('forbidden')` if `!isAdmin`). `uploadMedia` writes via framework `storage` (follow `client/pages/UploadTestPage.tsx` + `use uploads` skill pattern) and records a `mediaAsset`. `saveArticle` upserts by id (nanoid when new), sets `publishedAt` when status flips to published. `submitComment` writes `status:'pending'`.
- [ ] **Step 2** `server/index.ts`: replace the inline todo handlers object with `{ ...makeHandlers(app.db) }` (keep todo/test handlers if desired or drop). Keep conversation/collab blocks.
- [ ] **Step 3** `server/workers.ts`: `const requestHandlers: Partial<RequestHandlers<typeof requests>> = makeHandlers(app.db);` (the workers `app.db` is available after `createWorkersApp`; if `app` isn't in scope at literal time, use the same lazy pattern as `setOnAfterStart`). Verify BOTH entries register the same names.
- [ ] **Step 4: Test** `tests/unit/handlers.test.ts` — drive `makeHandlers(fakeDb)` directly: `saveArticle` then `getArticle` returns it; `submitComment` creates pending; admin-only handler throws for non-admin userId. Use an in-memory fake db `{ getDoc, setDoc, deleteDoc, query }`.
- [ ] **Step 5** `pnpm test` → PASS; `pnpm exec tsc --noEmit` clean.
- [ ] **Step 6: Commit** `feat(server): shared blog/cms handlers in both entries`.

## Task 5: Global stylesheet + theme (port from v3-01)

**Files:** Create `client/madison.css`, `client/theme.ts`; Modify `client/styles.css`. **Produces:** `ThemeProvider`, `useTheme()`.

- [ ] **Step 1** Extract the `<style>` block + Google Fonts links + muted-rainbow CSS vars + both `data-theme` themes + Win9x chrome + pixel scrollbar + widget/marquee/star styles from `design-mocks/v3-01-retro-earthy-milkdrop.html` into `client/madison.css`. Scope away anything that fought React (no global `overflow:hidden` on body that breaks routing scroll — verify).
- [ ] **Step 2** `client/theme.ts`: context storing `'light'|'dark'` in `localStorage('madison-theme')`, sets `document.documentElement.dataset.theme`. Default `light`.
- [ ] **Step 3** `client/styles.css`: `@import './madison.css';`.
- [ ] **Step 4** Manual: wrap app (Task 9 shell), toggle flips `data-theme`, both themes render. Commit `feat(ui): global madison stylesheet + theme`.

## Task 6: Background layers — Milkdrop, ribbon cursor, scanlines

**Files:** Create `client/components/shell/{MilkdropBackground,CursorRibbon,Scanlines}.tsx`. **Produces:** `<MilkdropBackground ref>` exposing `connectTrackAudio(el: HTMLMediaElement)`; `<CursorRibbon/>`; `<Scanlines enabled/>`.

- [ ] **Step 1** Port the mock's Butterchurn init + Web-Audio synth into `MilkdropBackground.tsx` (load Butterchurn from CDN via a `<script>`/dynamic import; guard SSR/Workers — client-only via `useEffect`). Always-on render loop; `connectAudio(filter)`. Expose a method to connect a real `<audio>`/`<video>` element's MediaElementSource for CMS tracks.
- [ ] **Step 2** Port the Reading-Rainbow ribbon canvas into `CursorRibbon.tsx` (coarse-pointer guard, rAF, resize).
- [ ] **Step 3** Port scanline/CRT overlay into `Scanlines.tsx` with an `enabled` prop.
- [ ] **Step 4** Manual: render all three behind a test page — viz animates from load, ribbon follows cursor, scanlines subtle. Commit `feat(ui): milkdrop bg + ribbon cursor + scanlines`.

## Task 7: Floating CMS music player

**Files:** Create `client/components/shell/MusicPlayer.tsx`. **Consumes:** `listMusicTracks`, `MilkdropBackground.connectTrackAudio`. 

- [ ] **Step 1** Port the floating bottom-left player (X/reopen tab, transport, volume) from the mock. Replace the demo synth-as-track with real tracks from `listMusicTracks()` played through a hidden `<audio>` (supports `.wav`) / `<video>` (for `.mp4` audio); pipe its MediaElementSource into the Milkdrop viz so it reacts to the actual track. When no tracks, fall back to the ambient synth.
- [ ] **Step 2** Status box / now-playing emits current track (shared via a small context) for the widget rail.
- [ ] **Step 3** Manual: with a seeded track, Play drives audio + viz reacts. Commit `feat(ui): cms-driven floating music player`.

## Task 8: Sidebar (+ mobile drawer) and Widget rail + secret eggs

**Files:** Create `client/components/shell/{Sidebar,WidgetRail,SecretEggs}.tsx`, `client/components/Win9xWindow.tsx`. **Consumes:** `CORNERS`, `listButtonImages`.

- [ ] **Step 1** `Win9xWindow.tsx` reusable beveled panel (title bar text + pixel `_ □ ×`).
- [ ] **Step 2** `Sidebar.tsx` — corners as image-backed buttons (use `buttonImage` url by corner key, picsum fallback), `Link` to `corner/:corner`; hamburger drawer under 768px (port the mock's drawer behavior).
- [ ] **Step 3** `WidgetRail.tsx` — visitor counter, fake webring, status/now-playing, 88x31 wall, marquee (all from the mock, CSS-only).
- [ ] **Step 4** `SecretEggs.tsx` — the 5 eggs incl. Konami (port).
- [ ] **Step 5** Manual + commit `feat(ui): sidebar drawer + widget rail + secret eggs`.

## Task 9: App shell + routing wiring

**Files:** Create `client/components/shell/AppShell.tsx`; Modify `shared/pages.ts`, `client/allPages.ts`, `client/main.tsx`. 

- [ ] **Step 1** `AppShell.tsx` composes ThemeProvider + fixed layers (Milkdrop, Scanlines, CursorRibbon, MusicPlayer) + top bar (brand, theme toggle, CRT toggle, hamburger) + Sidebar + `{children}` content column (calm "document window") + WidgetRail + SecretEggs.
- [ ] **Step 2** `shared/pages.ts` add: `'article/:slug'` (auth:false), `'corner/:corner'` (auth:false), `'admin'` (auth:true), `'admin/articles'`, `'admin/articles/new'`, `'admin/articles/:id'`, `'admin/comments'`, `'admin/media'` (all auth:true). Keep `''` (auth:false).
- [ ] **Step 3** `client/allPages.ts` map each to its component (Tasks 9–14). Wrap `RouterView` in `AppShell` in `client/main.tsx`'s `render`.
- [ ] **Step 4** `pnpm exec tsc --noEmit` clean; `pnpm run dev` boots, `/` renders the shell. Commit `feat(ui): app shell + routes`.

## Task 10: Home page

**Files:** `client/pages/HomePage.tsx` (replace scaffold). **Consumes:** `listRandomThoughts`, `listArticles`.

- [ ] **Step 1** Featured most-recent Random Thought + a list of recent published articles (Link to `article/:slug`), styled per mock. Commit `feat(home): random thoughts feed + recent articles`.

## Task 11: Article reader + markdown + comments

**Files:** Create `client/pages/ArticlePage.tsx`, `client/components/Markdown.tsx`. **Consumes:** `getArticle`, `listApprovedComments`, `submitComment`, `ugly-app/markdown`.

- [ ] **Step 1** `Markdown.tsx` renders `bodyMarkdown` via `ugly-app/markdown` (confirm export; fallback to a minimal safe renderer if needed) — images, headings, blockquote, lists.
- [ ] **Step 2** `ArticlePage.tsx` — cover, title/byline, markdown body in a readable document window, approved comments, and a moderated comment form (name + body → `submitComment`, shows "reviewed before they appear").
- [ ] **Step 3** Commit `feat(blog): article reader + markdown + comments`.

## Task 12: Admin gate + dashboard

**Files:** Create `client/pages/admin/{AdminGate,AdminDashboard}.tsx`. **Consumes:** `whoAmI`, framework `<MagicLinkForm>`/auth.

- [ ] **Step 1** `AdminGate` — if unauthenticated, render the framework magic-link login; if authed but `whoAmI().admin === false`, show "not authorized"; else render children. Dashboard links to articles/comments/media. Commit `feat(admin): gate + dashboard`.

## Task 13: Article editor (markdown + image upload)

**Files:** Create `client/pages/admin/{ArticleListPage,ArticleEditorPage}.tsx`. **Consumes:** `adminListArticles`, `saveArticle`, `deleteArticle`, `uploadMedia`.

- [ ] **Step 1** List with new/edit/delete. Editor: title, slug (auto from title), corner select, excerpt, cover image upload, markdown textarea with a live `<Markdown>` preview, image upload that inserts `![](url)`, draft/publish toggle → `saveArticle`. Commit `feat(admin): article editor with markdown + image upload`.

## Task 14: Comment moderation + media/music managers

**Files:** Create `client/pages/admin/{CommentModerationPage,MediaMusicPage}.tsx`. **Consumes:** `adminListComments`, `moderateComment`, `addMusicTrack`, `deleteMusicTrack`, `uploadMedia`, `setButtonImage`, `listButtonImages`.

- [ ] **Step 1** Pending comments → approve/reject. Music: upload `.wav/.mp4` → `uploadMedia` → `addMusicTrack`; list/delete. Button images: upload + `setButtonImage(key,url)` for each corner. Commit `feat(admin): moderation + media/music/button managers`.

## Task 15: e2e smoke + seed

**Files:** Modify `tests/e2e/smoke.spec.ts`; Create `tests/e2e/blog.spec.ts`.

- [ ] **Step 1** Playwright: home renders shell + theme toggle works; an article page renders markdown; submitting a comment shows the "reviewed" message; admin route shows login when logged out. Use the framework's e2e auth fixture (mint a session for the admin) to test create-article → it appears on home. Commit `test(e2e): blog + shell smoke`.

---

## Later phases (outline — separate plans)
- **Phase 2 — Witchcraft Corner:** tarot card guide (data-driven), "my decks" gallery, digital oracle (random draw + AI reading via `uglyBotRequest`), spells/herbs guides (just articles in the corner + structured herb entries).
- **Phase 3 — Wheel of Fortune:** spinnable wheel with presets (bored-activities by energy level, tarot) + customizable entries (collection-backed).
- **Phase 4 — Sci/Health corners:** essay blog corners (reuse blog), guided-breathing animated geometric visual (canvas), med-plants guide.
- **Phase 5 — Collections/trackers:** books (in-progress visual), movies+recc box, recipes, restaurants, travel been/wishlist map, vision board, meme gallery (filters+search), animal gallery (Cosmoo & kitties + fun facts).
- **Phase 6 — Polish/deploy:** resume `pnpm exec ugly-app publish` (adopts existing CF zone + Neon), e2e on the deployed worker, store listing.

## Self-Review notes
- Spec coverage: shell/themes/milkdrop/cursor/player/secret-eggs (Tasks 5–9), CMS markdown+image (13), own magic-link login (3,12), moderated comments (11,14), music upload (14), CMS button images (8,14), corners scaffold (8,9 + CornerPage). Wheel/oracle/trackers deferred to later phases (scope).
- Two-entry handler footgun explicitly handled (Task 4).
- Confirm-during-impl items flagged inline: exact `onUserCreate` hook name, `AppDb` exported type, `ugly-app/markdown` render export, storage upload API. These are small framework-API confirmations, not design gaps.
