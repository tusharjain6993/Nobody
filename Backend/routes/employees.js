import { Router } from "express";
import Employee from "../models/Employee.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/employees", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { search = "", status = "all", department = "all" } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (department !== "all") query.department = department;

    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.json({ employees });
  } catch {
    res.status(500).json({ message: "Failed to load employees" });
  }
});

router.post("/employees", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, role, email, phone, department, location, salary, joinDate, profileImg } = req.body;

    if (!name || !role || !email || !phone || !department || !location) {
      return res.status(400).json({ message: "Name, role, email, phone, department and location are required" });
    }

    const exists = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: "Employee with this email already exists" });

    const employee = await Employee.create({
      name,
      role,
      email,
      phone,
      department,
      location,
      salary: salary || "",
      joinDate: joinDate || new Date(),
      profileImg: profileImg || "",
      isActive: true,
    });

    res.status(201).json({ message: "Employee added successfully", employee });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to add employee" });
  }
});

router.patch("/employees/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { isActive } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: !!isActive },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Status updated", employee });
  } catch {
    res.status(500).json({ message: "Failed to update status" });
  }
});

export default router;
