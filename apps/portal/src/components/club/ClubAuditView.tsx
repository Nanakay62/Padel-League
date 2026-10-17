import React, { useEffect, useState } from "react";
import { api, AuditLogItem } from "../../api/client";

interface ClubAuditViewProps {
  venueId?: string;
}

export const ClubAuditView: React.FC<ClubAuditViewProps> = ({ venueId }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAudit(venueId);
      setLogs(Array.isArray(res?.items) ? res.items : []);
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to load audit history", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [venueId]);

  const handleRevert = async (log: AuditLogItem) => {
    const reason = window.prompt(`Enter reason for reverting ${log.action} on ${log.entity_name}:`);
    if (reason === null) return;

    try {
      setRevertingId(log.id);
      setStatusMessage(null);
      await api.revertAudit(log.id, reason, venueId);
      setStatusMessage({ text: `Action "${log.action}" reverted successfully`, type: "success" });
      await fetchAuditLogs();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to revert action", type: "error" });
    } finally {
      setRevertingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-8)", textAlign: "center", color: "var(--outline)" }}>
        Loading club audit trail...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Club Audit & Activity Trail</h2>
        <p style={{ color: "var(--outline)", fontSize: "13px" }}>
          Full history of profile changes, pricing adjustments, court modifications, and platform step-in actions.
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

      {/* Audit Log Table */}
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
              <th style={{ padding: "12px 16px" }}>Timestamp (Accra)</th>
              <th style={{ padding: "12px 16px" }}>Action</th>
              <th style={{ padding: "12px 16px" }}>Actor / Step-In</th>
              <th style={{ padding: "12px 16px" }}>Target Entity</th>
              <th style={{ padding: "12px 16px" }}>Changes Summary</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(logs || []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--outline)", fontSize: "14px" }}>
                  No audit entries recorded for this club yet.
                </td>
              </tr>
            ) : (
              (logs || []).map((log) => {
                const dateStr = new Date(log.created_at).toLocaleString("en-GB", {
                  timeZone: "Africa/Accra",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const isReversible =
                  log.changes &&
                  log.action !== "REVERT" &&
                  (log.changes.previous || log.action === "COURT_DELETE");

                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: "1px solid var(--surface-container-high)",
                      fontSize: "13px",
                    }}
                  >
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap", color: "var(--outline)" }}>
                      {dateStr}
                    </td>

                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                      <code>{log.action}</code>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      {log.is_step_in ? (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "var(--warning)",
                              backgroundColor: "var(--warning-surface)",
                              padding: "2px 6px",
                              borderRadius: "var(--radius-sm)",
                              display: "inline-block",
                              width: "fit-content",
                              marginBottom: "2px",
                            }}
                          >
                            ⚠️ Step-In Action
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--on-surface)" }}>
                            Updated by Padel Ghana staff ({log.actor_name})
                          </span>
                        </div>
                      ) : (
                        <div>
                          <strong>{log.actor_name || "Club User"}</strong>
                          <div style={{ fontSize: "11px", color: "var(--outline)" }}>{log.actor_role}</div>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px", color: "var(--on-surface-variant)" }}>
                      {log.entity_name} ({log.entity_id.slice(0, 8)}...)
                    </td>

                    <td style={{ padding: "12px 16px", maxWidth: "260px" }}>
                      {log.changes ? (
                        <details style={{ cursor: "pointer" }}>
                          <summary style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>
                            View Diff
                          </summary>
                          <pre
                            style={{
                              marginTop: "6px",
                              padding: "8px",
                              backgroundColor: "var(--surface-container-low)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "11px",
                              overflowX: "auto",
                              maxHeight: "150px",
                            }}
                          >
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span style={{ color: "var(--outline)", fontSize: "12px" }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {isReversible && (
                        <button
                          type="button"
                          onClick={() => handleRevert(log)}
                          disabled={revertingId === log.id}
                          style={{
                            fontSize: "12px",
                            color: "var(--primary)",
                            fontWeight: 600,
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--outline-variant)",
                            opacity: revertingId === log.id ? 0.6 : 1,
                          }}
                        >
                          {revertingId === log.id ? "Reverting..." : "Revert"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
