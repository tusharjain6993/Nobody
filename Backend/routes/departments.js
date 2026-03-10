import { Router } from "express";
import Department from "../models/Department.js";
import Case from "../models/Case.js";
import User from "../models/User.js";
import { requireAuth, requireRole, requireStaffRole } from "../middleware/auth.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const router = Router();

const CATEGORY_DEPARTMENT_MAP = {
  "road": "Municipal Corporation",
  "water": "Water Supply Department",
  "electricity": "Electricity Board",
  "pension": "Social Welfare",
  "health": "Health Department",
  "education": "Education Department",
  "housing": "Housing Board",
  "agriculture": "Agriculture Department",
  "land": "Revenue Department",
  "police": "Home Department",
  "transport": "Transport Department",
  "sanitation": "Municipal Corporation",
  "tax": "Revenue Department",
  "employment": "Labour Department",
  "environment": "Environment Department",
  "women": "Women & Child Development",
};

router.post("/departments", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const state = String(req.body?.state || "").trim();
    const ministerName = String(req.body?.ministerName || "").trim();

    if (!name || !state || !ministerName) {
      return res.status(400).json({ message: "Name, state and minister name are required" });
    }

    const exists = await Department.findOne({
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
      state: { $regex: `^${escapeRegex(state)}$`, $options: "i" },
      ministerName: { $regex: `^${escapeRegex(ministerName)}$`, $options: "i" },
    });

    if (exists) {
      return res.status(409).json({ message: "Department already exists" });
    }

    const department = await Department.create({ name, state, ministerName });
    return res.status(201).json({ message: "Department added successfully", department });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to add department" });
  }
});

router.get("/departments/overview", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const [departments, groupedCases] = await Promise.all([
      Department.find().sort({ createdAt: -1 }).lean(),
      Case.aggregate([
        {
          $group: {
            _id: {
              state: "$state",
              name: "$category",
              ministerName: "$localAreaMinister",
            },
            totalCases: { $sum: 1 },
            submitted: {
              $sum: {
                $cond: [{ $eq: ["$status", "SUBMITTED"] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const statsByKey = new Map(
      groupedCases.map((item) => {
        const key = `${item._id.state}__${item._id.name}__${item._id.ministerName}`.toLowerCase();
        return [key, { totalCases: item.totalCases || 0, submitted: item.submitted || 0 }];
      })
    );

    const overview = departments.map((dept) => {
      const key = `${dept.state}__${dept.name}__${dept.ministerName}`.toLowerCase();
      const stats = statsByKey.get(key) || { totalCases: 0, submitted: 0 };
      return {
        _id: dept._id,
        state: dept.state,
        name: dept.name,
        ministerName: dept.ministerName,
        totalCases: stats.totalCases,
        submitted: stats.submitted,
      };
    });

    return res.json({ departments: overview });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load department overview" });
  }
});

router.get("/departments/options", requireAuth, async (req, res) => {
  try {
    const departments = await Department.find({}, { name: 1, _id: 0 })
      .sort({ name: 1 })
      .lean();

    const seen = new Set();
    const options = [];

    for (const item of departments) {
      const name = String(item.name || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ id: key.replace(/\s+/g, "_"), name });
    }

    return res.json({ departments: options });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load department options" });
  }
});

router.get("/authority/suggestions", requireAuth, requireStaffRole, async (req, res) => {
  try {
    const { category, state } = req.query;
    const query = { role: "official" };

    if (state) {
      query.$or = [
        { "state": { $regex: escapeRegex(String(state).trim()), $options: "i" } },
      ];
    }

    let officials = await User.find(query).select("-password -aadhaar").limit(10).lean();

    let suggestedDepartment = null;
    if (category) {
      const catLower = String(category).toLowerCase();
      for (const [key, dept] of Object.entries(CATEGORY_DEPARTMENT_MAP)) {
        if (catLower.includes(key)) {
          suggestedDepartment = dept;
          break;
        }
      }
    }

    return res.json({
      officials,
      suggestedDepartment,
      categoryMap: CATEGORY_DEPARTMENT_MAP,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch authority suggestions" });
  }
});

export default router;
