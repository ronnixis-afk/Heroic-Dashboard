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
| `/admin/reports/audience` | Audience Reports | Retention + churn |
| `/admin/analytics` | Real-Time Analytics | Sessions, cost, latency |
| `/admin/reports/usage` | Usage Reports | Feature / session charts |
| `/admin/reports/financial` | Financial Reports | Revenue + cost distribution |
| `/admin/credits` | Credits | Grants + adjustment history |
| `/admin/news` | Global News | Announcements CMS |
| `/admin/media` | Media Library | WebP asset upload/tagging; `useImageAssets` pages through all `ImageAsset` rows (500/request). Genre filter omits "Any Genre" (treats it as All). **Monster Portrait** is available only when Genre is `Any Genre`; cascading Monster Type / Monster Subtype metadata auto-tags for filtering (`monsterPortraitCatalog.ts`). **NPC Portrait** adds an Npc Type dropdown (service: Tavern/Stables/Merchant/Shipyard/Forge + generic roles) stored as `metadata.npcType` and as a swap-clean tag — RPG match treats `npcType` like `monsterSubtype` (hard filter + weight 12, case-insensitive metadata/tag match). | 

## Monster Portrait Catalog Sync

- **Source of truth:** `heroic-ai-rpg/src/constants/monsterTypes.ts` (names, descriptions, subtypes).
- **Dashboard copy:** `src/constants/monsterPortraitCatalog.ts` — auto-generated; do not edit by hand.
- **Sync command:** `npm run sync:monster-catalog` (also runs optionally on `predev` / `prebuild` when the RPG sibling repo is present).
- **Override path:** set `HEROIC_RPG_ROOT` if the RPG repo is not at `../Heroic AI RPG/heroic-ai-rpg`.
- After changing monster types/subtypes/descriptions in the RPG (or adding new ones), run the sync and commit the regenerated catalog so deploys stay current.
| `/admin/feedback` | User Feedback | Bug/suggestion inbox |
| `/admin/emails` | Email Templates | Hook: `src/hooks/useEmails.ts` → RPG `/api/admin/emails/*` |
| `/admin/settings` | System Settings | Caps, referrals, model routing |

## Email Templates

- Templates, low-credit threshold, test send, and recent send logs
- Resend API key stays on the RPG server only
