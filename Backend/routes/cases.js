import { Router } from "express";
import Case from "../models/Case.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

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
    } = req.body;

    if (!purpose || !category || !referralPerson || !state || !pincode || !districtCity || !localAreaMinister) {
      return res.status(400).json({ message: "All case fields are required" });
    }

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
      category,
      referralPerson,
      state,
      pincode,
      districtCity,
      localAreaMinister,
      status: "SUBMITTED",
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
    const { search, status } = req.query;

    if (req.user.role === "citizen") {
      query.citizenId = req.user._id;
    }

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { caseId: { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { "citizenSnapshot.name": { $regex: search, $options: "i" } },
        { "citizenSnapshot.email": { $regex: search, $options: "i" } },
      ];
    }

    const cases = await Case.find(query).sort({ createdAt: -1 });
    return res.json({ cases });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch cases" });
  }
});

router.get("/cases/:id", requireAuth, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });

    const isOwner = String(caseItem.citizenId) === String(req.user._id);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ case: caseItem });
  } catch {
    return res.status(500).json({ message: "Failed to fetch case" });
  }
});

router.get("/dashboard/stats", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [totalCases, submitted, inReview, resolved, rejected, recentCases] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: "SUBMITTED" }),
      Case.countDocuments({ status: "IN_REVIEW" }),
      Case.countDocuments({ status: "RESOLVED" }),
      Case.countDocuments({ status: "REJECTED" }),
      Case.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return res.json({
      totalCases,
      submitted,
      inReview,
      resolved,
      rejected,
      recentCases,
    });
  } catch {
    return res.status(500).json({ message: "Failed to load dashboard stats" });
  }
});

router.get("/departments/overview", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const grouped = await Case.aggregate([
      {
        $group: {
          _id: { state: "$state", districtCity: "$districtCity" },
          totalCases: { $sum: 1 },
          submitted: {
            $sum: {
              $cond: [{ $eq: ["$status", "SUBMITTED"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          state: "$_id.state",
          districtCity: "$_id.districtCity",
          totalCases: 1,
          submitted: 1,
        },
      },
      { $sort: { totalCases: -1 } },
    ]);

    return res.json({ departments: grouped });
  } catch {
    return res.status(500).json({ message: "Failed to load department overview" });
  }
});

export default router;
