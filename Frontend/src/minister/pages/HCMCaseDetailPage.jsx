import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { workItemsApi } from "../ministerApi";
import { filesToDocuments } from "../../utils/fileHelpers";
import { useHCMAuth } from "../HCMAuthContext";
import { downloadCaseSummaryPdf } from "../../utils/caseSummary";

function Section({ title, children, action }) {
  return (
    <section className="portal-card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

const inputClass = "portal-input";
const textAreaClass = "portal-textarea";

function buildMeetingActions(item) {
  const actions = [];
  if (item.status === "submitted" || item.status === "under_review") actions.push(["verification", "Verification Needed"]);
  if (item.status === "verification_needed") actions.push(["logVerification", "Log Verification"]);
  if (item.status === "under_review") actions.push(["approve", "Approve"]);
  if (["submitted", "verification_needed", "under_review", "approved"].includes(item.status)) actions.push(["reject", "Reject"]);
  if (item.status === "approved") actions.push(["revertApproval", "Revert Approval"]);
  if (["approved", "scheduled"].includes(item.status)) actions.push(["schedule", item.status === "scheduled" ? "Reschedule" : "Schedule"]);
  if (item.status === "scheduled" && item.executionStatus === "pending") actions.push(["markCompleted", "Mark Completed"], ["markNoShow", "Mark No-Show"], ["cancel", "Cancel"]);
  return actions;
}

function buildComplaintActions(item, userId) {
  const actions = [];
  if (!item.assignedAdminUserId) actions.push(["assign", "Assign to Me"]);
  if (item.assignedAdminUserId && Number(item.assignedAdminUserId) === Number(userId)) {
    actions.push(["reassign", "Reassign"]);
    if (!["resolved", "completed", "escalated_to_admin_meeting"].includes(item.status)) {
      actions.push(["department", "Department Flow"], ["scheduleCall", "Schedule Call"], ["logCall", "Log Call"], ["resolve", "Resolve"], ["escalate", "Escalate"]);
    }
  }
  if (["resolved", "completed", "escalated_to_admin_meeting"].includes(item.status)) actions.push(["reopen", "Reopen"]);
  if (item.status === "resolved") actions.push(["close", "Close"]);
  return actions;
}

function Timeline({ items = [] }) {
  if (!items.length) return <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No timeline events yet.</p>;
  return (
    <div className="space-y-3">
      {items.map((log) => (
        <div key={`${log.sourceLabel}-${log._id}`} className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border-secondary)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{log.action}</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{new Date(log.createdAt).toLocaleString()}</div>
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{log.sourceLabel} · {log.createdByName}</div>
          {log.notes && <div className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{log.notes}</div>}
        </div>
      ))}
    </div>
  );
}

function buildSuccessMessage(itemType, item, action) {
  const caseId = itemType === "meeting" ? item?.requestId : item?.complaintId;
  const messages = {
    verification: `${caseId} was moved to verification.`,
    logVerification: `${caseId} verification outcome was logged.`,
    approve: `${caseId} was approved.`,
    schedule: `${caseId} was scheduled successfully.`,
    reject: `${caseId} was rejected.`,
    revertApproval: `${caseId} approval was reverted to review.`,
    cancel: `${caseId} was cancelled.`,
    markCompleted: `${caseId} was marked completed.`,
    markNoShow: `${caseId} was marked as no-show.`,
    assign: `${caseId} was assigned to you.`,
    reassign: `${caseId} was reassigned successfully.`,
    department: `${caseId} department flow was updated.`,
    scheduleCall: `${caseId} follow-up call was scheduled.`,
    logCall: `${caseId} call outcome was logged.`,
    resolve: `${caseId} was resolved.`,
    escalate: `${caseId} was escalated to a linked meeting.`,
    close: `${caseId} was closed.`,
    reopen: `${caseId} was reopened.`,
  };
  return messages[action] || `${caseId} was updated successfully.`;
}

function SuccessModal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
      style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-md rounded-[28px] border shadow-2xl p-6 text-center"
        style={{
          background: "linear-gradient(180deg, var(--bg-primary), color-mix(in srgb, var(--bg-primary) 84%, var(--accent-primary-subtle) 16%))",
          borderColor: "var(--border-primary)",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", color: "#fff", fontSize: "1.75rem", boxShadow: "var(--shadow-card)" }}
        >
          ✓
        </div>
        <div className="portal-page__eyebrow" style={{ justifyContent: "center", marginBottom: "0.7rem" }}>Action Completed</div>
        <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Workflow Updated</h3>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{message}</p>
        <button type="button" onClick={onClose} className="portal-btn mt-5 w-full">
          Continue
        </button>
      </div>
    </div>
  );
}

export default function HCMCaseDetailPage() {
  const navigate = useNavigate();
  const { itemType, id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useHCMAuth();
  const [item, setItem] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [activePanel, setActivePanel] = useState("overview");
  const [selectedAction, setSelectedAction] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resolutionFiles, setResolutionFiles] = useState([]);
  const [meetingForm, setMeetingForm] = useState({
    reviewNotes: "",
    verificationOutcome: "",
    rejectReason: "",
    scheduleDate: "",
    scheduleTime: "",
    scheduleLocation: "",
    priority: "MEDIUM",
    priorityReason: "",
    actionReason: "",
  });
  const [complaintForm, setComplaintForm] = useState({
    department: "",
    officerName: "",
    officerContact: "",
    manualContact: "",
    callScheduledAt: "",
    callOutcome: "",
    escalationPurpose: "",
    resolutionSummary: "",
    reassignTo: "",
    reassignReason: "",
    reopenReason: "",
  });

  const focusedAction = searchParams.get("action") || "";

  useEffect(() => {
    if (focusedAction) {
      setActivePanel("actions");
      setSelectedAction(focusedAction);
    }
  }, [focusedAction]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setError("");
        if (itemType === "meeting") {
          const res = await workItemsApi.getMeetingRequest(id);
          if (!mounted) return;
          setItem(res.meetingRequest);
        } else {
          const res = await workItemsApi.getComplaint(id);
          if (!mounted) return;
          setItem(res.complaint);
          setContacts(res.contacts || []);
          setAdmins(res.admins || []);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load case");
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, itemType]);

  useEffect(() => {
    if (!item) return;
    if (itemType === "meeting") {
      setMeetingForm((current) => ({
        ...current,
        reviewNotes: item.adminNotes || current.reviewNotes,
        scheduleDate: item.scheduleDate || current.scheduleDate,
        scheduleTime: item.scheduleTime || current.scheduleTime,
        scheduleLocation: item.scheduleLocation || current.scheduleLocation,
        priority: item.priority || current.priority || "MEDIUM",
        priorityReason: item.priorityReason || current.priorityReason,
      }));
    } else {
      setComplaintForm((current) => ({
        ...current,
        department: item.department || "",
        officerName: item.officerName || "",
        officerContact: item.officerContact || "",
        manualContact: item.manualContact || "",
        callScheduledAt: item.callScheduledAt || "",
        callOutcome: item.callOutcome || "",
        resolutionSummary: item.resolutionSummary || "",
      }));
    }
  }, [item, itemType]);

  const matchingContacts = useMemo(
    () => contacts.filter((contact) => !complaintForm.department || contact.department === complaintForm.department),
    [contacts, complaintForm.department]
  );

  const availableActions = itemType === "meeting"
    ? buildMeetingActions(item || {})
    : buildComplaintActions(item || {}, user?.id);

  const activeAction = focusedAction || selectedAction;

  async function runAction(fn, { stayOnPage = true, navigateTo = "", successAction = "" } = {}) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fn();
      const nextItem = res.meetingRequest || res.complaint || item;
      setItem(nextItem);
      if (res.contacts) setContacts(res.contacts);
      if (res.admins) setAdmins(res.admins);
      if (successAction) {
        setSuccessMessage(buildSuccessMessage(itemType, nextItem, successAction));
      }
      if (res.meetingRequest && navigateTo) {
        setSelectedAction("");
        navigate(navigateTo.replace(":meetingId", res.meetingRequest._id));
      } else if (!stayOnPage) {
        setSelectedAction("");
        setActivePanel("actions");
        navigate(`/cases/${itemType}/${id}`);
      }
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (!item) return <div className="portal-card">{error || "Loading..."}</div>;

  const summaryRows = itemType === "meeting"
    ? [
      ["Case ID", item.requestId],
      ["Citizen", item.citizenSnapshot?.name],
      ["Status", item.statusLabel],
      ["Current owner", item.currentOwner],
      ["Next action", item.nextAction],
      ["Priority", item.priority || "MEDIUM"],
      ["Priority reason", item.priorityReason || ""],
      ["Schedule", item.scheduleDate ? `${item.scheduleDate} ${item.scheduleTime || ""}` : "Pending"],
      ["Location", item.scheduleLocation || ""],
      ["Execution status", item.executionStatusLabel || "Pending"],
    ]
    : [
      ["Case ID", item.complaintId],
      ["Citizen", item.citizenSnapshot?.name],
      ["Status", item.statusLabel],
      ["Current owner", item.currentOwner],
      ["Next action", item.nextAction],
      ["Department", item.department || "Pending"],
      ["Officer", item.officerName || item.manualContact || ""],
      ["Resolution summary", item.resolutionSummary || ""],
      ["Reopened count", String(item.reopenedCount || 0)],
    ];

  return (
    <div className="portal-page">
      <SuccessModal open={!!successMessage} message={successMessage} onClose={() => setSuccessMessage("")} />
      <div className="portal-toolbar">
        <div>
          <button type="button" onClick={() => navigate("/cases")} className="portal-link-btn">← Back to Work Queue</button>
        </div>
        <button
          type="button"
          onClick={() => downloadCaseSummaryPdf({
            filename: `${itemType === "meeting" ? item.requestId : item.complaintId}-summary.pdf`,
            title: `${itemType === "meeting" ? item.requestId : item.complaintId} Summary`,
            rows: summaryRows,
            timeline: item.masterTimeline || [],
          })}
          className="portal-btn-secondary"
        >
          Download Summary PDF
        </button>
      </div>

      {error && <div className="portal-alert portal-alert--error">{error}</div>}

      <div className="portal-tabs">
        {[
          ["overview", "Overview"],
          ["timeline", "Timeline"],
          ["related", "Related"],
          ["actions", "Actions"],
        ].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setActivePanel(value)} className={`portal-tab ${activePanel === value ? "portal-tab--active" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      {activePanel === "overview" && <Section title="Case Record">
        <div className="portal-page__eyebrow" style={{ marginBottom: "0.9rem" }}>{itemType === "meeting" ? "Meeting Workflow" : "Complaint Workflow"}</div>
        <div className="portal-grid portal-grid--4">
          <div className="portal-card portal-card--soft">
            <div className="portal-stat__label">Case</div>
            <div className="mt-2 font-semibold" style={{ color: "var(--text-primary)" }}>{itemType === "meeting" ? item.requestId : item.complaintId}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{itemType === "meeting" ? item.purpose : item.title}</div>
          </div>
          <div className="portal-card portal-card--soft">
            <div className="portal-stat__label">Current Owner</div>
            <div className="mt-2 font-semibold" style={{ color: "var(--text-primary)" }}>{item.currentOwner}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Status reason: {item.statusReason || "No explicit reason captured."}</div>
          </div>
          <div className="portal-card portal-card--soft">
            <div className="portal-stat__label">Next Expected Action</div>
            <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.nextAction}</div>
          </div>
          <div className="portal-card portal-card--soft">
            <div className="portal-stat__label">Citizen</div>
            <div className="mt-2 font-semibold" style={{ color: "var(--text-primary)" }}>{item.citizenSnapshot?.name}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{item.citizenSnapshot?.citizenId || "Citizen ID unavailable"}</div>
          </div>
        </div>
      </Section>}

      {activePanel === "timeline" && <Section title="Master Timeline">
        <Timeline items={item.masterTimeline || []} />
      </Section>}

      {activePanel === "related" && <Section title="Related Records">
        <div className="portal-grid portal-grid--3">
          <div className="portal-card portal-card--soft">
            <div className="portal-stat__label">Linked Complaint</div>
            {item.relatedComplaint ? (
              <>
                <div className="mt-2 font-semibold" style={{ color: "var(--text-primary)" }}>{item.relatedComplaint.complaintId}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{item.relatedComplaint.title}</div>
                <button type="button" onClick={() => navigate(`/cases/complaint/${item.relatedComplaint.id}`)} className="portal-link-btn mt-2">Open complaint</button>
              </>
            ) : (
              <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No linked complaint.</div>
            )}
          </div>
          <div className="portal-card portal-card--soft">
            <div className="portal-stat__label">Linked Meeting</div>
            {item.relatedMeeting ? (
              <>
                <div className="mt-2 font-semibold" style={{ color: "var(--text-primary)" }}>{item.relatedMeeting.requestId}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{item.relatedMeeting.purpose}</div>
                <button type="button" onClick={() => navigate(`/cases/meeting/${item.relatedMeeting.id}`)} className="portal-link-btn mt-2">Open meeting</button>
              </>
            ) : (
              <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No linked meeting.</div>
            )}
          </div>
          <div className="portal-card portal-card--soft">
            <div className="portal-stat__label">Notifications</div>
            {(item.relatedNotifications || []).length ? (
              <div className="space-y-2 mt-2">
                {item.relatedNotifications.slice(0, 3).map((note) => (
                  <div key={note._id} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {note.type}: {note.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No linked notifications.</div>
            )}
          </div>
        </div>
      </Section>}

      {activePanel === "actions" && <Section title="Workflow Actions">
        <div className="grid md:grid-cols-[minmax(0,320px)_auto] gap-3 items-start mb-4">
          <select
            value={activeAction}
            onChange={async (event) => {
              const value = event.target.value;
              setSelectedAction(value);
              if (!value) {
                navigate(`/cases/${itemType}/${id}`);
                return;
              }
              if (value === "assign") {
                await runAction(() => workItemsApi.assignComplaintToSelf(id), { stayOnPage: false, successAction: "assign" });
                setSelectedAction("");
                return;
              }
              navigate(`/cases/${itemType}/${id}?action=${value}`);
            }}
            className={inputClass}
          >
            <option value="">Select workflow action</option>
            {availableActions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {activeAction && <button type="button" onClick={() => { setSelectedAction(""); setActivePanel("overview"); navigate(`/cases/${itemType}/${id}`); }} className="portal-btn-secondary">Clear Action</button>}
        </div>

        {!activeAction && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Select an action tab above. Invalid transitions are blocked and each approved change is written into the immutable timeline.
          </p>
        )}

        {itemType === "meeting" && activeAction === "verification" && (
          <div className="space-y-3">
            <textarea value={meetingForm.reviewNotes} onChange={(event) => setMeetingForm((current) => ({ ...current, reviewNotes: event.target.value }))} rows={3} placeholder="Explain why verification is needed" className={textAreaClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.markMeetingVerificationNeeded(id, meetingForm.reviewNotes), { stayOnPage: false, successAction: "verification" })} className="portal-btn">Send to Verification</button>
          </div>
        )}

        {itemType === "meeting" && activeAction === "logVerification" && (
          <div className="space-y-3">
            <textarea value={meetingForm.verificationOutcome} onChange={(event) => setMeetingForm((current) => ({ ...current, verificationOutcome: event.target.value }))} rows={3} placeholder="Record the verification outcome" className={textAreaClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.logMeetingVerificationOutcome(id, meetingForm.verificationOutcome), { stayOnPage: false, successAction: "logVerification" })} className="portal-btn">Log Outcome</button>
          </div>
        )}

        {itemType === "meeting" && activeAction === "approve" && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <select value={meetingForm.priority} onChange={(event) => setMeetingForm((current) => ({ ...current, priority: event.target.value }))} className={inputClass}>
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
              <input value={meetingForm.priorityReason} onChange={(event) => setMeetingForm((current) => ({ ...current, priorityReason: event.target.value }))} placeholder="Mandatory reason for High priority" className={inputClass} />
            </div>
            <textarea value={meetingForm.reviewNotes} onChange={(event) => setMeetingForm((current) => ({ ...current, reviewNotes: event.target.value }))} rows={3} placeholder="Approval notes" className={textAreaClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.approveMeetingRequest(id, { priority: meetingForm.priority, priorityReason: meetingForm.priorityReason, adminNotes: meetingForm.reviewNotes }), { stayOnPage: false, successAction: "approve" })} className="portal-btn">Approve Request</button>
          </div>
        )}

        {itemType === "meeting" && activeAction === "schedule" && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <input value={meetingForm.scheduleDate} onChange={(event) => setMeetingForm((current) => ({ ...current, scheduleDate: event.target.value }))} type="date" className={inputClass} />
              <input value={meetingForm.scheduleTime} onChange={(event) => setMeetingForm((current) => ({ ...current, scheduleTime: event.target.value }))} type="time" className={inputClass} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <input value={meetingForm.scheduleLocation} onChange={(event) => setMeetingForm((current) => ({ ...current, scheduleLocation: event.target.value }))} placeholder="Meeting location" className={inputClass} />
              <input value={meetingForm.priorityReason} onChange={(event) => setMeetingForm((current) => ({ ...current, priorityReason: event.target.value }))} placeholder="Priority reason" className={inputClass} />
            </div>
            <select value={meetingForm.priority} onChange={(event) => setMeetingForm((current) => ({ ...current, priority: event.target.value }))} className={inputClass}>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <textarea value={meetingForm.reviewNotes} onChange={(event) => setMeetingForm((current) => ({ ...current, reviewNotes: event.target.value }))} rows={3} placeholder="Scheduling notes" className={textAreaClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.scheduleMeetingRequest(id, { scheduleDate: meetingForm.scheduleDate, scheduleTime: meetingForm.scheduleTime, scheduleLocation: meetingForm.scheduleLocation, priority: meetingForm.priority, priorityReason: meetingForm.priorityReason, adminNotes: meetingForm.reviewNotes }), { stayOnPage: false, successAction: "schedule" })} className="portal-btn">{item.status === "scheduled" ? "Reschedule" : "Schedule"}</button>
          </div>
        )}

        {itemType === "meeting" && ["reject", "revertApproval", "cancel", "markCompleted", "markNoShow"].includes(activeAction) && (
          <div className="space-y-3">
            <textarea value={meetingForm.actionReason} onChange={(event) => setMeetingForm((current) => ({ ...current, actionReason: event.target.value }))} rows={3} placeholder="Provide the reason or operational note" className={textAreaClass} />
            <div className="flex gap-2 flex-wrap">
              {activeAction === "reject" && <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.rejectMeetingRequest(id, meetingForm.actionReason), { stayOnPage: false, successAction: "reject" })} className="portal-btn-danger">Reject Meeting</button>}
              {activeAction === "revertApproval" && <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.revertMeetingApproval(id, meetingForm.actionReason), { stayOnPage: false, successAction: "revertApproval" })} className="portal-btn-danger">Revert Approval</button>}
              {activeAction === "cancel" && <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.cancelScheduledMeeting(id, meetingForm.actionReason), { stayOnPage: false, successAction: "cancel" })} className="portal-btn-danger">Cancel Scheduled Meeting</button>}
              {activeAction === "markCompleted" && <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.markMeetingCompleted(id, meetingForm.actionReason), { stayOnPage: false, successAction: "markCompleted" })} className="portal-btn">Mark Completed</button>}
              {activeAction === "markNoShow" && <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.markMeetingNoShow(id, meetingForm.actionReason), { stayOnPage: false, successAction: "markNoShow" })} className="portal-btn-danger">Mark No-Show</button>}
            </div>
          </div>
        )}

        {itemType === "complaint" && activeAction === "department" && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <select value={complaintForm.department} onChange={(event) => setComplaintForm((current) => ({ ...current, department: event.target.value, officerName: "", officerContact: "" }))} className={inputClass}>
                <option value="">Select department</option>
                {Array.from(new Set(contacts.map((contact) => contact.department))).map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
              <select
                value={complaintForm.officerName}
                onChange={(event) => {
                  const selected = matchingContacts.find((contact) => contact.officerName === event.target.value);
                  setComplaintForm((current) => ({ ...current, officerName: event.target.value, officerContact: selected ? `${selected.designation} · ${selected.phone}` : "" }));
                }}
                className={inputClass}
              >
                <option value="">Select officer</option>
                {matchingContacts.map((contact) => <option key={contact._id} value={contact.officerName}>{contact.officerName} · {contact.designation}</option>)}
              </select>
              <input value={complaintForm.officerContact} onChange={(event) => setComplaintForm((current) => ({ ...current, officerContact: event.target.value }))} placeholder="Retrieved contact" className={inputClass} />
              <input value={complaintForm.manualContact} onChange={(event) => setComplaintForm((current) => ({ ...current, manualContact: event.target.value }))} placeholder="Manual contact entry" className={inputClass} />
            </div>
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.updateComplaintDepartment(id, complaintForm), { stayOnPage: false, successAction: "department" })} className="portal-btn">Save Department Flow</button>
          </div>
        )}

        {itemType === "complaint" && activeAction === "scheduleCall" && (
          <div className="space-y-3">
            <input value={complaintForm.callScheduledAt} onChange={(event) => setComplaintForm((current) => ({ ...current, callScheduledAt: event.target.value }))} type="datetime-local" className={inputClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.scheduleComplaintCall(id, complaintForm.callScheduledAt), { stayOnPage: false, successAction: "scheduleCall" })} className="portal-btn">Schedule Call</button>
          </div>
        )}

        {itemType === "complaint" && activeAction === "logCall" && (
          <div className="space-y-3">
            <textarea value={complaintForm.callOutcome} onChange={(event) => setComplaintForm((current) => ({ ...current, callOutcome: event.target.value }))} rows={3} placeholder="Log call outcome" className={textAreaClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.logComplaintCallOutcome(id, complaintForm.callOutcome), { stayOnPage: false, successAction: "logCall" })} className="portal-btn">Log Outcome</button>
          </div>
        )}

        {itemType === "complaint" && activeAction === "resolve" && (
          <div className="space-y-3">
            <textarea value={complaintForm.resolutionSummary} onChange={(event) => setComplaintForm((current) => ({ ...current, resolutionSummary: event.target.value }))} rows={3} placeholder="Resolution summary" className={textAreaClass} />
            <input type="file" multiple onChange={(event) => setResolutionFiles(Array.from(event.target.files || []))} className={inputClass} />
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => runAction(async () => workItemsApi.resolveComplaint(id, { resolutionSummary: complaintForm.resolutionSummary, resolutionDocs: await filesToDocuments(resolutionFiles) }), { stayOnPage: false, successAction: "resolve" })}
              className="portal-btn"
            >
              Resolve Complaint
            </button>
          </div>
        )}

        {itemType === "complaint" && activeAction === "escalate" && (
          <div className="space-y-3">
            <textarea value={complaintForm.escalationPurpose} onChange={(event) => setComplaintForm((current) => ({ ...current, escalationPurpose: event.target.value }))} rows={3} placeholder="Escalation purpose" className={textAreaClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.escalateComplaintToMeeting(id, { purpose: complaintForm.escalationPurpose }), { navigateTo: "/cases/meeting/:meetingId", successAction: "escalate" })} className="portal-btn">Create Linked Meeting</button>
          </div>
        )}

        {itemType === "complaint" && activeAction === "close" && (
          <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.closeComplaintCase(id), { stayOnPage: false, successAction: "close" })} className="portal-btn">Close Complaint</button>
        )}

        {itemType === "complaint" && activeAction === "reassign" && (
          <div className="space-y-3">
            <select value={complaintForm.reassignTo} onChange={(event) => setComplaintForm((current) => ({ ...current, reassignTo: event.target.value }))} className={inputClass}>
              <option value="">Select admin</option>
              {admins.filter((admin) => String(admin.id) !== String(item.assignedAdminUserId || "")).map((admin) => <option key={admin.id} value={admin.id}>{admin.name} · {admin.department}</option>)}
            </select>
            <textarea value={complaintForm.reassignReason} onChange={(event) => setComplaintForm((current) => ({ ...current, reassignReason: event.target.value }))} rows={3} placeholder="Why is this being reassigned?" className={textAreaClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.reassignComplaint(id, complaintForm.reassignTo, complaintForm.reassignReason), { stayOnPage: false, successAction: "reassign" })} className="portal-btn">Reassign Complaint</button>
          </div>
        )}

        {itemType === "complaint" && activeAction === "reopen" && (
          <div className="space-y-3">
            <textarea value={complaintForm.reopenReason} onChange={(event) => setComplaintForm((current) => ({ ...current, reopenReason: event.target.value }))} rows={3} placeholder="Why should this complaint be reopened?" className={textAreaClass} />
            <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.reopenComplaint(id, complaintForm.reopenReason), { stayOnPage: false, successAction: "reopen" })} className="portal-btn">Reopen Complaint</button>
          </div>
        )}
      </Section>}
    </div>
  );
}
