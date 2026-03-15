import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workItemsApi } from "../ministerApi";

function isComplaintQueueItem(item) {
  return !item.assignedAdminUserId && !["resolved", "completed"].includes(item.status);
}

function isMeetingQueueItem(item) {
  return ["submitted", "verification_needed", "under_review", "approved"].includes(item.status);
}

function isMyComplaint(item, myAdminId) {
  return Number(item.assignedAdminUserId || 0) === Number(myAdminId || 0) && !["resolved", "completed"].includes(item.status);
}

function isMyMeeting(item, myAdminId) {
  const ownedByMe = Number(item.assignedAdminUserId || item.referralAdminUserId || 0) === Number(myAdminId || 0);
  return ownedByMe && !["rejected"].includes(item.status) && !["completed", "cancelled"].includes(item.executionStatus || "pending");
}

function isResolvedItem(item) {
  if (item.complaintId) return ["resolved", "completed"].includes(item.status);
  return item.status === "rejected" || ["completed", "cancelled"].includes(item.executionStatus || "pending");
}

function getQueueBuckets(data) {
  return {
    complaints: data.complaints.filter(isComplaintQueueItem),
    meetings: data.meetingRequests.filter(isMeetingQueueItem),
    myCases: [
      ...data.complaints.filter((item) => isMyComplaint(item, data.myAdminId)),
      ...data.meetingRequests.filter((item) => isMyMeeting(item, data.myAdminId)),
    ],
    completedCases: [...data.complaints, ...data.meetingRequests].filter(isResolvedItem),
  };
}

export default function HCMCasesListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ meetingRequests: [], complaints: [], myAdminId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("complaints");
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    caseId: "",
    citizenId: "",
  });

  useEffect(() => {
    let mounted = true;
    workItemsApi.list()
      .then((res) => { if (mounted) setData(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load work queue"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const queues = useMemo(() => getQueueBuckets(data), [data]);
  const baseRows = queues[tab] || [];

  const rows = useMemo(() => {
    return baseRows.filter((item) => {
      const q = filters.q.trim().toLowerCase();
      const idValue = item.complaintId || item.requestId || "";
      const citizenId = item.citizenSnapshot?.citizenId || "";
      const statusOk = filters.status === "all" || item.status === filters.status;
      const caseIdOk = !filters.caseId.trim() || idValue.toLowerCase().includes(filters.caseId.trim().toLowerCase());
      const citizenOk = !filters.citizenId.trim() || citizenId.toLowerCase().includes(filters.citizenId.trim().toLowerCase());
      const textOk = !q || [
        item.title,
        item.purpose,
        item.citizenSnapshot?.name,
        item.citizenSnapshot?.phoneNumbers?.join(" "),
        item.citizenSnapshot?.citizenId,
        item.currentOwner,
        item.status,
        item.statusLabel,
        item.complaintId,
        item.requestId,
        item.priority,
        item.department,
        item.assignedAdminName,
        item.referralAdminName,
        item.scheduleDate,
        item.scheduleTime,
        item.scheduleLocation,
        item.relatedComplaint?.complaintId,
        item.relatedMeeting?.requestId,
      ].filter(Boolean).join(" ").toLowerCase().includes(q);
      return statusOk && caseIdOk && citizenOk && textOk;
    });
  }, [baseRows, filters]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(baseRows.map((item) => item.status))).sort();
  }, [baseRows]);

  const tabCounts = useMemo(() => ({
    complaints: queues.complaints.length,
    meetings: queues.meetings.length,
    myCases: queues.myCases.length,
    completedCases: queues.completedCases.length,
  }), [queues]);

  return (
    <div className="portal-page">
      <div className="portal-toolbar">
        <div>
          <div className="portal-page__eyebrow">Admin Console</div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Admin Work Queue</h1>
          <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            Structured retrieval is enabled here. Filter by workflow status, citizen ID, request/complaint ID, and free text without leaving the queue.
          </p>
        </div>
      </div>

      <div className="portal-tabs">
        {[
          ["complaints", `Complaint Queue (${tabCounts.complaints})`],
          ["meetings", `Meeting Queue (${tabCounts.meetings})`],
          ["myCases", `My Cases (${tabCounts.myCases})`],
          ["completedCases", `Resolved / Completed (${tabCounts.completedCases})`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setFilters({ q: "", status: "all", caseId: "", citizenId: "" });
            }}
            className={`portal-tab ${tab === id ? "portal-tab--active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="portal-card">
        <div className="grid md:grid-cols-4 gap-3">
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Search title, ID, citizen, status, owner..." className="portal-input" />
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="portal-input">
            <option value="all">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
          </select>
          <input value={filters.caseId} onChange={(event) => setFilters((current) => ({ ...current, caseId: event.target.value }))} placeholder="Complaint / Request ID" className="portal-input" />
          <input value={filters.citizenId} onChange={(event) => setFilters((current) => ({ ...current, citizenId: event.target.value.toUpperCase() }))} placeholder="Citizen ID" className="portal-input" />
        </div>
      </div>

      {error && <div className="portal-alert portal-alert--error">{error}</div>}
      {loading ? (
        <div className="portal-card portal-empty">Loading work queue…</div>
      ) : rows.length === 0 ? (
        <div className="portal-card portal-empty">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No items found for the current filters.</p>
        </div>
      ) : (
        <div key={tab} className="portal-list">
          {rows.map((item) => (
            <div key={`${tab}-${item._id}`} className="portal-list-item">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{item.title || item.purpose}</h3>
                    <span className="portal-chip" style={{ background: "var(--accent-primary-subtle)", color: "var(--accent-primary)" }}>{item.complaintId || item.requestId}</span>
                    {item.priority === "VIP" && <span className="portal-chip">VIP Meeting</span>}
                  </div>
                  <div className="portal-meta">
                    <span>{item.citizenSnapshot?.name} · {item.citizenSnapshot?.citizenId}</span>
                    <span>{item.citizenSnapshot?.phoneNumbers?.[0] || "Phone unavailable"}</span>
                    {item.complaintId && <span>{item.assignedAdminName ? `Assigned: ${item.assignedAdminName}` : "Pool item"}</span>}
                    <span>Owner: {item.currentOwner}</span>
                    <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  {(item.relatedComplaint || item.relatedMeeting) && (
                    <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                      {item.relatedComplaint && `Linked complaint: ${item.relatedComplaint.complaintId}`}
                      {item.relatedMeeting && `Linked meeting: ${item.relatedMeeting.requestId}`}
                    </div>
                  )}
                </div>
                <span className="portal-chip">{item.statusLabel}</span>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => navigate(`/cases/${item.complaintId ? "complaint" : "meeting"}/${item._id}`)} className="portal-btn-secondary">Open Record</button>
                {!!item.complaintId && !item.assignedAdminUserId && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await workItemsApi.assignComplaintToSelf(item._id);
                      setData((current) => ({
                        ...current,
                        complaints: current.complaints.map((row) => (row._id === item._id ? res.complaint : row)),
                      }));
                    }}
                    className="portal-btn"
                  >
                    Assign to Me
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
