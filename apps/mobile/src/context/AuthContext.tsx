import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch, logout as apiLogout, subscribeAuth } from '@/lib/api-client';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '@/lib/auth-storage';

export interface AuthUser {
  id: string;
  name: string;
  phone_e164: string;
  is_provisional?: boolean;
  level?: number;
  level_band?: string;
  reliability?: number;
  preferred_side?: string;
  competitiveness?: string;
  home_venue_id?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiFetch('/me');
      if (res.ok) {
        const data = await res.json();
        setUser({
          id: data.id,
          name: data.name,
          phone_e164: data.phone_e164,
          is_provisional: data.is_provisional,
          level: data.level,
          level_band: data.level_band,
          reliability: data.reliability,
          preferred_side: data.preferred_side,
          competitiveness: data.competitiveness,
          home_venue_id: data.home_venue_id,
        });
        setIsAuthenticated(true);
        return true;
      }
    } catch {
      // Profile fetch failed
    }
    return false;
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { accessToken } = await getAuthTokens();
        // Even if accessToken in memory is null on web, a cookie may exist, so attempt /me
        const ok = await fetchProfile();
        if (!ok && !accessToken) {
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const unsubscribe = subscribeAuth((authed) => {
      if (!authed) {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchProfile]);

  const login = useCallback(
    async (accessToken: string, refreshToken?: string | null) => {
      await saveAuthTokens(accessToken, refreshToken);
      const ok = await fetchProfile();
      if (!ok) {
        // Fallback user state if profile route fails
        setUser({
          id: 'user-current',
          name: 'Player',
          phone_e164: '',
        });
        setIsAuthenticated(true);
      }
    },
    [fetchProfile]
  );

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      await clearAuthTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout: handleLogout,
      refreshProfile,
    }),
    [user, isAuthenticated, isLoading, login, handleLogout, refreshProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
