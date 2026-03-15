import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { casesApi } from "../ministerApi";

const PRIORITY_COLORS = {
  LOW: "text-emerald-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  VIP: "text-red-600",
};

function StatCard({ label, value, accent }) {
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
      <div className="w-8 h-8 rounded-full border border-slate-100/60 dark:border-slate-600/60 shadow-3d-sm flex items-center justify-center text-xs font-bold text-slate-400">
        {accent}
      </div>
    </div>
  );
}

export default function PendencyMonitorPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await casesApi.list();
        if (mounted) setCases(res.cases || []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load cases");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const today = new Date();

  const { totalPending, overdueCount, dueSoonCount, onTrackCount, agingBuckets, overdueAssignments } =
    useMemo(() => {
      const pendingStatuses = ["SUBMITTED", "IN_REVIEW", "APPROVED", "REQUEST_CLARIFICATION", "SCHEDULED"];

      let totalPending = 0;
      let overdueCount = 0;
      let dueSoonCount = 0;
      let onTrackCount = 0;

      const agingBuckets = {
        lt7: 0,
        d7to14: 0,
        d14to30: 0,
        gte30: 0,
      };

      const overdueAssignments = [];

      for (const c of cases) {
        const created = new Date(c.createdAt);
        const ageDays = Math.floor((today - created) / (1000 * 60 * 60 * 24));

        if (pendingStatuses.includes(c.status)) {
          totalPending += 1;

          if (ageDays < 7) agingBuckets.lt7 += 1;
          else if (ageDays < 14) agingBuckets.d7to14 += 1;
          else if (ageDays < 30) agingBuckets.d14to30 += 1;
          else agingBuckets.gte30 += 1;
        }

        const assignments = c.assignments || [];
        for (const a of assignments) {
          if (!a.dueDate) continue;
          if (["RESOLVED", "CLOSED"].includes(a.status)) continue;
          const due = new Date(a.dueDate);
          const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            overdueCount += 1;
            overdueAssignments.push({ case: c, assignment: a, daysOver: diffDays });
          } else if (diffDays >= -3) {
            dueSoonCount += 1;
          } else {
            onTrackCount += 1;
          }
        }
      }

      return {
        totalPending,
        overdueCount,
        dueSoonCount,
        onTrackCount,
        agingBuckets,
        overdueAssignments,
      };
    }, [cases, today]);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="mb-3 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0 p-0"
      >
        ← Back to Dashboard
      </button>

      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
          Pendency Monitor
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
          Overview of pending workload, overdue assignments, and task aging across all cases.
        </p>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total pending" value={loading ? "…" : totalPending} accent="●" />
        <StatCard label="Overdue" value={loading ? "…" : overdueCount} accent="!" />
        <StatCard label="Due in 3 days" value={loading ? "…" : dueSoonCount} accent="⚠" />
        <StatCard label="On track" value={loading ? "…" : onTrackCount} accent="✓" />
      </div>

      {/* Aging + table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Aging analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Aging analysis
            </p>
          </div>
          <div className="space-y-2">
            {[
              { key: "lt7", label: "< 7d" },
              { key: "d7to14", label: "7–14d" },
              { key: "d14to30", label: "14–30d" },
              { key: "gte30", label: "30d+" },
            ].map((row) => {
              const count = agingBuckets[row.key] || 0;
              const width = totalPending ? Math.max((count / totalPending) * 100, 5) : 0;
              return (
                <div key={row.key} className="flex items-center gap-3">
                  <span className="w-14 text-[0.72rem] text-slate-500 dark:text-slate-400">
                    {row.label}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400/90"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-5 text-[0.72rem] text-slate-500 dark:text-slate-400 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue tasks table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Overdue tasks
            </p>
            <p className="text-[0.68rem] text-slate-400">
              {overdueAssignments.length} past deadline
            </p>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          ) : overdueAssignments.length === 0 ? (
            <p className="text-[0.78rem] text-slate-400 dark:text-slate-500">
              No overdue assignments at the moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[0.75rem]">
                <thead className="bg-slate-50 dark:bg-slate-800/80">
                  <tr>
                    {["Task ID", "Subject", "Holder", "Deadline", "Days over", "Priority"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-2 text-slate-400 dark:text-slate-500 font-semibold text-[0.68rem] uppercase border-b border-slate-200 dark:border-slate-700"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {overdueAssignments.map(({ case: c, assignment: a, daysOver }) => (
                    <tr
                      key={`${c._id}-${a._id}`}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => navigate(`/cases/${c._id}`)}
                    >
                      <td className="py-1.5 px-2 font-semibold text-indigo-500 dark:text-indigo-300">
                        {c.caseId}
                      </td>
                      <td className="py-1.5 px-2 text-slate-700 dark:text-slate-200 max-w-[180px] truncate">
                        {a.title}
                      </td>
                      <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
                        {a.assignedToName || "—"}
                      </td>
                      <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400">
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-1.5 px-2 font-semibold text-red-600 dark:text-red-400">
                        {daysOver}d
                      </td>
                      <td className="py-1.5 px-2">
                        <span
                          className={`text-[0.7rem] font-semibold ${
                            PRIORITY_COLORS[a.priority] || "text-slate-500"
                          }`}
                        >
                          {a.priority || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
