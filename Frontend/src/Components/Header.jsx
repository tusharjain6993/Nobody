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
    <header className="portal-topbar glass-panel">
      <div className="portal-topbar__left">
        <button type="button" className="portal-topbar__mobile-toggle" onClick={onOpenMobileNav}>
          <NavigationRegular />
        </button>
        <div>
          <div className="portal-topbar__title">{pageTitle}</div>
        </div>
      </div>

      <div className="portal-topbar__right" ref={ref}>
        <div className="portal-topbar__search">
          <SearchRegular className="portal-topbar__search-icon" />
          <input type="text" placeholder="Search pages, cases, meetings..." />
        </div>

        <HeaderIcon icon={isFullscreen ? ArrowMinimizeRegular : ArrowMaximizeRegular} onClick={toggleFullscreen} />
        <HeaderIcon icon={darkMode ? WeatherSunnyRegular : WeatherMoonRegular} onClick={toggleDarkMode} />

        <button className="relative cursor-pointer" onClick={() => { setNotifyOpen((value) => !value); setOpen(false); }}>
          <span className="portal-topbar__icon-btn">
            <AlertRegular />
          </span>
          {unreadCount > 0 && (
            <span className="portal-topbar__badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button type="button" className="portal-topbar__user" onClick={() => { setOpen((value) => !value); setNotifyOpen(false); }}>
          <div className="portal-topbar__avatar">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="portal-topbar__user-name">{user?.name?.split(" ")[0] || "User"}</span>
        </button>

        {open && (
          <div className="portal-menu">
            <div className="portal-menu__header">
              <div className="portal-topbar__avatar">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ margin: 0, color: "var(--text-primary)" }}>{user?.name || "User"}</p>
                <p className="text-xs capitalize" style={{ margin: 0, color: "var(--text-tertiary)" }}>
                  {getRoleLabel(user?.role) || "Citizen"} {user?.email ? `· ${user.email}` : ""}
                </p>
              </div>
            </div>
            <div className="py-1">
              <MenuItem icon={SettingsRegular} label="Profile Settings" onClick={() => { navigate("/profile-settings"); setOpen(false); }} />
              <MenuItem icon={SignOutRegular} label="Logout" danger onClick={handleLogout} />
            </div>
          </div>
        )}

        {notifyOpen && (
          <div className="portal-menu portal-menu--wide">
            <div className="portal-menu__header">
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="portal-link-btn text-xs">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--text-tertiary)" }}>No notifications</p>
              ) : (
                notifications.slice(0, 20).map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (!item.isRead) handleMarkRead(item._id);
                      if (item.link) navigate(item.link);
                      setNotifyOpen(false);
                    }}
                    className="px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border-primary)",
                      background: !item.isRead ? "var(--accent-primary-subtle)" : "transparent",
                    }}
                  >
                    <p className="text-xs" style={{ margin: 0, fontWeight: !item.isRead ? 700 : 500, color: !item.isRead ? "var(--text-primary)" : "var(--text-secondary)" }}>{item.message}</p>
                    <p className="text-[10px] mt-0.5" style={{ marginBottom: 0, color: "var(--text-tertiary)" }}>{new Date(item.createdAt).toLocaleString()}</p>
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

const HeaderIcon = ({ icon: Icon, onClick }) => (
  <button type="button" className="portal-topbar__icon-btn" onClick={onClick}>
    <Icon />
  </button>
);

const MenuItem = ({ icon: Icon, label, danger, onClick }) => (
  <button type="button" className={`portal-menu__item ${danger ? "portal-menu__item--danger" : ""}`} onClick={onClick}>
    <Icon />
    <span>{label}</span>
  </button>
);

export default Header;
