import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MOCK_DASHBOARD_STATS, formatDate, formatDateTime,
  STATUS_COLORS, PRIORITY_COLORS, MOCK_CASES,
} from "../../minister/ministerData";

function StatCard({ label, value, icon, gradient, sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "16px",
      padding: "1.25rem 1.5rem",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      border: "1px solid #e2e8f0",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "80px", height: "80px",
        background: gradient, borderRadius: "0 16px 0 60px", opacity: 0.12,
      }} />
      <div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>{icon}</div>
      <div style={{ fontSize: "2rem", fontWeight: "800", color: "#1e293b" }}>{value}</div>
      <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}

export default function HCMDashboardPage() {
  const navigate = useNavigate();
  const { stats, upcomingMeetings, recentUpdates } = MOCK_DASHBOARD_STATS;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1300px", margin: "0 auto", fontFamily: "'Lora', serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
          Minister Dashboard
        </h1>
        <p style={{ color: "#64748b", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
          Overview of citizen requests and meetings
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "1rem", marginBottom: "1.5rem",
      }}>
        <StatCard label="Total Requests" value={stats.totalRequests} icon="📋" gradient="linear-gradient(135deg,#3b82f6,#6366f1)" />
        <StatCard label="Pending Approval" value={stats.pendingApproval} icon="⏳" gradient="linear-gradient(135deg,#f59e0b,#ef4444)" sub="Awaiting decision" />
        <StatCard label="On Hold" value={stats.onHold} icon="⏸️" gradient="linear-gradient(135deg,#f97316,#fb923c)" />
        <StatCard label="High Priority" value={stats.highPriority} icon="🔥" gradient="linear-gradient(135deg,#ef4444,#f43f5e)" sub="HIGH + URGENT" />
        <StatCard label="Completed" value={stats.completedTasks} icon="✅" gradient="linear-gradient(135deg,#10b981,#059669)" />
        <StatCard label="Follow-up" value={stats.followUpRequired} icon="🔔" gradient="linear-gradient(135deg,#8b5cf6,#6366f1)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Upcoming Meetings */}
        <div style={{
          background: "#fff", borderRadius: "16px", padding: "1.25rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: "700", color: "#1e293b", fontSize: "1rem", margin: 0 }}>
              📅 Upcoming Meetings
            </h2>
            <button
              onClick={() => navigate("/hcm/cases")}
              style={{ fontSize: "0.775rem", color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
            >
              View all →
            </button>
          </div>
          {upcomingMeetings.length === 0 ? (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: "2rem 0" }}>No upcoming meetings</div>
          ) : (
            upcomingMeetings.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(`/hcm/cases/${m.id}`)}
                style={{
                  padding: "0.85rem 1rem", borderRadius: "10px",
                  border: "1px solid #e2e8f0", marginBottom: "0.6rem",
                  cursor: "pointer", transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6366f1" }}>{m.caseId}</div>
                    <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.9rem", margin: "0.1rem 0" }}>
                      {m.citizen.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{m.citizen.phone}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#0f172a" }}>
                      {formatDate(m.scheduledDate)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6366f1" }}>{m.scheduledTimeSlot}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: "#fff", borderRadius: "16px", padding: "1.25rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
        }}>
          <h2 style={{ fontWeight: "700", color: "#1e293b", fontSize: "1rem", margin: "0 0 1rem" }}>
            🕒 Recent Activity
          </h2>
          {recentUpdates.length === 0 ? (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: "2rem 0" }}>No recent activity</div>
          ) : (
            recentUpdates.map((u) => (
              <div key={u.id} style={{
                display: "flex", gap: "0.75rem",
                padding: "0.75rem 0", borderBottom: "1px solid #f1f5f9",
              }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "#6366f1", flexShrink: 0, marginTop: "5px",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e293b" }}>
                    {u.action.replace(/_/g, " ")}
                    {u.case && (
                      <span style={{ color: "#6366f1", marginLeft: "0.35rem" }}>— {u.case.caseId}</span>
                    )}
                  </div>
                  {u.details && <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{u.details}</div>}
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                    {u.user?.name} • {formatDateTime(u.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick case summary table */}
      <div style={{
        marginTop: "1.25rem",
        background: "#fff", borderRadius: "16px", padding: "1.25rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontWeight: "700", color: "#1e293b", fontSize: "1rem", margin: 0 }}>📂 Recent Cases</h2>
          <button
            onClick={() => navigate("/hcm/cases")}
            style={{ fontSize: "0.775rem", color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
          >
            All cases →
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
              {["Case ID", "Citizen", "Category", "Priority", "Status", "Date"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#94a3b8", fontWeight: "600", fontSize: "0.775rem", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_CASES.slice(0, 5).map((c) => {
              const st = STATUS_COLORS[c.status] || {};
              const pr = PRIORITY_COLORS[c.priority] || {};
              return (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/hcm/cases/${c.id}`)}
                  style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "0.65rem 0.75rem", fontWeight: "700", color: "#6366f1" }}>{c.caseId}</td>
                  <td style={{ padding: "0.65rem 0.75rem", color: "#1e293b" }}>{c.citizen.name}</td>
                  <td style={{ padding: "0.65rem 0.75rem", color: "#64748b" }}>{c.category?.replace(/_/g, " ") || "—"}</td>
                  <td style={{ padding: "0.65rem 0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", padding: "0.2rem 0.6rem", borderRadius: "999px", background: pr.bg || "#f1f5f9", color: pr.text || "#475569" }}>
                      {c.priority}
                    </span>
                  </td>
                  <td style={{ padding: "0.65rem 0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", padding: "0.2rem 0.6rem", borderRadius: "999px", background: st.bg || "#f1f5f9", color: st.text || "#475569" }}>
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ padding: "0.65rem 0.75rem", color: "#94a3b8" }}>{formatDate(c.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
