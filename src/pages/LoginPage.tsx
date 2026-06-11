import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, isAdmin, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <div className="h-6 w-6 shimmer rounded-full opacity-50" />
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/5 blur-[100px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 h-8 w-8 rounded bg-gradient-to-tr from-brand-accent to-brand-accent-hover" />
          <h1 className="text-header font-semibold text-brand-text mb-1">Heroic Dashboard</h1>
          <p className="text-xs text-brand-text-muted">Unified Admin Access Control</p>
        </div>

        {user && !isAdmin ? (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card p-5 text-center"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <ShieldAlert size={20} />
            </div>
            <h2 className="mb-1.5 text-title font-semibold">Access Denied</h2>
            <p className="mb-4 text-xs text-brand-text-muted">
              Your account (
              <span className="text-brand-text">{user.primaryEmailAddress?.emailAddress}</span>) does
              not have administrative privileges for this dashboard.
            </p>
            <button onClick={() => signOut()} className="btn-primary w-full">
              <LogOut size={14} />
              Sign Out
            </button>
          </motion.div>
        ) : (
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto w-full',
                card: 'bg-brand-surface border border-brand-border rounded-lg w-full p-3',
                headerTitle: 'text-brand-text font-semibold text-header',
                headerSubtitle: 'text-brand-text-muted text-xs',
                socialButtonsBlockButton:
                  'bg-brand-hover border border-brand-primary hover:bg-brand-primary text-brand-text h-8',
                socialButtonsBlockButtonText: 'text-brand-text font-medium text-xs',
                formButtonPrimary:
                  'bg-white text-black hover:bg-gray-200 transition-colors h-8 rounded-md font-medium text-xs normal-case',
                formFieldLabel: 'text-brand-text-muted text-xs font-medium',
                formFieldInput:
                  'bg-brand-bg border-brand-primary text-brand-text rounded-md h-8 text-xs focus:border-brand-accent transition-all',
                footerActionLink:
                  'text-brand-accent hover:text-brand-text transition-colors text-xs font-medium',
                dividerLine: 'bg-brand-primary/50',
                dividerText: 'text-brand-text-muted text-xs',
                identityPreviewText: 'text-brand-text font-medium text-xs',
                identityPreviewEditButtonIcon: 'text-brand-accent',
              },
            }}
            routing="path"
            path="/login"
            afterSignInUrl="/admin"
          />
        )}
      </motion.div>
    </div>
  );
}
