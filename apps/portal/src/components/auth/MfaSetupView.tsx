import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "../../context/AuthContext";
import { MfaSetupData } from "../../api/client";

export const MfaSetupView: React.FC = () => {
  const { setupMfa, confirmMfaSetup, clearMfa } = useAuth();
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [hasAcknowledgedBackup, setHasAcknowledgedBackup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".vercel.app");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSetup = async () => {
      try {
        const data = await setupMfa();
        if (isMounted) {
          setSetupData(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to generate 2FA setup");
        }
      }
    };
    fetchSetup();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (setupData?.otpauth_url && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, setupData.otpauth_url, {
        width: 180,
        margin: 1,
        color: {
          dark: "#0037b0",
          light: "#ffffff",
        },
      });
    }
  }, [setupData]);

  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyRecoveryCodes = () => {
    if (setupData?.recovery_codes) {
      navigator.clipboard.writeText(setupData.recovery_codes.join("\n"));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode || !hasAcknowledgedBackup) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await confirmMfaSetup(confirmationCode);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Verification failed. Check your 6-digit code."
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
          maxWidth: "520px",
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-8)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-6)" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "var(--spacing-1)" }}>
            Set Up Two-Factor Authentication
          </h1>
          <p style={{ fontSize: "14px", color: "var(--on-surface-variant)" }}>
            Two-factor authentication is mandatory for club and platform administration.
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

        {setupData ? (
          <form onSubmit={handleSubmit}>
            {/* Step 1: Scan QR Code */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "var(--spacing-4)",
                backgroundColor: "var(--surface-container-low)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--spacing-6)",
              }}
            >
              <canvas ref={canvasRef} style={{ borderRadius: "var(--radius-sm)" }} />
              <div style={{ marginTop: "var(--spacing-3)", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--on-surface-variant)", marginBottom: "4px" }}>
                  Can't scan? Enter key manually:
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <code
                    style={{
                      fontFamily: "monospace",
                      fontSize: "13px",
                      fontWeight: 600,
                      backgroundColor: "var(--surface-container-high)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {setupData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    style={{
                      fontSize: "12px",
                      color: "var(--primary)",
                      fontWeight: 600,
                    }}
                  >
                    {copiedKey ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Recovery Codes */}
            <div style={{ marginBottom: "var(--spacing-6)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--spacing-2)",
                }}
              >
                <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Emergency Recovery Codes</h3>
                <button
                  type="button"
                  onClick={handleCopyRecoveryCodes}
                  style={{
                    fontSize: "12px",
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  {copiedCodes ? "Copied All!" : "Copy All"}
                </button>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--on-surface-variant)",
                  marginBottom: "var(--spacing-3)",
                }}
              >
                Save these 8 single-use codes in a secure place. If you lose your authenticator, each code can be used once to regain access.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  padding: "var(--spacing-3)",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "monospace",
                  fontSize: "13px",
                }}
              >
                {setupData.recovery_codes.map((c, i) => (
                  <div key={i} style={{ color: "var(--on-surface)" }}>
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Acknowledgment Checkbox */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "var(--spacing-6)",
              }}
            >
              <input
                id="ack-checkbox"
                type="checkbox"
                checked={hasAcknowledgedBackup}
                onChange={(e) => setHasAcknowledgedBackup(e.target.checked)}
                style={{ marginTop: "3px", width: "16px", height: "16px" }}
              />
              <label
                htmlFor="ack-checkbox"
                style={{ fontSize: "13px", color: "var(--on-surface)", cursor: "pointer" }}
              >
                I have securely saved these backup recovery codes.
              </label>
            </div>

            {/* Step 4: Verify Initial Code */}
            <div style={{ marginBottom: "var(--spacing-6)" }}>
              <label
                htmlFor="initial-code-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "var(--spacing-1)",
                }}
              >
                Enter the 6-digit code from your app to confirm setup:
              </label>
              <input
                id="initial-code-input"
                type="text"
                required
                maxLength={6}
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="123456"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  textAlign: "center",
                  letterSpacing: "0.2em",
                  fontSize: "18px",
                  fontWeight: 600,
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--surface)",
                }}
              />
              {isLocalDev && (
                <div style={{ marginTop: "8px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setConfirmationCode("123456")}
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
              disabled={isSubmitting || !hasAcknowledgedBackup || confirmationCode.length !== 6}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
                fontSize: "14px",
                fontWeight: 600,
                opacity: isSubmitting || !hasAcknowledgedBackup || confirmationCode.length !== 6 ? 0.6 : 1,
              }}
            >
              {isSubmitting ? "Activating 2FA..." : "Activate & Enter Portal"}
            </button>

            <div style={{ textAlign: "center", marginTop: "var(--spacing-4)" }}>
              <button
                type="button"
                onClick={clearMfa}
                style={{ fontSize: "13px", color: "var(--outline)" }}
              >
                Cancel and back to login
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "var(--spacing-8)", color: "var(--outline)" }}>
            Loading 2FA configuration...
          </div>
        )}
      </div>
    </div>
  );
};
