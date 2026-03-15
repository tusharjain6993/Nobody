import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function getCitizenFacingStatus(item) {
  if (item?.itemType === "meeting" && ["verification_needed", "approved", "under_review"].includes(item.status)) {
    return { value: "under_review", label: "Under Review" };
  }
  return { value: item?.status || "", label: item?.statusLabel || "" };
}

export default function CitizenMyCasesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ meetings: [], complaints: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState({ q: "", status: "all", type: "all" });

  useEffect(() => {
    let mounted = true;
    citizenApi.myItems()
      .then((res) => { if (mounted) setData(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load your requests"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      status: "all",
      type: tab === "all" ? "all" : tab,
    }));
  }, [tab]);

  const items = useMemo(() => {
    const combined = [
      ...data.meetings.map((item) => ({ ...item, itemType: "meeting", primaryTitle: item.purpose, primaryId: item.requestId })),
      ...data.complaints.map((item) => ({ ...item, itemType: "complaint", primaryTitle: item.title, primaryId: item.complaintId })),
    ].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    return combined.filter((item) => {
      const tabOk = tab === "all" || item.itemType === tab;
      const typeOk = filters.type === "all" || item.itemType === filters.type;
      const citizenStatus = getCitizenFacingStatus(item);
      const statusOk = filters.status === "all" || citizenStatus.value === filters.status;
      const q = filters.q.trim().toLowerCase();
      const searchText = [
        item.primaryTitle,
        item.primaryId,
        citizenStatus.label,
        citizenStatus.value,
        item.currentOwner,
        item.department,
        item.relatedMeeting?.requestId,
        item.relatedComplaint?.complaintId,
        item.scheduleLocation,
        item.rejectReason,
        item.resolutionSummary,
        item.visitorId,
        item.meetingDocket,
      ].filter(Boolean).join(" ").toLowerCase();
      return tabOk && typeOk && statusOk && (!q || searchText.includes(q));
    });
  }, [data.complaints, data.meetings, filters, tab]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set([
      ...data.meetings.map((item) => getCitizenFacingStatus({ ...item, itemType: "meeting" }).value),
      ...data.complaints.map((item) => getCitizenFacingStatus({ ...item, itemType: "complaint" }).value),
    ])).filter(Boolean).sort();
  }, [data.complaints, data.meetings]);

  return (
    <div className="portal-page">
      <div className="portal-page__hero">
        <div className="portal-page__eyebrow">Citizen Desk</div>
        <h1 className="portal-page__title" style={{ fontSize: "2.5rem" }}>Complaints</h1>
        <p className="portal-page__desc">Track complaints, linked escalations, resolution updates, and related meeting references in one place.</p>
      </div>

      <div className="portal-tabs">
        {[
          ["all", `All (${data.meetings.length + data.complaints.length})`],
          ["complaint", `Complaints (${data.complaints.length})`],
          ["meeting", `Meeting Escalations (${data.meetings.length})`],
        ].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={`portal-tab ${tab === value ? "portal-tab--active" : ""}`}>{label}</button>
        ))}
      </div>

      <div className="portal-card">
        <div className="grid md:grid-cols-3 gap-3">
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Search ID, title, status, owner..." className="portal-input" />
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="portal-input">
            <option value="all">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
          </select>
          <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="portal-input">
            <option value="all">All record types</option>
            <option value="meeting">Meetings</option>
            <option value="complaint">Complaints</option>
          </select>
        </div>
      </div>

      {loading && <div className="portal-card portal-empty">Loading your requests...</div>}
      {error && <div className="portal-alert portal-alert--error">{error}</div>}

      {!loading && !error && (
        <div className="portal-list">
          {items.map((item) => item.itemType === "meeting" ? (
            <Card key={`meeting-${item._id}`} title={item.purpose} subtitle={item.requestId} status={getCitizenFacingStatus(item).label}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                Referred to: {item.referralAdminName}
                <div style={{ marginTop: "0.35rem" }}>Current owner: {item.currentOwner}</div>
                {item.scheduleDate && (
                  <div style={{ marginTop: "0.55rem" }}>
                    Schedule: {item.scheduleDate} · {item.scheduleTime} · {item.scheduleLocation}
                  </div>
                )}
                {item.visitorId && <div style={{ marginTop: "0.35rem" }}>Visitor ID: {item.visitorId}</div>}
                {item.meetingDocket && <div style={{ marginTop: "0.35rem" }}>Meeting Docket: {item.meetingDocket}</div>}
                {item.rejectReason && <div style={{ marginTop: "0.35rem", color: "var(--accent-danger)" }}>Reject reason: {item.rejectReason}</div>}
                {item.relatedComplaint && <div style={{ marginTop: "0.35rem" }}>Linked complaint: {item.relatedComplaint.complaintId}</div>}
                <button type="button" onClick={() => navigate(`/meetings/${item._id}`)} className="portal-btn-secondary" style={{ marginTop: "0.85rem" }}>Open full meeting record</button>
              </div>
            </Card>
          ) : (
            <Card key={`complaint-${item._id}`} title={item.title} subtitle={item.complaintId} status={getCitizenFacingStatus(item).label}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                {item.details}
                <div style={{ marginTop: "0.35rem" }}>Current owner: {item.currentOwner}</div>
                {item.department && <div style={{ marginTop: "0.55rem" }}>Department: {item.department}</div>}
                {item.callOutcome && <div style={{ marginTop: "0.35rem" }}>Call outcome: {item.callOutcome}</div>}
                {item.resolutionSummary && <div style={{ marginTop: "0.35rem" }}>Resolution summary: {item.resolutionSummary}</div>}
                {item.resolutionDocs?.length > 0 && <div style={{ marginTop: "0.35rem" }}>Resolution documents: {item.resolutionDocs.map((doc) => doc.name).join(", ")}</div>}
                {item.status === "completed" && <div style={{ marginTop: "0.35rem", color: "var(--accent-success)", fontWeight: 700 }}>Case closed after resolution.</div>}
                {item.relatedMeeting && <div style={{ marginTop: "0.35rem" }}>Escalated meeting: {item.relatedMeeting.requestId}</div>}
              </div>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="portal-card portal-empty" style={{ color: "var(--text-secondary)" }}>
              No requests found for the current filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
