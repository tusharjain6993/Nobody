import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

/** Admin-side roles: PS, APS, Additional PS, Staff, Admin. Use for office review/schedule/complete. */
const STAFF_ROLES = ["admin", "ps", "aps", "additional_ps", "staff", "official"];

export function requireStaffRole(req, res, next) {
  if (!req.user || !STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
