// ─── HCM Minister Portal — API Client ───────────────────────────────────────
// Base URL: configurable via env; fallback to localhost:4000
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const PREFIX = "/api/v1";

/**
 * Core request helper – mirrors axios.get/post/patch semantics.
 * Returns { data } on success, throws on HTTP error.
 */
async function request(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${PREFIX}${path}`, opts);
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("hcm_token");
      localStorage.removeItem("hcm_user");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

function getToken() {
  return localStorage.getItem("hcm_token");
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    request("POST", "/login", { email, password }),
  loginByCitizenId: (citizenId) =>
    request("POST", "/citizen-id-login", { citizenId }),
  me: () => request("GET", "/me", null, getToken()),
  register: (body) => request("POST", "/register", body),
  verifyOtp: (email, otp) => request("POST", "/verify-otp", { email, otp }),
  resendOtp: (email) => request("POST", "/resend-otp", { email }),
  sendLoginOtp: (payload) => request("POST", "/send-login-otp", payload),
  loginWithOtp: (payload) => request("POST", "/login-with-otp", payload),
};

// ─── Dashboard ────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => request("GET", "/dashboard/stats", null, getToken()),
  upcomingMeetings: () => request("GET", "/dashboard/meetings/upcoming", null, getToken()),
  openTasks: () => request("GET", "/dashboard/tasks/open", null, getToken()),
};

// ─── Citizens ─────────────────────────────────────────────────────────────
export const citizensApi = {
  list: (search = "", page = 1, limit = 20) =>
    request("GET", `/citizens?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`, null, getToken()),
  create: (body) => request("POST", "/citizens", body, getToken()),
};

// ─── Cases ────────────────────────────────────────────────────────────────
export const casesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
    ).toString();
    return request("GET", `/cases${qs ? "?" + qs : ""}`, null, getToken());
  },
  get: (id) => request("GET", `/cases/${id}`, null, getToken()),
  create: (body) => request("POST", "/cases", body, getToken()),
  authorize: (id, payload) => request("PATCH", `/cases/${id}/authorize`, payload, getToken()),
  schedule: (id, payload) => request("PATCH", `/cases/${id}/schedule`, payload, getToken()),
  checkin: (id, payload) => request("PATCH", `/cases/${id}/checkin`, payload, getToken()),
  close: (id, payload) => request("PATCH", `/cases/${id}/close`, payload, getToken()),
  updateStatus: (caseId, status) => request("PATCH", `/cases/${caseId}/status`, { status }, getToken()),
  addComment: (caseId, content) => request("POST", `/cases/${caseId}/comments`, { content }, getToken()),
  review: (caseId, payload) => request("PATCH", `/cases/${caseId}/review`, payload, getToken()),
  schedule: (caseId, payload) => request("PATCH", `/cases/${caseId}/schedule`, payload, getToken()),
  complete: (caseId, payload) => request("PATCH", `/cases/${caseId}/complete`, payload, getToken()),
  bulkArchive: (ids) => request("PATCH", "/cases/bulk/archive", { ids }, getToken()),
  bulkUnarchive: (ids) => request("PATCH", "/cases/bulk/unarchive", { ids }, getToken()),
  bulkDelete: (ids) => request("PATCH", "/cases/bulk/delete", { ids }, getToken()),
  bulkRestore: (ids) => request("PATCH", "/cases/bulk/restore", { ids }, getToken()),
  bulkPermanentDelete: (ids) => request("DELETE", "/cases/bulk/permanent", { ids }, getToken()),
};

export const departmentApi = {
  overview: () => request("GET", "/departments/overview", null, getToken()),
  create: (body) => request("POST", "/departments", body, getToken()),
  options: () => request("GET", "/departments/options", null, getToken()),
};

// ─── Assignments ──────────────────────────────────────────────────────────
export const assignmentsApi = {
  list: (caseId) => request("GET", `/cases/${caseId}/assignments`, null, getToken()),
  create: (caseId, body) => request("POST", `/cases/${caseId}/assignments`, body, getToken()),
  update: (caseId, assignmentId, body) =>
    request("PATCH", `/cases/${caseId}/assignments/${assignmentId}`, body, getToken()),
};

// ─── Communications ───────────────────────────────────────────────────────
export const communicationsApi = {
  list: (caseId) => request("GET", `/cases/${caseId}/communications`, null, getToken()),
  create: (caseId, body) => request("POST", `/cases/${caseId}/communications`, body, getToken()),
};

// ─── Notifications ────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request("GET", "/notifications", null, getToken()),
  markRead: (id) => request("PATCH", `/notifications/${id}/read`, null, getToken()),
  markAllRead: () => request("PATCH", "/notifications/read-all", null, getToken()),
};

// ─── Authority suggestions ────────────────────────────────────────────────
export const authorityApi = {
  suggestions: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
    ).toString();
    return request("GET", `/authority/suggestions${qs ? "?" + qs : ""}`, null, getToken());
  },
};

// ─── Reference data ───────────────────────────────────────────────────────
export const referenceApi = {
  referringOfficers: () => request("GET", "/referring-officers"),
  referenceModes: () => request("GET", "/reference-modes"),
  requestCategories: () => request("GET", "/request-categories"),
  states: () => request("GET", "/states"),
  districts: (stateId) => request("GET", `/districts?stateId=${stateId}`),
};

// --- Employees -------------------------------------------------------------
export const employeesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
    ).toString();
    return request("GET", `/employees${qs ? "?" + qs : ""}`, null, getToken());
  },
  create: (body) => request("POST", "/employees", body, getToken()),
  setStatus: (id, isActive) => request("PATCH", `/employees/${id}/status`, { isActive }, getToken()),
};
