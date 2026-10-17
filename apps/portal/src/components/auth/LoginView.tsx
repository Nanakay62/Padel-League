import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export const LoginView: React.FC = () => {
  const { hostType, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
            <label
              htmlFor="password-input"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--on-surface)",
                marginBottom: "var(--spacing-1)",
              }}
            >
              Password
            </label>
            <input
              id="password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
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
      </div>
    </div>
  );
};
