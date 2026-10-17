import React, { useEffect, useState } from "react";
import { api, ClubStaffResponse, StaffItem } from "../../api/client";

interface ClubStaffViewProps {
  venueId?: string;
}

export const ClubStaffView: React.FC<ClubStaffViewProps> = ({ venueId }) => {
  const [data, setData] = useState<ClubStaffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"CLUB_ADMIN" | "CLUB_OWNER">("CLUB_ADMIN");
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.getStaff(venueId);
      setData(res);
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to load club staff", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [venueId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage(null);
      await api.inviteStaff(inviteEmail, inviteRole, venueId);
      setStatusMessage({
        text: `Invitation sent to ${inviteEmail} as ${inviteRole}.`,
        type: "success",
      });
      setInviteEmail("");
      setIsInviteModalOpen(false);
      await fetchStaff();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to send invitation", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staff: StaffItem) => {
    if (!window.confirm(`Are you sure you want to remove ${staff.name} (${staff.email}) from club staff?`)) {
      return;
    }
    try {
      setStatusMessage(null);
      await api.removeStaff(staff.id, venueId);
      setStatusMessage({ text: `${staff.name} removed from club staff`, type: "success" });
      await fetchStaff();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to remove staff member", type: "error" });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading staff & roles...
      </div>
    );
  }

  const isOwner = data?.is_owner ?? false;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Staff & Roles</h2>
          <p style={{ color: "var(--outline)", fontSize: "13px" }}>
            {data?.staff?.length || 0} Members • {isOwner ? "You are a Club Owner" : "You have Club Admin access"}
          </p>
        </div>

        {isOwner ? (
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
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
            <span>+</span> Invite Staff Member
          </button>
        ) : (
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "var(--surface-container-high)",
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              color: "var(--outline)",
            }}
          >
            Owner-only staff management
          </span>
        )}
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

      {/* Active Staff Table */}
      <div
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-container-low)",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Active Club Staff
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--outline-variant)",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--outline)",
                textTransform: "uppercase",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Name</th>
              <th style={{ padding: "12px 16px" }}>Email</th>
              <th style={{ padding: "12px 16px" }}>Role</th>
              <th style={{ padding: "12px 16px" }}>Joined</th>
              {isOwner && <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {(data?.staff || []).map((member) => (
              <tr
                key={member.id}
                style={{
                  borderBottom: "1px solid var(--surface-container-high)",
                  fontSize: "14px",
                }}
              >
                <td style={{ padding: "14px 16px", fontWeight: 600 }}>{member.name}</td>
                <td style={{ padding: "14px 16px", color: "var(--on-surface-variant)" }}>{member.email}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor:
                        member.role === "CLUB_OWNER" ? "var(--primary-fixed)" : "var(--secondary-fixed)",
                      color:
                        member.role === "CLUB_OWNER" ? "var(--on-primary-fixed)" : "var(--on-secondary-fixed)",
                    }}
                  >
                    {member.role === "CLUB_OWNER" ? "Owner" : "Admin"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--outline)", fontSize: "12px" }}>
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
                {isOwner && (
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {member.role !== "CLUB_OWNER" && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(member)}
                        style={{
                          fontSize: "12px",
                          color: "var(--error)",
                          fontWeight: 600,
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--error-container)",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Invitations Table */}
      <div
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-container-low)",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Pending Invitations ({data?.pending_invites?.length || 0})
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--outline-variant)",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--outline)",
                textTransform: "uppercase",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Invited Email</th>
              <th style={{ padding: "12px 16px" }}>Assigned Role</th>
              <th style={{ padding: "12px 16px" }}>Invited By</th>
              <th style={{ padding: "12px 16px" }}>Sent Date</th>
              <th style={{ padding: "12px 16px" }}>Expires In</th>
            </tr>
          </thead>
          <tbody>
            {(data?.pending_invites || []).length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--outline)", fontSize: "13px" }}>
                  No pending invitations.
                </td>
              </tr>
            ) : (
              (data?.pending_invites || []).map((inv) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom: "1px solid var(--surface-container-high)",
                    fontSize: "14px",
                  }}
                >
                  <td style={{ padding: "14px 16px", fontWeight: 600 }}>{inv.email}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: "var(--surface-container-high)",
                      }}
                    >
                      {inv.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--on-surface-variant)", fontSize: "13px" }}>
                    {inv.invited_by_name}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--outline)", fontSize: "12px" }}>
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--warning)", fontSize: "12px", fontWeight: 600 }}>
                    {new Date(inv.expires_at) > new Date() ? "Active (48 hrs)" : "Expired"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
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
              maxWidth: "460px",
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
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Invite Staff Member</h3>
              <button onClick={() => setIsInviteModalOpen(false)} style={{ fontSize: "16px", color: "var(--outline)" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Staff Member Email *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coach@example.com"
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
                  Role & Permissions *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--outline-variant)",
                    backgroundColor: "var(--surface-container-low)",
                  }}
                >
                  <option value="CLUB_ADMIN">Club Admin (Manage venue, courts, prices, hours)</option>
                  <option value="CLUB_OWNER">Club Owner (Full access including staff & ownership)</option>
                </select>
                <p style={{ fontSize: "11px", color: "var(--outline)", marginTop: "4px" }}>
                  Note: A user may belong to at most one club at launch.
                </p>
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
                  onClick={() => setIsInviteModalOpen(false)}
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
                  {submitting ? "Sending Invite..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
