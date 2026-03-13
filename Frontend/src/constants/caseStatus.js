import { STAFF_ROLE_IDS } from "./adminWorkflow";

export const MEETING_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "verification_needed",
  "verification_completed",
  "approved",
  "scheduled",
  "rejected",
];

export const COMPLAINT_STATUSES = [
  "submitted",
  "pooled",
  "assigned",
  "under_review",
  "department_contact_identified",
  "call_scheduled",
  "followup_in_progress",
  "resolved",
  "escalated_to_admin_meeting",
];

export function isStaffRole(role) {
  return STAFF_ROLE_IDS.includes(role);
}
