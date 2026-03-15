import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LabelList,
} from "recharts";
import ProjectTaskCards from "./ProjectTaskCards/ProjectTaskCards";
import { dashboardApi } from "../../../minister/ministerApi";
import { useHCMAuth } from "../../../minister/HCMAuthContext";

const COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#0ea5e9"];

function resolveChartTheme() {
  if (typeof document === "undefined") {
    return {
      axis: "#94a3b8",
      value: "#64748b",
      grid: "#e2e8f0",
      tooltipBg: "#ffffff",
      tooltipBorder: "#e2e8f0",
    };
  }
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  return {
    axis: read("--text-secondary", "#94a3b8"),
    value: read("--text-primary", "#64748b"),
    grid: read("--border-secondary", "#e2e8f0"),
    tooltipBg: read("--bg-primary", "#ffffff"),
    tooltipBorder: read("--border-primary", "#e2e8f0"),
  };
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

function PrecisionMetric({ label, value, color = "#6366f1", suffix = "" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/70">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900 dark:text-slate-100">{value}{suffix}</span>
    </div>
  );
}

function MinisterDashboard() {
  const { user } = useHCMAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartTheme, setChartTheme] = useState(() => resolveChartTheme());

  useEffect(() => {
    let mounted = true;
    dashboardApi.stats()
      .then((res) => { if (mounted) setStats(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load dashboard"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const updateTheme = () => setChartTheme(resolveChartTheme());
    updateTheme();
    if (typeof document === "undefined") return undefined;
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    return () => observer.disconnect();
  }, []);

  const analytics = stats?.analytics;
  const operations = stats?.operations;
  const dailySeries = (analytics?.dailyScores || []).slice(-7).map((item) => ({
    ...item,
    shortDate: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));
  const timeAllocation = analytics?.timeAllocation || [];
  const timeAllocationTotal = timeAllocation.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const pendingAgeSeries = [
    { label: "Under 3 days", value: operations?.pendingAgeBuckets?.under3 || 0 },
    { label: "3-7 days", value: operations?.pendingAgeBuckets?.day3to7 || 0 },
    { label: "8-14 days", value: operations?.pendingAgeBuckets?.day8to14 || 0 },
    { label: "Over 14 days", value: operations?.pendingAgeBuckets?.over14 || 0 },
  ];
  const workloadSeries = (operations?.adminWorkloadDistribution || []).map((item) => ({
    admin: item.admin,
    total: item.total,
    complaints: item.complaints,
    meetings: item.meetings,
  }));
  const peakDaySeries = (analytics?.peakDays || []).map((day) => ({
    label: new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: Number(day.score || 0),
  }));
  const departmentSeries = (analytics?.departmentInteractions || []).slice(0, 5).map((item) => ({
    label: item.name.length > 18 ? `${item.name.slice(0, 18)}...` : item.name,
    count: item.count,
    fullLabel: item.name,
  }));
  const governanceMix = {
    policy: Number(analytics?.policyEngagementIndex || 0),
    outreach: Number(analytics?.publicOutreachIndex || 0),
    political: Number(analytics?.politicalEngagementIndex || 0),
    governanceRatio: Number(analytics?.governanceVsCeremonialRatio || 0),
    culture: Number(analytics?.portfolioUtilisation?.culture || 0),
    tourism: Number(analytics?.portfolioUtilisation?.tourism || 0),
  };

  return (
    <div className="p-6 h-full space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {error && <div className="text-xs md:text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

      {/* <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-50">{user?.name ? `Good day, ${user.name}` : "Admin Dashboard"}</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Daily, weekly, and monthly productivity drawn from attended events, complaint decisions, and scheduled meetings.</p>
        </div>
      </div> */}

      <ProjectTaskCards stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          ["Verification Backlog", operations?.verificationBacklog || 0],
          ["Scheduled Meetings", operations?.meetingOutcomes?.scheduled || 0],
          ["Completed Meetings", operations?.meetingOutcomes?.completed || 0],
          ["Cancelled Meetings", operations?.meetingOutcomes?.cancelled || 0],
          ["SLA Breaches", operations?.complaintSlaBreaches || 0],
          ["VIP Meetings", (operations?.priorityBreakdown || []).find((item) => item.priority === "VIP")?.count || 0],
        ].map(([label, value]) => (
          <ChartCard key={label} title={label}>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{value}</div>
          </ChartCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Meeting Density by Day">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySeries}>
                  <defs>
                    <linearGradient id="adminDensityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="shortDate" tick={{ fontSize: 10, fill: chartTheme.axis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.axis }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.value }} />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fill="url(#adminDensityFill)" activeDot={{ r: 5, fill: "#6366f1" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Time Allocation by Category">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="grid grid-cols-[170px_1fr] gap-3 items-center h-56">
              <div className="relative h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={timeAllocation} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={3} stroke="none">
                      {timeAllocation.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.value }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{timeAllocationTotal.toFixed(1)}</div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Hours</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {timeAllocation.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/70">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Pending Age Buckets">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pendingAgeSeries} layout="vertical" margin={{ left: 12, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.axis }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: chartTheme.value }} width={78} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.value }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#8b5cf6">
                  <LabelList dataKey="value" position="right" fill={chartTheme.value} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Admin Workload Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadSeries} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="admin" tick={{ fontSize: 10, fill: chartTheme.axis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: chartTheme.axis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.value }} />
                <Bar dataKey="complaints" stackId="work" radius={[6, 6, 0, 0]} fill="#6366f1" />
                <Bar dataKey="meetings" stackId="work" radius={[6, 6, 0, 0]} fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Peak Productivity Days">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakDaySeries} margin={{ left: 4, right: 14 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: chartTheme.axis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: chartTheme.axis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.value }} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#f59e0b">
                  <LabelList dataKey="score" position="top" fill={chartTheme.value} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Department Interaction Frequency">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSeries} layout="vertical" margin={{ left: 12, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.axis }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: chartTheme.value }} width={110} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12, color: chartTheme.value }} formatter={(value) => [value, "Interactions"]} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel || ""} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#0ea5e9">
                  <LabelList dataKey="count" position="right" fill={chartTheme.value} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Governance Mix">
          <div className="space-y-3">
            <PrecisionMetric label="Governance vs Ceremonial Ratio" value={governanceMix.governanceRatio.toFixed(2)} color="#6366f1" />
            <PrecisionMetric label="Policy Engagement" value={governanceMix.policy.toFixed(1)} suffix="%" color="#6366f1" />
            <PrecisionMetric label="Public Outreach" value={governanceMix.outreach.toFixed(1)} suffix="%" color="#14b8a6" />
            <PrecisionMetric label="Political Engagement" value={governanceMix.political.toFixed(1)} suffix="%" color="#f59e0b" />
            <PrecisionMetric label="Culture Portfolio" value={governanceMix.culture.toFixed(1)} suffix="%" color="#8b5cf6" />
            <PrecisionMetric label="Tourism Portfolio" value={governanceMix.tourism.toFixed(1)} suffix="%" color="#0ea5e9" />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

export default MinisterDashboard;
