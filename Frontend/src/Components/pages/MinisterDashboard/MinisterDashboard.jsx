import { useEffect, useState } from "react";
import PieCharts from "./Charts/PieChart";
import EmployeeList from "./EmployeeList/EmployeeList";
import ProjectTaskCards from "./ProjectTaskCards/ProjectTaskCards";
import MainTask from "./TaskShow/MainTask";
import TimelineView from "./TimelineView/TimelineView";
import { dashboardApi } from "../../../minister/ministerApi";

function MinisterDashboard() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        async function loadStats() {
            try {
                const res = await dashboardApi.stats();
                if (mounted) setStats(res);
            } catch (err) {
                if (mounted) setError(err.message || "Failed to load admin case stats");
            }
        }
        loadStats();
        return () => {
            mounted = false;
        };
    }, []);

    const statCards = [
        { label: "Total Cases", value: stats?.totalCases ?? "-" },
        { label: "Submitted", value: stats?.submitted ?? "-" },
        { label: "In Review", value: stats?.inReview ?? "-" },
        { label: "Resolved", value: stats?.resolved ?? "-" },
        { label: "Rejected", value: stats?.rejected ?? "-" },
    ];

    return (
        <div className="p-6 h-full space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {statCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs uppercase text-gray-500 font-semibold">{card.label}</div>
                        <div className="text-2xl font-extrabold text-slate-800 mt-1">{card.value}</div>
                    </div>
                ))}
            </div>
            {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
            {stats?.recentCases?.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                    <div className="text-base font-bold text-slate-800 mb-3">Recent Registered Cases</div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-200">
                                    <th className="py-2 pr-3">Case ID</th>
                                    <th className="py-2 pr-3">Citizen</th>
                                    <th className="py-2 pr-3">Category</th>
                                    <th className="py-2 pr-3">Location</th>
                                    <th className="py-2 pr-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentCases.map((item) => (
                                    <tr key={item._id} className="border-b border-gray-100">
                                        <td className="py-2 pr-3 font-semibold text-indigo-600">{item.caseId}</td>
                                        <td className="py-2 pr-3">{item.citizenSnapshot?.name}</td>
                                        <td className="py-2 pr-3">{item.category}</td>
                                        <td className="py-2 pr-3">{item.state}, {item.districtCity}</td>
                                        <td className="py-2 pr-3">{item.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <ProjectTaskCards />
            <PieCharts />
            <div className="flex flex-col lg:flex-row gap-6 h-[450px]">
                <div className="w-full lg:w-[60%]">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
                        <TimelineView />
                    </div>
                </div>
                <div className="w-full lg:flex-1">
                    <EmployeeList />
                </div>
            </div>
            <div className="pb-4">
                <MainTask />
            </div>
        </div>
    );
}

export default MinisterDashboard;