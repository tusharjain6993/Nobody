import React, { useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2, Clock, AlertCircle,
  Search, ChevronLeft, ChevronRight, Edit2
} from 'lucide-react';
import { staticTasks, staticProjects } from '../staticData';

const ITEMS_PER_PAGE = 5;

function MainTask() {
  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};

  // --- STATE ---
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);

  // --- FILTER & SEARCH ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staticTasks;
    return staticTasks.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      (t.projectId?.name || "").toLowerCase().includes(q)
    );
  }, [search]);

  const totalTasks = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / ITEMS_PER_PAGE));

  // Clamp page when filter changes
  const clampedPage = Math.min(page, totalPages);

  const pagedTasks = useMemo(() => {
    const start = (clampedPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, clampedPage]);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  // --- HELPER FUNCTIONS ---
  const getStatusDetails = (status) => {
    const s = (typeof status === 'object' ? status.text : status)?.toLowerCase() || 'pending';
    if (s.includes('completed'))                          return { label: 'Completed', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={14} /> };
    if (s.includes('progress') || s.includes('active'))  return { label: 'In Progress', bg: 'bg-blue-50 text-blue-600 border-blue-100',         icon: <Clock size={14} /> };
    if (s.includes('postpone'))                           return { label: 'Postponed',  bg: 'bg-rose-50 text-rose-600 border-rose-100',           icon: <AlertCircle size={14} /> };
    return { label: 'Pending', bg: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock size={14} /> };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not Set";
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="w-full p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-6 h-[550px] flex flex-col relative">

      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 mb-4 shrink-0">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Task Management</h2>
          <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {totalTasks} Total Tasks
          </div>
        </div>

        <div className="flex gap-2 px-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by title, project..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 overflow-auto scrollbar-hide relative">
        <table className="w-full text-left border-separate border-spacing-y-3 min-w-190 px-1">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
              <th className="pb-2 pl-4 min-w-40">Project Name</th>
              <th className="pb-2 min-w-40">Task Title</th>
              <th className="pb-2">Assignees</th>
              <th className="pb-2 min-w-30 text-center">Start Date</th>
              <th className="pb-2 min-w-30 text-center">End Date</th>
              <th className="pb-2 min-w-30 text-center">Status</th>
              {(user.role === "admin" || user.role === "manager" || user.role === "team leader") && (
                <th className="pb-2 w-28 min-w-24 text-center">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pagedTasks.length > 0 ? pagedTasks.map((task, index) => {
              const status = getStatusDetails(task.status);
              const assignees = Array.isArray(task.assignees) ? task.assignees : (task.assignee ? [task.assignee] : []);
              const visibleAssignees = assignees.slice(0, 4);
              const remainingCount   = assignees.length - 4;
              const projectName      = task.projectId?.name || task.projectName || "N/A";

              return (
                <tr key={task._id || task.id || index} className="group bg-white hover:bg-slate-50 transition-all border border-slate-200 shadow rounded-md">

                  {/* PROJECT NAME */}
                  <td className="py-3 pl-4 rounded-l-2xl border-y border-l border-slate-100">
                    <span className="text-sm font-bold text-slate-600">{projectName}</span>
                  </td>

                  {/* TITLE */}
                  <td className="py-3 border-y border-slate-100">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 truncate max-w-[200px]" title={task.title}>
                          {task.title}
                        </span>
                        {task.priority && (
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'low' ? 'bg-blue-500' : 'bg-yellow-500'}`} title={task.priority} />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">ID: #{String(task._id || task.id).slice(-6)}</span>
                    </div>
                  </td>

                  {/* ASSIGNEES */}
                  <td className="py-3 border-y border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {visibleAssignees.map((u, i) => (
                          <div key={u._id || u.id || i} className="h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-100">
                            <img className="h-full w-full object-cover" src={u.avatar || u.profileImg || `https://ui-avatars.com/api/?name=${u.name || 'U'}`} alt={u.name} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${u.name || 'U'}`; }} />
                          </div>
                        ))}
                      </div>
                      {remainingCount > 0 && <span className="text-[11px] font-bold text-slate-500">+{remainingCount}</span>}
                      {assignees.length === 0 && <span className="text-[11px] font-medium text-slate-400 italic">None</span>}
                    </div>
                  </td>

                  {/* DATES */}
                  <td className="py-3 border-y border-slate-100 text-center">
                    <div className="px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-lg inline-block">
                      <span className="text-[11px] font-bold text-blue-700">{formatDate(task.start)}</span>
                    </div>
                  </td>
                  <td className="py-3 border-y border-slate-100 text-center">
                    <div className="px-3 py-1 bg-amber-50/50 border border-amber-100 rounded-lg inline-block">
                      <span className="text-[11px] font-bold text-amber-700">{formatDate(task.end)}</span>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="py-3 border-y border-slate-100 text-center">
                    <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase ${status.bg}`}>
                      {status.icon} {status.label}
                    </div>
                  </td>

                  {/* ACTION (view-only in static mode) */}
                  {(user.role === "admin" || user.role === "manager" || user.role === "team leader") && (
                    <td className="py-3 text-right rounded-r-2xl border-y border-r border-slate-100">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr><td colSpan="7" className="py-20 text-center text-slate-400 font-bold uppercase text-xs">No tasks found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 shrink-0 px-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Page {clampedPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={clampedPage === 1}
            className="p-2 rounded-xl bg-slate-100 border border-slate-100 disabled:opacity-30 transition-opacity cursor-pointer hover:bg-slate-200"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={clampedPage === totalPages}
            className="p-2 rounded-xl bg-slate-100 border border-slate-100 disabled:opacity-30 transition-opacity cursor-pointer hover:bg-slate-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainTask;
