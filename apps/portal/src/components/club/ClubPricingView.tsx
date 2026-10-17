import React, { useEffect, useState, useCallback } from "react";
import { api, PricingData } from "../../api/client";

interface ClubPricingViewProps {
  venueId?: string;
}

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const ClubPricingView: React.FC<ClubPricingViewProps> = ({ venueId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  const [baseRateGhs, setBaseRateGhs] = useState<string>("350.00");
  const [priceVersion, setPriceVersion] = useState<number>(1);
  const [stepInActor, setStepInActor] = useState<string | null>(null);

  const [priceBands, setPriceBands] = useState<
    Array<{
      label: string;
      start_time: string;
      end_time: string;
      rate_ghs: string;
    }>
  >([
    { label: "Morning Off-Peak", start_time: "06:00", end_time: "16:00", rate_ghs: "250.00" },
    { label: "Prime Evening", start_time: "16:00", end_time: "22:00", rate_ghs: "350.00" },
    { label: "Weekend All-Day", start_time: "07:00", end_time: "22:00", rate_ghs: "400.00" },
  ]);

  const [durationMultipliers, setDurationMultipliers] = useState<Record<string, number>>({
    "60": 1.0,
    "90": 1.5,
    "120": 2.0,
  });

  const [openingHours, setOpeningHours] = useState<Record<string, string>>({
    monday: "06:00-22:00",
    tuesday: "06:00-22:00",
    wednesday: "06:00-22:00",
    thursday: "06:00-22:00",
    friday: "06:00-22:00",
    saturday: "07:00-22:00",
    sunday: "07:00-22:00",
  });

  const fetchPricing = useCallback(async () => {
    try {
      setLoading(true);
      const data: PricingData = await api.getPricing(venueId);
      setHasConflict(false);
      setBaseRateGhs(((data?.base_rate_pesewas || 35000) / 100).toFixed(2));
      setPriceVersion(data?.price_version || 1);
      setStepInActor(data?.step_in_actor || null);

      if (data.price_bands && data.price_bands.length > 0) {
        setPriceBands(
          data.price_bands.map((b) => ({
            label: b.label,
            start_time: b.start_time,
            end_time: b.end_time,
            rate_ghs: (b.rate_pesewas / 100).toFixed(2),
          }))
        );
      }

      if (data.duration_multipliers && Object.keys(data.duration_multipliers).length > 0) {
        setDurationMultipliers(data.duration_multipliers);
      }

      if (data.opening_hours && Object.keys(data.opening_hours).length > 0) {
        setOpeningHours((prev) => ({ ...prev, ...data.opening_hours }));
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to load pricing details", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handleAddPriceBand = () => {
    setPriceBands([
      ...priceBands,
      { label: "New Band", start_time: "08:00", end_time: "17:00", rate_ghs: baseRateGhs },
    ]);
  };

  const handleRemovePriceBand = (idx: number) => {
    setPriceBands(priceBands.filter((_, i) => i !== idx));
  };

  const handlePriceBandChange = (idx: number, field: string, val: string) => {
    const updated = [...priceBands];
    updated[idx] = { ...updated[idx], [field]: val };
    setPriceBands(updated);
  };

  const handleHoursChange = (day: string, value: string) => {
    setOpeningHours({ ...openingHours, [day]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMessage(null);

      // Convert GH₵ to integer pesewas (1 GH₵ = 100 pesewas)
      const basePesewas = Math.round(parseFloat(baseRateGhs) * 100);
      if (isNaN(basePesewas) || basePesewas <= 0) {
        throw new Error("Base rate must be a positive number.");
      }

      const bandsPayload = priceBands.map((b) => {
        const ratePesewas = Math.round(parseFloat(b.rate_ghs) * 100);
        if (isNaN(ratePesewas) || ratePesewas <= 0) {
          throw new Error(`Invalid rate for price band "${b.label}"`);
        }
        return {
          label: b.label,
          start_time: b.start_time,
          end_time: b.end_time,
          rate_pesewas: ratePesewas,
        };
      });

      setHasConflict(false);
      const res = await api.updatePricing(
        {
          base_rate_pesewas: basePesewas,
          duration_multipliers: durationMultipliers,
          price_bands: bandsPayload,
          opening_hours: openingHours,
          expected_price_version: priceVersion,
        },
        venueId
      );

      setPriceVersion(res.pricing.price_version);
      setStatusMessage({
        text: `Pricing and operating hours updated (Price Version ${res.pricing.price_version})`,
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
        setStatusMessage({ text: err.message || "Failed to update pricing", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading pricing & hours...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      {/* Top Banner */}
      {stepInActor && (
        <div
          style={{
            backgroundColor: "var(--warning-surface)",
            color: "var(--warning)",
            border: "1px solid var(--warning)",
            padding: "var(--spacing-3) var(--spacing-4)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            marginBottom: "var(--spacing-4)",
          }}
        >
          <strong>Step-In Mode:</strong> Any pricing changes will be logged as platform edits by {stepInActor}.
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            padding: "var(--spacing-3) var(--spacing-4)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--spacing-4)",
            backgroundColor: statusMessage.type === "success" ? "var(--success-surface)" : "var(--error-container)",
            color: statusMessage.type === "success" ? "var(--success)" : "var(--on-error-container)",
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
                onClick={() => fetchPricing()}
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
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              style={{ fontWeight: 600, background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
        {/* Base Rate Section */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-6)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Base Court Rate</h2>
            <span
              style={{
                fontSize: "12px",
                backgroundColor: "var(--surface-container-high)",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
              }}
            >
              Price Version: v{priceVersion}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-4)", alignItems: "center" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                Default Rate Per Hour (GH₵) *
              </label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "var(--surface-container)",
                    border: "1px solid var(--outline-variant)",
                    borderRight: "none",
                    borderTopLeftRadius: "var(--radius-sm)",
                    borderBottomLeftRadius: "var(--radius-sm)",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--outline)",
                  }}
                >
                  GH₵
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  required
                  value={baseRateGhs}
                  onChange={(e) => setBaseRateGhs(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderTopRightRadius: "var(--radius-sm)",
                    borderBottomRightRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                />
              </div>
              <p style={{ fontSize: "11px", color: "var(--outline)", marginTop: "4px" }}>
                Stored securely as {Math.round((parseFloat(baseRateGhs) || 0) * 100)} integer pesewas.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--surface-container-low)",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
                color: "var(--on-surface-variant)",
              }}
            >
              <strong>Duration Multipliers:</strong>
              <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                <div>60 min: <strong>{durationMultipliers["60"]}x</strong></div>
                <div>90 min: <strong>{durationMultipliers["90"]}x</strong></div>
                <div>120 min: <strong>{durationMultipliers["120"]}x</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Price Bands */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-6)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Custom Price Bands</h2>
              <p style={{ fontSize: "13px", color: "var(--outline)" }}>
                Peak, Off-Peak, and Weekend pricing overrides.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddPriceBand}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--primary)",
                border: "1px solid var(--primary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              + Add Price Band
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {priceBands.map((band, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  backgroundColor: "var(--surface-container-low)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--outline)" }}>
                    Band Name
                  </label>
                  <input
                    type="text"
                    value={band.label}
                    onChange={(e) => handlePriceBandChange(idx, "label", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--outline-variant)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--outline)" }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={band.start_time}
                    onChange={(e) => handlePriceBandChange(idx, "start_time", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--outline-variant)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--outline)" }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={band.end_time}
                    onChange={(e) => handlePriceBandChange(idx, "end_time", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--outline-variant)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--outline)" }}>
                    Rate (GH₵)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={band.rate_ghs}
                    onChange={(e) => handlePriceBandChange(idx, "rate_ghs", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--outline-variant)",
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div style={{ paddingTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => handleRemovePriceBand(idx)}
                    style={{ color: "var(--error)", fontSize: "16px", padding: "4px" }}
                    title="Remove Band"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Hours */}
        <div
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-6)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Operating Hours</h2>
            <p style={{ fontSize: "13px", color: "var(--outline)" }}>
              Weekly schedule in Africa/Accra (UTC+0) time.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "capitalize",
                    marginBottom: "4px",
                  }}
                >
                  {day}
                </label>
                <input
                  type="text"
                  value={openingHours[day] || "06:00-22:00"}
                  onChange={(e) => handleHoursChange(day, e.target.value)}
                  placeholder="06:00-22:00 or Closed"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    fontSize: "13px",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
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
            {saving ? "Updating Pricing..." : "Save Pricing & Hours"}
          </button>
        </div>
      </form>
    </div>
  );
};
