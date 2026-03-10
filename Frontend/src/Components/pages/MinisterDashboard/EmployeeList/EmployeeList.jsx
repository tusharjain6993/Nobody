import { useEffect, useState } from "react";
import { employeesApi } from "../../../../minister/ministerApi";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setError("");
        const res = await employeesApi.list({ status: "active" });
        if (mounted) setEmployees(res.employees || []);
      } catch (err) {
        if (mounted) {
          setEmployees([]);
          setError(err.message || "Failed to load employees");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">Employees</h3>
        <span className="text-xs text-slate-500">Live DB Data</span>
      </div>

      {error && (
        <div className="text-sm text-red-600 font-medium mb-2">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar pt-2">
        {loading ? (
          <div className="text-sm text-gray-400">Loading employees...</div>
        ) : employees.length > 0 ? (
          employees.slice(0, 10).map((emp) => (
            <div key={emp._id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <img
                  src={emp.profileImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=6366f1&color=fff`}
                  alt={emp.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {emp.name}
                  </p>
                  <p className="text-xs text-gray-400 font-medium capitalize">
                    {emp.role || "Member"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">{emp.department}</span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-sm">No employees added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
