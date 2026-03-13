export const SYSTEM_ROLES = [
  { id: "admin", label: "Admin" },
  { id: "minister", label: "Minister" },
  { id: "deo", label: "Data Entry Operator" },
  { id: "citizen", label: "Citizen" },
];

export const ROLE_LABELS = SYSTEM_ROLES.reduce((acc, role) => {
  acc[role.id] = role.label;
  return acc;
}, {});

export const STAFF_ROLE_IDS = ["admin", "minister", "deo"];

export function getRoleLabel(roleId) {
  return ROLE_LABELS[roleId] || roleId || "Unknown";
}
