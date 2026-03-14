import { getDb, queryAll, queryOne, execute } from "../db/database";
import { calculateProductivityScore, classifyEvent, buildAnalytics } from "../utils/analytics";

const CITIZEN_SESSION_MS = 4 * 60 * 60 * 1000;
const STAFF_SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function ts() {
  return new Date().toISOString();
}

function localDatePart(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localTimePart(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("hcm_user"));
  } catch {
    return null;
  }
}

function humanizeStatus(value = "") {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function nextCode(prefix, table) {
  const row = queryOne(`SELECT COUNT(*) as cnt FROM ${table}`);
  return `${prefix}-${String((row?.cnt || 0) + 1).padStart(6, "0")}`;
}

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function requireRole(role) {
  const user = requireUser();
  if (user.role !== role) throw new Error("Unauthorized");
  return user;
}

function normalizePhones(payload = {}) {
  const phones = [payload.phonePrimary, payload.phoneSecondary, payload.phoneTertiary]
    .map((phone) => String(phone || "").replace(/\D/g, ""))
    .filter(Boolean);
  return Array.from(new Set(phones));
}

function maskAadhaar(value = "") {
  const clean = String(value).replace(/\D/g, "");
  return clean.length === 12 ? `****-****-${clean.slice(-4)}` : value;
}

function getProfileCompletion(user) {
  const fields = [
    ["aadhaar", !!user?.aadhaar],
    ["phone", parseJson(user?.phoneNumbers, []).length > 0],
    ["age", !!user?.age],
    ["gender", !!user?.gender],
    ["pinCode", !!user?.pinCode],
    ["state", !!user?.state],
    ["city", !!user?.city],
    ["mpName", !!user?.mpName],
  ];
  const completed = fields.filter(([, ok]) => ok).length;
  const missing = fields.filter(([, ok]) => !ok).map(([name]) => name);
  return {
    percent: Math.round((completed / fields.length) * 100),
    isComplete: missing.length === 0,
    missing,
  };
}

function getCitizenSnapshot(user) {
  return {
    name: user.name,
    citizenId: user.citizenId,
    aadhaar: maskAadhaar(user.aadhaar),
    phoneNumbers: parseJson(user.phoneNumbers, []),
    age: user.age || null,
    gender: user.gender || "",
    pinCode: user.pinCode || "",
    state: user.state || "",
    city: user.city || "",
    mpName: user.mpName || "",
    profileCompletion: getProfileCompletion(user),
  };
}

function getAdminUsers() {
  return queryAll("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC");
}

function getMinisterUsers() {
  return queryAll("SELECT * FROM users WHERE role = 'minister' ORDER BY id ASC");
}

function getDeoUsers() {
  return queryAll("SELECT * FROM users WHERE role = 'deo' ORDER BY id ASC");
}

function addNotificationForUsers(userIds, type, message, link = "") {
  const now = ts();
  Array.from(new Set(userIds.map(Number))).forEach((userId) => {
    execute(
      "INSERT INTO notifications (userId,type,message,link,isRead,createdAt) VALUES (?,?,?,?,0,?)",
      [userId, type, message, link, now]
    );
  });
}

function addLog(entityType, entityId, action, notes, user) {
  execute(
    "INSERT INTO activity_logs (entityType,entityId,action,notes,createdByUserId,createdByName,createdAt) VALUES (?,?,?,?,?,?,?)",
    [entityType, Number(entityId), action, notes || "", user?.id ? Number(user.id) : null, user?.name || "System", ts()]
  );
}

function updateUserLoginState(userId, { failedLoginAttempts = 0, lockedUntil = "", lastLoginAt = null }) {
  execute(
    "UPDATE users SET failedLoginAttempts=?, lockedUntil=?, lastLoginAt=COALESCE(?, lastLoginAt), updatedAt=? WHERE id=?",
    [failedLoginAttempts, lockedUntil, lastLoginAt, ts(), Number(userId)]
  );
}

function ensureUserNotLocked(user) {
  if (user?.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    throw new Error(`Account temporarily locked. Try again after ${new Date(user.lockedUntil).toLocaleTimeString()}.`);
  }
}

function registerFailedLogin(user) {
  const attempts = Number(user.failedLoginAttempts || 0) + 1;
  const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : "";
  updateUserLoginState(user.id, { failedLoginAttempts: attempts, lockedUntil });
  if (lockedUntil) {
    throw new Error("Too many failed attempts. Demo account locked for 15 minutes.");
  }
  throw new Error(`Invalid credentials. ${MAX_FAILED_ATTEMPTS - attempts} attempt(s) remaining before lockout.`);
}

function buildSessionPayload(user) {
  const sessionExpiresAt = new Date(Date.now() + (user.role === "citizen" ? CITIZEN_SESSION_MS : STAFF_SESSION_MS)).toISOString();
  const profileCompletion = user.role === "citizen" ? getProfileCompletion(user) : null;
  return {
    token: `local-${user.id}`,
    sessionExpiresAt,
    user: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      citizenId: user.citizenId || "",
      profileCompletion,
      lastLoginAt: user.lastLoginAt || "",
    },
  };
}

function buildRelatedComplaintSummary(row) {
  if (!row) return null;
  return {
    id: row._id,
    complaintId: row.complaintId,
    title: row.title,
    status: row.status,
    statusLabel: humanizeStatus(row.status),
  };
}

function buildRelatedMeetingSummary(row) {
  if (!row) return null;
  return {
    id: row._id,
    requestId: row.requestId,
    purpose: row.purpose,
    status: row.status,
    statusLabel: humanizeStatus(row.status),
    executionStatus: row.executionStatus,
  };
}

function getNotificationsForCase({ requestId, complaintId }) {
  const notifications = queryAll("SELECT * FROM notifications ORDER BY createdAt DESC");
  return notifications.filter((item) => {
    const haystack = `${item.message} ${item.link}`.toLowerCase();
    return (requestId && haystack.includes(String(requestId).toLowerCase()))
      || (complaintId && haystack.includes(String(complaintId).toLowerCase()));
  }).slice(0, 8);
}

function getTimelineForEntities(entities) {
  const rows = [];
  entities.forEach(({ entityType, entityId, label }) => {
    queryAll(
      "SELECT * FROM activity_logs WHERE entityType=? AND entityId=? ORDER BY createdAt DESC",
      [entityType, Number(entityId)]
    ).forEach((item) => rows.push({ ...item, sourceLabel: label }));
  });
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function deriveMeetingOwner(meeting) {
  if (meeting.executionStatus === "completed") return "Record closed after attendance";
  if (meeting.executionStatus === "no_show") return "Citizen marked as no-show";
  if (meeting.executionStatus === "cancelled") return "Admin rescheduling desk";
  if (meeting.status === "submitted") return "Admin review desk";
  if (meeting.status === "verification_needed") return "Verification desk";
  if (meeting.status === "under_review") return meeting.assignedAdminName || meeting.referralAdminName || "Assigned admin";
  if (meeting.status === "approved") return meeting.assignedAdminName || meeting.referralAdminName || "Scheduling desk";
  if (meeting.status === "scheduled") return "Citizen / DEO coordination";
  if (meeting.status === "rejected") return "Closed record";
  return "Operations desk";
}

function deriveMeetingNextAction(meeting) {
  if (meeting.executionStatus === "completed") return "Archive summary and keep QR record available.";
  if (meeting.executionStatus === "no_show") return "Decide whether to reopen or close the missed meeting.";
  if (meeting.executionStatus === "cancelled") return "Reschedule or close the meeting request.";
  if (meeting.status === "submitted") return "Move this request into verification if citizen validation is required.";
  if (meeting.status === "verification_needed") return "Log the verification outcome and return the request to review.";
  if (meeting.status === "under_review") return "Approve, reject, or refine the priority before scheduling.";
  if (meeting.status === "approved") return "Schedule the approved meeting slot and issue docket details.";
  if (meeting.status === "scheduled") return "Citizen attends the meeting; admin can later mark completed or no-show.";
  if (meeting.status === "rejected") return "No further action unless the case is reopened separately.";
  return "Review workflow state.";
}

function deriveComplaintOwner(complaint) {
  if (complaint.status === "completed") return "Closed record";
  if (complaint.status === "resolved") return complaint.assignedAdminName || "Assigned admin";
  if (!complaint.assignedAdminUserId) return "Common complaint pool";
  if (complaint.status === "call_scheduled") return complaint.department || complaint.assignedAdminName || "Assigned admin";
  if (complaint.status === "escalated_to_admin_meeting") return "Meeting workflow";
  return complaint.assignedAdminName || "Assigned admin";
}

function deriveComplaintNextAction(complaint) {
  if (!complaint.assignedAdminUserId) return "An admin must claim or be assigned this complaint.";
  if (complaint.status === "department_contact_identified") return "Schedule the departmental follow-up call.";
  if (complaint.status === "call_scheduled") return "Complete the scheduled call and log the outcome.";
  if (complaint.status === "followup_in_progress") return "Resolve the complaint or escalate it to a meeting.";
  if (complaint.status === "resolved") return "Close the complaint or reopen it if correction is needed.";
  if (complaint.status === "completed") return "No further action unless the complaint is reopened.";
  if (complaint.status === "escalated_to_admin_meeting") return "Track the linked meeting and communicate updates to the citizen.";
  return "Capture department ownership and continue complaint handling.";
}

function buildMeetingRequest(row) {
  if (!row) return null;
  const complaintRow = row.escalatedFromComplaintId
    ? queryOne("SELECT * FROM complaints WHERE id = ?", [Number(row.escalatedFromComplaintId)])
    : null;
  const notifications = getNotificationsForCase({ requestId: row.requestId, complaintId: complaintRow?.complaintId });
  const timeline = getTimelineForEntities([
    { entityType: "meeting_request", entityId: row.id, label: "Meeting" },
    ...(complaintRow ? [{ entityType: "complaint", entityId: complaintRow.id, label: "Complaint" }] : []),
  ]);
  return {
    ...row,
    citizenSnapshot: parseJson(row.citizenSnapshot, {}),
    attachments: parseJson(row.attachments, row.attachmentData
      ? [{ name: row.attachmentName, type: row.attachmentType, data: row.attachmentData }]
      : []),
    attachment: row.attachmentData ? { name: row.attachmentName, type: row.attachmentType, data: row.attachmentData } : null,
    logs: queryAll("SELECT * FROM activity_logs WHERE entityType='meeting_request' AND entityId=? ORDER BY createdAt DESC", [row.id]),
    relatedComplaint: buildRelatedComplaintSummary(complaintRow),
    relatedNotifications: notifications,
    masterTimeline: timeline,
    statusLabel: humanizeStatus(row.status),
    executionStatusLabel: humanizeStatus(row.executionStatus || "pending"),
    currentOwner: deriveMeetingOwner(row),
    nextAction: deriveMeetingNextAction(row),
  };
}

function buildComplaint(row) {
  if (!row) return null;
  const meetingRow = row.escalatedMeetingRequestId
    ? queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(row.escalatedMeetingRequestId)])
    : null;
  const notifications = getNotificationsForCase({ complaintId: row.complaintId, requestId: meetingRow?.requestId });
  const timeline = getTimelineForEntities([
    { entityType: "complaint", entityId: row.id, label: "Complaint" },
    ...(meetingRow ? [{ entityType: "meeting_request", entityId: meetingRow.id, label: "Meeting" }] : []),
  ]);
  return {
    ...row,
    citizenSnapshot: parseJson(row.citizenSnapshot, {}),
    attachments: parseJson(row.attachments, []),
    resolutionDocs: parseJson(row.resolutionDocs, []),
    logs: queryAll("SELECT * FROM activity_logs WHERE entityType='complaint' AND entityId=? ORDER BY createdAt DESC", [row.id]),
    relatedMeeting: buildRelatedMeetingSummary(meetingRow),
    relatedNotifications: notifications,
    masterTimeline: timeline,
    statusLabel: humanizeStatus(row.status),
    currentOwner: deriveComplaintOwner(row),
    nextAction: deriveComplaintNextAction(row),
  };
}

function buildCalendarEvent(row) {
  if (!row) return null;
  return { ...row, photos: parseJson(row.photos, []), documents: parseJson(row.documents, []) };
}

function buildMeetingCalendarDetails(meeting) {
  const parts = [
    `Citizen: ${meeting.citizenSnapshot?.name || "Citizen"}`,
    `Priority: ${meeting.priority || "MEDIUM"}`,
    `Visitor ID: ${meeting.visitorId || "Pending"}`,
    `Docket: ${meeting.meetingDocket || "Pending"}`,
  ];
  if (meeting.priorityReason) parts.push(`Priority reason: ${meeting.priorityReason}`);
  if (meeting.adminNotes) parts.push(meeting.adminNotes);
  return parts.join(" · ");
}

function assertMeetingTransition(row, allowedStatuses, message) {
  if (!row) throw new Error("Meeting request not found");
  if (!allowedStatuses.includes(row.status)) throw new Error(message);
}

function updateMeetingOwnership(row, user) {
  execute(
    "UPDATE meeting_requests SET assignedAdminUserId=?, assignedAdminName=?, updatedAt=? WHERE id=?",
    [Number(user.id), user.name, ts(), Number(row.id)]
  );
}

function requireHighPriorityReason(priority, priorityReason) {
  if (priority === "HIGH" && !priorityReason) {
    throw new Error("A mandatory reason is required for High priority meetings");
  }
}

function getMeetingOperationalState(meeting) {
  if (meeting.executionStatus === "completed") return "completed";
  if (meeting.executionStatus === "no_show") return "no_show";
  if (meeting.executionStatus === "cancelled") return "cancelled";
  return meeting.status;
}

function buildOperationalMetrics(complaints, meetings) {
  const pendingComplaints = complaints.filter((item) => !["resolved", "completed"].includes(item.status));
  const now = Date.now();
  const pendingAgeBuckets = { under3: 0, day3to7: 0, day8to14: 0, over14: 0 };

  pendingComplaints.forEach((item) => {
    const ageDays = Math.floor((now - new Date(item.createdAt).getTime()) / (24 * 60 * 60 * 1000));
    if (ageDays < 3) pendingAgeBuckets.under3 += 1;
    else if (ageDays < 8) pendingAgeBuckets.day3to7 += 1;
    else if (ageDays < 15) pendingAgeBuckets.day8to14 += 1;
    else pendingAgeBuckets.over14 += 1;
  });

  const verificationBacklog = meetings.filter((item) => ["verification_needed", "under_review"].includes(item.status)).length;
  const scheduledMeetings = meetings.filter((item) => item.status === "scheduled" && item.executionStatus === "pending").length;
  const completedMeetings = meetings.filter((item) => item.executionStatus === "completed").length;
  const noShowMeetings = meetings.filter((item) => item.executionStatus === "no_show").length;
  const slaBreaches = pendingComplaints.filter((item) => {
    const ageDays = Math.floor((now - new Date(item.createdAt).getTime()) / (24 * 60 * 60 * 1000));
    return ageDays > 7;
  }).length;

  const adminWorkloadDistribution = getAdminUsers().map((admin) => {
    const complaintCount = complaints.filter((item) => Number(item.assignedAdminUserId || 0) === Number(admin.id) && item.status !== "completed").length;
    const meetingCount = meetings.filter((item) => Number(item.assignedAdminUserId || item.referralAdminUserId || 0) === Number(admin.id) && !["rejected"].includes(item.status)).length;
    return {
      id: String(admin.id),
      admin: admin.name,
      total: complaintCount + meetingCount,
      complaints: complaintCount,
      meetings: meetingCount,
    };
  });

  const departmentMap = {};
  complaints.forEach((item) => {
    const key = item.department || "Unassigned";
    if (!departmentMap[key]) {
      departmentMap[key] = { department: key, total: 0, resolved: 0 };
    }
    departmentMap[key].total += 1;
    if (["resolved", "completed"].includes(item.status)) {
      departmentMap[key].resolved += 1;
    }
  });

  const referralDepartmentPerformance = Object.values(departmentMap).map((item) => ({
    ...item,
    resolutionRate: item.total ? Math.round((item.resolved / item.total) * 100) : 0,
  }));

  const priorityBreakdown = ["LOW", "MEDIUM", "HIGH"].map((priority) => ({
    priority,
    count: meetings.filter((item) => item.priority === priority).length,
  }));

  return {
    pendingAgeBuckets,
    verificationBacklog,
    meetingOutcomes: {
      scheduled: scheduledMeetings,
      completed: completedMeetings,
      noShow: noShowMeetings,
      cancelled: meetings.filter((item) => item.executionStatus === "cancelled").length,
    },
    complaintSlaBreaches: slaBreaches,
    adminWorkloadDistribution,
    referralDepartmentPerformance,
    priorityBreakdown,
  };
}

function buildCaseSummaryRows(itemType, item) {
  const rows = [
    ["Case ID", itemType === "meeting" ? item.requestId : item.complaintId],
    ["Citizen", item.citizenSnapshot?.name || "Unknown"],
    ["Status", item.statusLabel],
    ["Current owner", item.currentOwner],
    ["Next action", item.nextAction],
  ];
  if (itemType === "meeting") {
    rows.push(["Purpose", item.purpose || ""]);
    rows.push(["Priority", item.priority || "MEDIUM"]);
    rows.push(["Priority reason", item.priorityReason || ""]);
    rows.push(["Schedule", item.scheduleDate ? `${item.scheduleDate} ${item.scheduleTime || ""}` : "Pending"]);
    rows.push(["Location", item.scheduleLocation || ""]);
    rows.push(["Execution status", item.executionStatusLabel || "Pending"]);
  } else {
    rows.push(["Complaint", item.title || ""]);
    rows.push(["Department", item.department || "Pending"]);
    rows.push(["Resolution summary", item.resolutionSummary || ""]);
  }
  return rows;
}

export const authApi = {
  login: async (email, password) => {
    await getDb();
    const user = queryOne("SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND role IN ('admin','minister','deo')", [String(email || "").trim()]);
    if (!user) throw new Error("Invalid email or password");
    ensureUserNotLocked(user);
    if (user.password !== password) registerFailedLogin(user);
    updateUserLoginState(user.id, { failedLoginAttempts: 0, lockedUntil: "", lastLoginAt: ts() });
    return buildSessionPayload(queryOne("SELECT * FROM users WHERE id = ?", [user.id]));
  },

  loginByCitizenId: async (citizenId) => {
    await getDb();
    const user = queryOne(
      "SELECT * FROM users WHERE citizenId = ? AND role = 'citizen' AND isVerified = 1",
      [String(citizenId || "").trim().toUpperCase()]
    );
    if (!user) throw new Error("No verified citizen found for this Citizen ID");
    ensureUserNotLocked(user);
    updateUserLoginState(user.id, { failedLoginAttempts: 0, lockedUntil: "", lastLoginAt: ts() });
    return buildSessionPayload(queryOne("SELECT * FROM users WHERE id = ?", [user.id]));
  },

  register: async (body) => {
    await getDb();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const aadhaar = String(body.aadhaar || "").replace(/\D/g, "");
    const phones = normalizePhones(body);
    const age = Number(body.age || 0);
    const gender = String(body.gender || "").trim();
    const pinCode = String(body.pinCode || "").replace(/\D/g, "");
    const state = String(body.state || "").trim();
    const city = String(body.city || "").trim();
    const mpName = String(body.mpName || "").trim();
    const photo = body.photo || null;

    if (!name) throw new Error("Name is required");
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) throw new Error("Aadhaar must be exactly 12 digits");
    if (phones.length !== 1) throw new Error("Exactly one mobile number is required");
    if (phones.some((phone) => !/^[6-9]\d{9}$/.test(phone))) throw new Error("Phone number must be a valid 10-digit mobile number");
    if (!Number.isInteger(age) || age < 18 || age > 120) throw new Error("Age must be between 18 and 120");
    if (!gender) throw new Error("Gender is required");
    if (!/^\d{6}$/.test(pinCode)) throw new Error("PIN code must be exactly 6 digits");
    if (!state || !city || !mpName) throw new Error("State, city, and MP must be populated from the PIN code");

    const existing = queryOne("SELECT id FROM users WHERE aadhaar = ?", [aadhaar]);
    if (existing) throw new Error("A citizen is already registered with this Aadhaar");

    const citizenId = nextCode("CTZ-HP", "users");
    const now = ts();
    execute(
      `INSERT INTO users (
        name,email,password,aadhaar,phonePrimary,phoneSecondary,phoneTertiary,phoneNumbers,age,gender,pinCode,state,city,mpName,photoName,photoType,photoData,citizenId,role,department,isVerified,lastLoginAt,failedLoginAttempts,lockedUntil,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        name,
        email || `${citizenId.toLowerCase()}@demo.local`,
        "",
        aadhaar,
        phones[0] || "",
        phones[1] || "",
        phones[2] || "",
        JSON.stringify(phones),
        age,
        gender,
        pinCode,
        state,
        city,
        mpName,
        photo?.name || "",
        photo?.type || "",
        photo?.data || "",
        citizenId,
        "citizen",
        "",
        1,
        "",
        0,
        "",
        now,
        now,
      ]
    );
    return { citizenUniqueId: citizenId };
  },

  recoverCitizenId: async ({ aadhaar, phone }) => {
    await getDb();
    const cleanAadhaar = String(aadhaar || "").replace(/\D/g, "");
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (!/^\d{12}$/.test(cleanAadhaar)) throw new Error("Aadhaar must be exactly 12 digits");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) throw new Error("Phone number must be a valid 10-digit mobile number");
    const user = queryOne("SELECT * FROM users WHERE aadhaar = ? AND role = 'citizen'", [cleanAadhaar]);
    if (!user) throw new Error("Citizen record not found");
    const phones = parseJson(user.phoneNumbers, []);
    if (!phones.includes(cleanPhone)) throw new Error("Aadhaar and phone number do not match");
    return {
      citizenId: user.citizenId,
      name: user.name,
      profileCompletion: getProfileCompletion(user),
      lastLoginAt: user.lastLoginAt || "",
    };
  },
};

export const adminDirectoryApi = {
  list: async () => {
    await getDb();
    return {
      admins: getAdminUsers().map((admin) => ({
        id: String(admin.id),
        name: admin.name,
        email: admin.email,
        department: admin.department,
      })),
    };
  },
};

export const citizenApi = {
  createMeetingRequest: async (body) => {
    await getDb();
    const user = requireRole("citizen");
    const dbUser = queryOne("SELECT * FROM users WHERE id = ?", [Number(user.id)]);
    const profile = getProfileCompletion(dbUser);
    if (!profile.isComplete) {
      throw new Error(`Citizen profile incomplete. Missing: ${profile.missing.join(", ")}`);
    }
    const purpose = String(body.purpose || "").trim();
    const referralAdminUserId = Number(body.referralAdminUserId || 0);
    const referralAdmin = queryOne("SELECT * FROM users WHERE id = ? AND role = 'admin'", [referralAdminUserId]);
    if (!purpose) throw new Error("Purpose of meeting is required");
    const now = ts();
    const requestId = nextCode("MREQ", "meeting_requests");
    execute(
      `INSERT INTO meeting_requests (
        requestId,citizenId,citizenSnapshot,purpose,referralAdminUserId,referralAdminName,attachments,attachmentName,attachmentType,attachmentData,status,verificationOutcome,rejectReason,scheduleDate,scheduleTime,scheduleLocation,priority,priorityReason,visitorId,meetingDocket,adminNotes,statusReason,executionStatus,escalatedFromComplaintId,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        requestId,
        Number(user.id),
        JSON.stringify(getCitizenSnapshot(dbUser)),
        purpose,
        referralAdmin ? referralAdminUserId : null,
        referralAdmin?.name || "",
        JSON.stringify(body.attachments || (body.attachment ? [body.attachment] : [])),
        body.attachments?.[0]?.name || body.attachment?.name || "",
        body.attachments?.[0]?.type || body.attachment?.type || "",
        body.attachments?.[0]?.data || body.attachment?.data || "",
        "submitted",
        "",
        "",
        "",
        "",
        "",
        "MEDIUM",
        "",
        "",
        "",
        "",
        "Citizen submitted the request.",
        "pending",
        body.escalatedFromComplaintId ? Number(body.escalatedFromComplaintId) : null,
        now,
        now,
      ]
    );
    const meetingRow = queryOne("SELECT * FROM meeting_requests WHERE requestId = ?", [requestId]);
    addLog("meeting_request", meetingRow.id, "Meeting request submitted", purpose, user);
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Meeting Request",
      `New meeting request ${requestId} submitted by ${user.name}.`,
      `/cases/meeting/${meetingRow.id}`
    );
    return { meetingRequest: buildMeetingRequest(meetingRow) };
  },

  createComplaint: async (body) => {
    await getDb();
    const user = requireRole("citizen");
    const dbUser = queryOne("SELECT * FROM users WHERE id = ?", [Number(user.id)]);
    const profile = getProfileCompletion(dbUser);
    if (!profile.isComplete) {
      throw new Error(`Citizen profile incomplete. Missing: ${profile.missing.join(", ")}`);
    }
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();
    const complaintDate = String(body.complaintDate || "").trim();
    const complaintLocation = String(body.complaintLocation || "").trim();
    const complaintType = String(body.complaintType || "").trim();
    if (!title) throw new Error("Complaint title is required");
    if (!details) throw new Error("Complaint details are required");
    if (!complaintDate) throw new Error("Complaint date is required");
    if (!complaintLocation && !complaintType) throw new Error("Complaint must include a location or type");

    const now = ts();
    const complaintCode = nextCode("COMP", "complaints");
    execute(
      `INSERT INTO complaints (
        complaintId,citizenId,citizenSnapshot,title,details,complaintDate,complaintLocation,complaintType,attachments,resolutionDocs,status,assignedAdminUserId,assignedAdminName,referralAdminUserId,department,officerName,officerContact,manualContact,callScheduledAt,callOutcome,escalatedMeetingRequestId,statusReason,reopenedCount,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        complaintCode,
        Number(user.id),
        JSON.stringify(getCitizenSnapshot(dbUser)),
        title,
        details,
        complaintDate,
        complaintLocation,
        complaintType,
        JSON.stringify(body.attachments || []),
        JSON.stringify([]),
        "pooled",
        null,
        "",
        null,
        "",
        "",
        "",
        "",
        "",
        "",
        null,
        "Citizen submitted complaint into the common pool.",
        0,
        now,
        now,
      ]
    );
    const complaintRow = queryOne("SELECT * FROM complaints WHERE complaintId = ?", [complaintCode]);
    addLog("complaint", complaintRow.id, "Complaint submitted", details, user);
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Complaint Submitted",
      `New complaint ${complaintCode} submitted by ${user.name}.`,
      `/cases/complaint/${complaintRow.id}`
    );
    return { complaint: buildComplaint(complaintRow) };
  },

  myItems: async () => {
    await getDb();
    const user = requireRole("citizen");
    return {
      meetings: queryAll("SELECT * FROM meeting_requests WHERE citizenId = ? ORDER BY createdAt DESC", [Number(user.id)]).map(buildMeetingRequest),
      complaints: queryAll("SELECT * FROM complaints WHERE citizenId = ? ORDER BY createdAt DESC", [Number(user.id)]).map(buildComplaint),
    };
  },
};

export const workItemsApi = {
  list: async () => {
    await getDb();
    const user = requireRole("admin");
    return {
      meetingRequests: queryAll("SELECT * FROM meeting_requests ORDER BY updatedAt DESC, createdAt DESC").map(buildMeetingRequest),
      complaints: queryAll("SELECT * FROM complaints ORDER BY updatedAt DESC, createdAt DESC").map(buildComplaint),
      myAdminId: Number(user.id),
      admins: getAdminUsers().map((item) => ({ id: String(item.id), name: item.name, department: item.department })),
    };
  },

  getMeetingRequest: async (id) => {
    await getDb();
    requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    if (!row) throw new Error("Meeting request not found");
    return { meetingRequest: buildMeetingRequest(row) };
  },

  getComplaint: async (id) => {
    await getDb();
    requireRole("admin");
    const row = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    if (!row) throw new Error("Complaint not found");
    return {
      complaint: buildComplaint(row),
      contacts: queryAll("SELECT * FROM department_contacts ORDER BY department, officerName ASC"),
      admins: getAdminUsers().map((item) => ({ id: String(item.id), name: item.name, department: item.department })),
    };
  },

  markMeetingVerificationNeeded: async (id, notes) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["submitted", "under_review"], "Only newly submitted or under-review meetings can be sent for verification");
    updateMeetingOwnership(row, user);
    execute(
      "UPDATE meeting_requests SET status='verification_needed', adminNotes=?, statusReason=?, updatedAt=? WHERE id=?",
      [notes || row.adminNotes || "", String(notes || "").trim() || "Admin requested a verification call.", ts(), Number(id)]
    );
    const updated = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    const snapshot = parseJson(updated?.citizenSnapshot, {});
    const phone = snapshot.phoneNumbers?.[0] || "No phone available";
    addLog("meeting_request", id, "Verification requested", notes || "", user);
    addNotificationForUsers(
      getDeoUsers().map((deo) => deo.id),
      "Verification Needed",
      `Call citizen ${snapshot.citizenId || "Unknown"} on ${phone} for meeting ${updated?.requestId || ""}.`,
      `/cases/meeting/${id}?action=logVerification`
    );
    return workItemsApi.getMeetingRequest(id);
  },

  logMeetingVerificationOutcome: async (id, outcome) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["verification_needed"], "Only verification-pending meetings can record a verification outcome");
    if (!String(outcome || "").trim()) throw new Error("Verification call outcome is required");
    updateMeetingOwnership(row, user);
    execute(
      "UPDATE meeting_requests SET status='under_review', verificationOutcome=?, statusReason=?, updatedAt=? WHERE id=?",
      [String(outcome).trim(), "Verification completed; request returned to admin review.", ts(), Number(id)]
    );
    addLog("meeting_request", id, "Verification completed", outcome, user);
    return workItemsApi.getMeetingRequest(id);
  },

  approveMeetingRequest: async (id, payload = {}) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["under_review"], "Only under-review meetings can be approved");
    const priority = String(payload.priority || row.priority || "MEDIUM").trim().toUpperCase();
    const priorityReason = String(payload.priorityReason || row.priorityReason || "").trim();
    const adminNotes = String(payload.adminNotes || "").trim();
    if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) throw new Error("Priority must be Low, Medium, or High");
    requireHighPriorityReason(priority, priorityReason);
    updateMeetingOwnership(row, user);
    execute(
      `UPDATE meeting_requests
       SET status='approved', priority=?, priorityReason=?, adminNotes=?, statusReason=?, updatedAt=?
       WHERE id=?`,
      [
        priority,
        priorityReason,
        adminNotes,
        "Approved by admin; scheduling is the next required step.",
        ts(),
        Number(id),
      ]
    );
    const updated = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    addLog("meeting_request", id, "Meeting approved", `${priority}${priorityReason ? ` · ${priorityReason}` : ""}`, user);
    addNotificationForUsers([updated.citizenId], "Meeting Request", `Your request ${updated.requestId} was approved and is awaiting schedule confirmation.`, "/meetings");
    return workItemsApi.getMeetingRequest(id);
  },

  scheduleMeetingRequest: async (id, payload) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["approved", "scheduled"], "Only approved or already scheduled meetings can be scheduled or rescheduled");
    const date = String(payload.scheduleDate || "").trim();
    const time = String(payload.scheduleTime || "").trim();
    const location = String(payload.scheduleLocation || "").trim();
    const priority = String(payload.priority || row.priority || "MEDIUM").trim().toUpperCase();
    const priorityReason = String(payload.priorityReason || row.priorityReason || "").trim();
    const adminNotes = String(payload.adminNotes || row.adminNotes || "").trim();
    if (!date || !time || !location) throw new Error("Date, time, and location are required");
    if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) throw new Error("Priority must be Low, Medium, or High");
    requireHighPriorityReason(priority, priorityReason);
    updateMeetingOwnership(row, user);
    const visitorId = row.visitorId || `VIS-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
    const meetingDocket = row.meetingDocket || `DOC-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
    execute(
      `UPDATE meeting_requests
       SET status='scheduled', scheduleDate=?, scheduleTime=?, scheduleLocation=?, priority=?, priorityReason=?, visitorId=?, meetingDocket=?, adminNotes=?, statusReason=?, executionStatus='pending', updatedAt=?
       WHERE id=?`,
      [
        date,
        time,
        location,
        priority,
        priorityReason,
        visitorId,
        meetingDocket,
        adminNotes,
        row.status === "scheduled" ? "Meeting schedule updated by admin." : "Meeting scheduled and citizen pass ready.",
        ts(),
        Number(id),
      ]
    );
    const updated = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    addLog("meeting_request", id, row.status === "scheduled" ? "Meeting rescheduled" : "Meeting scheduled", `${date} ${time} at ${location}`, user);
    addNotificationForUsers([updated.citizenId], "Calendar Update", `Your meeting ${updated.requestId} has been scheduled. Download your meeting pass from the Meetings page.`, "/meetings");
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Calendar Update",
      `${updated.requestId} was scheduled by ${user.name} for ${date} ${time}.`,
      `/cases/meeting/${id}`
    );
    if (priority === "HIGH") {
      addNotificationForUsers(
        getMinisterUsers().map((minister) => minister.id),
        "Calendar Update",
        `A high-priority minister meeting ${updated.requestId} was scheduled for ${date} ${time}.`,
        "/minister/calendar"
      );
    }
    return workItemsApi.getMeetingRequest(id);
  },

  rejectMeetingRequest: async (id, reason) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["submitted", "verification_needed", "under_review", "approved"], "Rejected meetings must still be in the review pipeline");
    const rejectReason = String(reason || "").trim();
    if (!rejectReason) throw new Error("Rejection reason is required");
    updateMeetingOwnership(row, user);
    execute(
      "UPDATE meeting_requests SET status='rejected', rejectReason=?, statusReason=?, updatedAt=? WHERE id=?",
      [rejectReason, "Meeting rejected during admin review.", ts(), Number(id)]
    );
    addLog("meeting_request", id, "Meeting rejected", rejectReason, user);
    addNotificationForUsers([row.citizenId], "Meeting Request", `Your meeting request ${row.requestId} was rejected.`, "/meetings");
    return workItemsApi.getMeetingRequest(id);
  },

  revertMeetingApproval: async (id, reason) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["approved"], "Only approved but not yet scheduled meetings can be reverted");
    const notes = String(reason || "").trim();
    if (!notes) throw new Error("A reason is required to revert approval");
    execute(
      "UPDATE meeting_requests SET status='under_review', statusReason=?, updatedAt=? WHERE id=?",
      [notes, ts(), Number(id)]
    );
    addLog("meeting_request", id, "Approval reverted", notes, user);
    return workItemsApi.getMeetingRequest(id);
  },

  cancelScheduledMeeting: async (id, reason) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["scheduled"], "Only scheduled meetings can be cancelled");
    const notes = String(reason || "").trim();
    if (!notes) throw new Error("Cancellation reason is required");
    execute(
      "UPDATE meeting_requests SET executionStatus='cancelled', statusReason=?, updatedAt=? WHERE id=?",
      [notes, ts(), Number(id)]
    );
    addLog("meeting_request", id, "Scheduled meeting cancelled", notes, user);
    addNotificationForUsers([row.citizenId], "Calendar Update", `Meeting ${row.requestId} was cancelled.`, "/meetings");
    return workItemsApi.getMeetingRequest(id);
  },

  markMeetingCompleted: async (id, notes) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["scheduled"], "Only scheduled meetings can be marked completed");
    execute(
      "UPDATE meeting_requests SET executionStatus='completed', statusReason=?, updatedAt=? WHERE id=?",
      [String(notes || "").trim() || "Meeting completed successfully.", ts(), Number(id)]
    );
    addLog("meeting_request", id, "Meeting completed", notes || "", user);
    return workItemsApi.getMeetingRequest(id);
  },

  markMeetingNoShow: async (id, notes) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    assertMeetingTransition(row, ["scheduled"], "Only scheduled meetings can be marked no-show");
    const message = String(notes || "").trim();
    if (!message) throw new Error("Reason is required to mark a meeting as no-show");
    execute(
      "UPDATE meeting_requests SET executionStatus='no_show', statusReason=?, updatedAt=? WHERE id=?",
      [message, ts(), Number(id)]
    );
    addLog("meeting_request", id, "Citizen marked no-show", message, user);
    return workItemsApi.getMeetingRequest(id);
  },

  assignComplaintToSelf: async (id) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    if (!row) throw new Error("Complaint not found");
    if (row.assignedAdminUserId && Number(row.assignedAdminUserId) !== Number(user.id)) {
      throw new Error("This complaint is already assigned to another admin");
    }
    execute(
      "UPDATE complaints SET assignedAdminUserId=?, assignedAdminName=?, status='assigned', statusReason=?, updatedAt=? WHERE id=?",
      [Number(user.id), user.name, `Assigned to ${user.name} for direct handling.`, ts(), Number(id)]
    );
    addLog("complaint", id, "Complaint assigned", `Assigned to ${user.name}`, user);
    return workItemsApi.getComplaint(id);
  },

  reassignComplaint: async (id, adminUserId, reason) => {
    await getDb();
    const user = requireRole("admin");
    const complaint = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    if (!complaint) throw new Error("Complaint not found");
    const target = queryOne("SELECT * FROM users WHERE id = ? AND role='admin'", [Number(adminUserId)]);
    if (!target) throw new Error("Target admin not found");
    const notes = String(reason || "").trim();
    if (!notes) throw new Error("Reassignment reason is required");
    execute(
      "UPDATE complaints SET assignedAdminUserId=?, assignedAdminName=?, statusReason=?, updatedAt=? WHERE id=?",
      [Number(target.id), target.name, notes, ts(), Number(id)]
    );
    addLog("complaint", id, "Complaint reassigned", `${user.name} -> ${target.name} · ${notes}`, user);
    addNotificationForUsers([target.id], "Complaint Assigned", `Complaint ${complaint.complaintId} was reassigned to you.`, `/cases/complaint/${id}`);
    return workItemsApi.getComplaint(id);
  },

  updateComplaintDepartment: async (id, payload) => {
    await getDb();
    const user = requireRole("admin");
    const department = String(payload.department || "").trim();
    const officerName = String(payload.officerName || "").trim();
    const officerContact = String(payload.officerContact || "").trim();
    const manualContact = String(payload.manualContact || "").trim();
    if (!department) throw new Error("Department is required");
    if (!officerName && !manualContact) throw new Error("Select an officer or enter manual contact");
    execute(
      `UPDATE complaints
       SET department=?, officerName=?, officerContact=?, manualContact=?, status='department_contact_identified', statusReason=?, updatedAt=?
       WHERE id=?`,
      [
        department,
        officerName,
        officerContact,
        manualContact,
        `Department contact identified for ${department}.`,
        ts(),
        Number(id),
      ]
    );
    addLog("complaint", id, "Department contact identified", `${department} / ${officerName || manualContact}`, user);
    return workItemsApi.getComplaint(id);
  },

  scheduleComplaintCall: async (id, callScheduledAt) => {
    await getDb();
    const user = requireRole("admin");
    if (!String(callScheduledAt || "").trim()) throw new Error("Call schedule is required");
    execute(
      "UPDATE complaints SET callScheduledAt=?, status='call_scheduled', statusReason=?, updatedAt=? WHERE id=?",
      [callScheduledAt, "Department follow-up call scheduled.", ts(), Number(id)]
    );
    addLog("complaint", id, "Department call scheduled", callScheduledAt, user);
    return workItemsApi.getComplaint(id);
  },

  logComplaintCallOutcome: async (id, outcome) => {
    await getDb();
    const user = requireRole("admin");
    const notes = String(outcome || "").trim();
    if (!notes) throw new Error("Call outcome is required");
    execute(
      "UPDATE complaints SET callOutcome=?, status='followup_in_progress', statusReason=?, updatedAt=? WHERE id=?",
      [notes, "Department follow-up is in progress.", ts(), Number(id)]
    );
    addLog("complaint", id, "Department call outcome logged", notes, user);
    return workItemsApi.getComplaint(id);
  },

  resolveComplaint: async (id, payload) => {
    await getDb();
    const user = requireRole("admin");
    const resolutionSummary = String(payload.resolutionSummary || "").trim();
    if (!resolutionSummary && !(payload.resolutionDocs || []).length) {
      throw new Error("Provide a resolution reason or upload resolution documents");
    }
    execute(
      "UPDATE complaints SET status='resolved', resolutionDocs=?, resolutionSummary=?, statusReason=?, updatedAt=? WHERE id=?",
      [JSON.stringify(payload.resolutionDocs || []), resolutionSummary, "Complaint resolved; awaiting closure confirmation.", ts(), Number(id)]
    );
    const row = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    addLog("complaint", id, "Complaint resolved", resolutionSummary || "Resolution documents added", user);
    addNotificationForUsers([row.citizenId], "Complaint Submitted", `Complaint ${row.complaintId} has been resolved.`, "/my-cases");
    return workItemsApi.getComplaint(id);
  },

  closeComplaintCase: async (id) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    if (!row) throw new Error("Complaint not found");
    if (row.status !== "resolved") throw new Error("Only resolved complaints can be closed");
    execute("UPDATE complaints SET status='completed', statusReason=?, updatedAt=? WHERE id=?", ["Complaint closed after resolution.", ts(), Number(id)]);
    addLog("complaint", id, "Case closed", "Complaint moved to completed cases", user);
    addNotificationForUsers([row.citizenId], "Complaint Submitted", `Complaint ${row.complaintId} has been closed after resolution.`, "/my-cases");
    return workItemsApi.getComplaint(id);
  },

  reopenComplaint: async (id, reason) => {
    await getDb();
    const user = requireRole("admin");
    const row = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    if (!row) throw new Error("Complaint not found");
    if (!["resolved", "completed", "escalated_to_admin_meeting"].includes(row.status)) {
      throw new Error("Only resolved, completed, or escalated complaints can be reopened");
    }
    const notes = String(reason || "").trim();
    if (!notes) throw new Error("Reopen reason is required");
    execute(
      "UPDATE complaints SET status='assigned', statusReason=?, reopenedCount=COALESCE(reopenedCount,0)+1, updatedAt=? WHERE id=?",
      [notes, ts(), Number(id)]
    );
    addLog("complaint", id, "Complaint reopened", notes, user);
    return workItemsApi.getComplaint(id);
  },

  escalateComplaintToMeeting: async (id, payload) => {
    await getDb();
    const user = requireRole("admin");
    const complaint = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    if (!complaint) throw new Error("Complaint not found");
    if (complaint.escalatedMeetingRequestId) {
      const existingMeeting = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(complaint.escalatedMeetingRequestId)]);
      if (existingMeeting && !["rejected"].includes(existingMeeting.status) && existingMeeting.executionStatus !== "cancelled") {
        throw new Error("This complaint already has an active escalated meeting");
      }
    }
    const purpose = String(payload.purpose || "").trim() || `Escalated from complaint ${complaint.complaintId}`;
    const requestId = nextCode("MREQ", "meeting_requests");
    execute(
      `INSERT INTO meeting_requests (
        requestId,citizenId,citizenSnapshot,purpose,referralAdminUserId,referralAdminName,assignedAdminUserId,assignedAdminName,attachments,status,verificationOutcome,rejectReason,scheduleDate,scheduleTime,scheduleLocation,priority,priorityReason,visitorId,meetingDocket,adminNotes,statusReason,executionStatus,escalatedFromComplaintId,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        requestId,
        complaint.citizenId,
        complaint.citizenSnapshot,
        purpose,
        Number(user.id),
        user.name,
        Number(user.id),
        user.name,
        JSON.stringify([]),
        "submitted",
        "",
        "",
        "",
        "",
        "",
        "MEDIUM",
        "",
        "",
        "",
        "Complaint escalated into meeting workflow.",
        "Complaint requires a meeting-based intervention.",
        "pending",
        Number(id),
        ts(),
        ts(),
      ]
    );
    const meetingRequestRow = queryOne("SELECT * FROM meeting_requests WHERE requestId = ?", [requestId]);
    execute(
      "UPDATE complaints SET status='escalated_to_admin_meeting', escalatedMeetingRequestId=?, statusReason=?, updatedAt=? WHERE id=?",
      [meetingRequestRow.id, "Complaint moved into linked meeting workflow.", ts(), Number(id)]
    );
    addLog("complaint", id, "Escalated to admin meeting", purpose, user);
    addLog("meeting_request", meetingRequestRow.id, "Meeting created from complaint escalation", complaint.complaintId, user);
    addNotificationForUsers([complaint.citizenId], "Meeting Request", `Complaint ${complaint.complaintId} has been escalated to an admin meeting review.`, "/my-cases");
    return {
      complaint: buildComplaint(queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)])),
      meetingRequest: buildMeetingRequest(meetingRequestRow),
    };
  },

  buildCaseSummary: async (itemType, id) => {
    await getDb();
    requireRole("admin");
    const item = itemType === "meeting"
      ? buildMeetingRequest(queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]))
      : buildComplaint(queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]));
    if (!item) throw new Error("Case not found");
    return {
      title: itemType === "meeting" ? item.purpose : item.title,
      rows: buildCaseSummaryRows(itemType, item),
      timeline: item.masterTimeline || [],
    };
  },
};

export const meetingsApi = {
  list: async () => {
    await getDb();
    const user = requireUser();
    if (user.role === "deo") {
      return { events: queryAll("SELECT * FROM calendar_events ORDER BY scheduleAt DESC").map(buildCalendarEvent) };
    }
    if (user.role === "admin") {
      return { meetings: queryAll("SELECT * FROM meeting_requests ORDER BY createdAt DESC").map(buildMeetingRequest) };
    }
    return {
      meetings: queryAll("SELECT * FROM meeting_requests WHERE citizenId=? ORDER BY createdAt DESC", [Number(user.id)]).map(buildMeetingRequest),
    };
  },
};

export const calendarApi = {
  list: async () => {
    await getDb();
    requireRole("deo");
    return { events: queryAll("SELECT * FROM calendar_events ORDER BY scheduleAt DESC").map(buildCalendarEvent) };
  },

  create: async (body) => {
    await getDb();
    const user = requireRole("deo");
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();
    const eventType = String(body.eventType || "").trim();
    const scheduleAt = String(body.scheduleAt || "").trim();
    const endAt = String(body.endAt || "").trim();
    if (!title || !details || !eventType || !scheduleAt || !endAt) {
      throw new Error("Title, details, event type, start time, and end time are required");
    }
    const durationMinutes = Math.max(0, Math.round((new Date(endAt) - new Date(scheduleAt)) / 60000));
    const classification = classifyEvent({ ...body, eventType });
    const attendanceStatus = body.attendanceStatus || "planned";
    const productivityScore = attendanceStatus === "attended"
      ? calculateProductivityScore({ ...body, classification, durationMinutes })
      : 0;
    const createdAt = ts();
    execute(
      `INSERT INTO calendar_events (
        title,details,eventType,scheduleAt,endAt,durationMinutes,department,mediaFolder,photos,documents,videoLink,attendanceStatus,attendedAt,classification,participationRole,portfolio,productivityScore,createdByUserId,createdByName,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title,
        details,
        eventType,
        scheduleAt,
        endAt,
        durationMinutes,
        body.department || "",
        body.mediaFolder || "",
        JSON.stringify(body.photos || []),
        JSON.stringify(body.documents || []),
        body.videoLink || "",
        attendanceStatus,
        attendanceStatus === "attended" ? ts() : "",
        classification,
        body.participationRole || "Attendee",
        body.portfolio || "Neither",
        productivityScore,
        Number(user.id),
        user.name,
        createdAt,
        createdAt,
      ]
    );
    const eventRow = queryOne(
      "SELECT * FROM calendar_events WHERE title = ? AND createdByUserId = ? AND createdAt = ?",
      [title, Number(user.id), createdAt]
    );
    addNotificationForUsers(getAdminUsers().map((admin) => admin.id), "Calendar Update", `${title} was added to the calendar.`, "/meetings");
    addNotificationForUsers(getMinisterUsers().map((minister) => minister.id), "Calendar Update", `${title} was added to the minister calendar.`, "/minister/calendar");
    return { event: buildCalendarEvent(eventRow) };
  },

  markAttended: async (id) => {
    await getDb();
    requireRole("deo");
    const row = queryOne("SELECT * FROM calendar_events WHERE id = ?", [Number(id)]);
    if (!row) throw new Error("Event not found");
    const classification = classifyEvent(row);
    const productivityScore = calculateProductivityScore({ ...row, classification });
    execute(
      `UPDATE calendar_events
       SET attendanceStatus='attended', attendedAt=?, classification=?, productivityScore=?, updatedAt=?
       WHERE id=?`,
      [ts(), classification, productivityScore, ts(), Number(id)]
    );
    addNotificationForUsers(getAdminUsers().map((admin) => admin.id), "Calendar Update", `${row.title} was marked attended.`, "/dashboard");
    addNotificationForUsers(getMinisterUsers().map((minister) => minister.id), "Calendar Update", `${row.title} attendance was marked and is now available on the minister dashboard.`, "/minister/dashboard");
    return { event: buildCalendarEvent(queryOne("SELECT * FROM calendar_events WHERE id = ?", [Number(id)])) };
  },
};

export const notificationsApi = {
  list: async () => {
    await getDb();
    const user = requireUser();
    const notifications = queryAll("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC", [Number(user.id)]).map((item) => ({
      ...item,
      isRead: !!item.isRead,
    }));
    return {
      notifications,
      unreadCount: notifications.filter((item) => !item.isRead).length,
    };
  },

  markRead: async (id) => {
    await getDb();
    requireUser();
    execute("UPDATE notifications SET isRead = 1 WHERE id = ?", [Number(id)]);
  },

  markAllRead: async () => {
    await getDb();
    const user = requireUser();
    execute("UPDATE notifications SET isRead = 1 WHERE userId = ?", [Number(user.id)]);
  },
};

export const dashboardApi = {
  stats: async () => {
    await getDb();
    requireRole("admin");
    const events = queryAll("SELECT * FROM calendar_events").map(buildCalendarEvent);
    const complaints = queryAll("SELECT * FROM complaints").map(buildComplaint);
    const meetings = queryAll("SELECT * FROM meeting_requests").map(buildMeetingRequest);
    const analytics = buildAnalytics(events, complaints, meetings);
    const operations = buildOperationalMetrics(complaints, meetings);
    const today = new Date().toISOString().slice(0, 10);
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    const weekKey = weekStart.toISOString().slice(0, 10);
    const monthPrefix = new Date().toISOString().slice(0, 7);
    return {
      analytics,
      operations,
      totalCases: complaints.length + meetings.length,
      resolved: complaints.filter((item) => item.status === "resolved").length,
      scheduled: meetings.filter((item) => item.status === "scheduled" && item.executionStatus === "pending").length,
      dailyScore: analytics.dailyScores.find((row) => row.date === today)?.score || 0,
      weeklyScore: analytics.weeklyScores.find((row) => row.week === weekKey)?.score || 0,
      monthlyScore: analytics.monthlyScores.find((row) => row.month === monthPrefix)?.score || 0,
    };
  },
};

export const ministerViewApi = {
  dashboard: async () => {
    await getDb();
    requireRole("minister");
    const events = queryAll("SELECT * FROM calendar_events ORDER BY scheduleAt DESC").map(buildCalendarEvent);
    const scheduledMeetings = queryAll("SELECT * FROM meeting_requests WHERE status='scheduled' AND priority='HIGH' AND executionStatus='pending' ORDER BY scheduleDate ASC, scheduleTime ASC").map(buildMeetingRequest);
    const complaints = queryAll("SELECT * FROM complaints").map(buildComplaint);
    const analytics = buildAnalytics(events, complaints, scheduledMeetings);
    const operations = buildOperationalMetrics(complaints, queryAll("SELECT * FROM meeting_requests").map(buildMeetingRequest));
    const upcomingAgenda = [
      ...events.map((event) => ({
        id: `event-${event._id}`,
        title: event.title,
        when: event.scheduleAt,
        type: event.eventType,
        location: event.department || event.mediaFolder || "",
      })),
      ...scheduledMeetings.map((meeting) => ({
        id: `meeting-${meeting._id}`,
        title: meeting.purpose,
        when: `${meeting.scheduleDate}T${meeting.scheduleTime || "09:00"}`,
        type: "Minister Meeting",
        location: meeting.scheduleLocation || "",
      })),
    ]
      .sort((a, b) => new Date(a.when) - new Date(b.when))
      .slice(0, 8);

    return {
      analytics,
      operations,
      totalEvents: events.length,
      attendedEvents: events.filter((event) => event.attendanceStatus === "attended").length,
      scheduledMeetings: scheduledMeetings.length,
      invitedEvents: events.filter((event) => event.eventType === "Invited Event").length,
      upcomingAgenda,
    };
  },

  calendar: async () => {
    await getDb();
    requireRole("minister");
    const events = queryAll("SELECT * FROM calendar_events ORDER BY scheduleAt DESC").map(buildCalendarEvent);
    const meetings = queryAll("SELECT * FROM meeting_requests WHERE status='scheduled' AND priority='HIGH' AND executionStatus='pending' ORDER BY scheduleDate ASC, scheduleTime ASC").map(buildMeetingRequest);
    const calendarItems = [
      ...events.map((event) => ({
        id: `event-${event._id}`,
        sourceKind: "deo_event",
        sourceId: event._id,
        title: event.title,
        details: event.details,
        type: event.eventType,
        startsAt: event.scheduleAt,
        endsAt: event.endAt,
        location: event.department || event.mediaFolder || "",
        source: "DEO Calendar",
        videoLink: event.videoLink || "",
        files: [...(event.documents || []), ...(event.photos || [])],
      })),
      ...meetings.map((meeting) => ({
        id: `meeting-${meeting._id}`,
        sourceKind: "minister_meeting",
        sourceId: meeting._id,
        title: meeting.purpose,
        details: buildMeetingCalendarDetails(meeting),
        type: "Minister Meeting",
        startsAt: `${meeting.scheduleDate}T${meeting.scheduleTime || "09:00"}`,
        endsAt: `${meeting.scheduleDate}T${meeting.scheduleTime || "09:30"}`,
        location: meeting.scheduleLocation || "",
        source: "Approved Meeting Request",
        videoLink: "",
        files: meeting.attachment ? [meeting.attachment] : [],
      })),
    ].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    return { calendarItems };
  },

  updateCalendarItem: async (payload) => {
    await getDb();
    requireRole("minister");
    const sourceKind = payload?.sourceKind;
    const sourceId = Number(payload?.sourceId || 0);
    if (!sourceKind || !sourceId) throw new Error("Calendar item reference is required");

    if (sourceKind === "deo_event") {
      execute(
        `UPDATE calendar_events
         SET title=?, details=?, scheduleAt=?, endAt=?, department=?, updatedAt=?
         WHERE id=?`,
        [
          String(payload.title || "").trim(),
          String(payload.details || "").trim(),
          String(payload.startsAt || "").trim(),
          String(payload.endsAt || "").trim(),
          String(payload.location || "").trim(),
          ts(),
          sourceId,
        ]
      );
    } else if (sourceKind === "minister_meeting") {
      const startsAt = new Date(payload.startsAt);
      if (Number.isNaN(startsAt.getTime())) throw new Error("A valid meeting start time is required");
      execute(
        `UPDATE meeting_requests
         SET purpose=?, scheduleDate=?, scheduleTime=?, scheduleLocation=?, adminNotes=?, updatedAt=?
         WHERE id=?`,
        [
          String(payload.title || "").trim(),
          localDatePart(startsAt),
          localTimePart(startsAt),
          String(payload.location || "").trim(),
          String(payload.details || "").trim(),
          ts(),
          sourceId,
        ]
      );
    } else {
      throw new Error("Unsupported calendar item type");
    }

    return ministerViewApi.calendar();
  },
};

export const adminViewApi = {
  calendar: async () => {
    await getDb();
    const user = requireRole("admin");
    const meetings = queryAll(
      "SELECT * FROM meeting_requests WHERE status='scheduled' AND executionStatus='pending' AND referralAdminUserId=? ORDER BY scheduleDate ASC, scheduleTime ASC",
      [Number(user.id)]
    ).map(buildMeetingRequest);

    const calendarItems = meetings.map((meeting) => ({
      id: `meeting-${meeting._id}`,
      sourceKind: "admin_meeting",
      sourceId: meeting._id,
      title: meeting.purpose,
      details: buildMeetingCalendarDetails(meeting),
      type: "Scheduled Meeting",
      startsAt: `${meeting.scheduleDate}T${meeting.scheduleTime || "09:00"}`,
      endsAt: `${meeting.scheduleDate}T${meeting.scheduleTime || "09:30"}`,
      location: meeting.scheduleLocation || "",
      source: "My Scheduled Meetings",
    }));

    return { calendarItems };
  },

  updateCalendarItem: async (payload) => {
    await getDb();
    const user = requireRole("admin");
    const sourceId = Number(payload?.sourceId || 0);
    if (!sourceId) throw new Error("Meeting reference is required");
    const existing = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [sourceId]);
    if (!existing) throw new Error("Meeting not found");
    if (Number(existing.referralAdminUserId || 0) !== Number(user.id)) {
      throw new Error("You can only edit meetings in your own calendar");
    }
    const startsAt = new Date(payload.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new Error("A valid meeting start time is required");
    execute(
      `UPDATE meeting_requests
       SET purpose=?, scheduleDate=?, scheduleTime=?, scheduleLocation=?, adminNotes=?, updatedAt=?
       WHERE id=?`,
      [
        String(payload.title || "").trim(),
        localDatePart(startsAt),
        localTimePart(startsAt),
        String(payload.location || "").trim(),
        String(payload.details || "").trim(),
        ts(),
        sourceId,
      ]
    );
    return adminViewApi.calendar();
  },
};

export const casesApi = {
  list: async () => {
    await getDb();
    const complaints = queryAll("SELECT * FROM complaints ORDER BY createdAt DESC").map(buildComplaint).map((item) => ({
      _id: item._id,
      caseId: item.complaintId,
      purpose: item.title,
      status: item.status.toUpperCase(),
      urgency: item.relatedMeeting?.status === "scheduled" ? "HIGH" : item.department ? "MEDIUM" : "LOW",
      citizenSnapshot: item.citizenSnapshot,
      createdAt: item.createdAt,
      assignments: item.assignedAdminUserId ? [{ dueDate: item.callScheduledAt || "", status: item.status }] : [],
    }));
    const meetings = queryAll("SELECT * FROM meeting_requests ORDER BY createdAt DESC").map(buildMeetingRequest).map((item) => ({
      _id: item._id,
      caseId: item.requestId,
      purpose: item.purpose,
      status: item.status.toUpperCase(),
      urgency: item.priority || "MEDIUM",
      citizenSnapshot: item.citizenSnapshot,
      createdAt: item.createdAt,
      assignments: item.scheduleDate ? [{ dueDate: `${item.scheduleDate}T${item.scheduleTime || "09:00"}`, status: getMeetingOperationalState(item) }] : [],
    }));
    return { cases: [...complaints, ...meetings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
  },
};
