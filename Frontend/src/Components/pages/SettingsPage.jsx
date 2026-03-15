import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useHCMAuth } from "../../minister/HCMAuthContext";
import { getRoleLabel } from "../../constants/adminWorkflow";
import {
  PersonRegular,
  PaintBrushRegular,
  AlertRegular,
  ArchiveRegular,
  InfoRegular,
} from "@fluentui/react-icons";
import {
  deleteDemoSnapshot,
  exportDemoDatabase,
  importDemoDatabase,
  listDemoSeedPacks,
  listDemoSnapshots,
  resetDemoDatabaseWithSeed,
  restoreDemoSnapshot,
  saveDemoSnapshot,
} from "../../db/database";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: PersonRegular },
  { id: "appearance", label: "Appearance", icon: PaintBrushRegular },
  { id: "notifications", label: "Notifications", icon: AlertRegular },
  { id: "demo", label: "Demo Data", icon: ArchiveRegular },
  { id: "about", label: "About", icon: InfoRegular },
];

export default function SettingsPage() {
  const { user, sessionExpiresAt } = useHCMAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [active, setActive] = useState("profile");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [seedPack, setSeedPack] = useState(listDemoSeedPacks()[0]?.id || "default");
  const [message, setMessage] = useState("");
  const [snapshots, setSnapshots] = useState(() => listDemoSnapshots());

  const profile = {
    name: user?.name || "Demo User",
    email: user?.email || "demo@portal.gov",
    role: getRoleLabel(user?.role),
    department: user?.department || (user?.role === "citizen" ? "Citizen Services" : "Demo Operations"),
  };

  const profileCompletion = user?.profileCompletion;

  async function handleExport() {
    const payload = exportDemoDatabase();
    if (!payload) {
      setMessage("Initialize the portal once before exporting demo data.");
      return;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hcm-demo-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Demo database exported.");
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importDemoDatabase(JSON.parse(text));
    window.location.reload();
  }

  async function handleSaveSnapshot() {
    const entry = saveDemoSnapshot(snapshotName);
    setSnapshots(listDemoSnapshots());
    setSnapshotName("");
    setMessage(`Snapshot saved: ${entry.name}`);
  }

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
      const roleSpecificDetails = user?.role === "admin"
        ? "Admin profile controls focus on queue ownership, review desk context, and supervisory visibility."
        : user?.role === "deo"
          ? "DEO settings focus on verification requests and calendar execution responsibilities."
          : user?.role === "minister"
            ? "Minister settings focus on dashboard visibility and calendar-only access."
            : "Citizen settings focus on profile completeness and request communication details.";
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PersonRegular />
            <span>Profile Settings</span>
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
              {sessionExpiresAt && <div className="settings-muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>Session expires: {new Date(sessionExpiresAt).toLocaleString()}</div>}
              {profileCompletion && <div className="settings-muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>Citizen profile completeness: {profileCompletion.percent}%</div>}
              <div className="settings-muted" style={{ fontSize: "0.78rem", marginTop: "0.25rem", maxWidth: "420px" }}>{roleSpecificDetails}</div>
            </div>
          </div>
        </div>
      );
    }

    if (active === "appearance") {
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PaintBrushRegular />
            <span>Appearance</span>
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
      const notificationOptions = user?.role === "citizen"
        ? [
          { label: "Meeting Alerts", sub: "Scheduling, rejection, and citizen-facing request updates.", state: emailNotif, setState: setEmailNotif },
          { label: "Complaint Alerts", sub: "Resolution and escalation changes for your complaints.", state: smsNotif, setState: setSmsNotif },
        ]
        : user?.role === "deo"
          ? [
            { label: "Verification Requests", sub: "Receive new citizen verification assignments from admins.", state: emailNotif, setState: setEmailNotif },
            { label: "Calendar Execution Alerts", sub: "Receive DEO calendar and follow-up reminders.", state: smsNotif, setState: setSmsNotif },
          ]
          : user?.role === "minister"
            ? [
              { label: "VIP Meeting Alerts", sub: "Receive notifications for minister-visible citizen meetings.", state: emailNotif, setState: setEmailNotif },
              { label: "Calendar Updates", sub: "Receive DEO-driven calendar changes.", state: smsNotif, setState: setSmsNotif },
            ]
            : [
              { label: "Queue Alerts", sub: "Receive complaint and meeting queue updates.", state: emailNotif, setState: setEmailNotif },
              { label: "Verification / Calendar Alerts", sub: "Receive workflow updates from DEO actions and scheduling changes.", state: smsNotif, setState: setSmsNotif },
            ];
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertRegular />
            <span>Notification Preferences</span>
          </h2>
          <div className="settings-card" style={card}>
            {notificationOptions.map((item) => (
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

    if (active === "demo") {
      return (
        <div>
          <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArchiveRegular />
            <span>Demo State Lifecycle</span>
          </h2>
          {message && <div className="portal-alert portal-alert--success" style={{ marginBottom: "1rem" }}>{message}</div>}
          <div className="settings-card" style={card}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="button" onClick={handleExport} className="portal-btn-secondary">Export Current State</button>
              <label className="portal-btn-secondary" style={{ cursor: "pointer" }}>
                Import State
                <input type="file" accept="application/json" onChange={handleImport} hidden />
              </label>
            </div>
          </div>

          <div className="settings-card" style={card}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Seed Packs</div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <select value={seedPack} onChange={(event) => setSeedPack(event.target.value)} className="portal-input" style={{ maxWidth: "260px" }}>
                {listDemoSeedPacks().map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <button type="button" onClick={() => { resetDemoDatabaseWithSeed(seedPack); window.location.reload(); }} className="portal-btn">Reset Using Seed Pack</button>
            </div>
            <div className="settings-muted" style={{ marginTop: "0.75rem", fontSize: "0.82rem" }}>
              {(listDemoSeedPacks().find((item) => item.id === seedPack) || {}).description}
            </div>
          </div>

          <div className="settings-card" style={card}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Snapshots</div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input value={snapshotName} onChange={(event) => setSnapshotName(event.target.value)} placeholder="Snapshot name" className="portal-input" style={{ maxWidth: "260px" }} />
              <button type="button" onClick={handleSaveSnapshot} className="portal-btn">Save Snapshot</button>
            </div>
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
              {snapshots.length === 0 ? (
                <div className="settings-muted" style={{ fontSize: "0.82rem" }}>No saved snapshots yet.</div>
              ) : snapshots.map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--border-secondary)" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.name}</div>
                    <div className="settings-muted" style={{ fontSize: "0.78rem" }}>{new Date(item.savedAt).toLocaleString()} · Seed: {item.seedPack}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="button" onClick={async () => { await restoreDemoSnapshot(item.name); window.location.reload(); }} className="portal-btn-secondary">Restore</button>
                    <button type="button" onClick={() => { deleteDemoSnapshot(item.name); setSnapshots(listDemoSnapshots()); }} className="portal-btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <InfoRegular />
          <span>About</span>
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
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              className={active === section.id ? "portal-tab portal-tab--active" : "portal-tab"}
              style={{ width: "100%", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Icon />
              <span>{section.label}</span>
            </button>
          );
        })}
        </aside>
        <section>{renderContent()}</section>
      </div>
    </div>
  );
}
