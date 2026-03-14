import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { decodeMeetingPassToken } from "../../utils/meetingPass";

export default function MeetingPassVerifyPage() {
  const { token = "" } = useParams();
  const [state, setState] = useState({ loading: true, valid: false, payload: null, error: "" });

  useEffect(() => {
    let mounted = true;
    decodeMeetingPassToken(token).then((result) => {
      if (!mounted) return;
      setState({
        loading: false,
        valid: !!result.valid,
        payload: result.payload || null,
        error: result.error || "",
      });
    });
    return () => {
      mounted = false;
    };
  }, [token]);

  if (state.loading) {
    return <div className="auth-page"><div className="auth-card">Validating meeting pass…</div></div>;
  }

  if (!state.valid || !state.payload) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--success">
          <div className="auth-logo">!</div>
          <h1 className="auth-title">Invalid Meeting Pass</h1>
          <p className="auth-subtitle">{state.error || "The QR payload could not be verified."}</p>
        </div>
      </div>
    );
  }

  const { payload } = state;

  return (
    <div className="auth-page">
      <div className="auth-page__blur1" aria-hidden="true" />
      <div className="auth-page__blur2" aria-hidden="true" />
      <div className="auth-card auth-card--wide">
        <div className="auth-header">
          <div className="auth-logo auth-logo--success">QR</div>
          <h1 className="auth-title">Meeting Pass Verified</h1>
          <p className="auth-subtitle">Frontend demo verification for a scheduled citizen meeting.</p>
        </div>

        <div className="portal-grid portal-grid--2">
          <div className="portal-card">
            <div className="portal-page__eyebrow">Citizen</div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{payload.citizenName}</h2>
            <p className="mt-2" style={{ color: "var(--text-secondary)" }}>Citizen ID: <strong style={{ color: "var(--text-primary)" }}>{payload.citizenId}</strong></p>
            <p style={{ color: "var(--text-secondary)" }}>Request ID: <strong style={{ color: "var(--text-primary)" }}>{payload.requestId}</strong></p>
          </div>

          <div className="portal-card">
            <div className="portal-page__eyebrow">Meeting Access</div>
            <p style={{ color: "var(--text-secondary)" }}>Visitor ID: <strong style={{ color: "var(--text-primary)" }}>{payload.visitorId}</strong></p>
            <p style={{ color: "var(--text-secondary)" }}>Docket: <strong style={{ color: "var(--text-primary)" }}>{payload.meetingDocket}</strong></p>
            <p style={{ color: "var(--text-secondary)" }}>Date: <strong style={{ color: "var(--text-primary)" }}>{payload.scheduleDate}</strong></p>
            <p style={{ color: "var(--text-secondary)" }}>Time: <strong style={{ color: "var(--text-primary)" }}>{payload.scheduleTime}</strong></p>
          </div>
        </div>

        <div className="portal-card mt-4">
          <div className="portal-page__eyebrow">Meeting Details</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{payload.purpose}</h3>
          <p style={{ color: "var(--text-secondary)" }}>Location: <strong style={{ color: "var(--text-primary)" }}>{payload.scheduleLocation}</strong></p>
          <p style={{ color: "var(--text-secondary)" }}>Notes: <strong style={{ color: "var(--text-primary)" }}>{payload.adminNotes || "No additional notes."}</strong></p>
          <p className="mt-4 text-sm" style={{ color: "var(--text-tertiary)" }}>
            This confirms the QR payload is valid for the demo frontend. It is not a secure real-world identity check because no backend authority exists.
          </p>
        </div>

        <div className="auth-footer" style={{ marginTop: "1.25rem" }}>
          <Link to="/login" className="auth-link">Return to portal</Link>
        </div>
      </div>
    </div>
  );
}
