import { Router } from "express";
import Meeting from "../models/Meeting.js";
import { requireAuth, requireStaffRole } from "../middleware/auth.js";

const router = Router();

router.get("/meetings", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ createdAt: -1 }).lean();
    return res.json({ meetings });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch meetings" });
  }
});

router.post("/meetings", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const { caseId, caseNumber, department, title, assignedToName, priority, dueDate } = req.body;
    if (!department || !title) {
      return res.status(400).json({ message: "department and title are required" });
    }

    const meeting = await Meeting.create({
      caseId: caseId || undefined,
      caseNumber: caseNumber || "",
      department,
      title,
      assignedToName: assignedToName || "",
      priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    return res.status(201).json({ message: "Meeting invite created", meeting });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to create meeting" });
  }
});

router.patch("/meetings/:id", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    const { status } = req.body;
    if (status && ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
      meeting.status = status;
    }
    await meeting.save();
    return res.json({ message: "Meeting updated", meeting });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update meeting" });
  }
});

export default router;
