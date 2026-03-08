import { useEffect, useRef, useState } from "react";
import {
    FiMaximize,
    FiUser,
    FiSettings,
    FiLogOut,
    FiMinimize,
} from "react-icons/fi";
import Notification from "./Notification";
import { useNotifications } from "../context/NotificationContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useHCMAuth } from "../minister/HCMAuthContext";

const Header = () => {
    const { user, logout } = useHCMAuth();
    const ref = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId } = useParams();
    const { hasUnread } = useNotifications();
    const [open, setOpen] = useState(false);
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        if (!location.pathname.startsWith("/project/") || !projectId) {
            setCurrentProject(null);
            return;
        }
        const projects = JSON.parse(localStorage.getItem("projects")) || [];
        const foundProject = projects.find(
            (p) => String(p.id) === String(projectId)
        );
        setCurrentProject(foundProject || null);
    }, [location.pathname, projectId]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () =>
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setNotifyOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="h-12 bg-white shadow flex items-center justify-between px-6">
            <div>
                {currentProject && (
                    <div className="text-gray-900 text-lg font-medium capitalize">{currentProject?.name}</div>
                )}
            </div>
            <div className="flex items-center gap-4 relative" ref={ref}>
                <HeaderIcon icon={isFullscreen ? FiMinimize : FiMaximize} onClick={toggleFullscreen} />

                <button onClick={() => { setOpen((v) => !v); setNotifyOpen(false); }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                </button>

                {open && (
                    <div className="absolute right-0 top-11 w-60 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-300">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {user?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm break-all line-clamp-1">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-gray-500 text-xs break-all line-clamp-1 capitalize">
                                    {user?.role || "citizen"} · {user?.email}
                                </p>
                            </div>
                        </div>
                        <ul className="py-2 text-sm">
                            <MenuItem icon={FiSettings} label="Settings" onClick={() => {
                                navigate("/settings");
                                setOpen(false);
                            }} />
                            <MenuItem icon={FiLogOut} label="Logout" danger onClick={handleLogout} />
                        </ul>
                    </div>
                )}
                {notifyOpen && (
                    <div className="absolute right-0 top-11 w-90 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                        <Notification setOpen={setNotifyOpen} />
                    </div>
                )}
            </div>
        </header>
    );
};

const HeaderIcon = ({ icon: Icon, badge, dot, onClick }) => (
    <button className="relative text-gray-500 hover:text-gray-700 cursor-pointer" onClick={onClick}>
        <Icon size={16} />
        {badge && badge > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-1.5 rounded-full">
                {badge}
            </span>
        )}
        {dot && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
    </button>
);

const MenuItem = ({ icon: Icon, label, danger, onClick }) => (
    <li className={`flex items-center gap-3 px-4 py-2 cursor-pointer
        ${danger ? "text-red-600 hover:bg-red-100" : "text-gray-700 hover:bg-gray-200"}
        `}
        onClick={onClick} >
        <Icon size={16} />
        {label}
    </li>
);

export default Header;
