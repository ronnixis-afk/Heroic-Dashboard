import { clerk } from '@clerk/testing/playwright';
import { expect, test, type Page, type Response } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ronnixis@gmail.com';
const DASHBOARD_ORIGIN = 'https://heroic-dashboard-three.vercel.app';
const RPG_API_ORIGIN = 'https://heroicairpg.com';
const SUPABASE_REST_ORIGIN = 'https://xfqyrpgfgjcypnfibkkf.supabase.co/rest/v1';

type CapturedResponse = {
  method: string;
  status: number;
  url: string;
  body: unknown;
};

async function responseBody(response: Response): Promise<unknown> {
  const contentType = response.headers()['content-type'] || '';
  if (!contentType.includes('application/json')) return null;
  return response.json().catch(() => null);
}

async function openAdminPage(page: Page, path: string, heading: string) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  await expect(page.locator('.status-banner-error')).toHaveCount(0);
  await expect(page.getByText(/Unauthorized|Administrative Access Required/i)).toHaveCount(0);
}

test('Production Dashboard Loads Every Analytics And Data Surface', async ({ page }) => {
  test.setTimeout(180_000);

  const responses: CapturedResponse[] = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (!url.startsWith(RPG_API_ORIGIN) && !url.startsWith(SUPABASE_REST_ORIGIN)) return;
    responses.push({
      method: response.request().method(),
      status: response.status(),
      url,
      body: await responseBody(response),
    });
  });

  await page.goto(`${DASHBOARD_ORIGIN}/login`);
  await clerk.signIn({ page, emailAddress: ADMIN_EMAIL });

  await openAdminPage(page, '/admin', 'Admin Dashboard');
  await expect(page.getByRole('heading', { name: 'Revenue & API Costs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent Signups' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Top Consumers' })).toBeVisible();

  await openAdminPage(page, '/admin/analytics', 'Live Analytics');
  await expect(page.getByRole('heading', { name: 'Usage Leaderboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Performance Trends' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Engine Health' })).toBeVisible();

  await openAdminPage(page, '/admin/reports/audience', 'Audience Reports');
  await expect(page.getByText('Active Right Now', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'User Retention' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Churn Signals' })).toBeVisible();

  await openAdminPage(page, '/admin/reports/usage', 'Usage Reports');
  await expect(page.getByRole('heading', { name: 'Product Surfaces (30 Days)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Feature Adoption (30 Days)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Messages Per User (7 Days)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Page Visits (30 Days)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Session Lengths (30 Days)' })).toBeVisible();

  await openAdminPage(page, '/admin/reports/financial', 'Financial Reports');
  await expect(page.getByRole('heading', { name: 'API Cost Distribution' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cost by Model (30 Days)' })).toBeVisible();

  const dataPages = [
    ['/admin/users', 'User Management'],
    ['/admin/news', 'Global Announcements'],
    ['/admin/media', 'Media Library'],
    ['/admin/credits', 'Credit Monitoring'],
    ['/admin/feedback', 'User Feedback'],
    ['/admin/emails', 'Email Templates'],
    ['/admin/settings', 'System Settings'],
  ] as const;

  for (const [path, heading] of dataPages) {
    await openAdminPage(page, path, heading);
  }

  const failures = responses.filter(
    (response) => response.method !== 'OPTIONS' && response.status >= 400
  );
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);

  const requiredRpgRoutes = [
    '/api/admin/analytics/dashboard-metrics',
    '/api/admin/analytics/view-data',
    '/api/admin/analytics/cost-analytics',
    '/api/admin/analytics/feature-usage',
    '/api/admin/analytics/session-length',
    '/api/admin/analytics/messages-per-user',
    '/api/admin/analytics/active-users',
    '/api/admin/analytics/retention',
    '/api/admin/analytics/churn-signals',
    '/api/admin/telemetry',
    '/api/analytics/behavior',
  ];

  for (const route of requiredRpgRoutes) {
    expect(
      responses.some(
        (response) =>
          response.url.startsWith(`${RPG_API_ORIGIN}${route}`) &&
          response.method !== 'OPTIONS' &&
          response.status === 200
      ),
      `Expected a successful production response from ${route}`
    ).toBe(true);
  }

  const jsonResponses = responses.filter(
    (response) => response.method !== 'OPTIONS' && response.status === 200
  );
  for (const response of jsonResponses) {
    if (!response.body || typeof response.body !== 'object') continue;
    expect(response.body, `Error payload returned by ${response.url}`).not.toHaveProperty('error');
  }
});

test('Protected Analytics Reject Requests Without A Session', async ({ request }) => {
  const response = await request.get(
    `${RPG_API_ORIGIN}/api/admin/analytics/dashboard-metrics`,
    { headers: { Origin: DASHBOARD_ORIGIN } }
  );

  expect(response.status()).toBe(401);
  expect(response.headers()['access-control-allow-origin']).toBe(DASHBOARD_ORIGIN);
  await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
});

test('Analytics CORS Preflight Allows The Production Dashboard', async ({ request }) => {
  const response = await request.fetch(
    `${RPG_API_ORIGIN}/api/admin/analytics/dashboard-metrics`,
    {
      method: 'OPTIONS',
      headers: {
        Origin: DASHBOARD_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    }
  );

  expect(response.status()).toBe(204);
  expect(response.headers()['access-control-allow-origin']).toBe(DASHBOARD_ORIGIN);
  expect(response.headers()['access-control-allow-headers']).toContain('Authorization');
});
