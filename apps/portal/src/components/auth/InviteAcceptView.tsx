import React, { useState } from "react";
import { api } from "../../api/client";

interface InviteAcceptViewProps {
  token: string;
  onSuccess: () => void;
}

export const InviteAcceptView: React.FC<InviteAcceptViewProps> = ({ token, onSuccess }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) return;

    if (password.length < 12) {
      setErrorMessage("Password must be at least 12 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.acceptInvite(token, name, password);
      onSuccess();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to accept invite. The link may have expired."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--surface)",
        padding: "var(--spacing-4)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-8)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-6)" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "var(--spacing-1)" }}>
            Accept Staff Invitation
          </h1>
          <p style={{ fontSize: "14px", color: "var(--on-surface-variant)" }}>
            Create your account to join the club operations team.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: "var(--error-container)",
              color: "var(--on-error-container)",
              padding: "var(--spacing-3)",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              marginBottom: "var(--spacing-4)",
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "var(--spacing-4)" }}>
            <label
              htmlFor="invite-name-input"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "var(--spacing-1)",
              }}
            >
              Full Name
            </label>
            <input
              id="invite-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kofi Mensah"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
              }}
            />
          </div>

          <div style={{ marginBottom: "var(--spacing-4)" }}>
            <label
              htmlFor="invite-password-input"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "var(--spacing-1)",
              }}
            >
              Create Password (min. 12 characters)
            </label>
            <input
              id="invite-password-input"
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
              }}
            />
          </div>

          <div style={{ marginBottom: "var(--spacing-6)" }}>
            <label
              htmlFor="invite-confirm-password"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "var(--spacing-1)",
              }}
            >
              Confirm Password
            </label>
            <input
              id="invite-confirm-password"
              type="password"
              required
              minLength={12}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              fontSize: "14px",
              fontWeight: 600,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Activating Account..." : "Accept Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
};
