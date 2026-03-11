import { useEffect, useRef, useState } from "react";
import {
    ArrowMaximizeRegular,
    ArrowMinimizeRegular,
    AlertRegular,
    SettingsRegular,
    SignOutRegular,
} from "@fluentui/react-icons";
import Notification from "./Notification";
import { useNotifications } from "../context/NotificationContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useHCMAuth } from "../minister/HCMAuthContext";
import { notificationsApi } from "../minister/ministerApi";
import { getRoleLabel } from "../constants/adminWorkflow";

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
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

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

    const loadNotifications = async () => {
        try {
            const res = await notificationsApi.list();
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount || 0);
        } catch {}
    };

    useEffect(() => {
        if (user) {
            loadNotifications();
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleMarkRead = async (id) => {
        try {
            await notificationsApi.markRead(id);
            loadNotifications();
        } catch {}
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
            loadNotifications();
        } catch {}
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="h-12 bg-white dark:bg-slate-800 shadow-3d-sm dark:shadow-3d-sm flex items-center justify-between px-6 relative z-10">
            <div>
                {currentProject && (
                    <div className="text-gray-900 dark:text-slate-100 text-lg font-medium capitalize">{currentProject?.name}</div>
                )}
            </div>
            <div className="flex items-center gap-4 relative" ref={ref}>
                <HeaderIcon
                    icon={isFullscreen ? ArrowMinimizeRegular : ArrowMaximizeRegular}
                    onClick={toggleFullscreen}
                />

                <button className="relative cursor-pointer" onClick={() => { setNotifyOpen((v) => !v); setOpen(false); }}>
                    <AlertRegular style={{ fontSize: 16 }} className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full min-w-[16px] text-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </button>

                <button onClick={() => { setOpen((v) => !v); setNotifyOpen(false); }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer shadow-3d ring-2 ring-white/30 dark:ring-slate-600/50">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                </button>

                {open && (
                    <div className="absolute right-0 top-11 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-3d-lg border border-gray-200/60 dark:border-slate-600/60 z-50 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-300 dark:border-slate-600">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {user?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-slate-200 text-sm break-all line-clamp-1">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-gray-500 dark:text-slate-400 text-xs break-all line-clamp-1 capitalize">
                                    {getRoleLabel(user?.role) || "Citizen"} · {user?.email}
                                </p>
                            </div>
                        </div>
                        <ul className="py-2 text-sm">
                            <MenuItem icon={SettingsRegular} label="Settings" onClick={() => {
                                navigate("/settings");
                                setOpen(false);
                            }} />
                            <MenuItem icon={SignOutRegular} label="Logout" danger onClick={handleLogout} />
                        </ul>
                    </div>
                )}
                {notifyOpen && (
                    <div className="absolute right-0 top-11 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-3d-lg border border-gray-200/60 dark:border-slate-600/60 z-50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-slate-600">
                            <span className="font-bold text-sm text-gray-800 dark:text-slate-200">Notifications</span>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold cursor-pointer bg-transparent border-none">
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">No notifications</p>
                            ) : (
                                notifications.slice(0, 20).map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={() => {
                                            if (!n.isRead) handleMarkRead(n._id);
                                            if (n.caseId) navigate(`/cases/${n.caseId}`);
                                            setNotifyOpen(false);
                                        }}
                                        className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                                            !n.isRead ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                                        }`}
                                    >
                                        <p className={`text-xs ${!n.isRead ? "font-bold text-gray-800 dark:text-slate-200" : "text-gray-600 dark:text-slate-400"}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

const HeaderIcon = ({ icon: Icon, badge, dot, onClick }) => (
    <button className="relative text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer" onClick={onClick}>
        <Icon style={{ fontSize: 16 }} />
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
        ${danger ? "text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30" : "text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"}
        `}
        onClick={onClick} >
        <Icon style={{ fontSize: 16 }} />
        {label}
    </li>
);

export default Header;
