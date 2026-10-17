import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ClubDashboardView } from "../club/ClubDashboardView";
import { ClubProfileView } from "../club/ClubProfileView";
import { ClubCourtsView } from "../club/ClubCourtsView";
import { ClubPricingView } from "../club/ClubPricingView";
import { ClubStaffView } from "../club/ClubStaffView";
import { ClubAuditView } from "../club/ClubAuditView";
import { ClubPhotosView } from "../club/ClubPhotosView";
import { ErrorBoundary } from "../common/ErrorBoundary";

export type ClubTab = "dashboard" | "profile" | "courts" | "pricing" | "photos" | "staff" | "activity";

interface ClubShellProps {
  children?: (tab: ClubTab) => React.ReactNode;
}

export const ClubShell: React.FC<ClubShellProps> = ({ children }) => {
  const { user, memberships, selectedVenueId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ClubTab>("dashboard");

  const currentMembership = memberships.find((m) => m.venue_id === selectedVenueId) || memberships[0];
  const clubName = currentMembership?.venue_name || "My Padel Club";
  const userRole = currentMembership?.role || user?.role || "Staff";

  const navItems: Array<{ id: ClubTab; label: string; icon: string }> = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "profile", label: "Club Profile", icon: "🏢" },
    { id: "courts", label: "Courts & Capacity", icon: "🎾" },
    { id: "pricing", label: "Pricing & Hours", icon: "💰" },
    { id: "photos", label: "Venue Photos", icon: "📷" },
    { id: "staff", label: "Staff & Roles", icon: "👥" },
    { id: "activity", label: "Audit & Activity", icon: "📜" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--surface)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "var(--surface-container-low)",
          borderRight: "1px solid var(--outline-variant)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "var(--spacing-5) var(--spacing-4)",
            borderBottom: "1px solid var(--outline-variant)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--primary)",
              marginBottom: "4px",
            }}
          >
            Club Back Office
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--on-surface)" }}>
            {clubName}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "var(--spacing-3) var(--spacing-2)" }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "4px",
                  backgroundColor: isActive ? "var(--primary-container)" : "transparent",
                  color: isActive ? "#ffffff" : "var(--on-surface)",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "14px",
                  textAlign: "left",
                  transition: "background-color 0.15s",
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div
          style={{
            padding: "var(--spacing-4)",
            borderTop: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-container)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {user?.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--outline)" }}>{userRole}</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--success)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "var(--success)",
                }}
              />
              2FA Active
            </span>
            <button
              type="button"
              onClick={logout}
              style={{
                fontSize: "12px",
                color: "var(--error)",
                fontWeight: 600,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {/* Top Header */}
        <header
          style={{
            height: "60px",
            borderBottom: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-container-lowest)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 var(--spacing-6)",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700, textTransform: "capitalize" }}>
            {activeTab.replace("-", " ")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--surface-container-high)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
              }}
            >
              Timezone: Africa/Accra (UTC+0)
            </span>
          </div>
        </header>

        {/* Tab Body */}
        <div style={{ padding: "var(--spacing-6)", flex: 1 }}>
          <ErrorBoundary fallbackTitle={`Error loading ${activeTab}`}>
            {children ? (
              children(activeTab)
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <ClubDashboardView
                    onNavigate={(tab) => setActiveTab(tab)}
                    venueId={selectedVenueId || undefined}
                  />
                )}
                {activeTab === "profile" && (
                  <ClubProfileView venueId={selectedVenueId || undefined} />
                )}
                {activeTab === "courts" && (
                  <ClubCourtsView venueId={selectedVenueId || undefined} />
                )}
                {activeTab === "pricing" && (
                  <ClubPricingView venueId={selectedVenueId || undefined} />
                )}
                {activeTab === "photos" && (
                  <ClubPhotosView venueId={selectedVenueId || undefined} />
                )}
                {activeTab === "staff" && (
                  <ClubStaffView venueId={selectedVenueId || undefined} />
                )}
                {activeTab === "activity" && (
                  <ClubAuditView venueId={selectedVenueId || undefined} />
                )}
              </>
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
