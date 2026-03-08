import { NavLink } from "react-router-dom";

function SidebarItem({ type, to, icon: Icon, label, collapsed, children }) {
  if (type === "NavLink" && to) {
    return (
      <li>
        <NavLink
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-800"
                : "text-gray-700 hover:bg-gray-100"
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
