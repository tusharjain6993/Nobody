import { useEffect, useState } from "react";
import { citizenApi } from "../ministerApi";

function Card({ title, subtitle, status, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "18px", overflow: "hidden", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
      <div style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
        <div>
          <div style={{ fontSize: "0.78rem", color: "#6366f1", fontWeight: 800 }}>{subtitle}</div>
          <div style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 800, marginTop: "0.2rem" }}>{title}</div>
        </div>
        <div style={{ fontSize: "0.82rem", color: "#334155", fontWeight: 700 }}>{status}</div>
      </div>
      <div style={{ borderTop: "1px solid #e2e8f0", padding: "1rem 1.2rem" }}>{children}</div>
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
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>My Requests</h1>
        <p style={{ margin: "0.3rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>Track meeting requests, complaints, schedules, escalation results, and resolution documents.</p>
      </div>

      {loading && <p style={{ color: "#64748b" }}>Loading your requests...</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {data.meetings.map((meeting) => (
            <Card key={`meeting-${meeting._id}`} title={meeting.purpose} subtitle={meeting.requestId} status={meeting.statusLabel}>
              <div style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>
                Referred to: {meeting.referralAdminName}
                {meeting.scheduleDate && (
                  <div style={{ marginTop: "0.55rem" }}>
                    Schedule: {meeting.scheduleDate} · {meeting.scheduleTime} · {meeting.scheduleLocation}
                  </div>
                )}
                {meeting.visitorId && <div style={{ marginTop: "0.35rem" }}>Visitor ID: {meeting.visitorId}</div>}
                {meeting.meetingDocket && <div style={{ marginTop: "0.35rem" }}>Meeting Docket: {meeting.meetingDocket}</div>}
                {meeting.rejectReason && <div style={{ marginTop: "0.35rem", color: "#b91c1c" }}>Reject reason: {meeting.rejectReason}</div>}
                {meeting.verificationOutcome && <div style={{ marginTop: "0.35rem" }}>Verification call outcome: {meeting.verificationOutcome}</div>}
              </div>
            </Card>
          ))}

          {data.complaints.map((complaint) => (
            <Card key={`complaint-${complaint._id}`} title={complaint.title} subtitle={complaint.complaintId} status={complaint.statusLabel}>
              <div style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>
                {complaint.details}
                {complaint.department && <div style={{ marginTop: "0.55rem" }}>Department: {complaint.department}</div>}
                {complaint.callOutcome && <div style={{ marginTop: "0.35rem" }}>Call outcome: {complaint.callOutcome}</div>}
                {complaint.resolutionSummary && <div style={{ marginTop: "0.35rem" }}>Resolution summary: {complaint.resolutionSummary}</div>}
                {complaint.resolutionDocs?.length > 0 && <div style={{ marginTop: "0.35rem" }}>Resolution documents: {complaint.resolutionDocs.map((doc) => doc.name).join(", ")}</div>}
                {complaint.status === "completed" && <div style={{ marginTop: "0.35rem", color: "#166534", fontWeight: 700 }}>Case closed after resolution.</div>}
                {complaint.escalatedMeetingRequestId && <div style={{ marginTop: "0.35rem" }}>Escalated to admin meeting flow.</div>}
              </div>
            </Card>
          ))}

          {data.meetings.length === 0 && data.complaints.length === 0 && (
            <div style={{ padding: "2rem", color: "#64748b", textAlign: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
              No requests submitted yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
