import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { setDevHostType } from "../../utils/host";

export const LoginView: React.FC = () => {
  const { hostType, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = hostType === "ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred during login.");
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
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              backgroundColor: isAdmin ? "var(--error-container)" : "var(--surface-container-high)",
              color: isAdmin ? "var(--on-error-container)" : "var(--primary)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "var(--spacing-3)",
            }}
          >
            {isAdmin ? "Super Admin Portal" : "Club Operations"}
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--on-surface)",
              marginBottom: "var(--spacing-2)",
            }}
          >
            Padel Ghana
          </h1>
          <p style={{ fontSize: "14px", color: "var(--on-surface-variant)" }}>
            {isAdmin
              ? "Platform back-office for authorized staff only"
              : "Manage courts, rates, and venue profile"}
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
              htmlFor="email-input"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--on-surface)",
                marginBottom: "var(--spacing-1)",
              }}
            >
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@padelclub.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
                color: "var(--on-surface)",
              }}
            />
          </div>

          <div style={{ marginBottom: "var(--spacing-6)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-1)",
              }}
            >
              <label
                htmlFor="password-input"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0 2px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {showPassword ? "🙈 Hide" : "👁️ Show"}
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: "100%",
                  padding: "10px 42px 10px 14px",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--surface)",
                  color: "var(--on-surface)",
                  letterSpacing: showPassword ? "normal" : "0.15em",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--outline)",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
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
              transition: "background-color 0.2s",
            }}
          >
            {isSubmitting ? "Signing in..." : "Continue with 2FA"}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div
          style={{
            marginTop: "var(--spacing-6)",
            padding: "var(--spacing-4)",
            backgroundColor: "var(--surface-container-low)",
            border: "1px dashed var(--outline-variant)",
            borderRadius: "var(--radius-md)",
            fontSize: "12px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--on-surface)",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Testing Credentials:</span>
            <span style={{ fontSize: "11px", color: "var(--primary)" }}>MFA Code: 123456</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              type="button"
              onClick={() => {
                if (isAdmin) setDevHostType("CLUB");
                setEmail("owner@accrapadel.com");
                setPassword("PadelGhana2026!");
              }}
              style={{
                textAlign: "left",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: !isAdmin ? "var(--surface-container-high)" : "var(--surface)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>🎾 <strong>Club Owner:</strong> owner@accrapadel.com</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>Fill ↵</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isAdmin) setDevHostType("ADMIN");
                setEmail("admin@padelghana.com");
                setPassword("PadelGhana2026!");
              }}
              style={{
                textAlign: "left",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: isAdmin ? "var(--surface-container-high)" : "var(--surface)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>🛡️ <strong>Super Admin:</strong> admin@padelghana.com</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>Fill ↵</span>
            </button>
          </div>
          <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--on-surface-variant)" }}>
            Default Password: <code style={{ fontWeight: 600, color: "var(--on-surface)" }}>PadelGhana2026!</code>
          </div>
        </div>
      </div>
    </div>
  );
};
