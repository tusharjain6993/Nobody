import { useEffect, useState } from "react";
import { AddRegular, DismissRegular } from "@fluentui/react-icons";
import { departmentApi } from "../../minister/ministerApi";

// Add Department Modal Component
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
    setFormData(prev => ({ ...prev, [name]: value }));
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

    setFormData({
      name: "",
      state: "",
      ministerName: ""
    });

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
        {/* Header */}
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-blue-600">
              <AddRegular style={{ fontSize: 20 }} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Add Department</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600"
          >
            <DismissRegular style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Department Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Social Welfare"
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              State *
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="e.g., Maharashtra"
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Minister Name *
            </label>
            <input
              type="text"
              name="ministerName"
              value={formData.ministerName}
              onChange={handleChange}
              placeholder="e.g., Rajesh Kumar"
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-slate-400"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <AddRegular style={{ fontSize: 18 }} />
                  Add Department
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Department Page Component
export default function DepartmentPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await departmentApi.overview();
        if (mounted) setRows(res.departments || []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load department data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddSuccess = () => {
    // Reload data after adding new department
    const load = async () => {
      try {
        const res = await departmentApi.overview();
        setRows(res.departments || []);
      } catch (err) {
        console.error("Failed to reload departments:", err);
      }
    };
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Add Button */}
        <div className="flex items-start justify-between mb-8 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
              Department Overview
            </h1>
            <p className="text-slate-600 font-medium">
              Live case load for each department and minister.
            </p>
          </div>

          {/* Add Department Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl btn-3d whitespace-nowrap flex-shrink-0"
          >
            <AddRegular style={{ fontSize: 20 }} />
            Add Department
          </button>
        </div>

        {/* Modal */}
        <AddDepartmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAddSuccess}
        />

        {/* Table Container */}
        <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-3d">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Loading department overview...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border-l-4 border-red-500">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-slate-600 font-medium">No department data available yet.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all inline-flex items-center gap-2"
              >
                <AddRegular style={{ fontSize: 18 }} />
                Add First Department
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["State", "Department Name", "Minister Name", "Total Cases", "Submitted Cases"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={`${row.state}-${row.name}-${row.ministerName}-${idx}`}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">{row.state}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{row.name}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{row.ministerName}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{row.totalCases}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{row.submitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}