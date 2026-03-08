import { FiLogOut } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    FiBarChart2,
    FiMenu,
} from "react-icons/fi";
import { LuLandmark, LuFilePlus } from "react-icons/lu";
import { FcDepartment } from "react-icons/fc";
import { BsFillGearFill } from "react-icons/bs";
import { LuBox } from "react-icons/lu";
import SidebarItem from "./small/SidebarItem";
import Project from "./modals/Project";
import api from "../utils/api";
import { useHCMAuth } from "../minister/HCMAuthContext";

function Sidebar({ collapsed, onToggle }) {
    const [openProject, setOpenProject] = useState(false);
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();
    const { user, logout } = useHCMAuth();

    const userRole = user?.role || "citizen";

    const loadProjects = useCallback(async () => {
        try {
            const res = await api.get("/projects/allprojects");
            const fetchedProjects = res.data?.data || [];
            const initialized = fetchedProjects.map((p) => ({
                id: p.id,
                name: p.name,
            }));
            setProjects(initialized);
        } catch (error) {
            console.error("Failed to load projects:", error);
        }
    }, []);

    useEffect(() => {
        loadProjects();
        const handleProjectsUpdate = () => {
            loadProjects();
        };
        window.addEventListener("projectsUpdated", handleProjectsUpdate);
        return () => {
            window.removeEventListener("projectsUpdated", handleProjectsUpdate);
        };
    }, [loadProjects]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <>
            <div className="h-full flex flex-col bg-white border-r border-gray-200">
                <div className="flex items-center justify-between px-3 py-2 shadow">
                    {!collapsed && (
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                            <Link to="/">HCM Portal</Link>
                        </span>
                    )}
                    <SidebarItem type="" collapsed={collapsed} label="Expand Navigation Menu">
                        <button onClick={onToggle} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 cursor-pointer">
                            <FiMenu className="text-[16px] min-w-4 h-4" />
                        </button>
                    </SidebarItem>
                </div>
                <div className="h-full px-3 py-2 overflow-y-auto hide-scroll">
                    <ul className="w-full space-y-1">
                        {/* Admin-only items: Dashboard, Employees, Department, Cases */}
                        {userRole === "admin" && (
                            <>
                                <SidebarItem
                                    type="NavLink"
                                    to="/dashboard"
                                    icon={FiBarChart2}
                                    label="Dashboard"
                                    collapsed={collapsed}
                                />
                                <SidebarItem
                                    type="NavLink"
                                    to="/employees"
                                    icon={LuBox}
                                    label="Employees"
                                    collapsed={collapsed}
                                />
                                <SidebarItem
                                    type="NavLink"
                                    to="/department"
                                    icon={FcDepartment}
                                    label="Department"
                                    collapsed={collapsed}
                                />
                                <SidebarItem
                                    type="NavLink"
                                    to="/cases"
                                    icon={LuLandmark}
                                    label="Cases"
                                    collapsed={collapsed}
                                />
                            </>
                        )}

                        {/* Citizen-only: Add Case */}
                        {userRole === "citizen" && (
                            <SidebarItem
                                type="NavLink"
                                to="/new-case"
                                icon={LuFilePlus}
                                label="Add Case"
                                collapsed={collapsed}
                            />
                        )}

                        {/* Settings — visible to everyone */}
                        <SidebarItem
                            type="NavLink"
                            to="/settings"
                            icon={BsFillGearFill}
                            label="Settings"
                            collapsed={collapsed}
                        />
                    </ul>
                </div>

                {/* User info + Logout */}
                <div className="border-t border-gray-300 px-3 py-2">
                    {!collapsed && user && (
                        <div className="mb-2 px-2 py-1.5">
                            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                        </div>
                    )}
                    <SidebarItem type="" collapsed={collapsed} label="Logout">
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full p-2 text-red-600 hover:bg-red-100 rounded cursor-pointer">
                            <FiLogOut className="text-[16px] min-w-4 h-4" />
                            <div className={`whitespace-nowrap transition-all duration-300 text-sm leading-4 h-4 ${collapsed ? "w-0 opacity-0 hidden" : "max-w-fit opacity-100"} `}>
                                Logout
                            </div>
                        </button>
                    </SidebarItem>
                </div>
            </div>

            <Project
                open={openProject}
                teams={[]}
                onClose={() => {
                    setOpenProject(false);
                    loadProjects();
                    window.dispatchEvent(new Event("projectsUpdated"));
                }}
            />
        </>
    );
}

export default Sidebar;
