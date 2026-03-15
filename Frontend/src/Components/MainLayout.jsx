// import { useState } from "react";
// import { Outlet } from "react-router-dom";
// import Sidebar from "./Sidebar";
// import Header from "./Header";

// function MainLayout() {
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);

//   return (
//     <div className="portal-shell">
//       {mobileOpen && <div className="portal-sidebar-overlay" onClick={() => setMobileOpen(false)} />}
//       <aside
//         className={`portal-sidebar glass-panel ${sidebarCollapsed ? "portal-sidebar--collapsed" : ""} ${mobileOpen ? "portal-sidebar--mobile-open" : ""}`}
//       >
//         <Sidebar
//           collapsed={sidebarCollapsed}
//           onToggle={() => setSidebarCollapsed((c) => !c)}
//           onNavigate={() => setMobileOpen(false)}
//         />
//       </aside>
//       <div className={`portal-main ${sidebarCollapsed ? "portal-main--collapsed" : ""}`}>
//         <Header onOpenMobileNav={() => setMobileOpen(true)} />
//         <main className="portal-content">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

// export default MainLayout;


import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="w-full h-screen flex overflow-hidden bg-gray-50">
      
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Area */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200
          transform transition-all duration-300 ease-in-out
          md:relative md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${sidebarCollapsed ? "md:w-16" : "md:w-64"}
          w-64
        `}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export default MainLayout;