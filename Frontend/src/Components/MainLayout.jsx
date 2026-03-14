import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="portal-shell">
      {mobileOpen && <div className="portal-sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`portal-sidebar glass-panel ${sidebarCollapsed ? "portal-sidebar--collapsed" : ""} ${mobileOpen ? "portal-sidebar--mobile-open" : ""}`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>
      <div className={`portal-main ${sidebarCollapsed ? "portal-main--collapsed" : ""}`}>
        <Header onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
