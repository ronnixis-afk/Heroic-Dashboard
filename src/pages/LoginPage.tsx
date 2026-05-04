import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6 relative overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 h-12 w-12 rounded flex items-center justify-center -rotate-45 bg-gradient-to-tr from-brand-accent to-indigo-500 overflow-hidden shadow-[0_0_30px_rgba(0,178,255,0.3)]">
             {/* Logo */}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Heroic Dashboard</h1>
          <p className="text-sm text-brand-text-muted">Unified Admin Access Control</p>
        </div>

        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#141416] border border-white/5 shadow-2xl rounded-3xl",
              headerTitle: "text-white",
              headerSubtitle: "text-[#8b8c94]",
              socialButtonsBlockButton: "bg-[#1d1e24] border border-[#292a32] hover:bg-[#292a32] text-white",
              socialButtonsBlockButtonText: "text-white font-medium",
              formButtonPrimary: "bg-white text-black hover:bg-gray-200 transition-colors py-3 rounded-full font-bold",
              formFieldLabel: "text-[#8b8c94] text-[11px] font-bold uppercase tracking-wider",
              formFieldInput: "bg-[#111114] border-[#292a32] text-white rounded-xl focus:border-brand-accent transition-all",
              footerActionLink: "text-brand-accent hover:text-white transition-colors",
              dividerLine: "bg-[#1e1f24]",
              dividerText: "text-[#8b8c94] text-[10px]",
              identityPreviewText: "text-white",
              identityPreviewEditButtonIcon: "text-brand-accent"
            }
          }}
          routing="path"
          path="/"
          afterSignInUrl="/admin"
        />
      </motion.div>
    </div>
  );
}
