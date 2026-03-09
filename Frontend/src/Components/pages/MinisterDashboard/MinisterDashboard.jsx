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
   
           <ProjectTaskCards stats={stats} />
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