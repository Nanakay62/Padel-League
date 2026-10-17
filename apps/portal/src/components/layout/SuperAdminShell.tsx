import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminOverviewView } from "../admin/AdminOverviewView";
import { AdminVenuesView } from "../admin/AdminVenuesView";
import { AdminAuditView } from "../admin/AdminAuditView";
import { AdminSettingsView } from "../admin/AdminSettingsView";
import { ClubDashboardView } from "../club/ClubDashboardView";
import { ClubProfileView } from "../club/ClubProfileView";
import { ClubCourtsView } from "../club/ClubCourtsView";
import { ClubPricingView } from "../club/ClubPricingView";
import { ClubPhotosView } from "../club/ClubPhotosView";
import { ClubStaffView } from "../club/ClubStaffView";
import { ClubAuditView } from "../club/ClubAuditView";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { ClubTab } from "./ClubShell";

export type AdminTab = "overview" | "venues" | "create-venue" | "staff" | "audit" | "settings";

interface SuperAdminShellProps {
  viewingVenueName?: string | null;
  children?: (tab: AdminTab) => React.ReactNode;
}

export const SuperAdminShell: React.FC<SuperAdminShellProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stepInVenue, setStepInVenue] = useState<{ id: string; name: string } | null>(null);
  const [stepInSubTab, setStepInSubTab] = useState<ClubTab>("dashboard");

  const navItems: Array<{ id: AdminTab; label: string; icon: string }> = [
    { id: "overview", label: "Platform Overview", icon: "🌐" },
    { id: "venues", label: "Venues Directory", icon: "🏢" },
    { id: "create-venue", label: "Register Venue", icon: "➕" },
    { id: "staff", label: "Staff & Admins", icon: "🛡️" },
    { id: "audit", label: "Platform Audit Log", icon: "📜" },
    { id: "settings", label: "System Settings", icon: "⚙️" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--surface)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "260px",
          backgroundColor: "var(--inverse-surface)",
          color: "var(--inverse-on-surface)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "var(--spacing-5) var(--spacing-4)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--primary-container)",
              marginBottom: "4px",
            }}
          >
            Padel Ghana Platform
          </div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
            Super Admin Portal
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
                  color: isActive ? "#ffffff" : "var(--inverse-on-surface)",
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
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--error)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              SA
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {user?.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--outline-variant)" }}>
                Platform Super Admin
              </div>
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
                color: "#4ade80",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#4ade80",
                }}
              />
              2FA Active
            </span>
            <button
              type="button"
              onClick={logout}
              style={{
                fontSize: "12px",
                color: "#f87171",
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
        {/* Step-in Warning Banner */}
        {stepInVenue && (
          <div
            style={{
              backgroundColor: "var(--warning-surface)",
              color: "var(--warning)",
              padding: "10px var(--spacing-6)",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #fde68a",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️</span>
              <span>
                <strong>Platform Staff Step-In Active:</strong> You are managing{" "}
                <em>{stepInVenue.name}</em>. Changes are logged as platform edits and dispatch an alert to the owner.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStepInVenue(null)}
              style={{
                backgroundColor: "var(--surface-container-lowest)",
                border: "1px solid var(--warning)",
                color: "var(--warning)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Exit Step-In
            </button>
          </div>
        )}

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
            {stepInVenue
              ? `${stepInVenue.name} — ${stepInSubTab.toUpperCase()}`
              : activeTab.replace("-", " ")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {stepInVenue ? (
              <div style={{ display: "flex", gap: "6px" }}>
                {(
                  [
                    "dashboard",
                    "profile",
                    "courts",
                    "pricing",
                    "photos",
                    "staff",
                    "activity",
                  ] as ClubTab[]
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStepInSubTab(tab)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor:
                        stepInSubTab === tab ? "var(--primary)" : "var(--surface-container-high)",
                      color: stepInSubTab === tab ? "#ffffff" : "var(--on-surface)",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {tab === "activity" ? "Audit" : tab}
                  </button>
                ))}
              </div>
            ) : (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--error-container)",
                  color: "var(--on-error-container)",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Platform Staff
              </span>
            )}
          </div>
        </header>

        {/* Tab Body */}
        <div style={{ padding: "var(--spacing-6)", flex: 1 }}>
          <ErrorBoundary fallbackTitle={`Error loading ${stepInVenue ? stepInSubTab : activeTab}`}>
            {children ? (
              children(activeTab)
            ) : stepInVenue ? (
              <>
                {stepInSubTab === "dashboard" && (
                  <ClubDashboardView
                    onNavigate={(t) => setStepInSubTab(t)}
                    venueId={stepInVenue.id}
                  />
                )}
                {stepInSubTab === "profile" && <ClubProfileView venueId={stepInVenue.id} />}
                {stepInSubTab === "courts" && <ClubCourtsView venueId={stepInVenue.id} />}
                {stepInSubTab === "pricing" && <ClubPricingView venueId={stepInVenue.id} />}
                {stepInSubTab === "photos" && <ClubPhotosView venueId={stepInVenue.id} />}
                {stepInSubTab === "staff" && <ClubStaffView venueId={stepInVenue.id} />}
                {stepInSubTab === "activity" && <ClubAuditView venueId={stepInVenue.id} />}
              </>
            ) : (
              <>
                {activeTab === "overview" && (
                  <AdminOverviewView onNavigate={(tab) => setActiveTab(tab)} />
                )}
                {activeTab === "venues" && (
                  <AdminVenuesView
                    onStepInToClub={(vId, vName) => {
                      setStepInVenue({ id: vId, name: vName });
                      setStepInSubTab("dashboard");
                    }}
                  />
                )}
                {activeTab === "create-venue" && (
                  <AdminVenuesView
                    initialOpenRegister={true}
                    onStepInToClub={(vId, vName) => {
                      setStepInVenue({ id: vId, name: vName });
                      setStepInSubTab("dashboard");
                    }}
                  />
                )}
                {activeTab === "audit" && <AdminAuditView />}
                {activeTab === "settings" && <AdminSettingsView />}
                {activeTab === "staff" && (
                  <div
                    style={{
                      backgroundColor: "var(--surface-container-lowest)",
                      border: "1px solid var(--outline-variant)",
                      borderRadius: "var(--radius-lg)",
                      padding: "var(--spacing-8)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                      Platform Staff & Global Administrators
                    </h3>
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "14px" }}>
                      Platform staff access is governed by the <code>SUPER_ADMIN</code> platform role.
                      All platform administrators are strictly required to have active 2FA (TOTP) and
                      their actions on clubs are subject to step-in accountability.
                    </p>
                  </div>
                )}
              </>
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
