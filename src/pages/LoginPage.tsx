import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, isAdmin, signOut } = useAuth();

  // If loading auth state, show a shimmer placeholder
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="h-8 w-8 shimmer rounded-full opacity-50" />
      </div>
    );
  }

  // If already logged in and an admin, redirect to dashboard
  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6 relative overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 h-12 w-12 rounded flex items-center justify-center -rotate-45 bg-gradient-to-tr from-brand-accent to-indigo-500 overflow-hidden shadow-[0_0_30px_rgba(0,178,255,0.3)]">
             {/* Logo */}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Heroic Dashboard</h1>
          <p className="text-[#8b8c94] text-sm font-medium">Unified Admin Access Control</p>
        </div>

        {user && !isAdmin ? (
          /* Access Denied State */
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl border border-red-500/20 bg-[#141416] p-8 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <ShieldAlert size={32} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Access Denied</h2>
            <p className="mb-6 text-sm text-[#8b8c94] font-medium">
              Your account (<span className="text-white">{user.primaryEmailAddress?.emailAddress}</span>) 
              does not have administrative privileges for this dashboard.
            </p>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-black transition-colors hover:bg-white/90"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </motion.div>
        ) : (
          /* Sign In Form */
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-[#141416] border border-white/5 shadow-2xl rounded-3xl w-full",
                headerTitle: "text-white font-bold text-xl",
                headerSubtitle: "text-[#8b8c94] text-sm font-medium",
                socialButtonsBlockButton: "bg-[#1d1e24] border border-[#292a32] hover:bg-[#292a32] text-white",
                socialButtonsBlockButtonText: "text-white font-bold text-sm",
                formButtonPrimary: "bg-white text-black hover:bg-white/90 transition-colors py-3 rounded-full font-bold text-sm",
                formFieldLabel: "text-[#8b8c94] text-[10px] font-bold",
                formFieldInput: "bg-[#0A0A0A] border-[#292a32] text-white rounded-xl focus:border-[#00b2ff] transition-all",
                footerActionLink: "text-[#00b2ff] hover:text-white transition-colors text-sm font-bold",
                dividerLine: "bg-[#292a32]/50",
                dividerText: "text-[#8b8c94] text-[10px]",
                identityPreviewText: "text-white font-bold",
                identityPreviewEditButtonIcon: "text-[#00b2ff]"
              }
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
