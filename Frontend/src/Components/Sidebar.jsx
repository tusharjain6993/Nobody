import {
  SignOutRegular,
  NavigationRegular,
  DataBarVerticalRegular,
  GavelRegular,
  DocumentAddRegular,
  SettingsRegular,
  CalendarLtrRegular,
} from "@fluentui/react-icons";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { useHCMAuth } from "../minister/HCMAuthContext";
import { getRoleLabel } from "../constants/adminWorkflow";

function Sidebar({ collapsed, onToggle, onNavigate }) {
  const navigate = useNavigate();
  const { user, logout } = useHCMAuth();
  const userRole = user?.role || "citizen";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    ...(userRole === "admin" ? [
      { to: "/dashboard", icon: DataBarVerticalRegular, label: "Dashboard" },
      { to: "/cases", icon: GavelRegular, label: "Work Queue" },
      { to: "/calendar", icon: CalendarLtrRegular, label: "Calendar" },
      { to: "/meetings", icon: CalendarLtrRegular, label: "Meetings" },
    ] : []),
    ...(userRole === "minister" ? [
      { to: "/minister/dashboard", icon: DataBarVerticalRegular, label: "Dashboard" },
      { to: "/minister/calendar", icon: CalendarLtrRegular, label: "Calendar" },
    ] : []),
    ...(userRole === "deo" ? [
      { to: "/verification-requests", icon: GavelRegular, label: "Verification Requests" },
      { to: "/meetings", icon: CalendarLtrRegular, label: "Calendar" },
    ] : []),
    ...(userRole === "citizen" ? [
      { to: "/new-case", icon: DocumentAddRegular, label: "Services" },
      { to: "/my-cases", icon: GavelRegular, label: "Complaints" },
      { to: "/meetings", icon: CalendarLtrRegular, label: "Meetings" },
    ] : []),
    { to: "/settings", icon: SettingsRegular, label: "Settings" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="portal-sidebar__header">
        <div className="portal-sidebar__logo">
          <Link to="/" className="portal-sidebar__logo-mark" onClick={onNavigate} aria-label="HCM Portal home">
            <span aria-hidden="true">🏛️</span>
          </Link>
          {!collapsed && (
            <div className="portal-sidebar__brand">
              <span className="portal-sidebar__brand-title">Ghar Ghar</span>
              <span className="portal-sidebar__brand-subtitle">HCM Minister Office Portal</span>
            </div>
          )}
        </div>
        <button type="button" onClick={onToggle} className="portal-sidebar__toggle" title={collapsed ? "Expand" : "Collapse"}>
          <NavigationRegular />
        </button>
      </div>

      <div className="portal-sidebar__user">
        <div className="portal-sidebar__avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
        {!collapsed && user && (
          <div className="portal-sidebar__user-text">
            <div className="portal-sidebar__user-name">{user.name}</div>
            <div className="portal-sidebar__user-role">{getRoleLabel(user.role)}</div>
          </div>
        )}
      </div>

      <nav className="portal-sidebar__nav hide-scroll">
        <div className="portal-sidebar__section-label">{!collapsed ? "Navigation" : ""}</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <LinkWrapper
            key={to}
            to={to}
            icon={Icon}
            label={label}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="portal-sidebar__footer">
        <button type="button" onClick={handleLogout} className="portal-sidebar__link portal-sidebar__logout" title={collapsed ? "Logout" : undefined}>
          <span className="portal-sidebar__link-icon"><SignOutRegular /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function LinkWrapper({ to, icon: Icon, label, collapsed, onNavigate }) {
  return (
    <LinkItem to={to} collapsed={collapsed} label={label} onNavigate={onNavigate}>
      {({ isActive }) => (
        <>
          <span className="portal-sidebar__link-icon"><Icon /></span>
          {!collapsed && <span>{label}</span>}
          {isActive && <span className="portal-sidebar__link-indicator" />}
        </>
      )}
    </LinkItem>
  );
}

function LinkItem({ to, collapsed, label, children, onNavigate }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) => `portal-sidebar__link ${isActive ? "portal-sidebar__link--active" : ""}`}
    >
      {({ isActive }) => children({ isActive })}
    </NavLink>
  );
}

export default Sidebar;
