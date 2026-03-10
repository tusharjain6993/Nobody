import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ProjectTaskCards from "./ProjectTaskCards/ProjectTaskCards";
import { dashboardApi, casesApi } from "../../../minister/ministerApi";
import { useHCMAuth } from "../../../minister/HCMAuthContext";

function MinisterDashboard() {
  const navigate = useNavigate();
  const { user } = useHCMAuth();

  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsRes, casesRes] = await Promise.all([
          dashboardApi.stats(),
          casesApi.list().catch(() => ({ cases: [] })),
        ]);
        if (!mounted) return;
        setStats(statsRes || null);
        setCases(casesRes?.cases || []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    myCitizenSubmitted,
    myInProgress,
    myScheduled,
    myUpcomingMeetings,
    meetingsChartData,
  } = useMemo(() => {
    const staffName = (user?.name || "").toLowerCase();
    const staffLast = staffName.split(" ").slice(-1)[0];

    const myCases = cases.filter((c) => {
      const ref = (c.referralPerson || "").toLowerCase();
      return ref.includes(staffName) || (!!staffLast && ref.includes(staffLast));
    });

    const myCitizenSubmitted = myCases.filter((c) => c.status === "SUBMITTED").length;
    const myInProgress = myCases.filter((c) =>
      ["IN_REVIEW", "APPROVED", "REQUEST_CLARIFICATION"].includes(c.status)
    ).length;
    const myScheduled = myCases.filter((c) => c.status === "SCHEDULED").length;
    const myUpcomingMeetings = myCases
      .filter((c) => c.status === "SCHEDULED" && c.schedule?.scheduledAt)
      .sort((a, b) => new Date(a.schedule.scheduledAt) - new Date(b.schedule.scheduledAt))
      .slice(0, 5);

    const meetingCases = cases.filter(
      (c) =>
        (c.status === "SCHEDULED" || c.status === "CLOSED") &&
        c.schedule?.scheduledAt
    );

    const monthMap = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      monthMap[key] = 0;
    }

    for (const c of meetingCases) {
      const d = new Date(c.schedule.scheduledAt);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      if (key in monthMap) {
        monthMap[key] += 1;
      }
    }

    const meetingsChartData = Object.entries(monthMap).map(([month, count]) => ({
      month,
      meetings: count,
    }));

    return {
      myCitizenSubmitted,
      myInProgress,
      myScheduled,
      myUpcomingMeetings,
      meetingsChartData,
    };
  }, [cases, user?.name]);

  const BAR_COLORS = ["#6366f1", "#818cf8", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9"];

  return (
    <div className="p-6 h-full space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {error && (
        <div className="text-xs md:text-sm text-red-600 dark:text-red-400 font-medium bg-red-50/80 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {user?.name ? `Good day, ${user.name}` : "Minister Dashboard"}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview of cases, scheduled meetings, and your workflow.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[0.75rem] md:text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 raised-pill">
            ● Live
          </span>
          <button
            type="button"
            onClick={() => navigate("/cases")}
            className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 text-[0.75rem] md:text-xs font-semibold cursor-pointer btn-3d"
          >
            View all cases →
          </button>
        </div>
      </div>

      {/* KPI cards: Total Cases, Resolved, Scheduled */}
      <ProjectTaskCards stats={stats} />

      {/* Meetings chart + Workflow strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Meetings held chart */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Meetings held (last 6 months)
          </p>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meetingsChartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    cursor={{ fill: "rgba(99,102,241,0.06)" }}
                  />
                  <Bar dataKey="meetings" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {meetingsChartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Workflow strip */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Workflow for you (by referral person)
          </p>
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="flex-1">
              <div className="rounded-2xl bg-sky-50 dark:bg-sky-900/40 border border-sky-100 dark:border-sky-800 px-3 py-3 shadow-3d-sm">
                <p className="text-[0.7rem] font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide mb-1">
                  Citizens
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-50 leading-none">
                  {myCitizenSubmitted}
                </p>
                <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Submitted cases tagged to you
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 text-slate-300 dark:text-slate-600 text-xl md:text-2xl">
              ➝
            </div>
            <div className="flex-1">
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/40 border border-amber-100 dark:border-amber-800 px-3 py-3 shadow-3d-sm">
                <p className="text-[0.7rem] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
                  Admin ({user?.name?.split(" ")[0] || "You"})
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-50 leading-none">
                  {myInProgress}
                </p>
                <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  In review / approved for your desk
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 text-slate-300 dark:text-slate-600 text-xl md:text-2xl">
              ➝
            </div>
            <div className="flex-1">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 px-3 py-3 shadow-3d-sm">
                <p className="text-[0.7rem] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1">
                  Meetings scheduled
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-50 leading-none">
                  {myScheduled}
                </p>
                <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Approved and scheduled for you
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming meetings list */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Upcoming meetings (your referrals)
          </p>
          <span className="text-[0.7rem] text-slate-400">
            {myUpcomingMeetings.length} scheduled
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : myUpcomingMeetings.length === 0 ? (
          <p className="text-[0.78rem] text-slate-400 dark:text-slate-500">
            No meetings scheduled yet for your referred cases.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myUpcomingMeetings.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => navigate(`/cases/${c._id}`)}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d-sm hover:shadow-3d transition-all duration-200 cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <p className="text-[0.8rem] font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {c.purpose}
                  </p>
                  <p className="text-[0.7rem] text-slate-400 dark:text-slate-500 truncate">
                    {c.citizenSnapshot?.name} • {c.caseId}
                  </p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-[0.75rem] font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(c.schedule.scheduledAt).toLocaleDateString()}
                  </span>
                  <span className="text-[0.68rem] text-slate-400 dark:text-slate-500">
                    {c.schedule.slot ||
                      new Date(c.schedule.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MinisterDashboard;
