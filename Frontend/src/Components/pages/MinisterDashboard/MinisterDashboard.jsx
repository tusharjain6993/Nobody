import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ProjectTaskCards from "./ProjectTaskCards/ProjectTaskCards";
import { dashboardApi } from "../../../minister/ministerApi";
import { useHCMAuth } from "../../../minister/HCMAuthContext";

const COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#0ea5e9"];

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

function MinisterDashboard() {
  const { user } = useHCMAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    dashboardApi.stats()
      .then((res) => { if (mounted) setStats(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load dashboard"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const analytics = stats?.analytics;

  return (
    <div className="p-6 h-full space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {error && <div className="text-xs md:text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-50">{user?.name ? `Good day, ${user.name}` : "Admin Dashboard"}</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Daily, weekly, and monthly productivity drawn from attended events, complaint decisions, and scheduled meetings.</p>
        </div>
      </div>

      <ProjectTaskCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Meeting Density by Day">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.dailyScores || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Time Allocation by Category">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics?.timeAllocation || []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                    {(analytics?.timeAllocation || []).map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Peak Productivity Days">
          <div className="space-y-2">
            {(analytics?.peakDays || []).map((day) => (
              <div key={day.date} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{day.date}</span>
                <span className="font-bold text-slate-900">{day.score}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Department Interaction Frequency">
          <div className="space-y-2">
            {(analytics?.departmentInteractions || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.name}</span>
                <span className="font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Governance vs Ceremonial Ratio">
          <div className="text-4xl font-black text-slate-900">{analytics?.governanceVsCeremonialRatio || 0}</div>
          <div className="mt-3 text-xs text-slate-500">
            Working Hours: {analytics?.workingHours || 0} · Meeting Density: {analytics?.meetingDensity || 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Decision Intensity: {analytics?.decisionIntensity || 0} · Policy Engagement: {analytics?.policyEngagementIndex || 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Public Outreach: {analytics?.publicOutreachIndex || 0} · Political Engagement: {analytics?.politicalEngagementIndex || 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Portfolio Utilisation: Culture {analytics?.portfolioUtilisation?.culture || 0}% / Tourism {analytics?.portfolioUtilisation?.tourism || 0}%
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

export default MinisterDashboard;
