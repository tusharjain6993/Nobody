import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ministerViewApi } from "../ministerApi";

function Card({ label, value, sub }) {
  return (
    <div className="portal-stat min-h-32 flex flex-col justify-between">
      <div>
        <p className="portal-stat__label">{label}</p>
        <div className="portal-stat__value">{value}</div>
      </div>
      <p className="portal-stat__sub">{sub}</p>
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
  const operations = data?.operations;

  return (
    <div className="portal-page">
      {error && <div className="portal-alert portal-alert--error">{error}</div>}

      <div className="portal-page__hero">
        <div className="portal-page__eyebrow">Minister Analytics</div>
        <h1 className="portal-page__title">Minister Overview</h1>
        <p className="portal-page__desc">This dashboard updates from DEO calendar entries and from citizen meetings once admins approve and schedule them.</p>
      </div>

      <div className="portal-grid portal-grid--4">
        <Card label="Scheduled Meetings" value={data?.scheduledMeetings || 0} sub="Approved citizen meetings on the minister calendar" />
        <Card label="Total Events" value={data?.totalEvents || 0} sub="DEO-managed minister engagements" />
        <Card label="Attended Events" value={data?.attendedEvents || 0} sub="Events already marked attended by DEO" />
        <Card label="Invited Events" value={data?.invitedEvents || 0} sub="Incoming invited engagements" />
      </div>

      <div className="portal-grid portal-grid--4">
        <Card label="High Priority Queue" value={(operations?.priorityBreakdown || []).find((item) => item.priority === "HIGH")?.count || 0} sub="Meetings marked high with mandatory reason" />
        <Card label="Verification Backlog" value={operations?.verificationBacklog || 0} sub="Requests still moving through verification and review" />
        <Card label="Completed Meetings" value={operations?.meetingOutcomes?.completed || 0} sub="Citizen meetings marked complete" />
        <Card label="No-Show Meetings" value={operations?.meetingOutcomes?.noShow || 0} sub="Scheduled citizen meetings that ended as no-show" />
      </div>

      <div className="portal-grid portal-grid--2">
        <div className="portal-card">
          <p className="portal-stat__label" style={{ marginBottom: "0.75rem" }}>Daily Productivity</p>
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

        <div className="portal-card">
          <p className="portal-stat__label" style={{ marginBottom: "0.75rem" }}>Upcoming Agenda</p>
          <div className="space-y-3">
            {(data?.upcomingAgenda || []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 pb-3" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.title}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{item.type} · {item.location || "Location pending"}</div>
                </div>
                <div className="text-xs whitespace-nowrap" style={{ color: "var(--text-tertiary)" }}>{new Date(item.when).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="portal-grid portal-grid--3">
        <Card label="Working Hours" value={analytics?.workingHours || 0} sub="Derived from attended event duration" />
        <Card label="Meeting Density" value={analytics?.meetingDensity || 0} sub="Average engagements per active day" />
        <Card label="Policy Index" value={`${analytics?.policyEngagementIndex || 0}%`} sub="Governance-oriented engagement mix" />
      </div>
    </div>
  );
}
