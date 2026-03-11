import { getDb, queryAll, queryOne, execute, lastInsertId } from "../db/database";
import { ADMIN_ROLES, MASTER_ADMIN_ROLE, STAFF_ROLE_IDS, getDepartmentOwner, getRoleLabel, splitDepartmentsAcrossAdmins } from "../constants/adminWorkflow";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("hcm_user"));
  } catch {
    return null;
  }
}

function ts() {
  return new Date().toISOString();
}

function maskAadhaar(v) {
  if (!v || typeof v !== "string") return v;
  const c = v.replace(/\s/g, "");
  return c.length < 4 ? "****" : `****-****-${c.slice(-4)}`;
}

function parseJ(str, fallback = null) {
  if (str == null || str === "") return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function generateOtp() {
  let otp = "";
  for (let i = 0; i < 6; i += 1) otp += Math.floor(Math.random() * 10);
  return otp;
}

function buildCaseRow(row) {
  if (!row) return null;
  const obj = { ...row };
  obj.citizenSnapshot = parseJ(row.citizenSnapshot, {});
  obj.documents = parseJ(row.documents, []);
  obj.schedule = parseJ(row.schedule, null);
  obj.isArchived = !!row.isArchived;
  obj.isDeleted = !!row.isDeleted;
  obj.resolvedWithoutMeeting = !!row.resolvedWithoutMeeting;
  obj.reopenedCount = Number(row.reopenedCount || 0);
  obj.assignedAdminLabel = getRoleLabel(row.assignedAdminRole);
  obj.currentAdminLabel = getRoleLabel(row.currentAdminRole);
  if (obj.citizenSnapshot?.aadhaar) {
    obj.citizenSnapshot.aadhaar = maskAadhaar(obj.citizenSnapshot.aadhaar);
  }
  return obj;
}

function buildFullCase(row) {
  const obj = buildCaseRow(row);
  if (!obj) return null;
  obj.communications = queryAll(
    "SELECT * FROM communications WHERE caseId = ? ORDER BY createdAt DESC",
    [row.id]
  );
  obj.comments = queryAll(
    "SELECT * FROM comments WHERE caseId = ? ORDER BY createdAt DESC",
    [row.id]
  );
  return obj;
}

function nextCaseId() {
  const row = queryOne("SELECT COUNT(*) as cnt FROM cases");
  return `HP-CASE-${String((row?.cnt || 0) + 1).padStart(6, "0")}`;
}

function addNotification(userId, message, caseId, type = "GENERAL") {
  execute(
    "INSERT INTO notifications (userId,message,caseId,type,isRead,createdAt) VALUES (?,?,?,?,0,?)",
    [Number(userId), message, caseId ? Number(caseId) : null, type, ts()]
  );
}

function getDepartmentRows() {
  return queryAll("SELECT * FROM departments ORDER BY id ASC");
}

function getAdminNameForRole(roleId) {
  return getRoleLabel(roleId);
}

function persistCommunications(caseId, communications, createdByName) {
  const validTypes = ["CALL", "LETTER", "EMAIL", "MEETING_NOTE"];
  (communications || []).forEach((entry) => {
    if (!entry?.summary?.trim()) return;
    const type = validTypes.includes(entry.type) ? entry.type : "CALL";
    execute(
      "INSERT INTO communications (caseId,type,summary,happenedAt,createdByName,createdAt) VALUES (?,?,?,?,?,?)",
      [
        Number(caseId),
        type,
        entry.summary.trim(),
        entry.happenedAt ? new Date(entry.happenedAt).toISOString() : ts(),
        createdByName || "Staff",
        ts(),
      ]
    );
  });
}

function persistComment(caseId, comment, user) {
  if (!comment?.trim()) return;
  execute(
    "INSERT INTO comments (caseId,comment,createdByRole,createdByName,createdAt) VALUES (?,?,?,?,?)",
    [Number(caseId), comment.trim(), user?.role || "staff", user?.name || "Staff", ts()]
  );
}

function upsertMeeting(row, meeting) {
  if (!meeting?.scheduledAt) return;
  const existing = queryOne("SELECT * FROM meetings WHERE caseId = ?", [Number(row.id)]);
  const now = ts();
  const values = [
    row.id,
    row.caseId,
    row.department,
    meeting.title || row.purpose,
    getAdminNameForRole(row.currentAdminRole),
    row.urgency || "MEDIUM",
    meeting.scheduledAt,
    "PENDING",
    now,
    now,
  ];
  if (existing) {
    execute(
      "UPDATE meetings SET title=?,assignedToName=?,priority=?,dueDate=?,status='PENDING',updatedAt=? WHERE caseId=?",
      [meeting.title || row.purpose, getAdminNameForRole(row.currentAdminRole), row.urgency || "MEDIUM", meeting.scheduledAt, now, row.id]
    );
  } else {
    execute(
      "INSERT INTO meetings (caseId,caseNumber,department,title,assignedToName,priority,dueDate,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
      values
    );
  }
}

function routeCaseForReferral(roleId) {
  const role = ADMIN_ROLES.find((item) => item.id === roleId);
  if (!role) throw new Error("No admin routing found for the selected referral");
  return {
    roleId: role.id,
    roleLabel: role.label,
  };
}

export const authApi = {
  login: async (email, password) => {
    await getDb();
    const user = queryOne("SELECT * FROM users WHERE email = ? AND isVerified = 1", [
      email.trim().toLowerCase(),
    ]);
    if (!user || user.password !== password) throw new Error("Invalid email or password");
    const userData = {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      age: user.age,
    };
    return { message: "Login successful", token: `local-${user.id}`, user: userData };
  },

  loginByCitizenId: async (citizenId) => {
    await getDb();
    const user = queryOne(
      "SELECT * FROM users WHERE citizenUniqueId = ? AND role = 'citizen' AND isVerified = 1",
      [citizenId.trim()]
    );
    if (!user) throw new Error("No verified citizen found for this ID");
    const userData = {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      age: user.age,
      citizenUniqueId: user.citizenUniqueId,
    };
    return { message: "Login successful", token: `local-${user.id}`, user: userData };
  },

  me: async () => {
    await getDb();
    const cur = getCurrentUser();
    if (!cur) throw new Error("Unauthorized");
    const user = queryOne("SELECT * FROM users WHERE id = ?", [Number(cur.id)]);
    if (!user) throw new Error("Unauthorized");
    const obj = { ...user, _id: String(user.id) };
    if (obj.aadhaar) obj.aadhaar = maskAadhaar(obj.aadhaar);
    delete obj.password;
    return { user: obj };
  },

  register: async (body) => {
    await getDb();
    const { name, email, phone, gender, age, aadhaar, password } = body;
    const norm = email.trim().toLowerCase();
    const cleanAadhaar = String(aadhaar).replace(/\s/g, "");

    if (!name || !norm || !phone || !gender || !age || !cleanAadhaar || !password) {
      throw new Error("All fields are required");
    }

    const existing = queryOne("SELECT * FROM users WHERE email = ? OR aadhaar = ?", [norm, cleanAadhaar]);
    if (existing && existing.isVerified) throw new Error("User with this email or Aadhaar already exists");
    if (existing && !existing.isVerified) execute("DELETE FROM users WHERE id = ?", [existing.id]);

    const citizenCount = queryOne("SELECT COUNT(*) as cnt FROM users WHERE role = 'citizen'");
    const citizenUniqueId = `CTZ-HP-${String((citizenCount?.cnt || 0) + 1).padStart(6, "0")}`;
    const now = ts();

    execute(
      `INSERT INTO users (name,email,phone,gender,age,aadhaar,password,citizenUniqueId,role,isVerified,createdAt,updatedAt)
       VALUES (?,?,?,?,?,?,?,?,?,0,?,?)`,
      [name, norm, phone, gender, Number(age), cleanAadhaar, password, citizenUniqueId, "citizen", now, now]
    );

    const otp = generateOtp();
    execute("DELETE FROM otps WHERE email = ?", [norm]);
    execute("INSERT INTO otps (email,otp,expiresAt) VALUES (?,?,?)", [
      norm,
      otp,
      new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    ]);

    return {
      message: "OTP generated (demo mode). Use the devOtp below.",
      userId: lastInsertId(),
      email: norm,
      citizenUniqueId,
      devOtp: otp,
    };
  },

  verifyOtp: async (email, otp) => {
    await getDb();
    const norm = email.trim().toLowerCase();
    const otpClean = String(otp).replace(/\D/g, "").trim();
    if (!norm || !otpClean) throw new Error("Email and OTP are required");

    const user = queryOne("SELECT * FROM users WHERE email = ?", [norm]);
    if (!user) throw new Error("No pending registration found for this email");
    if (user.isVerified) return { message: "Email already verified. You can login." };

    const record = queryOne("SELECT * FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1", [norm]);
    if (!record) throw new Error("No OTP found. Please resend OTP.");
    if (new Date(record.expiresAt) < new Date()) {
      execute("DELETE FROM otps WHERE email = ?", [norm]);
      throw new Error("OTP has expired. Please request a new one.");
    }
    if (String(record.otp) !== otpClean) throw new Error("Invalid OTP");

    execute("UPDATE users SET isVerified = 1, updatedAt = ? WHERE email = ?", [ts(), norm]);
    execute("DELETE FROM otps WHERE email = ?", [norm]);
    const updated = queryOne("SELECT citizenUniqueId FROM users WHERE email = ?", [norm]);
    return {
      message: "Registration successful! You can now login with your Citizen ID.",
      citizenUniqueId: updated?.citizenUniqueId,
    };
  },

  resendOtp: async (email) => {
    await getDb();
    const norm = email.trim().toLowerCase();
    if (!norm) throw new Error("Email is required");
    const user = queryOne("SELECT * FROM users WHERE email = ? AND isVerified = 0", [norm]);
    if (!user) throw new Error("No pending registration found for this email");
    const otp = generateOtp();
    execute("DELETE FROM otps WHERE email = ?", [norm]);
    execute("INSERT INTO otps (email,otp,expiresAt) VALUES (?,?,?)", [
      norm,
      otp,
      new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    ]);
    return { message: "New OTP sent (demo mode)", devOtp: otp };
  },

  sendLoginOtp: async (payload) => {
    await getDb();
    const norm = (payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").replace(/\D/g, "").trim();
    if (!norm && !phone) throw new Error("Email or phone is required");
    const user = norm
      ? queryOne("SELECT * FROM users WHERE email = ? AND isVerified = 1", [norm])
      : queryOne("SELECT * FROM users WHERE phone = ? AND isVerified = 1", [phone]);
    if (!user) throw new Error("No verified account found");
    const otp = generateOtp();
    execute("DELETE FROM otps WHERE email = ?", [user.email]);
    execute("INSERT INTO otps (email,otp,expiresAt) VALUES (?,?,?)", [
      user.email,
      otp,
      new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    ]);
    return { message: "OTP generated (demo mode)", email: user.email, devOtp: otp };
  },

  loginWithOtp: async (payload) => {
    await getDb();
    const norm = (payload.email || "").trim().toLowerCase();
    const otpClean = String(payload.otp || "").replace(/\D/g, "").trim();
    if (!norm || !otpClean) throw new Error("Email and OTP are required");
    const record = queryOne("SELECT * FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1", [norm]);
    if (!record) throw new Error("No OTP found. Request a new one.");
    if (new Date(record.expiresAt) < new Date()) throw new Error("OTP has expired.");
    if (String(record.otp) !== otpClean) throw new Error("Invalid OTP");
    const user = queryOne("SELECT * FROM users WHERE email = ?", [norm]);
    if (!user) throw new Error("User not found");
    execute("DELETE FROM otps WHERE email = ?", [norm]);
    const userData = {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      age: user.age,
    };
    return { message: "Login successful", token: `local-${user.id}`, user: userData };
  },
};

export const dashboardApi = {
  stats: async () => {
    await getDb();
    const user = getCurrentUser();
    const conditions = ["isDeleted = 0"];
    const params = [];
    if (user && user.role !== MASTER_ADMIN_ROLE.id && STAFF_ROLE_IDS.includes(user.role)) {
      conditions.push("(assignedAdminRole = ? OR currentAdminRole = ?)");
      params.push(user.role, user.role);
    }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const stats = queryOne(
      `SELECT
        COUNT(*) as totalCases,
        SUM(CASE WHEN status IN ('RESOLVED','RESOLVED_WITHOUT_MEETING','CLOSED','REJECTED') THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN schedule IS NOT NULL AND schedule != '' AND status IN ('APPROVED','SCHEDULED','CLOSURE_PENDING_MINISTER','CLOSED') THEN 1 ELSE 0 END) as scheduled
       FROM cases ${where}`,
      params
    );
    const recentCases = queryAll(`SELECT * FROM cases ${where} ORDER BY createdAt DESC LIMIT 5`, params).map(buildCaseRow);
    return { ...stats, recentCases };
  },
};

export const citizensApi = {
  list: async (search = "", page = 1, limit = 20) => {
    await getDb();
    let sql = "SELECT * FROM users WHERE role = 'citizen' AND isVerified = 1";
    const p = [];
    if (search) {
      sql += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const t = `%${search}%`;
      p.push(t, t, t);
    }
    sql += ` ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
    return { citizens: queryAll(sql, p) };
  },
  create: async () => ({ message: "Not implemented in demo" }),
};

export const casesApi = {
  list: async (params = {}) => {
    await getDb();
    const user = getCurrentUser();
    const conds = [];
    const p = [];

    if (!user) throw new Error("Unauthorized");
    if (user.role === "citizen") {
      conds.push("citizenId = ?");
      p.push(Number(user.id));
    } else if (user.role !== MASTER_ADMIN_ROLE.id) {
      conds.push("(assignedAdminRole = ? OR currentAdminRole = ?)");
      p.push(user.role, user.role);
    }

    if (params.view === "archived") {
      conds.push("isArchived = 1", "isDeleted != 1");
    } else if (params.view === "deleted") {
      conds.push("isDeleted = 1");
    } else {
      conds.push("isArchived != 1", "isDeleted != 1");
    }

    if (params.status) {
      conds.push("status = ?");
      p.push(params.status);
    }

    if (params.search && String(params.search).trim()) {
      const t = `%${params.search.trim()}%`;
      conds.push("(caseId LIKE ? OR purpose LIKE ? OR category LIKE ? OR assignedAdminRole LIKE ? OR citizenSnapshot LIKE ?)");
      p.push(t, t, t, t, t);
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const rows = queryAll(`SELECT * FROM cases ${where} ORDER BY createdAt DESC`, p);
    return { cases: rows.map(buildCaseRow) };
  },

  get: async (id) => {
    await getDb();
    const row = queryOne("SELECT * FROM cases WHERE id = ?", [Number(id)]);
    if (!row) throw new Error("Case not found");
    return { case: buildFullCase(row) };
  },

  create: async (body) => {
    await getDb();
    const user = getCurrentUser();
    if (!user || user.role !== "citizen") throw new Error("Unauthorized");

    const { purpose, category, referralRole, urgency, details, documents } = body;
    if (!purpose?.trim() || !referralRole?.trim() || !details?.trim()) {
      throw new Error("Referral admin, complaint title and complaint details are required");
    }

    const route = routeCaseForReferral(referralRole);
    const userRow = queryOne("SELECT * FROM users WHERE id = ?", [Number(user.id)]);
    const snap = JSON.stringify({
      name: userRow?.name,
      email: userRow?.email,
      phone: userRow?.phone,
      aadhaar: userRow?.aadhaar,
      gender: userRow?.gender,
      age: userRow?.age,
    });
    const docList = Array.isArray(documents) ? documents.filter((d) => d?.name && d?.url) : [];
    const now = ts();

    execute(
      `INSERT INTO cases (
        caseId,citizenId,citizenSnapshot,purpose,category,department,assignedAdminRole,currentAdminRole,currentAdminName,
        details,urgency,documents,status,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        nextCaseId(),
        Number(user.id),
        snap,
        purpose.trim(),
        category?.trim() || "General Grievance",
        route.roleLabel,
        route.roleId,
        route.roleId,
        route.roleLabel,
        details.trim(),
        ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(urgency) ? urgency : "MEDIUM",
        JSON.stringify(docList),
        "SUBMITTED",
        now,
        now,
      ]
    );

    const newId = lastInsertId();
    const created = queryOne("SELECT * FROM cases WHERE id = ?", [newId]);
    addNotification(user.id, `Your case ${created.caseId} has been submitted successfully.`, newId, "CASE_CREATED");
    const routedAdmin = queryOne("SELECT id FROM users WHERE role = ?", [route.roleId]);
    if (routedAdmin?.id) {
      addNotification(routedAdmin.id, `A new case ${created.caseId} was routed to your queue.`, newId, "CASE_CREATED");
    }
    return { message: "Case submitted successfully", case: buildCaseRow(created) };
  },

  review: async (caseId, payload) => {
    await getDb();
    const row = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    if (!row) throw new Error("Case not found");
    const { action, note, communications, comment, meeting } = payload;
    const user = getCurrentUser();
    const valid = ["APPROVE", "REJECT", "REQUEST_CLARIFICATION", "RESOLVE_WITHOUT_MEETING"];
    if (!action || !valid.includes(action)) throw new Error(`action must be one of: ${valid.join(", ")}`);

    let newStatus = row.status;
    let reviewNote = note?.trim() || row.reviewNote || "";
    let resolvedWithoutMeeting = row.resolvedWithoutMeeting || 0;
    let schedule = row.schedule;
    let closureType = row.closureType || "";
    let closureRequestedAt = row.closureRequestedAt;

    if (action === "APPROVE") {
      newStatus = meeting?.scheduledAt ? "SCHEDULED" : "APPROVED";
      schedule = meeting?.scheduledAt
        ? JSON.stringify({
            scheduledAt: new Date(meeting.scheduledAt).toISOString(),
            slot: meeting.slot || "",
            type: meeting.type || "",
            venue: meeting.venue || "",
            title: meeting.title || row.purpose,
          })
        : row.schedule;
      resolvedWithoutMeeting = 0;
      upsertMeeting(row, meeting);
    } else if (action === "REJECT") {
      newStatus = "REJECTION_PENDING_MINISTER";
      closureType = "REJECTION";
      closureRequestedAt = ts();
    } else if (action === "REQUEST_CLARIFICATION") {
      newStatus = "REQUEST_CLARIFICATION";
    } else if (action === "RESOLVE_WITHOUT_MEETING") {
      newStatus = "RESOLVED_WITHOUT_MEETING";
      resolvedWithoutMeeting = 1;
      schedule = null;
    }

    execute(
      `UPDATE cases
       SET status=?,reviewNote=?,resolvedWithoutMeeting=?,schedule=?,closureType=?,closureRequestedAt=?,updatedAt=?
       WHERE id=?`,
      [newStatus, reviewNote, resolvedWithoutMeeting, schedule, closureType, closureRequestedAt, ts(), row.id]
    );

    persistCommunications(row.id, communications, user?.name);
    persistComment(row.id, comment, user);

    addNotification(row.citizenId, `Case ${row.caseId} is now ${newStatus.replace(/_/g, " ").toLowerCase()}.`, row.id, "STATUS_CHANGE");
    if (newStatus === "REJECTION_PENDING_MINISTER") {
      const minister = queryOne("SELECT id FROM users WHERE role = ?", [MASTER_ADMIN_ROLE.id]);
      if (minister?.id) {
        addNotification(minister.id, `Rejection request received for ${row.caseId}.`, row.id, "STATUS_CHANGE");
      }
    }

    const updated = queryOne("SELECT * FROM cases WHERE id = ?", [row.id]);
    return { message: "Review updated", case: buildFullCase(updated) };
  },

  requestClosure: async (caseId, payload) => {
    await getDb();
    const row = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    if (!row) throw new Error("Case not found");
    const user = getCurrentUser();
    const { meetingSummary, actionRequired, responsibleAuthority, communications, comment } = payload;

    execute(
      `UPDATE cases
       SET meetingSummary=?,actionRequired=?,responsibleAuthority=?,status='CLOSURE_PENDING_MINISTER',
           closureRequestedAt=?,closureType='CLOSURE',updatedAt=?
       WHERE id=?`,
      [
        meetingSummary?.trim() || row.meetingSummary || "",
        actionRequired?.trim() || row.actionRequired || "",
        responsibleAuthority?.trim() || row.responsibleAuthority || "",
        ts(),
        ts(),
        row.id,
      ]
    );

    persistCommunications(row.id, communications, user?.name);
    persistComment(row.id, comment, user);

    const minister = queryOne("SELECT id FROM users WHERE role = ?", [MASTER_ADMIN_ROLE.id]);
    if (minister?.id) {
      addNotification(minister.id, `Closure request received for ${row.caseId}.`, row.id, "STATUS_CHANGE");
    }
    addNotification(row.citizenId, `Closure request for case ${row.caseId} has been sent to the minister.`, row.id, "STATUS_CHANGE");
    const updated = queryOne("SELECT * FROM cases WHERE id = ?", [row.id]);
    return { message: "Closure request sent", case: buildFullCase(updated) };
  },

  ministerReview: async (caseId, payload) => {
    await getDb();
    const row = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    if (!row) throw new Error("Case not found");
    const { action, note } = payload;
    if (!["APPROVE", "SEND_BACK"].includes(action)) throw new Error("Invalid minister action");

    let status = row.status;
    let ministerDecisionNote = note?.trim() || row.ministerDecisionNote || "";
    let reopenedCount = Number(row.reopenedCount || 0);

    if (action === "APPROVE") {
      status = row.closureType === "REJECTION" ? "REJECTED" : "CLOSED";
    } else {
      status = "REOPENED";
      reopenedCount += 1;
    }

    execute(
      "UPDATE cases SET status=?,ministerDecisionNote=?,reopenedCount=?,updatedAt=? WHERE id=?",
      [status, ministerDecisionNote, reopenedCount, ts(), row.id]
    );

    const adminUser = queryOne("SELECT id FROM users WHERE role = ?", [row.currentAdminRole]);
    if (adminUser?.id) {
      addNotification(
        adminUser.id,
        action === "APPROVE"
          ? `Minister approved ${row.closureType === "REJECTION" ? "rejection" : "closure"} for ${row.caseId}.`
          : `Minister sent ${row.caseId} back for re-evaluation.`,
        row.id,
        "STATUS_CHANGE"
      );
    }
    addNotification(
      row.citizenId,
      action === "APPROVE"
        ? `Your case ${row.caseId} has been ${row.closureType === "REJECTION" ? "rejected" : "closed"}.`
        : `Your case ${row.caseId} has been sent back for admin re-evaluation.`,
      row.id,
      "STATUS_CHANGE"
    );

    const updated = queryOne("SELECT * FROM cases WHERE id = ?", [row.id]);
    return { message: "Minister review saved", case: buildFullCase(updated) };
  },

  escalate: async (caseId, payload) => {
    await getDb();
    const row = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    if (!row) throw new Error("Case not found");
    const nextRole = payload?.role;
    if (!ADMIN_ROLES.some((item) => item.id === nextRole)) throw new Error("Invalid admin role");
    if (nextRole === row.currentAdminRole) throw new Error("Select a different admin");
    const reason = payload?.reason?.trim() || "";

    execute(
      `UPDATE cases
       SET currentAdminRole=?,currentAdminName=?,status='ESCALATED',escalationReason=?,updatedAt=?
       WHERE id=?`,
      [nextRole, getRoleLabel(nextRole), reason, ts(), row.id]
    );

    const nextUser = queryOne("SELECT id FROM users WHERE role = ?", [nextRole]);
    if (nextUser?.id) {
      addNotification(nextUser.id, `Case ${row.caseId} has been escalated to your queue.`, row.id, "STATUS_CHANGE");
    }
    addNotification(row.citizenId, `Case ${row.caseId} has been escalated for re-evaluation.`, row.id, "STATUS_CHANGE");
    const updated = queryOne("SELECT * FROM cases WHERE id = ?", [row.id]);
    return { message: "Case escalated", case: buildFullCase(updated) };
  },

  schedule: async (caseId, payload) => {
    await getDb();
    const row = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    if (!row) throw new Error("Case not found");
    if (!payload?.scheduledAt) throw new Error("scheduledAt is required");
    const schedule = JSON.stringify({
      scheduledAt: new Date(payload.scheduledAt).toISOString(),
      slot: payload.slot || "",
      type: payload.type || "",
      venue: payload.venue || "",
      title: payload.title || row.purpose,
    });
    execute("UPDATE cases SET schedule=?,status='SCHEDULED',updatedAt=? WHERE id=?", [schedule, ts(), row.id]);
    upsertMeeting(row, payload);
    const updated = queryOne("SELECT * FROM cases WHERE id = ?", [row.id]);
    return { message: "Schedule updated", case: buildFullCase(updated) };
  },

  complete: async (caseId, payload) => {
    await getDb();
    return casesApi.requestClosure(caseId, payload);
  },

  authorize: async (id, payload) => casesApi.review(id, payload),
  checkin: async () => ({ message: "OK" }),
  close: async (id, payload) => casesApi.requestClosure(id, payload),

  updateStatus: async (caseId, status) => {
    await getDb();
    execute("UPDATE cases SET status=?,updatedAt=? WHERE id=?", [status, ts(), Number(caseId)]);
    const updated = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    return { message: "Status updated", case: buildFullCase(updated) };
  },

  addComment: async (caseId, body) => {
    await getDb();
    const row = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    if (!row) throw new Error("Case not found");
    const user = getCurrentUser();
    persistComment(caseId, body?.comment, user);
    const updated = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    return { message: "Comment added", case: buildFullCase(updated) };
  },

  bulkArchive: async (ids) => {
    await getDb();
    const ph = ids.map(() => "?").join(",");
    execute(`UPDATE cases SET isArchived=1,updatedAt=? WHERE id IN (${ph})`, [ts(), ...ids.map(Number)]);
    return { message: `${ids.length} case(s) archived` };
  },
  bulkUnarchive: async (ids) => {
    await getDb();
    const ph = ids.map(() => "?").join(",");
    execute(`UPDATE cases SET isArchived=0,updatedAt=? WHERE id IN (${ph})`, [ts(), ...ids.map(Number)]);
    return { message: `${ids.length} case(s) restored from archive` };
  },
  bulkDelete: async (ids) => {
    await getDb();
    const ph = ids.map(() => "?").join(",");
    execute(`UPDATE cases SET isDeleted=1,updatedAt=? WHERE id IN (${ph})`, [ts(), ...ids.map(Number)]);
    return { message: `${ids.length} case(s) deleted` };
  },
  bulkRestore: async (ids) => {
    await getDb();
    const ph = ids.map(() => "?").join(",");
    execute(`UPDATE cases SET isDeleted=0,isArchived=0,updatedAt=? WHERE id IN (${ph})`, [ts(), ...ids.map(Number)]);
    return { message: `${ids.length} case(s) restored` };
  },
  bulkPermanentDelete: async (ids) => {
    await getDb();
    const ph = ids.map(() => "?").join(",");
    execute(`DELETE FROM cases WHERE isDeleted=1 AND id IN (${ph})`, ids.map(Number));
    return { message: `${ids.length} case(s) permanently deleted` };
  },
};

export const communicationsApi = {
  list: async (caseId) => {
    await getDb();
    return {
      communications: queryAll("SELECT * FROM communications WHERE caseId = ? ORDER BY createdAt DESC", [Number(caseId)]),
    };
  },

  create: async (caseId, body) => {
    await getDb();
    const row = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    if (!row) throw new Error("Case not found");
    const user = getCurrentUser();
    persistCommunications(caseId, [body], user?.name);
    const updated = queryOne("SELECT * FROM cases WHERE id = ?", [Number(caseId)]);
    return { message: "Communication logged", case: buildFullCase(updated) };
  },
};

export const departmentApi = {
  overview: async () => {
    await getDb();
    const departments = getDepartmentRows();
    const ownerGroups = splitDepartmentsAcrossAdmins(departments);
    const ownerMap = ownerGroups.reduce((acc, role) => {
      role.departments.forEach((department) => {
        acc[department.id] = {
          adminRole: role.id,
          adminLabel: role.label,
        };
      });
      return acc;
    }, {});

    const result = departments.map((dept) => {
      const stats = queryOne(
        `SELECT COUNT(*) as totalCases,
                SUM(CASE WHEN status='SUBMITTED' THEN 1 ELSE 0 END) as submitted
         FROM cases WHERE LOWER(department)=LOWER(?)`,
        [dept.name]
      );
      return {
        ...dept,
        totalCases: stats?.totalCases || 0,
        submitted: stats?.submitted || 0,
        adminRole: ownerMap[dept.id]?.adminRole,
        adminLabel: ownerMap[dept.id]?.adminLabel,
      };
    });
    return {
      departments: result,
      adminGroups: ownerGroups.map((group) => ({
        roleId: group.id,
        roleLabel: group.label,
        departments: group.departments.map((dept) => ({
          ...dept,
          totalCases: result.find((item) => item.id === dept.id)?.totalCases || 0,
          submitted: result.find((item) => item.id === dept.id)?.submitted || 0,
        })),
      })),
    };
  },

  create: async (body) => {
    await getDb();
    const name = (body.name || "").trim();
    const state = (body.state || "").trim();
    const ministerName = (body.ministerName || "").trim();
    if (!name || !state || !ministerName) throw new Error("Name, state and minister name are required");
    const exists = queryOne(
      "SELECT id FROM departments WHERE LOWER(name)=LOWER(?) AND LOWER(state)=LOWER(?) AND LOWER(ministerName)=LOWER(?)",
      [name, state, ministerName]
    );
    if (exists) throw new Error("Department already exists");
    const now = ts();
    execute("INSERT INTO departments (name,state,ministerName,createdAt,updatedAt) VALUES (?,?,?,?,?)", [name, state, ministerName, now, now]);
    const id = lastInsertId();
    return { message: "Department added successfully", department: queryOne("SELECT * FROM departments WHERE id = ?", [id]) };
  },

  options: async () => {
    await getDb();
    const departments = getDepartmentRows();
    return {
      departments: departments.map((dept) => {
        const owner = getDepartmentOwner(departments, dept.name);
        return {
          id: String(dept.id),
          name: dept.name,
          adminRole: owner?.roleId || "",
          adminLabel: owner?.roleLabel || "",
        };
      }),
    };
  },
};

export const assignmentsApi = {
  list: async () => ({ assignments: [] }),
  create: async () => ({ message: "Assignments removed from the active case flow" }),
  update: async () => ({ message: "Assignments removed from the active case flow" }),
};

export const notificationsApi = {
  list: async () => {
    await getDb();
    const user = getCurrentUser();
    if (!user) return { notifications: [], unreadCount: 0 };
    const notifications = queryAll("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50", [Number(user.id)]);
    const unread = queryOne("SELECT COUNT(*) as cnt FROM notifications WHERE userId = ? AND isRead = 0", [Number(user.id)]);
    return { notifications, unreadCount: unread?.cnt || 0 };
  },

  markRead: async (id) => {
    await getDb();
    execute("UPDATE notifications SET isRead = 1 WHERE id = ?", [Number(id)]);
    return { notification: queryOne("SELECT * FROM notifications WHERE id = ?", [Number(id)]) };
  },

  markAllRead: async () => {
    await getDb();
    const user = getCurrentUser();
    if (user) execute("UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0", [Number(user.id)]);
    return { message: "All marked as read" };
  },
};

export const authorityApi = {
  suggestions: async () => ({ officials: [], suggestedDepartment: null, categoryMap: {} }),
};

export const meetingsApi = {
  list: async () => {
    await getDb();
    return { meetings: queryAll("SELECT * FROM meetings ORDER BY createdAt DESC") };
  },

  create: async (body) => {
    await getDb();
    const { caseId, caseNumber, department, title, assignedToName, priority, dueDate } = body;
    if (!department || !title) throw new Error("department and title are required");
    const validP = ["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"];
    const now = ts();
    execute(
      "INSERT INTO meetings (caseId,caseNumber,department,title,assignedToName,priority,dueDate,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [caseId ? Number(caseId) : null, caseNumber || "", department, title, assignedToName || "", validP.includes(priority) ? priority : "MEDIUM", dueDate || null, "PENDING", now, now]
    );
    return { message: "Meeting invite created", meeting: queryOne("SELECT * FROM meetings WHERE id = ?", [lastInsertId()]) };
  },

  updateStatus: async (id, status) => {
    await getDb();
    const valid = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (status && valid.includes(status)) {
      execute("UPDATE meetings SET status=?,updatedAt=? WHERE id=?", [status, ts(), Number(id)]);
    }
    const meeting = queryOne("SELECT * FROM meetings WHERE id = ?", [Number(id)]);
    if (!meeting) throw new Error("Meeting not found");
    return { message: "Meeting updated", meeting };
  },
};

export const referenceApi = {
  referringOfficers: async () => ({ officers: [] }),
  referenceModes: async () => ({ modes: [] }),
  requestCategories: async () => ({ categories: [] }),
  states: async () => ({ states: [] }),
  districts: async () => ({ districts: [] }),
};

export const employeesApi = {
  list: async (params = {}) => {
    await getDb();
    let sql = "SELECT * FROM employees";
    const conds = [];
    const p = [];
    if (params.search) {
      const t = `%${params.search}%`;
      conds.push("(name LIKE ? OR role LIKE ? OR department LIKE ? OR email LIKE ?)");
      p.push(t, t, t, t);
    }
    if (params.status === "active") conds.push("isActive = 1");
    if (params.status === "inactive") conds.push("isActive = 0");
    if (params.department && params.department !== "all") {
      conds.push("department = ?");
      p.push(params.department);
    }
    if (conds.length) sql += ` WHERE ${conds.join(" AND ")}`;
    sql += " ORDER BY createdAt DESC";
    const employees = queryAll(sql, p);
    employees.forEach((employee) => {
      employee.isActive = !!employee.isActive;
    });
    return { employees };
  },

  create: async (body) => {
    await getDb();
    const { name, role, email, phone, department, location, salary, joinDate, profileImg } = body;
    if (!name || !role || !email || !phone || !department || !location) {
      throw new Error("Name, role, email, phone, department and location are required");
    }
    const exists = queryOne("SELECT id FROM employees WHERE email = ?", [email.toLowerCase().trim()]);
    if (exists) throw new Error("Employee with this email already exists");
    const now = ts();
    execute(
      "INSERT INTO employees (name,role,email,phone,department,location,salary,joinDate,profileImg,isActive,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,1,?,?)",
      [name, role, email.toLowerCase().trim(), phone, department, location, salary || "", joinDate || now, profileImg || "", now, now]
    );
    const employee = queryOne("SELECT * FROM employees WHERE id = ?", [lastInsertId()]);
    employee.isActive = !!employee.isActive;
    return { message: "Employee added successfully", employee };
  },

  setStatus: async (id, isActive) => {
    await getDb();
    execute("UPDATE employees SET isActive=?,updatedAt=? WHERE id=?", [isActive ? 1 : 0, ts(), Number(id)]);
    const employee = queryOne("SELECT * FROM employees WHERE id = ?", [Number(id)]);
    if (!employee) throw new Error("Employee not found");
    employee.isActive = !!employee.isActive;
    return { message: "Status updated", employee };
  },
};
