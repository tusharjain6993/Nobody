import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useHCMAuth } from "../HCMAuthContext";
import { authApi } from "../ministerApi";
import "./authPages.css";

export default function HCMLoginPage() {
  const [loginAs, setLoginAs] = useState("citizen"); // "admin" | "citizen"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useHCMAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let data;
      if (loginAs === "admin") {
        data = await authApi.login(email, password);
      } else {
        data = await authApi.loginByCitizenId(citizenId);
      }
      login(data.user, data.token);
      if (loginAs === "admin") {
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
    <div className="auth-page">
      <div className="auth-page__blur1" aria-hidden="true" />
      <div className="auth-page__blur2" aria-hidden="true" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span style={{ fontSize: "1.75rem" }}>🏛️</span>
          </div>
          <h1 className="auth-title">HCM Portal</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <div className="auth-login-type">
          <button
            type="button"
            onClick={() => { setLoginAs("admin"); setError(""); }}
            className={`auth-login-type__btn ${loginAs === "admin" ? "auth-login-type__btn--active" : ""}`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => { setLoginAs("citizen"); setError(""); }}
            className={`auth-login-type__btn ${loginAs === "citizen" ? "auth-login-type__btn--active" : ""}`}
          >
            Citizen
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {loginAs === "admin" ? (
          <>
            <form onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="login-email">
                  EMAIL ADDRESS
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="auth-input"
                />
              </div>

              <div className="auth-field-group auth-field-group--last">
                <label className="auth-label" htmlFor="login-password">
                  PASSWORD
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="auth-input"
                />
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? "Signing in…" : "Sign In →"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginAs("admin");
                  setEmail("admin@portal.gov");
                  setPassword("admin123");
                  setError("");
                }}
                className="auth-demo-btn"
              >
                Use demo credentials
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Register here
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Citizen login with ID */}
            <form onSubmit={handleSubmit}>
              <div className="auth-field-group auth-field-group--last">
                <label className="auth-label" htmlFor="citizen-id">
                  CITIZEN ID
                </label>
                <input
                  id="citizen-id"
                  type="text"
                  value={citizenId}
                  onChange={(e) => setCitizenId(e.target.value.toUpperCase())}
                  placeholder="CTZ-HP-000123"
                  required
                  className="auth-input"
                />
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? "Checking…" : "Sign In with Citizen ID →"}
              </button>
            </form>

            {/* Registration info for new citizens */}
            <div className="auth-footer" style={{ marginTop: "1.25rem" }}>
              New citizen?{" "}
              <Link to="/register" className="auth-link">
                Complete registration to get your Citizen ID
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
