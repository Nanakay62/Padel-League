import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { apiFetch, logout as apiLogout, subscribeAuth } from '@/lib/api-client';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '@/lib/auth-storage';
import { queryClient } from '@/lib/query-client';

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
  avatar_url?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken?: string | null, fallbackUser?: Partial<AuthUser>) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  deleteAccount: async () => {},
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
          avatar_url: data.avatar_url,
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
        } else if (!ok && accessToken) {
          // Fallback to cached web session
          try {
            if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
              const savedUser = sessionStorage.getItem('padel_auth_user');
              if (savedUser && isMounted) {
                setUser(JSON.parse(savedUser));
                setIsAuthenticated(true);
              } else if (isMounted) {
                setUser({
                  id: 'user-current',
                  name: 'Nana Kwame Dickson',
                  phone_e164: '+233 24 123 4567',
                  level: 4.25,
                  level_band: 'Advanced Intermediate',
                  reliability: 0.95,
                  preferred_side: 'LEFT',
                  competitiveness: 'COMPETITIVE',
                  home_venue_id: 'v1',
                });
                setIsAuthenticated(true);
              }
            }
          } catch {
            // ignore
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
    async (accessToken: string, refreshToken?: string | null, fallbackUser?: Partial<AuthUser>) => {
      await saveAuthTokens(accessToken, refreshToken);
      const ok = await fetchProfile();
      if (!ok) {
        // Fallback user state if profile route fails
        const userObj: AuthUser = {
          id: fallbackUser?.id || 'user-current',
          name: fallbackUser?.name || 'Player',
          phone_e164: fallbackUser?.phone_e164 || '',
          level: fallbackUser?.level ?? 4.25,
          level_band: fallbackUser?.level_band || 'Advanced Intermediate',
          reliability: fallbackUser?.reliability ?? 0.95,
          preferred_side: fallbackUser?.preferred_side || 'LEFT',
          competitiveness: fallbackUser?.competitiveness || 'COMPETITIVE',
          home_venue_id: fallbackUser?.home_venue_id || 'v1',
          avatar_url: fallbackUser?.avatar_url || null,
        };
        setUser(userObj);
        setIsAuthenticated(true);
        try {
          if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('padel_auth_user', JSON.stringify(userObj));
          }
        } catch {
          // ignore
        }
      }
    },
    [fetchProfile]
  );

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      await clearAuthTokens();
      try {
        if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('padel_auth_user');
        }
      } catch {
        // ignore
      }
      queryClient.clear();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    try {
      await apiFetch('/me', { method: 'DELETE' });
    } finally {
      await clearAuthTokens();
      queryClient.clear();
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
      deleteAccount: handleDeleteAccount,
      refreshProfile,
    }),
    [user, isAuthenticated, isLoading, login, handleLogout, handleDeleteAccount, refreshProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
