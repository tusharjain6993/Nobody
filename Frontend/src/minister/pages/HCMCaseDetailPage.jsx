import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { casesApi, assignmentsApi, communicationsApi, authorityApi } from "../ministerApi";
import { MOC_ORG_DIRECTORY, ASSIGNMENT_TYPES, TIME_SLOTS } from "../../constants/mocWhoIsWho";

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const TASK_STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  AWAITING_RESPONSE: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CLOSED: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const COMM_ICONS = { CALL: "📞", LETTER: "📄", EMAIL: "📧", MEETING_NOTE: "📝" };

function Chip({ label, colorClass }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold ${colorClass}`}>
      {label}
    </span>
  );
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
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-600/60 rounded-xl p-5 mb-4 shadow-3d ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-slate-900 dark:text-slate-100 font-semibold mb-3">{children}</h3>;
}

export default function HCMCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "", slot: "", type: "", venue: "" });
  const [completeForm, setCompleteForm] = useState({ meetingSummary: "", actionRequired: "", responsibleAuthority: "" });

  const [assignForm, setAssignForm] = useState({
    title: "",
    assignedToName: "",
    assignedDepartment: "",
    assignType: "",
    priority: "MEDIUM",
    dueDate: "",
    dueSlot: "",
  });
  const [commForm, setCommForm] = useState({ type: "CALL", summary: "", happenedAt: "" });
  const [suggestions, setSuggestions] = useState(null);

  const [activeTab, setActiveTab] = useState("details");

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
    if (caseData?.category) {
      authorityApi.suggestions({ category: caseData.category, state: caseData.state }).then(setSuggestions).catch(() => {});
    }
  }, [caseData?.category, caseData?.state]);

  const handleReview = async (action) => {
    setActionLoading(true);
    try {
      const res = await casesApi.review(id, { action, note: reviewNote });
      setCaseData(res.case);
      setReviewNote("");
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.date || !scheduleForm.time) return;
    const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
    setActionLoading(true);
    try {
      const res = await casesApi.schedule(id, {
        scheduledAt: scheduledAt.toISOString(),
        slot: scheduleForm.slot,
        type: scheduleForm.type,
        venue: scheduleForm.venue,
      });
      setCaseData(res.case);
      setScheduleForm({ date: "", time: "", slot: "", type: "", venue: "" });
    } catch (err) {
      setError(err.message || "Schedule failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await casesApi.complete(id, completeForm);
      setCaseData(res.case);
      setCompleteForm({ meetingSummary: "", actionRequired: "", responsibleAuthority: "" });
    } catch (err) {
      setError(err.message || "Failed to close case");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.title.trim()) return;
    setActionLoading(true);
    try {
      const payload = {
        title: assignForm.title,
        assignedToName: assignForm.assignedToName
          ? `${assignForm.assignedToName}${assignForm.assignedDepartment ? ` (${assignForm.assignedDepartment})` : ""}`
          : assignForm.assignedDepartment || "",
        priority: assignForm.priority,
        dueDate: assignForm.dueDate || undefined,
        type: assignForm.assignType || undefined,
        slot: assignForm.dueSlot || undefined,
      };
      const res = await assignmentsApi.create(id, payload);
      setCaseData(res.case);
      setAssignForm({
        title: "",
        assignedToName: "",
        assignedDepartment: "",
        assignType: "",
        priority: "MEDIUM",
        dueDate: "",
        dueSlot: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create assignment");
    } finally {
      setActionLoading(false);
    }
  };

  const selectedDeptOfficers = assignForm.assignedDepartment
    ? (MOC_ORG_DIRECTORY.find((d) => d.department === assignForm.assignedDepartment)?.officers || [])
    : MOC_ORG_DIRECTORY.flatMap((d) => d.officers.map((o) => ({ ...o, department: d.department })));

  const handleUpdateAssignment = async (assignmentId, updates) => {
    try {
      const res = await assignmentsApi.update(id, assignmentId, updates);
      setCaseData(res.case);
    } catch (err) {
      setError(err.message || "Failed to update assignment");
    }
  };

  const handleAddComm = async (e) => {
    e.preventDefault();
    if (!commForm.summary.trim()) return;
    setActionLoading(true);
    try {
      const res = await communicationsApi.create(id, commForm);
      setCaseData(res.case);
      setCommForm({ type: "CALL", summary: "", happenedAt: "" });
    } catch (err) {
      setError(err.message || "Failed to log communication");
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
        <p>Case not found. <button type="button" onClick={() => navigate("/cases")} className="text-indigo-500 dark:text-indigo-400 bg-none border-none cursor-pointer">Go back</button></p>
      </div>
    );
  }

  const canReview = ["SUBMITTED", "IN_REVIEW", "REQUEST_CLARIFICATION"].includes(caseData.status);
  const canSchedule = caseData.status === "APPROVED";
  const canComplete = caseData.status === "SCHEDULED" || caseData.status === "RESOLVED_WITHOUT_MEETING";

  const TABS = [
    { id: "details", label: "Details" },
    { id: "workflow", label: "Workflow" },
    { id: "assignments", label: `Assignments (${caseData.assignments?.length || 0})` },
    { id: "communications", label: `Communications (${caseData.communications?.length || 0})` },
    { id: "authority", label: "Authority" },
  ];

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <button type="button" onClick={() => navigate("/cases")} className="mb-4 text-indigo-500 dark:text-indigo-400 font-bold text-sm bg-transparent border-none cursor-pointer p-0">
        ← Back to Cases
      </button>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">{caseData.caseId}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm"><strong>Purpose:</strong> {caseData.purpose}</p>
          </div>
          <div className="flex items-center gap-2">
            <Chip label={caseData.status} colorClass={TASK_STATUS_COLORS[caseData.status] || "bg-slate-100 text-slate-700"} />
            <Chip label={caseData.urgency || "MEDIUM"} colorClass={PRIORITY_COLORS[caseData.urgency] || PRIORITY_COLORS.MEDIUM} />
          </div>
        </div>
      </Card>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-600/60 shadow-3d-sm overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-500 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === Details Tab === */}
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
            <Row k="Referral Person" v={caseData.referralPerson} />
            <Row k="State" v={caseData.state} />
            <Row k="District/City" v={caseData.districtCity} />
            <Row k="Pincode" v={caseData.pincode} />
            <Row k="Local Area Minister" v={caseData.localAreaMinister} />
            <Row k="Details" v={caseData.details} />
            <Row k="Created" v={new Date(caseData.createdAt).toLocaleString()} />
            {caseData.documents?.length > 0 && (
              <>
                <h4 className="text-slate-700 dark:text-slate-300 font-semibold mt-3 mb-1">Documents</h4>
                {caseData.documents.map((d, i) => (
                  <div key={i} className="py-1">
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">{d.name}</a>
                  </div>
                ))}
              </>
            )}
            {caseData.reviewNote && <Row k="Review note" v={caseData.reviewNote} />}
          </Card>
        </>
      )}

      {/* === Workflow Tab === */}
      {activeTab === "workflow" && (
        <>
          {canReview && (
            <Card>
              <SectionTitle>Office Review</SectionTitle>
              <textarea
                placeholder="Note (optional)"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg text-sm mb-3 resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleReview("APPROVE")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm cursor-pointer disabled:opacity-50">Approve</button>
                <button type="button" onClick={() => handleReview("REJECT")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm cursor-pointer disabled:opacity-50">Reject</button>
                <button type="button" onClick={() => handleReview("REQUEST_CLARIFICATION")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-sm cursor-pointer disabled:opacity-50">Request Clarification</button>
                <button type="button" onClick={() => handleReview("RESOLVE_WITHOUT_MEETING")} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-slate-600 text-white font-semibold text-sm cursor-pointer disabled:opacity-50">Resolve Without Meeting</button>
              </div>
            </Card>
          )}

          {caseData.schedule?.scheduledAt && (
            <Card>
              <SectionTitle>Scheduled Meeting</SectionTitle>
              <Row k="Date & time" v={new Date(caseData.schedule.scheduledAt).toLocaleString()} />
              <Row k="Slot" v={caseData.schedule.slot} />
              <Row k="Type" v={caseData.schedule.type} />
              <Row k="Venue" v={caseData.schedule.venue} />
            </Card>
          )}

          {canSchedule && (
            <Card>
              <SectionTitle>Schedule Meeting</SectionTitle>
              <form onSubmit={handleSchedule} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Date & time *</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))}
                      required
                      className="w-1/2 p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))}
                      required
                      className="w-1/2 p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Slot</label>
                  <input type="text" placeholder="e.g. 10:00–10:30" value={scheduleForm.slot} onChange={(e) => setScheduleForm((f) => ({ ...f, slot: e.target.value }))} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <input type="text" placeholder="In-person / Video" value={scheduleForm.type} onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value }))} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Venue</label>
                  <select
                    value={scheduleForm.venue}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, venue: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="">Select venue</option>
                    <option value="Minister Home">Minister Home</option>
                    <option value="Kartavya Bhawan">Kartavya Bhawan</option>
                    <option value="Transport Bhawan">Transport Bhawan</option>
                  </select>
                </div>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm cursor-pointer disabled:opacity-50">Save Schedule & Notify</button>
              </form>
            </Card>
          )}

          {(caseData.meetingSummary || caseData.actionRequired || caseData.responsibleAuthority) && (
            <Card>
              <SectionTitle>Post-meeting</SectionTitle>
              <Row k="Meeting summary" v={caseData.meetingSummary} />
              <Row k="Action required" v={caseData.actionRequired} />
              <Row k="Responsible authority" v={caseData.responsibleAuthority} />
            </Card>
          )}

          {canComplete && (
            <Card>
              <SectionTitle>Close Case (Post-meeting)</SectionTitle>
              <form onSubmit={handleComplete} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Meeting summary</label>
                  <textarea value={completeForm.meetingSummary} onChange={(e) => setCompleteForm((f) => ({ ...f, meetingSummary: e.target.value }))} rows={3} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Action required</label>
                  <textarea value={completeForm.actionRequired} onChange={(e) => setCompleteForm((f) => ({ ...f, actionRequired: e.target.value }))} rows={2} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Responsible authority</label>
                  <input type="text" value={completeForm.responsibleAuthority} onChange={(e) => setCompleteForm((f) => ({ ...f, responsibleAuthority: e.target.value }))} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold text-sm cursor-pointer disabled:opacity-50">Close Case</button>
              </form>
            </Card>
          )}

          {!canReview && !canSchedule && !canComplete && !caseData.schedule?.scheduledAt && !caseData.meetingSummary && (
            <Card>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No workflow actions available for current status: <strong>{caseData.status}</strong></p>
            </Card>
          )}
        </>
      )}

      {/* === Assignments Tab === */}
      {activeTab === "assignments" && (
        <>
          <Card>
            <SectionTitle>Create Assignment</SectionTitle>
            <form onSubmit={handleAddAssignment} className="space-y-3">
              {/* Row 1: Title + Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={assignForm.title}
                    onChange={(e) => setAssignForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="e.g. Review petition documents"
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <select
                    value={assignForm.assignType}
                    onChange={(e) => setAssignForm((f) => ({ ...f, assignType: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="">Select type</option>
                    {ASSIGNMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Department + Officer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Department / Unit</label>
                  <select
                    value={assignForm.assignedDepartment}
                    onChange={(e) => setAssignForm((f) => ({ ...f, assignedDepartment: e.target.value, assignedToName: "" }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="">All departments</option>
                    {MOC_ORG_DIRECTORY.map((d) => (
                      <option key={d.department} value={d.department}>{d.department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Assigned to (Officer)</label>
                  <select
                    value={assignForm.assignedToName}
                    onChange={(e) => setAssignForm((f) => ({ ...f, assignedToName: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="">
                      {assignForm.assignedDepartment ? "Assign to department team" : "Select officer"}
                    </option>
                    {selectedDeptOfficers.map((o, i) => (
                      <option key={`${o.name}-${i}`} value={o.name}>
                        {o.name} — {o.designation}{o.department ? ` (${o.department})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Priority + Date + Slot */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
                  <select
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Due date</label>
                  <input
                    type="date"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Time slot</label>
                  <select
                    value={assignForm.dueSlot}
                    onChange={(e) => setAssignForm((f) => ({ ...f, dueSlot: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="">Any time</option>
                    {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm cursor-pointer disabled:opacity-50"
              >
                Add Assignment
              </button>
            </form>
          </Card>

          {(caseData.assignments?.length > 0) ? (
            <Card>
              <SectionTitle>Assignments</SectionTitle>
              <div className="space-y-3">
                {caseData.assignments.map((a) => (
                  <div key={a._id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{a.title}</span>
                        {a.assignedToName && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">→ {a.assignedToName}</span>}
                        {a.type && (
                          <span className="ml-2 text-[0.68rem] px-1.5 py-px rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-medium">
                            {ASSIGNMENT_TYPES.find((t) => t.value === a.type)?.label || a.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Chip label={a.priority} colorClass={PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.MEDIUM} />
                        <Chip label={a.status} colorClass={TASK_STATUS_COLORS[a.status] || TASK_STATUS_COLORS.PENDING} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      {a.dueDate && <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                      {a.slot && <span>Slot: {a.slot}</span>}
                      <span>Created: {new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {["PENDING", "IN_PROGRESS", "AWAITING_RESPONSE", "RESOLVED", "CLOSED"].filter((s) => s !== a.status).map((s) => (
                        <button key={s} type="button" onClick={() => handleUpdateAssignment(a._id, { status: s })} className="px-2 py-1 text-[0.7rem] rounded border border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer font-medium">
                          → {s.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No assignments yet.</p>
            </Card>
          )}
        </>
      )}

      {/* === Communications Tab === */}
      {activeTab === "communications" && (
        <>
          <Card>
            <SectionTitle>Log Communication</SectionTitle>
            <form onSubmit={handleAddComm} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <select value={commForm.type} onChange={(e) => setCommForm((f) => ({ ...f, type: e.target.value }))} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer">
                    {["CALL", "LETTER", "EMAIL", "MEETING_NOTE"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Date/time</label>
                  <input type="datetime-local" value={commForm.happenedAt} onChange={(e) => setCommForm((f) => ({ ...f, happenedAt: e.target.value }))} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Summary *</label>
                <textarea value={commForm.summary} onChange={(e) => setCommForm((f) => ({ ...f, summary: e.target.value }))} required rows={2} placeholder="Brief description of the communication..." className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-y bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
              </div>
              <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm cursor-pointer disabled:opacity-50">Log Entry</button>
            </form>
          </Card>

          {(caseData.communications?.length > 0) ? (
            <Card>
              <SectionTitle>Communication Log</SectionTitle>
              <div className="space-y-2">
                {[...caseData.communications].reverse().map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-xl flex-shrink-0">{COMM_ICONS[c.type] || "💬"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.type.replace("_", " ")}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(c.happenedAt || c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{c.summary}</p>
                      {c.createdByName && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">— {c.createdByName}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No communications logged yet.</p>
            </Card>
          )}
        </>
      )}

      {/* === Authority Tab === */}
      {activeTab === "authority" && (
        <Card>
          <SectionTitle>Authority Suggestions</SectionTitle>
          {suggestions?.suggestedDepartment && (
            <div className="mb-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                <strong>Suggested department:</strong> {suggestions.suggestedDepartment} (based on category "{caseData.category}")
              </p>
            </div>
          )}
          {suggestions?.officials?.length > 0 ? (
            <div className="space-y-2">
              {suggestions.officials.map((o) => (
                <div key={o._id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {o.name?.[0]?.toUpperCase() || "O"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{o.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{o.email} · {o.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No officials found. Officials with role "official" will appear here as suggestions.</p>
          )}
          {suggestions?.categoryMap && (
            <div className="mt-4">
              <h4 className="text-slate-700 dark:text-slate-300 font-semibold text-sm mb-2">Category → Department Mapping</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(suggestions.categoryMap).map(([cat, dept]) => (
                  <div key={cat} className="flex justify-between p-1.5 border-b border-slate-100 dark:border-slate-600">
                    <span className="text-slate-600 dark:text-slate-400 capitalize">{cat}</span>
                    <span className="text-slate-800 dark:text-slate-300 font-medium">{dept}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
