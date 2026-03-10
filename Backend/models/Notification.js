import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String, required: true, trim: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
  type: { type: String, enum: ["CASE_CREATED", "STATUS_CHANGE", "ASSIGNMENT", "REMINDER", "GENERAL"], default: "GENERAL" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
