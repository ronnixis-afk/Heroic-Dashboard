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
  
  // Admin Logic: Check against the master admin email
  // In a production app, you might check a 'role' from Clerk publicMetadata
  const isAdmin = isSignedIn && user?.primaryEmailAddress?.emailAddress === 'ronnixis@gmail.com';

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
