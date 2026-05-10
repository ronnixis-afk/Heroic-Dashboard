# Google Analytics Audit Report: Heroic AI RPG & Heroic Dashboard

This report identifies logic gaps, connection issues, and implementation risks across both the Heroic AI RPG engine and its Administrative Dashboard.

## 1. Heroic AI RPG (Engine)

### Logic Gaps & Implementation Risks
*   **Duplicate Environment Variables**: The `.env` file contains `NEXT_PUBLIC_GA_ID` twice (Line 18 and Line 35). This can lead to the wrong ID being used if the loader behavior is inconsistent.
*   **Implementation Divergence**: 
    *   Initialization uses the robust `@next/third-parties/google` library.
    *   User identification (`AnalyticsIdentify.tsx`) uses raw `window.gtag` calls. 
    *   **Risk**: If `window.gtag` is not yet available when the component mounts, user identification will fail.
*   **Custom Dimension Dependency**: The backend reporting route (`/api/analytics/behavior`) assumes that `userId` and `customEvent:gm_mode` are registered as **Custom Dimensions** in the GA4 Property. 
    *   **Effect**: If these are not configured in the Google Analytics UI, all filtered reports will return 0 data or errors.
*   **Silent Fallbacks**: The API route returns "Mock Data" if credentials or property IDs are missing. While helpful for UI development, this can mask configuration failures in production.

### Connection Issues
*   **Service Account Authorization**: The code uses a service account for reporting. This account MUST have "Viewer" permissions on the GA4 Property (`536943197`) within the Google Analytics Admin console.

---

## 2. Heroic Dashboard (Admin Panel)

### Logic Gaps
*   **Zero Tracking**: The Dashboard application itself has NO Google Analytics tracking implemented. 
    *   `AnalyticsService.ts` contains only mocked console logs.
    *   `index.html` lacks the GA4 global site tag.
*   **Analytics Labeling Ambiguity**: The "Analytics" tab in the dashboard primarily displays data from the Supabase `UsageLog` and `UserSession` tables, NOT Google Analytics. Real GA4 data is only used in the `EngineHealthDashboard` sub-component.

### Connection Issues
*   **Authentication Failure**: The Dashboard calls the RPG API (`/api/analytics/behavior`) to fetch GA4 data. 
    *   The RPG API route **requires** a Clerk session and `super_admin` tier.
    *   `EngineTelemetryService.ts` currently performs a standard `fetch` without passing any authorization tokens or cookies.
    *   **Result**: Requests will likely return `401 Unauthorized` or `403 Forbidden` in production.
*   **CORS (Cross-Origin Resource Sharing)**: The Dashboard (`localhost:5173`) attempts to fetch data from the RPG API (`localhost:3000`). Without explicit CORS configuration in the RPG Next.js app, these requests will be blocked by the browser.
*   **Hardcoded API URL**: `VITE_RPG_API_URL` defaults to `localhost:3000`. This will break in staging/production unless specifically updated in the environment.

---

## 3. Critical Recommendations

1.  **Unified Auth**: Implement a mechanism to pass the Clerk JWT from the Dashboard to the RPG API telemetry routes.
2.  **GA4 Property Audit**: Verify that `userId` and `gm_mode` are registered as custom dimensions in the GA4 console for Property `536943197`.
3.  **Dashboard Tracking**: Add the GA4 script to `Heroic Dashboard` to track admin usage.
4.  **Clean Env**: Consolidate `NEXT_PUBLIC_GA_ID` in the RPG `.env` to a single, clear entry.
5.  **CORS Policy**: Add a permissive (or dashboard-specific) CORS policy to the RPG API routes.
