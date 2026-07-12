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
| `/admin/media` | Media Library | WebP asset upload/tagging |
| `/admin/feedback` | User Feedback | Bug/suggestion inbox |
| `/admin/emails` | Email Templates | Hook: `src/hooks/useEmails.ts` → RPG `/api/admin/emails/*` |
| `/admin/settings` | System Settings | Caps, referrals, model routing |

## Email Templates

- Templates, low-credit threshold, test send, and recent send logs
- Resend API key stays on the RPG server only
