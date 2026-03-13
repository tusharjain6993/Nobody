import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useHCMAuth } from "../HCMAuthContext";
import { authApi } from "../ministerApi";
import { resetDemoDatabase } from "../../db/database";
import "./authPages.css";

export default function HCMLoginPage() {
  const [loginAs, setLoginAs] = useState("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [recoveryAadhaar, setRecoveryAadhaar] = useState("");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveredCitizenId, setRecoveredCitizenId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useHCMAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setRecoveredCitizenId("");
    setLoading(true);
    try {
      const data = loginAs === "citizen"
        ? await authApi.loginByCitizenId(citizenId)
        : await authApi.login(email, password);
      login(data.user, data.token);
      navigate(
        data.user.role === "admin"
          ? "/dashboard"
          : data.user.role === "minister"
            ? "/minister/dashboard"
            : data.user.role === "deo"
              ? "/meetings"
              : "/new-case"
      );
    } catch (err) {
      setError(err.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setError("");
    setRecoveredCitizenId("");
    try {
      const res = await authApi.recoverCitizenId({ aadhaar: recoveryAadhaar, phone: recoveryPhone });
      setRecoveredCitizenId(`${res.name}: ${res.citizenId}`);
    } catch (err) {
      setError(err.message || "Unable to recover Citizen ID");
    }
  };

  const handleResetDemo = () => {
    resetDemoDatabase();
    localStorage.removeItem("hcm_user");
    localStorage.removeItem("hcm_token");
    window.location.reload();
  };

  return (
    <div className="auth-page">
      <div className="auth-page__blur1" aria-hidden="true" />
      <div className="auth-page__blur2" aria-hidden="true" />

      <div className="auth-card" style={{ maxWidth: "520px" }}>
        <div className="auth-header">
          <div className="auth-logo">
            <span style={{ fontSize: "1.75rem" }}>🏛️</span>
          </div>
          <h1 className="auth-title">HCM Portal</h1>
          <p className="auth-subtitle">Citizen, admin, and DEO demo access</p>
        </div>

        <div className="auth-login-type">
          <button type="button" onClick={() => { setLoginAs("citizen"); setError(""); }} className={`auth-login-type__btn ${loginAs === "citizen" ? "auth-login-type__btn--active" : ""}`}>Citizen</button>
          <button type="button" onClick={() => { setLoginAs("admin"); setError(""); }} className={`auth-login-type__btn ${loginAs === "admin" ? "auth-login-type__btn--active" : ""}`}>Admin / DEO</button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {recoveredCitizenId && <div className="auth-error" style={{ background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.35)", color: "#dcfce7" }}>Recovered Citizen ID: {recoveredCitizenId}</div>}

        <form onSubmit={handleSubmit}>
          {loginAs === "citizen" ? (
            <>
              <div className="auth-field-group auth-field-group--last">
                <label className="auth-label" htmlFor="citizen-id">CITIZEN ID</label>
                <input
                  id="citizen-id"
                  type="text"
                  value={citizenId}
                  onChange={(event) => setCitizenId(event.target.value.toUpperCase())}
                  placeholder="CTZ-HP-000001"
                  required
                  className="auth-input"
                />
              </div>
              <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.8rem" }}>
                <button type="button" onClick={() => { setCitizenId("CTZ-HP-000001"); setError(""); }} className="auth-demo-btn">Use citizen demo</button>
              </div>
            </>
          ) : (
            <>
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="login-email">EMAIL ADDRESS</label>
                <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@portal.gov" required className="auth-input" />
              </div>
              <div className="auth-field-group auth-field-group--last">
                <label className="auth-label" htmlFor="login-password">PASSWORD</label>
                <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required className="auth-input" />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          {loginAs === "admin" && (
            <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.8rem" }}>
              <button type="button" onClick={() => { setEmail("admin@portal.gov"); setPassword("admin123"); setError(""); }} className="auth-demo-btn">Use admin demo</button>
              <button type="button" onClick={() => { setEmail("minister@portal.gov"); setPassword("minister123"); setError(""); }} className="auth-demo-btn">Use minister demo</button>
              <button type="button" onClick={() => { setEmail("deo@portal.gov"); setPassword("deo123"); setError(""); }} className="auth-demo-btn">Use DEO demo</button>
            </div>
          )}
        </form>

        {loginAs === "citizen" && (
          <div style={{ marginTop: "1.4rem", paddingTop: "1rem", borderTop: "1px solid rgba(148,163,184,0.2)" }}>
            <p className="auth-subtitle" style={{ marginBottom: "0.75rem" }}>Forgot Citizen ID</p>
            <div className="auth-field-group">
              <label className="auth-label">AADHAAR</label>
              <input value={recoveryAadhaar} onChange={(event) => setRecoveryAadhaar(event.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12-digit Aadhaar" className="auth-input" />
            </div>
            <div className="auth-field-group auth-field-group--last">
              <label className="auth-label">MOBILE NUMBER</label>
              <input value={recoveryPhone} onChange={(event) => setRecoveryPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" className="auth-input" />
            </div>
            <button type="button" onClick={handleRecover} className="auth-demo-btn" style={{ width: "100%" }}>
              Recover Citizen ID
            </button>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: "1.1rem" }}>
          New citizen? <Link to="/register" className="auth-link">Register and generate your Citizen ID</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: "0.6rem" }}>
          Demo data out of sync?{" "}
          <button
            type="button"
            onClick={handleResetDemo}
            className="auth-link"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            Reset local demo database
          </button>
        </div>
      </div>
    </div>
  );
}
