import { useEffect, useState } from "react";
import PieCharts from "./Charts/PieChart";
import EmployeeList from "./EmployeeList/EmployeeList";
import ProjectTaskCards from "./ProjectTaskCards/ProjectTaskCards";
import MainTask from "./TaskShow/MainTask";
import TimelineView from "./TimelineView/TimelineView";
import { dashboardApi, departmentApi } from "../../../minister/ministerApi";

function MinisterDashboard() {
    const [stats, setStats] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        async function loadDashboard() {
            try {
                const [statsRes, departmentRes] = await Promise.all([
                    dashboardApi.stats(),
                    departmentApi.overview(),
                ]);

                if (!mounted) return;
                const departmentRows = departmentRes?.departments || [];
                setDepartments(departmentRows);
                setStats({
                    ...statsRes,
                    departments: departmentRows.length,
                });
            } catch (err) {
                if (mounted) setError(err.message || "Failed to load admin case stats");
            }
        }
        loadDashboard();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="p-6 h-full space-y-6 bg-white">
            {error ? (
                <div className="text-sm text-red-600 font-medium">{error}</div>
            ) : null}
           <ProjectTaskCards stats={stats} />
            <PieCharts departments={departments} />
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