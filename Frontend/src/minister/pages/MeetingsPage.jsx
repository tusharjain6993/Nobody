import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useHCMAuth } from "../HCMAuthContext";
import { calendarApi, meetingsApi } from "../ministerApi";
import { filesToDocuments } from "../../utils/fileHelpers";
import { downloadMeetingPassPdf } from "../../utils/meetingPass";
import { downloadCaseSummaryPdf } from "../../utils/caseSummary";

const inputClass = "text-[0.78rem] px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none";

function statusBadgeClass(status) {
  if (status === "scheduled") return "bg-emerald-100 text-emerald-700";
  if (status === "approved") return "bg-sky-100 text-sky-700";
  if (status === "verification_needed") return "bg-amber-100 text-amber-700";
  if (status === "verification_completed") return "bg-cyan-100 text-cyan-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function getCitizenFacingStatusLabel(meeting) {
  if (!meeting) return "";
  if (["verification_needed", "approved", "under_review"].includes(meeting.status)) {
    return "Under Review";
  }
  return meeting.statusLabel;
}

const VERIFICATION_PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function getVerificationPriorityRank(priority = "") {
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return order[String(priority || "").toUpperCase()] ?? 4;
}

function getPriorityChip(priority = "") {
  const value = String(priority || "").toUpperCase();
  if (!value) return null;
  return `${value.charAt(0)}${value.slice(1).toLowerCase()} Priority`;
}

function SuccessModal({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4" style={{ background: "rgba(15, 23, 42, 0.58)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-[30px] border p-6 text-center shadow-2xl" style={{ background: "linear-gradient(180deg, var(--bg-primary), color-mix(in srgb, var(--bg-primary) 82%, var(--accent-primary-subtle) 18%))", borderColor: "var(--border-primary)" }}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", color: "#fff", fontSize: "1.75rem", boxShadow: "var(--shadow-card)" }}>✓</div>
        <div className="portal-page__eyebrow" style={{ justifyContent: "center", marginBottom: "0.7rem" }}>Verification Updated</div>
        <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{message}</p>
        <button type="button" onClick={onClose} className="portal-btn mt-5 w-full">Continue</button>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const { user } = useHCMAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { meetingId = "" } = useParams();
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verificationNotes, setVerificationNotes] = useState({});
  const [verificationSuccess, setVerificationSuccess] = useState({ open: false, title: "", message: "" });
  const [verificationSearch, setVerificationSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    details: "",
    eventType: "Invited Event",
    scheduleAt: "",
    endAt: "",
    mediaFolder: "",
    videoLink: "",
    department: "",
    participationRole: "Attendee",
    portfolio: "Neither",
  });
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const routePriority = String(searchParams.get("priority") || "").toUpperCase();
  const activeVerificationPriority = VERIFICATION_PRIORITY_OPTIONS.includes(routePriority) ? routePriority : "";
  const filteredVerificationRequests = [...verificationRequests]
    .filter((request) => !activeVerificationPriority || String(request.priority || "").toUpperCase() === activeVerificationPriority)
    .filter((request) => {
      const q = verificationSearch.trim().toLowerCase();
      if (!q) return true;
      const haystack = [
        request.requestId,
        request.purpose,
        request.adminNotes,
        request.currentOwner,
        request.referralAdminName,
        request.relatedComplaint?.complaintId,
        request.citizenSnapshot?.name,
        request.citizenSnapshot?.citizenId,
        ...(request.citizenSnapshot?.phoneNumbers || []),
        request.citizenRecord?.name,
        request.citizenRecord?.citizenId,
        request.citizenRecord?.aadhaar,
        ...(request.citizenRecord?.phoneNumbers || []),
        request.citizenRecord?.age,
        request.citizenRecord?.gender,
        request.citizenRecord?.city,
        request.citizenRecord?.state,
        request.citizenRecord?.pinCode,
        request.citizenRecord?.mpName,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    })
    .sort((left, right) => {
      const priorityGap = getVerificationPriorityRank(left.priority) - getVerificationPriorityRank(right.priority);
      if (priorityGap !== 0) return priorityGap;
      return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
    });

  const getCitizenSafeTimeline = (entries = []) => entries.filter((entry) => {
    const text = `${entry.action || ""} ${entry.notes || ""}`.toLowerCase();
    return !text.includes("verification");
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        if (user?.role === "deo") {
          const res = await calendarApi.list();
          const verificationRes = await meetingsApi.list();
          if (mounted) {
            setEvents(res.events || []);
            setVerificationRequests(verificationRes.verificationRequests || []);
          }
        } else {
          const res = await meetingsApi.list();
          if (mounted) setMeetings(res.meetings || []);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load items");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user?.role]);

  if (user?.role === "citizen") {
    const citizenMeetings = [...meetings].sort((left, right) => {
      const leftDate = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightDate = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightDate - leftDate;
    });
    const selectedMeeting = meetingId
      ? citizenMeetings.find((meeting) => String(meeting._id) === String(meetingId)) || null
      : null;

    if (meetingId) {
      return (
        <div className="portal-page">
          <div className="portal-toolbar">
            <button type="button" onClick={() => navigate("/meetings")} className="portal-link-btn">← Back to My Meetings</button>
          </div>

          {loading ? (
            <div className="portal-card portal-empty">Loading meeting details…</div>
          ) : error ? (
            <div className="portal-alert portal-alert--error">{error}</div>
          ) : !selectedMeeting ? (
            <div className="portal-card portal-empty">Meeting request not found.</div>
          ) : (
            <div className="portal-card space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <div className="portal-page__eyebrow">{selectedMeeting.requestId}</div>
                  <h1 className="text-2xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>{selectedMeeting.purpose}</h1>
                  <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                    This page shows the latest admin processing for your meeting request and gives you the meeting pass once scheduled.
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadgeClass(selectedMeeting.status)}`}>
                  {getCitizenFacingStatusLabel(selectedMeeting)}
                </span>
              </div>

              <div className="portal-grid portal-grid--3">
                <div className="portal-card portal-card--soft">
                  <div className="portal-stat__label">Admin Desk</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {selectedMeeting.assignedAdminName || selectedMeeting.referralAdminName || "General Admin Pool"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    Referral: {selectedMeeting.referralAdminName || "Not specified"}
                  </div>
                </div>
                <div className="portal-card portal-card--soft">
                  <div className="portal-stat__label">Meeting Schedule</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {selectedMeeting.scheduleDate ? `${selectedMeeting.scheduleDate} ${selectedMeeting.scheduleTime || ""}` : "Pending admin scheduling"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {selectedMeeting.scheduleLocation || "Location not set yet"}
                  </div>
                </div>
                <div className="portal-card portal-card--soft">
                  <div className="portal-stat__label">Meeting Access</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Visitor ID: {selectedMeeting.visitorId || "Pending"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    Docket: {selectedMeeting.meetingDocket || "Pending"}
                  </div>
                </div>
              </div>

              <div className="portal-grid portal-grid--3">
                <div className="portal-card portal-card--soft">
                  <div className="portal-stat__label">Current Owner</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selectedMeeting.currentOwner}</div>
                </div>
                <div className="portal-card portal-card--soft">
                  <div className="portal-stat__label">Citizen Contact</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {selectedMeeting.citizenSnapshot?.name || "Citizen"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {selectedMeeting.citizenSnapshot?.phoneNumbers?.[0] || "Phone unavailable"}
                  </div>
                </div>
                <div className="portal-card portal-card--soft">
                  <div className="portal-stat__label">Linked Complaint</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {selectedMeeting.relatedComplaint?.complaintId || "No linked complaint"}
                  </div>
                </div>
              </div>

              <div className="portal-card">
                <div className="portal-stat__label">Admin Notes</div>
                <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {selectedMeeting.adminNotes || "No admin notes added yet."}
                </div>
              </div>

              {selectedMeeting.rejectReason && (
                <div className="portal-alert portal-alert--error">
                  Rejection Note: {selectedMeeting.rejectReason}
                </div>
              )}

              <div className="portal-card">
                <div className="portal-stat__label">Meeting Pass PDF</div>
                <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {selectedMeeting.status === "scheduled"
                    ? "This meeting is scheduled. Download the PDF pass containing the meeting details and QR verification code."
                    : "The PDF pass becomes available after the admin schedules the meeting."}
                </div>
                <button
                  type="button"
                  disabled={selectedMeeting.status !== "scheduled"}
                  onClick={async () => {
                    try {
                      setError("");
                      await downloadMeetingPassPdf(selectedMeeting);
                    } catch (err) {
                      setError(err.message || "Unable to download the meeting pass PDF.");
                    }
                  }}
                  className={`mt-4 ${selectedMeeting.status === "scheduled" ? "portal-btn" : "portal-btn-secondary opacity-60 cursor-not-allowed"}`}
                >
                  Download Meeting Pass PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadCaseSummaryPdf({
                    filename: `${selectedMeeting.requestId}-summary.pdf`,
                    title: `${selectedMeeting.requestId} Summary`,
                    rows: [
                      ["Request ID", selectedMeeting.requestId],
                      ["Citizen", selectedMeeting.citizenSnapshot?.name],
                      ["Phone", selectedMeeting.citizenSnapshot?.phoneNumbers?.[0] || ""],
                      ["Status", getCitizenFacingStatusLabel(selectedMeeting)],
                      ["Owner", selectedMeeting.currentOwner],
                    ],
                    timeline: getCitizenSafeTimeline(selectedMeeting.masterTimeline || []),
                  })}
                  className="mt-4 ml-3 portal-btn-secondary"
                >
                  Download Case Summary
                </button>
              </div>

              <div className="portal-card">
                <div className="portal-stat__label">Master Timeline</div>
                <div className="space-y-3 mt-3">
                  {getCitizenSafeTimeline(selectedMeeting.masterTimeline || []).map((entry) => (
                    <div key={`${entry.sourceLabel}-${entry._id}`} className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border-secondary)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{entry.action}</div>
                        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{new Date(entry.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{entry.sourceLabel} · {entry.createdByName}</div>
                      {entry.notes && <div className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{entry.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="portal-card">
                <div className="portal-stat__label">Files Shared With Request</div>
                <div className="mt-3">
                  {selectedMeeting.attachments?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedMeeting.attachments.map((file, index) => (
                        <a
                          key={`${file.name || "file"}-${index}`}
                          href={file.data || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="portal-btn-secondary"
                        >
                          {file.name || `Attachment ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No documents were attached with this meeting request.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-6 max-w-[1320px] mx-auto space-y-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">My Meetings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Track every meeting request here. Any review, rejection, schedule, visitor ID, docket, and admin note update is reflected on this page.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total requests: <span className="font-semibold text-slate-700 dark:text-slate-200">{citizenMeetings.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-8 text-center">Loading meetings…</div>
        ) : citizenMeetings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">You have not submitted any meeting requests yet.</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                    <tr className="text-[0.68rem] tracking-[0.16em] text-slate-500 dark:text-slate-400 uppercase">
                      <th className="px-4 py-4 text-left">Task ID</th>
                      <th className="px-4 py-4 text-left">Subject</th>
                      <th className="px-4 py-4 text-left">Department</th>
                      <th className="px-4 py-4 text-left">Status</th>
                      <th className="px-4 py-4 text-left">Holder</th>
                      <th className="px-4 py-4 text-left">Officer</th>
                      <th className="px-4 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citizenMeetings.map((meeting) => {
                      return (
                        <tr key={meeting._id} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0 bg-white dark:bg-slate-900">
                          <td className="px-4 py-4 align-top text-[0.76rem] font-semibold text-slate-500 dark:text-slate-400">{meeting.requestId}</td>
                          <td className="px-4 py-4 align-top">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{meeting.purpose}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {meeting.scheduleLocation || meeting.adminNotes || "Awaiting admin update"}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-slate-600 dark:text-slate-300">
                            {meeting.referralAdminName || meeting.assignedAdminName || "General Admin Pool"}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.72rem] font-semibold ${statusBadgeClass(meeting.status)}`}>
                              {getCitizenFacingStatusLabel(meeting)}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top text-slate-600 dark:text-slate-300">Admin</td>
                          <td className="px-4 py-4 align-top text-slate-600 dark:text-slate-300">
                            {meeting.assignedAdminName || meeting.referralAdminName || "To be assigned"}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <button
                              type="button"
                              onClick={() => navigate(`/meetings/${meeting._id}`)}
                              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 text-[0.76rem] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden p-4 space-y-3">
                {citizenMeetings.map((meeting) => (
                  <div key={meeting._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[0.68rem] tracking-[0.16em] uppercase text-slate-400 dark:text-slate-500">{meeting.requestId}</div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{meeting.purpose}</div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.72rem] font-semibold ${statusBadgeClass(meeting.status)}`}>
                        {getCitizenFacingStatusLabel(meeting)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400 mt-4">
                      <div>
                        <div className="uppercase tracking-[0.12em] text-[0.62rem]">Admin Desk</div>
                        <div className="mt-1 text-slate-700 dark:text-slate-200">{meeting.referralAdminName || meeting.assignedAdminName || "General Admin Pool"}</div>
                      </div>
                      <div>
                        <div className="uppercase tracking-[0.12em] text-[0.62rem]">Schedule</div>
                        <div className="mt-1 text-slate-700 dark:text-slate-200">{meeting.scheduleDate ? `${meeting.scheduleDate} ${meeting.scheduleTime || ""}` : "Pending"}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/meetings/${meeting._id}`)}
                      className="mt-4 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 text-[0.76rem] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
                <div>Showing 1-{citizenMeetings.length} of {citizenMeetings.length} meeting requests</div>
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <span className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">10</span>
                </div>
              </div>
            </div>

	          </>
	        )}
	      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-5">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Scheduled Meetings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">Only meetings that have been approved and scheduled appear here. Pending requests stay in the work queue.</p>
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500 py-8 text-center">Loading meetings…</div>
        ) : meetings.filter((meeting) => meeting.status === "scheduled").length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3d p-8 text-center">
            <p className="text-slate-400 text-sm">No meetings scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.filter((meeting) => meeting.status === "scheduled").map((meeting) => (
              <div key={meeting._id} className="bg-white rounded-2xl border border-slate-100 shadow-3d p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[0.68rem] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold inline-block mb-2">{meeting.requestId}</div>
                    <h3 className="font-bold text-slate-900 text-sm">{meeting.purpose}</h3>
                    <div className="text-xs text-slate-500 mt-1">{meeting.citizenSnapshot?.name} · {meeting.citizenSnapshot?.phoneNumbers?.[0] || "Phone unavailable"} · Referral: {meeting.referralAdminName}</div>
                    {meeting.scheduleDate && <div className="text-xs text-slate-500 mt-1">{meeting.scheduleDate} · {meeting.scheduleTime} · {meeting.scheduleLocation}</div>}
                    {(meeting.visitorId || meeting.meetingDocket) && <div className="text-xs text-slate-400 mt-1">Visitor ID: {meeting.visitorId || "Pending"} · Docket: {meeting.meetingDocket || "Pending"} · {meeting.priority === "VIP" || meeting.priority === "HIGH" ? "VIP Meeting" : "Standard Meeting"}</div>}
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-emerald-100 text-emerald-700">{meeting.statusLabel}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const createEvent = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const photoDocs = await filesToDocuments(photos);
      const documentDocs = await filesToDocuments(documents);
      const res = await calendarApi.create({ ...form, photos: photoDocs, documents: documentDocs });
      setEvents((current) => [res.event, ...current]);
      setForm({
        title: "",
        details: "",
        eventType: "Invited Event",
        scheduleAt: "",
        endAt: "",
        mediaFolder: "",
        videoLink: "",
        department: "",
        participationRole: "Attendee",
        portfolio: "Neither",
      });
      setPhotos([]);
      setDocuments([]);
    } catch (err) {
      setError(err.message || "Failed to create event");
    }
  };

  const markAttended = async (id) => {
    try {
      const res = await calendarApi.markAttended(id);
      setEvents((current) => current.map((row) => (row._id === String(id) ? res.event : row)));
    } catch (err) {
      setError(err.message || "Failed to mark attended");
    }
  };

  return (
    <div className="p-6 max-w-[1240px] mx-auto space-y-5">
      <SuccessModal
        open={verificationSuccess.open}
        title={verificationSuccess.title}
        message={verificationSuccess.message}
        onClose={() => setVerificationSuccess({ open: false, title: "", message: "" })}
      />
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
          {location.pathname === "/verification-requests" ? "Verification Requests" : "Calendar & Engagement"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
          {location.pathname === "/verification-requests"
            ? "Handle citizen verification requests raised by admins. Once updated here, the request goes back to the admin queue."
            : "Create invited events or scheduled office meetings, attach media references, and feed attended events into classification and productivity scoring."}
        </p>
      </div>
      {error && <div className="px-3 py-2 rounded-lg text-xs bg-red-50 text-red-600 border border-red-100">{error}</div>}

      <div className="portal-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="portal-page__eyebrow">DEO Desk</div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{getPriorityChip(activeVerificationPriority) || "Verification Requests"}</h2>
          </div>
          <span className="portal-chip">{filteredVerificationRequests.length} open</span>
        </div>
        <div className="mb-4">
          <input
            value={verificationSearch}
            onChange={(event) => setVerificationSearch(event.target.value)}
            placeholder="Search request ID, citizen ID, Aadhaar, phone, name, complaint ID..."
            className="portal-input"
          />
        </div>
        {!filteredVerificationRequests.length ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No verification requests are waiting with DEO.</p>
        ) : (
          <div className="space-y-3">
            {filteredVerificationRequests.map((request) => (
              <div key={request._id} className="portal-card portal-card--soft">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="portal-chip">{request.requestId}</span>
                      {getPriorityChip(request.priority) && <span className="portal-chip">{getPriorityChip(request.priority)}</span>}
                      {request.priority === "VIP" && <span className="portal-chip">VIP Meeting</span>}
                    </div>
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{request.purpose}</div>
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {request.citizenSnapshot?.name || "Citizen"} · {request.citizenSnapshot?.citizenId || "Citizen ID unavailable"} · {request.citizenSnapshot?.phoneNumbers?.[0] || "Phone unavailable"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{request.adminNotes || "Admin has requested a verification call."}</div>
                    <div className="portal-grid portal-grid--3" style={{ marginTop: "0.85rem" }}>
                      <div className="portal-card portal-card--soft">
                        <div className="portal-stat__label">Citizen Profile</div>
                        <div className="mt-2 text-sm" style={{ color: "var(--text-primary)" }}>{request.citizenRecord?.name || request.citizenSnapshot?.name || "Citizen"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Citizen ID: {request.citizenRecord?.citizenId || request.citizenSnapshot?.citizenId || "Unavailable"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Aadhaar: {request.citizenRecord?.aadhaar || request.citizenSnapshot?.aadhaar || "Unavailable"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Phone: {(request.citizenRecord?.phoneNumbers || request.citizenSnapshot?.phoneNumbers || []).join(", ") || "Unavailable"}</div>
                      </div>
                      <div className="portal-card portal-card--soft">
                        <div className="portal-stat__label">Address & Identity</div>
                        <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>Age: {request.citizenRecord?.age || request.citizenSnapshot?.age || "Unavailable"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Gender: {request.citizenRecord?.gender || request.citizenSnapshot?.gender || "Unavailable"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>City / State: {[request.citizenRecord?.city || request.citizenSnapshot?.city, request.citizenRecord?.state || request.citizenSnapshot?.state].filter(Boolean).join(", ") || "Unavailable"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>PIN: {request.citizenRecord?.pinCode || request.citizenSnapshot?.pinCode || "Unavailable"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>MP: {request.citizenRecord?.mpName || request.citizenSnapshot?.mpName || "Unavailable"}</div>
                      </div>
                      <div className="portal-card portal-card--soft">
                        <div className="portal-stat__label">Case Context</div>
                        <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>Current owner: {request.currentOwner}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Referral admin: {request.referralAdminName || "Not specified"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Submitted: {request.createdAt ? new Date(request.createdAt).toLocaleString() : "Unavailable"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Linked complaint: {request.relatedComplaint?.complaintId || "No linked complaint"}</div>
                      </div>
                    </div>
                    {!!request.attachments?.length && (
                      <div style={{ marginTop: "0.85rem" }}>
                        <div className="portal-stat__label" style={{ marginBottom: "0.4rem" }}>Citizen Attachments</div>
                        <div className="flex flex-wrap gap-2">
                          {request.attachments.map((file, index) => (
                            <a
                              key={`${file.name || "file"}-${index}`}
                              href={file.data || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="portal-btn-secondary"
                            >
                              {file.name || `Attachment ${index + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-[420px] space-y-3">
                    <textarea
                      value={verificationNotes[request._id] || ""}
                      onChange={(event) => setVerificationNotes((current) => ({ ...current, [request._id]: event.target.value }))}
                      rows={3}
                      className="portal-textarea"
                      placeholder="Log verification outcome after speaking with the citizen"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setError("");
                          const res = await meetingsApi.logVerificationOutcome(request._id, verificationNotes[request._id] || "");
                          setVerificationRequests((current) => current.filter((item) => item._id !== request._id));
                          setMeetings((current) => current.map((item) => (item._id === request._id ? res.meetingRequest : item)));
                          setVerificationNotes((current) => ({ ...current, [request._id]: "" }));
                          setVerificationSuccess({
                            open: true,
                            title: "Request Sent to Admin",
                            message: `${request.requestId} has been verified and sent back to the admin for further action.`,
                          });
                        } catch (err) {
                          setError(err.message || "Failed to update verification");
                        }
                      }}
                      className="portal-btn"
                    >
                      Save Verification Log
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {location.pathname !== "/verification-requests" && (
      <form onSubmit={createEvent} className="bg-white rounded-2xl border border-slate-100 shadow-3d p-4 grid md:grid-cols-2 gap-3">
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Event title" className={inputClass} />
        <select value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))} className={inputClass}>
          <option>Invited Event</option>
          <option>Scheduled Meeting</option>
          <option>VIP Meeting</option>
        </select>
        <textarea value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} placeholder="Event details" className={`${inputClass} md:col-span-2 min-h-28`} />
        <input type="datetime-local" value={form.scheduleAt} onChange={(event) => setForm((current) => ({ ...current, scheduleAt: event.target.value }))} className={inputClass} />
        <input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className={inputClass} />
        <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="Department" className={inputClass} />
        <input value={form.mediaFolder} onChange={(event) => setForm((current) => ({ ...current, mediaFolder: event.target.value }))} placeholder="Media folder reference" className={inputClass} />
        <input value={form.videoLink} onChange={(event) => setForm((current) => ({ ...current, videoLink: event.target.value }))} placeholder="Video repository link" className={inputClass} />
        <select value={form.participationRole} onChange={(event) => setForm((current) => ({ ...current, participationRole: event.target.value }))} className={inputClass}>
          <option>Chair</option>
          <option>Speaker</option>
          <option>Attendee</option>
        </select>
        <select value={form.portfolio} onChange={(event) => setForm((current) => ({ ...current, portfolio: event.target.value }))} className={inputClass}>
          <option>Culture</option>
          <option>Tourism</option>
          <option>Both</option>
          <option>Neither</option>
        </select>
        <input type="file" multiple accept=".png,.jpg,.jpeg,.webp" onChange={(event) => setPhotos(Array.from(event.target.files || []))} className={`${inputClass} md:col-span-2`} />
        <input type="file" multiple onChange={(event) => setDocuments(Array.from(event.target.files || []))} className={`${inputClass} md:col-span-2`} />
        <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm md:col-span-2">Create Calendar Entry</button>
      </form>
      )}

      {location.pathname !== "/verification-requests" && (loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading calendar…</div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event._id} className="bg-white rounded-2xl border border-slate-100 shadow-3d p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold inline-block mb-2">{event.eventType}</div>
                  <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                  <div className="text-xs text-slate-500 mt-1">{new Date(event.scheduleAt).toLocaleString()} · {event.department || "No department set"}</div>
                  <div className="text-xs text-slate-400 mt-1">Media folder: {event.mediaFolder || "N/A"} · Photos: {event.photos.length} · Files: {(event.documents || []).length} · Video: {event.videoLink || "N/A"}</div>
                  <div className="text-xs text-slate-400 mt-1">Classification: {event.classification || "Pending attendance"} · Score: {event.productivityScore || 0}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-slate-100 text-slate-700">{event.attendanceStatus}</span>
                  {event.attendanceStatus !== "attended" && (
                    <button type="button" onClick={() => markAttended(event._id)} className="px-3 py-1.5 text-[0.78rem] rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-medium">
                      Mark Attended
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
