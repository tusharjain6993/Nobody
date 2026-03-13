import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { workItemsApi } from "../ministerApi";
import { filesToDocuments } from "../../utils/fileHelpers";
import { useHCMAuth } from "../HCMAuthContext";

function Section({ title, children }) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/60 dark:border-slate-700/60 shadow-3d p-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">{title}</h3>
      {children}
    </section>
  );
}

const inputClass = "w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";

export default function HCMCaseDetailPage() {
  const navigate = useNavigate();
  const { itemType, id } = useParams();
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
    return <div className="p-6">{error || "Loading..."}</div>;
  }

  const complaintAssignedToCurrentAdmin = itemType === "complaint" && Number(item.assignedAdminUserId || 0) === Number(user?.id || 0);
  const complaintUnassigned = itemType === "complaint" && !item.assignedAdminUserId;
  const complaintResolved = itemType === "complaint" && ["resolved", "completed"].includes(item.status);
  const canShowComplaintActions = complaintAssignedToCurrentAdmin && !complaintResolved;
  const canReviewMeeting = itemType === "meeting" && ["submitted", "under_review", "verification_completed", "verification_needed"].includes(item.status);
  const canScheduleMeeting = itemType === "meeting" && ["approved", "scheduled"].includes(item.status);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-transparent border-0 p-0">
        ← Back
      </button>
      {error && <div className="px-3 py-2 rounded-lg text-xs bg-red-50 text-red-600 border border-red-100">{error}</div>}

      <Section title={itemType === "meeting" ? item.requestId : item.complaintId}>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-500">Citizen</div>
            <div className="font-semibold text-slate-900">{item.citizenSnapshot?.name}</div>
          </div>
          <div>
            <div className="text-slate-500">Status</div>
            <div className="font-semibold text-slate-900">{item.statusLabel}</div>
          </div>
          <div>
            <div className="text-slate-500">{itemType === "meeting" ? "Purpose" : "Complaint"}</div>
            <div className="font-semibold text-slate-900">{itemType === "meeting" ? item.purpose : item.title}</div>
          </div>
          <div>
            <div className="text-slate-500">Created</div>
            <div className="font-semibold text-slate-900">{new Date(item.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </Section>

      {itemType === "meeting" ? (
        <>
          {canReviewMeeting && (
          <Section title="Meeting Workflow">
            <div className="space-y-3">
              <textarea value={meetingReviewNotes} onChange={(event) => setMeetingReviewNotes(event.target.value)} rows={3} placeholder="Admin notes" className={inputClass} />
              <div className="flex gap-2 flex-wrap">
                <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.approveMeetingRequest(id, meetingReviewNotes))} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm">Approve</button>
                <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.markMeetingVerificationNeeded(id, meetingReviewNotes))} className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-sm">Verification Needed</button>
              </div>
            </div>
          </Section>
          )}

          {item.status === "verification_needed" && (
          <Section title="Verification Call">
            <textarea value={verificationOutcome} onChange={(event) => setVerificationOutcome(event.target.value)} rows={3} placeholder="Log verification call outcome" className={inputClass} />
            <div className="mt-3">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.logMeetingVerificationOutcome(id, verificationOutcome))} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm">Log Outcome and Return to Review</button>
            </div>
          </Section>
          )}

          {canScheduleMeeting && (
          <Section title="Schedule Approved Meeting">
            <div className="grid md:grid-cols-3 gap-3">
              <input value={schedule.scheduleDate} onChange={(event) => setSchedule((current) => ({ ...current, scheduleDate: event.target.value }))} type="date" className={inputClass} />
              <input value={schedule.scheduleTime} onChange={(event) => setSchedule((current) => ({ ...current, scheduleTime: event.target.value }))} type="time" className={inputClass} />
              <input value={schedule.scheduleLocation} onChange={(event) => setSchedule((current) => ({ ...current, scheduleLocation: event.target.value }))} placeholder="Meeting location" className={inputClass} />
            </div>
            <textarea value={schedule.adminNotes} onChange={(event) => setSchedule((current) => ({ ...current, adminNotes: event.target.value }))} rows={3} placeholder="Additional schedule notes" className={`${inputClass} mt-3`} />
            <div className="mt-3 flex gap-2 flex-wrap">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.scheduleMeetingRequest(id, schedule))} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm">
                {item.status === "scheduled" ? "Update Schedule" : "Schedule Meeting"}
              </button>
            </div>
            {item.visitorId && <p className="mt-3 text-sm text-slate-600">Visitor ID: {item.visitorId} · Meeting Docket: {item.meetingDocket}</p>}
          </Section>
          )}

          {canReviewMeeting && (
          <Section title="Reject Request">
            <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={3} placeholder="Reject reason is mandatory" className={inputClass} />
            <div className="mt-3">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.rejectMeetingRequest(id, rejectReason))} className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-sm">Reject</button>
            </div>
          </Section>
          )}
        </>
      ) : (
        <>
          {complaintUnassigned && (
            <Section title="Assignment Required">
              <p className="text-sm text-slate-600 mb-3">This complaint is still in the common pool. Until you assign it to yourself, only citizen data and the complaint text are visible.</p>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction(() => workItemsApi.assignComplaintToSelf(id))}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm"
              >
                Assign to Me
              </button>
            </Section>
          )}

          {!complaintUnassigned && !complaintAssignedToCurrentAdmin && (
            <Section title="Read Only">
              <p className="text-sm text-slate-600">This complaint is assigned to {item.assignedAdminName}. Workflow controls are only available to the assigned admin.</p>
            </Section>
          )}

          {complaintAssignedToCurrentAdmin && complaintResolved && (
            <Section title={item.status === "completed" ? "Completed Case" : "Resolved Case"}>
              <div className="space-y-3 text-sm text-slate-600">
                <p>This complaint is now read-only. The citizen has already received the resolved case update.</p>
                {item.resolutionSummary && <div><span className="font-semibold text-slate-900">Resolution summary:</span> {item.resolutionSummary}</div>}
                {item.resolutionDocs?.length > 0 && <div><span className="font-semibold text-slate-900">Resolution files:</span> {item.resolutionDocs.map((doc) => doc.name).join(", ")}</div>}
                {item.status === "resolved" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => runAction(() => workItemsApi.closeComplaintCase(id))}
                      className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-sm"
                    >
                      Close This Case
                    </button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {canShowComplaintActions && (
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
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.updateComplaintDepartment(id, complaintForm))} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm">Save Department Flow</button>
            </div>
          </Section>
          )}

          {canShowComplaintActions && (
          <Section title="Call Scheduling and Outcome">
            <input value={complaintForm.callScheduledAt} onChange={(event) => setComplaintForm((current) => ({ ...current, callScheduledAt: event.target.value }))} type="datetime-local" className={inputClass} />
            <div className="mt-3 flex gap-2 flex-wrap">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.scheduleComplaintCall(id, complaintForm.callScheduledAt))} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm">Schedule Call</button>
            </div>
            <textarea value={complaintForm.callOutcome} onChange={(event) => setComplaintForm((current) => ({ ...current, callOutcome: event.target.value }))} rows={3} placeholder="Log call outcome" className={`${inputClass} mt-3`} />
            <div className="mt-3">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.logComplaintCallOutcome(id, complaintForm.callOutcome))} className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-sm">Log Call Outcome</button>
            </div>
          </Section>
          )}

          {canShowComplaintActions && (
          <Section title="Resolve or Escalate">
            <textarea value={complaintForm.resolutionSummary} onChange={(event) => setComplaintForm((current) => ({ ...current, resolutionSummary: event.target.value }))} rows={3} placeholder="Resolution reason / summary" className={`${inputClass} mb-3`} />
            <input type="file" multiple onChange={(event) => setResolutionFiles(Array.from(event.target.files || []))} className={inputClass} />
            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction(async () => workItemsApi.resolveComplaint(id, { resolutionSummary: complaintForm.resolutionSummary, resolutionDocs: await filesToDocuments(resolutionFiles) }))}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm"
              >
                Resolve Complaint
              </button>
            </div>
            <textarea value={complaintForm.escalationPurpose} onChange={(event) => setComplaintForm((current) => ({ ...current, escalationPurpose: event.target.value }))} rows={3} placeholder="Purpose for admin meeting escalation" className={`${inputClass} mt-3`} />
            <div className="mt-3">
              <button type="button" disabled={actionLoading} onClick={() => runAction(() => workItemsApi.escalateComplaintToMeeting(id, { purpose: complaintForm.escalationPurpose }))} className="px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold text-sm">Needs Admin Meeting Escalation</button>
            </div>
          </Section>
          )}
        </>
      )}

      <Section title="Activity Log">
        <div className="space-y-2">
          {(item.logs || []).map((log) => (
            <div key={log._id} className="border-b border-slate-100 pb-2">
              <div className="text-sm font-semibold text-slate-900">{log.action}</div>
              {log.notes && <div className="text-sm text-slate-600">{log.notes}</div>}
              <div className="text-xs text-slate-400">{log.createdByName} · {new Date(log.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
