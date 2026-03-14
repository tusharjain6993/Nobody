import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workItemsApi } from "../ministerApi";

export default function HCMCasesListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ meetingRequests: [], complaints: [], myAdminId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("complaints");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    workItemsApi.list()
      .then((res) => { if (mounted) setData(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load work queue"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const rows = useMemo(() => {
    let list = [];
    if (tab === "complaints") {
      list = data.complaints.filter((item) => !item.assignedAdminUserId && !["completed"].includes(item.status));
    } else if (tab === "meetings") {
      list = data.meetingRequests.filter((item) => !["scheduled", "rejected"].includes(item.status));
    } else if (tab === "myCases") {
      const myComplaints = data.complaints.filter((item) => Number(item.assignedAdminUserId || 0) === Number(data.myAdminId || 0) && item.status !== "completed");
      const myMeetings = data.meetingRequests.filter((item) => Number(item.referralAdminUserId || 0) === Number(data.myAdminId || 0) && !["scheduled", "rejected"].includes(item.status));
      list = [...myComplaints, ...myMeetings];
    } else if (tab === "rejectedMeetings") {
      list = data.meetingRequests.filter((item) => item.status === "rejected");
    } else if (tab === "completedCases") {
      list = data.complaints.filter((item) => item.status === "completed");
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [data, tab, search]);

  const complaintQueueCount = data.complaints.filter((item) => !item.assignedAdminUserId && item.status !== "completed").length;
  const meetingQueueCount = data.meetingRequests.filter((item) => !["scheduled", "rejected"].includes(item.status)).length;
  const myCaseCount = data.complaints.filter((item) => Number(item.assignedAdminUserId || 0) === Number(data.myAdminId || 0) && item.status !== "completed").length
    + data.meetingRequests.filter((item) => Number(item.referralAdminUserId || 0) === Number(data.myAdminId || 0) && !["scheduled", "rejected"].includes(item.status)).length;
  const rejectedMeetingCount = data.meetingRequests.filter((item) => item.status === "rejected").length;
  const completedCaseCount = data.complaints.filter((item) => item.status === "completed").length;
  return (
    <div className="portal-page">
      <div className="portal-toolbar">
        <div>
          <div className="portal-page__eyebrow">Admin Console</div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Admin Work Queue</h1>
          <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            Complaint queue and meeting request queue are managed here. Scheduled meetings move to the Meetings page.
          </p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search requests, citizens, statuses..."
          className="portal-input max-w-sm"
        />
      </div>

      <div className="portal-tabs">
        {[
          ["complaints", `Complaint Queue (${complaintQueueCount})`],
          ["meetings", `Meeting Request Queue (${meetingQueueCount})`],
          ["myCases", `My Case Bucket (${myCaseCount})`],
          ["rejectedMeetings", `Rejected Meetings (${rejectedMeetingCount})`],
          ["completedCases", `Completed Cases (${completedCaseCount})`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`portal-tab ${tab === id ? "portal-tab--active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="portal-alert portal-alert--error">{error}</div>}
      {loading ? (
        <div className="portal-card portal-empty">Loading work queue…</div>
      ) : rows.length === 0 ? (
        <div className="portal-card portal-empty">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No items found for the current view.</p>
        </div>
      ) : (
        <div className="portal-list">
          {rows.map((item) => (
            <div key={`${tab}-${item._id}`} className="portal-list-item">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{item.title || item.purpose}</h3>
                    <span className="portal-chip" style={{ background: "var(--accent-primary-subtle)", color: "var(--accent-primary)" }}>
                      {item.complaintId || item.requestId}
                    </span>
                  </div>
                  <div className="portal-meta">
                    <span>{item.citizenSnapshot?.name}</span>
                    {item.complaintId ? (
                      <span>{item.assignedAdminName ? `Assigned to ${item.assignedAdminName}` : "Unassigned pool item"}</span>
                    ) : (
                      <span>{item.scheduleDate ? `Scheduled ${item.scheduleDate} ${item.scheduleTime}` : "Pending schedule"}</span>
                    )}
                    <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="portal-chip">
                  {item.statusLabel}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate(`/cases/${item.complaintId ? "complaint" : "meeting"}/${item._id}`)}
                  className="portal-btn-secondary"
                >
                  Open
                </button>
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
