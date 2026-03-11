import { STAFF_ROLE_IDS } from "./adminWorkflow";

/** Case status values used by the API and UI. */
export const CASE_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "REQUEST_CLARIFICATION",
  "RESOLVED",
  "RESOLVED_WITHOUT_MEETING",
  "SCHEDULED",
  "REOPENED",
  "ESCALATED",
  "CLOSURE_PENDING_MINISTER",
  "REJECTION_PENDING_MINISTER",
  "REJECTED",
  "CLOSED",
];

/** Staff roles that can access dashboard, cases, review, schedule. */
export const STAFF_ROLES = STAFF_ROLE_IDS;

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}
