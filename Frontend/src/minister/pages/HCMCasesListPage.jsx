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
      list = data.complaints.filter((item) => !item.assignedAdminUserId);
    } else if (tab === "meetings") {
      list = data.meetingRequests.filter((item) => !["scheduled", "rejected"].includes(item.status));
    } else if (tab === "myCases") {
      const myComplaints = data.complaints.filter((item) => Number(item.assignedAdminUserId || 0) === Number(data.myAdminId || 0));
      const myMeetings = data.meetingRequests.filter((item) => Number(item.referralAdminUserId || 0) === Number(data.myAdminId || 0) && !["scheduled", "rejected"].includes(item.status));
      list = [...myComplaints, ...myMeetings];
    } else if (tab === "rejectedMeetings") {
      list = data.meetingRequests.filter((item) => item.status === "rejected");
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [data, tab, search]);

  const complaintQueueCount = data.complaints.filter((item) => !item.assignedAdminUserId).length;
  const meetingQueueCount = data.meetingRequests.filter((item) => !["scheduled", "rejected"].includes(item.status)).length;
  const myCaseCount = data.complaints.filter((item) => Number(item.assignedAdminUserId || 0) === Number(data.myAdminId || 0)).length
    + data.meetingRequests.filter((item) => Number(item.referralAdminUserId || 0) === Number(data.myAdminId || 0) && !["scheduled", "rejected"].includes(item.status)).length;
  const rejectedMeetingCount = data.meetingRequests.filter((item) => item.status === "rejected").length;

  return (
    <div className="p-6 max-w-[1240px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Admin Work Queue</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Complaint queue and meeting request queue are managed here. Scheduled meetings move to the Meetings page.
          </p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search requests, citizens, statuses..."
          className="text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
        />
      </div>

      <div className="flex gap-2 mb-4">
        {[
          ["complaints", `Complaint Queue (${complaintQueueCount})`],
          ["meetings", `Meeting Request Queue (${meetingQueueCount})`],
          ["myCases", `My Case Bucket (${myCaseCount})`],
          ["rejectedMeetings", `Rejected Meetings (${rejectedMeetingCount})`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border ${tab === id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs bg-red-50 text-red-600 border border-red-100">{error}</div>}
      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading work queue…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-3d p-8 text-center">
          <p className="text-slate-400 text-sm">No items found for the current view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((item) => (
            <div key={`${tab}-${item._id}`} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title || item.purpose}</h3>
                    <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                      {item.complaintId || item.requestId}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span>{item.citizenSnapshot?.name}</span>
                    {item.complaintId ? (
                      <span>{item.assignedAdminName ? `Assigned to ${item.assignedAdminName}` : "Unassigned pool item"}</span>
                    ) : (
                      <span>{item.scheduleDate ? `Scheduled ${item.scheduleDate} ${item.scheduleTime}` : "Pending schedule"}</span>
                    )}
                    <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-slate-100 text-slate-700">
                  {item.statusLabel}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate(`/cases/${item.complaintId ? "complaint" : "meeting"}/${item._id}`)}
                  className="px-3 py-1.5 text-[0.78rem] rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
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
                    className="px-3 py-1.5 text-[0.78rem] rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium"
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
