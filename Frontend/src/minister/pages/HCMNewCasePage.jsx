import { useState } from "react";
import { CheckCircle, AlertCircle, FileText, Calendar } from "lucide-react";
import { useHCMAuth } from "../HCMAuthContext";

const REQUEST_CATEGORIES = [
  { id: "PUB_WELFARE", name: "Public Welfare" },
  { id: "COMPLAINT", name: "Complaint" },
  { id: "REQUEST", name: "Request" },
  { id: "GRIEVANCE", name: "Grievance" },
];

const PRIORITIES = [
  { id: "LOW", name: "Low" },
  { id: "MEDIUM", name: "Medium" },
  { id: "HIGH", name: "High" },
  { id: "CRITICAL", name: "Critical" },
];

let caseCounter = 1001;

export default function HCMNewCasePage() {
  const { user } = useHCMAuth();
  const [form, setForm] = useState({
    purpose: "",
    category: "",
    priority: "MEDIUM",
    meetingDate: "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.purpose.trim()) e.purpose = "Purpose / issue is required.";
    if (!form.category) e.category = "Please select a category.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const caseId = `MO-2026-${String(caseCounter++).padStart(5, "0")}`;
    setSuccess(caseId);
  };

  const resetForm = () => {
    setSuccess(null);
    setForm({ purpose: "", category: "", priority: "MEDIUM", meetingDate: "" });
    setErrors({});
  };

  if (success) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <div style={{
          background: "#fff", borderRadius: "24px", padding: "3rem",
          maxWidth: "460px", width: "100%", textAlign: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0",
        }}>
          <div style={{
            width: "80px", height: "80px", background: "#f0fdf4",
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 1.5rem",
          }}>
            <CheckCircle size={40} color="#22c55e" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.5rem" }}>Case Submitted!</h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Your case has been registered successfully.</p>
          <div style={{
            background: "#f1f5f9", borderRadius: "12px", padding: "1.25rem",
            marginBottom: "1.5rem", border: "1px solid #e2e8f0",
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
              Case Reference ID
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: "900", color: "#3b82f6", letterSpacing: "0.05em" }}>
              {success}
            </div>
          </div>
          <button
            onClick={resetForm}
            style={{
              width: "100%", padding: "0.85rem",
              background: "#0f172a", border: "none", borderRadius: "12px",
              color: "#fff", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer",
            }}
          >
            Submit Another Case
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0", borderRadius: "10px",
    fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
    color: "#1e293b", transition: "border-color 0.2s",
  };

  const errorInputStyle = { ...inputStyle, borderColor: "#ef4444", background: "#fef2f2" };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "700px", margin: "0 auto" }}>
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "2rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
      }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.3rem" }}>
            Add New Case
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
            Submitting as <strong>{user?.name}</strong> ({user?.email})
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Purpose */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
              Purpose / Issue *
            </label>
            <textarea
              rows={4}
              value={form.purpose}
              onChange={(e) => {
                setForm({ ...form, purpose: e.target.value });
                if (errors.purpose) setErrors({ ...errors, purpose: null });
              }}
              placeholder="Describe your request, complaint, or grievance..."
              style={{
                ...(errors.purpose ? errorInputStyle : inputStyle),
                resize: "vertical",
              }}
            />
            {errors.purpose && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertCircle size={14} /> {errors.purpose}
              </p>
            )}
          </div>

          {/* Category & Priority */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => {
                  setForm({ ...form, category: e.target.value });
                  if (errors.category) setErrors({ ...errors, category: null });
                }}
                style={{ ...(errors.category ? errorInputStyle : inputStyle), cursor: "pointer" }}
              >
                <option value="" disabled>Select category</option>
                {REQUEST_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                  <AlertCircle size={14} /> {errors.category}
                </p>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Meeting Date */}
          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
              Preferred Meeting Date (Optional)
            </label>
            <input
              type="date"
              value={form.meetingDate}
              onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%", padding: "0.85rem",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              border: "none", borderRadius: "12px",
              color: "#fff", fontWeight: "700", fontSize: "1rem", cursor: "pointer",
              boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
            }}
          >
            Submit Case →
          </button>
        </form>
      </div>
    </div>
  );
}
