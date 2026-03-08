import React, { useState, useMemo } from 'react';
import { staticEmployees, staticTasks } from '../staticData';

const EmployeeList = () => {
  const [filter, setFilter] = useState("all");

  // Date Filter Logic
  const isWithinFilter = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) return false;
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    if (filter === "all") return true;
    if (filter === "today") return date.getTime() === now.getTime();
    if (filter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return date >= startOfWeek;
    }
    if (filter === "month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Calculation Logic
  const topPerformers = useMemo(() => {
    const processed = staticEmployees.map(emp => {
      const empId = emp._id;

      const taskCount = staticTasks.filter(t => {
        const isAssigned = Array.isArray(t.assignees)
          ? t.assignees.some(a => {
              const aId = typeof a === 'object' ? a._id : a;
              return String(aId) === String(empId);
            })
          : false;
        if (!isAssigned) return false;
        const taskDate = t.updatedAt || t.end || t.createdAt;
        return isWithinFilter(taskDate);
      }).length;

      return {
        id: empId,
        name: emp.name,
        role: emp.role,
        count: taskCount,
        avatar: emp.profile_img || `https://ui-avatars.com/api/?name=${emp.name}&background=random`,
      };
    });

    return processed.sort((a, b) => b.count - a.count);
  }, [filter]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">Top Performers</h3>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-500 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar pt-2">
        {topPerformers.length > 0 ? (
          topPerformers.map((emp, index) => (
            <div key={emp.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                  />
                  {index < 3 && emp.count > 0 && (
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white
                      ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}
                    `}>
                      {index + 1}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {emp.name}
                  </p>
                  <p className="text-xs text-gray-400 font-medium capitalize">
                    {emp.role || 'Member'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-700">
                  {emp.count}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  Tasks
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-sm">No employee data found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
