import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { casesApi } from "../ministerApi";
import { useHCMAuth } from "../HCMAuthContext";
import { ADMIN_ROLES, MASTER_ADMIN_ROLE, getRoleLabel } from "../../constants/adminWorkflow";

const STATUS_COLORS = {
  SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IN_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  REQUEST_CLARIFICATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  SCHEDULED: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  RESOLVED_WITHOUT_MEETING: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  CLOSURE_PENDING_MINISTER: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  REJECTION_PENDING_MINISTER: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  REOPENED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  ESCALATED: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  CLOSED: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const COMM_ICONS = { CALL: "📞", LETTER: "📄", EMAIL: "📧", MEETING_NOTE: "📝" };
const EMPTY_LOG = () => ({ id: `${Date.now()}-${Math.random()}`, type: "CALL", summary: "", happenedAt: "" });

function Chip({ label, colorClass }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold ${colorClass}`}>{label}</span>;
}

function Row({ k, v }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-2 py-1">
      <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">{k}</span>
      <span className="text-slate-900 dark:text-slate-200 font-medium text-sm">{v || "-"}</span>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-600/60 rounded-xl p-5 mb-4 shadow-3d ${className}`}>{children}</div>;
}

function SectionTitle({ children }) {
  return <h3 className="text-slate-900 dark:text-slate-100 font-semibold mb-3">{children}</h3>;
}

function ActionOption({ title, description, active, onClick, tone = "slate" }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
        active ? tones[tone] : "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
      }`}
    >
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">{description}</div>
    </button>
  );
}

function LogsEditor({ logs, setLogs }) {
  const updateLog = (id, field, value) => {
    setLogs((current) => current.map((log) => (log.id === id ? { ...log, [field]: value } : log)));
  };

  const addLog = () => setLogs((current) => [...current, EMPTY_LOG()]);
  const removeLog = (id) => setLogs((current) => current.filter((log) => log.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Log Communication</label>
        <button type="button" onClick={addLog} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          + Add Logs
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-3 py-4 text-sm text-slate-400 dark:text-slate-500">
          No logs added.
        </div>
      ) : (
        logs.map((log, index) => (
          <div key={log.id} className="rounded-xl border border-slate-200 dark:border-slate-600 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Log {index + 1}</span>
              <button type="button" onClick={() => removeLog(log.id)} className="text-xs font-semibold text-red-600 dark:text-red-400">
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Type</label>
                <select
                  value={log.type}
                  onChange={(e) => updateLog(log.id, "type", e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {["CALL", "LETTER", "EMAIL", "MEETING_NOTE"].map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Date / Time</label>
                <input
                  type="datetime-local"
                  value={log.happenedAt}
                  onChange={(e) => updateLog(log.id, "happenedAt", e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Summary</label>
              <textarea
                rows={2}
                value={log.summary}
                onChange={(e) => updateLog(log.id, "summary", e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Enter communication summary"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function HCMCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useHCMAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedAction, setSelectedAction] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [actionComment, setActionComment] = useState("");
  const [ministerNote, setMinisterNote] = useState("");
  const [logs, setLogs] = useState([EMPTY_LOG()]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ date: "", time: "", slot: "", type: "", venue: "", title: "" });
  const [closePanelOpen, setClosePanelOpen] = useState(false);
  const [completeForm, setCompleteForm] = useState({ meetingSummary: "", actionRequired: "", responsibleAuthority: "" });
  const [escalateRole, setEscalateRole] = useState("");
  const [escalateReason, setEscalateReason] = useState("");

  const loadCase = async () => {
    try {
      const res = await casesApi.get(id);
      setCaseData(res.case);
    } catch (err) {
      setError(err.message || "Failed to load case");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCase().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (selectedAction !== "approve") {
      setScheduleEnabled(false);
      setMeetingForm({ date: "", time: "", slot: "", type: "", venue: "", title: "" });
    }
    if (selectedAction !== "resolve") {
      setClosePanelOpen(false);
    }
    setLogs([EMPTY_LOG()]);
    setActionComment("");
    setReviewNote("");
  }, [selectedAction]);

  const cleanLogs = useMemo(
    () => logs.filter((log) => log.summary.trim()),
    [logs]
  );

  const isMinister = user?.role === MASTER_ADMIN_ROLE.id;
  const isAdmin = !!user?.role && user.role !== "citizen" && !isMinister;
  const canAdminReview = isAdmin && ["SUBMITTED", "IN_REVIEW", "REQUEST_CLARIFICATION", "REOPENED", "ESCALATED"].includes(caseData?.status);
  const canRequestClosure = isAdmin && ["APPROVED", "SCHEDULED", "RESOLVED_WITHOUT_MEETING"].includes(caseData?.status);
  const canEscalate = isAdmin && ["REOPENED", "ESCALATED"].includes(caseData?.status);
  const canMinisterReview = isMinister && ["CLOSURE_PENDING_MINISTER", "REJECTION_PENDING_MINISTER"].includes(caseData?.status);
  const availableEscalations = ADMIN_ROLES.filter((role) => role.id !== caseData?.currentAdminRole);

  const submitReview = async (action) => {
    setActionLoading(true);
    setError("");
    try {
      const payload = {
        action,
        note: reviewNote,
        comment: actionComment,
        communications: cleanLogs,
      };
      if (action === "APPROVE" && scheduleEnabled && meetingForm.date && meetingForm.time) {
        payload.meeting = {
          scheduledAt: new Date(`${meetingForm.date}T${meetingForm.time}`).toISOString(),
          slot: meetingForm.slot,
          type: meetingForm.type,
          venue: meetingForm.venue,
          title: meetingForm.title,
        };
      }
      const res = await casesApi.review(id, payload);
      setCaseData(res.case);
      if (action === "RESOLVE_WITHOUT_MEETING") {
        setSelectedAction("closure");
        setClosePanelOpen(true);
      } else {
        setSelectedAction("");
      }
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const submitClosure = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      const res = await casesApi.requestClosure(id, {
        ...completeForm,
        comment: actionComment,
        communications: cleanLogs,
      });
      setCaseData(res.case);
      setSelectedAction("");
      setClosePanelOpen(false);
      setCompleteForm({ meetingSummary: "", actionRequired: "", responsibleAuthority: "" });
    } catch (err) {
      setError(err.message || "Failed to send closure request");
    } finally {
      setActionLoading(false);
    }
  };

  const submitMinisterDecision = async (action) => {
    setActionLoading(true);
    setError("");
    try {
      const res = await casesApi.ministerReview(id, { action, note: ministerNote });
      setCaseData(res.case);
      setMinisterNote("");
    } catch (err) {
      setError(err.message || "Minister action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const submitEscalation = async () => {
    if (!escalateRole) {
      setError("Please select an admin to escalate to");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const res = await casesApi.escalate(id, { role: escalateRole, reason: escalateReason });
      setCaseData(res.case);
      setEscalateRole("");
      setEscalateReason("");
    } catch (err) {
      setError(err.message || "Escalation failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading case...</div>;
  if (error && !caseData) return <div className="p-8 text-red-600 dark:text-red-400">{error}</div>;
  if (!caseData) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500">
        <div className="text-3xl">Not found</div>
        <p>
          Case not found.{" "}
          <button type="button" onClick={() => navigate("/cases")} className="text-indigo-500 dark:text-indigo-400 bg-none border-none cursor-pointer">
            Go back
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <button type="button" onClick={() => navigate("/cases")} className="mb-4 text-indigo-500 dark:text-indigo-400 font-bold text-sm bg-transparent border-none cursor-pointer p-0">
        ← Back to Cases
      </button>

      <Card>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">{caseData.caseId}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              <strong>Purpose:</strong> {caseData.purpose}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip label={caseData.status} colorClass={STATUS_COLORS[caseData.status] || "bg-slate-100 text-slate-700"} />
            <Chip label={caseData.urgency || "MEDIUM"} colorClass={PRIORITY_COLORS[caseData.urgency] || PRIORITY_COLORS.MEDIUM} />
          </div>
        </div>
      </Card>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>}

      <div className="flex gap-1 mb-4 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-600/60 shadow-3d-sm overflow-x-auto">
        {[
          { id: "details", label: "Details" },
          { id: "actions", label: "Actions" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === tab.id ? "bg-indigo-500 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <>
          <Card>
            <SectionTitle>Citizen Details</SectionTitle>
            <Row k="Name" v={caseData.citizenSnapshot?.name} />
            <Row k="Email" v={caseData.citizenSnapshot?.email} />
            <Row k="Phone" v={caseData.citizenSnapshot?.phone} />
            <Row k="Aadhaar" v={caseData.citizenSnapshot?.aadhaar} />
            <Row k="Gender" v={caseData.citizenSnapshot?.gender} />
            <Row k="Age" v={caseData.citizenSnapshot?.age} />
          </Card>

          <Card>
            <SectionTitle>Case Details</SectionTitle>
            <Row k="Category" v={caseData.category} />
            <Row k="Referred Admin" v={caseData.assignedAdminLabel} />
            <Row k="Current Admin" v={caseData.currentAdminLabel} />
            <Row k="Details" v={caseData.details} />
            <Row k="Created" v={new Date(caseData.createdAt).toLocaleString()} />
            {caseData.reviewNote && <Row k="Admin Note" v={caseData.reviewNote} />}
            {caseData.ministerDecisionNote && <Row k="Minister Note" v={caseData.ministerDecisionNote} />}
            {caseData.escalationReason && <Row k="Escalation Reason" v={caseData.escalationReason} />}
            {caseData.documents?.length > 0 && (
              <>
                <h4 className="text-slate-700 dark:text-slate-300 font-semibold mt-3 mb-1">Documents</h4>
                {caseData.documents.map((doc, index) => (
                  <div key={index} className="py-1">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
                      {doc.name}
                    </a>
                  </div>
                ))}
              </>
            )}
          </Card>

          {caseData.schedule?.scheduledAt && (
            <Card>
              <SectionTitle>Meeting</SectionTitle>
              <Row k="Scheduled" v={new Date(caseData.schedule.scheduledAt).toLocaleString()} />
              <Row k="Slot" v={caseData.schedule.slot} />
              <Row k="Type" v={caseData.schedule.type} />
              <Row k="Venue" v={caseData.schedule.venue} />
            </Card>
          )}

          {(caseData.meetingSummary || caseData.actionRequired || caseData.responsibleAuthority) && (
            <Card>
              <SectionTitle>Closure Summary</SectionTitle>
              <Row k="Meeting Summary" v={caseData.meetingSummary} />
              <Row k="Action Required" v={caseData.actionRequired} />
              <Row k="Responsible Authority" v={caseData.responsibleAuthority} />
            </Card>
          )}

          <Card>
            <SectionTitle>Comments</SectionTitle>
            {caseData.comments?.length ? (
              <div className="space-y-3">
                {caseData.comments.map((comment) => (
                  <div key={comment._id} className="rounded-lg border border-slate-200 dark:border-slate-600 p-3">
                    <div className="text-sm text-slate-800 dark:text-slate-200">{comment.comment}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {comment.createdByName} ({getRoleLabel(comment.createdByRole)}) • {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet.</p>
            )}
          </Card>

          <Card>
            <SectionTitle>Communication Log</SectionTitle>
            {caseData.communications?.length ? (
              <div className="space-y-2">
                {caseData.communications.map((comm) => (
                  <div key={comm._id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-xl flex-shrink-0">{COMM_ICONS[comm.type] || "💬"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{comm.type.replace("_", " ")}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(comm.happenedAt || comm.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{comm.summary}</p>
                      {comm.createdByName && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">— {comm.createdByName}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No communications logged yet.</p>
            )}
          </Card>
        </>
      )}

      {activeTab === "actions" && (
        <>
          {canAdminReview && (
            <Card>
              <SectionTitle>Admin Actions</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ActionOption title="Approve Case" description="Approve the case, optionally schedule a meeting, and add logs/comments." active={selectedAction === "approve"} onClick={() => setSelectedAction("approve")} tone="emerald" />
                <ActionOption title="Reject Case" description="Send the rejection request to the minister for approval." active={selectedAction === "reject"} onClick={() => setSelectedAction("reject")} tone="red" />
                <ActionOption title="Request Clarification" description="Move the case back for clarification with an admin note." active={selectedAction === "clarification"} onClick={() => setSelectedAction("clarification")} tone="amber" />
                <ActionOption title="Resolve Without Meeting" description="Handle the case directly, then open the closure panel." active={selectedAction === "resolve"} onClick={() => setSelectedAction("resolve")} tone="slate" />
              </div>
            </Card>
          )}

          {selectedAction && ["approve", "reject", "clarification", "resolve"].includes(selectedAction) && (
            <Card>
              <SectionTitle>
                {selectedAction === "approve" && "Approve Case"}
                {selectedAction === "reject" && "Reject Case"}
                {selectedAction === "clarification" && "Request Clarification"}
                {selectedAction === "resolve" && "Resolve Without Meeting"}
              </SectionTitle>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Note</label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="Optional action note"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Comment</label>
                  <textarea
                    rows={2}
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="Optional internal comment"
                  />
                </div>

                <LogsEditor logs={logs} setLogs={setLogs} />

                {selectedAction === "approve" && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Schedule Meeting</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Optional. Meeting creation is independent from communication logs.</div>
                      </div>
                      <input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                    </div>

                    {scheduleEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm((current) => ({ ...current, date: e.target.value }))} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                        <input type="time" value={meetingForm.time} onChange={(e) => setMeetingForm((current) => ({ ...current, time: e.target.value }))} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                        <input type="text" value={meetingForm.slot} onChange={(e) => setMeetingForm((current) => ({ ...current, slot: e.target.value }))} placeholder="Slot" className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                        <input type="text" value={meetingForm.type} onChange={(e) => setMeetingForm((current) => ({ ...current, type: e.target.value }))} placeholder="Type" className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                        <input type="text" value={meetingForm.venue} onChange={(e) => setMeetingForm((current) => ({ ...current, venue: e.target.value }))} placeholder="Venue" className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                        <input type="text" value={meetingForm.title} onChange={(e) => setMeetingForm((current) => ({ ...current, title: e.target.value }))} placeholder="Meeting title" className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  {selectedAction === "approve" && (
                    <button type="button" onClick={() => submitReview("APPROVE")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm disabled:opacity-50">
                      Submit Approval
                    </button>
                  )}
                  {selectedAction === "reject" && (
                    <button type="button" onClick={() => submitReview("REJECT")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm disabled:opacity-50">
                      Send Rejection to Minister
                    </button>
                  )}
                  {selectedAction === "clarification" && (
                    <button type="button" onClick={() => submitReview("REQUEST_CLARIFICATION")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-sm disabled:opacity-50">
                      Request Clarification
                    </button>
                  )}
                  {selectedAction === "resolve" && (
                    <button type="button" onClick={() => submitReview("RESOLVE_WITHOUT_MEETING")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold text-sm disabled:opacity-50">
                      Close This Case
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {(canRequestClosure || closePanelOpen) && (
            <Card>
              <SectionTitle>{caseData.status === "RESOLVED_WITHOUT_MEETING" || closePanelOpen ? "Close Case Panel" : "Request Case Closure"}</SectionTitle>
              <form onSubmit={submitClosure} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Meeting Summary</label>
                  <textarea value={completeForm.meetingSummary} onChange={(e) => setCompleteForm((current) => ({ ...current, meetingSummary: e.target.value }))} rows={3} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Action Required</label>
                  <textarea value={completeForm.actionRequired} onChange={(e) => setCompleteForm((current) => ({ ...current, actionRequired: e.target.value }))} rows={2} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Responsible Authority</label>
                  <input value={completeForm.responsibleAuthority} onChange={(e) => setCompleteForm((current) => ({ ...current, responsibleAuthority: e.target.value }))} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Comment</label>
                  <textarea value={actionComment} onChange={(e) => setActionComment(e.target.value)} rows={2} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <LogsEditor logs={logs} setLogs={setLogs} />
                <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold text-sm disabled:opacity-50">
                  Final Closure Button
                </button>
              </form>
            </Card>
          )}

          {canEscalate && (
            <Card>
              <SectionTitle>Escalate to Another Admin</SectionTitle>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Select Admin</label>
                  <select value={escalateRole} onChange={(e) => setEscalateRole(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                    <option value="">Select admin</option>
                    {availableEscalations.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Reason</label>
                  <textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} rows={2} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <button type="button" onClick={submitEscalation} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-fuchsia-600 text-white font-semibold text-sm disabled:opacity-50">
                  Escalate Case
                </button>
              </div>
            </Card>
          )}

          {canMinisterReview && (
            <Card>
              <SectionTitle>Minister Review</SectionTitle>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {caseData.status === "CLOSURE_PENDING_MINISTER" ? "Closure request received from admin" : "Rejection request received from admin"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Approve the request or send it back to the same admin for re-evaluation.
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Minister Note</label>
                  <textarea value={ministerNote} onChange={(e) => setMinisterNote(e.target.value)} rows={3} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button type="button" onClick={() => submitMinisterDecision("APPROVE")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm disabled:opacity-50">
                    Approve
                  </button>
                  <button type="button" onClick={() => submitMinisterDecision("SEND_BACK")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-sm disabled:opacity-50">
                    Send Back for Re-evaluation
                  </button>
                </div>
              </div>
            </Card>
          )}

          {!canAdminReview && !canRequestClosure && !canEscalate && !canMinisterReview && !closePanelOpen && (
            <Card>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No action controls available for current role/status: <strong>{caseData.status}</strong>
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
