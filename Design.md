# Design Guidelines & Visual Tokens — Heroic Dashboard

This document serves as the single source of truth for the visual style guide, typography, layout patterns, and component specifications within the Heroic Dashboard application.

## Core Directives

1. **Title Casing is Mandatory:** When adding or implementing text, titles, or labels, **always** use Title Casing (e.g., "Revenue & API Costs", "Token Estimator").
2. **No All Caps:** Never use ALL CAPS or all uppercase for titles or headings.
3. **Mobile First Design:** Always design and implement UI layouts with a mobile-first mindset. Ensure components are responsive and scale fluidly up to desktop viewports.
4. **Consult styling file:** Consult [index.css](file:///c:/Users/User/.antigravity/Projects/Heroic%20Dashboard/Heroic-Dashboard/src/index.css) for the definitive brand styling tokens before adding custom inline styles.

---

## Design Tokens

The application uses Tailwind CSS v4 with custom tokens defined in [index.css](file:///c:/Users/User/.antigravity/Projects/Heroic%20Dashboard/Heroic-Dashboard/src/index.css).

### Colors

* **Backgrounds:**
  * `--color-brand-bg` (`#141416`): The primary dark background used for main content areas and nested containers.
  * `--color-sidebar-bg` (`#111114`): Dark shade used specifically for the layout sidebar.
  * `--color-brand-surface` (`#1d1e24`): Elevated surface color used for cards, panels, and distinct UI blocks.
* **Borders & Dividers:**
  * `--color-brand-primary` (`#292a32`): Used for borders, list hover backgrounds, and subtle outlines.
* **Brand Accents:**
  * `--color-brand-accent` (`#00e5ff`): Primary call-to-action color, used for active states, main charts, and focus rings.
  * `--color-brand-accent-hover` (`#00ccff`): Hover state for accent elements.
  * *Secondary Accents (used in graphics but not mapped globally):* Orange (`#ff5a36`), Emerald (`#3ecf8e`), Indigo (`indigo-500`).
* **Typography:**
  * `--color-brand-text` (`#ffffff`): Primary text color for headings and high-emphasis content.
  * `--color-brand-text-muted` (`#8b8c94`): Secondary text color for labels, descriptions, and low-emphasis information.

### Typography Scale

* **Primary Font (`--font-sans`):** `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`.
* **Typography Hierarchy:**
  * `--text-h1` (36px): Page Titles
  * `--text-h2` (24px): Major Section Headers
  * `--text-h3` (20px): Widget Titles
  * `--text-h4` (18px): Sub-headers
  * `--text-body` (14px): Default interface text, inputs, table data
  * `--text-small` (12px): Metadata, secondary info
  * `--text-xs` (11px): Table headers, status pills
* **Font Weights:**
  * `--font-weight-bold` (700)
  * `--font-weight-semibold` (600)
  * `--font-weight-medium` (500)
  * `--font-weight-normal` (400)
* **Icon Sizes:**
  * `--size-icon-sm` (14px / `0.875rem`)
  * `--size-icon-md` (18px / `1.125rem`)
  * `--size-icon-lg` (24px / `1.5rem`)

### Spacing Scale

To keep margins, paddings, and alignment consistent, developers should strictly adhere to the 8px spacing scale system:
* **2px (`0.125rem`):** Micro-adjustments, border-widths.
* **4px (`0.25rem`):** Small gaps between labels and inputs, tag padding.
* **8px (`0.5rem`):** Grid item spacing, list item padding.
* **12px (`0.75rem`):** Sub-elements gap, tooltip padding.
* **16px (`1rem`):** Content gaps, card interior spacing.
* **24px (`1.5rem`):** Standard container padding (`p-6`), section padding.
* **32px (`2rem`):** Page gutters, major block layouts.

---

## Layout Architecture

The application layout (defined in `AdminLayout.tsx`) follows a dashboard structure:

1. **Global App Container:** Fills the screen (`h-screen flex`) with a base background of `#111114`.
2. **Sidebar Navigation:**
   * **Background:** `#111114` with a right border of `border-[#1e1f24]`.
   * **Width:** Responsive, 240px when expanded, 80px when collapsed.
   * **Navigation Items:** Pill-shaped (`rounded-[1.5rem]`). Inactive state is `#8b8c94` text with `hover:bg-[#1a1b21] hover:text-white`. Active state uses `bg-[#292a32] text-white`.
3. **Main Content Wrapper:** Elevated appearance over the background: `bg-[#141416]`, margin `m-4`, heavily rounded corners `rounded-[2rem]`, and a subtle border `border-[#1e1f24]`.
4. **Header:**
   * Sticky positioning, height `80px` (`h-20`).
   * **Background:** Translucent `#141416/90` with a blur effect (`backdrop-blur-md`).
   * Features a rounded top to match the main wrapper (`rounded-t-[2rem]`).

---

## Core Components

### 1. Panels & Cards

All distinct sections on the dashboard (e.g., charts, lists, estimators) must be wrapped in a "glass panel".
* **Class:** `glass-panel`
* **Properties:** Background surface (`#1d1e24`), heavily rounded corners (`rounded-3xl`), and a subtle shadow.
* **Usage:** Usually paired with standard padding (`p-6`) and Flexbox column layout (`flex flex-col`).

### 2. Buttons & Select Pills

* **Primary Button (`.btn-primary`):**
  * Used for major actions (e.g., "Calculate Cost", "View All").
  * **Styling:** White background (`bg-white`), black text (`text-black`), fully rounded (`rounded-full`), bold font (`font-bold`). Includes hover state (`hover:bg-gray-200`) and an active scale down effect (`active:scale-[0.98]`).
* **Secondary Select Pills:**
  * Used for dropdown triggers (e.g., "Input", "USD" in the Token Estimator).
  * **Styling:** Dark surface (`bg-[#1d1e24]`) with a primary border (`border-[#292a32]`), rounded-full, containing a small circular icon with a tinted background (e.g., `bg-indigo-500/20` or `bg-emerald-500/20`) and a chevron.
* **Time Filters:**
  * Small pill toggles (e.g., Day, Week, Month). Inactive states are muted text (`text-[#8b8c94]`), active states are white background with black text.

### 3. Inputs

* **Standard Inputs:** Dark background (`bg-[#141416]`), border (`border-brand-primary`), rounded corners (`rounded-xl`). Focus state highlights with the brand accent color.
* **Estimator Metric Inputs:** Large transparent text inputs (`text-3xl font-bold`) nested inside a rounded `#141416` container with a `#292a32` border, accompanied by small muted labels above them.

### 4. Data Tables & Lists

* **Headers:** Small font (`text-[11px]`), font-medium, text-muted. Always use Title Casing (e.g., "Customer", "Top Model", "Spend").
* **Interactive Lists (e.g., Recent Signups, Top Consumers):**
  * **Item Container:** Flex row, vertical centering (`flex items-center`), padding (`p-2`), rounded corners (`rounded-xl`).
  * **Hover State:** Must use `hover:bg-[#292a32] transition-colors` to indicate interactivity.
  * **Avatars:** Round containers (`w-8 h-8 rounded-full`) with a subtle border. For default avatars, use vibrant colored backgrounds (Red, Orange, Blue, Green) with white text initials.
  * **Right-Aligned Metrics:** Use bold typography and accent colors to highlight specific metrics (e.g., `text-emerald-400 font-bold` for monetary spend like `$1254.99`).

### 5. Charts & Data Visualization

* **Area Charts (Revenue & API Costs):** Use smooth monotone curves. The lines should be solid (`#00e5ff` and `#ff5a36`) with a faded gradient fill underneath to the bottom of the chart.
* **Bar Charts (New Signups):** Use slim, rounded-top bars with distinct accent colors for each category.

### 6. Tooltips & Hover Panels

All tooltips, hover-triggered panels, and dropdown popovers must follow standard styling:
* **Class:** `tooltip-panel`
* **Background:** Brand surface (`#1d1e24`).
* **Border:** Primary border (`1px solid #292a32`).
* **Corner Radius:** `12px` (`rounded-xl`).
* **Shadow:** Large elevation shadow (`shadow-2xl`).
* **Typography:**
  * **Labels/Title:** Small font (`text-xs` or `11px`), bold, Title Cased.
  * **Values:** Default body size (`text-body` or `14px`), bold, often highlighted with accent colors.
  * **Descriptions:** Extra small (`text-xs`), muted color (`text-[#8b8c94]`), line-height `relaxed`.
* **Spacing:** Standard padding (`p-3`).

---

## Interaction States & Accessibility

To maintain WCAG 2.1 AA accessibility guidelines and visual feedback:

* **Contrast Ratios:** Ensure contrast ratios between text elements and backgrounds exceed 4.5:1. Muted text (`--color-brand-text-muted`) should only be used for auxiliary, non-critical labels.
* **Focus Indicators:** Interactive components must display a clear focus ring using the brand accent color when focused by keyboard inputs:
  ```css
  &:focus-visible {
    outline: 2px solid var(--color-brand-accent);
    outline-offset: 2px;
  }
  ```
* **Touch Targets:** For touch-screen devices, ensure all buttons and link elements maintain a minimum target size of 44x44px. Use padding (`p-2` or higher) to extend target boundaries without impacting the layout size.

---

## Motion & Animation Guidelines

Smooth motion adds a premium feel to the dashboard interactions. Maintain these standards:

* **Short Transitions (150ms):** Used for micro-interactions like hover states on list items, buttons, or border highlights.
  * *Easing:* `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease-in-out)
* **Medium Transitions (300ms):** Used for panel expansions, sidebar navigation toggles, dropdown panels, and modal fade-ins.
  * *Easing:* `cubic-bezier(0.16, 1, 0.3, 1)` (custom ease-out)
* **Scale Animations:** Interactive items should scale down slightly on active clicks:
  * Active state utility: `active:scale-[0.98]`

---

## Iconography Guidelines

To maintain visual weight and branding consistency across the application:

* **Primary Icon Library:** Always use the Lucide React library for interface icons.
* **Stroke Weight:** Keep stroke weights uniform:
  * Use `stroke-width={2}` for standard status displays and buttons.
  * Use `stroke-width={1.5}` for larger layout icons.
* **Alignment:** Always align icons vertically inside flex containers: `flex items-center gap-2`.
