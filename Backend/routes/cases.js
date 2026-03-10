import { Router } from "express";
import Case from "../models/Case.js";
import { requireAuth, requireRole, requireStaffRole } from "../middleware/auth.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { notifyCaseEvent, createNotification } from "../utils/notify.js";
import { maskCaseResponse } from "../utils/mask.js";

const router = Router();

const STAFF_ROLES = ["admin", "ps", "aps", "additional_ps", "staff", "official"];

function canViewCase(user, caseItem) {
  if (STAFF_ROLES.includes(user.role)) return true;
  return String(caseItem.citizenId) === String(user._id);
}

router.post("/cases", requireAuth, requireRole("citizen"), async (req, res) => {
  try {
    const {
      purpose,
      category,
      referralPerson,
      state,
      pincode,
      districtCity,
      localAreaMinister,
      urgency,
      details,
      documents,
    } = req.body;

    if (!purpose || !referralPerson || !state || !pincode || !districtCity || !localAreaMinister) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const docList = Array.isArray(documents)
      ? documents.filter((d) => d && d.name && d.url).map((d) => ({ name: d.name, url: d.url }))
      : [];

    const newCase = await Case.create({
      citizenId: req.user._id,
      citizenSnapshot: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        aadhaar: req.user.aadhaar,
        gender: req.user.gender,
        age: req.user.age,
      },
      purpose,
      category: category || "Other",
      referralPerson,
      state,
      pincode,
      districtCity,
      localAreaMinister,
      urgency: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(urgency) ? urgency : "MEDIUM",
      details: details ? String(details).trim() : undefined,
      documents: docList,
      status: "SUBMITTED",
    });

    await createNotification({
      userId: req.user._id,
      message: `Your case ${newCase.caseId} has been submitted successfully.`,
      caseId: newCase._id,
      type: "CASE_CREATED",
    });

    return res.status(201).json({
      message: "Case submitted successfully",
      case: newCase,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to create case" });
  }
});

router.get("/cases", requireAuth, async (req, res) => {
  try {
    const query = {};
    const { search, status, view } = req.query;

    if (!STAFF_ROLES.includes(req.user.role)) {
      query.citizenId = req.user._id;
    }

    if (view === "archived") {
      query.isArchived = true;
      query.isDeleted = { $ne: true };
    } else if (view === "deleted") {
      query.isDeleted = true;
    } else {
      query.isArchived = { $ne: true };
      query.isDeleted = { $ne: true };
    }

    if (status) query.status = status;
    if (search && String(search).trim()) {
      const escaped = escapeRegex(String(search).trim());
      query.$or = [
        { caseId: { $regex: escaped, $options: "i" } },
        { purpose: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
        { "citizenSnapshot.name": { $regex: escaped, $options: "i" } },
        { "citizenSnapshot.email": { $regex: escaped, $options: "i" } },
      ];
    }

    const cases = await Case.find(query).sort({ createdAt: -1 });
    return res.json({ cases: cases.map(maskCaseResponse) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch cases" });
  }
});

// ─── Bulk actions (archive / delete / restore) ───────────────────────────
// Defined before :id routes so Express doesn't treat "bulk" as a case ID.

router.patch("/cases/bulk/archive", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const result = await Case.updateMany({ _id: { $in: ids } }, { $set: { isArchived: true } });
    return res.json({ message: `${result.modifiedCount} case(s) archived` });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to archive cases" });
  }
});

router.patch("/cases/bulk/unarchive", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const result = await Case.updateMany({ _id: { $in: ids } }, { $set: { isArchived: false } });
    return res.json({ message: `${result.modifiedCount} case(s) restored from archive` });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to unarchive cases" });
  }
});

router.patch("/cases/bulk/delete", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const result = await Case.updateMany({ _id: { $in: ids } }, { $set: { isDeleted: true } });
    return res.json({ message: `${result.modifiedCount} case(s) deleted` });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to delete cases" });
  }
});

router.patch("/cases/bulk/restore", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const result = await Case.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: false, isArchived: false } }
    );
    return res.json({ message: `${result.modifiedCount} case(s) restored` });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to restore cases" });
  }
});

router.delete("/cases/bulk/permanent", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const result = await Case.deleteMany({ _id: { $in: ids }, isDeleted: true });
    return res.json({ message: `${result.deletedCount} case(s) permanently deleted` });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to permanently delete cases" });
  }
});

// ─── Single case ──────────────────────────────────────────────────────────

router.get("/cases/:id", requireAuth, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });

    if (!canViewCase(req.user, caseItem)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ case: maskCaseResponse(caseItem) });
  } catch {
    return res.status(500).json({ message: "Failed to fetch case" });
  }
});

router.patch("/cases/:id/review", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });

    const { action, note } = req.body;
    const valid = ["APPROVE", "REJECT", "REQUEST_CLARIFICATION", "RESOLVE_WITHOUT_MEETING"];
    if (!action || !valid.includes(action)) {
      return res.status(400).json({ message: "action must be one of: " + valid.join(", ") });
    }

    let newStatus;
    let resolvedWithoutMeeting = caseItem.resolvedWithoutMeeting;
    if (action === "APPROVE") {
      newStatus = "APPROVED";
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
    } else if (action === "REQUEST_CLARIFICATION") {
      newStatus = "REQUEST_CLARIFICATION";
    } else {
      newStatus = "RESOLVED_WITHOUT_MEETING";
      resolvedWithoutMeeting = true;
    }

    caseItem.status = newStatus;
    caseItem.reviewNote = note ? String(note).trim() : caseItem.reviewNote;
    caseItem.resolvedWithoutMeeting = resolvedWithoutMeeting;
    await caseItem.save();

    const email = caseItem.citizenSnapshot?.email;
    const phone = caseItem.citizenSnapshot?.phone;
    await notifyCaseEvent({
      type: "review",
      caseItem,
      email,
      phone,
      subject: `Case ${caseItem.caseId} - ${action}`,
      body: note || `Your case has been ${action.replace("_", " ").toLowerCase()}.`,
      smsBody: `Case ${caseItem.caseId}: ${action}. ${(note || "").slice(0, 50)}`,
    });

    await createNotification({
      userId: caseItem.citizenId,
      message: `Case ${caseItem.caseId} has been ${action.replace(/_/g, " ").toLowerCase()}.`,
      caseId: caseItem._id,
      type: "STATUS_CHANGE",
    });

    return res.json({ message: "Review updated", case: caseItem });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update review" });
  }
});

router.patch("/cases/:id/schedule", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });
    if (caseItem.status !== "APPROVED") {
      return res.status(400).json({ message: "Case must be APPROVED before scheduling" });
    }

    const { scheduledAt, slot, type, venue } = req.body;
    if (!scheduledAt) {
      return res.status(400).json({ message: "scheduledAt is required" });
    }

    caseItem.schedule = {
      scheduledAt: new Date(scheduledAt),
      slot: slot ? String(slot).trim() : "",
      type: type ? String(type).trim() : "",
      venue: venue ? String(venue).trim() : "",
    };
    caseItem.status = "SCHEDULED";
    await caseItem.save();

    const email = caseItem.citizenSnapshot?.email;
    const phone = caseItem.citizenSnapshot?.phone;
    const dt = new Date(scheduledAt).toLocaleString();
    await notifyCaseEvent({
      type: "schedule",
      caseItem,
      email,
      phone,
      subject: `Meeting scheduled - Case ${caseItem.caseId}`,
      body: `Your meeting for case ${caseItem.caseId} is scheduled on ${dt}. ${venue ? "Venue: " + venue : ""}`,
      smsBody: `Case ${caseItem.caseId}: Meeting on ${dt}. ${venue || ""}`,
    });

    await createNotification({
      userId: caseItem.citizenId,
      message: `Meeting for case ${caseItem.caseId} scheduled on ${dt}.`,
      caseId: caseItem._id,
      type: "STATUS_CHANGE",
    });

    return res.json({ message: "Schedule updated", case: caseItem });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to schedule" });
  }
});

router.patch("/cases/:id/complete", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });

    const { meetingSummary, actionRequired, responsibleAuthority } = req.body;

    if (meetingSummary !== undefined) caseItem.meetingSummary = String(meetingSummary).trim();
    if (actionRequired !== undefined) caseItem.actionRequired = String(actionRequired).trim();
    if (responsibleAuthority !== undefined) caseItem.responsibleAuthority = String(responsibleAuthority).trim();
    caseItem.status = "CLOSED";
    await caseItem.save();

    await createNotification({
      userId: caseItem.citizenId,
      message: `Case ${caseItem.caseId} has been closed.`,
      caseId: caseItem._id,
      type: "STATUS_CHANGE",
    });

    return res.json({ message: "Case closed", case: caseItem });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to complete" });
  }
});

// ─── Assignments ──────────────────────────────────────────────────────────

router.get("/cases/:id/assignments", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });
    return res.json({ assignments: caseItem.assignments || [] });
  } catch {
    return res.status(500).json({ message: "Failed to fetch assignments" });
  }
});

router.post("/cases/:id/assignments", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });

    const { title, assignedToName, priority, dueDate } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    const validPriority = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    caseItem.assignments.push({
      title: String(title).trim(),
      assignedToName: assignedToName ? String(assignedToName).trim() : "",
      priority: validPriority.includes(priority) ? priority : "MEDIUM",
      status: "PENDING",
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    await caseItem.save();

    return res.status(201).json({ message: "Assignment created", case: caseItem });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to create assignment" });
  }
});

router.patch("/cases/:id/assignments/:assignmentId", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });

    const assignment = caseItem.assignments.id(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const { status, priority, dueDate, title, assignedToName } = req.body;
    const validStatuses = ["PENDING", "IN_PROGRESS", "AWAITING_RESPONSE", "RESOLVED", "CLOSED"];
    const validPriority = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    if (status && validStatuses.includes(status)) assignment.status = status;
    if (priority && validPriority.includes(priority)) assignment.priority = priority;
    if (dueDate !== undefined) assignment.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (title) assignment.title = String(title).trim();
    if (assignedToName !== undefined) assignment.assignedToName = String(assignedToName).trim();

    await caseItem.save();
    return res.json({ message: "Assignment updated", case: caseItem });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update assignment" });
  }
});

// ─── Communications ───────────────────────────────────────────────────────

router.get("/cases/:id/communications", requireAuth, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });
    if (!canViewCase(req.user, caseItem)) return res.status(403).json({ message: "Forbidden" });
    return res.json({ communications: caseItem.communications || [] });
  } catch {
    return res.status(500).json({ message: "Failed to fetch communications" });
  }
});

router.post("/cases/:id/communications", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });

    const { type, summary, happenedAt } = req.body;
    const validTypes = ["CALL", "LETTER", "EMAIL", "MEETING_NOTE"];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ message: "type must be one of: " + validTypes.join(", ") });
    }
    if (!summary || !String(summary).trim()) {
      return res.status(400).json({ message: "summary is required" });
    }

    caseItem.communications.push({
      type,
      summary: String(summary).trim(),
      happenedAt: happenedAt ? new Date(happenedAt) : new Date(),
      createdByName: req.user.name || "Staff",
    });
    await caseItem.save();

    return res.status(201).json({ message: "Communication logged", case: caseItem });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to log communication" });
  }
});

// ─── Dashboard ────────────────────────────────────────────────────────────

router.get("/dashboard/meetings/upcoming", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const cases = await Case.find({
      status: "SCHEDULED",
      "schedule.scheduledAt": { $gte: new Date() },
    })
      .sort({ "schedule.scheduledAt": 1 })
      .limit(20);
    return res.json({ meetings: cases });
  } catch {
    return res.status(500).json({ message: "Failed to fetch meetings" });
  }
});

router.get("/dashboard/tasks/open", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const cases = await Case.find({
      "assignments.status": { $in: ["PENDING", "IN_PROGRESS", "AWAITING_RESPONSE"] },
    })
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json({ cases });
  } catch {
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.get("/dashboard/stats", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const [
      totalCases,
      submitted,
      inReview,
      approved,
      rejected,
      requestClarification,
      resolvedWithoutMeeting,
      scheduled,
      closed,
      resolved,
      urgentHigh,
      openAssignments,
      recentCases,
    ] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: "SUBMITTED" }),
      Case.countDocuments({ status: "IN_REVIEW" }),
      Case.countDocuments({ status: "APPROVED" }),
      Case.countDocuments({ status: "REJECTED" }),
      Case.countDocuments({ status: "REQUEST_CLARIFICATION" }),
      Case.countDocuments({ status: "RESOLVED_WITHOUT_MEETING" }),
      Case.countDocuments({ status: "SCHEDULED" }),
      Case.countDocuments({ status: "CLOSED" }),
      Case.countDocuments({ status: "RESOLVED" }),
      Case.countDocuments({ urgency: { $in: ["HIGH", "CRITICAL"] } }),
      Case.countDocuments({ "assignments.status": { $in: ["PENDING", "IN_PROGRESS", "AWAITING_RESPONSE"] } }),
      Case.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return res.json({
      totalCases,
      submitted,
      inReview,
      approved,
      rejected,
      requestClarification,
      resolvedWithoutMeeting,
      scheduled,
      closed,
      resolved,
      urgentHigh,
      openAssignments,
      recentCases,
    });
  } catch {
    return res.status(500).json({ message: "Failed to load dashboard stats" });
  }
});

export default router;
