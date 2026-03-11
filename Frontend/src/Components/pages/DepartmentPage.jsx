import { useEffect, useMemo, useState } from "react";
import { AddRegular, DismissRegular } from "@fluentui/react-icons";
import { departmentApi } from "../../minister/ministerApi";

function AddDepartmentModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    ministerName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.state || !formData.ministerName) {
      setError("All fields are required");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await departmentApi.create(formData);
      onSuccess?.();
      onClose();
      setFormData({ name: "", state: "", ministerName: "" });
    } catch (err) {
      setError(err.message || "Failed to add department");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-3d-lg max-w-md w-full animate-in slide-in-from-bottom-5 duration-500 border border-slate-100/60">
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-blue-600">
              <AddRegular style={{ fontSize: 20 }} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Add Department</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600">
            <DismissRegular style={{ fontSize: 20 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{error}</div>}
          {[
            ["name", "Department Name *", "e.g., Social Welfare"],
            ["state", "State *", "e.g., Maharashtra"],
            ["ministerName", "Minister Name *", "e.g., Rajesh Kumar"],
          ].map(([name, label, placeholder]) => (
            <div key={name}>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">{label}</label>
              <input
                type="text"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-slate-400"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
              {loading ? "Adding..." : "Add Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDepartmentCard({ group }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-3d p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">{group.roleLabel}</h3>
          <p className="text-xs text-slate-500 mt-1">{group.departments.length} departments assigned</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
          Admin Queue
        </span>
      </div>

      <div className="space-y-2">
        {group.departments.map((department, index) => (
          <div key={department.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {index + 1}. {department.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {department.state} • {department.ministerName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{department.totalCases}</div>
                <div className="text-[11px] text-slate-500">cases</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DepartmentPage() {
  const [rows, setRows] = useState([]);
  const [adminGroups, setAdminGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentApi.overview();
      setRows(res.departments || []);
      setAdminGroups(res.adminGroups || []);
    } catch (err) {
      setError(err.message || "Failed to load department data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const totals = useMemo(() => ({
    departments: rows.length,
    cases: rows.reduce((sum, row) => sum + Number(row.totalCases || 0), 0),
    submitted: rows.reduce((sum, row) => sum + Number(row.submitted || 0), 0),
  }), [rows]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Department Distribution</h1>
            <p className="text-slate-600 font-medium">Departments are divided equally across Director, Vice Chancellor, Director General, and Secretary.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl btn-3d whitespace-nowrap flex-shrink-0"
          >
            <AddRegular style={{ fontSize: 20 }} />
            Add Department
          </button>
        </div>

        <AddDepartmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={loadDepartments} />

        {loading ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center shadow-3d">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Loading department overview...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                ["Total Departments", totals.departments],
                ["Total Cases", totals.cases],
                ["Submitted Cases", totals.submitted],
              ].map(([label, value]) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200/60 shadow-3d p-5">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
              {adminGroups.map((group) => (
                <AdminDepartmentCard key={group.roleId} group={group} />
              ))}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-3d">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["State", "Department Name", "Assigned Admin", "Minister Name", "Total Cases", "Submitted Cases"].map((heading) => (
                      <th key={heading} className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{row.state}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                          {row.adminLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.ministerName}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.totalCases}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.submitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
