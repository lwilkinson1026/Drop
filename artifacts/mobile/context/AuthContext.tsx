import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { isAdminEmail } from "@/constants/adminConfig";
import { AuthUser, subscribeToAuthState } from "@/services/authService";
import { isFirebaseConfigured } from "@/services/firebase";

interface AuthContextValue {
  authUser: AuthUser | null;
  isAuthLoading: boolean;
  isAdmin: boolean;
  isFirebaseReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  authUser: null,
  isAuthLoading: true,
  isAdmin: false,
  isFirebaseReady: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsAuthLoading(false);
      return;
    }
    const unsub = subscribeToAuthState((u) => {
      setAuthUser(u);
      setIsAuthLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo(
    () => ({
      authUser,
      isAuthLoading,
      isAdmin: isAdminEmail(authUser?.email),
      isFirebaseReady: isFirebaseConfigured,
    }),
    [authUser, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
