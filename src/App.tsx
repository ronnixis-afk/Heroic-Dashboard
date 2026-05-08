import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNews from './pages/admin/AdminNews';
import AdminCredits from './pages/admin/AdminCredits';
import AdminAnalytics from './pages/admin/AdminAnalytics';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0A0A0A] text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0A0A0A] p-4 text-center">
        <div className="max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-white shadow-xl backdrop-blur-sm">
          <h1 className="mb-4 text-2xl font-bold text-red-400">Configuration Error</h1>
          <p className="mb-2 text-gray-300">
            The application failed to start because the <code className="rounded bg-black/50 px-2 py-1 text-red-300">VITE_CLERK_PUBLISHABLE_KEY</code> environment variable is missing.
          </p>
          <p className="text-sm text-gray-400">
            If you are viewing this on Vercel, please add this variable in your project's Environment Variables settings and redeploy.
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
            <Routes>
              {/* Landing or Redirect to Admin */}
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
                <Route path="credits" element={<AdminCredits />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>
              
              {/* Catch-all: redirect to admin */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
