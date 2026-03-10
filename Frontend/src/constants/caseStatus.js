/** Case status values used by the API and UI. */
export const CASE_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "REQUEST_CLARIFICATION",
  "RESOLVED",
  "RESOLVED_WITHOUT_MEETING",
  "SCHEDULED",
  "CLOSED",
];

/** Staff roles that can access dashboard, cases, review, schedule. */
export const STAFF_ROLES = ["admin", "ps", "aps", "additional_ps", "staff", "official"];

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}
