import { Router } from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    return res.json({ notifications, unreadCount });
  } catch {
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    return res.json({ notification: notif });
  } catch {
    return res.status(500).json({ message: "Failed to update notification" });
  }
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.json({ message: "All marked as read" });
  } catch {
    return res.status(500).json({ message: "Failed to mark all as read" });
  }
});

export default router;
