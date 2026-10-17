import React, { useEffect, useState } from "react";
import { api, ClubProfileResponse, PricingData, ClubStaffResponse, AuditLogItem } from "../../api/client";
import { ClubTab } from "../layout/ClubShell";

interface ClubDashboardViewProps {
  onNavigate: (tab: ClubTab) => void;
  venueId?: string;
}

export const ClubDashboardView: React.FC<ClubDashboardViewProps> = ({ onNavigate, venueId }) => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ClubProfileResponse | null>(null);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [staffData, setStaffData] = useState<ClubStaffResponse | null>(null);
  const [recentAudit, setRecentAudit] = useState<AuditLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [prof, pricing, staff, audit] = await Promise.all([
          api.getClubProfile(venueId),
          api.getPricing(venueId),
          api.getStaff(venueId),
          api.getAudit(venueId),
        ]);
        if (!mounted) return;
        setProfileData(prof);
        setPricingData(pricing);
        setStaffData(staff);
        setRecentAudit((audit?.items || []).slice(0, 5));
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Failed to load club dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [venueId]);

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading club operations dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "var(--spacing-4)",
          backgroundColor: "var(--error-container)",
          color: "var(--on-error-container)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--spacing-4)",
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    );
  }

  const venue = profileData?.venue;
  const baseRateGhs = ((pricingData?.base_rate_pesewas || 0) / 100).toFixed(2);
  const courtsCount = venue?.courts_count ?? venue?.courts?.length ?? 0;
  const staffCount = staffData?.staff?.length ?? 0;

  // Today in Accra
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const currentDay = daysOfWeek[now.getUTCDay()]; // UTC matches Africa/Accra UTC+0
  const todayHours = pricingData?.opening_hours?.[currentDay.toLowerCase()] || "07:00-22:00";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {/* Step-In Notice if Super Admin */}
      {profileData?.step_in_actor && (
        <div
          style={{
            backgroundColor: "var(--warning-surface)",
            color: "var(--warning)",
            border: "1px solid var(--warning)",
            padding: "var(--spacing-3) var(--spacing-4)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>⚠️</span>
          <span>
            <strong>Platform Step-In Active:</strong> You are managing this club as{" "}
            <em>{profileData.step_in_actor}</em>. All updates are audited and attributed.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--spacing-4)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            padding: "var(--spacing-5)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--outline)", textTransform: "uppercase" }}>
            Total Courts
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--on-surface)", marginTop: "4px" }}>
            {courtsCount}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("courts")}
            style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "8px" }}
          >
            Manage Courts →
          </button>
        </div>

        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            padding: "var(--spacing-5)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--outline)", textTransform: "uppercase" }}>
            Base Hourly Rate
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--on-surface)", marginTop: "4px" }}>
            GH₵ {baseRateGhs}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("pricing")}
            style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "8px" }}
          >
            Configure Pricing →
          </button>
        </div>

        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            padding: "var(--spacing-5)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--outline)", textTransform: "uppercase" }}>
            Today's Hours ({currentDay})
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--on-surface)", marginTop: "4px" }}>
            {todayHours}
          </div>
          <div style={{ fontSize: "11px", color: "var(--outline)", marginTop: "8px" }}>
            Timezone: Africa/Accra (UTC+0)
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            padding: "var(--spacing-5)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--outline)", textTransform: "uppercase" }}>
            Club Staff & Roles
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--on-surface)", marginTop: "4px" }}>
            {staffCount} Active
          </div>
          <button
            type="button"
            onClick={() => onNavigate("staff")}
            style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "8px" }}
          >
            Staff Settings →
          </button>
        </div>
      </div>

      {/* Main Grid: Profile Snapshot & Recent Activity */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "var(--spacing-6)",
        }}
      >
        {/* Profile Snapshot */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)",
            padding: "var(--spacing-5)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--spacing-4)",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Club Information</h3>
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--primary)",
                border: "1px solid var(--primary)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              Edit Profile
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
            <div>
              <span style={{ color: "var(--outline)", width: "120px", display: "inline-block" }}>Venue Name:</span>
              <strong style={{ color: "var(--on-surface)" }}>{venue?.name}</strong>
            </div>
            <div>
              <span style={{ color: "var(--outline)", width: "120px", display: "inline-block" }}>Address:</span>
              <span>{venue?.address || "No address provided"}</span>
            </div>
            <div>
              <span style={{ color: "var(--outline)", width: "120px", display: "inline-block" }}>GhanaPost GPS:</span>
              <code>{venue?.ghana_gps || "Not set"}</code>
            </div>
            <div>
              <span style={{ color: "var(--outline)", width: "120px", display: "inline-block" }}>Contact Phone:</span>
              <span>{venue?.phone || "None"}</span>
            </div>
            <div>
              <span style={{ color: "var(--outline)", width: "120px", display: "inline-block" }}>WhatsApp:</span>
              <span>{venue?.whatsapp || "None"}</span>
            </div>
            <div>
              <span style={{ color: "var(--outline)", width: "120px", display: "inline-block" }}>Amenities:</span>
              <span>{venue?.amenities?.join(", ") || "None specified"}</span>
            </div>
          </div>
        </div>

        {/* Recent Audit / Changes */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)",
            padding: "var(--spacing-5)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--spacing-4)",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Recent Activity</h3>
            <button
              type="button"
              onClick={() => onNavigate("activity")}
              style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}
            >
              View Full Audit →
            </button>
          </div>

          {recentAudit.length === 0 ? (
            <p style={{ color: "var(--outline)", fontSize: "13px" }}>No recent audit events.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentAudit.map((item) => (
                <div
                  key={item.id}
                  style={{
                    fontSize: "13px",
                    borderBottom: "1px solid var(--surface-container-high)",
                    paddingBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontWeight: 600 }}>{item.action}</span>
                    <span style={{ fontSize: "11px", color: "var(--outline)" }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--on-surface-variant)" }}>
                    {item.is_step_in ? (
                      <span style={{ color: "var(--warning)", fontWeight: 600 }}>
                        Updated by Padel Ghana staff ({item.actor_name})
                      </span>
                    ) : (
                      <span>by {item.actor_name || "System"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
