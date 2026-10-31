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
| `/admin/media` | Media Library | Storage upload via Supabase (`getAdminSupabase` + RLS); `ImageAsset` metadata CRUD/list via RPG `/api/admin/image-assets*`. Media grid thumbnails and lightbox details use raw `publicUrl` with CSS sizing and `loading="lazy"`; Supabase Image Transformations (`/storage/v1/render/image/...`) are disabled via `getOptimizedThumbnailUrl` (`src/lib/thumbnailUtils.ts`) to avoid burning storage transform quota. Facet counts hydrate from a local watermark cache (`heroic.admin.imageAssetFacets.v1`) and sync through `GET /api/admin/image-assets/facets?since=&knownCount=` so only rows with a newer `updatedAt` are fetched; unchanged libraries return `{ unchanged: true }` without paging the catalog. First visit still blocks Genre / Asset Type / Gender / Race with `CountPendingControl` until the snapshot arrives. Local uploads/edits/deletes patch the cache immediately. Genre-scoped dropdown counts and the Fantasy/Modern/Sci-Fi library filter include `Any Genre` assets (same fallback pool as live matching) — most Zone Images and Power Images are tagged Any Genre. **Mixed** genre (`MIXED_IMAGE_GENRE`, Monster Portrait only; picking it forces the asset type) is the shared library for non-humanoid subtypes whose effective genres are not exactly one. `src/lib/monsterPortraitGenreBuckets.ts` decides the Monster Type / Subtype dropdowns from live subtype `genres`: Mixed lists shared non-humanoids only; Fantasy / Modern / Sci-Fi list Humanoids under each spawn genre plus single-genre non-humanoids; Any Genre lists everything. The generated fallback catalog has no genres, so lists stay unfiltered until the live catalog loads. Mixed counts are not folded into the specific genres. The RPG match route serves Mixed art to every spawn genre of a shared subtype. Dynamic realm race discovery via `/api/admin/image-assets/discovered-races` with "Needs Artwork" zero-portrait filter. Race counts in portrait upload and the Needs Artwork filter use `getRacePortraitCount` (`src/lib/raceAliasUtils.ts`) with case-insensitivity and equivalent alias resolution (e.g. Werewolf ↔ Lycanthrope, Halfling/Gnome composites, subrace parent stems), with genre-scoped uncovered counts. The Character Portrait **Race dropdown is genre-scoped**: DB catalog names come from `getDbRaceNamesForGenre` (`raceAliasUtils.ts`) — only races whose `genres` include the form Genre (multi-genre races appear under each; empty `genres` ⇒ Fantasy), while `Any Genre` lists the full catalog union. The full `useRaceCatalog()` stays loaded for name / `metadata.raceId` matching across genres when editing assets; only the options list is filtered. Picking a **matched catalog race** shows the same editable Fly / Climb / Swim checklist as a new race label, prefilled from catalog speeds; saving PATCHes `updateRace(id, { flySpeed, climbSpeed, swimSpeed })` only when speeds changed (Human locked at 0; old realm stamps untouched), with an "Open In Race Catalog" link to `/admin/races`. Character Portrait uploads can set **Secondary Imagery** (genre + race → fallback library race) via `/api/admin/image-assets/race-secondary-imagery`; live matching prefers the race's own portraits, then the selected race. Zone Image uploads use **Terrain Type** (`metadata.terrainType`), not narrative zone properties. |
| `/admin/monsters` | Monsters | Hook: `useMonsterCatalog` → RPG `/api/admin/monster-types*`. Desktop master-detail: sticky catalog (search, status, genre) + type identity form + expandable subtype table. Edits type/subtype identity, enabled flags, and per-subtype × combat-template **Combat Flavor** (description, attack/ability names + blurbs, optional `damageType` / `targetType` / `saveAbility` / `saveEffect`). Dice and DC stay on the RPG CR / `npcTemplateRegistry.ts` pipeline. Custom is not flavorable. When `attacks` or `specialAbilities` are present they full-replace that kit array. MCP `update_monster_combat_flavor` patches the same JSON. Subtype **Movement Modes** (`movementModes` ⊆ ground / fly / climb / swim + `primaryMovementMode`) are owned by the subtype; archetype is only the combat / body-plan fallback. MCP `create_monster_subtype` lets the RPG AI assign modes when omitted; MCP `update_monster_subtype` with `movementModes` stores them as manual (`movementModesSource: 'manual'`), which the backfill skips unless `--force`. **Can Speak:** `MonsterType.canSpeak` (boolean, default false) is the type default; `MonsterSubtype.canSpeak` is `boolean | null` where `null` inherits the type. The type form uses a toggle; subtype create/edit uses `CanSpeakSelect` (Inherit / Can Speak / Cannot Speak); the subtype table's Speech column shows the effective value plus "Inherited". MCP type/subtype create+update tools accept `canSpeak` (subtype accepts `null` to clear an override). The RPG uses it for dialogue voice, guard standoff lines, and tolls/bribes. Requires the RPG `monster_can_speak` migration and API to deploy first (strict validation rejects unknown keys). **Ship type:** the protected `Ship` type's subtypes are the game's shipyard / hull catalog. When it is selected (`isShipMonsterType`), `MonsterShipFields.tsx` replaces Genres / Can Speak / Spawn Rank / Min Encounter Level / Combat Flavor with Ship Details (one Genre, Archetype Aerial or Hoverer, Crew Class, Travel Range, Combat Template, Combat Mode, Base CR, Base Price, Image Prompt); Travel Range swaps Allowed Terrains to the atmosphere or space flight set. `shipPayloadFromDraft` always sends `fly` movement, `encounterExcluded: true`, `rideable: false`, and `acquisition` with `allyKind: 'ship'` / `progressionMode: 'fixed'` plus `shipDetails` — the RPG `validateShipSubtypeRules` rejects anything else. The table shows Name / Genre / CR / Price / Crew / Status. MCP `list_ships` / `create_ship` / `update_ship` write the same shape. Requires the RPG `monster_subtype_ship_details` migration. |
| `/admin/races` | Races | Hook: `useRaceCatalog` → RPG `/api/admin/races*`. Full Race CMS table for illustrated archetypes, genres, appearance/themes defaults, racial movement checklist (Fly / Climb / Swim), and **Look-Alike Tags** (`LookAlikeTagsField`: preset chips + custom input; cards show tag badges; search matches tags; "Use … As Race Name" prefills a `*-Like` name). Edits persist to DB; old stamped realms are never mutated. |
| `/admin/feedback` | User Feedback | Bug/suggestion inbox |
| `/admin/surveys` | User Surveys | Multi-survey insights picker; each catalog survey has its own averages, distributions, and response list (`SurveyResponse.surveyId`) |
| `/admin/emails` | Email Templates | Hook: `src/hooks/useEmails.ts` → RPG `/api/admin/emails/*` |
| `/admin/public-realms` | Public Realms | Moderation for community-shared realms. Hook: `src/hooks/usePublicRealms.ts` → RPG `/api/admin/public-realms/*`. Open report queue (hide realm / resolve / dismiss), listings table with status filter + hide/restore, and Reconcile Counters (repairs denormalized play/like counts from fact tables). Hiding never deletes player copies. |
| `/admin/settings` | System Settings | Caps, referrals, analytics admin-testing exclusion toggle (`exclude_admin_from_analytics`), **AI Role Routing** matrix, NPC image source (`database` default / `nano_banana_2_lite`) |

## AI Role Routing

System Settings renders a per-role matrix (Assessor, Utility, Architect, Narrator, World Builder) instead of a single text model picker. Hook: `src/hooks/useAiConfig.ts` → RPG `/api/admin/ai-config`.

- `GET` returns the model catalog (with credit multipliers and USD rates), role metadata + code defaults, model stacks, effective assignments, and stored overrides.
- Each row edits Primary Model, Fallback Model, and Timeout (ms; empty = no deadline; max `MAX_PRIMARY_TIMEOUT_MS` 65000, mirrored from the RPG). Dropdowns are populated from the catalog — never hardcode model names in the dashboard. Both dropdowns use one label (`catalogOptionLabel`: name, credits multiplier, USD rates).
- **Fallback Disabled:** the fallback dropdown starts with **Disabled** (`fallback: null`). The primary then runs alone with no deadline, so the Timeout input is disabled. The primary's own model is never offered as a fallback; switching the primary to the current fallback's model resets the fallback to Disabled. Re-enabling a fallback with an empty timeout restores the role's default timeout.
- `buildRoleOverridePayload` sends **only values that differ from the server defaults**, so untouched roles keep tracking the RPG's code defaults instead of being frozen at today's values. Disabled is always sent (`fallback: null`, no `timeoutMs`). Saving with no deviations clears the overrides (an effective reset).
- The RPG validates every payload (unknown role, non-catalog or image-only model, a fallback equal to the effective primary, or timeout outside 0–65000 ms returns a 400) and invalidates its resolver cache on write.
- `setCatalogRatesFromApi` feeds the same catalog rates into `src/lib/costCalculator.ts` so dashboard cost math matches the server. Catalog rates are the RPG's rates **in force now**: scheduled price changes (Gemini 3.8 Flash moves from $0.75 / $3.75 to $1.50 / $7.50 on 2027-01-01) show up without a dashboard deploy. Retired ids (`gemini-3.1-flash-lite`, old DeepSeek Flash ids) are priced from `HISTORICAL_RATES` so old `UsageLog` rows keep their real cost.
- Credit multipliers are relative to a fixed $0.875 / 1M blended anchor (the retired Gemini 3.1 Flash Lite rate), not to a live model: DeepSeek V4.1 Flash 0.50x, DeepSeek V4 Pro 1.51x, Gemini 3.5 Flash Lite 1.60x, Gemini 3.8 Flash 2.57x (5.14x from 2027-01-01). Never recompute them in the dashboard; read `creditMultiplier` from the catalog.
- `src/components/dashboard/TokenEstimator.tsx` (not currently mounted) loads the same catalog for its routable rows and keeps a static fallback list.
- The legacy `default_model` key is intentionally **not** written by this page; roles own text routing.

## Monster Portrait Catalog Sync

- **Source of truth:** `heroic-ai-rpg/src/constants/monsterTypes.defaults.ts` (seed names, descriptions, subtypes; falls back to `monsterTypes.ts`). The live catalog is the RPG DB.
- **Dashboard copy:** `src/constants/monsterPortraitCatalog.ts` — auto-generated; do not edit by hand (used as an offline/stale fallback).
- **Sync command:** `npm run sync:monster-catalog` (also runs optionally on `predev` / `prebuild` when the RPG sibling repo is present). `scripts/extract-monster-catalog.mjs` walks each subtype object and reads `name` / `visualDescription` in any field order. The old regex silently dropped subtypes where another field sat between them.
- **Spawn Rank:** Monsters shows a `SpawnRankSelect` (Any / Boss Only) beside Can Speak in the subtype create form and edit panel, and a "Spawn Rank: Boss Only" badge in the subtype name cell. MCP `create_monster_subtype` / `update_monster_subtype` accept `spawnRank` (`any` | `boss_only`, case-insensitive; create defaults to `any`, update forwards only when sent). A Boss Only subtype only spawns as an encounter's full-rank boss in the RPG.
- **Min Encounter Level:** Set per subtype, never per type. The subtype create form and edit panel show a `MinEncounterLevelInput` (integer ≥ 1, default 1) next to Spawn Rank, and the name cell shows a "Level N" badge. Type rows and the type header show a read-only range from the RPG's derived `minEncounterLevel` / `maxEncounterLevel` (`formatMonsterTypeLevelRange` → "Level 5" or "Level 5–20"). The type forms no longer send `minEncounterLevel`. MCP `create_monster_subtype` / `update_monster_subtype` accept `minEncounterLevel`; type tools reject it.
- **Subtype Genres:** `MonsterSubtype.genres` is a multi-select subset of Fantasy / Modern / Sci-Fi. An empty list inherits the type's genres. The subtype create form and edit panel show `SubtypeGenresField` (genre pills that may be fully cleared, plus "None Selected Inherits Type Genres (…)"), and the name cell shows a "Genres: …" badge only when the subtype has its own tags. MCP `create_monster_subtype` / `update_monster_subtype` accept `genres` (deduped; create forwards only when sent, update sends the full replacement list, `[]` clears back to inherit); `list_monster_types` / `get_monster_type` return it. RPG spawning and portrait matching use the effective genres (own list, else the type's). They also decide the Media Library bucket: a non-humanoid with 2–3 or no effective genres uploads under Mixed. Requires the RPG `monster_subtype_genres` migration and API to deploy first (strict validation rejects unknown keys).
- **Override path:** set `HEROIC_RPG_ROOT` if the RPG repo is not at `../Heroic AI RPG/heroic-ai-rpg`.
- After changing monster types/subtypes/descriptions in the RPG (or adding new ones), run the sync and commit the regenerated catalog so deploys stay current.
- Monsters and some portrait dropdowns prefer RPG `/api/admin/monster-types*` live data; the generated catalog remains the non-ideal fallback.
- Media uploads store stable portrait identity on the ImageAsset:
  - `metadata.monsterTypeId` + `metadata.monsterSubtypeId` (stable DB ids)
  - `metadata.monsterType` + `metadata.monsterSubtype` (denormalized names for UI/search/tagging)
  - Matching prefers the ids and falls back to names for legacy assets.

## Rideable Portrait Catalog Sync

- **Source of truth:** `heroic-ai-rpg/src/constants/rideableCatalog.ts` (44 genre-scoped mounts/vehicles: Fantasy 8 mounts, Modern 8 mounts + 12 vehicles, Sci-Fi 8 mounts + 8 vehicles). **Ships are not synced:** they are subtypes of the live `Ship` monster type, and Ship Portrait reads names, genres, and Image Prompts from `useMonsterCatalogWithSubtypes` (no options until the live catalog loads; existing asset `shipType` values still merge in). Modern Mount Portrait keys (Beast Pens combat animals): Hunting Dog, K9 Unit, Trained Hawk, Trained Eagle, Brown Bear, Riding Horse, Police Horse, Mountain Lion — no assets uploaded yet; the game falls back to the Stables icon until they exist.
- **Dashboard copy:** `src/constants/rideablePortraitCatalog.ts` — auto-generated; do not edit by hand.
- **Sync command:** `npm run sync:rideable-catalog` (also runs optionally on `predev` / `prebuild`).
- After changing rideable names/categories in the RPG, run the sync and commit the regenerated catalog.
- **Image descriptions:** The sync also reads RPG `RIDEABLE_IMAGE_DESCRIPTIONS` into `RIDEABLE_IMAGE_DESCRIPTION_BY_GENRE` / `getRideableImageDescription(name, genre)` and aborts if its names differ from the catalog. Mount / Vehicle Portrait (and Ship Portrait, from the live subtype's `shipDetails.imagePrompt`) show the selected Template Name's "Looks like …" sentence as `help-text` under the select (Any Genre searches every genre). Display only; it never writes the asset description or metadata, and it is not the in-game `visualDescription` shop line.
- **Upload dropdowns:** Mount / Vehicle / Ship template selects use catalog order for the selected genre only (do not mix orphan types from other genres). In-game Beast Pens / War Mount Bay (`stables`) = Mount Portrait list; Garage / Motor Pool = Vehicle Portrait list; Shipyard = Ship Portrait list.

## Item Image Catalog Sync

- **Genre-scoped Weapons & Protection:** Art Family dropdown options for **Weapons** and **Protection** depend on upload **Genre** (Fantasy / Modern / Sci-Fi), same pattern as rideable types. Any Genre defaults the list to Fantasy. Other item categories stay shared across genres.
- **Art families:** Weapons and Protection upload templates are **family names**, not every mechanical chassis. `ITEM_ART_FAMILIES_BY_GENRE` maps retired members (e.g. Fantasy Composite Bow → Longbow; Sci-Fi Plasma Rifle → Laser Rifle; Modern Soft Body Armor → Kevlar Vest) so the dropdown is shorter; generation still uses full blueprint counts. After changing families, run the sync and apply the Supabase remap migration if subtypes were retired.
- **Weight categories:** Sync also writes `ITEM_WEIGHT_CATEGORY_BY_GENRE` (Light / Medium / Heavy / Shield) from weapon loot tags and `armorStats.armorType`. Art Family option labels for Weapons/Protection show e.g. `Light - Laser Pistol` (family name only in the dropdown; display only — not uploaded as a tag).
- **Source of truth:** RPG loot blueprints — `weaponLootTemplates.ts`, `armorLootTemplates.ts`, and `utilityLootTemplates.ts` (per-genre Fantasy / Modern / Sci-Fi tables), `itemRegistry.ts` (`LOOT_TABLES`), `itemArtFamilies.ts` (`ITEM_ART_FAMILIES_BY_GENRE`), and `materials.ts` typeTags. Runtime helper: `heroic-ai-rpg/src/constants/itemPortraitCatalog.ts`.
- **Dashboard copy:** `src/constants/itemPortraitCatalog.ts` — auto-generated; do not edit by hand.
- **Utilities extraction:** Per-genre Utilities subtypes come from `util('Name')` calls (lockpick, crowbar, ship repair kit) plus the values of the **first** object passed to each `sharedTools({ pack: '…', … }, { …sentences })` call. The second object (flavor text) and `RETIRED_UTILITY_NAMES` are never read, so retired chassis (Silk Rope, Bedroll, …) get no upload slot. The sync aborts unless each genre yields exactly 12 utility names; update `EXPECTED_UTILITY_COUNT` in the script when the shelf size changes.
- **Item visual descriptions:** The sync also reads RPG `UTILITY_VISUAL_DESCRIPTIONS`, `CONSUMABLE_VISUAL_DESCRIPTIONS`, and `THROWABLE_VISUAL_DESCRIPTIONS` into `UTILITY_` / `CONSUMABLE_` / `THROWABLE_VISUAL_DESCRIPTION_BY_GENRE`, and aborts if a genre's names differ from that category's Art Family list (consumables and throwables compare against the folded families). `getItemVisualDescription(category, family, genre)` returns '' for categories without a map. Item Image → Utilities / Consumables / Throwables shows the selected Art Family's "Looks like …" sentence as `help-text` under the dropdowns, like Monster Subtype. Display only; it never writes the asset description or metadata.
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

## MCP Tool Failures

- `api/mcp.ts` logs every failing `tools/call` as `[mcp] tool "<name>" failed for key "<key name>": <detail>` (Vercel runtime logs) and returns the same detail to the bot with `isError: true`.
- Admin RPG calls (`fetchRpgAdminServer`) fail with `RPG API <METHOD> <path> Returned <status>: <game error> (code <Prisma code>)`. A 503 with `P2021` / `P2022` means the RPG database is missing a migration, not a dashboard env problem.

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
  - **Look-Alike Tags** sit in the same card (`src/components/races/LookAlikeTagsField.tsx`). A new `*-Like` label (e.g. `Cat-Like`) pre-tags itself; matched races prefill from `lookAlikeTags`. Saving a matched race sends **one** `updateRace` PATCH with only what changed: speeds, `lookAlikeTags`, and the form genre appended to `genres` when missing (look-alike portraits are genre-locked, so one `Cat-Like` row gains Fantasy / Modern / Sci-Fi as art is uploaded). New race creates include `lookAlikeTags`.
- **Look-Alike Tags (backend only):** stored lowercase kebab (`cat-like`) on `Race.lookAlikeTags`; helpers in `src/lib/raceAliasUtils.ts` (`PRESET_LOOK_ALIKE_TAGS`, `normalizeLookAlikeTag(s)`, `formatLookAlikeTagLabel`, `isLookAlikeRaceLabel`), and the RPG re-normalizes on save. New look-alike races keep their `*-Like` name in the Media Library; existing race names are unchanged. World creation matches player species to these portraits and always shows players a skinned race name — tags and `*-Like` names never appear in game.
  - Help text: *Racial Extras Only; Stacks With Traits And Magic Items.* Matched races add: *Saving Updates The Race Catalog For New Worlds; Existing Realms Keep Their Stamped Speeds.*
  - Dropdown DB names are genre-scoped via `getDbRaceNamesForGenre` (empty `genres` ⇒ Fantasy; `Any Genre` ⇒ full union).
- **Playtime stamping:**
  - World creation copies catalog movement speeds onto realm lore snapshot JSON (with optional `catalogRaceId`).
  - Editing catalog movement later in the Dashboard does **not** alter or mutate existing world saves or public realm snapshots.
  - Runtime actor movement calculations (`getActorEffectiveSpeed`) read base speeds directly from the actor without live DB queries.
