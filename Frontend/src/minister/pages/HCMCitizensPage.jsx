import { useState } from "react";
import { MOCK_CITIZENS, formatDate } from "../../minister/ministerData";
import { useNavigate } from "react-router-dom";
import { PersonRegular, AddRegular, SearchRegular } from "@fluentui/react-icons";

export default function HCMCitizensPage() {
  const navigate = useNavigate();
  const [citizens, setCitizens] = useState(MOCK_CITIZENS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", aadhaar: "", address: "" });
  const [errors, setErrors] = useState({});

  const filtered = citizens.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.aadhaar || "").includes(q)
    );
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim() || form.phone.length < 10) e.phone = "Valid 10-digit phone required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    const newCitizen = {
      id: "uuid-c" + Date.now(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      aadhaar: form.aadhaar.trim() || null,
      address: form.address.trim() || null,
      districtId: null, stateId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCitizens((prev) => [newCitizen, ...prev]);
    setShowModal(false);
    setForm({ name: "", phone: "", aadhaar: "", address: "" });
    setErrors({});
  };

  const inputStyle = (hasErr) => ({
    width: "100%", padding: "0.6rem 0.875rem",
    border: `1px solid ${hasErr ? "#fca5a5" : "#e2e8f0"}`,
    borderRadius: "8px", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box",
    color: "#1e293b",
  });

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1000px", margin: "0 auto", fontFamily: "'Lora', serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.45rem" }}><PersonRegular /> Citizens</h1>
          <p style={{ color: "#64748b", margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
            {filtered.length} citizen{filtered.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "0.6rem 1.25rem",
            background: "linear-gradient(135deg,#3b82f6,#6366f1)",
            border: "none", borderRadius: "10px",
            color: "#fff", fontWeight: "700", fontSize: "0.875rem",
            cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}><AddRegular /> Add Citizen</span>
        </button>
      </div>

      {/* Search */}
      <div style={{
        background: "#fff", borderRadius: "12px", padding: "0.875rem 1rem",
        border: "1px solid #e2e8f0", marginBottom: "1.25rem",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}>
        <input
          type="text"
          placeholder="Search by name, phone, or Aadhaar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "0.5rem 0.75rem",
            border: "1px solid #e2e8f0", borderRadius: "8px",
            fontSize: "0.875rem", outline: "none",
          }}
        />
      </div>

      {/* List */}
      <div style={{
        background: "#fff", borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0", overflow: "hidden",
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "2.5rem", display: "inline-flex" }}><PersonRegular /></div>
            <div style={{ marginTop: "0.5rem", fontWeight: "600" }}>No citizens found</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["Name", "Phone", "Aadhaar", "Address", "Registered", ""].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "0.75rem 1rem",
                    color: "#94a3b8", fontWeight: "600",
                    fontSize: "0.75rem", textTransform: "uppercase",
                    borderBottom: "2px solid #e2e8f0",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ fontWeight: "700", color: "#1e293b" }}>{c.name}</div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#475569" }}>{c.phone}</td>
                  <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.8rem" }}>
                    {c.aadhaar || "—"}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#64748b", maxWidth: "200px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.address || "—"}
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.8rem" }}>
                    {formatDate(c.createdAt)}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <button
                      onClick={() => navigate("/new-case", { state: { citizenId: c.id, citizenName: c.name } })}
                      style={{
                        padding: "0.35rem 0.8rem",
                        background: "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        borderRadius: "8px", color: "#6366f1",
                        fontSize: "0.78rem", fontWeight: "700", cursor: "pointer",
                      }}
                    >
                      + Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "1rem",
        }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{
            background: "#fff", borderRadius: "18px",
            padding: "1.75rem", width: "100%", maxWidth: "420px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{ fontWeight: "800", color: "#0f172a", margin: "0 0 1.25rem", fontSize: "1.1rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}><PersonRegular /> Add New Citizen</span>
            </h2>

            {[
              { label: "Full Name *", field: "name", placeholder: "Ramesh Kumar", type: "text" },
              { label: "Phone Number *", field: "phone", placeholder: "9876543210", type: "tel" },
              { label: "Aadhaar (optional)", field: "aadhaar", placeholder: "1234-5678-9012", type: "text" },
              { label: "Address (optional)", field: "address", placeholder: "Village, District", type: "text" },
            ].map(({ label, field, placeholder, type }) => (
              <div key={field} style={{ marginBottom: "0.875rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.35rem" }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={placeholder}
                  style={inputStyle(!!errors[field])}
                />
                {errors[field] && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>{errors[field]}</p>}
              </div>
            ))}

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button onClick={() => { setShowModal(false); setErrors({}); }}
                style={{ padding: "0.6rem 1.25rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", color: "#64748b", fontWeight: "700", fontSize: "0.875rem", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleCreate}
                style={{ padding: "0.6rem 1.5rem", border: "none", borderRadius: "8px", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontWeight: "700", fontSize: "0.875rem", cursor: "pointer" }}>
                Add Citizen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
