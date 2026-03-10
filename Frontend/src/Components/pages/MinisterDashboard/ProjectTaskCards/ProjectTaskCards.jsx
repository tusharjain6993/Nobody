import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  BriefcaseRegular,
  CheckmarkCircleRegular,
  BuildingRegular,
} from "@fluentui/react-icons";

function ProjectTaskCards({stats}) {
 const cards = [
  {
    label: "Total Cases",
    val: stats?.totalCases || 0,
    color: "#3b82f6",
    icon: BriefcaseRegular,
    total: stats?.totalCases || 0
  },
  {
    label: "Resolved",
    val: stats?.resolved || 0,
    color: "#10b981",
    icon: CheckmarkCircleRegular,
    total: stats?.totalCases || 0
  },
  {
    label: "Scheduled",
    val: stats?.scheduled || 0,
    color: "#8b5cf6",
    icon: BuildingRegular,
    total: stats?.totalCases || 0
  },
];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}

const StatCard = ({ label, val, color, icon: Icon, total }) => {
  const percentage = total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100/60 dark:border-slate-700/60 rounded-3xl p-4 shadow-3d hover:shadow-3d-hover transition-all duration-300 group min-h-36 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 shadow-3d-sm transition-colors" style={{ color: color }}>
              <Icon style={{ fontSize: 18 }} />
            </div>
            <h4 className="text-[13px] font-black text-slate-800 dark:text-slate-100 leading-none">{label}</h4>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{val}</span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</span>
        </div>
      </div>

      <div className="relative w-12 h-12 ml-auto -mt-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={[{v: val}, {v: Math.max(0, total - val)}]} innerRadius={14} outerRadius={20} startAngle={90} endAngle={-270} dataKey="v" stroke="none">
              <Cell fill={color} /><Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-slate-600 dark:text-slate-400">{percentage}%</div>
      </div>
    </div>
  );
};

export default ProjectTaskCards;
