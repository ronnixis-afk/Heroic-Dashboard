import React, { createContext, useContext } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  const loading = !isLoaded;
  
  // Admin Logic: Check against the master admin emails
  const adminEmails = (import.meta.env.VITE_SUPER_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase());
  const isAdmin = isSignedIn && !!user?.primaryEmailAddress?.emailAddress && 
    adminEmails.includes(user.primaryEmailAddress.emailAddress.toLowerCase());

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      loading, 
      isAdmin,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
