import PieCharts from "./Charts/PieChart";
import EmployeeList from "./EmployeeList/EmployeeList";
import ProjectTaskCards from "./ProjectTaskCards/ProjectTaskCards";
import MainTask from "./TaskShow/MainTask";
import TimelineView from "./TimelineView/TimelineView";

function MinisterDashboard() {
    return (
        <div className="p-6 h-full space-y-6 bg-white">
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