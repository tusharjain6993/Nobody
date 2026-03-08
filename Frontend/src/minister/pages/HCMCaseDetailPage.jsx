import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MOCK_CASES, STATUS_COLORS, PRIORITY_COLORS,
  formatDate, formatDateTime, getCategoryLabel,
  getStatusLabel, getReferringOfficerLabel,
  REFERENCE_MODES,
} from "../../minister/ministerData";

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem", alignItems: "flex-start" }}>
      <span style={{ fontSize: "0.775rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: "140px", paddingTop: "1px" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: "500", flex: 1 }}>
        {value || "—"}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "14px", padding: "1.25rem",
      boxShadow: "0 1px 8px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0",
      marginBottom: "1rem",
    }}>
      <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.95rem", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// Inline workflow modal states
const WORKFLOW_ACTIONS = {
  PENDING_APPROVAL: ["APPROVE", "REJECT", "REQUEST_CLARIFICATION", "RESOLVE_WITHOUT_MEETING"],
  APPROVED: ["SCHEDULE"],
  SCHEDULED: ["CHECKIN", "CLOSE"],
  ON_HOLD: ["APPROVE", "REJECT"],
  NO_SHOW: ["CLOSE", "RESCHEDULE"],
  RESCHEDULED: ["SCHEDULE", "CLOSE"],
  FOLLOW_UP_REQUIRED: ["CLOSE"],
};

const STATUS_AFTER_ACTION = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  REQUEST_CLARIFICATION: "ON_HOLD",
  RESOLVE_WITHOUT_MEETING: "CLOSED",
  SCHEDULE: "SCHEDULED",
  CHECKIN_ARRIVED: "SCHEDULED",
  CHECKIN_NO_SHOW: "NO_SHOW",
  CHECKIN_RESCHEDULED: "RESCHEDULED",
  CLOSE: "CLOSED",
  RESCHEDULE: "RESCHEDULED",
};

export default function HCMCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // All state for the local mock "database"
  const [caseData, setCaseData] = useState(() =>
    MOCK_CASES.find((c) => c.id === id) || null
  );
  const [activeTab, setActiveTab] = useState("details");
  const [showActionModal, setShowActionModal] = useState(null); // action string
  const [formVals, setFormVals] = useState({});
  const [newComment, setNewComment] = useState("");

  if (!caseData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontFamily: "'Lora', serif" }}>
        <div style={{ fontSize: "3rem" }}>🔍</div>
        <p>Case not found. <button onClick={() => navigate("/cases")} style={{ color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>Go back</button></p>
      </div>
    );
  }

  const st = STATUS_COLORS[caseData.status] || {};
  const pr = PRIORITY_COLORS[caseData.priority] || {};
  const actions = WORKFLOW_ACTIONS[caseData.status] || [];

  const doAction = (action) => {
    let newStatus = caseData.status;
    let updates = {};

    if (action === "APPROVE") newStatus = "APPROVED";
    if (action === "REJECT") { newStatus = "REJECTED"; updates.rejectionReason = formVals.rejectionReason || ""; }
    if (action === "REQUEST_CLARIFICATION") newStatus = "ON_HOLD";
    if (action === "RESOLVE_WITHOUT_MEETING") { newStatus = "CLOSED"; updates.resolutionNotes = formVals.resolutionNotes || ""; }
    if (action === "SCHEDULE") {
      newStatus = "SCHEDULED";
      updates = {
        scheduledDate: formVals.scheduledDate || "",
        scheduledTimeSlot: formVals.scheduledTimeSlot || "",
        meetingType: formVals.meetingType || "IN_PERSON",
        venueOrLink: formVals.venueOrLink || "",
      };
    }
    if (action === "CHECKIN") {
      const checkIn = formVals.checkIn || "ARRIVED";
      if (checkIn === "NO_SHOW") newStatus = "NO_SHOW";
      else if (checkIn === "RESCHEDULED") newStatus = "RESCHEDULED";
      updates.visitCheckIn = checkIn;
    }
    if (action === "CLOSE") {
      newStatus = "CLOSED";
      updates = {
        closureStatus: formVals.closureStatus || "COMPLETED",
        closureNotes: formVals.closureNotes || "",
        meetingSummary: formVals.meetingSummary || "",
        actionRequired: formVals.actionRequired || "",
      };
    }

    const logEntry = {
      id: "log-" + Date.now(),
      action: action + "_" + newStatus,
      details: formVals.notes || null,
      userId: "user-1",
      user: { id: "user-1", name: "Staff User", role: "STAFF" },
      createdAt: new Date().toISOString(),
    };

    setCaseData((prev) => ({
      ...prev,
      status: newStatus,
      ...updates,
      updatedAt: new Date().toISOString(),
      auditLogs: [logEntry, ...(prev.auditLogs || [])],
    }));

    setShowActionModal(null);
    setFormVals({});
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: "cmt-" + Date.now(),
      content: newComment,
      userId: "user-1",
      user: { id: "user-1", name: "Staff User", role: "STAFF" },
      createdAt: new Date().toISOString(),
    };
    setCaseData((prev) => ({ ...prev, comments: [...(prev.comments || []), comment] }));
    setNewComment("");
  };

  const tabs = ["details", "comments", "timeline"];

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Lora', serif" }}>
      {/* Back + Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={() => navigate("/cases")}
          style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600", padding: "0", marginBottom: "0.75rem" }}
        >
          ← Back to Cases
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                {caseData.caseId}
              </h1>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", padding: "0.25rem 0.75rem", borderRadius: "999px", background: st.bg, color: st.text, border: `1px solid`, borderColor: st.border }}>
                {getStatusLabel(caseData.status)}
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", padding: "0.25rem 0.75rem", borderRadius: "999px", background: pr.bg, color: pr.text }}>
                {caseData.priority}
              </span>
            </div>
            <p style={{ color: "#64748b", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
              {caseData.purpose}
            </p>
          </div>

          {/* Action buttons */}
          {actions.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {actions.map((action) => (
                <button
                  key={action}
                  onClick={() => { setShowActionModal(action); setFormVals({}); }}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "8px",
                    fontSize: "0.78rem", fontWeight: "700", cursor: "pointer",
                    border: "none",
                    background: action === "REJECT"
                      ? "#fee2e2" : action === "APPROVE"
                      ? "linear-gradient(135deg,#3b82f6,#6366f1)"
                      : action === "SCHEDULE"
                      ? "linear-gradient(135deg,#10b981,#059669)"
                      : action === "CLOSE"
                      ? "#1e293b"
                      : "#f1f5f9",
                    color: ["APPROVE", "SCHEDULE", "CLOSE"].includes(action) ? "#fff" : action === "REJECT" ? "#ef4444" : "#475569",
                    boxShadow: ["APPROVE", "SCHEDULE"].includes(action) ? "0 3px 10px rgba(99,102,241,0.25)" : "none",
                  }}
                >
                  {action.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", borderBottom: "2px solid #e2e8f0" }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: "0.5rem 1.25rem", border: "none",
              background: "none", cursor: "pointer",
              fontSize: "0.875rem", fontWeight: "700",
              color: activeTab === t ? "#6366f1" : "#94a3b8",
              borderBottom: activeTab === t ? "2px solid #6366f1" : "2px solid transparent",
              marginBottom: "-2px", textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ── */}
      {activeTab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Section title="👤 Citizen Information">
            <InfoRow label="Name" value={caseData.citizen.name} />
            <InfoRow label="Phone" value={caseData.citizen.phone} />
            <InfoRow label="Aadhaar" value={caseData.citizen.aadhaar} />
            <InfoRow label="Address" value={caseData.citizen.address} />
          </Section>

          <Section title="📋 Case Information">
            <InfoRow label="Category" value={getCategoryLabel(caseData.category)} />
            <InfoRow label="Referring Officer" value={getReferringOfficerLabel(caseData.referringOfficer)} />
            <InfoRow label="Reference Mode" value={REFERENCE_MODES.find(r => r.id === caseData.referenceMode)?.name} />
            <InfoRow label="Created" value={formatDateTime(caseData.createdAt)} />
            <InfoRow label="Updated" value={formatDateTime(caseData.updatedAt)} />
          </Section>

          {(caseData.scheduledDate || caseData.meetingType) && (
            <Section title="📅 Meeting Details">
              <InfoRow label="Scheduled Date" value={formatDate(caseData.scheduledDate)} />
              <InfoRow label="Time Slot" value={caseData.scheduledTimeSlot} />
              <InfoRow label="Meeting Type" value={caseData.meetingType} />
              <InfoRow label="Venue / Link" value={caseData.venueOrLink} />
              <InfoRow label="Check-in" value={caseData.visitCheckIn} />
            </Section>
          )}

          {(caseData.closureStatus || caseData.rejectionReason || caseData.resolutionNotes) && (
            <Section title="🔒 Resolution">
              <InfoRow label="Closure Status" value={caseData.closureStatus} />
              <InfoRow label="Closure Notes" value={caseData.closureNotes} />
              <InfoRow label="Meeting Summary" value={caseData.meetingSummary} />
              <InfoRow label="Action Required" value={caseData.actionRequired} />
              <InfoRow label="Rejection Reason" value={caseData.rejectionReason} />
              <InfoRow label="Resolution Notes" value={caseData.resolutionNotes} />
            </Section>
          )}

          {(caseData.assignments || []).length > 0 && (
            <Section title="👥 Assignments">
              {caseData.assignments.map((a) => (
                <div key={a.id} style={{ padding: "0.6rem 0.75rem", background: "#f8fafc", borderRadius: "8px", marginBottom: "0.5rem" }}>
                  <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.875rem" }}>{a.user.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Status: {a.status} {a.dueDate ? `• Due: ${formatDate(a.dueDate)}` : ""}
                  </div>
                  {a.notes && <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.2rem" }}>{a.notes}</div>}
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {/* ── COMMENTS TAB ── */}
      {activeTab === "comments" && (
        <Section title="💬 Comments">
          {(caseData.comments || []).length === 0 && (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: "1.5rem", fontSize: "0.875rem" }}>
              No comments yet.
            </div>
          )}
          {(caseData.comments || []).map((c) => (
            <div key={c.id} style={{
              padding: "0.75rem 1rem", background: "#f8fafc",
              borderRadius: "10px", marginBottom: "0.6rem",
              borderLeft: "3px solid #6366f1",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.85rem" }}>{c.user.name}</span>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{formatDateTime(c.createdAt)}</span>
              </div>
              <p style={{ margin: 0, color: "#475569", fontSize: "0.875rem" }}>{c.content}</p>
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              placeholder="Add a comment…"
              style={{
                flex: 1, padding: "0.6rem 0.875rem",
                border: "1px solid #e2e8f0", borderRadius: "8px",
                fontSize: "0.875rem", outline: "none",
              }}
            />
            <button
              onClick={addComment}
              style={{
                padding: "0.6rem 1.25rem",
                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                border: "none", borderRadius: "8px",
                color: "#fff", fontWeight: "700",
                fontSize: "0.875rem", cursor: "pointer",
              }}
            >
              Post
            </button>
          </div>
        </Section>
      )}

      {/* ── TIMELINE TAB ── */}
      {activeTab === "timeline" && (
        <Section title="📜 Audit History">
          {(caseData.auditLogs || []).length === 0 && (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: "1.5rem", fontSize: "0.875rem" }}>
              No audit history.
            </div>
          )}
          {(caseData.auditLogs || []).map((log, i) => (
            <div key={log.id} style={{ display: "flex", gap: "1rem", paddingBottom: "1rem", position: "relative" }}>
              {i < (caseData.auditLogs.length - 1) && (
                <div style={{ position: "absolute", left: "10px", top: "20px", bottom: 0, width: "2px", background: "#e2e8f0" }} />
              )}
              <div style={{
                width: "20px", height: "20px", flexShrink: 0,
                borderRadius: "50%", background: "#6366f1",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1,
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.875rem" }}>
                  {log.action.replace(/_/g, " ")}
                </div>
                {log.details && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{log.details}</div>}
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                  {log.user?.name} • {formatDateTime(log.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── Action Modal ── */}
      {showActionModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "1rem",
        }}
          onClick={(e) => e.target === e.currentTarget && setShowActionModal(null)}
        >
          <div style={{
            background: "#fff", borderRadius: "18px",
            padding: "1.75rem", width: "100%", maxWidth: "440px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{ fontWeight: "800", color: "#0f172a", margin: "0 0 1.25rem", fontSize: "1.1rem" }}>
              {showActionModal.replace(/_/g, " ")}
            </h2>

            {showActionModal === "REJECT" && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.4rem" }}>Rejection Reason</label>
                <textarea
                  rows={3} value={formVals.rejectionReason || ""} placeholder="Explain reason…"
                  onChange={(e) => setFormVals({ ...formVals, rejectionReason: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>
            )}

            {showActionModal === "RESOLVE_WITHOUT_MEETING" && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.4rem" }}>Resolution Notes</label>
                <textarea
                  rows={3} value={formVals.resolutionNotes || ""} placeholder="Describe resolution…"
                  onChange={(e) => setFormVals({ ...formVals, resolutionNotes: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>
            )}

            {showActionModal === "SCHEDULE" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.3rem" }}>Date</label>
                    <input type="date" value={formVals.scheduledDate || ""} onChange={(e) => setFormVals({ ...formVals, scheduledDate: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.3rem" }}>Time Slot</label>
                    <input type="text" value={formVals.scheduledTimeSlot || ""} placeholder="10:00-10:30"
                      onChange={(e) => setFormVals({ ...formVals, scheduledTimeSlot: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.3rem" }}>Meeting Type</label>
                  <select value={formVals.meetingType || "IN_PERSON"} onChange={(e) => setFormVals({ ...formVals, meetingType: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}>
                    <option value="IN_PERSON">In-Person</option>
                    <option value="VIRTUAL">Virtual</option>
                  </select>
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.3rem" }}>Venue / Link</label>
                  <input type="text" value={formVals.venueOrLink || ""} placeholder="Room no. or meeting URL"
                    onChange={(e) => setFormVals({ ...formVals, venueOrLink: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              </>
            )}

            {showActionModal === "CHECKIN" && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.3rem" }}>Check-in Status</label>
                <select value={formVals.checkIn || "ARRIVED"} onChange={(e) => setFormVals({ ...formVals, checkIn: e.target.value })}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}>
                  <option value="ARRIVED">Arrived</option>
                  <option value="NO_SHOW">No Show</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>
            )}

            {showActionModal === "CLOSE" && (
              <>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.3rem" }}>Closure Status</label>
                  <select value={formVals.closureStatus || "COMPLETED"} onChange={(e) => setFormVals({ ...formVals, closureStatus: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}>
                    <option value="COMPLETED">Completed</option>
                    <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                    <option value="RESCHEDULE_REQUIRED">Reschedule Required</option>
                  </select>
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.3rem" }}>Meeting Summary</label>
                  <textarea rows={2} value={formVals.meetingSummary || ""} placeholder="What was discussed…"
                    onChange={(e) => setFormVals({ ...formVals, meetingSummary: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.3rem" }}>Closure Notes</label>
                  <textarea rows={2} value={formVals.closureNotes || ""} placeholder="Additional notes…"
                    onChange={(e) => setFormVals({ ...formVals, closureNotes: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowActionModal(null)}
                style={{ padding: "0.6rem 1.25rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", color: "#64748b", fontWeight: "700", fontSize: "0.875rem", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => doAction(showActionModal)}
                style={{
                  padding: "0.6rem 1.5rem", border: "none", borderRadius: "8px",
                  background: showActionModal === "REJECT" ? "#ef4444" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                  color: "#fff", fontWeight: "700", fontSize: "0.875rem", cursor: "pointer",
                }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
