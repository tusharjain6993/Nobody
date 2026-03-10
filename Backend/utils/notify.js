import Notification from "../models/Notification.js";

export async function notifyCaseEvent({ type, caseItem, email, phone, subject, body, smsBody }) {
  console.log(`[Notify] ${type} case=${caseItem?.caseId || "-"} email=${email || "-"} phone=${phone || "-"}`);
  if (email && (subject || body)) {
    console.log(`[Email stub] To ${email}: ${subject || ""} ${(body || "").slice(0, 80)}...`);
  }
  if (phone && smsBody) {
    console.log(`[SMS stub] To ${phone}: ${smsBody}`);
  }
}

export async function createNotification({ userId, message, caseId, type = "GENERAL" }) {
  try {
    await Notification.create({ userId, message, caseId, type });
  } catch (err) {
    console.error("[Notification] Failed to create:", err.message);
  }
}
