import React, { createContext, useContext, useEffect, useState } from "react";
import {
  api,
  LoginResponse,
  MfaSetupData,
  PortalMeData,
  UserProfile,
  VenueMembershipInfo,
} from "../api/client";
import { getHostType, HostType } from "../utils/host";

interface AuthContextType {
  hostType: HostType;
  user: UserProfile | null;
  platformRole: string | null;
  memberships: VenueMembershipInfo[];
  selectedVenueId: string | null;
  setSelectedVenueId: (id: string | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaPendingToken: string | null;
  requiresMfaSetup: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyMfa: (code: string) => Promise<void>;
  setupMfa: () => Promise<MfaSetupData>;
  confirmMfaSetup: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearMfa: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hostType] = useState<HostType>(getHostType());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [platformRole, setPlatformRole] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<VenueMembershipInfo[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [mfaPendingToken, setMfaPendingToken] = useState<string | null>(null);
  const [requiresMfaSetup, setRequiresMfaSetup] = useState<boolean>(false);

  const refreshMe = async () => {
    try {
      const data: PortalMeData = await api.getMe();
      setUser(data.user);
      setPlatformRole(data.platform_role);
      setMemberships(data.memberships);
      if (data.memberships.length > 0 && !selectedVenueId) {
        setSelectedVenueId(data.memberships[0].venue_id);
      }
    } catch {
      setUser(null);
      setPlatformRole(null);
      setMemberships([]);
      setSelectedVenueId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.login(email, password, hostType);
    if (res.mfa_token) {
      setMfaPendingToken(res.mfa_token);
      setRequiresMfaSetup(Boolean(res.requires_mfa_setup));
    } else if (res.user) {
      await refreshMe();
    }
    return res;
  };

  const verifyMfa = async (code: string): Promise<void> => {
    if (!mfaPendingToken) {
      throw new Error("No pending MFA session");
    }
    await api.verifyMfa(mfaPendingToken, code, hostType);
    setMfaPendingToken(null);
    setRequiresMfaSetup(false);
    await refreshMe();
  };

  const setupMfa = async (): Promise<MfaSetupData> => {
    if (!mfaPendingToken) {
      throw new Error("No pending MFA session");
    }
    return api.setupMfa(mfaPendingToken);
  };

  const confirmMfaSetup = async (code: string): Promise<void> => {
    if (!mfaPendingToken) {
      throw new Error("No pending MFA session");
    }
    await api.confirmMfaSetup(mfaPendingToken, code, hostType);
    setMfaPendingToken(null);
    setRequiresMfaSetup(false);
    await refreshMe();
  };

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setPlatformRole(null);
      setMemberships([]);
      setSelectedVenueId(null);
      setMfaPendingToken(null);
      setRequiresMfaSetup(false);
    }
  };

  const clearMfa = () => {
    setMfaPendingToken(null);
    setRequiresMfaSetup(false);
  };

  return (
    <AuthContext.Provider
      value={{
        hostType,
        user,
        platformRole,
        memberships,
        selectedVenueId,
        setSelectedVenueId,
        isAuthenticated: Boolean(user),
        isLoading,
        mfaPendingToken,
        requiresMfaSetup,
        login,
        verifyMfa,
        setupMfa,
        confirmMfaSetup,
        logout,
        clearMfa,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
