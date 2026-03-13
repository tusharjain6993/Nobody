import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ministerViewApi } from "../ministerApi";

function Card({ label, value, sub }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100/60 dark:border-slate-700/60 rounded-3xl p-4 shadow-3d min-h-32 flex flex-col justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <div className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50">{value}</div>
      </div>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function MinisterDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    ministerViewApi.dashboard()
      .then((res) => { if (mounted) setData(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load minister dashboard"); });
    return () => { mounted = false; };
  }, []);

  const analytics = data?.analytics;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-full">
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Minister Overview</h1>
        <p className="text-sm text-slate-500 mt-1">This dashboard updates from DEO calendar entries and from citizen meetings once admins approve and schedule them.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card label="Scheduled Meetings" value={data?.scheduledMeetings || 0} sub="Approved citizen meetings on the minister calendar" />
        <Card label="Total Events" value={data?.totalEvents || 0} sub="DEO-managed minister engagements" />
        <Card label="Attended Events" value={data?.attendedEvents || 0} sub="Events already marked attended by DEO" />
        <Card label="Invited Events" value={data?.invitedEvents || 0} sub="Incoming invited engagements" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Daily Productivity</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.dailyScores || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Upcoming Agenda</p>
          <div className="space-y-3">
            {(data?.upcomingAgenda || []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.type} · {item.location || "Location pending"}</div>
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">{new Date(item.when).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Working Hours" value={analytics?.workingHours || 0} sub="Derived from attended event duration" />
        <Card label="Meeting Density" value={analytics?.meetingDensity || 0} sub="Average engagements per active day" />
        <Card label="Policy Index" value={`${analytics?.policyEngagementIndex || 0}%`} sub="Governance-oriented engagement mix" />
      </div>
    </div>
  );
}
