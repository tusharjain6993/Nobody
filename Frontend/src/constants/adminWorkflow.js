export const ADMIN_ROLES = [
  {
    id: "director",
    label: "Director",
    email: "director@portal.gov",
    password: "director123",
  },
  {
    id: "vice_chancellor",
    label: "Vice Chancellor",
    email: "vicechancellor@portal.gov",
    password: "vc123",
  },
  {
    id: "director_general",
    label: "Director General",
    email: "directorgeneral@portal.gov",
    password: "dg123",
  },
  {
    id: "secretary",
    label: "Secretary",
    email: "secretary@portal.gov",
    password: "secretary123",
  },
];

export const MASTER_ADMIN_ROLE = {
  id: "minister",
  label: "Minister",
  email: "minister@portal.gov",
  password: "minister123",
};

export const STAFF_ROLE_IDS = [
  ...ADMIN_ROLES.map((role) => role.id),
  MASTER_ADMIN_ROLE.id,
];

export const ROLE_LABELS = STAFF_ROLE_IDS.reduce(
  (acc, roleId) => {
    const role = [...ADMIN_ROLES, MASTER_ADMIN_ROLE].find((item) => item.id === roleId);
    acc[roleId] = role?.label || roleId;
    return acc;
  },
  { citizen: "Citizen" }
);

export function getRoleLabel(roleId) {
  return ROLE_LABELS[roleId] || roleId || "Unknown";
}

export function splitDepartmentsAcrossAdmins(departments) {
  const cleanDepartments = [...departments];
  const baseSize = Math.floor(cleanDepartments.length / ADMIN_ROLES.length);
  const remainder = cleanDepartments.length % ADMIN_ROLES.length;
  let start = 0;

  return ADMIN_ROLES.map((role, index) => {
    const size = baseSize + (index < remainder ? 1 : 0);
    const assignedDepartments = cleanDepartments.slice(start, start + size);
    start += size;
    return {
      ...role,
      departments: assignedDepartments,
    };
  });
}

export function getDepartmentAdminMap(departments) {
  return splitDepartmentsAcrossAdmins(departments).reduce((acc, role) => {
    role.departments.forEach((department) => {
      const name = (department.name || "").trim().toLowerCase();
      if (name) {
        acc[name] = {
          roleId: role.id,
          roleLabel: role.label,
        };
      }
    });
    return acc;
  }, {});
}

export function getDepartmentOwner(departments, departmentName) {
  const key = (departmentName || "").trim().toLowerCase();
  return getDepartmentAdminMap(departments)[key] || null;
}
