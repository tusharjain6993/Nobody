// import {
//   NavigationRegular,
//   DataBarVerticalRegular,
//   GavelRegular,
//   DocumentAddRegular,
//   SettingsRegular,
//   CalendarLtrRegular,
//   BuildingBankRegular,
//   ChevronDownRegular,
//   ChevronRightRegular,
// } from "@fluentui/react-icons";
// import { useEffect, useState } from "react";
// import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";
// import { useHCMAuth } from "../minister/HCMAuthContext";
// function Sidebar({ collapsed, onToggle, onNavigate }) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useHCMAuth();
//   const userRole = user?.role || "citizen";
//   const [verificationMenuOpen, setVerificationMenuOpen] = useState(false);

//   useEffect(() => {
//     if (userRole === "deo" && location.pathname === "/verification-requests") {
//       setVerificationMenuOpen(true);
//     }
//   }, [location.pathname, userRole]);

//   const navItems = [
//     ...(userRole === "admin" ? [
//       { to: "/dashboard", icon: DataBarVerticalRegular, label: "Dashboard" },
//       { to: "/cases", icon: GavelRegular, label: "Work Queue" },
//       { to: "/calendar", icon: CalendarLtrRegular, label: "Calendar" },
//       { to: "/meetings", icon: CalendarLtrRegular, label: "Meetings" },
//     ] : []),
//     ...(userRole === "minister" ? [
//       { to: "/minister/dashboard", icon: DataBarVerticalRegular, label: "Dashboard" },
//       { to: "/minister/calendar", icon: CalendarLtrRegular, label: "Calendar" },
//     ] : []),
//     ...(userRole === "deo" ? [
//       { to: "/meetings", icon: CalendarLtrRegular, label: "Calendar" },
//     ] : []),
//     ...(userRole === "citizen" ? [
//       { to: "/new-case", icon: DocumentAddRegular, label: "Services" },
//       { to: "/my-cases", icon: GavelRegular, label: "Complaints" },
//       { to: "/meetings", icon: CalendarLtrRegular, label: "Meetings" },
//     ] : []),
//     { to: "/settings", icon: SettingsRegular, label: "Site Settings" },
//   ];

//   return (
//     <div className="h-full flex flex-col">
//       <div className="portal-sidebar__header">
//         <div className="portal-sidebar__logo">
//           <Link to="/" className="portal-sidebar__logo-mark" onClick={onNavigate} aria-label="HCM Portal home">
//             <BuildingBankRegular />
//           </Link>
//           {!collapsed && (
//             <div className="portal-sidebar__brand">
//               <span className="portal-sidebar__brand-title">HCM Minister Office Portal</span>
//             </div>
//           )}
//         </div>
//         <button type="button" onClick={onToggle} className="portal-sidebar__toggle" title={collapsed ? "Expand" : "Collapse"}>
//           <NavigationRegular />
//         </button>
//       </div>

//       {userRole !== "citizen" && (
//         <div className="portal-sidebar__user">
//           <div className="portal-sidebar__avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
//           {!collapsed && user && (
//             <div className="portal-sidebar__user-text">
//               <div className="portal-sidebar__user-name">{user.name}</div>
//               <div className="portal-sidebar__user-role">{user.role}</div>
//             </div>
//           )}
//         </div>
//       )}

//       <nav className="portal-sidebar__nav hide-scroll">
//         <div className="portal-sidebar__section-label">{!collapsed ? "Navigation" : ""}</div>
//         {userRole === "deo" && (
//           <DeoVerificationMenu
//             collapsed={collapsed}
//             open={verificationMenuOpen}
//             onToggle={() => setVerificationMenuOpen((current) => !current)}
//             onNavigate={onNavigate}
//           />
//         )}
//         {navItems.map(({ to, icon: Icon, label }) => (
//           <LinkWrapper
//             key={to}
//             to={to}
//             icon={Icon}
//             label={label}
//             collapsed={collapsed}
//             onNavigate={onNavigate}
//           />
//         ))}
//       </nav>
//     </div>
//   );
// }

// function DeoVerificationMenu({ collapsed, open, onToggle, onNavigate }) {
//   const location = useLocation();
//   const query = new URLSearchParams(location.search);
//   const activePriority = String(query.get("priority") || "").toUpperCase();
//   const isVerificationRoute = location.pathname === "/verification-requests";
//   const priorityItems = [
//     ["LOW", "Low Requests"],
//     ["MEDIUM", "Medium Requests"],
//     ["HIGH", "High Requests"],
//     ["CRITICAL", "Critical Requests"],
//   ];

//   return (
//     <div>
//       <button
//         type="button"
//         onClick={onToggle}
//         title={collapsed ? "Verification Requests" : undefined}
//         className={`portal-sidebar__link ${isVerificationRoute ? "portal-sidebar__link--active" : ""}`}
//       >
//         <span className="portal-sidebar__link-icon"><GavelRegular /></span>
//         {!collapsed && (
//           <>
//             <span>Verification Requests</span>
//             <span className="ml-auto">{open ? <ChevronDownRegular /> : <ChevronRightRegular />}</span>
//           </>
//         )}
//         {isVerificationRoute && <span className="portal-sidebar__link-indicator" />}
//       </button>
//       {!collapsed && open && (
//         <div className="mt-1 space-y-1">
//           {priorityItems.map(([priority, label]) => (
//             <NavLink
//               key={priority}
//               to={`/verification-requests?priority=${priority}`}
//               onClick={onNavigate}
//               className={`portal-sidebar__link ${isVerificationRoute && activePriority === priority ? "portal-sidebar__link--active" : ""}`}
//               style={{ paddingLeft: "3.15rem", fontSize: "0.92rem" }}
//             >
//               <span>{label}</span>
//               {isVerificationRoute && activePriority === priority && <span className="portal-sidebar__link-indicator" />}
//             </NavLink>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function LinkWrapper({ to, icon: Icon, label, collapsed, onNavigate }) {
//   return (
//     <LinkItem to={to} collapsed={collapsed} label={label} onNavigate={onNavigate}>
//       {({ isActive }) => (
//         <>
//           <span className="portal-sidebar__link-icon"><Icon /></span>
//           {!collapsed && <span>{label}</span>}
//           {isActive && <span className="portal-sidebar__link-indicator" />}
//         </>
//       )}
//     </LinkItem>
//   );
// }

// function LinkItem({ to, collapsed, label, children, onNavigate }) {
//   return (
//     <NavLink
//       to={to}
//       title={collapsed ? label : undefined}
//       onClick={onNavigate}
//       className={({ isActive }) => `portal-sidebar__link ${isActive ? "portal-sidebar__link--active" : ""}`}
//     >
//       {({ isActive }) => children({ isActive })}
//     </NavLink>
//   );
// }

// export default Sidebar;

// ---------------------------------------PURANA WALA--------------------------------



import {
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

function Sidebar({ collapsed, onToggle, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useHCMAuth();
  const userRole = user?.role || "citizen";
  const [verificationMenuOpen, setVerificationMenuOpen] = useState(false);

  useEffect(() => {
    if (userRole === "deo" && location.pathname === "/verification-requests") {
      setVerificationMenuOpen(true);
    }
  }, [location.pathname, userRole]);

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
    { to: "/settings", icon: SettingsRegular, label: "Site Settings" },
  ];

  return (
    <div className="h-full flex flex-col bg-white ">
      
      {/* 1. Header & Collapse Icon - 🟢 FIXED ALIGNMENT */}
      <div className={`border-b border-gray-300 flex items-center h-14 shrink-0 transition-all duration-300 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
        {!collapsed && (
          <Link to="/" onClick={onNavigate} className="flex items-center gap-2 overflow-hidden text-blue-600">
            <BuildingBankRegular fontSize={24} className="shrink-0" />
            <span className="font-bold text-gray-800 text-sm truncate">HCM Minister Portal</span>
          </Link>
        )}
        <button 
          type="button" 
          onClick={onToggle} 
          title={collapsed ? "Expand" : "Collapse"}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex items-center justify-center shrink-0"
        >
          <NavigationRegular fontSize={20} />
        </button>
      </div>

      {/* 2. User Info */}
      {/* {userRole !== "citizen" && (
        <div className={`flex items-center p-4 border-b border-gray-100 transition-all duration-300 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && user && (
            <div className="flex flex-col overflow-hidden">
              <div className="text-sm font-semibold text-gray-800 truncate">{user.name}</div>
              <div className="text-xs text-gray-500 capitalize truncate">{user.role}</div>
            </div>
          )}
        </div>
      )} */}

      {/* 3. Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {/* DEO Specific Menu */}
        {userRole === "deo" && (
          <DeoVerificationMenu
            collapsed={collapsed}
            open={verificationMenuOpen}
            onToggle={() => setVerificationMenuOpen((current) => !current)}
            onNavigate={onNavigate}
          />
        )}

        {/* Standard Links */}
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

      {/* Custom Scrollbar css for nav */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />
    </div>
  );
}

// 🟢 FIXED DEO DROPDOWN UI
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
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "Verification Requests" : undefined}
        className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
          isVerificationRoute ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
          <GavelRegular fontSize={20} />
        </div>
        {!collapsed && (
          <>
            <span className="ml-3 flex-1 text-left truncate">Verification Requests</span>
            {open ? <ChevronDownRegular fontSize={16} className="shrink-0" /> : <ChevronRightRegular fontSize={16} className="shrink-0" />}
          </>
        )}
      </button>
      
      {!collapsed && open && (
        <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
          {priorityItems.map(([priority, label]) => (
            <NavLink
              key={priority}
              to={`/verification-requests?priority=${priority}`}
              onClick={onNavigate}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                isVerificationRoute && activePriority === priority 
                ? "bg-blue-100 text-blue-700 font-medium" 
                : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// 🟢 FIXED LINK WRAPPER UI
function LinkWrapper({ to, icon: Icon, label, collapsed, onNavigate }) {
  return (
    <div className="mb-1">
      <NavLink
        to={to}
        title={collapsed ? label : undefined}
        onClick={onNavigate}
        className={({ isActive }) => `flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
          isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
          <Icon fontSize={20} />
        </div>
        {!collapsed && <span className="ml-3 truncate">{label}</span>}
      </NavLink>
    </div>
  );
}

export default Sidebar;
