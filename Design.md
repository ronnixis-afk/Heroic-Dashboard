## Design Tokens

This document serves as the ultimate source of truth for all User Interface (UI) design and implementation within the Heroic Dashboard project. Any new components, layouts, or updates must adhere strictly to these guidelines to ensure consistency, accessibility, and a premium user experience.

## Core Directives

1. **Title Casing is Mandatory**: When adding or implementing text, titles, or labels, **always** use Title Casing. (e.g., "Revenue & API Costs", "Token Estimator").
2. **No All Caps**: Never use ALL CAPS or all uppercase for titles or headings. (Note: Existing legacy code with `uppercase` in `.data-table th` must be phased out or avoided for new headings to strictly adhere to this rule).
3. **Mobile First**: Always design and implement UI updates with a "mobile first" mindset. Ensure that components are fully responsive and gracefully scale up from mobile viewports to desktop.
4. **Consult the Source**: Always consult `src/index.css` for the definitive brand styling tokens (colors, fonts, buttons, and structural elements) before creating custom inline styles or arbitrary Tailwind classes.

---

## Design Tokens

The application uses Tailwind CSS v4 with custom tokens defined in `src/index.css`. These variables must be used for any styling to maintain theme consistency.

### Colors

*   **Backgrounds**:
    *   `--color-brand-bg` (`#141416`): The primary dark background used for main content areas and nested container backgrounds.
    *   `--color-sidebar-bg` (`#111114`): Slightly darker shade used specifically for the application sidebar and main layout root.
    *   `--color-brand-surface` (`#1d1e24`): Elevated surface color used for cards, panels, and distinct UI blocks.
*   **Borders & Dividers**:
    *   `--color-brand-primary` (`#292a32`): Used for borders, dividers, hover states on list items, and subtle outlines.
*   **Brand Accents**:
    *   `--color-brand-accent` (`#00b2ff`): Primary call-to-action color, used for active states, primary charts, and focus rings.
    *   `--color-brand-accent-hover` (`#009ce0`): Hover state for accent elements.
    *   Secondary Accents (used in UI graphics but not mapped globally): Orange (`#ff5a36`), Emerald (`#3ecf8e`), Indigo (`indigo-500`).
*   **Typography**:
    *   `--color-brand-text` (`#ffffff`): Primary text color for headings and high-emphasis content.
    *   `--color-brand-text-muted` (`#8b8c94`): Secondary text color for labels, descriptions, and low-emphasis information.

### Typography

*   **Primary Font (`--font-sans`)**: `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`. Used for all interface elements.
*   **Typography Scale**:
    *   `--text-h1` (36px): Page Titles
    *   `--text-h2` (24px): Major Section Headers
    *   `--text-h3` (20px): Widget Titles
    *   `--text-h4` (18px): Sub-headers
    *   `--text-body` (14px): Default interface text, inputs, table data.
    *   `--text-small` (12px): Metadata, secondary info.
    *   `--text-xs` (11px): Table headers, status pills.
*   **Font Weights**:
    *   `--font-weight-bold` (700)
    *   `--font-weight-semibold` (600)
    *   `--font-weight-medium` (500)
    *   `--font-weight-normal` (400)
*   **Icon Sizes**:
    *   `--size-icon-sm` (14px)
    *   `--size-icon-md` (18px)
    *   `--size-icon-lg` (24px)

---

## Layout Architecture

The application layout (defined in `AdminLayout.tsx`) follows a classic dashboard structure:

1.  **Global App Container**: 
    *   Fills the screen (`h-screen flex`) with a base background of `#111114`.
2.  **Sidebar Navigation**:
    *   **Background**: `#111114` with a right border of `border-[#1e1f24]`.
    *   **Width**: Responsive, 240px when expanded, 80px when collapsed.
    *   **Navigation Items**: Pill-shaped (`rounded-[1.5rem]`). Inactive state is `#8b8c94` text with `hover:bg-[#1a1b21] hover:text-white`. Active state uses `bg-[#292a32] text-white`.
3.  **Main Content Wrapper**:
    *   Elevated appearance over the background: `bg-[#141416]`, margin `m-4`, heavily rounded corners `rounded-[2rem]`, and a subtle border `border-[#1e1f24]`.
4.  **Header**:
    *   Sticky positioning, height `80px` (`h-20`).
    *   **Background**: Translucent `#141416/90` with a blur effect (`backdrop-blur-md`).
    *   Features a rounded top to match the main wrapper (`rounded-t-[2rem]`).

---

## Core Components

When building UI, leverage these pre-defined components or utility classes before attempting to build from scratch.

### 1. Panels & Cards (`.glass-panel`)
All distinct sections on the dashboard (e.g., charts, lists, estimators) must be wrapped in a "glass panel".
*   **Class**: `glass-panel`
*   **Properties**: Background surface (`#1d1e24`), heavily rounded corners (`rounded-3xl`), and a subtle shadow.
*   **Usage**: Usually paired with standard padding (`p-6`) and Flexbox column layout (`flex flex-col`).

### 2. Buttons & Select Pills
*   **Primary Button (`.btn-primary`)**:
    *   Used for major actions (e.g., "Calculate Cost", "View All").
    *   **Styling**: White background (`bg-white`), black text (`text-black`), fully rounded (`rounded-full`), bold font (`font-bold`). Includes hover state (`hover:bg-gray-200`) and an active scale down effect (`active:scale-[0.98]`).
*   **Secondary Select Pills**:
    *   Used for dropdown triggers (e.g., "Input", "USD" in the Token Estimator).
    *   **Styling**: Dark surface (`bg-[#1d1e24]`) with a primary border (`border-[#292a32]`), rounded-full, containing a small circular icon with a tinted background (e.g., `bg-indigo-500/20` or `bg-emerald-500/20`) and a chevron.
*   **Time Filters**:
    *   Small pill toggles (e.g., Day, Week, Month). Inactive states are muted text (`text-[#8b8c94]`), active states are white background with black text.

### 3. Inputs (`.input-field` & Estimator Inputs)
*   **Standard Inputs**: Dark background (`bg-[#141416]`), border (`border-brand-primary`), rounded corners (`rounded-xl`). Focus state highlights with the brand accent color.
*   **Estimator Metric Inputs**: Large transparent text inputs (`text-3xl font-bold`) nested inside a rounded `#141416` container with a `#292a32` border, accompanied by small muted labels above them.

### 4. Data Tables & Lists (`.data-table`)
*   **Headers**: Small font (`text-[11px]`), font-medium, text-muted. Always use Title Casing (e.g., "Customer", "Top Model", "Spend").
*   **Interactive Lists (e.g., Recent Signups, Top Consumers)**:
    *   **Item Container**: Flex row, vertical centering (`flex items-center`), padding (`p-2`), rounded corners (`rounded-xl`).
    *   **Hover State**: Must use `hover:bg-[#292a32] transition-colors` to indicate interactivity.
    *   **Avatars**: Round containers (`w-8 h-8 rounded-full`) with a subtle border. For default avatars, use vibrant colored backgrounds (Red, Orange, Blue, Green) with white text initials.
    *   **Right-Aligned Metrics**: Use bold typography and accent colors to highlight specific metrics (e.g., `text-emerald-400 font-bold` for monetary spend like `$1254.99`).

### 5. Charts & Data Visualization
*   **Area Charts (Revenue & API Costs)**: Use smooth monotone curves. The lines should be solid (`#00b2ff` and `#ff5a36`) with a faded gradient fill underneath to the bottom of the chart.
*   **Bar Charts (New Signups)**: Use slim, rounded-top bars with distinct accent colors for each category.

---

## Typography & Micro-Aesthetics

*   **Section Headings**: Typically `text-xl` or `text-lg` with `font-bold`. Must use Title Casing.
*   **Sub-labels & Meta Information**: Use `text-xs` or `text-[11px]`, font weight `font-medium`, and the muted text color (`text-[#8b8c94]`).
*   **Numbers & Metrics**: For primary metrics, use large typography (`text-3xl`) and bold weights (`font-bold`). For currency or special metrics, use accent colors to highlight status (e.g., `text-emerald-400` for spend metrics).
*   **Dividers**: When separating content within a panel, use a border bottom with the primary border color (`border-b border-[#292a32]`).

*End of Design System Document*
