import { useEffect, useState } from "react";
import { PersonRegular } from "@fluentui/react-icons";
import { useHCMAuth } from "../../minister/HCMAuthContext";
import { profileApi } from "../../minister/ministerApi";
import { getRoleLabel } from "../../constants/adminWorkflow";

export default function ProfileSettingsPage() {
  const { user, sessionExpiresAt, updateUser } = useHCMAuth();
  const [message, setMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    profileId: "",
    name: "",
    email: "",
    department: "",
    phonePrimary: "",
    citizenId: "",
    age: "",
    gender: "",
    pinCode: "",
    state: "",
    city: "",
    mpName: "",
    aadhaarMasked: "",
  });

  const profile = {
    name: user?.name || "Demo User",
    email: user?.email || "demo@portal.gov",
    role: getRoleLabel(user?.role),
    department: user?.department || (user?.role === "citizen" ? "Citizen Services" : "Demo Operations"),
  };

  const profileCompletion = user?.profileCompletion;

  useEffect(() => {
    let mounted = true;
    profileApi.getCurrent()
      .then((res) => {
        if (!mounted) return;
        setProfileForm({
          profileId: res.profile.profileId || "",
          name: res.profile.name || "",
          email: res.profile.email || "",
          department: res.profile.department || "",
          phonePrimary: res.profile.phonePrimary || "",
          citizenId: res.profile.citizenId || "",
          age: res.profile.age || "",
          gender: res.profile.gender || "",
          pinCode: res.profile.pinCode || "",
          state: res.profile.state || "",
          city: res.profile.city || "",
          mpName: res.profile.mpName || "",
          aadhaarMasked: res.profile.aadhaarMasked || "",
        });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  async function handleProfileSave() {
    setProfileSaving(true);
    setMessage("");
    try {
      const res = await profileApi.updateCurrent(profileForm);
      updateUser(res.sessionUser);
      setProfileForm((current) => ({
        ...current,
        profileId: res.profile.profileId || current.profileId,
        citizenId: res.profile.citizenId || current.citizenId,
        aadhaarMasked: res.profile.aadhaarMasked || current.aadhaarMasked,
      }));
      setMessage("Profile settings updated.");
    } catch (err) {
      setMessage(err.message || "Unable to update profile settings.");
    } finally {
      setProfileSaving(false);
    }
  }

  const roleSpecificDetails = user?.role === "admin"
    ? "Admin profile controls focus on work queue ownership and operational contact details."
    : user?.role === "deo"
      ? "DEO profile controls focus on verification desk and calendar execution details."
      : user?.role === "minister"
        ? "Minister profile controls focus on visibility and scheduling context."
        : "Citizen profile controls focus on identity completeness and communication details.";

  const card = {
    background: "var(--bg-primary)",
    borderRadius: "var(--radius-xl)",
    padding: "1.5rem",
    boxShadow: "var(--shadow-card)",
    border: "1px solid var(--border-primary)",
    marginBottom: "1rem",
  };

  return (
    <div className="portal-page">
      <div>
        <div className="portal-page__eyebrow">Account</div>
        <h1 className="portal-page__title" style={{ fontSize: "2.5rem" }}>Profile Settings</h1>
        <p className="portal-page__desc">Manage your identity, contact details, and role-specific profile information.</p>
      </div>

      {message && <div className="portal-alert portal-alert--success" style={{ marginBottom: "1rem" }}>{message}</div>}

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

      <div className="settings-card" style={card}>
        <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <PersonRegular />
          <span>Edit Profile</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={profileForm.profileId} readOnly className="portal-input" placeholder="Profile ID" />
          <input value={user?.role === "citizen" ? profileForm.citizenId : getRoleLabel(user?.role)} readOnly className="portal-input" placeholder="Role / Citizen ID" />
          <input value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} className="portal-input" placeholder="Full name" />
          <input value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} className="portal-input" placeholder="Email address" />
          <input value={profileForm.phonePrimary} onChange={(event) => setProfileForm((current) => ({ ...current, phonePrimary: event.target.value.replace(/\D/g, "").slice(0, 10) }))} className="portal-input" placeholder="Phone number" />
          {user?.role !== "citizen" ? (
            <input value={profileForm.department} onChange={(event) => setProfileForm((current) => ({ ...current, department: event.target.value }))} className="portal-input" placeholder="Department" />
          ) : (
            <input value={profileForm.aadhaarMasked} readOnly className="portal-input" placeholder="Aadhaar" />
          )}
          {user?.role === "citizen" && (
            <>
              <input value={profileForm.age} onChange={(event) => setProfileForm((current) => ({ ...current, age: event.target.value.replace(/\D/g, "").slice(0, 3) }))} className="portal-input" placeholder="Age" />
              <input value={profileForm.gender} onChange={(event) => setProfileForm((current) => ({ ...current, gender: event.target.value }))} className="portal-input" placeholder="Gender" />
              <input value={profileForm.pinCode} onChange={(event) => setProfileForm((current) => ({ ...current, pinCode: event.target.value.replace(/\D/g, "").slice(0, 6) }))} className="portal-input" placeholder="PIN code" />
              <input value={profileForm.state} onChange={(event) => setProfileForm((current) => ({ ...current, state: event.target.value }))} className="portal-input" placeholder="State" />
              <input value={profileForm.city} onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))} className="portal-input" placeholder="City" />
              <input value={profileForm.mpName} onChange={(event) => setProfileForm((current) => ({ ...current, mpName: event.target.value }))} className="portal-input" placeholder="MP name" />
            </>
          )}
        </div>
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={handleProfileSave} disabled={profileSaving} className="portal-btn">
            {profileSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
