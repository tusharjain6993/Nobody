// ─── HCM Minister Portal — Static / Seed Data ────────────────────────────

export const REFERRING_OFFICERS = [
  { id: "VISHAL_GUPTA", name: "Vishal Gupta" },
  { id: "MAHENDRA_PRATAP_SINGH", name: "Mahendra Pratap Singh" },
  { id: "CHIRAG_PANCHAL", name: "Chirag Panchal" },
];

export const REFERENCE_MODES = [
  { id: "CALL", name: "Call" },
  { id: "EMAIL", name: "Email" },
  { id: "WRITTEN", name: "Written" },
  { id: "IN_PERSON", name: "In-person" },
];

export const REQUEST_CATEGORIES = [
  { id: "PUBLIC_GRIEVANCE", name: "Public Grievance" },
  { id: "POLICY_REQUEST", name: "Policy Request" },
  { id: "PERSONAL_ISSUE", name: "Personal Issue" },
  { id: "LAND_AND_REVENUE", name: "Land & Revenue" },
  { id: "CIVIC_ISSUE", name: "Civic Issue" },
  { id: "PENSION_AND_WELFARE", name: "Pension & Welfare" },
  { id: "OTHER", name: "Other" },
];

export const PRIORITIES = [
  { id: "LOW", name: "Low" },
  { id: "MEDIUM", name: "Medium" },
  { id: "HIGH", name: "High" },
  { id: "URGENT", name: "Urgent" },
];

export const CASE_STATUSES = [
  { id: "PENDING_APPROVAL", name: "Pending Approval" },
  { id: "APPROVED", name: "Approved" },
  { id: "REJECTED", name: "Rejected" },
  { id: "ON_HOLD", name: "On Hold" },
  { id: "SCHEDULED", name: "Scheduled" },
  { id: "COMPLETED", name: "Completed" },
  { id: "CLOSED", name: "Closed" },
  { id: "NO_SHOW", name: "No Show" },
  { id: "RESCHEDULED", name: "Rescheduled" },
  { id: "FOLLOW_UP_REQUIRED", name: "Follow-up Required" },
  { id: "RESCHEDULE_REQUIRED", name: "Reschedule Required" },
];

export const MEETING_TYPES = [
  { id: "IN_PERSON", name: "In-Person" },
  { id: "VIRTUAL", name: "Virtual" },
];

// ─── Sample Citizens ────────────────────────────────────────────────────────
export const MOCK_CITIZENS = [
  {
    id: "uuid-c1",
    name: "Ramesh Kumar",
    phone: "+919876543210",
    aadhaar: "1234-5678-9012",
    address: "Village X, Block Y, District Z",
    districtId: null,
    stateId: null,
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "uuid-c2",
    name: "Sunita Devi",
    phone: "+919123456789",
    aadhaar: null,
    address: "Mohalla A, City B",
    districtId: null,
    stateId: null,
    createdAt: "2026-03-02T10:00:00.000Z",
    updatedAt: "2026-03-02T10:00:00.000Z",
  },
  {
    id: "uuid-c3",
    name: "Pramod Yadav",
    phone: "+919988776655",
    aadhaar: "9876-5432-1098",
    address: "Plot 5, Sector 12, Lucknow",
    districtId: null,
    stateId: null,
    createdAt: "2026-03-03T08:00:00.000Z",
    updatedAt: "2026-03-03T08:00:00.000Z",
  },
];

// ─── Sample Cases ───────────────────────────────────────────────────────────
export const MOCK_CASES = [
  {
    id: "uuid-1",
    caseId: "MO-2026-00001",
    citizenId: "uuid-c1",
    purpose: "Land dispute in village X",
    meetingDate: null,
    status: "PENDING_APPROVAL",
    priority: "MEDIUM",
    category: "LAND_AND_REVENUE",
    referringOfficer: "VISHAL_GUPTA",
    referenceMode: "CALL",
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
    citizen: MOCK_CITIZENS[0],
    assignments: [],
    comments: [],
    files: [],
    auditLogs: [
      {
        id: "log-1",
        action: "CASE_CREATED",
        details: "Case submitted by staff",
        userId: "user-1",
        user: { id: "user-1", name: "Staff User", role: "STAFF" },
        createdAt: "2026-03-01T10:00:00.000Z",
      },
    ],
    communicationLogs: [],
  },
  {
    id: "uuid-2",
    caseId: "MO-2026-00002",
    citizenId: "uuid-c2",
    purpose: "Pension not received for 3 months",
    meetingDate: "2026-03-15",
    status: "APPROVED",
    priority: "HIGH",
    category: "PENSION_AND_WELFARE",
    referringOfficer: "MAHENDRA_PRATAP_SINGH",
    referenceMode: "EMAIL",
    createdAt: "2026-03-02T11:00:00.000Z",
    updatedAt: "2026-03-03T09:00:00.000Z",
    citizen: MOCK_CITIZENS[1],
    assignments: [
      {
        id: "asgn-1",
        caseId: "uuid-2",
        userId: "user-2",
        notes: "Follow up with social welfare dept",
        dueDate: "2026-03-20T00:00:00.000Z",
        status: "IN_PROGRESS",
        createdAt: "2026-03-03T09:00:00.000Z",
        updatedAt: "2026-03-03T09:00:00.000Z",
        user: { id: "user-2", name: "Admin User", role: "ADMIN" },
      },
    ],
    comments: [],
    files: [],
    auditLogs: [],
    communicationLogs: [],
  },
  {
    id: "uuid-3",
    caseId: "MO-2026-00003",
    citizenId: "uuid-c3",
    purpose: "Road repair needed in Sector 12",
    meetingDate: "2026-03-20",
    status: "SCHEDULED",
    priority: "LOW",
    category: "CIVIC_ISSUE",
    referringOfficer: "CHIRAG_PANCHAL",
    referenceMode: "IN_PERSON",
    scheduledDate: "2026-03-20",
    scheduledTimeSlot: "10:00-10:30",
    meetingType: "IN_PERSON",
    venueOrLink: "CM Office, Room 3",
    createdAt: "2026-03-03T12:00:00.000Z",
    updatedAt: "2026-03-04T08:00:00.000Z",
    citizen: MOCK_CITIZENS[2],
    assignments: [],
    comments: [
      {
        id: "cmt-1",
        content: "Meeting confirmed. Please bring relevant documents.",
        userId: "user-1",
        user: { id: "user-1", name: "Staff User", role: "STAFF" },
        createdAt: "2026-03-04T08:00:00.000Z",
      },
    ],
    files: [],
    auditLogs: [],
    communicationLogs: [],
  },
  {
    id: "uuid-4",
    caseId: "MO-2026-00004",
    citizenId: "uuid-c1",
    purpose: "Water supply disruption in colony",
    meetingDate: null,
    status: "REJECTED",
    priority: "MEDIUM",
    category: "PUBLIC_GRIEVANCE",
    referringOfficer: "VISHAL_GUPTA",
    referenceMode: "WRITTEN",
    rejectionReason: "Issue already resolved by municipal corporation",
    createdAt: "2026-03-04T09:00:00.000Z",
    updatedAt: "2026-03-05T10:00:00.000Z",
    citizen: MOCK_CITIZENS[0],
    assignments: [],
    comments: [],
    files: [],
    auditLogs: [],
    communicationLogs: [],
  },
  {
    id: "uuid-5",
    caseId: "MO-2026-00005",
    citizenId: "uuid-c2",
    purpose: "Policy clarification on PM Housing scheme",
    meetingDate: null,
    status: "ON_HOLD",
    priority: "URGENT",
    category: "POLICY_REQUEST",
    referringOfficer: "MAHENDRA_PRATAP_SINGH",
    referenceMode: "CALL",
    createdAt: "2026-03-05T14:00:00.000Z",
    updatedAt: "2026-03-06T11:00:00.000Z",
    citizen: MOCK_CITIZENS[1],
    assignments: [],
    comments: [],
    files: [],
    auditLogs: [],
    communicationLogs: [],
  },
];

// ─── Mock Dashboard Stats ────────────────────────────────────────────────────
export const MOCK_DASHBOARD_STATS = {
  stats: {
    totalRequests: 5,
    pendingTasks: 2,
    completedTasks: 0,
    followUpRequired: 0,
    highPriority: 2,
    pendingApproval: 1,
    onHold: 1,
  },
  upcomingMeetings: [
    {
      id: "uuid-3",
      caseId: "MO-2026-00003",
      scheduledDate: "2026-03-20",
      scheduledTimeSlot: "10:00-10:30",
      citizen: { name: "Pramod Yadav", phone: "+919988776655" },
      status: "SCHEDULED",
      priority: "LOW",
      category: "CIVIC_ISSUE",
    },
  ],
  recentUpdates: [
    {
      id: "log-1",
      action: "CASE_CREATED",
      details: "New case MO-2026-00005 submitted",
      createdAt: "2026-03-05T14:00:00.000Z",
      case: { caseId: "MO-2026-00005" },
      user: { name: "Staff User" },
    },
    {
      id: "log-2",
      action: "STATUS_UPDATED",
      details: "Case MO-2026-00004 rejected",
      createdAt: "2026-03-05T10:00:00.000Z",
      case: { caseId: "MO-2026-00004" },
      user: { name: "Admin User" },
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const STATUS_COLORS = {
  PENDING_APPROVAL: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  APPROVED: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  ON_HOLD: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  SCHEDULED: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  CLOSED: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  NO_SHOW: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
  RESCHEDULED: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  FOLLOW_UP_REQUIRED: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  RESCHEDULE_REQUIRED: { bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-300" },
  PENDING: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  IN_PROGRESS: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
  ESCALATED: { bg: "bg-red-100", text: "text-red-800", border: "border-red-400" },
  RESOLVED: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300" },
  ARCHIVED: { bg: "bg-neutral-100", text: "text-neutral-700", border: "border-neutral-300" },
};

export const PRIORITY_COLORS = {
  LOW: { bg: "bg-emerald-50", text: "text-emerald-700" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-700" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700" },
  URGENT: { bg: "bg-red-50", text: "text-red-700" },
};

export function getStatusLabel(status) {
  return CASE_STATUSES.find((s) => s.id === status)?.name || status;
}
export function getCategoryLabel(cat) {
  return REQUEST_CATEGORIES.find((c) => c.id === cat)?.name || cat || "—";
}
export function getReferringOfficerLabel(id) {
  return REFERRING_OFFICERS.find((r) => r.id === id)?.name || id || "—";
}
export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
