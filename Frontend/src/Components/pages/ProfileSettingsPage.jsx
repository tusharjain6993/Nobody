// import { useEffect, useState } from "react";
// import { PersonRegular } from "@fluentui/react-icons";
// import { useHCMAuth } from "../../minister/HCMAuthContext";
// import { profileApi } from "../../minister/ministerApi";
// import { getRoleLabel } from "../../constants/adminWorkflow";

// export default function ProfileSettingsPage() {
//   const { user, sessionExpiresAt, updateUser } = useHCMAuth();
//   const [message, setMessage] = useState("");
//   const [profileSaving, setProfileSaving] = useState(false);
//   const [profileForm, setProfileForm] = useState({
//     profileId: "",
//     name: "",
//     email: "",
//     department: "",
//     phonePrimary: "",
//     citizenId: "",
//     age: "",
//     gender: "",
//     pinCode: "",
//     state: "",
//     city: "",
//     mpName: "",
//     aadhaarMasked: "",
//   });

//   const profile = {
//     name: user?.name || "Demo User",
//     email: user?.email || "demo@portal.gov",
//     role: getRoleLabel(user?.role),
//     department: user?.department || (user?.role === "citizen" ? "Citizen Services" : "Demo Operations"),
//   };

//   const profileCompletion = user?.profileCompletion;

//   useEffect(() => {
//     let mounted = true;
//     profileApi.getCurrent()
//       .then((res) => {
//         if (!mounted) return;
//         setProfileForm({
//           profileId: res.profile.profileId || "",
//           name: res.profile.name || "",
//           email: res.profile.email || "",
//           department: res.profile.department || "",
//           phonePrimary: res.profile.phonePrimary || "",
//           citizenId: res.profile.citizenId || "",
//           age: res.profile.age || "",
//           gender: res.profile.gender || "",
//           pinCode: res.profile.pinCode || "",
//           state: res.profile.state || "",
//           city: res.profile.city || "",
//           mpName: res.profile.mpName || "",
//           aadhaarMasked: res.profile.aadhaarMasked || "",
//         });
//       })
//       .catch(() => {});
//     return () => { mounted = false; };
//   }, []);

//   async function handleProfileSave() {
//     setProfileSaving(true);
//     setMessage("");
//     try {
//       const res = await profileApi.updateCurrent(profileForm);
//       updateUser(res.sessionUser);
//       setProfileForm((current) => ({
//         ...current,
//         profileId: res.profile.profileId || current.profileId,
//         citizenId: res.profile.citizenId || current.citizenId,
//         aadhaarMasked: res.profile.aadhaarMasked || current.aadhaarMasked,
//       }));
//       setMessage("Profile settings updated.");
//     } catch (err) {
//       setMessage(err.message || "Unable to update profile settings.");
//     } finally {
//       setProfileSaving(false);
//     }
//   }

//   const roleSpecificDetails = user?.role === "admin"
//     ? "Admin profile controls focus on work queue ownership and operational contact details."
//     : user?.role === "deo"
//       ? "DEO profile controls focus on verification desk and calendar execution details."
//       : user?.role === "minister"
//         ? "Minister profile controls focus on visibility and scheduling context."
//         : "Citizen profile controls focus on identity completeness and communication details.";

//   const card = {
//     background: "var(--bg-primary)",
//     borderRadius: "var(--radius-xl)",
//     padding: "1.5rem",
//     boxShadow: "var(--shadow-card)",
//     border: "1px solid var(--border-primary)",
//     marginBottom: "1rem",
//   };

//   return (
//     <div className="portal-page">
//       <div>
//         <div className="portal-page__eyebrow">Account</div>
//         <h1 className="portal-page__title" style={{ fontSize: "2.5rem" }}>Profile Settings</h1>
//         <p className="portal-page__desc">Manage your identity, contact details, and role-specific profile information.</p>
//       </div>

//       {message && <div className="portal-alert portal-alert--success" style={{ marginBottom: "1rem" }}>{message}</div>}

//       <div className="settings-card" style={{ ...card, display: "flex", alignItems: "center", gap: "1.25rem" }}>
//         <img
//           src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff&size=80`}
//           alt="avatar"
//           style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0 }}
//         />
//         <div>
//           <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>{profile.name}</div>
//           <div className="settings-body-text" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>{profile.role} · {profile.department}</div>
//           <div className="settings-muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>{profile.email}</div>
//           {sessionExpiresAt && <div className="settings-muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>Session expires: {new Date(sessionExpiresAt).toLocaleString()}</div>}
//           {profileCompletion && <div className="settings-muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>Citizen profile completeness: {profileCompletion.percent}%</div>}
//           <div className="settings-muted" style={{ fontSize: "0.78rem", marginTop: "0.25rem", maxWidth: "420px" }}>{roleSpecificDetails}</div>
//         </div>
//       </div>

//       <div className="settings-card" style={card}>
//         <h2 className="settings-section-title" style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
//           <PersonRegular />
//           <span>Edit Profile</span>
//         </h2>
//         <div className="grid md:grid-cols-2 gap-3">
//           <input value={profileForm.profileId} readOnly className="portal-input" placeholder="Profile ID" />
//           <input value={user?.role === "citizen" ? profileForm.citizenId : getRoleLabel(user?.role)} readOnly className="portal-input" placeholder="Role / Citizen ID" />
//           <input value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} className="portal-input" placeholder="Full name" />
//           <input value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} className="portal-input" placeholder="Email address" />
//           <input value={profileForm.phonePrimary} onChange={(event) => setProfileForm((current) => ({ ...current, phonePrimary: event.target.value.replace(/\D/g, "").slice(0, 10) }))} className="portal-input" placeholder="Phone number" />
//           {user?.role !== "citizen" ? (
//             <input value={profileForm.department} onChange={(event) => setProfileForm((current) => ({ ...current, department: event.target.value }))} className="portal-input" placeholder="Department" />
//           ) : (
//             <input value={profileForm.aadhaarMasked} readOnly className="portal-input" placeholder="Aadhaar" />
//           )}
//           {user?.role === "citizen" && (
//             <>
//               <input value={profileForm.age} onChange={(event) => setProfileForm((current) => ({ ...current, age: event.target.value.replace(/\D/g, "").slice(0, 3) }))} className="portal-input" placeholder="Age" />
//               <input value={profileForm.gender} onChange={(event) => setProfileForm((current) => ({ ...current, gender: event.target.value }))} className="portal-input" placeholder="Gender" />
//               <input value={profileForm.pinCode} onChange={(event) => setProfileForm((current) => ({ ...current, pinCode: event.target.value.replace(/\D/g, "").slice(0, 6) }))} className="portal-input" placeholder="PIN code" />
//               <input value={profileForm.state} onChange={(event) => setProfileForm((current) => ({ ...current, state: event.target.value }))} className="portal-input" placeholder="State" />
//               <input value={profileForm.city} onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))} className="portal-input" placeholder="City" />
//               <input value={profileForm.mpName} onChange={(event) => setProfileForm((current) => ({ ...current, mpName: event.target.value }))} className="portal-input" placeholder="MP name" />
//             </>
//           )}
//         </div>
//         <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
//           <button type="button" onClick={handleProfileSave} disabled={profileSaving} className="portal-btn">
//             {profileSaving ? "Saving..." : "Save Profile"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiUsers, FiZap, FiCreditCard, FiCamera, FiTrash2, FiCheckCircle, FiAlertCircle, FiChevronRight } from "react-icons/fi";
import { useHCMAuth } from "../../minister/HCMAuthContext";
import { profileApi } from "../../minister/ministerApi";
import { getRoleLabel } from "../../constants/adminWorkflow";

export default function ProfileSettingsPage() {
  const { user, sessionExpiresAt, updateUser } = useHCMAuth();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [profileSaving, setProfileSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("mydetails");

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
      .catch(() => { });
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
      setMessage("Profile settings updated successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message || "Unable to update profile settings.");
      setMessageType("error");
    } finally {
      setProfileSaving(false);
    }
  }

  const tabs = [
    { id: "mydetails", label: "My Details", icon: FiUser, description: "Personal information" },
    { id: "profile", label: "Profile", icon: FiCamera, description: "Public profile settings" },
    { id: "password", label: "Password", icon: FiLock, description: "Change your password" },
    { id: "team", label: "Team", icon: FiUsers, description: "Team members" },
    { id: "plan", label: "Plan", icon: FiZap, description: "Your subscription plan" },
    { id: "billing", label: "Billing", icon: FiCreditCard, description: "Billing information" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Account Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your profile, security preferences, and workspace settings.</p>
        </div>

        {/* ===== MAIN LAYOUT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ===== SIDEBAR ===== */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">Settings Menu</h3>
              </div>

              <nav className="p-3 space-y-1">
                {tabs.map(({ id, label, icon: Icon, description }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 outline-none group
bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon size={20} className={activeTab === id ? "text-blue-100" : "text-slate-400 group-hover:text-slate-500"} />
                      <div className="text-left">
                        <div className="font-semibold text-sm">{label}</div>
                        <div className={`text-[11px] mt-0.5 ${activeTab === id ? "text-blue-200" : "text-slate-400 dark:text-slate-500"}`}>
                          {description}
                        </div>
                      </div>
                    </div>
                    {activeTab === id && <FiChevronRight size={18} className="text-blue-200" />}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* ===== CONTENT ===== */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">

            {/* ===== SUCCESS/ERROR MESSAGE ===== */}
            {message && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-slideIn ${messageType === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"
                }`}>
                {messageType === "success" ? (
                  <FiCheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <FiAlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-bold text-sm ${messageType === "success" ? "text-emerald-900 dark:text-emerald-200" : "text-red-900 dark:text-red-200"}`}>
                    {messageType === "success" ? "Success!" : "Error!"}
                  </p>
                  <p className={`text-sm ${messageType === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                    {message}
                  </p>
                </div>
              </div>
            )}

            {/* ===== MY DETAILS TAB ===== */}
            {activeTab === "mydetails" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm animate-fadeIn">

                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <FiUser size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Basic Details</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your personal information and profile photo.</p>
                  </div>
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-800 dark:to-slate-700 p-1 shadow-md">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-slate-900 bg-white">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2563eb&color=fff&size=128&bold=true`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Profile Photo</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">We recommend an image of at least 300x300. Gifs work too.</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                      <button type="button" className="hover:text-blue-600 px-5 py-2.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-gray-900 rounded-xl text-sm font-semibold transition-all shadow-sm">
                        Upload Photo
                      </button>
                      <button type="button" className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                    <input
                      value={profileForm.name?.split(" ")[0] || ""}
                      onChange={(event) => setProfileForm((current) => ({
                        ...current,
                        name: event.target.value + " " + (current.name?.split(" ")[1] || "")
                      }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all"
                      placeholder="e.g. John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                    <input
                      value={profileForm.name?.split(" ")[1] || ""}
                      onChange={(event) => setProfileForm((current) => ({
                        ...current,
                        name: (current.name?.split(" ")[0] || "") + " " + event.target.value
                      }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all"
                      placeholder="e.g. Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <FiMail size={15} className="text-slate-400" /> Email Address
                    </label>
                    <input
                      value={profileForm.email}
                      onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <FiPhone size={15} className="text-slate-400" /> Phone Number
                    </label>
                    <input
                      value={profileForm.phonePrimary}
                      onChange={(event) => setProfileForm((current) => ({ ...current, phonePrimary: event.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all"
                      placeholder="10-digit number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <FiMapPin size={15} className="text-slate-400" /> City
                    </label>
                    <input
                      value={profileForm.city}
                      onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all"
                      placeholder="City Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">State</label>
                      <input
                        value={profileForm.state}
                        onChange={(event) => setProfileForm((current) => ({ ...current, state: event.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Postal Code</label>
                      <input
                        value={profileForm.pinCode}
                        onChange={(event) => setProfileForm((current) => ({ ...current, pinCode: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all"
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                    <textarea
                      placeholder="Write a few sentences about yourself..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none h-32"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="hover:text-blue-600 px-6 py-2.5 text-gray-900 rounded-xl font-semibold shadow-sm  flex items-center justify-center min-w-[140px]"
                  >
                    {profileSaving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-gray-900" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ===== PROFILE TAB ===== */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
                  <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl">
                      <FiCamera size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Public Profile</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Control how your profile appears to the public.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Make Contact Info Public</h3>
                        <p className="text-sm text-slate-500 mt-1">Anyone can see your contact information</p>
                      </div>
                      <button type="button" className="w-12 h-6 bg-blue-600 rounded-full relative transition-colors shadow-inner outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm transition-all"></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Make Profile Visible</h3>
                        <p className="text-sm text-slate-500 mt-1">Your profile is visible to other users</p>
                      </div>
                      <button type="button" className="w-12 h-6 bg-slate-300 dark:bg-slate-600 rounded-full relative transition-colors shadow-inner outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-all"></div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/30 p-6 sm:p-10 shadow-sm">
                  <div className="flex items-center gap-4 pb-6 mb-6 border-b border-red-100 dark:border-red-900/20">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl">
                      <FiTrash2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
                      <p className="text-sm text-slate-500 mt-1">Irreversible destructive actions.</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">Delete Account</h3>
                      <p className="text-sm text-slate-500">Permanently delete your data and everything associated with it.</p>
                    </div>
                    <button type="button" className="px-6 py-2.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-transparent rounded-xl font-semibold transition-all w-full sm:w-auto text-center">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PASSWORD TAB ===== */}
            {activeTab === "password" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl">
                    <FiLock size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Change Password</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your password associated with your account.</p>
                  </div>
                </div>

                <div className="space-y-5 max-w-xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                    <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all" placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                    <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                    <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all" placeholder="Confirm new password" />
                  </div>
                  <div className="pt-4">
                    <button type="button" className="px-8 py-3 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition-all">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PLACEHOLDERS FOR OTHER TABS ===== */}
            {["team", "plan", "billing"].includes(activeTab) && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm animate-fadeIn">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mb-4 text-slate-400">
                  {activeTab === "team" && <FiUsers size={28} />}
                  {activeTab === "plan" && <FiZap size={28} />}
                  {activeTab === "billing" && <FiCreditCard size={28} />}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 capitalize">{activeTab} Settings</h2>
                <p className="text-slate-500">This feature is currently under development. Check back soon!</p>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}