import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { BuildingBankRegular, ChevronRightRegular, DataBarVerticalRegular, CalendarLtrRegular, DocumentAddRegular, PersonRegular } from "@fluentui/react-icons";
import { useHCMAuth } from "../HCMAuthContext";
import { authApi } from "../ministerApi";
import { resetDemoDatabase } from "../../db/database";
import "./authPages.css";

const ROLE_CONFIG = {
  admin: {
    label: "Administrator",
    description: "User management, departments, config & audit",
    icon: DataBarVerticalRegular,
    tint: "auth-role-card--admin",
  },
  minister: {
    label: "Minister",
    description: "View tasks, assign departments, monitor progress",
    icon: BuildingBankRegular,
    tint: "auth-role-card--minister",
  },
  deo: {
    label: "DEO (Data Entry Operator)",
    description: "Enter data, upload documents, manage records",
    icon: CalendarLtrRegular,
    tint: "auth-role-card--deo",
  },
  citizen: {
    label: "Citizen",
    description: "Submit complaints, request meetings, track status",
    icon: DocumentAddRegular,
    tint: "auth-role-card--citizen",
  },
};

function RoleCard({ role, active, onClick }) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`auth-role-card ${config.tint} ${active ? "auth-role-card--active" : ""}`}
    >
      <span className="auth-role-card__icon">
        <Icon />
      </span>
      <span className="auth-role-card__content">
        <span className="auth-role-card__title">{config.label}</span>
        <span className="auth-role-card__desc">{config.description}</span>
      </span>
      <span className="auth-role-card__arrow">
        <ChevronRightRegular />
      </span>
    </button>
  );
}

export default function HCMLoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRole = String(searchParams.get("role") || "").toLowerCase();
  const initialRole = ["admin", "minister", "deo", "citizen"].includes(requestedRole) ? requestedRole : "";
  const [loginAs, setLoginAs] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useHCMAuth();
  const navigate = useNavigate();

  const isCitizen = loginAs === "citizen";
  const hasSelectedRole = !!loginAs;

  const selectRole = (role) => {
    setLoginAs(role);
    setError("");
    setSearchParams({ role });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = loginAs === "citizen"
        ? await authApi.loginByCitizenId(citizenId)
        : await authApi.login(email, password);
      login(data.user, data.token, data.sessionExpiresAt);
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

  const handleResetDemo = () => {
    resetDemoDatabase();
    localStorage.removeItem("hcm_user");
    localStorage.removeItem("hcm_token");
    window.location.reload();
  };

  return (
    <div className="auth-page auth-page--dark-only">
      <div className="auth-page__blur1" aria-hidden="true" />
      <div className="auth-page__blur2" aria-hidden="true" />

      <div className="auth-card" style={{ maxWidth: "520px" }}>
        <div className="auth-header">
          <div className="auth-logo">
            <BuildingBankRegular style={{ fontSize: "1.75rem" }} />
          </div>
          <h1 className="auth-title">HCM PORTAl</h1>
          <p className="auth-subtitle">Ministry of Culture • Govt. of India</p>
        </div>

        <div className="auth-role-select">
          <div className="auth-role-select__label">Select Your Role</div>
          <div className="auth-role-select__list">
            {["admin", "minister", "deo", "citizen"].map((role) => (
              <RoleCard key={role} role={role} active={loginAs === role} onClick={() => selectRole(role)} />
            ))}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {hasSelectedRole && (
        <form onSubmit={handleSubmit}>
          <div className="auth-selected-role">
            <span className="auth-selected-role__icon">
              <PersonRegular />
            </span>
            <span>{ROLE_CONFIG[loginAs].label} Login</span>
          </div>

          {isCitizen ? (
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
              <p className="auth-subtitle" style={{ marginTop: "0.75rem", fontSize: "0.78rem" }}>Citizen sessions expire after 4 hours. Five failed attempts lock the account for 15 minutes.</p>
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
            </div>
          )}
          {loginAs === "minister" && (
            <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.8rem" }}>
              <button type="button" onClick={() => { setEmail("minister@portal.gov"); setPassword("minister123"); setError(""); }} className="auth-demo-btn">Use minister demo</button>
            </div>
          )}
          {loginAs === "deo" && (
            <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.8rem" }}>
              <button type="button" onClick={() => { setEmail("deo@portal.gov"); setPassword("deo123"); setError(""); }} className="auth-demo-btn">Use DEO demo</button>
            </div>
          )}
        </form>
        )}

        <div className="auth-footer" style={{ marginTop: "1.1rem" }}>
          New citizen? <Link to="/register" className="auth-link">Register and generate your Citizen ID</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: "0.6rem" }}>
          Forgot Citizen ID? <Link to="/recover-citizen-id" className="auth-link">Recover here</Link>
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
