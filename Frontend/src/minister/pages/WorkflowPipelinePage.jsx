import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { casesApi } from "../ministerApi";

const URGENCY_STYLES = {
  LOW: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800",
  HIGH: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-800",
  CRITICAL: "text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800",
};

function UrgencyPill({ value }) {
  if (!value) return null;
  const cls = URGENCY_STYLES[value] || "text-slate-600 bg-slate-50 border-slate-200";
  return <span className={`inline-flex items-center px-1.5 py-px rounded-full text-[0.65rem] font-semibold border ${cls}`}>{value}</span>;
}

function CaseRow({ c, navigate }) {
  return (
    <button
      type="button"
      onClick={() => navigate(`/cases/${c._id}`)}
      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors text-left border-0 bg-transparent"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100 truncate">{c.citizenSnapshot?.name || "Unknown"}</div>
        <div className="text-[0.68rem] text-slate-400 dark:text-slate-500 truncate">{c.caseId} · {c.purpose}</div>
      </div>
      <UrgencyPill value={c.urgency} />
    </button>
  );
}

export default function WorkflowPipelinePage() {
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
    return () => { mounted = false; };
  }, []);

  const groups = useMemo(() => ({
    citizen: cases.filter((c) => c.status === "SUBMITTED"),
    active: cases.filter((c) => ["IN_REVIEW", "APPROVED", "SCHEDULED", "RESOLVED_WITHOUT_MEETING", "CLOSURE_PENDING_MINISTER", "REJECTION_PENDING_MINISTER"].includes(c.status)),
    closed: cases.filter((c) => ["CLOSED", "REJECTED"].includes(c.status)),
  }), [cases]);

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Workflow Pipeline</h1>
        <p className="text-[0.72rem] text-slate-500 dark:text-slate-400 mt-0.5">Legacy overview screen kept in the codebase.</p>
      </div>

      {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs bg-red-50 text-red-600 border border-red-100">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ["Citizen Submitted", groups.citizen],
          ["Active Handling", groups.active],
          ["Closed", groups.closed],
        ].map(([title, rows]) => (
          <div key={title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d overflow-hidden">
            <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 flex items-center justify-between">
              <span className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">{title}</span>
              <span className="text-[0.65rem] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-px">{rows.length}</span>
            </div>
            <div className="p-2 space-y-0.5 max-h-[360px] overflow-y-auto">
              {loading ? (
                <p className="text-[0.75rem] text-slate-400 p-2">Loading…</p>
              ) : rows.length === 0 ? (
                <p className="text-[0.75rem] text-slate-400 p-2">No cases.</p>
              ) : (
                rows.map((c) => <CaseRow key={c._id} c={c} navigate={navigate} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
