import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { fetchRpgAdmin } from './rpgAdminApi';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isAdmin: boolean;
  /** Fast client-side hint from VITE_SUPER_ADMIN_EMAILS — not authoritative. */
  emailHintIsAdmin: boolean;
  signOut: () => Promise<void>;
  getToken: (options?: any) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  emailHintIsAdmin: false,
  signOut: async () => {},
  getToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, getToken } = useClerkAuth();
  /** null = not yet confirmed by server (or signed out). */
  const [serverIsAdmin, setServerIsAdmin] = useState<boolean | null>(null);

  const adminEmails = (import.meta.env.VITE_SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const emailHintIsAdmin =
    !!isSignedIn &&
    !!user?.primaryEmailAddress?.emailAddress &&
    adminEmails.includes(user.primaryEmailAddress.emailAddress.toLowerCase());

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded) return;

    if (!isSignedIn) {
      setServerIsAdmin(null);
      return;
    }

    setServerIsAdmin(null);

    fetchRpgAdmin<{ isAdmin: boolean }>('/api/admin/whoami', getToken)
      .then((result) => {
        if (!cancelled) setServerIsAdmin(result.isAdmin === true);
      })
      .catch((error) => {
        console.error('[Auth] Admin whoami check failed:', error);
        if (!cancelled) setServerIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  // Wait for Clerk load, and for server admin confirmation while signed in
  // so ProtectedRoute does not flash deny then allow.
  const loading = !isLoaded || (!!isSignedIn && serverIsAdmin === null);
  const isAdmin = serverIsAdmin === true;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        loading,
        isAdmin,
        emailHintIsAdmin,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
