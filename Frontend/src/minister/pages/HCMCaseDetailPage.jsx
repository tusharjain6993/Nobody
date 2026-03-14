import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { workItemsApi } from "../ministerApi";
import { filesToDocuments } from "../../utils/fileHelpers";
import { useHCMAuth } from "../HCMAuthContext";

function Section({ title, children }) {
  return (
    <section className="portal-card">
      <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h3>
      {children}
    </section>
  );
}

const inputClass = "portal-input";
const textAreaClass = "portal-textarea";
const actionButtonClass = "portal-btn-secondary";
const primaryButtonClass = "portal-btn";

function getComplaintActions(item, canShowComplaintActions) {
  if (!item.assignedAdminUserId) return [{ value: "assign", label: "Assign to Me" }];
  if (item.status === "resolved") return [{ value: "close", label: "Close Case" }];
  if (item.status === "completed" || !canShowComplaintActions) return [];
  return [
    { value: "department", label: "Save Department Flow" },
    { value: "scheduleCall", label: "Schedule Call" },
    { value: "logCall", label: "Log Call Outcome" },
    { value: "resolve", label: "Resolve Complaint" },
    { value: "escalate", label: "Needs Admin Meeting Escalation" },
  ];
}

function getMeetingActions(item) {
  if (item.status === "verification_needed") {
    return [{ value: "logVerification", label: "Log Verification Outcome" }, { value: "reject", label: "Reject" }];
  }
  if (item.status === "approved" || item.status === "scheduled") {
    return [{ value: "schedule", label: item.status === "scheduled" ? "Update Schedule" : "Schedule Meeting" }];
  }
  if (item.status === "rejected") return [];
  return [
    { value: "approve", label: "Approve" },
    { value: "verification", label: "Verification Needed" },
    { value: "reject", label: "Reject" },
  ];
}

export default function HCMCaseDetailPage() {
  const navigate = useNavigate();
  const { itemType, id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useHCMAuth();
  const [item, setItem] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [meetingReviewNotes, setMeetingReviewNotes] = useState("");
  const [verificationOutcome, setVerificationOutcome] = useState("");
  const [schedule, setSchedule] = useState({ scheduleDate: "", scheduleTime: "", scheduleLocation: "", adminNotes: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [complaintForm, setComplaintForm] = useState({ department: "", officerName: "", officerContact: "", manualContact: "", callScheduledAt: "", callOutcome: "", escalationPurpose: "", resolutionSummary: "" });
  const [resolutionFiles, setResolutionFiles] = useState([]);

  const matchingContacts = useMemo(
    () => contacts.filter((contact) => !complaintForm.department || contact.department === complaintForm.department),
    [contacts, complaintForm.department]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (itemType === "meeting") {
          const res = await workItemsApi.getMeetingRequest(id);
          if (mounted) setItem(res.meetingRequest);
        } else {
          const res = await workItemsApi.getComplaint(id);
          if (mounted) {
            setItem(res.complaint);
            setContacts(res.contacts || []);
            setComplaintForm((current) => ({
              ...current,
              department: res.complaint.department || "",
              officerName: res.complaint.officerName || "",
              officerContact: res.complaint.officerContact || "",
              manualContact: res.complaint.manualContact || "",
              callScheduledAt: res.complaint.callScheduledAt || "",
              callOutcome: res.complaint.callOutcome || "",
              resolutionSummary: res.complaint.resolutionSummary || "",
            }));
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load work item");
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, itemType]);

  const runAction = async (fn) => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fn();
      setItem(res.meetingRequest || res.complaint || item);
      if (res.contacts) setContacts(res.contacts);
      if (res.meetingRequest && itemType === "complaint") {
        navigate(`/cases/meeting/${res.meetingRequest._id}`);
      }
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (!item) {
    return <div className="portal-card">{error || "Loading..."}</div>;
  }

  const complaintAssignedToCurrentAdmin = itemType === "complaint" && Number(item.assignedAdminUserId || 0) === Number(user?.id || 0);
  const complaintUnassigned = itemType === "complaint" && !item.assignedAdminUserId;
  const complaintResolved = itemType === "complaint" && ["resolved", "completed"].includes(item.status);
  const canShowComplaintActions = complaintAssignedToCurrentAdmin && !complaintResolved;
  const canReviewMeeting = itemType === "meeting" && ["submitted", "under_review", "verification_completed", "verification_needed"].includes(item.status);
  const canScheduleMeeting = itemType === "meeting" && ["approved", "scheduled"].includes(item.status);
  const focusedAction = searchParams.get("action") || "";
  const focusedView = !!focusedAction;
  const showComplaintAssignment = itemType === "complaint" && complaintUnassigned && (!focusedView || focusedAction === "assign");
  const showComplaintReadOnly = itemType === "complaint" && !complaintUnassigned && !complaintAssignedToCurrentAdmin && !focusedView;
  const showComplaintResolved = itemType === "complaint" && complaintAssignedToCurrentAdmin && complaintResolved && (!focusedView || focusedAction === "close");
  const showDepartment = canShowComplaintActions && (!focusedView || focusedAction === "department");
  const showScheduleCall = canShowComplaintActions && (!focusedView || focusedAction === "scheduleCall");
  const showLogCall = canShowComplaintActions && (!focusedView || focusedAction === "logCall");
  const showResolve = canShowComplaintActions && (!focusedView || focusedAction === "resolve" || focusedAction === "escalate");
  const showMeetingWorkflow = canReviewMeeting && (!focusedView || focusedAction === "approve" || focusedAction === "verification" || focusedAction === "reject");
  const showMeetingVerificationLog = itemType === "meeting" && item.status === "verification_needed" && (!focusedView || focusedAction === "logVerification");
  const showMeetingSchedule = canScheduleMeeting && (!focusedView || focusedAction === "schedule");
  const availableActions = itemType === "meeting"
    ? getMeetingActions(item)
    : getComplaintActions(item, canShowComplaintActions);

  return (
    <div className="portal-page">
      <div className="portal-toolbar">
        <div>
          <button type="button" onClick={() => navigate(-1)} className="portal-link-btn">← Back</button>
          {focusedView && (
            <button type="button" onClick={() => navigate(`/cases/${itemType}/${id}`)} className="portal-link-btn ml-4">
              View Full Case
            </button>
          )}
        </div>
      </div>
      {error && <div className="portal-alert portal-alert--error">{error}</div>}

      <Section title={itemType === "meeting" ? item.requestId : item.complaintId}>
        <div className="portal-page__eyebrow" style={{ marginBottom: "0.9rem" }}>{itemType === "meeting" ? "Meeting Workflow" : "Complaint Workflow"}</div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div style={{ color: "var(--text-tertiary)" }}>Citizen</div>
            <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.citizenSnapshot?.name}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-tertiary)" }}>Status</div>
            <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.statusLabel}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-tertiary)" }}>{itemType === "meeting" ? "Purpose" : "Complaint"}</div>
            <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{itemType === "meeting" ? item.purpose : item.title}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-tertiary)" }}>Created</div>
            <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{new Date(item.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          {availableActions.length > 0 && (
            <>
              {availableActions.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  onClick={async () => {
                    if (itemType === "complaint" && action.value === "assign") {
                      await runAction(() => workItemsApi.assignComplaintToSelf(id));
                      navigate(`/cases/complaint/${id}`);
                      return;
                    }
                    navigate(`/cases/${itemType}/${id}?action=${action.value}`);
                  }}
                  className={focusedAction === action.value ? primaryButtonClass : actionButtonClass}
                >
                  {action.label}
                </button>
              ))}
              {focusedView && (
                <button type="button" onClick={() => navigate(`/cases/${itemType}/${id}`)} className={actionButtonClass}>
                  Clear Action
                </button>
              )}
            </>
          )}
        </div>
      </Section>

      {itemType === "meeting" ? (
        <>
          {focusedView && showMeetingWorkflow && (
          <Section title="Meeting Workflow">
            <div className="space-y-3">
              {focusedAction === "approve" && (
                <div className="grid md:grid-cols-2 gap-3">
                  <input value={schedule.scheduleDate} onChange={(event) => setSchedule((current) => ({ ...current, scheduleDate: event.target.value }))} type="date" className={inputClass} />
                  <input value={schedule.scheduleTime} onChange={(event) => setSchedule((current) => ({ ...current, scheduleTime: event.target.value }))} type="time" className={inputClass} />
                </div>
              )}
              <textarea value={meetingReviewNotes} onChange={(event) => { setMeetingReviewNotes(event.target.value); setSchedule((current) => ({ ...current, adminNotes: event.target.value })); }} rows={3} placeholder="Admin notes" className={textAreaClass} />
              <div className="flex gap-2 flex-wrap">
                {(!focusedView || focusedAction === "approve") && <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.approveMeetingRequest(id, { scheduleDate: schedule.scheduleDate, scheduleTime: schedule.scheduleTime, adminNotes: meetingReviewNotes }))} className={primaryButtonClass}>Approve</button>}
                {(!focusedView || focusedAction === "verification") && <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.markMeetingVerificationNeeded(id, meetingReviewNotes))} className={actionButtonClass}>Verification Needed</button>}
              </div>
            </div>
          </Section>
          )}

          {focusedView && showMeetingVerificationLog && (
          <Section title="Verification Call">
            <textarea value={verificationOutcome} onChange={(event) => setVerificationOutcome(event.target.value)} rows={3} placeholder="Log verification call outcome" className={textAreaClass} />
            <div className="mt-3">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.logMeetingVerificationOutcome(id, verificationOutcome))} className={primaryButtonClass}>Log Outcome and Return to Review</button>
            </div>
          </Section>
          )}

          {focusedView && showMeetingSchedule && (
          <Section title="Schedule Approved Meeting">
            <div className="grid md:grid-cols-3 gap-3">
              <input value={schedule.scheduleDate} onChange={(event) => setSchedule((current) => ({ ...current, scheduleDate: event.target.value }))} type="date" className={inputClass} />
              <input value={schedule.scheduleTime} onChange={(event) => setSchedule((current) => ({ ...current, scheduleTime: event.target.value }))} type="time" className={inputClass} />
              <input value={schedule.scheduleLocation} onChange={(event) => setSchedule((current) => ({ ...current, scheduleLocation: event.target.value }))} placeholder="Meeting location" className={inputClass} />
            </div>
            <textarea value={schedule.adminNotes} onChange={(event) => setSchedule((current) => ({ ...current, adminNotes: event.target.value }))} rows={3} placeholder="Additional schedule notes" className={`${textAreaClass} mt-3`} />
            <div className="mt-3 flex gap-2 flex-wrap">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.scheduleMeetingRequest(id, schedule))} className={primaryButtonClass}>
                {item.status === "scheduled" ? "Update Schedule" : "Schedule Meeting"}
              </button>
            </div>
            {item.visitorId && <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>Visitor ID: {item.visitorId} · Meeting Docket: {item.meetingDocket}</p>}
          </Section>
          )}

          {focusedView && canReviewMeeting && focusedAction === "reject" && (
          <Section title="Reject Request">
            <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={3} placeholder="Optional reject reason" className={textAreaClass} />
            <div className="mt-3">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.rejectMeetingRequest(id, rejectReason))} className="portal-btn-danger">Reject</button>
            </div>
          </Section>
          )}
        </>
      ) : (
        <>
          {focusedView && showComplaintAssignment && (
            <Section title="Assignment Required">
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>This complaint is still in the common pool. Until you assign it to yourself, only citizen data and the complaint text are visible.</p>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction(() => workItemsApi.assignComplaintToSelf(id))}
                className={primaryButtonClass}
              >
                Assign to Me
              </button>
            </Section>
          )}

          {focusedView && showComplaintReadOnly && (
            <Section title="Read Only">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This complaint is assigned to {item.assignedAdminName}. Workflow controls are only available to the assigned admin.</p>
            </Section>
          )}

          {focusedView && showComplaintResolved && (
            <Section title={item.status === "completed" ? "Completed Case" : "Resolved Case"}>
              <div className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <p>This complaint is now read-only. The citizen has already received the resolved case update.</p>
                {item.resolutionSummary && <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Resolution summary:</span> {item.resolutionSummary}</div>}
                {item.resolutionDocs?.length > 0 && <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Resolution files:</span> {item.resolutionDocs.map((doc) => doc.name).join(", ")}</div>}
                {item.status === "resolved" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => runAction(() => workItemsApi.closeComplaintCase(id))}
                      className={primaryButtonClass}
                    >
                      Close This Case
                    </button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {focusedView && showDepartment && (
          <Section title="Department Contact Flow">
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
            <div className="mt-3">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.updateComplaintDepartment(id, complaintForm))} className={primaryButtonClass}>Save Department Flow</button>
            </div>
          </Section>
          )}

          {focusedView && showScheduleCall && (
          <Section title="Call Scheduling and Outcome">
            <input value={complaintForm.callScheduledAt} onChange={(event) => setComplaintForm((current) => ({ ...current, callScheduledAt: event.target.value }))} type="datetime-local" className={inputClass} />
            <div className="mt-3 flex gap-2 flex-wrap">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.scheduleComplaintCall(id, complaintForm.callScheduledAt))} className={primaryButtonClass}>Schedule Call</button>
            </div>
          </Section>
          )}

          {focusedView && showLogCall && (
          <Section title="Log Call Outcome">
            <textarea value={complaintForm.callOutcome} onChange={(event) => setComplaintForm((current) => ({ ...current, callOutcome: event.target.value }))} rows={3} placeholder="Log call outcome" className={textAreaClass} />
            <div className="mt-3">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.logComplaintCallOutcome(id, complaintForm.callOutcome))} className={primaryButtonClass}>Log Call Outcome</button>
            </div>
          </Section>
          )}

          {focusedView && showResolve && (
          <Section title="Resolve or Escalate">
            {(!focusedView || focusedAction === "resolve") && (
              <>
                <textarea value={complaintForm.resolutionSummary} onChange={(event) => setComplaintForm((current) => ({ ...current, resolutionSummary: event.target.value }))} rows={3} placeholder="Resolution reason / summary" className={`${textAreaClass} mb-3`} />
                <input type="file" multiple onChange={(event) => setResolutionFiles(Array.from(event.target.files || []))} className={inputClass} />
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runAction(async () => workItemsApi.resolveComplaint(id, { resolutionSummary: complaintForm.resolutionSummary, resolutionDocs: await filesToDocuments(resolutionFiles) }))}
                    className={primaryButtonClass}
                  >
                    Resolve Complaint
                  </button>
                </div>
              </>
            )}
            {(!focusedView || focusedAction === "escalate") && (
              <>
                <textarea value={complaintForm.escalationPurpose} onChange={(event) => setComplaintForm((current) => ({ ...current, escalationPurpose: event.target.value }))} rows={3} placeholder="Purpose for admin meeting escalation" className={`${textAreaClass} mt-3`} />
                <div className="mt-3">
                  <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.escalateComplaintToMeeting(id, { purpose: complaintForm.escalationPurpose }))} className={primaryButtonClass}>Needs Admin Meeting Escalation</button>
                </div>
              </>
            )}
          </Section>
          )}
        </>
      )}

      {!focusedView && <Section title="Activity Log">
        <div className="space-y-2">
          {(item.logs || []).map((log) => (
            <div key={log._id} className="pb-2" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{log.action}</div>
              {log.notes && <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{log.notes}</div>}
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{log.createdByName} · {new Date(log.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Section>}
    </div>
  );
}
