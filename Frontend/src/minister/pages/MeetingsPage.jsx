import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meetingsApi } from "../ministerApi";

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d hover:shadow-3d-hover transition-all duration-300 px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-[0.72rem] font-semibold tracking-wide uppercase text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {value}
        </p>
      </div>
      <div className="w-8 h-8 rounded-full border border-slate-100/60 dark:border-slate-600/60 shadow-3d-sm flex items-center justify-center text-sm">
        {icon}
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await meetingsApi.list();
        if (mounted) setMeetings(res.meetings || []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load meetings");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleStatusUpdate = async (meetingId, status) => {
    try {
      await meetingsApi.updateStatus(meetingId, status);
      setMeetings((prev) =>
        prev.map((m) => (m._id === meetingId ? { ...m, status } : m))
      );
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const filtered = filter === "ALL" ? meetings : meetings.filter((m) => m.status === filter);

  const stats = {
    total: meetings.length,
    pending: meetings.filter((m) => m.status === "PENDING").length,
    confirmed: meetings.filter((m) => m.status === "CONFIRMED").length,
    completed: meetings.filter((m) => m.status === "COMPLETED").length,
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0 p-0"
      >
        ← Back
      </button>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
            Meetings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Meeting invites created from case assignments. Track and manage all department meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[0.7rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Filter:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-[0.78rem] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer outline-none"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={loading ? "…" : stats.total} icon="📋" />
        <StatCard label="Pending" value={loading ? "…" : stats.pending} icon="⏳" />
        <StatCard label="Confirmed" value={loading ? "…" : stats.confirmed} icon="✅" />
        <StatCard label="Completed" value={loading ? "…" : stats.completed} icon="🏁" />
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
          Loading meetings…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-8 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            {filter === "ALL"
              ? "No meetings yet. Meeting invites will appear here when assignments are created from case workflows."
              : `No ${filter.toLowerCase()} meetings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div
              key={m._id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d hover:shadow-3d-hover transition-all duration-300 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {m.title}
                    </h3>
                    {m.caseNumber && (
                      <button
                        type="button"
                        className="text-[0.68rem] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border-0"
                        onClick={() => m.caseId && navigate(`/cases/${m.caseId}`)}
                      >
                        {m.caseNumber}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[0.6rem]">🏛️</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{m.department}</span>
                    </span>
                    {m.assignedToName && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[0.6rem]">👤</span>
                        {m.assignedToName}
                      </span>
                    )}
                    {m.dueDate && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[0.6rem]">📅</span>
                        {new Date(m.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="text-slate-400 dark:text-slate-500">
                      Created {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold ${
                      PRIORITY_COLORS[m.priority] || PRIORITY_COLORS.MEDIUM
                    }`}
                  >
                    {m.priority}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold ${
                      STATUS_COLORS[m.status] || STATUS_COLORS.PENDING
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]
                  .filter((s) => s !== m.status)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusUpdate(m._id, s)}
                      className="px-2.5 py-1 text-[0.7rem] rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer font-medium transition-colors"
                    >
                      → {s}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
