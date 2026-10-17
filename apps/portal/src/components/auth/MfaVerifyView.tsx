import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export const MfaVerifyView: React.FC = () => {
  const { verifyMfa, clearMfa } = useAuth();
  const [code, setCode] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyMfa(code);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Verification failed. Please check your code.");
      }
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
          maxWidth: "420px",
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-8)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-6)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--surface-container-high)",
              color: "var(--primary)",
              marginBottom: "var(--spacing-3)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "var(--spacing-1)" }}>
            Two-Factor Authentication
          </h1>
          <p style={{ fontSize: "14px", color: "var(--on-surface-variant)" }}>
            {isRecoveryMode
              ? "Enter one of your 8 backup recovery codes"
              : "Enter the 6-digit code from your authenticator app"}
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
          <div style={{ marginBottom: "var(--spacing-6)" }}>
            <label
              htmlFor="mfa-code-input"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--on-surface)",
                marginBottom: "var(--spacing-1)",
              }}
            >
              {isRecoveryMode ? "Recovery Code" : "Authenticator Code"}
            </label>
            <input
              id="mfa-code-input"
              type="text"
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isRecoveryMode ? "e.g. A1B2-C3D4" : "123456"}
              style={{
                width: "100%",
                padding: "12px 14px",
                textAlign: isRecoveryMode ? "left" : "center",
                letterSpacing: isRecoveryMode ? "normal" : "0.3em",
                fontSize: isRecoveryMode ? "15px" : "20px",
                fontWeight: 600,
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
                color: "var(--on-surface)",
              }}
            />
            {isLocalDev && !isRecoveryMode && (
              <div style={{ marginTop: "8px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setCode("123456")}
                  style={{
                    fontSize: "12px",
                    color: "var(--primary)",
                    backgroundColor: "var(--surface-container-high)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px dashed var(--outline-variant)",
                  }}
                >
                  ⚡ Autofill Dev Code (123456)
                </button>
              </div>
            )}
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
              marginBottom: "var(--spacing-3)",
            }}
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
              marginTop: "var(--spacing-4)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(!isRecoveryMode);
                setCode("");
                setErrorMessage(null);
              }}
              style={{
                color: "var(--primary)",
                fontWeight: 500,
                textDecoration: "underline",
              }}
            >
              {isRecoveryMode ? "Use Authenticator App" : "Use a Recovery Code"}
            </button>

            <button
              type="button"
              onClick={clearMfa}
              style={{
                color: "var(--outline)",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
