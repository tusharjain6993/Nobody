import React from 'react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, CheckCircle2, Clock, Users, UserCheck, UserX, Layers } from 'lucide-react';
import { GrCurrency } from "react-icons/gr";
import { staticProjects, staticTasks, staticEmployees } from '../staticData';

// ---- Static Computed Stats ----
const getCount = (arr, statusKeywords) =>
    arr.filter(i => {
        const s = (typeof i.status === 'object' ? i.status.text : i.status)?.toLowerCase() || '';
        return statusKeywords.some(kw => s.includes(kw));
    }).length;

const projectCompleted = getCount(staticProjects, ['complete']);
const projectPending   = staticProjects.length - projectCompleted;

const taskCompleted = getCount(staticTasks, ['complete']);
const taskPending   = staticTasks.length - taskCompleted;

const activeEmp   = staticEmployees.filter(e => e.isActive === true).length;
const inactiveEmp = staticEmployees.length - activeEmp;

const staticData = {
    projects:  { total: staticProjects.length,  completed: projectCompleted,  pending: projectPending  },
    tasks:     { total: staticTasks.length,      completed: taskCompleted,     pending: taskPending     },
    employees: { total: staticEmployees.length,  active: activeEmp,            inactive: inactiveEmp   },
};

function ProjectTaskCards({stats}) {
 const cards = [
  {
    label: "Total Cases",
    val: stats?.totalCases || 0,
    color: "#3b82f6",
    icon: <Briefcase />,
    type: "radial",
    total: stats?.totalCases || 0
  },
  {
    label: "Submitted",
    val: stats?.submitted || 0,
    color: "#f59e0b",
    icon: <Clock />,
    type: "radial",
    total: stats?.totalCases || 0
  },
  {
    label: "In Review",
    val: stats?.inReview || 0,
    color: "#6366f1",
    icon: <Layers />,
    type: "radial",
    total: stats?.totalCases || 0
  },
  {
    label: "Resolved",
    val: stats?.resolved || 0,
    color: "#10b981",
    icon: <CheckCircle2 />,
    type: "radial",
    total: stats?.totalCases || 0
  },
  {
    label: "Rejected",
    val: stats?.rejected || 0,
    color: "#ef4444",
    icon: <UserX />,
    type: "radial",
    total: stats?.totalCases || 0
  },
  {
    label: "Departments",
    val: stats?.departments || 0,
    color: "#8b5cf6",
    icon: <Layers />,
    type: "sparkline"
  },
  {
    label: "Meet With Minister / PS Solution",
    val: (stats?.directMeet || 0) + (stats?.psSolution || 0),
    color: "#f97316",
    icon: <UserCheck />,
    type: "sparkline"
  },
  {
    label: "Total Employees",
    val: stats?.totalEmployees || 0,
    color: "#14b8a6",
    icon: <Users />,
    type: "sparkline"
  }
];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}

const StatCard = ({ label, sub, val, color, icon, type, total, details }) => {
  const sparkData = [{v: 40}, {v: 35}, {v: 55}, {v: 45}, {v: 70}, {v: 60}, {v: 80}];
  const percentage    = total > 0 ? Math.round((val / total) * 100) : 0;
  const activePercent = val > 0 && details ? (details.active / val) * 100 : 0;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 group min-h-36 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gray-100 transition-colors" style={{ color: color }}>
              {React.cloneElement(icon, { size: 18 })}
            </div>
            <div>
              <h4 className="text-[13px] font-black text-slate-800 leading-none">{label}</h4>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{sub}</span>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tracking-tight">{val}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
        </div>
      </div>

      <div className="mt-auto">
        {type === 'sparkline' && (
          <div className="w-full h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={color} fillOpacity={1} fill={`url(#grad-${color})`} strokeWidth={2} isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {type === 'radial' && (
          <div className="relative w-12 h-12 ml-auto -mt-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{v: val}, {v: Math.max(0, total - val)}]} innerRadius={14} outerRadius={20} startAngle={90} endAngle={-270} dataKey="v" stroke="none">
                  <Cell fill={color} /><Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-slate-600">{percentage}%</div>
          </div>
        )}

        {type === 'multi-employee' && (
          <div className="mt-2 pt-2 border-t border-slate-50">
            <div className="flex w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3 mt-1">
              <div style={{ width: `${activePercent}%` }} className="h-full bg-emerald-500 rounded-full" />
              <div style={{ width: `${100 - activePercent}%` }} className="h-full bg-rose-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <UserCheck size={11} className="text-emerald-500" />
                <span className="text-[10px] font-black text-slate-700">{details.active}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Act.</span>
              </div>
              <div className="flex items-center gap-1">
                <UserX size={11} className="text-rose-500" />
                <span className="text-[10px] font-black text-slate-700">{details.inactive}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Inact.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTaskCards;