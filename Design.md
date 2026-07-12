# Design Guidelines & Visual Tokens — Heroic Dashboard

This document is the single source of truth for visual style, typography, layout patterns, and component specifications in the Heroic Dashboard.

## Core Directives

1. **Title Casing is Mandatory:** Always use Title Casing for titles, labels, buttons, and empty-state titles (e.g., "Revenue & API Costs", "Token Estimator").
2. **No All Caps:** Never use ALL CAPS or all-uppercase for titles or headings.
3. **Desktop First, Mobile Usable:** Optimise for desktop and laptop viewports. Ensure layouts remain usable on mobile with responsive grids, collapsible sidebar, and touch-friendly targets.
4. **Consult Styling File:** Use [index.css](src/index.css) for definitive brand tokens before adding custom inline styles.
5. **Stay On Type Scale:** Only use the three sizes below. Do not invent `text-sm`, `text-[10px]`, or other ad-hoc sizes in admin UI.
6. **Minimal CMS Tone:** Prefer quiet chrome, clear feedback, and consistent spacing over decorative badges or competing accents.

---

## Typography Scale

The dashboard uses a **three-tier type scale** with Inter as the primary font:

| Role | Size | Token / Class | Usage |
|------|------|---------------|-------|
| Body | 11px | `text-xs` / `text-body` / `.help-text` | Default UI text, table data, labels, metadata, helper copy |
| Title | 14px | `text-title` / `.section-title` / `.card-title` | Widget titles, section headers, sticky page label |
| Header | 18px | `text-header` / `.page-title` / `.card-metric` | Page titles, key metric values |

**Font Weights:** `font-medium` (500) for labels and body emphasis, `font-semibold` (600) for titles and headers. Avoid `font-bold` in admin UI.

**Icon Sizes:** 12px in buttons, 14px in navigation and section titles, 16px for decorative accents.

---

## Design Tokens

Defined in [index.css](src/index.css) via Tailwind CSS v4 `@theme`.

### Colors

* **Backgrounds:**
  * `--color-brand-bg` (`#141416`): Main content background
  * `--color-sidebar-bg` (`#111114`): Sidebar
  * `--color-brand-surface` (`#1a1b20`): Cards and elevated panels
* **Borders:**
  * `--color-brand-border` (`#1e1f24`): Panel and layout dividers
  * `--color-brand-primary` (`#292a32`): Input borders, table dividers, hover states
* **Accents:**
  * `--color-brand-accent` (`#20cce0`): Primary CTA, active states, charts
  * `--color-brand-accent-hover` (`#1ba3b4`): Accent hover
* **Typography:**
  * `--color-brand-text` (`#ffffff`): Primary text
  * `--color-brand-text-muted` (`#8b8c94`): Secondary text
* **Semantic:** Use `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-accent`, `.badge-muted` — prefer these over one-off purple/indigo/zinc colors.

### Spacing

Use the 4px / 8px / 12px / 16px scale:

* `gap-2` / `gap-3` — Grid and list spacing
* `p-3` / `p-3.5` — Card interior padding
* `p-3 sm:p-4` — Page content padding
* `.page` uses `space-y-4` between major blocks

---

## Layout Architecture

Defined in `AdminLayout.tsx`:

1. **Shell:** Full-height flex layout, sidebar + main content
2. **Sidebar:** 200px expanded / 52px collapsed; mobile overlay drawer at 220px; active item uses accent bar + muted surface
3. **Header:** 44px (`h-11`), sticky, shows nav group + page title and user menu
4. **Content:** Max-width 1400px, `p-3 sm:p-4`

Every admin page should start with:

```tsx
<div className="page">
  <PageHeader title="..." description="..." actions={...} />
  ...
</div>
```

---

## Core Components

Import shared layout primitives from `src/components/ui/`.

### Panels & Cards

```tsx
import { Card, PageHeader, StatCard, StatusBanner, EmptyState, PageLoader } from '../components/ui';

<PageHeader title="User Management" description="Optional subtitle" />
<StatCard label="Total Cloud Storage" value="1.2 GB" icon={Database} accent />
<div className="card p-3.5">...</div>
```

* **`.card`** — Bordered surface with `rounded-lg`
* **`.card-title`** — 14px widget title
* **`.card-metric`** — 18px semibold metric value
* **`.card-header`** — Title + action row
* **`.stat-label`** / **`.help-text`** — Muted 11px labels and helper copy
* **`.metric-tile`** — Compact metric cell inside forms
* **`.select-row`** — Selectable list rows (email templates, etc.)
* **`.callout`** / **`.callout-accent`** — Inline informational panels

### Feedback

| Component | Usage |
|-----------|-------|
| `StatusBanner` | Success / error / info after saves, syncs, deletes |
| `EmptyState` | Empty tables, lists, and filtered results |
| `PageLoader` | Full-page loading before content is ready |

Classes: `.status-banner-*`, `.empty-state`, `.page-loader`

### Buttons

| Class | Usage |
|-------|-------|
| `.btn-primary` | Primary actions (Export, Save, View All) |
| `.btn-secondary` | Secondary actions (Filters, Sync, Refresh) |
| `.btn-ghost` | Low-emphasis actions |
| `.btn-danger` | Destructive actions |
| `.btn-icon` | Icon-only controls (28×28px) |
| `.btn-sm` | Modifier for compact height (28px) |

### Inputs

* **`.input-field`** — 32px height, 11px text, dark background
* **`.input-label`** — Muted 11px label above fields

### Filter Pills

```tsx
import FilterTabs from '../components/ui/FilterTabs';
<FilterTabs options={['Day', 'Week', 'Month']} value={filter} onChange={setFilter} />
```

### Data Tables

* **`.data-table`** — Compact table with 11px text
* Headers: `text-xs font-medium text-brand-text-muted`
* Row hover: `bg-brand-hover`

### Badges

* `.badge-accent`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-muted`

### Lists

* **`.list-item`** — Interactive row with hover background

---

## Interaction & Accessibility

* **Focus:** 2px accent outline via `:focus-visible`
* **Touch Targets:** Minimum 28px height on buttons; use `btn-icon` padding for small controls
* **Transitions:** 150ms for hover; `active:scale-[0.98]` on buttons
* **Honesty:** Do not show unread indicators when there are no notifications

---

## Iconography

* **Library:** Lucide React
* **Stroke:** `stroke-width={2}` default; size 12–14px in UI chrome
