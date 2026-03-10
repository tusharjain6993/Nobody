import { NavLink } from "react-router-dom";

function SidebarItem({ type, to, icon: Icon, label, collapsed, children }) {
  if (type === "NavLink" && to) {
    return (
      <li>
        <NavLink
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all duration-200 ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 shadow-3d-sm font-semibold"
                : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:shadow-3d-sm"
            } ${collapsed ? "justify-center px-2" : ""}`
          }
          title={collapsed ? label : undefined}
        >
          {Icon && <Icon className="text-[16px] min-w-4 h-4 shrink-0" />}
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      </li>
    );
  }

  if (children) {
    return (
      <li className={collapsed ? "flex justify-center" : ""}>
        {children}
      </li>
    );
  }

  return null;
}

export default SidebarItem;
