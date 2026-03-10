import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      <aside
        className={`shrink-0 flex flex-col bg-white dark:bg-slate-800 border-r border-gray-200/60 dark:border-slate-700/60 transition-[width] duration-300 shadow-3d-md relative z-10 ${
          sidebarCollapsed ? "w-14" : "w-56"
        }`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      </aside>
      <div className="flex flex-col flex-1 min-w-0 bg-gray-50 dark:bg-slate-900">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
