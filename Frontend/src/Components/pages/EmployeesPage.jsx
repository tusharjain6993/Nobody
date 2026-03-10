import { useEffect, useMemo, useState } from "react";
import { employeesApi } from "../../minister/ministerApi";

const INITIAL_FORM = {
  name: "",
  role: "",
  email: "",
  phone: "",
  department: "",
  location: "",
  salary: "",
  joinDate: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  async function loadEmployees() {
    setLoading(true);
    setError("");
    try {
      const res = await employeesApi.list();
      setEmployees(res.employees || []);
    } catch (err) {
      setError(err.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const departments = useMemo(() => ["all", ...new Set(employees.map((e) => e.department).filter(Boolean))], [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        e.name?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && e.isActive) ||
        (statusFilter === "inactive" && !e.isActive);
      const matchDepartment = departmentFilter === "all" || e.department === departmentFilter;
      return matchSearch && matchStatus && matchDepartment;
    });
  }, [employees, search, statusFilter, departmentFilter]);

  async function handleAddEmployee(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await employeesApi.create({ ...form });
      setForm(INITIAL_FORM);
      setShowAdd(false);
      await loadEmployees();
    } catch (err) {
      setError(err.message || "Failed to add employee");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(employee) {
    try {
      await employeesApi.setStatus(employee._id, !employee.isActive);
      await loadEmployees();
    } catch (err) {
      setError(err.message || "Failed to update employee status");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Employees</h1>
          <p className="text-sm text-slate-500">Manage employees from admin panel (no hardcoded data).</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold btn-3d"
        >
          {showAdd ? "Close" : "+ Add Employee"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600 font-medium">{error}</div>}

      {showAdd && (
        <form onSubmit={handleAddEmployee} className="rounded-xl border border-slate-200/60 bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-3d">
          {[
            ["name", "Name"],
            ["role", "Role"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["department", "Department"],
            ["location", "Location"],
            ["salary", "Salary (optional)"],
          ].map(([key, label]) => (
            <input
              key={key}
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={label}
              required={!["salary"].includes(key)}
              className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
            />
          ))}
          <input
            type="date"
            value={form.joinDate}
            onChange={(e) => setForm((prev) => ({ ...prev, joinDate: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-3d">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, role, department, email"
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDepartmentFilter("all");
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            Reset Filters
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500">No employees found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Department</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp._id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-semibold text-slate-800">{emp.name}</td>
                    <td className="py-2 pr-3">{emp.role}</td>
                    <td className="py-2 pr-3">{emp.department}</td>
                    <td className="py-2 pr-3">{emp.email}</td>
                    <td className="py-2 pr-3">{emp.phone}</td>
                    <td className="py-2 pr-3">{emp.location}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${emp.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => toggleStatus(emp)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs hover:bg-slate-100"
                      >
                        {emp.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
