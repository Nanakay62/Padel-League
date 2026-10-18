import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { LoginView } from "./components/auth/LoginView";
import { MfaVerifyView } from "./components/auth/MfaVerifyView";
import { MfaSetupView } from "./components/auth/MfaSetupView";
import { InviteAcceptView } from "./components/auth/InviteAcceptView";
import { ClubShell } from "./components/layout/ClubShell";
import { SuperAdminShell } from "./components/layout/SuperAdminShell";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { setDevHostType } from "./utils/host";

export const App: React.FC = () => {
  const {
    hostType,
    isAuthenticated,
    isLoading,
    user,
    platformRole,
    logout,
    mfaPendingToken,
    requiresMfaSetup,
  } = useAuth();

  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Check for invite token in URL
  const searchParams = new URLSearchParams(window.location.search);
  const inviteToken = searchParams.get("token") || searchParams.get("invite_token");

  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".vercel.app");

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--surface)",
          fontSize: "14px",
          color: "var(--outline)",
        }}
      >
        Initializing Padel Ghana Portal...
      </div>
    );
  }

  // 1. Staff Invite Acceptance Flow
  if (inviteToken && !inviteSuccess) {
    return (
      <InviteAcceptView
        token={inviteToken}
        onSuccess={() => {
          setInviteSuccess(true);
          // Remove token from URL
          const url = new URL(window.location.href);
          url.searchParams.delete("token");
          url.searchParams.delete("invite_token");
          window.history.replaceState({}, "", url.toString());
        }}
      />
    );
  }

  // 2. Unauthenticated / MFA Flow
  if (!isAuthenticated) {
    if (mfaPendingToken) {
      if (requiresMfaSetup) {
        return <MfaSetupView />;
      }
      return <MfaVerifyView />;
    }
    return (
      <>
        <LoginView />
        {isLocalDev && (
          <div
            style={{
              position: "fixed",
              bottom: "16px",
              right: "16px",
              backgroundColor: "var(--inverse-surface)",
              color: "#ffffff",
              padding: "8px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "var(--shadow-lg)",
              zIndex: 9999,
            }}
          >
            <span>Dev Host: <strong>{hostType}</strong></span>
            <button
              type="button"
              onClick={() => setDevHostType(hostType === "CLUB" ? "ADMIN" : "CLUB")}
              style={{
                backgroundColor: "var(--primary-container)",
                color: "#ffffff",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              Switch to {hostType === "CLUB" ? "Super Admin" : "Club"}
            </button>
          </div>
        )}
      </>
    );
  }

  // 3. Role Validation Guards for Host Types
  if (hostType === "ADMIN" && platformRole !== "SUPER_ADMIN" && platformRole !== "ADMIN") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--surface)",
          padding: "var(--spacing-6)",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-6)",
            boxShadow: "var(--shadow-md)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🛡️</div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--on-surface)" }}>
            Super Admin Privileges Required
          </h2>
          <p style={{ fontSize: "14px", color: "var(--on-surface-variant)", marginBottom: "var(--spacing-5)", lineHeight: 1.5 }}>
            You are currently signed in as <strong>{user?.email}</strong>. This account has Club Staff / Player credentials and cannot access the platform-wide Super Admin portal.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setDevHostType("CLUB")}
              style={{
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Switch to Club Back Office →
            </button>
            <button
              type="button"
              onClick={logout}
              style={{
                backgroundColor: "transparent",
                color: "var(--error)",
                border: "1px solid var(--error-container)",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Sign Out to Log in as Super Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated Dual Shells
  return (
    <ErrorBoundary fallbackTitle="Portal System Error">
      {hostType === "ADMIN" ? (
        <SuperAdminShell />
      ) : (
        <ClubShell />
      )}

      {isLocalDev && (
        <div
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            backgroundColor: "var(--inverse-surface)",
            color: "#ffffff",
            padding: "8px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "var(--shadow-lg)",
            zIndex: 9999,
          }}
        >
          <span>Dev Host: <strong>{hostType}</strong></span>
          <button
            type="button"
            onClick={() => setDevHostType(hostType === "CLUB" ? "ADMIN" : "CLUB")}
            style={{
              backgroundColor: "var(--primary-container)",
              color: "#ffffff",
              padding: "3px 10px",
              borderRadius: "var(--radius-full)",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Switch to {hostType === "CLUB" ? "Super Admin" : "Club"}
          </button>
        </div>
      )}
    </ErrorBoundary>
  );
};
