import React, { useEffect, useState } from "react";
import { api, CourtItem } from "../../api/client";

interface ClubCourtsViewProps {
  venueId?: string;
}

export const ClubCourtsView: React.FC<ClubCourtsViewProps> = ({ venueId }) => {
  const [courts, setCourts] = useState<CourtItem[]>([]);
  const [priceVersion, setPriceVersion] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<CourtItem | null>(null);
  const [formNumber, setFormNumber] = useState<number>(1);
  const [formIndoor, setFormIndoor] = useState<boolean>(false);
  const [formSurface, setFormSurface] = useState<string>("Blue Mondo Turf");
  const [formLighting, setFormLighting] = useState<string>("LED 500 Lux");
  const [formNotes, setFormNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const res = await api.getCourts(venueId);
      setCourts(Array.isArray(res?.courts) ? res.courts : []);
      setPriceVersion(res?.price_version || 1);
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to load courts", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, [venueId]);

  const openAddModal = () => {
    setEditingCourt(null);
    const courtList = courts || [];
    const nextNum = courtList.length > 0 ? Math.max(...courtList.map((c) => c.court_number)) + 1 : 1;
    setFormNumber(nextNum);
    setFormIndoor(false);
    setFormSurface("Blue Mondo Turf");
    setFormLighting("LED 500 Lux");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: CourtItem) => {
    setEditingCourt(c);
    setFormNumber(c.court_number);
    setFormIndoor(c.indoor);
    setFormSurface(c.surface || "");
    setFormLighting(c.lighting || "");
    setFormNotes(c.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage(null);
      if (editingCourt) {
        await api.updateCourt(
          editingCourt.id,
          {
            court_number: formNumber,
            indoor: formIndoor,
            surface: formSurface,
            lighting: formLighting,
            notes: formNotes,
          },
          venueId
        );
        setStatusMessage({ text: `Court ${formNumber} updated successfully`, type: "success" });
      } else {
        await api.createCourt(
          {
            court_number: formNumber,
            indoor: formIndoor,
            surface: formSurface,
            lighting: formLighting,
            notes: formNotes,
          },
          venueId
        );
        setStatusMessage({ text: `Court ${formNumber} added to facility`, type: "success" });
      }
      setIsModalOpen(false);
      await fetchCourts();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to save court", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (court: CourtItem) => {
    if (!window.confirm(`Are you sure you want to remove Court ${court.court_number}?`)) {
      return;
    }
    try {
      setStatusMessage(null);
      await api.deleteCourt(court.id, venueId);
      setStatusMessage({ text: `Court ${court.court_number} deleted`, type: "success" });
      await fetchCourts();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to delete court", type: "error" });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading club courts...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--spacing-6)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Courts & Capacity</h2>
          <p style={{ color: "var(--outline)", fontSize: "13px" }}>
            {courts.length} Courts Registered • Price Version {priceVersion}
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
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
          <span>+</span> Add Court
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "var(--spacing-3) var(--spacing-4)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--spacing-4)",
            backgroundColor: statusMessage.type === "success" ? "var(--success-surface)" : "var(--error-container)",
            color: statusMessage.type === "success" ? "var(--success)" : "var(--on-error-container)",
            fontSize: "14px",
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Courts Table */}
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
              <th style={{ padding: "12px 16px" }}>Court</th>
              <th style={{ padding: "12px 16px" }}>Type</th>
              <th style={{ padding: "12px 16px" }}>Surface</th>
              <th style={{ padding: "12px 16px" }}>Lighting</th>
              <th style={{ padding: "12px 16px" }}>Notes</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--outline)" }}>
                  No courts configured yet. Click "+ Add Court" to get started.
                </td>
              </tr>
            ) : (
              courts.map((court) => (
                <tr
                  key={court.id}
                  style={{
                    borderBottom: "1px solid var(--surface-container-high)",
                    fontSize: "14px",
                  }}
                >
                  <td style={{ padding: "14px 16px", fontWeight: 700 }}>Court {court.court_number}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: court.indoor ? "var(--secondary-fixed)" : "var(--tertiary-fixed)",
                        color: court.indoor ? "var(--on-secondary-fixed)" : "var(--on-tertiary-fixed)",
                      }}
                    >
                      {court.indoor ? "Indoor" : "Outdoor"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--on-surface-variant)" }}>
                    {court.surface || "Standard Turf"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {court.lighting ? (
                      <span style={{ color: "var(--on-surface)" }}>{court.lighting}</span>
                    ) : (
                      <span style={{ color: "var(--outline)", fontStyle: "italic", fontSize: "12px" }}>
                        Ask the club
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--outline)", fontSize: "13px" }}>
                    {court.notes || "—"}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(court)}
                        style={{
                          fontSize: "12px",
                          color: "var(--primary)",
                          fontWeight: 600,
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--outline-variant)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(court)}
                        style={{
                          fontSize: "12px",
                          color: "var(--error)",
                          fontWeight: 600,
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--error-container)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add / Edit Court */}
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
              maxWidth: "480px",
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
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>
                {editingCourt ? `Edit Court ${editingCourt.court_number}` : "Add New Court"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: "16px", color: "var(--outline)" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Court Number *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formNumber}
                  onChange={(e) => setFormNumber(parseInt(e.target.value, 10) || 1)}
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
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formIndoor}
                    onChange={(e) => setFormIndoor(e.target.checked)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>Indoor Court (covered canopy)</span>
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Turf / Surface
                </label>
                <input
                  type="text"
                  value={formSurface}
                  onChange={(e) => setFormSurface(e.target.value)}
                  placeholder="e.g. Blue Mondo Superturf"
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
                  Lighting Specifications
                </label>
                <input
                  type="text"
                  value={formLighting}
                  onChange={(e) => setFormLighting(e.target.value)}
                  placeholder="e.g. LED 500 Lux (leave empty for 'Ask the club')"
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
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Panoramic glass back wall, camera recording installed"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    backgroundColor: "var(--surface-container-low)",
                  }}
                />
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
                  {submitting ? "Saving..." : editingCourt ? "Update Court" : "Add Court"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
