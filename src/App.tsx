import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/AuthContext';
import AdminLayout from './components/AdminLayout';
import PageLoader from './components/ui/PageLoader';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminNews = lazy(() => import('./pages/admin/AdminNews'));
const AdminCredits = lazy(() => import('./pages/admin/AdminCredits'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'));
const AdminEmails = lazy(() => import('./pages/admin/AdminEmails'));
const AudienceReports = lazy(() => import('./pages/admin/AudienceReports'));
const UsageReports = lazy(() => import('./pages/admin/UsageReports'));
const FinancialReports = lazy(() => import('./pages/admin/FinancialReports'));

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center p-6">
    <PageLoader label="Loading Page" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg text-brand-text">
        <div className="h-6 w-6 shimmer rounded-full opacity-50" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-brand-bg p-4 text-center">
        <div className="card max-w-md p-3.5 border-red-500/30 bg-red-500/10">
          <h1 className="text-header font-semibold text-red-400 mb-3">Configuration Error</h1>
          <p className="text-xs text-brand-text-muted mb-2">
            The application failed to start because the{' '}
            <code className="rounded bg-brand-bg px-1.5 py-0.5 text-red-300">
              VITE_CLERK_PUBLISHABLE_KEY
            </code>{' '}
            environment variable is missing.
          </p>
          <p className="text-xs text-brand-text-muted">
            If you are viewing this on Vercel, please add this variable in your project's
            Environment Variables settings and redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/admin" replace />} />
                <Route path="/login" element={<LoginPage />} />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="news" element={<AdminNews />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="credits" element={<AdminCredits />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="emails" element={<AdminEmails />} />
                  <Route path="settings" element={<AdminSettings />} />

                  <Route path="reports">
                    <Route index element={<Navigate to="/admin" replace />} />
                    <Route path="audience" element={<AudienceReports />} />
                    <Route path="usage" element={<UsageReports />} />
                    <Route path="financial" element={<FinancialReports />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
