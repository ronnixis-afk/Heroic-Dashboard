# Admin Pages

Shared conventions for all routes under `/admin`.

## Layout Pattern

```tsx
<div className="page">
  <PageHeader title="..." description="..." actions={...} />
  {/* StatusBanner when needed */}
  {/* content cards / tables */}
</div>
```

## Header Notifications

- Bell in `AdminLayout` opens generic `NotificationPanel`
- Inbox: `useNotifications` aggregates pluggable sources under `src/lib/notifications/sources/`
- Current source: `signupSource` (recent `User` inserts → `/admin/users?userId=`)
- Shared model: `AdminNotification` (`type`, `title`, `body`, `href`, `badge`, `createdAt`)
- Unread via `localStorage` key `heroic.admin.notifications.lastSeenAt`; badge only when `unreadCount > 0`
- To add a feed: implement a source hook returning `NotificationSourceResult`, register it in `useNotificationSources()`

Use primitives from `src/components/ui/`:

- `PageHeader`, `Card`, `FilterTabs`
- `StatusBanner`, `EmptyState`, `PageLoader`, `CountPendingControl`, `StatCard`, `ErrorBoundary`

Stay on the three-tier type scale in `Design.md` / `src/index.css` (`text-xs`, `text-title`, `text-header`). Prefer `.help-text`, `.stat-label`, `.status-banner-*`, and badge classes over ad-hoc sizes or colors.

## Routes

| Route | Page | Notes |
|-------|------|-------|
| `/admin` | Dashboard | Revenue + acquisition overview |
| `/admin/users` | Users | Sync, export (current filter, up to 2,000 rows), server-side search/pagination (`USERS_PAGE_SIZE` = 50), tier/credits/date filters, cloud save stats |
| `/admin/reports/audience` | Audience Reports | Active users (incl. MAU), retention, churn → Users (`?userId=`) |
| `/admin/analytics` | Live Analytics | Sessions, cost, latency; RPG + Supabase metrics |
| `/admin/reports/usage` | Usage Reports | Product Surfaces + feature-usage API (unique users / duration) |
| `/admin/reports/financial` | Financial Reports | Revenue + cost-analytics API (model latency) |
| `/admin/credits` | Credits | Grants + adjustment history |
| `/admin/news` | Global News & Patch Notes | Hook: `useNews` → RPG `/api/admin/news*` + `/api/admin/app-version` (Clerk session). Realtime invalidate via `getAdminSupabase`. URL fields validated with `isSafeHttpUrl`. |
| `/admin/roadmap` | Product Roadmap | Hook: `useRoadmap` → RPG `/api/admin/roadmap*` CRUD (Clerk session). Realtime via `getAdminSupabase`. Fields: title, summary, phase, status, category, featured, published, sortOrder. RPG public `GET /api/roadmap-items` for marketing site. |
| `/admin/media` | Media Library | Storage upload via Supabase (`getAdminSupabase` + RLS); `ImageAsset` metadata CRUD/list via RPG `/api/admin/image-assets*`. Media grid thumbnails and lightbox details use raw `publicUrl` with CSS sizing and `loading="lazy"`; Supabase Image Transformations (`/storage/v1/render/image/...`) are disabled via `getOptimizedThumbnailUrl` (`src/lib/thumbnailUtils.ts`) to avoid burning storage transform quota. Facet counts hydrate from a local watermark cache (`heroic.admin.imageAssetFacets.v1`) and sync through `GET /api/admin/image-assets/facets?since=&knownCount=` so only rows with a newer `updatedAt` are fetched; unchanged libraries return `{ unchanged: true }` without paging the catalog. First visit still blocks Genre / Asset Type / Gender / Race with `CountPendingControl` until the snapshot arrives. Local uploads/edits/deletes patch the cache immediately. Genre-scoped dropdown counts and the Fantasy/Modern/Sci-Fi library filter include `Any Genre` assets (same fallback pool as live matching) — most Monster Portraits, Zone Images, and Power Images are tagged Any Genre. Dynamic realm race discovery via `/api/admin/image-assets/discovered-races` with "Needs Artwork" zero-portrait filter. Race counts in portrait upload and the Needs Artwork filter use `getRacePortraitCount` (`src/lib/raceAliasUtils.ts`) with case-insensitivity and equivalent alias resolution (e.g. Werewolf ↔ Lycanthrope, Halfling/Gnome composites, subrace parent stems), with genre-scoped uncovered counts. The Character Portrait **Race dropdown is genre-scoped**: DB catalog names come from `getDbRaceNamesForGenre` (`raceAliasUtils.ts`) — only races whose `genres` include the form Genre (multi-genre races appear under each; empty `genres` ⇒ Fantasy), while `Any Genre` lists the full catalog union. The full `useRaceCatalog()` stays loaded for name / `metadata.raceId` matching across genres when editing assets; only the options list is filtered. Picking a **matched catalog race** shows the same editable Fly / Climb / Swim checklist as a new race label, prefilled from catalog speeds; saving PATCHes `updateRace(id, { flySpeed, climbSpeed, swimSpeed })` only when speeds changed (Human locked at 0; old realm stamps untouched), with an "Open In Race Catalog" link to `/admin/races`. Character Portrait uploads can set **Secondary Imagery** (genre + race → fallback library race) via `/api/admin/image-assets/race-secondary-imagery`; live matching prefers the race's own portraits, then the selected race. Zone Image uploads use **Terrain Type** (`metadata.terrainType`), not narrative zone properties. |
| `/admin/monsters` | Monsters | Hook: `useMonsterCatalog` → RPG `/api/admin/monster-types*`. Desktop master-detail: sticky catalog (search, status, genre) + type identity form + expandable subtype table. Edits type/subtype identity and enabled flags; combat templates stay unchanged. |
| `/admin/races` | Races | Hook: `useRaceCatalog` → RPG `/api/admin/races*`. Full Race CMS table for illustrated archetypes, genres, appearance/themes defaults, and racial movement checklist (Fly / Climb / Swim). Edits persist to DB; old stamped realms are never mutated. |
| `/admin/feedback` | User Feedback | Bug/suggestion inbox |
| `/admin/surveys` | User Surveys | Multi-survey insights picker; each catalog survey has its own averages, distributions, and response list (`SurveyResponse.surveyId`) |
| `/admin/emails` | Email Templates | Hook: `src/hooks/useEmails.ts` → RPG `/api/admin/emails/*` |
| `/admin/public-realms` | Public Realms | Moderation for community-shared realms. Hook: `src/hooks/usePublicRealms.ts` → RPG `/api/admin/public-realms/*`. Open report queue (hide realm / resolve / dismiss), listings table with status filter + hide/restore, and Reconcile Counters (repairs denormalized play/like counts from fact tables). Hiding never deletes player copies. |
| `/admin/settings` | System Settings | Caps, referrals, analytics admin-testing exclusion toggle (`exclude_admin_from_analytics`), **AI Role Routing** matrix, NPC image source (`database` default / `nano_banana_2_lite`) |

## AI Role Routing

System Settings renders a per-role matrix (Assessor, Utility, Architect, Narrator, World Builder) instead of a single text model picker. Hook: `src/hooks/useAiConfig.ts` → RPG `/api/admin/ai-config`.

- `GET` returns the model catalog (with credit multipliers and USD rates), role metadata + code defaults, model stacks, effective assignments, and stored overrides.
- Each row edits Primary Model, Fallback Model, and Timeout (ms; empty = no deadline). Dropdowns are populated from the catalog — never hardcode model names in the dashboard.
- `buildRoleOverridePayload` sends **only values that differ from the server defaults**, so untouched roles keep tracking the RPG's code defaults instead of being frozen at today's values. Saving with no deviations clears the overrides (an effective reset).
- The RPG validates every payload (unknown role, non-catalog or image-only model, or timeout outside 0–120000 ms returns a 400) and invalidates its resolver cache on write.
- `setCatalogRatesFromApi` feeds the same catalog rates into `src/lib/costCalculator.ts` so dashboard cost math matches the server.
- The legacy `default_model` key is intentionally **not** written by this page; roles own text routing.

## Monster Portrait Catalog Sync

- **Source of truth:** `heroic-ai-rpg/src/constants/monsterTypes.ts` (names, descriptions, subtypes).
- **Dashboard copy:** `src/constants/monsterPortraitCatalog.ts` — auto-generated; do not edit by hand (used as an offline/stale fallback).
- **Sync command:** `npm run sync:monster-catalog` (also runs optionally on `predev` / `prebuild` when the RPG sibling repo is present).
- **Override path:** set `HEROIC_RPG_ROOT` if the RPG repo is not at `../Heroic AI RPG/heroic-ai-rpg`.
- After changing monster types/subtypes/descriptions in the RPG (or adding new ones), run the sync and commit the regenerated catalog so deploys stay current.
- Monsters and some portrait dropdowns prefer RPG `/api/admin/monster-types*` live data; the generated catalog remains the non-ideal fallback.
- Media uploads store stable portrait identity on the ImageAsset:
  - `metadata.monsterTypeId` + `metadata.monsterSubtypeId` (stable DB ids)
  - `metadata.monsterType` + `metadata.monsterSubtype` (denormalized names for UI/search/tagging)
  - Matching prefers the ids and falls back to names for legacy assets.

## Rideable Portrait Catalog Sync

- **Source of truth:** `heroic-ai-rpg/src/constants/rideableCatalog.ts` (60 genre-scoped mounts/vehicles/ships: Fantasy mounts/ships, Modern 12 vehicles + ships, Sci-Fi all).
- **Dashboard copy:** `src/constants/rideablePortraitCatalog.ts` — auto-generated; do not edit by hand.
- **Sync command:** `npm run sync:rideable-catalog` (also runs optionally on `predev` / `prebuild`).
- After changing rideable names/categories in the RPG, run the sync and commit the regenerated catalog.
- **Upload dropdowns:** Mount / Vehicle / Ship template selects use catalog order for the selected genre only (do not mix orphan types from other genres). In-game Stables = Mount Portrait list; Garage = Vehicle Portrait list; Shipyard = Ship Portrait list.

## Item Image Catalog Sync

- **Genre-scoped Weapons & Protection:** Art Family dropdown options for **Weapons** and **Protection** depend on upload **Genre** (Fantasy / Modern / Sci-Fi), same pattern as rideable types. Any Genre defaults the list to Fantasy. Other item categories stay shared across genres.
- **Art families:** Weapons and Protection upload templates are **family names**, not every mechanical chassis. `ITEM_ART_FAMILIES_BY_GENRE` maps retired members (e.g. Fantasy Composite Bow → Longbow; Sci-Fi Plasma Rifle → Laser Rifle; Modern Soft Body Armor → Kevlar Vest) so the dropdown is shorter; generation still uses full blueprint counts. After changing families, run the sync and apply the Supabase remap migration if subtypes were retired.
- **Weight categories:** Sync also writes `ITEM_WEIGHT_CATEGORY_BY_GENRE` (Light / Medium / Heavy / Shield) from weapon loot tags and `armorStats.armorType`. Art Family option labels for Weapons/Protection show e.g. `Light - Laser Pistol` (family name only in the dropdown; display only — not uploaded as a tag).
- **Source of truth:** RPG loot blueprints — `weaponLootTemplates.ts`, `armorLootTemplates.ts`, and `utilityLootTemplates.ts` (per-genre Fantasy / Modern / Sci-Fi tables), `itemRegistry.ts` (`LOOT_TABLES`), `itemArtFamilies.ts` (`ITEM_ART_FAMILIES_BY_GENRE`), and `materials.ts` typeTags. Runtime helper: `heroic-ai-rpg/src/constants/itemPortraitCatalog.ts`.
- **Dashboard copy:** `src/constants/itemPortraitCatalog.ts` — auto-generated; do not edit by hand.
- **Sync command:** `npm run sync:item-catalog` (also runs optionally on `predev` / `prebuild`).
- After adding/renaming item chassis templates or art families in the RPG, run the sync and commit the regenerated catalog.
- **Upload dropdowns:** Item Image → Genre → Item Category (Weapons, Protection, …) then **Art Family** (family name only for that genre, with rolled-up image counts; Weapons/Protection labels include weight category and sort Light → Medium → Heavy → Shield — no chassis aliases in the option text). Selecting a Weapons/Protection/Consumables family shows a full-width “Applies To: …” list (comma-separated chassis / aliases that share the image). Match keys: `genre` + `metadata.itemCategory` + `metadata.itemSubtype` (family) → RPG `Item.imageUrl` via `templateName` folded through `resolveItemArtFamily(name, genre)`.

## Power Image Catalog Sync

- **Source of truth:** RPG `src/constants/powerImageCatalog.ts` (folder categories, including `POWER_IMAGE_DAMAGE_CATEGORIES`) and `src/types/Core.ts` (`DAMAGE_TYPES`; status subtypes = `DEBUFF_STATUS_EFFECTS` minus Unconscious / Surprised, matching `POWER_DEBUFF_STATUS_EFFECTS`).
- **Dashboard copy:** `src/constants/powerImageCatalog.ts` — auto-generated; do not edit by hand.
- **Sync command:** `npm run sync:power-catalog` (also runs optionally on `predev` / `prebuild` when the RPG sibling repo is present).
- After adding/renaming damage types or power status debuffs in the RPG, run the sync and commit the regenerated catalog.
- **Upload dropdowns:** Any Genre (or Fantasy / Modern / Sci-Fi) → Power Image → Power Category (`Single Damage`, `Multi Damage`, `Single Status`, `Multi Status`) then Power Subtype (damage types for Damage categories; combat status debuffs for Status categories). Match keys: `genre` + `metadata.powerCategory` + `metadata.powerSubtype` → RPG `Ability.imageUrl`.

## Origin Item Catalog

- **Source of truth:** RPG origin story ids and keepsake definitions in `heroic-ai-rpg/src/config/startingStories.ts` used by `GET /api/image-assets/origin-item-defaults?startingStoryId=…` (`humble_beginnings`, `the_drifter`, `the_blank_slate`, `the_pariah`, `the_fallen_house`).
- **Dashboard copy:** `src/constants/originItemCatalog.ts` — auto-generated via `scripts/extract-origin-item-catalog.mjs`.
- **Sync command:** `npm run sync:origin-item-catalog` (also runs optionally on `predev` / `prebuild` when the RPG sibling repo is present).
- **Upload dropdowns:** Origin Item (forces Genre = Any Genre) → Origin Item (`{name} ({storyTitle})` dropdown options, with full visual description card when selected). One picture per origin keepsake. Match keys: `assetType: "Origin Item"` + `genre: "Any Genre"` + `metadata.startingStoryId` → RPG origin keepsake `imageUrl`. Do not upload Origin Item as Item Image.

## Zone Image Catalog

- **Source of truth:** RPG `src/constants/terrainConfig.ts` (`GENRE_TERRAIN_MAP`).
- **Upload dropdowns:** Zone Image → Genre → **Terrain Type** (Fantasy/Modern: Plains, Forest, Swamp, Desert, Mountain, Coastal, Underwater, Airborne; Sci-Fi: Orbital, Asteroid Field, Deep Space, Nebula Core, Warp Rift, Planetary Surface). Any Genre lists all unique terrains.
- Match keys: `genre` + `metadata.terrainType` → RPG `MapZone.imageUrl` via `zone.terrainType`. Do not tag zone images with narrative zone properties (Mana Density, etc.).

## Insights Data Sources

Analytics / PII views are **not** readable via PostgREST (anon grants revoked). All metric reads go through Clerk-gated RPG admin APIs (`fetchRpgAdmin` → `/api/admin/analytics/*`) using the **standard Clerk session token**. Admin gate is server-verified via `/api/admin/whoami` (`AuthContext.isAdmin`). Use `getAdminSupabase` (Supabase JWT template, **no anon fallback**) only for remaining PostgREST tables / realtime (`User`, `Feedback`, `SurveyResponse`, `CreditAdjustment`). News, Roadmap, ImageAsset metadata, and app version go through RPG `/api/admin/*`.

| Surface | Primary sources |
|---------|-----------------|
| Audience | RPG `active-users`, `retention`, `churn-signals`; dashboard metrics API for tiers & signups |
| Live Analytics | RPG `/api/admin/analytics/overview` (consolidated 60s cached bundle, with individual `view-data` / `session-length` / `messages-per-user` / `feature-usage` fallback); Engine Health via `/api/admin/telemetry` + `/api/analytics/behavior`. Engine Health also renders a **Model Routing Health** table from `telemetry.byRole` (calls, p50/p95 latency, failover rate, model seen) |
| Usage Reports | RPG `feature-usage` (unique users / avg duration) + `view-data` cost merge; Product Surfaces from usage views |
| Financial | RPG `dashboard-metrics` + `cost-analytics` / `view-data` model-usage. `cost-analytics` also returns `byRole` (cost, tokens, latency, failover per role) and an overall `failoverRate`, surfaced via `useCostAnalytics` / `useAnalyticsMetrics` |
| Users list | Supabase `User` (+ RLS) for rows; RPG `view-data?resource=save-sizes` for cloud save stats |

Churn rows deep-link to `/admin/users?userId=` (opens `UserDetailModal`). AdminMedia is operations-only (no reporting KPIs).

## Production Verification

- `npm run test:e2e:production` runs authenticated Playwright smoke coverage against the production dashboard.
- The suite requires `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and optionally `E2E_ADMIN_EMAIL` (defaults to the configured super admin).
- Coverage includes all analytics/report pages, admin data pages, RPG API status/payload checks, unauthenticated rejection, and production CORS preflight.

## Email Templates

- Templates, low-credit threshold, test send, and recent send logs
- Keys include `welcome`, `subscription_purchase`, `credits_low`, `credit_adjustment`, `feedback_received`, `feedback_admin`
- Resend API key stays on the RPG server only

## Race Catalog CMS & Movement Defaults

- **Source of truth:** DB `Race` table (managed via `/admin/races` and Media Library portrait uploads).
- **Runtime adapter:** `heroic-ai-rpg/src/constants/raceArchetypes.ts` hydrates dynamic catalog from DB (`/api/race-catalog`) with in-memory cache, falling back to static code seeds when offline.
- **Portrait upload checklist (Character Portrait only; NPC Portrait has no race field):**
  - Typing a **new** race label presents a multi-select **Fly / Climb / Swim** checklist; upload runs `createRace` with the form genre (`Any Genre` ⇒ Fantasy) + chosen speeds.
  - Picking an **existing** catalog race shows the same checklist prefilled from `flySpeed` / `climbSpeed` / `swimSpeed` (>0 ⇒ checked). On save, if speeds differ, `updateRace(id, { flySpeed, climbSpeed, swimSpeed })`; unchanged speeds never PATCH. Human shows a locked "No Extra Movement" note (RPG API forces 0).
  - Checked movement modes default to **30 ft** (editable); payload clamp is **0 (unchecked) or 5–60 ft**.
  - Persists on the `Race` record and links image asset metadata via `metadata.raceId`.
  - Help text: *Racial Extras Only; Stacks With Traits And Magic Items.* Matched races add: *Saving Updates The Race Catalog For New Worlds; Existing Realms Keep Their Stamped Speeds.*
  - Dropdown DB names are genre-scoped via `getDbRaceNamesForGenre` (empty `genres` ⇒ Fantasy; `Any Genre` ⇒ full union).
- **Playtime stamping:**
  - World creation copies catalog movement speeds onto realm lore snapshot JSON (with optional `catalogRaceId`).
  - Editing catalog movement later in the Dashboard does **not** alter or mutate existing world saves or public realm snapshots.
  - Runtime actor movement calculations (`getActorEffectiveSpeed`) read base speeds directly from the actor without live DB queries.
