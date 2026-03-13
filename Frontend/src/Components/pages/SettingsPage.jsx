import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useHCMAuth } from "../../minister/HCMAuthContext";
import { getRoleLabel } from "../../constants/adminWorkflow";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "appearance", label: "Appearance", icon: "🎨" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "about", label: "About", icon: "ℹ️" },
];

export default function SettingsPage() {
  const { user } = useHCMAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [active, setActive] = useState("profile");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  const profile = {
    name: user?.name || "Demo User",
    email: user?.email || "demo@portal.gov",
    role: getRoleLabel(user?.role),
    department: user?.department || (user?.role === "citizen" ? "Citizen Services" : "Demo Operations"),
  };

  const card = {
    background: "#fff",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    marginBottom: "1rem",
  };

  const renderContent = () => {
    if (active === "profile") {
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
            👤 Profile Settings
          </h2>
          <div style={{ ...card, display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff&size=80`}
              alt="avatar"
              style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>{profile.name}</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>{profile.role} · {profile.department}</div>
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.15rem" }}>{profile.email}</div>
            </div>
          </div>
        </div>
      );
    }

    if (active === "appearance") {
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
            🎨 Appearance
          </h2>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#1e293b" }}>Dark Mode</div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Switch the portal theme.</div>
              </div>
              <button
                type="button"
                onClick={toggleDarkMode}
                style={{
                  width: "48px",
                  height: "28px",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  background: darkMode ? "#6366f1" : "#e2e8f0",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {darkMode ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (active === "notifications") {
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
            🔔 Notification Preferences
          </h2>
          <div style={card}>
            {[
              { label: "Email Notifications", sub: "Receive demo alerts in the portal header.", state: emailNotif, setState: setEmailNotif },
              { label: "SMS Notifications", sub: "Visual-only toggle for demo flows.", state: smsNotif, setState: setSmsNotif },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 0", borderBottom: "1px solid #f8fafc" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b" }}>{item.label}</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{item.sub}</div>
                </div>
                <button
                  type="button"
                  onClick={() => item.setState((value) => !value)}
                  style={{
                    padding: "0.35rem 0.85rem",
                    borderRadius: "999px",
                    border: "none",
                    background: item.state ? "#6366f1" : "#e2e8f0",
                    color: item.state ? "#fff" : "#475569",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {item.state ? "On" : "Off"}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="settings-section-title" style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
          ℹ️ About
        </h2>
        <div style={card}>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
            This demo runs entirely in the frontend using the embedded SQLite database powered by `sql.js`.
            Citizen identity, complaints, meetings, calendar events, notifications, and dashboard analytics are stored locally for demo use.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.25rem", padding: "1.5rem" }}>
      <aside style={{ background: "#fff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "1rem", alignSelf: "start" }}>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActive(section.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "0.9rem 1rem",
              borderRadius: "12px",
              border: "none",
              marginBottom: "0.4rem",
              cursor: "pointer",
              background: active === section.id ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "transparent",
              color: active === section.id ? "#fff" : "#334155",
              fontWeight: 700,
            }}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </aside>
      <section>{renderContent()}</section>
    </div>
  );
}
