import { Router } from "express";
import Department from "../models/Department.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();


// Add Department
router.post("/departments", requireAuth, requireRole("admin"), async (req, res) => {
  try {

    const { name, state, ministerName } = req.body;

    if (!name || !state || !ministerName) {
      return res.status(400).json({
        message: "All department fields are required"
      });
    }

    const department = await Department.create({
      name,
      state,
      ministerName
    });

    return res.status(201).json({
      message: "Department created successfully",
      department
    });

  } catch (err) {

    return res.status(500).json({
      message: err.message || "Failed to create department"
    });

  }
});


// Get Departments (for overview table)
router.get("/departments/all", requireAuth, requireRole("admin"), async (req, res) => {
  try {

    const departments = await Department.find().sort({ createdAt: -1 });

    return res.json({
      departments
    });

  } catch {

    return res.status(500).json({
      message: "Failed to load departments"
    });

  }
});

export default router;