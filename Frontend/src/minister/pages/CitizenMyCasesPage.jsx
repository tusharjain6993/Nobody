import { useEffect, useState } from "react";
import { citizenApi } from "../ministerApi";

function Card({ title, subtitle, status, children }) {
  return (
    <div className="portal-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
        <div>
          <div className="portal-page__eyebrow" style={{ marginBottom: "0.4rem", padding: "4px 10px" }}>{subtitle}</div>
          <div style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 800, marginTop: "0.2rem" }}>{title}</div>
        </div>
        <div className="portal-chip">{status}</div>
      </div>
      <div style={{ borderTop: "1px solid var(--border-primary)", padding: "1rem 1.2rem" }}>{children}</div>
    </div>
  );
}

export default function CitizenMyCasesPage() {
  const [data, setData] = useState({ meetings: [], complaints: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    citizenApi.myItems()
      .then((res) => { if (mounted) setData(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load your requests"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="portal-page">
      <div className="portal-page__hero">
        <div className="portal-page__eyebrow">Citizen Desk</div>
        <h1 className="portal-page__title" style={{ fontSize: "2.5rem" }}>My Requests</h1>
        <p className="portal-page__desc">Track meeting requests, complaints, schedules, escalation results, and resolution documents.</p>
      </div>

      {loading && <div className="portal-card portal-empty">Loading your requests...</div>}
      {error && <div className="portal-alert portal-alert--error">{error}</div>}

      {!loading && !error && (
        <div className="portal-list">
          {data.meetings.map((meeting) => (
            <Card key={`meeting-${meeting._id}`} title={meeting.purpose} subtitle={meeting.requestId} status={meeting.statusLabel}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                Referred to: {meeting.referralAdminName}
                {meeting.scheduleDate && (
                  <div style={{ marginTop: "0.55rem" }}>
                    Schedule: {meeting.scheduleDate} · {meeting.scheduleTime} · {meeting.scheduleLocation}
                  </div>
                )}
                {meeting.visitorId && <div style={{ marginTop: "0.35rem" }}>Visitor ID: {meeting.visitorId}</div>}
                {meeting.meetingDocket && <div style={{ marginTop: "0.35rem" }}>Meeting Docket: {meeting.meetingDocket}</div>}
                {meeting.rejectReason && <div style={{ marginTop: "0.35rem", color: "var(--accent-danger)" }}>Reject reason: {meeting.rejectReason}</div>}
                {meeting.verificationOutcome && <div style={{ marginTop: "0.35rem" }}>Verification call outcome: {meeting.verificationOutcome}</div>}
              </div>
            </Card>
          ))}

          {data.complaints.map((complaint) => (
            <Card key={`complaint-${complaint._id}`} title={complaint.title} subtitle={complaint.complaintId} status={complaint.statusLabel}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                {complaint.details}
                {complaint.department && <div style={{ marginTop: "0.55rem" }}>Department: {complaint.department}</div>}
                {complaint.callOutcome && <div style={{ marginTop: "0.35rem" }}>Call outcome: {complaint.callOutcome}</div>}
                {complaint.resolutionSummary && <div style={{ marginTop: "0.35rem" }}>Resolution summary: {complaint.resolutionSummary}</div>}
                {complaint.resolutionDocs?.length > 0 && <div style={{ marginTop: "0.35rem" }}>Resolution documents: {complaint.resolutionDocs.map((doc) => doc.name).join(", ")}</div>}
                {complaint.status === "completed" && <div style={{ marginTop: "0.35rem", color: "var(--accent-success)", fontWeight: 700 }}>Case closed after resolution.</div>}
                {complaint.escalatedMeetingRequestId && <div style={{ marginTop: "0.35rem" }}>Escalated to admin meeting flow.</div>}
              </div>
            </Card>
          ))}

          {data.meetings.length === 0 && data.complaints.length === 0 && (
            <div className="portal-card portal-empty" style={{ color: "var(--text-secondary)" }}>
              No requests submitted yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
