import {
  SignOutRegular,
  NavigationRegular,
  DataBarVerticalRegular,
  GavelRegular,
  DocumentAddRegular,
  SettingsRegular,
  CalendarLtrRegular,
  BuildingBankRegular,
  ChevronDownRegular,
  ChevronRightRegular,
} from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";
import { useHCMAuth } from "../minister/HCMAuthContext";
import { getRoleLabel } from "../constants/adminWorkflow";

function Sidebar({ collapsed, onToggle, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useHCMAuth();
  const userRole = user?.role || "citizen";
  const [verificationMenuOpen, setVerificationMenuOpen] = useState(false);

  useEffect(() => {
    if (userRole === "deo" && location.pathname === "/verification-requests") {
      setVerificationMenuOpen(true);
    }
  }, [location.pathname, userRole]);

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
            <BuildingBankRegular />
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
        {userRole === "deo" && (
          <DeoVerificationMenu
            collapsed={collapsed}
            open={verificationMenuOpen}
            onToggle={() => setVerificationMenuOpen((current) => !current)}
            onNavigate={onNavigate}
          />
        )}
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

function DeoVerificationMenu({ collapsed, open, onToggle, onNavigate }) {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const activePriority = String(query.get("priority") || "").toUpperCase();
  const isVerificationRoute = location.pathname === "/verification-requests";
  const priorityItems = [
    ["LOW", "Low Requests"],
    ["MEDIUM", "Medium Requests"],
    ["HIGH", "High Requests"],
    ["CRITICAL", "Critical Requests"],
  ];

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "Verification Requests" : undefined}
        className={`portal-sidebar__link ${isVerificationRoute ? "portal-sidebar__link--active" : ""}`}
      >
        <span className="portal-sidebar__link-icon"><GavelRegular /></span>
        {!collapsed && (
          <>
            <span>Verification Requests</span>
            <span className="ml-auto">{open ? <ChevronDownRegular /> : <ChevronRightRegular />}</span>
          </>
        )}
        {isVerificationRoute && <span className="portal-sidebar__link-indicator" />}
      </button>
      {!collapsed && open && (
        <div className="mt-1 space-y-1">
          {priorityItems.map(([priority, label]) => (
            <NavLink
              key={priority}
              to={`/verification-requests?priority=${priority}`}
              onClick={onNavigate}
              className={`portal-sidebar__link ${isVerificationRoute && activePriority === priority ? "portal-sidebar__link--active" : ""}`}
              style={{ paddingLeft: "3.15rem", fontSize: "0.92rem" }}
            >
              <span>{label}</span>
              {isVerificationRoute && activePriority === priority && <span className="portal-sidebar__link-indicator" />}
            </NavLink>
          ))}
        </div>
      )}
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
