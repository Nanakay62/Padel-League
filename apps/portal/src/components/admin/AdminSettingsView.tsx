import React, { useEffect, useState } from "react";
import { api, PlatformSettingsData } from "../../api/client";

export const AdminSettingsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettingsData | null>(null);
  const [allowMultiVenue, setAllowMultiVenue] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchSettings() {
      try {
        setLoading(true);
        const data = await api.getPlatformSettings();
        if (!mounted) return;
        setSettings(data);
        setAllowMultiVenue(data.allow_multi_venue_per_user);
        setAnnouncement(data.platform_announcement || "");
      } catch (err: any) {
        if (!mounted) return;
        setStatusMessage({ text: err.message || "Failed to load platform settings", type: "error" });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMessage(null);
      const res = await api.updatePlatformSettings({
        allow_multi_venue_per_user: allowMultiVenue,
        platform_announcement: announcement,
      });
      setSettings(res.settings);
      setStatusMessage({ text: "Platform settings updated and audited.", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to update platform settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading platform settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700 }}>System & Platform Settings</h2>
        <p style={{ color: "var(--outline)", fontSize: "13px" }}>
          Global operational parameters, multi-tenant policy limits, and environment configuration.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "var(--spacing-3) var(--spacing-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: statusMessage.type === "success" ? "var(--success-surface)" : "var(--error-container)",
            color: statusMessage.type === "success" ? "var(--success)" : "var(--on-error-container)",
            fontSize: "14px",
          }}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-5)" }}>
        {/* Multi-Tenant Membership Limit Policy */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-6)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
            Multi-Tenant Membership Policy
          </h3>
          <p style={{ fontSize: "13px", color: "var(--on-surface-variant)", marginBottom: "16px" }}>
            Controls whether club staff users may belong to multiple venues simultaneously or are restricted to at most one venue.
          </p>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px",
              backgroundColor: "var(--surface-container-low)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--outline-variant)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={allowMultiVenue}
              onChange={(e) => setAllowMultiVenue(e.target.checked)}
              style={{ marginTop: "3px", accentColor: "var(--primary)" }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                Allow multi-venue membership per club user
              </div>
              <div style={{ fontSize: "12px", color: "var(--outline)", marginTop: "2px" }}>
                When unchecked, launch limit (at most 1 venue per user) is strictly enforced in authorization policy.
                Enabling lifts this constraint without requiring schema migrations.
              </div>
            </div>
          </label>
        </div>

        {/* Global Announcement */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-6)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
            Platform Announcement Banner
          </h3>
          <p style={{ fontSize: "13px", color: "var(--on-surface-variant)", marginBottom: "12px" }}>
            Optional system-wide broadcast message shown at the top of club and admin portals.
          </p>

          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="e.g. Scheduled maintenance this Sunday at 02:00 UTC."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-container-low)",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Read-Only Environment Parameters */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-6)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>
            Environment Constants (Non-Negotiable)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px" }}>
            <div>
              <span style={{ color: "var(--outline)", display: "block" }}>Platform Currency:</span>
              <strong>Ghana Cedis ({settings?.currency || "GHS"})</strong>
            </div>
            <div>
              <span style={{ color: "var(--outline)", display: "block" }}>Timezone:</span>
              <strong>{settings?.timezone || "Africa/Accra"} (UTC+0, no DST)</strong>
            </div>
            <div>
              <span style={{ color: "var(--outline)", display: "block" }}>Club Host:</span>
              <code>{settings?.club_host || "club.padelghana.com"}</code>
            </div>
            <div>
              <span style={{ color: "var(--outline)", display: "block" }}>Super Admin Host:</span>
              <code>{settings?.admin_host || "admin.padelghana.com"}</code>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              padding: "10px 24px",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: "14px",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving Changes..." : "Save System Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};
