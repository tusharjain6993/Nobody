// import { useEffect, useRef, useState } from "react";
// import {
//   ArrowMaximizeRegular,
//   ArrowMinimizeRegular,
//   AlertRegular,
//   SettingsRegular,
//   SignOutRegular,
//   WeatherMoonRegular,
//   WeatherSunnyRegular,
//   SearchRegular,
//   NavigationRegular,
// } from "@fluentui/react-icons";
// import { useLocation, useNavigate } from "react-router-dom";
// import { useHCMAuth } from "../minister/HCMAuthContext";
// import { notificationsApi } from "../minister/ministerApi";
// import { getRoleLabel } from "../constants/adminWorkflow";
// import { useTheme } from "../context/ThemeContext";

// const Header = ({ onOpenMobileNav }) => {
//   const { user, logout } = useHCMAuth();
//   const { darkMode, toggleDarkMode } = useTheme();
//   const ref = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [open, setOpen] = useState(false);
//   const [notifyOpen, setNotifyOpen] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);

//   const pageTitle = location.pathname.startsWith("/dashboard")
//     ? "Productivity Dashboard"
//     : location.pathname.startsWith("/calendar")
//       ? "Admin Calendar"
//     : location.pathname.startsWith("/minister/dashboard")
//       ? "Minister Dashboard"
//       : location.pathname.startsWith("/minister/calendar")
//         ? "Minister Calendar"
//     : location.pathname.startsWith("/cases")
//       ? "Work Queue"
//       : location.pathname.startsWith("/meetings")
//         ? (user?.role === "deo" ? "Calendar & Engagement" : "Meetings")
//         : location.pathname.startsWith("/new-case")
//           ? "Citizen Services"
//           : location.pathname.startsWith("/my-cases")
//             ? "Complaints"
//             : location.pathname.startsWith("/verification-requests")
//               ? "Verification Requests"
//             : "Portal";

//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) document.documentElement.requestFullscreen();
//     else document.exitFullscreen();
//   };

//   useEffect(() => {
//     const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
//     document.addEventListener("fullscreenchange", handleFullscreenChange);
//     return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
//   }, []);

//   useEffect(() => {
//     const handler = (event) => {
//       if (ref.current && !ref.current.contains(event.target)) {
//         setOpen(false);
//         setNotifyOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   useEffect(() => {
//     let mounted = true;
//     async function loadNotifications() {
//       if (!user) return;
//       try {
//         const res = await notificationsApi.list();
//         if (!mounted) return;
//         setNotifications(res.notifications || []);
//         setUnreadCount(res.unreadCount || 0);
//       } catch {}
//     }
//     loadNotifications();
//     const timer = setInterval(loadNotifications, 30000);
//     return () => {
//       mounted = false;
//       clearInterval(timer);
//     };
//   }, [user]);

//   const handleMarkRead = async (id) => {
//     await notificationsApi.markRead(id);
//     const res = await notificationsApi.list();
//     setNotifications(res.notifications || []);
//     setUnreadCount(res.unreadCount || 0);
//   };

//   const handleMarkAllRead = async () => {
//     await notificationsApi.markAllRead();
//     const res = await notificationsApi.list();
//     setNotifications(res.notifications || []);
//     setUnreadCount(res.unreadCount || 0);
//   };

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   return (
//     <header className="portal-topbar glass-panel">
//       <div className="portal-topbar__left">
//         <button type="button" className="portal-topbar__mobile-toggle" onClick={onOpenMobileNav}>
//           <NavigationRegular />
//         </button>
//         <div>
//           <div className="portal-topbar__title">{pageTitle}</div>
//         </div>
//       </div>

//       <div className="portal-topbar__right" ref={ref}>
//         <div className="portal-topbar__search">
//           <SearchRegular className="portal-topbar__search-icon" />
//           <input type="text" placeholder="Search pages, cases, meetings..." />
//         </div>

//         <HeaderIcon icon={isFullscreen ? ArrowMinimizeRegular : ArrowMaximizeRegular} onClick={toggleFullscreen} />
//         <HeaderIcon icon={darkMode ? WeatherSunnyRegular : WeatherMoonRegular} onClick={toggleDarkMode} />

//         <button className="relative cursor-pointer" onClick={() => { setNotifyOpen((value) => !value); setOpen(false); }}>
//           <span className="portal-topbar__icon-btn">
//             <AlertRegular />
//           </span>
//           {unreadCount > 0 && (
//             <span className="portal-topbar__badge">
//               {unreadCount > 99 ? "99+" : unreadCount}
//             </span>
//           )}
//         </button>

//         <button type="button" className="portal-topbar__user" onClick={() => { setOpen((value) => !value); setNotifyOpen(false); }}>
//           <div className="portal-topbar__avatar">
//             {user?.name?.[0]?.toUpperCase() || "U"}
//           </div>
//           <span className="portal-topbar__user-name">{user?.name?.split(" ")[0] || "User"}</span>
//         </button>

//         {open && (
//           <div className="portal-menu">
//             <div className="portal-menu__header">
//               <div className="portal-topbar__avatar">
//                 {user?.name?.[0]?.toUpperCase() || "U"}
//               </div>
//               <div>
//                 <p className="font-bold text-sm" style={{ margin: 0, color: "var(--text-primary)" }}>{user?.name || "User"}</p>
//                 <p className="text-xs capitalize" style={{ margin: 0, color: "var(--text-tertiary)" }}>
//                   {getRoleLabel(user?.role) || "Citizen"} {user?.email ? `· ${user.email}` : ""}
//                 </p>
//               </div>
//             </div>
//             <div className="py-1">
//               <MenuItem icon={SettingsRegular} label="Profile Settings" onClick={() => { navigate("/profile-settings"); setOpen(false); }} />
//               <MenuItem icon={SignOutRegular} label="Logout" danger onClick={handleLogout} />
//             </div>
//           </div>
//         )}

//         {notifyOpen && (
//           <div className="portal-menu portal-menu--wide">
//             <div className="portal-menu__header">
//               <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Notifications</span>
//               {unreadCount > 0 && (
//                 <button onClick={handleMarkAllRead} className="portal-link-btn text-xs">
//                   Mark all read
//                 </button>
//               )}
//             </div>
//             <div className="max-h-72 overflow-y-auto">
//               {notifications.length === 0 ? (
//                 <p className="text-sm text-center py-6" style={{ color: "var(--text-tertiary)" }}>No notifications</p>
//               ) : (
//                 notifications.slice(0, 20).map((item) => (
//                   <div
//                     key={item._id}
//                     onClick={() => {
//                       if (!item.isRead) handleMarkRead(item._id);
//                       if (item.link) navigate(item.link);
//                       setNotifyOpen(false);
//                     }}
//                     className="px-4 py-3 cursor-pointer transition-colors"
//                     style={{
//                       borderBottom: "1px solid var(--border-primary)",
//                       background: !item.isRead ? "var(--accent-primary-subtle)" : "transparent",
//                     }}
//                   >
//                     <p className="text-xs" style={{ margin: 0, fontWeight: !item.isRead ? 700 : 500, color: !item.isRead ? "var(--text-primary)" : "var(--text-secondary)" }}>{item.message}</p>
//                     <p className="text-[10px] mt-0.5" style={{ marginBottom: 0, color: "var(--text-tertiary)" }}>{new Date(item.createdAt).toLocaleString()}</p>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </header>
//   );
// };

// const HeaderIcon = ({ icon: Icon, onClick }) => (
//   <button type="button" className="portal-topbar__icon-btn" onClick={onClick}>
//     <Icon />
//   </button>
// );

// const MenuItem = ({ icon: Icon, label, danger, onClick }) => (
//   <button type="button" className={`portal-menu__item ${danger ? "portal-menu__item--danger" : ""}`} onClick={onClick}>
//     <Icon />
//     <span>{label}</span>
//   </button>
// );

// export default Header;

import { useEffect, useRef, useState } from "react";
import {
  ArrowMaximizeRegular,
  ArrowMinimizeRegular,
  AlertRegular,
  SettingsRegular,
  SignOutRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
  SearchRegular,
  NavigationRegular,
} from "@fluentui/react-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useHCMAuth } from "../minister/HCMAuthContext";
import { notificationsApi } from "../minister/ministerApi";
import { getRoleLabel } from "../constants/adminWorkflow";
import { useTheme } from "../context/ThemeContext";

const Header = ({ onOpenMobileNav }) => {
  const { user, logout } = useHCMAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const pageTitle = location.pathname.startsWith("/dashboard")
    ? "Productivity Dashboard"
    : location.pathname.startsWith("/calendar")
      ? "Admin Calendar"
    : location.pathname.startsWith("/minister/dashboard")
      ? "Minister Dashboard"
      : location.pathname.startsWith("/minister/calendar")
        ? "Minister Calendar"
    : location.pathname.startsWith("/cases")
      ? "Work Queue"
      : location.pathname.startsWith("/meetings")
        ? (user?.role === "deo" ? "Calendar & Engagement" : "Meetings")
        : location.pathname.startsWith("/new-case")
          ? "Citizen Services"
          : location.pathname.startsWith("/my-cases")
            ? "Complaints"
            : location.pathname.startsWith("/verification-requests")
              ? "Verification Requests"
            : "Portal";

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
        setNotifyOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadNotifications() {
      if (!user) return;
      try {
        const res = await notificationsApi.list();
        if (!mounted) return;
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      } catch {}
    }
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [user]);

  const handleMarkRead = async (id) => {
    await notificationsApi.markRead(id);
    const res = await notificationsApi.list();
    setNotifications(res.notifications || []);
    setUnreadCount(res.unreadCount || 0);
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    const res = await notificationsApi.list();
    setNotifications(res.notifications || []);
    setUnreadCount(res.unreadCount || 0);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0 transition-colors duration-300">
      
      {/* LEFT SECTION: Mobile Toggle & Title */}
      <div className="flex items-center gap-4">
        <button 
          type="button" 
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 md:hidden transition-colors" 
          onClick={onOpenMobileNav}
        >
          <NavigationRegular fontSize={20} />
        </button>
        {/* <div>
          <div className="font-bold text-lg text-gray-800 dark:text-gray-100 capitalize tracking-tight hidden sm:block">
            {pageTitle}
          </div>
        </div> */}
      </div>

      {/* RIGHT SECTION: Controls & Profile */}
      <div className="flex items-center gap-1 sm:gap-2 relative" ref={ref}>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-gray-100/70 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 px-3 py-2 rounded-xl transition-all w-64">
          <SearchRegular className="text-gray-400 mr-2" fontSize={16} />
          <input 
            type="text" 
            placeholder="Search pages, cases, meetings..." 
            className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 w-full placeholder-gray-400"
          />
        </div>

        {/* Fullscreen Button */}
        <HeaderIcon 
          icon={isFullscreen ? ArrowMinimizeRegular : ArrowMaximizeRegular} 
          onClick={toggleFullscreen} 
        />
        
        {/* Dark Mode Toggle Button */}
        <HeaderIcon 
          icon={darkMode ? WeatherSunnyRegular : WeatherMoonRegular} 
          onClick={toggleDarkMode} 
        />

        {/* Notifications Button */}
        <button 
          type="button"
          className="relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer" 
          onClick={() => { setNotifyOpen((value) => !value); setOpen(false); }}
        >
          <AlertRegular fontSize={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar Button */}
        <button 
          type="button" 
          className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none border border-transparent hover:border-gray-200 dark:hover:border-slate-700 cursor-pointer"
          onClick={() => { setOpen((value) => !value); setNotifyOpen(false); }}
        >
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 hidden md:block">
            {user?.name?.split(" ")[0] || "User"}
          </span>
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-gray-200 dark:border-blue-800 shadow-sm shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </button>

        {/* ================= DROPDOWNS ================= */}

        {/* Profile Dropdown */}
        {open && (
          <div className="absolute right-0 top-14 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-gray-100 dark:border-slate-700 z-50 overflow-hidden transform origin-top-right transition-all">
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
              <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-gray-200 dark:border-blue-800 shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium capitalize truncate">
                  {getRoleLabel(user?.role) || "Citizen"} {user?.email ? `· ${user.email}` : ""}
                </p>
              </div>
            </div>
            <div className="py-2">
              <MenuItem 
                icon={SettingsRegular} 
                label="Profile Settings" 
                onClick={() => { navigate("/profile-settings"); setOpen(false); }} 
              />
              <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-3"></div>
              <MenuItem 
                icon={SignOutRegular} 
                label="Logout" 
                danger 
                onClick={handleLogout} 
              />
            </div>
          </div>
        )}

        {/* Notifications Dropdown */}
        {notifyOpen && (
          <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead} 
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <p className="text-sm text-center py-6 text-gray-500 dark:text-gray-400">No notifications</p>
              ) : (
                notifications.slice(0, 20).map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (!item.isRead) handleMarkRead(item._id);
                      if (item.link) navigate(item.link);
                      setNotifyOpen(false);
                    }}
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 
                      ${!item.isRead ? "bg-blue-50/50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-800"}
                    `}
                  >
                    <p className={`text-xs ${!item.isRead ? "font-bold text-gray-900 dark:text-gray-100" : "font-medium text-gray-600 dark:text-gray-300"}`}>
                      {item.message}
                    </p>
                    <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Basic Custom Scrollbar implementation mapping for dropdown */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </header>
  );
};

// Reusable Header Icon Button
const HeaderIcon = ({ icon: Icon, onClick }) => (
  <button 
    type="button" 
    className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer" 
    onClick={onClick}
  >
    <Icon fontSize={18} />
  </button>
);

// Reusable Dropdown Menu Item
const MenuItem = ({ icon: Icon, label, danger, onClick }) => (
  <button 
    type="button" 
    className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer
    ${danger ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"}`}
    onClick={onClick} 
  >
    <Icon fontSize={16} />
    <span>{label}</span>
  </button>
);

export default Header;