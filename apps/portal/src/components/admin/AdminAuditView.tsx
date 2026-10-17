import React, { useEffect, useState } from "react";
import { api, AuditLogItem } from "../../api/client";

export const AdminAuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getGlobalAudit({
        action: actionFilter || undefined,
        limit: 100,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to load audit logs", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleRevert = async (log: AuditLogItem) => {
    const reason = window.prompt(`Enter justification for reverting action ${log.action}:`);
    if (reason === null) return;

    try {
      setRevertingId(log.id);
      setStatusMessage(null);
      await api.revertAudit(log.id, reason, log.venue_id || undefined);
      setStatusMessage({ text: `Action "${log.action}" successfully reverted.`, type: "success" });
      await fetchLogs();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to revert audit entry", type: "error" });
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Platform Audit Trail</h2>
          <p style={{ color: "var(--outline)", fontSize: "13px" }}>
            Immutable ledger of platform actions, step-in operations, and configuration modifications.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-container-lowest)",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <option value="">All Actions ({total})</option>
            <option value="VENUE_REGISTER">VENUE_REGISTER</option>
            <option value="VENUE_PROFILE_EDIT">VENUE_PROFILE_EDIT</option>
            <option value="COURT_CREATE">COURT_CREATE</option>
            <option value="COURT_DELETE">COURT_DELETE</option>
            <option value="PRICING_UPDATE">PRICING_UPDATE</option>
            <option value="STAFF_INVITE">STAFF_INVITE</option>
            <option value="PLATFORM_SETTINGS_UPDATE">PLATFORM_SETTINGS_UPDATE</option>
            <option value="REVERT">REVERT</option>
          </select>
          <button
            onClick={fetchLogs}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-container-high)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>
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

      {/* Logs Table */}
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
              <th style={{ padding: "12px 16px" }}>Time (Africa/Accra)</th>
              <th style={{ padding: "12px 16px" }}>Action</th>
              <th style={{ padding: "12px 16px" }}>Actor / Step-In</th>
              <th style={{ padding: "12px 16px" }}>Entity & Target</th>
              <th style={{ padding: "12px 16px" }}>Changes & Details</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--outline)" }}>
                  Loading platform audit records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--outline)" }}>
                  No audit entries found matching the filter criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const dateStr = new Date(log.created_at).toLocaleString("en-GB", {
                  timeZone: "Africa/Accra",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

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

                    <td style={{ padding: "12px 16px" }}>
                      <code style={{ fontWeight: 700 }}>{log.action}</code>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      {log.is_step_in ? (
                        <div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "var(--warning)",
                              backgroundColor: "var(--warning-surface)",
                              padding: "2px 6px",
                              borderRadius: "var(--radius-sm)",
                              display: "inline-block",
                              marginBottom: "2px",
                            }}
                          >
                            ⚠️ Step-In Action
                          </span>
                          <div style={{ fontSize: "12px", color: "var(--on-surface)" }}>
                            Updated by Padel Ghana staff ({log.actor_name})
                          </div>
                        </div>
                      ) : (
                        <div>
                          <strong>{log.actor_name || "System"}</strong>
                          <div style={{ fontSize: "11px", color: "var(--outline)" }}>{log.actor_role}</div>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px", color: "var(--on-surface-variant)" }}>
                      <div>{log.entity_name}</div>
                      <code style={{ fontSize: "11px" }}>{log.entity_id?.slice(0, 8)}...</code>
                    </td>

                    <td style={{ padding: "12px 16px", maxWidth: "300px" }}>
                      {log.details && (
                        <div style={{ fontSize: "12px", color: "var(--on-surface)", marginBottom: "4px" }}>
                          {log.details}
                        </div>
                      )}
                      {log.changes && (
                        <details style={{ cursor: "pointer" }}>
                          <summary style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>
                            View Diff
                          </summary>
                          <pre
                            style={{
                              marginTop: "4px",
                              padding: "6px 8px",
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
                      )}
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {log.is_revertible && !log.reverted_at && (
                        <button
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
                      {log.reverted_at && (
                        <span style={{ fontSize: "11px", color: "var(--outline)", fontStyle: "italic" }}>
                          Reverted
                        </span>
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
