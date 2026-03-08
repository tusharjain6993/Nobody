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
  me: () => request("GET", "/me", null, getToken()),
};

// ─── Dashboard ────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => request("GET", "/dashboard/stats", null, getToken()),
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
};

export const departmentApi = {
  overview: () => request("GET", "/departments/overview", null, getToken()),
};

// ─── Assignments ──────────────────────────────────────────────────────────
export const assignmentsApi = {
  create: (caseId, body) => request("POST", `/cases/${caseId}/assignments`, body, getToken()),
  update: (caseId, assignmentId, body) =>
    request("PATCH", `/cases/${caseId}/assignments/${assignmentId}`, body, getToken()),
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
