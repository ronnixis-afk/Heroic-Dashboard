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

Use primitives from `src/components/ui/`:

- `PageHeader`, `Card`, `FilterTabs`
- `StatusBanner`, `EmptyState`, `PageLoader`, `StatCard`

Stay on the three-tier type scale in `Design.md` / `src/index.css` (`text-xs`, `text-title`, `text-header`). Prefer `.help-text`, `.stat-label`, `.status-banner-*`, and badge classes over ad-hoc sizes or colors.

## Routes

| Route | Page | Notes |
|-------|------|-------|
| `/admin` | Dashboard | Revenue + acquisition overview |
| `/admin/users` | Users | Sync, export, cloud save stats |
| `/admin/reports/audience` | Audience Reports | Active users (incl. MAU), retention, churn → Users (`?userId=`) |
| `/admin/analytics` | Live Analytics | Sessions, cost, latency; RPG + Supabase metrics |
| `/admin/reports/usage` | Usage Reports | Product Surfaces + feature-usage API (unique users / duration) |
| `/admin/reports/financial` | Financial Reports | Revenue + cost-analytics API (model latency) |
| `/admin/credits` | Credits | Grants + adjustment history |
| `/admin/news` | Global News | Announcements CMS |
| `/admin/media` | Media Library | WebP asset upload/tagging; `useImageAssets` pages through all `ImageAsset` rows (500/request). Genre filter omits "Any Genre" (treats it as All). **Monster Portrait** is available under Fantasy / Sci-Fi / Modern / Any Genre; cascading Monster Type / Monster Subtype metadata auto-tags for filtering (`monsterPortraitCatalog.ts`). Upload Humanoid role subtypes (Guard, Soldier, Thug, Bandit, Pirate, Street Fighter) per genre so Fantasy guards never match Sci-Fi art. RPG match prefers world genre, then Any Genre fallback. **NPC Portrait** is uploadable (race/gender metadata) and used when System Settings NPC Image Source is Database (default); Nano Banana 2 Lite remains an optional AI source with Database fallback. **Character Portrait** / **Portrait Race** dropdown = core five + 10 shared suggested customs (`SUGGESTED_PORTRAIT_RACES`: Vampire, Werewolf, Goblin, Troll, Demon, Angel, Undead, Ghost, Giant, Fey) + distinct `metadata.race` from uploaded Character portraits (same genre or Any Genre) + local customs typed this browser. |

## Monster Portrait Catalog Sync

- **Source of truth:** `heroic-ai-rpg/src/constants/monsterTypes.ts` (names, descriptions, subtypes).
- **Dashboard copy:** `src/constants/monsterPortraitCatalog.ts` — auto-generated; do not edit by hand.
- **Sync command:** `npm run sync:monster-catalog` (also runs optionally on `predev` / `prebuild` when the RPG sibling repo is present).
- **Override path:** set `HEROIC_RPG_ROOT` if the RPG repo is not at `../Heroic AI RPG/heroic-ai-rpg`.
- After changing monster types/subtypes/descriptions in the RPG (or adding new ones), run the sync and commit the regenerated catalog so deploys stay current.
| `/admin/feedback` | User Feedback | Bug/suggestion inbox |
| `/admin/emails` | Email Templates | Hook: `src/hooks/useEmails.ts` → RPG `/api/admin/emails/*` |
| `/admin/settings` | System Settings | Caps, referrals, text model routing, NPC image source (`database` default / `nano_banana_2_lite`) |

## Insights Data Sources

| Surface | Primary sources |
|---------|-----------------|
| Audience | RPG `active-users`, `retention`, `churn-signals`; Supabase dashboard RPC/views for tiers & signups |
| Live Analytics | Supabase usage/session views + RPG `session-length`, `messages-per-user`; Engine Health via `/api/admin/telemetry` + `/api/analytics/behavior` |
| Usage Reports | RPG `feature-usage` (unique users / avg duration; Supabase cost merge); Product Surfaces strip from `UsageLog.type` |
| Financial | Supabase revenue RPC + RPG `cost-analytics` (fallback: model/daily views) |

Churn rows deep-link to `/admin/users?userId=` (opens `UserDetailModal`). AdminMedia is operations-only (no reporting KPIs).

## Email Templates

- Templates, low-credit threshold, test send, and recent send logs
- Resend API key stays on the RPG server only
