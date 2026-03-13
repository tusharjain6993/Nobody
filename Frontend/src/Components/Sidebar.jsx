import {
  SignOutRegular,
  NavigationRegular,
  DataBarVerticalRegular,
  GavelRegular,
  DocumentAddRegular,
  SettingsRegular,
  CalendarLtrRegular,
} from "@fluentui/react-icons";
import { useNavigate, Link } from "react-router-dom";
import SidebarItem from "./small/SidebarItem";
import { useHCMAuth } from "../minister/HCMAuthContext";
import { getRoleLabel } from "../constants/adminWorkflow";

function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useHCMAuth();
  const userRole = user?.role || "citizen";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-3 py-2 shadow dark:shadow-none dark:border-b dark:border-slate-700">
        {!collapsed && (
          <span className="font-semibold text-gray-800 dark:text-slate-100">
            <Link to="/" className="text-inherit hover:opacity-90">HCM Portal</Link>
          </span>
        )}
        <SidebarItem type="" collapsed={collapsed} label="Expand Navigation Menu">
          <button onClick={onToggle} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-pointer">
            <NavigationRegular className="text-[16px] min-w-4 h-4" />
          </button>
        </SidebarItem>
      </div>

      <div className="h-full px-3 py-2 overflow-y-auto hide-scroll">
        <ul className="w-full space-y-1">
          {userRole === "admin" && (
            <>
              <SidebarItem type="NavLink" to="/dashboard" icon={DataBarVerticalRegular} label="Dashboard" collapsed={collapsed} />
              <SidebarItem type="NavLink" to="/cases" icon={GavelRegular} label="Work Queue" collapsed={collapsed} />
              <SidebarItem type="NavLink" to="/meetings" icon={CalendarLtrRegular} label="Meetings" collapsed={collapsed} />
            </>
          )}

          {userRole === "minister" && (
            <>
              <SidebarItem type="NavLink" to="/minister/dashboard" icon={DataBarVerticalRegular} label="Dashboard" collapsed={collapsed} />
              <SidebarItem type="NavLink" to="/minister/calendar" icon={CalendarLtrRegular} label="Calendar" collapsed={collapsed} />
            </>
          )}

          {userRole === "deo" && (
            <SidebarItem type="NavLink" to="/meetings" icon={CalendarLtrRegular} label="Calendar" collapsed={collapsed} />
          )}

          {userRole === "citizen" && (
            <>
              <SidebarItem type="NavLink" to="/new-case" icon={DocumentAddRegular} label="Services" collapsed={collapsed} />
              <SidebarItem type="NavLink" to="/my-cases" icon={GavelRegular} label="My Requests" collapsed={collapsed} />
              <SidebarItem type="NavLink" to="/meetings" icon={CalendarLtrRegular} label="Meetings" collapsed={collapsed} />
            </>
          )}

          <SidebarItem type="NavLink" to="/settings" icon={SettingsRegular} label="Settings" collapsed={collapsed} />
        </ul>
      </div>

      <div className="border-t border-gray-300 dark:border-slate-700 px-3 py-2">
        {!collapsed && user && (
          <div className="mb-2 px-2 py-1.5">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{getRoleLabel(user.role)}</p>
          </div>
        )}
        <SidebarItem type="" collapsed={collapsed} label="Logout">
          <button onClick={handleLogout} className="flex items-center gap-2 w-full p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer">
            <SignOutRegular className="text-[16px] min-w-4 h-4" />
            <div className={`whitespace-nowrap transition-all duration-300 text-sm leading-4 h-4 ${collapsed ? "w-0 opacity-0 hidden" : "max-w-fit opacity-100"}`}>
              Logout
            </div>
          </button>
        </SidebarItem>
      </div>
    </div>
  );
}

export default Sidebar;
