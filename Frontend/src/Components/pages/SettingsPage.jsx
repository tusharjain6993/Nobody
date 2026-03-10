import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

// --- Mock profile of minister (can be read from localStorage later) ---
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    name: "Rajesh Kumar",
    email: "minister@hcm.gov.in",
    role: "Minister",
    department: "Home Affairs",
};

// SECTIONS
const SECTIONS = [
    { id: "profile",       label: "Profile",       icon: "👤" },
    { id: "appearance",    label: "Appearance",     icon: "🎨" },
    { id: "notifications", label: "Notifications",  icon: "🔔" },
    { id: "security",      label: "Security",       icon: "🔒" },
    { id: "about",         label: "About",          icon: "ℹ️" },
];

export default function SettingsPage() {
    const navigate = useNavigate();
    const [active, setActive] = useState("profile");
    const [name, setName] = useState(loggedInUser.name || "");
    const [email, setEmail] = useState(loggedInUser.email || "");
    const [saved, setSaved] = useState(false);
    const [profileError, setProfileError] = useState("");
    const { darkMode, toggleDarkMode } = useTheme();
    const [emailNotif, setEmailNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(false);

    const handleSave = () => {
        setProfileError("");
        if (!name?.trim()) {
            setProfileError("Name is required.");
            return;
        }
        const emailTrim = (email || "").trim().toLowerCase();
        if (!emailTrim) {
            setProfileError("Email is required.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
            setProfileError("Please enter a valid email address.");
            return;
        }
        const updated = { ...loggedInUser, name: name.trim(), email: emailTrim };
        localStorage.setItem("loggedInUser", JSON.stringify(updated));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    // Shared styles
    const card = {
        background: "#fff",
        borderRadius: "16px",
        padding: "1.5rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0",
        marginBottom: "1rem",
    };
    const cardClassName = "settings-card";
    const label = {
        display: "block",
        fontSize: "0.8rem",
        fontWeight: "700",
        color: "#475569",
        marginBottom: "0.35rem",
    };
    const input = {
        width: "100%",
        padding: "0.65rem 0.875rem",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "0.875rem",
        outline: "none",
        boxSizing: "border-box",
        color: "#1e293b",
    };
    const toggle = (on) => ({
        width: "44px", height: "24px",
        background: on ? "#6366f1" : "#e2e8f0",
        borderRadius: "999px",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
    });
    const toggleKnob = (on) => ({
        position: "absolute",
        top: "3px",
        left: on ? "23px" : "3px",
        width: "18px", height: "18px",
        background: "#fff",
        borderRadius: "50%",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    });

    // ── CONTENT per section ───────────────────────────
    const renderContent = () => {
        switch (active) {
            case "profile":
                return (
                    <div>
                        <h2 className="settings-section-title" style={{ fontWeight: "800", color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
                            👤 Profile Settings
                        </h2>

                        {/* Avatar */}
                        <div className={cardClassName} style={{ ...card, display: "flex", alignItems: "center", gap: "1.25rem" }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=80`}
                                alt="avatar"
                                style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0 }}
                            />
                            <div>
                                <div className="settings-body-text" style={{ fontWeight: "700", color: "#1e293b", fontSize: "1rem" }}>{name}</div>
                                <div className="settings-muted" style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>{loggedInUser.role} · {loggedInUser.department}</div>
                                <div className="settings-muted" style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.15rem" }}>{email}</div>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className={cardClassName} style={card}>
                            {profileError && (
                                <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem" }}>
                                    {profileError}
                                </div>
                            )}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <span style={label}>Full Name</span>
                                    <input value={name} onChange={e => { setName(e.target.value); setProfileError(""); }} style={input} placeholder="Your name" />
                                </div>
                                <div>
                                    <span style={label}>Email Address</span>
                                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setProfileError(""); }} style={input} placeholder="you@example.com" />
                                </div>
                                <div>
                                    <span style={label}>Role</span>
                                    <input value={loggedInUser.role || "Minister"} disabled style={{ ...input, background: "#f8fafc", color: "#94a3b8" }} />
                                </div>
                                <div>
                                    <span style={label}>Department</span>
                                    <input value={loggedInUser.department || "Home Affairs"} disabled style={{ ...input, background: "#f8fafc", color: "#94a3b8" }} />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                style={{
                                    marginTop: "1.25rem",
                                    padding: "0.65rem 2rem",
                                    background: saved ? "#10b981" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                                    border: "none", borderRadius: "10px",
                                    color: "#fff", fontWeight: "800",
                                    fontSize: "0.9rem", cursor: "pointer",
                                    transition: "background 0.3s",
                                }}
                            >
                                {saved ? "✓ Saved!" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                );

            case "appearance":
                return (
                    <div>
                        <h2 className="settings-section-title" style={{ fontWeight: "800", color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
                            🎨 Appearance
                        </h2>
                        <div className={cardClassName} style={card}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9" }}>
                                <div>
                                    <div className="settings-body-text" style={{ fontWeight: "700", color: "#1e293b" }}>Dark Mode</div>
                                    <div className="settings-muted" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Switch to dark theme</div>
                                </div>
                                <div style={toggle(darkMode)} onClick={toggleDarkMode}>
                                    <div style={toggleKnob(darkMode)} />
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0" }}>
                                <div>
                                    <div className="settings-body-text" style={{ fontWeight: "700", color: "#1e293b" }}>Font</div>
                                    <div className="settings-muted" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Currently using Lora — Google Fonts</div>
                                </div>
                                <span style={{
                                    padding: "0.25rem 0.75rem",
                                    background: "rgba(99,102,241,0.08)",
                                    color: "#6366f1",
                                    borderRadius: "8px",
                                    fontSize: "0.8rem",
                                    fontWeight: "700",
                                }}>Lora</span>
                            </div>
                        </div>
                    </div>
                );

            case "notifications":
                return (
                    <div>
                        <h2 className="settings-section-title" style={{ fontWeight: "800", color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
                            🔔 Notification Preferences
                        </h2>
                        <div className={cardClassName} style={card}>
                            {[
                                { label: "Email Notifications", sub: "Get updates on new case requests via email", state: emailNotif, set: setEmailNotif },
                                { label: "SMS Notifications", sub: "Receive SMS alerts for urgent cases", state: smsNotif, set: setSmsNotif },
                            ].map(item => (
                                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 0", borderBottom: "1px solid #f8fafc" }}>
                                    <div>
                                        <div className="settings-body-text" style={{ fontWeight: "700", color: "#1e293b" }}>{item.label}</div>
                                        <div className="settings-muted" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{item.sub}</div>
                                    </div>
                                    <div style={toggle(item.state)} onClick={() => item.set(v => !v)}>
                                        <div style={toggleKnob(item.state)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "security":
                return (
                    <div>
                        <h2 className="settings-section-title" style={{ fontWeight: "800", color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
                            🔒 Security
                        </h2>
                        <div className={cardClassName} style={card}>
                            <div style={{ marginBottom: "1rem" }}>
                                <span style={label}>Current Password</span>
                                <input type="password" placeholder="••••••••" style={input} />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <span style={label}>New Password</span>
                                <input type="password" placeholder="••••••••" style={input} />
                            </div>
                            <div>
                                <span style={label}>Confirm Password</span>
                                <input type="password" placeholder="••••••••" style={input} />
                            </div>
                            <button style={{
                                marginTop: "1.25rem",
                                padding: "0.65rem 2rem",
                                background: "linear-gradient(135deg,#ef4444,#f43f5e)",
                                border: "none", borderRadius: "10px",
                                color: "#fff", fontWeight: "800",
                                fontSize: "0.9rem", cursor: "pointer",
                            }}>
                                Update Password
                            </button>
                        </div>
                    </div>
                );

            case "about":
                return (
                    <div>
                        <h2 className="settings-section-title" style={{ fontWeight: "800", color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1rem" }}>
                            ℹ️ About
                        </h2>
                        <div className={cardClassName} style={card}>
                            {[
                                ["Application", "HCM Minister Portal"],
                                ["Version", "v1.0.0 (Static)"],
                                ["Built With", "React + Vite + Tailwind CSS"],
                                ["Environment", "Development"],
                                ["Support", "support@hcm.gov.in"],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.65rem 0", borderBottom: "1px solid #f8fafc" }}>
                                    <span className="settings-muted" style={{ fontWeight: "700", color: "#475569", fontSize: "0.875rem" }}>{k}</span>
                                    <span className="settings-body-text" style={{ color: "#1e293b", fontSize: "0.875rem" }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="settings-page" style={{ padding: "1.5rem", maxWidth: "1000px", margin: "0 auto", fontFamily: "'Lora', serif" }}>
            <h1 className="settings-page-title" style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: "0 0 1.5rem" }}>⚙️ Settings</h1>

            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.25rem", alignItems: "start" }}>
                {/* Left Nav */}
                <div className="settings-nav" style={{
                    background: "#fff", borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                }}>
                    {SECTIONS.map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setActive(sec.id)}
                            style={{
                                display: "flex", alignItems: "center", gap: "0.6rem",
                                width: "100%", padding: "0.75rem 1rem",
                                background: active === sec.id ? "rgba(99,102,241,0.08)" : "transparent",
                                borderLeft: active === sec.id ? "3px solid #6366f1" : "3px solid transparent",
                                border: "none",
                                color: active === sec.id ? "#6366f1" : "#64748b",
                                fontWeight: active === sec.id ? "800" : "600",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.15s",
                                fontFamily: "'Lora', serif",
                            }}
                        >
                            <span>{sec.icon}</span>
                            {sec.label}
                        </button>
                    ))}
                </div>

                {/* Right Content */}
                <div>{renderContent()}</div>
            </div>
        </div>
    );
}
