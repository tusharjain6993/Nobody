import React, { useState } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import {
    BriefcaseRegular,
    CheckmarkCircleRegular,
    DismissCircleRegular,
    BuildingRegular,
} from "@fluentui/react-icons";

const COLORS = {
    'Completed':   '#10b981',
    'In Progress': '#6366f1',
    'Pending':     '#818cf8',
    'Postpone':    '#f43f5e',
    'Not Started': '#f59e0b',
    'Backlog':     '#94a3b8',
    'To Do':       '#cbd5e1',
    'High':        '#ef4444',
    'Medium':      '#f59e0b',
    'Low':         '#3b82f6',
    'Urgent':      '#b91c1c',
    'Default':     '#e2e8f0',
};

function PieCharts({ departments = [] }) {
    const [projectFilter,  setProjectFilter]  = useState(null);
    const [taskFilter,     setTaskFilter]     = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState(null);

    const departmentData = departments.map((d) => ({
        name: d.name || "Unknown",
        value: d.totalCases || 0,
    }));

    return (
        <div className="w-full bg-white dark:bg-transparent text-slate-900 dark:text-slate-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartCard
                    title="Projects Status"
                    icon={<BriefcaseRegular style={{ fontSize: 18 }} className="text-indigo-500" />}
                    data={[]}
                    colors={COLORS}
                    activeFilter={projectFilter}
                    setFilter={setProjectFilter}
                />
                <ChartCard
                    title="Tasks Status"
                    icon={<CheckmarkCircleRegular style={{ fontSize: 18 }} className="text-emerald-500" />}
                    data={[]}
                    colors={COLORS}
                    activeFilter={taskFilter}
                    setFilter={setTaskFilter}
                />
                <ChartCard
                    title="Department Case Load"
                    icon={<BuildingRegular style={{ fontSize: 18 }} className="text-violet-500" />}
                    data={departmentData}
                    colors={COLORS}
                    activeFilter={departmentFilter}
                    setFilter={setDepartmentFilter}
                />
            </div>
        </div>
    );
}

const ChartCard = ({ title, icon, data, colors, activeFilter, setFilter }) => {
    const onPieClick = (entry) => {
        const clickedStatus = entry.name;
        setFilter(activeFilter === clickedStatus ? null : clickedStatus);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-start mb-1">
                <div className="flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
                    {activeFilter && (
                        <button
                            onClick={() => setFilter(null)}
                            className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 uppercase mt-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full w-fit"
                        >
                            <DismissCircleRegular style={{ fontSize: 10 }} /> {activeFilter}
                        </button>
                    )}
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
                    {icon}
                </div>
            </div>

            <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                            data={data.length ? data : [{ name: 'No Data', value: 1 }]}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            onClick={(d) => onPieClick(d)}
                            className="cursor-pointer outline-none"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[entry.name] || colors.Default}
                                    style={{
                                        filter: activeFilter && activeFilter !== entry.name ? 'grayscale(80%) opacity(25%)' : 'none',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => (
                                <span className={`text-[9px] font-bold uppercase ${activeFilter === value ? 'text-slate-900 dark:text-slate-100 underline' : 'text-slate-400'}`}>
                                    {value}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-50 leading-none">
                        {activeFilter
                            ? (data.find(d => d.name === activeFilter)?.value || 0)
                            : data.reduce((acc, curr) => acc + curr.value, 0)
                        }
                    </span>
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                        {activeFilter ? activeFilter : 'Total'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PieCharts;
