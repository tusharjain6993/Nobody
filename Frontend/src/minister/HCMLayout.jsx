import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useHCMAuth } from "./HCMAuthContext";
import {
  DataBarVerticalRegular,
  FolderRegular,
  PersonRegular,
  AddRegular,
  BuildingBankRegular,
  SignOutRegular,
  PanelLeftExpandRegular,
  PanelLeftContractRegular,
} from "@fluentui/react-icons";

const NAV_ITEMS = [
  { to: "/hcm/dashboard", label: "Dashboard", icon: DataBarVerticalRegular },
  { to: "/hcm/cases", label: "Cases", icon: FolderRegular },
  { to: "/hcm/citizens", label: "Citizens", icon: PersonRegular },
  { to: "/hcm/new-case", label: "New Case", icon: AddRegular },
];

export default function HCMLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useHCMAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/hcm/login");
  };

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#f8fafc", fontFamily: "'Lora', serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? "64px" : "220px",
        minWidth: collapsed ? "64px" : "220px",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        display: "flex", flexDirection: "column",
        transition: "width 0.3s ease, min-width 0.3s ease",
        overflow: "hidden", boxShadow: "4px 0 20px rgba(0,0,0,0.25)",
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{
          padding: "0.85rem 0.75rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", gap: "0.6rem",
          overflow: "hidden",
        }}>
          <div style={{
            width: "36px", height: "36px", flexShrink: 0,
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            borderRadius: "10px", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem",
          }}><BuildingBankRegular /></div>
          {!collapsed && (
            <span style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
              HCM Portal
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              color: "#94a3b8", cursor: "pointer", fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            {collapsed ? <PanelLeftExpandRegular /> : <PanelLeftContractRegular />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem 0.5rem", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: "0.65rem",
                padding: "0.6rem 0.75rem", borderRadius: "10px",
                marginBottom: "0.25rem", textDecoration: "none",
                fontWeight: isActive ? "700" : "500",
                fontSize: "0.875rem",
                background: isActive
                  ? "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.2))"
                  : "transparent",
                color: isActive ? "#93c5fd" : "#94a3b8",
                border: isActive ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                transition: "all 0.2s",
                overflow: "hidden",
                whiteSpace: "nowrap",
              })}
            >
              <span style={{ fontSize: "1.1rem", flexShrink: 0, display: "inline-flex" }}><Icon /></span>
              {!collapsed && item.label}
            </NavLink>
          );})}
        </nav>

        {/* User + Logout */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "0.75rem 0.5rem",
        }}>
          {!collapsed && user && (
            <div style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: "10px", padding: "0.6rem 0.75rem",
              marginBottom: "0.5rem",
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f1f5f9", lineHeight: 1.2 }}>
                {user.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem" }}>
                {user.role}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 0.75rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px", color: "#fca5a5",
              fontSize: "0.875rem", cursor: "pointer",
              transition: "all 0.2s",
              overflow: "hidden", whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1.1rem", flexShrink: 0, display: "inline-flex" }}><SignOutRegular /></span>
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: "52px", background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontWeight: "600", color: "#334155", fontSize: "0.95rem" }}>
            HCM Office — Minister Portal
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "32px", height: "32px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.85rem", color: "#fff", fontWeight: "700",
            }}>
              {user?.name?.[0] || "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: "auto", background: "#f8fafc" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
