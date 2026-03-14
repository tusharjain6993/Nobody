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
    background: "var(--bg-primary)",
    borderRadius: "var(--radius-xl)",
    padding: "1.5rem",
    boxShadow: "var(--shadow-card)",
    border: "1px solid var(--border-primary)",
    marginBottom: "1rem",
  };

  const renderContent = () => {
    if (active === "profile") {
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem" }}>
            👤 Profile Settings
          </h2>
          <div className="settings-card" style={{ ...card, display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff&size=80`}
              alt="avatar"
              style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>{profile.name}</div>
              <div className="settings-body-text" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>{profile.role} · {profile.department}</div>
              <div className="settings-muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>{profile.email}</div>
            </div>
          </div>
        </div>
      );
    }

    if (active === "appearance") {
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem" }}>
            🎨 Appearance
          </h2>
          <div className="settings-card" style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Dark Mode</div>
                <div className="settings-muted" style={{ fontSize: "0.8rem" }}>Switch the portal theme.</div>
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
                  background: darkMode ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" : "var(--bg-secondary)",
                  color: darkMode ? "#fff" : "var(--text-secondary)",
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
          <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem" }}>
            🔔 Notification Preferences
          </h2>
          <div className="settings-card" style={card}>
            {[
              { label: "Email Notifications", sub: "Receive demo alerts in the portal header.", state: emailNotif, setState: setEmailNotif },
              { label: "SMS Notifications", sub: "Visual-only toggle for demo flows.", state: smsNotif, setState: setSmsNotif },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 0", borderBottom: "1px solid var(--border-secondary)" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.label}</div>
                  <div className="settings-muted" style={{ fontSize: "0.8rem" }}>{item.sub}</div>
                </div>
                <button
                  type="button"
                  onClick={() => item.setState((value) => !value)}
                  style={{
                    padding: "0.35rem 0.85rem",
                    borderRadius: "999px",
                    border: "none",
                    background: item.state ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" : "var(--bg-secondary)",
                    color: item.state ? "#fff" : "var(--text-secondary)",
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
        <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem" }}>
          ℹ️ About
        </h2>
        <div className="settings-card" style={card}>
          <p className="settings-body-text" style={{ margin: 0, lineHeight: 1.7 }}>
            This demo runs entirely in the frontend using the embedded SQLite database powered by `sql.js`.
            Citizen identity, complaints, meetings, calendar events, notifications, and dashboard analytics are stored locally for demo use.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="portal-page">
      <div>
        <div className="portal-page__eyebrow">Preferences</div>
        <h1 className="portal-page__title" style={{ fontSize: "2.5rem" }}>Settings</h1>
        <p className="portal-page__desc">Manage profile details, appearance preferences, and demo notification behavior.</p>
      </div>

      <div className="settings-page">
        <aside className="settings-nav">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActive(section.id)}
            className={active === section.id ? "portal-tab portal-tab--active" : "portal-tab"}
            style={{ width: "100%", justifyContent: "flex-start" }}
          >
            {section.icon} {section.label}
          </button>
        ))}
        </aside>
        <section>{renderContent()}</section>
      </div>
    </div>
  );
}
