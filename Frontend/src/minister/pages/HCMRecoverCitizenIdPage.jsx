import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorCircleRegular, PersonRegular } from "@fluentui/react-icons";
import { authApi } from "../ministerApi";
import "./authPages.css";

export default function HCMRecoverCitizenIdPage() {
  const [recoveryAadhaar, setRecoveryAadhaar] = useState("");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveredCitizenId, setRecoveredCitizenId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecover = async (event) => {
    event.preventDefault();
    setError("");
    setRecoveredCitizenId("");
    setLoading(true);
    try {
      const res = await authApi.recoverCitizenId({ aadhaar: recoveryAadhaar, phone: recoveryPhone });
      const completion = res.profileCompletion?.isComplete
        ? "Profile complete"
        : `Profile incomplete (${res.profileCompletion?.percent || 0}%)`;
      setRecoveredCitizenId(`${res.name}: ${res.citizenId} · ${completion}`);
    } catch (err) {
      setError(err.message || "Unable to recover Citizen ID");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--dark-only">
      <div className="auth-page__blur1" aria-hidden="true" />
      <div className="auth-page__blur2" aria-hidden="true" />

      <div className="auth-card" style={{ maxWidth: "520px" }}>
        <div className="auth-header">
          <div className="auth-logo">
            <PersonRegular style={{ fontSize: "1.75rem" }} />
          </div>
          <h1 className="auth-title">Recover Citizen ID</h1>
          <p className="auth-subtitle">Use Aadhaar and mobile number to retrieve your Citizen ID.</p>
        </div>

        {error && <div className="auth-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><ErrorCircleRegular style={{ fontSize: 16 }} /> {error}</div>}
        {recoveredCitizenId && (
          <div className="auth-error" style={{ background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.35)", color: "#dcfce7" }}>
            Recovered Citizen ID: {recoveredCitizenId}
          </div>
        )}

        <form onSubmit={handleRecover}>
          <div className="auth-field-group">
            <label className="auth-label">AADHAAR</label>
            <input value={recoveryAadhaar} onChange={(event) => setRecoveryAadhaar(event.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12-digit Aadhaar" className="auth-input" />
          </div>
          <div className="auth-field-group auth-field-group--last">
            <label className="auth-label">MOBILE NUMBER</label>
            <input value={recoveryPhone} onChange={(event) => setRecoveryPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" className="auth-input" />
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Recovering…" : "Recover Citizen ID →"}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: "1.1rem" }}>
          New citizen? <Link to="/register" className="auth-link">Register and generate your Citizen ID</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: "0.6rem" }}>
          Back to <Link to="/login?role=citizen" className="auth-link">citizen login</Link>
        </div>
      </div>
    </div>
  );
}
