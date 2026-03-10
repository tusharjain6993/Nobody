import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { casesApi } from "../ministerApi";
import { MOC_MINISTER_OFFICE_STAFF } from "../../constants/mocWhoIsWho";

const PENDENCY_PRIORITY_COLORS = {
  LOW: "text-emerald-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  CRITICAL: "text-red-600",
};

const URGENCY_STYLES = {
  LOW: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800",
  HIGH: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-800",
  CRITICAL: "text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800",
};

const STATUS_DOT = {
  SUBMITTED: "bg-sky-400",
  IN_REVIEW: "bg-indigo-400",
  REQUEST_CLARIFICATION: "bg-yellow-400",
  APPROVED: "bg-emerald-400",
  SCHEDULED: "bg-violet-400",
  REJECTED: "bg-red-400",
  CLOSED: "bg-slate-400",
  RESOLVED: "bg-teal-400",
  RESOLVED_WITHOUT_MEETING: "bg-teal-400",
};

function UrgencyPill({ value }) {
  if (!value) return null;
  const cls = URGENCY_STYLES[value] || "text-slate-600 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-flex items-center px-1.5 py-px rounded-full text-[0.65rem] font-semibold border ${cls}`}>
      {value}
    </span>
  );
}

function StatusDot({ status }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${STATUS_DOT[status] || "bg-slate-300"}`} />
  );
}

function CaseRow({ c, navigate }) {
  return (
    <button
      type="button"
      onClick={() => navigate(`/cases/${c._id}`)}
      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors text-left border-0 bg-transparent"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100 truncate">
          <StatusDot status={c.status} />
          {c.citizenSnapshot?.name || "Unknown"}
        </div>
        <div className="text-[0.68rem] text-slate-400 dark:text-slate-500 truncate pl-3">
          {c.caseId} &middot; {c.purpose}
        </div>
      </div>
      <UrgencyPill value={c.urgency} />
    </button>
  );
}

function PipelineCircle({ count, label, colorBorder, colorText, colorBg, sub }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-[4.2rem] h-[4.2rem] rounded-full border-[3px] flex flex-col items-center justify-center shadow-3d ${colorBorder} ${colorBg}`}
      >
        <span className={`text-lg font-extrabold leading-none ${colorText}`}>{count}</span>
        <span className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-px">
          active
        </span>
      </div>
      <p className={`mt-1.5 text-[0.7rem] font-semibold uppercase tracking-wide ${colorText}`}>
        {label}
      </p>
      <p className="text-[0.62rem] text-slate-400 dark:text-slate-500">{sub}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center text-slate-300 dark:text-slate-600 px-1">
      <svg width="28" height="14" viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 7h24M24 7l-5-5M24 7l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function PendencyStatCard({ label, value, accent }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d hover:shadow-3d-hover transition-all duration-300 px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-[0.72rem] font-semibold tracking-wide uppercase text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
      <div className="w-8 h-8 rounded-full border border-slate-100/60 dark:border-slate-600/60 shadow-3d-sm flex items-center justify-center text-xs font-bold text-slate-400">{accent}</div>
    </div>
  );
}

export default function WorkflowPipelinePage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("ALL");

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
    return () => { mounted = false; };
  }, []);

  const adminNames = useMemo(
    () => MOC_MINISTER_OFFICE_STAFF.map((s) => s.name),
    []
  );

  const matchesAdmin = (c, adminName) => {
    if (adminName === "ALL") return true;
    const ref = (c.referralPerson || "").toLowerCase();
    const target = adminName.toLowerCase();
    const last = target.split(" ").slice(-1)[0];
    return ref.includes(target) || ref.includes(last);
  };

  const { citizenLane, adminLane, meetingLane } = useMemo(() => {
    const citizen = [];
    const admin = [];
    const meeting = [];

    for (const c of cases) {
      if (!matchesAdmin(c, selectedAdmin)) continue;

      if (c.status === "SUBMITTED") {
        citizen.push(c);
      } else if (c.status === "SCHEDULED") {
        meeting.push(c);
      } else if (!["CLOSED", "REJECTED", "RESOLVED", "RESOLVED_WITHOUT_MEETING"].includes(c.status)) {
        admin.push(c);
      }
    }

    meeting.sort((a, b) => new Date(a.schedule?.scheduledAt || 0) - new Date(b.schedule?.scheduledAt || 0));

    return { citizenLane: citizen, adminLane: admin, meetingLane: meeting };
  }, [cases, selectedAdmin]);

  const totalC = citizenLane.length;
  const totalA = adminLane.length;
  const totalM = meetingLane.length;

  const today = new Date();
  const { totalPending, overdueCount, dueSoonCount, onTrackCount, agingBuckets, overdueAssignments } =
    useMemo(() => {
      const pendingStatuses = ["SUBMITTED", "IN_REVIEW", "APPROVED", "REQUEST_CLARIFICATION", "SCHEDULED"];
      let totalPending = 0, overdueCount = 0, dueSoonCount = 0, onTrackCount = 0;
      const agingBuckets = { lt7: 0, d7to14: 0, d14to30: 0, gte30: 0 };
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
        for (const a of (c.assignments || [])) {
          if (!a.dueDate || ["RESOLVED", "CLOSED"].includes(a.status)) continue;
          const due = new Date(a.dueDate);
          const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            overdueCount += 1;
            overdueAssignments.push({ case: c, assignment: a, daysOver: diffDays });
          } else if (diffDays >= -3) dueSoonCount += 1;
          else onTrackCount += 1;
        }
      }
      return { totalPending, overdueCount, dueSoonCount, onTrackCount, agingBuckets, overdueAssignments };
    }, [cases, today]);

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0 p-0"
      >
        ← Back
      </button>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            Workflow Pipeline
          </h1>
          <p className="text-[0.72rem] text-slate-500 dark:text-slate-400 mt-0.5">
            Citizens → Admin (by referral person) → Meetings Scheduled
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[0.7rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Filter by admin:
          </label>
          <select
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            className="text-[0.78rem] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer outline-none"
          >
            <option value="ALL">All Referral Persons</option>
            {adminNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Pipeline summary circles */}
      <div className="mb-5 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d px-6 py-5">
        {loading ? (
          <div className="text-sm text-slate-400">Loading pipeline…</div>
        ) : (
          <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
            <PipelineCircle
              count={totalC}
              label="Citizens"
              sub={`${totalC} submitted`}
              colorBorder="border-sky-400 dark:border-sky-500"
              colorText="text-sky-600 dark:text-sky-300"
              colorBg="bg-sky-50/60 dark:bg-sky-900/20"
            />
            <Arrow />
            <PipelineCircle
              count={totalA}
              label={selectedAdmin === "ALL" ? "Admins" : selectedAdmin.replace("Shri ", "")}
              sub={`${totalA} in progress`}
              colorBorder="border-amber-400 dark:border-amber-500"
              colorText="text-amber-600 dark:text-amber-300"
              colorBg="bg-amber-50/60 dark:bg-amber-900/20"
            />
            <Arrow />
            <PipelineCircle
              count={totalM}
              label="Meetings"
              sub={`${totalM} scheduled`}
              colorBorder="border-emerald-400 dark:border-emerald-500"
              colorText="text-emerald-600 dark:text-emerald-300"
              colorBg="bg-emerald-50/60 dark:bg-emerald-900/20"
            />
          </div>
        )}
      </div>

      {/* Three-column detail lanes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Citizens – Submitted */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700 bg-sky-50/70 dark:bg-sky-900/30 flex items-center justify-between">
            <span className="text-[0.72rem] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
              Citizens (Submitted)
            </span>
            <span className="text-[0.65rem] font-semibold text-sky-500 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 rounded-full px-2 py-px">
              {totalC}
            </span>
          </div>
          <div className="p-2 space-y-0.5 max-h-[300px] overflow-y-auto">
            {totalC === 0 ? (
              <p className="text-[0.75rem] text-slate-400 dark:text-slate-500 p-2">No submitted cases.</p>
            ) : (
              citizenLane.map((c) => <CaseRow key={c._id} c={c} navigate={navigate} />)
            )}
          </div>
        </div>

        {/* Admin – In Review / Approved */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700 bg-amber-50/70 dark:bg-amber-900/30 flex items-center justify-between">
            <span className="text-[0.72rem] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              {selectedAdmin === "ALL" ? "Admin (All)" : selectedAdmin.replace("Shri ", "")}
            </span>
            <span className="text-[0.65rem] font-semibold text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 rounded-full px-2 py-px">
              {totalA}
            </span>
          </div>
          <div className="p-2 space-y-0.5 max-h-[300px] overflow-y-auto">
            {totalA === 0 ? (
              <p className="text-[0.75rem] text-slate-400 dark:text-slate-500 p-2">No cases under review.</p>
            ) : (
              adminLane.map((c) => <CaseRow key={c._id} c={c} navigate={navigate} />)
            )}
          </div>
        </div>

        {/* Meetings Scheduled */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700 bg-emerald-50/70 dark:bg-emerald-900/30 flex items-center justify-between">
            <span className="text-[0.72rem] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Meetings Scheduled
            </span>
            <span className="text-[0.65rem] font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 rounded-full px-2 py-px">
              {totalM}
            </span>
          </div>
          <div className="p-2 space-y-0.5 max-h-[300px] overflow-y-auto">
            {totalM === 0 ? (
              <p className="text-[0.75rem] text-slate-400 dark:text-slate-500 p-2">No meetings scheduled yet.</p>
            ) : (
              meetingLane.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => navigate(`/cases/${c._id}`)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors text-left border-0 bg-transparent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {c.citizenSnapshot?.name || "Unknown"}
                    </div>
                    <div className="text-[0.68rem] text-slate-400 dark:text-slate-500 truncate">
                      {c.caseId} &middot; {c.schedule?.venue || "TBD"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-[0.72rem] font-semibold text-emerald-700 dark:text-emerald-300">
                      {c.schedule?.scheduledAt
                        ? new Date(c.schedule.scheduledAt).toLocaleDateString()
                        : "—"}
                    </span>
                    <span className="text-[0.62rem] text-slate-400 dark:text-slate-500">
                      {c.schedule?.scheduledAt
                        ? new Date(c.schedule.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Pendency Monitor Section ── */}
      <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-1">
            Pendency Monitor
          </h2>
          <p className="text-[0.72rem] text-slate-500 dark:text-slate-400">
            Pending workload, overdue assignments, and task aging across all cases.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <PendencyStatCard label="Total pending" value={loading ? "…" : totalPending} accent="●" />
          <PendencyStatCard label="Overdue" value={loading ? "…" : overdueCount} accent="!" />
          <PendencyStatCard label="Due in 3 days" value={loading ? "…" : dueSoonCount} accent="⚠" />
          <PendencyStatCard label="On track" value={loading ? "…" : onTrackCount} accent="✓" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Aging analysis
            </p>
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
                    <span className="w-14 text-[0.72rem] text-slate-500 dark:text-slate-400">{row.label}</span>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400/90" style={{ width: `${width}%` }} />
                    </div>
                    <span className="w-5 text-[0.72rem] text-slate-500 dark:text-slate-400 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Overdue tasks</p>
              <p className="text-[0.68rem] text-slate-400">{overdueAssignments.length} past deadline</p>
            </div>
            {loading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
            ) : overdueAssignments.length === 0 ? (
              <p className="text-[0.78rem] text-slate-400 dark:text-slate-500">No overdue assignments at the moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[0.75rem]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80">
                    <tr>
                      {["Task ID", "Subject", "Holder", "Days over", "Priority"].map((h) => (
                        <th key={h} className="text-left py-2 px-2 text-slate-400 dark:text-slate-500 font-semibold text-[0.68rem] uppercase border-b border-slate-200 dark:border-slate-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overdueAssignments.map(({ case: c, assignment: a, daysOver }) => (
                      <tr
                        key={`${c._id}-${a._id}`}
                        className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => navigate(`/cases/${c._id}`)}
                      >
                        <td className="py-1.5 px-2 font-semibold text-indigo-500 dark:text-indigo-300">{c.caseId}</td>
                        <td className="py-1.5 px-2 text-slate-700 dark:text-slate-200 max-w-[180px] truncate">{a.title}</td>
                        <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400 max-w-[140px] truncate">{a.assignedToName || "—"}</td>
                        <td className="py-1.5 px-2 font-semibold text-red-600 dark:text-red-400">{daysOver}d</td>
                        <td className="py-1.5 px-2">
                          <span className={`text-[0.7rem] font-semibold ${PENDENCY_PRIORITY_COLORS[a.priority] || "text-slate-500"}`}>
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
    </div>
  );
}
