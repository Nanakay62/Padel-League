import React, { useEffect, useState } from "react";
import { api, AdminVenueItem } from "../../api/client";

interface AdminVenuesViewProps {
  initialOpenRegister?: boolean;
  onStepInToClub?: (venueId: string, venueName: string) => void;
}

export const AdminVenuesView: React.FC<AdminVenuesViewProps> = ({
  initialOpenRegister = false,
  onStepInToClub,
}) => {
  const [venues, setVenues] = useState<AdminVenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Register Modal state
  const [isModalOpen, setIsModalOpen] = useState(initialOpenRegister);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formGps, setFormGps] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCourts, setFormCourts] = useState<number>(2);
  const [formRateGhs, setFormRateGhs] = useState<string>("350.00");
  const [submitting, setSubmitting] = useState(false);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminVenues();
      setVenues(res.venues);
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to load venues", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage(null);
      const ratePesewas = Math.round(parseFloat(formRateGhs) * 100);
      if (isNaN(ratePesewas) || ratePesewas <= 0) {
        throw new Error("Base rate must be a valid positive number.");
      }

      const res = await api.registerVenue({
        name: formName,
        address: formAddress,
        ghana_gps: formGps,
        owner_email: formEmail,
        initial_courts_count: formCourts,
        base_rate_pesewas: ratePesewas,
      });

      setStatusMessage({
        text: `Club "${res.venue.name}" registered! Owner invite sent to ${res.invite.email}.`,
        type: "success",
      });
      setIsModalOpen(false);
      // Reset form
      setFormName("");
      setFormAddress("");
      setFormGps("");
      setFormEmail("");
      setFormCourts(2);
      setFormRateGhs("350.00");
      await fetchVenues();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to register club venue", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVenues = venues.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.address && v.address.toLowerCase().includes(q)) ||
      (v.owner_email && v.owner_email.toLowerCase().includes(q)) ||
      (v.owner_name && v.owner_name.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading clubs directory...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {/* Top Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Venues Directory</h2>
          <p style={{ color: "var(--outline)", fontSize: "13px" }}>
            {venues.length} Registered Clubs in Ghana • Super Admin Directory
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            backgroundColor: "var(--primary)",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>+</span> Register New Club
        </button>
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

      {/* Search Input */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by club name, address, or owner email..."
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-container-lowest)",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Venues Table */}
      <div
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr
              style={{
                backgroundColor: "var(--surface-container-low)",
                borderBottom: "1px solid var(--outline-variant)",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--outline)",
                textTransform: "uppercase",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Club Name</th>
              <th style={{ padding: "12px 16px" }}>Location & GPS</th>
              <th style={{ padding: "12px 16px" }}>Courts</th>
              <th style={{ padding: "12px 16px" }}>Base Hourly Rate</th>
              <th style={{ padding: "12px 16px" }}>Club Owner</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVenues.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--outline)" }}>
                  No clubs matched your search.
                </td>
              </tr>
            ) : (
              filteredVenues.map((v) => (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: "1px solid var(--surface-container-high)",
                    fontSize: "14px",
                  }}
                >
                  <td style={{ padding: "14px 16px", fontWeight: 700 }}>{v.name}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div>{v.address || "No address"}</div>
                    {v.ghana_gps && (
                      <code style={{ fontSize: "11px", color: "var(--primary)" }}>{v.ghana_gps}</code>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "var(--surface-container-high)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {v.courts_count} Courts
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600 }}>{v.formatted_base_rate}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{v.owner_name}</div>
                    <div style={{ fontSize: "12px", color: "var(--outline)" }}>{v.owner_email}</div>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => onStepInToClub && onStepInToClub(v.id, v.name)}
                      style={{
                        backgroundColor: "var(--surface-container-high)",
                        color: "var(--primary)",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 600,
                        fontSize: "12px",
                        border: "1px solid var(--outline-variant)",
                      }}
                    >
                      Step-In →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Venue Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--spacing-4)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface-container-lowest)",
              width: "100%",
              maxWidth: "520px",
              borderRadius: "var(--radius-lg)",
              padding: "var(--spacing-6)",
              boxShadow: "var(--shadow-lg)",
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
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Register New Club Venue</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: "16px", color: "var(--outline)" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Club / Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Osu Padel Club"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    backgroundColor: "var(--surface-container-low)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Oxford Street, Osu, Accra"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    backgroundColor: "var(--surface-container-low)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  GhanaPost GPS Code
                </label>
                <input
                  type="text"
                  value={formGps}
                  onChange={(e) => setFormGps(e.target.value)}
                  placeholder="e.g. GA-042-8891"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    backgroundColor: "var(--surface-container-low)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Initial Club Owner Email *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="founder@club.com"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    backgroundColor: "var(--surface-container-low)",
                  }}
                />
                <p style={{ fontSize: "11px", color: "var(--outline)", marginTop: "3px" }}>
                  An invitation link will be emailed to activate their account and complete club setup.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-4)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Initial Courts Count *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={formCourts}
                    onChange={(e) => setFormCourts(parseInt(e.target.value, 10) || 1)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--outline-variant)",
                      backgroundColor: "var(--surface-container-low)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Base Hourly Rate (GH₵) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min={1}
                    required
                    value={formRateGhs}
                    onChange={(e) => setFormRateGhs(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--outline-variant)",
                      backgroundColor: "var(--surface-container-low)",
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "var(--spacing-3)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    padding: "8px 18px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 600,
                    fontSize: "13px",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Registering Club..." : "Register Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
