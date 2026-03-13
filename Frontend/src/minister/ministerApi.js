import { getDb, queryAll, queryOne, execute } from "../db/database";
import { calculateProductivityScore, classifyEvent, buildAnalytics } from "../utils/analytics";

function ts() {
  return new Date().toISOString();
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("hcm_user"));
  } catch {
    return null;
  }
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

function getCitizenSnapshot(user) {
  return {
    name: user.name,
    citizenId: user.citizenId,
    aadhaar: maskAadhaar(user.aadhaar),
    phoneNumbers: parseJson(user.phoneNumbers, []),
  };
}

function humanizeStatus(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function nextCode(prefix, table, column) {
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

function getAdminUsers() {
  return queryAll("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC");
}

function getMinisterUsers() {
  return queryAll("SELECT * FROM users WHERE role = 'minister' ORDER BY id ASC");
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

function buildMeetingRequest(row) {
  if (!row) return null;
  return {
    ...row,
    citizenSnapshot: parseJson(row.citizenSnapshot, {}),
    attachment: row.attachmentData
      ? { name: row.attachmentName, type: row.attachmentType, data: row.attachmentData }
      : null,
    logs: queryAll(
      "SELECT * FROM activity_logs WHERE entityType='meeting_request' AND entityId=? ORDER BY createdAt DESC",
      [row.id]
    ),
    statusLabel: humanizeStatus(row.status),
  };
}

function buildComplaint(row) {
  if (!row) return null;
  return {
    ...row,
    citizenSnapshot: parseJson(row.citizenSnapshot, {}),
    attachments: parseJson(row.attachments, []),
    resolutionDocs: parseJson(row.resolutionDocs, []),
    logs: queryAll(
      "SELECT * FROM activity_logs WHERE entityType='complaint' AND entityId=? ORDER BY createdAt DESC",
      [row.id]
    ),
    statusLabel: humanizeStatus(row.status),
  };
}

function buildCalendarEvent(row) {
  if (!row) return null;
  return {
    ...row,
    photos: parseJson(row.photos, []),
    documents: parseJson(row.documents, []),
  };
}

export const authApi = {
  login: async (email, password) => {
    await getDb();
    const user = queryOne("SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND role IN ('admin','minister','deo')", [email.trim()]);
    if (!user || user.password !== password) throw new Error("Invalid email or password");
    return {
      token: `local-${user.id}`,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    };
  },

  loginByCitizenId: async (citizenId) => {
    await getDb();
    const user = queryOne(
      "SELECT * FROM users WHERE citizenId = ? AND role = 'citizen' AND isVerified = 1",
      [citizenId.trim().toUpperCase()]
    );
    if (!user) throw new Error("No verified citizen found for this Citizen ID");
    return {
      token: `local-${user.id}`,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        citizenId: user.citizenId,
      },
    };
  },

  register: async (body) => {
    await getDb();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const aadhaar = String(body.aadhaar || "").replace(/\D/g, "");
    const phones = normalizePhones(body);

    if (!name) throw new Error("Name is required");
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) throw new Error("Aadhaar must be exactly 12 digits");
    if (phones.length === 0 || phones.length > 3) throw new Error("Provide between 1 and 3 phone numbers");
    if (phones.some((phone) => !/^[6-9]\d{9}$/.test(phone))) throw new Error("Phone numbers must be valid 10-digit mobile numbers");

    const existing = queryOne("SELECT id FROM users WHERE aadhaar = ?", [aadhaar]);
    if (existing) throw new Error("A citizen is already registered with this Aadhaar");

    const citizenId = nextCode("CTZ-HP", "users", "citizenId");
    const now = ts();
    execute(
      `INSERT INTO users (
        name,email,password,aadhaar,phonePrimary,phoneSecondary,phoneTertiary,phoneNumbers,citizenId,role,department,isVerified,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
      [
        name,
        email || `${citizenId.toLowerCase()}@demo.local`,
        "",
        aadhaar,
        phones[0] || "",
        phones[1] || "",
        phones[2] || "",
        JSON.stringify(phones),
        citizenId,
        "citizen",
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
    return { citizenId: user.citizenId, name: user.name };
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
    const purpose = String(body.purpose || "").trim();
    const referralAdminUserId = Number(body.referralAdminUserId || 0);
    const referralAdmin = queryOne("SELECT * FROM users WHERE id = ? AND role = 'admin'", [referralAdminUserId]);
    if (!purpose) throw new Error("Purpose of meeting is required");
    if (!referralAdmin) throw new Error("Select an admin referral");
    const now = ts();
    const requestId = nextCode("MREQ", "meeting_requests");
    execute(
      `INSERT INTO meeting_requests (
        requestId,citizenId,citizenSnapshot,purpose,referralAdminUserId,referralAdminName,attachmentName,attachmentType,attachmentData,status,verificationOutcome,rejectReason,scheduleDate,scheduleTime,scheduleLocation,visitorId,meetingDocket,adminNotes,escalatedFromComplaintId,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        requestId,
        Number(user.id),
        JSON.stringify(getCitizenSnapshot(dbUser)),
        purpose,
        referralAdminUserId,
        referralAdmin.name,
        body.attachment?.name || "",
        body.attachment?.type || "",
        body.attachment?.data || "",
        "submitted",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        body.escalatedFromComplaintId ? Number(body.escalatedFromComplaintId) : null,
        now,
        now,
      ]
    );
    const meetingRow = queryOne("SELECT * FROM meeting_requests WHERE requestId = ?", [requestId]);
    const meetingId = meetingRow?.id;
    addLog("meeting_request", meetingId, "Meeting request submitted", purpose, user);
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Meeting Request",
      `New meeting request submitted by ${user.name}.`,
      `/cases/meeting/${meetingId}`
    );
    return { meetingRequest: buildMeetingRequest(meetingRow) };
  },

  createComplaint: async (body) => {
    await getDb();
    const user = requireRole("citizen");
    const dbUser = queryOne("SELECT * FROM users WHERE id = ?", [Number(user.id)]);
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();
    if (!title) throw new Error("Complaint title is required");
    if (!details) throw new Error("Complaint details are required");
    const now = ts();
    const complaintCode = nextCode("COMP", "complaints");
    execute(
      `INSERT INTO complaints (
        complaintId,citizenId,citizenSnapshot,title,details,attachments,resolutionDocs,status,assignedAdminUserId,assignedAdminName,referralAdminUserId,department,officerName,officerContact,manualContact,callScheduledAt,callOutcome,escalatedMeetingRequestId,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        complaintCode,
        Number(user.id),
        JSON.stringify(getCitizenSnapshot(dbUser)),
        title,
        details,
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
        now,
        now,
      ]
    );
    const complaintRow = queryOne("SELECT * FROM complaints WHERE complaintId = ?", [complaintCode]);
    const complaintId = complaintRow?.id;
    addLog("complaint", complaintId, "Complaint submitted", details, user);
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Complaint Submitted",
      `New complaint submitted by ${user.name}.`,
      `/cases/complaint/${complaintId}`
    );
    return { complaint: buildComplaint(complaintRow) };
  },

  myItems: async () => {
    await getDb();
    const user = requireRole("citizen");
    const meetings = queryAll("SELECT * FROM meeting_requests WHERE citizenId = ? ORDER BY createdAt DESC", [Number(user.id)]).map(buildMeetingRequest);
    const complaints = queryAll("SELECT * FROM complaints WHERE citizenId = ? ORDER BY createdAt DESC", [Number(user.id)]).map(buildComplaint);
    return { meetings, complaints };
  },
};

export const workItemsApi = {
  list: async () => {
    await getDb();
    const user = requireRole("admin");
    const meetingRequests = queryAll("SELECT * FROM meeting_requests ORDER BY createdAt DESC").map(buildMeetingRequest);
    const complaints = queryAll("SELECT * FROM complaints ORDER BY createdAt DESC").map(buildComplaint);
    return {
      meetingRequests,
      complaints,
      myAdminId: Number(user.id),
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
    return { complaint: buildComplaint(row), contacts: queryAll("SELECT * FROM department_contacts ORDER BY department, officerName ASC") };
  },

  markMeetingVerificationNeeded: async (id, notes) => {
    await getDb();
    const user = requireRole("admin");
    execute("UPDATE meeting_requests SET status='verification_needed', adminNotes=?, updatedAt=? WHERE id=?", [notes || "", ts(), Number(id)]);
    addLog("meeting_request", id, "Verification requested", notes || "", user);
    return workItemsApi.getMeetingRequest(id);
  },

  logMeetingVerificationOutcome: async (id, outcome) => {
    await getDb();
    const user = requireRole("admin");
    if (!String(outcome || "").trim()) throw new Error("Verification call outcome is required");
    execute(
      "UPDATE meeting_requests SET status='under_review', verificationOutcome=?, updatedAt=? WHERE id=?",
      [String(outcome).trim(), ts(), Number(id)]
    );
    addLog("meeting_request", id, "Verification completed", outcome, user);
    return workItemsApi.getMeetingRequest(id);
  },

  approveMeetingRequest: async (id, adminNotes = "") => {
    await getDb();
    const user = requireRole("admin");
    execute("UPDATE meeting_requests SET status='approved', adminNotes=?, updatedAt=? WHERE id=?", [adminNotes, ts(), Number(id)]);
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    addLog("meeting_request", id, "Meeting approved", adminNotes, user);
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Calendar Update",
      `${row.requestId} was approved by ${user.name}.`,
      `/cases/meeting/${id}`
    );
    return workItemsApi.getMeetingRequest(id);
  },

  scheduleMeetingRequest: async (id, payload) => {
    await getDb();
    const user = requireRole("admin");
    const date = String(payload.scheduleDate || "").trim();
    const time = String(payload.scheduleTime || "").trim();
    const location = String(payload.scheduleLocation || "").trim();
    if (!date || !time || !location) throw new Error("Date, time, and location are required");
    const visitorId = `VIS-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
    const meetingDocket = `DOC-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
    execute(
      `UPDATE meeting_requests
       SET status='scheduled', scheduleDate=?, scheduleTime=?, scheduleLocation=?, visitorId=?, meetingDocket=?, adminNotes=?, updatedAt=?
       WHERE id=?`,
      [date, time, location, visitorId, meetingDocket, payload.adminNotes || "", ts(), Number(id)]
    );
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    addLog("meeting_request", id, "Meeting scheduled", `${date} ${time} at ${location}`, user);
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Calendar Update",
      `${row.requestId} was scheduled by ${user.name} for ${date} ${time}.`,
      `/cases/meeting/${id}`
    );
    addNotificationForUsers(
      getMinisterUsers().map((minister) => minister.id),
      "Calendar Update",
      `A minister meeting ${row.requestId} was scheduled for ${date} ${time}.`,
      "/minister/calendar"
    );
    addNotificationForUsers([row.citizenId], "Calendar Update", `Your meeting ${row.requestId} has been scheduled.`, "");
    return workItemsApi.getMeetingRequest(id);
  },

  rejectMeetingRequest: async (id, reason) => {
    await getDb();
    const user = requireRole("admin");
    if (!String(reason || "").trim()) throw new Error("Reject reason is required");
    execute("UPDATE meeting_requests SET status='rejected', rejectReason=?, updatedAt=? WHERE id=?", [reason.trim(), ts(), Number(id)]);
    const row = queryOne("SELECT * FROM meeting_requests WHERE id = ?", [Number(id)]);
    addLog("meeting_request", id, "Meeting rejected", reason, user);
    addNotificationForUsers([row.citizenId], "Meeting Request", `Your meeting request ${row.requestId} was rejected.`, "");
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
      "UPDATE complaints SET assignedAdminUserId=?, assignedAdminName=?, status='assigned', updatedAt=? WHERE id=?",
      [Number(user.id), user.name, ts(), Number(id)]
    );
    addLog("complaint", id, "Complaint assigned", `Assigned to ${user.name}`, user);
    addNotificationForUsers([Number(user.id)], "Complaint Assigned", `Complaint ${row.complaintId} is now assigned to you.`, `/cases/complaint/${id}`);
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
       SET department=?, officerName=?, officerContact=?, manualContact=?, status='department_contact_identified', updatedAt=?
       WHERE id=?`,
      [department, officerName, officerContact, manualContact, ts(), Number(id)]
    );
    addLog("complaint", id, "Department contact identified", `${department} / ${officerName || manualContact}`, user);
    return workItemsApi.getComplaint(id);
  },

  scheduleComplaintCall: async (id, callScheduledAt) => {
    await getDb();
    const user = requireRole("admin");
    if (!String(callScheduledAt || "").trim()) throw new Error("Call schedule is required");
    execute(
      "UPDATE complaints SET callScheduledAt=?, status='call_scheduled', updatedAt=? WHERE id=?",
      [callScheduledAt, ts(), Number(id)]
    );
    addLog("complaint", id, "Department call scheduled", callScheduledAt, user);
    return workItemsApi.getComplaint(id);
  },

  logComplaintCallOutcome: async (id, outcome) => {
    await getDb();
    const user = requireRole("admin");
    if (!String(outcome || "").trim()) throw new Error("Call outcome is required");
    execute(
      "UPDATE complaints SET callOutcome=?, status='followup_in_progress', updatedAt=? WHERE id=?",
      [outcome.trim(), ts(), Number(id)]
    );
    addLog("complaint", id, "Department call outcome logged", outcome, user);
    return workItemsApi.getComplaint(id);
  },

  resolveComplaint: async (id, payload) => {
    await getDb();
    const user = requireRole("admin");
    execute(
      "UPDATE complaints SET status='resolved', resolutionDocs=?, updatedAt=? WHERE id=?",
      [JSON.stringify(payload.resolutionDocs || []), ts(), Number(id)]
    );
    const row = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    addLog("complaint", id, "Complaint resolved", "Resolution documents added", user);
    addNotificationForUsers([row.citizenId], "Complaint Submitted", `Complaint ${row.complaintId} has been resolved.`, "");
    return workItemsApi.getComplaint(id);
  },

  escalateComplaintToMeeting: async (id, payload) => {
    await getDb();
    const user = requireRole("admin");
    const complaint = queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)]);
    if (!complaint) throw new Error("Complaint not found");
    const requestId = nextCode("MREQ", "meeting_requests");
    execute(
      `INSERT INTO meeting_requests (
        requestId,citizenId,citizenSnapshot,purpose,referralAdminUserId,referralAdminName,attachmentName,attachmentType,attachmentData,status,verificationOutcome,rejectReason,scheduleDate,scheduleTime,scheduleLocation,visitorId,meetingDocket,adminNotes,escalatedFromComplaintId,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        requestId,
        complaint.citizenId,
        complaint.citizenSnapshot,
        payload.purpose || `Escalated from complaint ${complaint.complaintId}`,
        Number(user.id),
        user.name,
        "",
        "",
        "",
        "approved",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Admin escalation from complaint flow.",
        Number(id),
        ts(),
        ts(),
      ]
    );
    const meetingRequestRow = queryOne("SELECT * FROM meeting_requests WHERE requestId = ?", [requestId]);
    const meetingRequestId = meetingRequestRow?.id;
    execute(
      "UPDATE complaints SET status='escalated_to_admin_meeting', escalatedMeetingRequestId=?, updatedAt=? WHERE id=?",
      [meetingRequestId, ts(), Number(id)]
    );
    addLog("complaint", id, "Escalated to admin meeting", payload.purpose || "", user);
    return {
      complaint: buildComplaint(queryOne("SELECT * FROM complaints WHERE id = ?", [Number(id)])),
      meetingRequest: buildMeetingRequest(meetingRequestRow),
    };
  },
};

export const meetingsApi = {
  list: async () => {
    await getDb();
    const user = requireUser();
    if (user.role === "deo") {
      return {
        events: queryAll("SELECT * FROM calendar_events ORDER BY scheduleAt DESC").map(buildCalendarEvent),
      };
    }
    if (user.role === "admin") {
      return {
        meetings: queryAll("SELECT * FROM meeting_requests ORDER BY createdAt DESC").map(buildMeetingRequest),
      };
    }
    const meetings = queryAll("SELECT * FROM meeting_requests WHERE citizenId=? ORDER BY createdAt DESC", [Number(user.id)]).map(buildMeetingRequest);
    return { meetings };
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
    const eventId = eventRow?.id;
    const notificationType = eventType === "Invited Event" ? "Event Invitation" : "Calendar Update";
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      notificationType,
      `${title} was added to the calendar.`,
      "/meetings"
    );
    addNotificationForUsers(
      getMinisterUsers().map((minister) => minister.id),
      notificationType,
      `${title} was added to the minister calendar.`,
      "/minister/calendar"
    );
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Calendar Update",
      `Calendar updated with ${title}.`,
      "/meetings"
    );
    addNotificationForUsers(
      getMinisterUsers().map((minister) => minister.id),
      "Calendar Update",
      `Minister calendar updated with ${title}.`,
      "/minister/calendar"
    );
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
    addNotificationForUsers(
      getAdminUsers().map((admin) => admin.id),
      "Calendar Update",
      `${row.title} was marked attended.`,
      "/dashboard"
    );
    addNotificationForUsers(
      getMinisterUsers().map((minister) => minister.id),
      "Calendar Update",
      `${row.title} attendance was marked and is now available on the minister dashboard.`,
      "/minister/dashboard"
    );
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
    const meetingRequests = queryAll("SELECT * FROM meeting_requests").map(buildMeetingRequest);
    const analytics = buildAnalytics(events, complaints, meetingRequests);
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
      totalCases: complaints.length + meetingRequests.length,
      resolved: complaints.filter((item) => item.status === "resolved").length,
      scheduled: meetingRequests.filter((item) => item.status === "scheduled").length,
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
    const scheduledMeetings = queryAll("SELECT * FROM meeting_requests WHERE status='scheduled' ORDER BY scheduleDate ASC, scheduleTime ASC").map(buildMeetingRequest);
    const complaints = queryAll("SELECT * FROM complaints").map(buildComplaint);
    const analytics = buildAnalytics(events, complaints, scheduledMeetings);
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
    const meetings = queryAll("SELECT * FROM meeting_requests WHERE status='scheduled' ORDER BY scheduleDate ASC, scheduleTime ASC").map(buildMeetingRequest);
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
        details: `Citizen: ${meeting.citizenSnapshot?.name || "Citizen"} · Visitor ID: ${meeting.visitorId || "Pending"} · Docket: ${meeting.meetingDocket || "Pending"}`,
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
      const endsAt = new Date(payload.endsAt || payload.startsAt);
      execute(
        `UPDATE meeting_requests
         SET purpose=?, scheduleDate=?, scheduleTime=?, scheduleLocation=?, adminNotes=?, updatedAt=?
         WHERE id=?`,
        [
          String(payload.title || "").trim(),
          startsAt.toISOString().slice(0, 10),
          startsAt.toTimeString().slice(0, 5),
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
