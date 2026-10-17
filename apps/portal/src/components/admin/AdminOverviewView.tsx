import React, { useEffect, useState } from "react";
import { api, PlatformOverviewData, AuditLogItem } from "../../api/client";
import { AdminTab } from "../layout/SuperAdminShell";

interface AdminOverviewViewProps {
  onNavigate: (tab: AdminTab) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlatformOverviewData | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchOverview() {
      try {
        setLoading(true);
        const [overview, audits] = await Promise.all([
          api.getPlatformOverview(),
          api.getGlobalAudit({ limit: 5 }),
        ]);
        if (!mounted) return;
        setData(overview);
        setRecentAudits(audits.items);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Failed to load platform overview");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchOverview();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading platform overview...
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
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {/* Top Banner / Status */}
      <div
        style={{
          backgroundColor: "var(--surface-container-low)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-4) var(--spacing-6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
            Platform Operations Status
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Padel Ghana National Network</div>
        </div>
        <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
          <span
            style={{
              padding: "4px 8px",
              backgroundColor: "var(--success-surface)",
              color: "var(--success)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 600,
            }}
          >
            ● System Healthy
          </span>
          <span
            style={{
              padding: "4px 8px",
              backgroundColor: "var(--surface-container-high)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 600,
            }}
          >
            Currency: GHS (GH₵)
          </span>
          <span
            style={{
              padding: "4px 8px",
              backgroundColor: "var(--surface-container-high)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 600,
            }}
          >
            Timezone: Africa/Accra
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
            Registered Clubs
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--on-surface)", marginTop: "4px" }}>
            {data?.total_venues || 0}
          </div>
          <button
            onClick={() => onNavigate("venues")}
            style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "8px" }}
          >
            View Directory →
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
            Total Courts
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--on-surface)", marginTop: "4px" }}>
            {data?.total_courts || 0}
          </div>
          <div style={{ fontSize: "11px", color: "var(--outline)", marginTop: "8px" }}>
            Across all Ghana clubs
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
            Platform Users
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--on-surface)", marginTop: "4px" }}>
            {data?.total_users || 0}
          </div>
          <div style={{ fontSize: "11px", color: "var(--outline)", marginTop: "8px" }}>
            Players, Staff & Admins
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
            Audit Log Events
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--on-surface)", marginTop: "4px" }}>
            {data?.total_audit_events || 0}
          </div>
          <button
            onClick={() => onNavigate("audit")}
            style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "8px" }}
          >
            Audit Trail →
          </button>
        </div>
      </div>

      {/* Quick Action Shortcuts & Recent Audits */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "var(--spacing-6)" }}>
        {/* Quick Actions */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-5)",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Super Admin Operations</h3>
          <button
            onClick={() => onNavigate("create-venue")}
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: "14px",
              textAlign: "left",
            }}
          >
            ➕ Register New Club Venue
          </button>
          <button
            onClick={() => onNavigate("venues")}
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--surface-container-low)",
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: "14px",
              textAlign: "left",
            }}
          >
            🏢 Browse Venues & Step-In
          </button>
          <button
            onClick={() => onNavigate("audit")}
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--surface-container-low)",
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: "14px",
              textAlign: "left",
            }}
          >
            📜 Search Global Audit Log
          </button>
          <button
            onClick={() => onNavigate("settings")}
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--surface-container-low)",
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: "14px",
              textAlign: "left",
            }}
          >
            ⚙️ Configure System Settings
          </button>
        </div>

        {/* Recent Audit Events */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-5)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Latest Platform Activity</h3>
            <button
              onClick={() => onNavigate("audit")}
              style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}
            >
              Full Trail →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentAudits.length === 0 ? (
              <p style={{ color: "var(--outline)", fontSize: "13px" }}>No platform audit events logged yet.</p>
            ) : (
              recentAudits.map((item) => (
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
                      {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--on-surface-variant)" }}>
                    {item.is_step_in ? (
                      <span style={{ color: "var(--warning)", fontWeight: 600 }}>
                        ⚠️ Staff Step-In ({item.actor_name}) on Venue {item.entity_id?.slice(0, 8)}...
                      </span>
                    ) : (
                      <span>by {item.actor_name || "System"}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
