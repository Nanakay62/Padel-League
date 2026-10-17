import React, { useEffect, useState, useRef, useCallback } from "react";
import { api, ClubProfileResponse, VenueProfile } from "../../api/client";

interface ClubProfileViewProps {
  venueId?: string;
}

const AVAILABLE_AMENITIES = [
  "Locker Rooms",
  "Showers",
  "Pro Shop",
  "Free Parking",
  "Café / Refreshments",
  "Wi-Fi",
  "Floodlights",
  "Equipment Rental",
  "Spectator Seating",
];

export const ClubProfileView: React.FC<ClubProfileViewProps> = ({ venueId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [profileData, setProfileData] = useState<ClubProfileResponse | null>(null);
  const [form, setForm] = useState<Partial<VenueProfile>>({});
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getClubProfile(venueId);
      setProfileData(data);
      setHasConflict(false);

      // If draft exists, offer to restore or pre-populate with draft
      if (data.draft && Object.keys(data.draft).length > 0) {
        setForm({ ...(data.venue || {}), ...data.draft });
        setDraftStatus("Loaded uncommitted draft");
      } else {
        setForm(data.venue || {});
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to load club profile", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadProfile();
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [loadProfile]);

  // Debounced auto-save draft
  const triggerDraftAutoSave = (updatedForm: Partial<VenueProfile>) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setDraftStatus("Saving draft...");

    debounceTimerRef.current = setTimeout(async () => {
      try {
        await api.saveDraft("profile", updatedForm, venueId);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setDraftStatus(`Draft auto-saved at ${timeStr}`);
      } catch {
        setDraftStatus("Draft auto-save failed");
      }
    }, 1000);
  };

  const handleChange = (field: keyof VenueProfile, value: any) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    triggerDraftAutoSave(updated);
  };

  const handleAmenityToggle = (amenity: string) => {
    const current = form?.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    handleChange("amenities", updated);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMessage(null);
      setHasConflict(false);
      const res = await api.updateClubProfile(
        {
          ...form,
          expected_updated_at: profileData?.venue?.updated_at || null,
        },
        venueId
      );
      setProfileData((prev) => (prev ? { ...prev, venue: res.venue } : prev));
      setForm(res.venue);
      setDraftStatus(null);
      setStatusMessage({
        text: res.is_step_in
          ? "Profile updated and logged as Platform Staff Step-In."
          : "Club profile published successfully!",
        type: "success",
      });
    } catch (err: any) {
      if (err.status === 409) {
        setHasConflict(true);
        setStatusMessage({
          text: "Conflict: Changes have been modified by another session. Please reload to see the latest version before saving.",
          type: "error",
        });
      } else {
        setStatusMessage({ text: err.message || "Failed to publish profile", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!profileData?.venue) return;
    try {
      await api.saveDraft("profile", {}, venueId);
      setForm(profileData.venue);
      setDraftStatus(null);
      setStatusMessage({ text: "Draft discarded. Restored published profile.", type: "info" });
    } catch {
      setStatusMessage({ text: "Failed to discard draft", type: "error" });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading club profile...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Top Banner & Status */}
      {statusMessage && (
        <div
          style={{
            padding: "var(--spacing-3) var(--spacing-4)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--spacing-4)",
            backgroundColor:
              statusMessage.type === "success"
                ? "var(--success-surface)"
                : statusMessage.type === "error"
                ? "var(--error-container)"
                : "var(--surface-container-high)",
            color:
              statusMessage.type === "success"
                ? "var(--success)"
                : statusMessage.type === "error"
                ? "var(--on-error-container)"
                : "var(--on-surface)",
            fontSize: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--spacing-3)",
          }}
        >
          <span>{statusMessage.text}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
            {hasConflict && (
              <button
                type="button"
                onClick={() => loadProfile()}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid currentColor",
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                Reload Latest
              </button>
            )}
            <button type="button" onClick={() => setStatusMessage(null)} style={{ fontWeight: 600 }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Draft Status Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--surface-container-low)",
          padding: "var(--spacing-3) var(--spacing-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--outline-variant)",
          marginBottom: "var(--spacing-6)",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "var(--outline)" }}>Status:</span>
          <strong>{draftStatus || "All changes published"}</strong>
        </div>
        {draftStatus && (
          <button
            type="button"
            onClick={handleDiscardDraft}
            style={{
              color: "var(--error)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Discard Draft
          </button>
        )}
      </div>

      <form
        onSubmit={handlePublish}
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-6)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-5)",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 700, borderBottom: "1px solid var(--outline-variant)", paddingBottom: "12px" }}>
          Club Details & Location
        </h2>

        {/* Venue Name */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
            Venue Name *
          </label>
          <input
            type="text"
            required
            value={form?.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-container-low)",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
            Club Description & Atmosphere
          </label>
          <textarea
            rows={4}
            value={form?.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Tell players about the courts, coaching staff, and club vibe..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-container-low)",
            }}
          />
        </div>

        {/* Physical Address */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
            Physical Address
          </label>
          <input
            type="text"
            value={form?.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="e.g. 14 Aviation Road, Airport Residential Area, Accra"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-container-low)",
            }}
          />
        </div>

        {/* GhanaPost GPS & Google Maps URL */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-4)" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
              GhanaPost GPS Code
            </label>
            <input
              type="text"
              value={form?.ghana_gps || ""}
              onChange={(e) => handleChange("ghana_gps", e.target.value)}
              placeholder="e.g. GA-183-9210"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-low)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
              Google Maps Location Link
            </label>
            <input
              type="url"
              value={form?.google_maps_url || ""}
              onChange={(e) => handleChange("google_maps_url", e.target.value)}
              placeholder="https://maps.google.com/..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-low)",
              }}
            />
          </div>
        </div>

        {/* Contact Info: Phone, WhatsApp, Email */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--spacing-4)" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
              Phone Number
            </label>
            <input
              type="text"
              value={form?.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+233 24 000 0000"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-low)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
              WhatsApp Contact
            </label>
            <input
              type="text"
              value={form?.whatsapp || ""}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="+233 50 000 0000"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-low)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
              Club Email
            </label>
            <input
              type="email"
              value={form?.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="info@accrapadel.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-low)",
              }}
            />
          </div>
        </div>

        {/* Amenities Selection */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
            Amenities & Facilities
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "8px",
            }}
          >
            {AVAILABLE_AMENITIES.map((amenity) => {
              const isChecked = (form?.amenities || []).includes(amenity);
              return (
                <label
                  key={amenity}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    backgroundColor: isChecked ? "var(--surface-container)" : "var(--surface-container-low)",
                    border: `1px solid ${isChecked ? "var(--primary)" : "var(--outline-variant)"}`,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleAmenityToggle(amenity)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <span>{amenity}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Club Rules */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
            Club Rules & Attire Policy
          </label>
          <textarea
            rows={3}
            value={form?.rules || ""}
            onChange={(e) => handleChange("rules", e.target.value)}
            placeholder="e.g. Non-marking tennis shoes required. 24-hour cancellation policy..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-container-low)",
            }}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "var(--spacing-4)",
            borderTop: "1px solid var(--outline-variant)",
            paddingTop: "var(--spacing-4)",
          }}
        >
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
            {saving ? "Publishing Updates..." : "Publish Club Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};
