import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useHCMAuth } from "../HCMAuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function HCMLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useHCMAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      login(data.user, data.token);

      if (data.user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/new-case");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2744 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "1rem",
    }}>
      <div style={{
        position: "fixed", top: "-10%", right: "-10%",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-10%",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: "420px",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px",
        padding: "2.5rem",
        boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "60px", height: "60px",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            borderRadius: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
            boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
          }}>
            <span style={{ fontSize: "1.75rem" }}>🏛️</span>
          </div>
          <h1 style={{
            fontSize: "1.5rem", fontWeight: "700",
            color: "#f1f5f9", margin: "0 0 0.25rem",
          }}>
            HCM Portal
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5", borderRadius: "8px", padding: "0.75rem 1rem",
            fontSize: "0.875rem", marginBottom: "1rem",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#cbd5e1", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%", padding: "0.75rem 1rem",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px", color: "#f1f5f9",
                fontSize: "0.95rem", outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
            />
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#cbd5e1", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", padding: "0.75rem 1rem",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px", color: "#f1f5f9",
                fontSize: "0.95rem", outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "0.85rem",
              background: loading
                ? "rgba(99,102,241,0.5)"
                : "linear-gradient(135deg, #3b82f6, #6366f1)",
              border: "none", borderRadius: "10px",
              color: "#ffffff", fontWeight: "700",
              fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
              transition: "all 0.2s", letterSpacing: "0.02em",
            }}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <div style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontSize: "0.875rem",
          color: "#94a3b8",
        }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#93c5fd", fontWeight: "600", textDecoration: "none" }}>
            Register here
          </Link>
        </div>

        <div style={{
          marginTop: "1.25rem",
          padding: "0.875rem",
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: "10px",
          fontSize: "0.8rem",
          color: "#93c5fd",
        }}>
          <div style={{ fontWeight: "600", marginBottom: "0.4rem" }}>Admin Credentials:</div>
          <div>Email: <code style={{ background: "rgba(255,255,255,0.1)", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>admin@portal.gov</code></div>
          <div>Password: <code style={{ background: "rgba(255,255,255,0.1)", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>admin123</code></div>
        </div>
      </div>
    </div>
  );
}
