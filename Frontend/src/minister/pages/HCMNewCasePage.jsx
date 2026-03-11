import { useState } from "react";
import { CheckmarkCircleRegular, ErrorCircleRegular } from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { casesApi } from "../ministerApi";
import { ADMIN_ROLES, getRoleLabel } from "../../constants/adminWorkflow";

export default function HCMNewCasePage() {
  const [form, setForm] = useState({
    referralRole: "",
    purpose: "",
    category: "",
    urgency: "MEDIUM",
    details: "",
  });
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!form.referralRole) nextErrors.referralRole = "Referral admin is required.";
    if (!form.purpose.trim()) nextErrors.purpose = "Complaint title is required.";
    if (!form.details.trim()) nextErrors.details = "Complaint details are required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const docList = documents.filter((doc) => doc.name?.trim() && doc.url?.trim());
      const res = await casesApi.create({
        referralRole: form.referralRole,
        purpose: form.purpose,
        category: form.category || "General Grievance",
        urgency: form.urgency,
        details: form.details,
        documents: docList,
      });
      setSuccess(res.case?.caseId || "Submitted");
      setForm({
        referralRole: "",
        purpose: "",
        category: "",
        urgency: "MEDIUM",
        details: "",
      });
      setDocuments([]);
      setErrors({});
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || "Failed to submit case" }));
    } finally {
      setLoading(false);
    }
  };

  const addDocument = () => setDocuments((current) => [...current, { name: "", url: "" }]);
  const updateDocument = (index, field, value) => {
    setDocuments((current) => current.map((doc, docIndex) => (docIndex === index ? { ...doc, [field]: value } : doc)));
  };
  const removeDocument = (index) => setDocuments((current) => current.filter((_, docIndex) => docIndex !== index));

  const inputStyle = {
    width: "100%",
    padding: "0.85rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
    color: "#1e293b",
    background: "#fff",
  };

  const errorInputStyle = { ...inputStyle, borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.08)" };

  if (success) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <div style={{ background: "#fff", borderRadius: "24px", padding: "3rem", maxWidth: "460px", width: "100%", textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "80px", height: "80px", background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <CheckmarkCircleRegular style={{ fontSize: 40, color: "#22c55e" }} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.5rem" }}>Complaint Submitted</h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Your case was routed to the selected admin referral.</p>
          <div style={{ background: "#f1f5f9", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
              Case Reference ID
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: "900", color: "#3b82f6", letterSpacing: "0.05em" }}>{success}</div>
          </div>
          <button
            onClick={() => setSuccess(null)}
            style={{ width: "100%", padding: "0.85rem", background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" }}
          >
            Register Another Complaint
          </button>
          <Link to="/my-cases" style={{ marginTop: "0.8rem", display: "block", textDecoration: "none", color: "#4f46e5", fontWeight: 700, fontSize: "0.9rem" }}>
            Track Your Cases →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "980px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #eff6ff, #eef2ff)", border: "1px solid #dbeafe", borderRadius: "24px", padding: "2rem", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#0f172a" }}>Register Complaint</h1>
        <p style={{ margin: "0.7rem 0 0", color: "#475569", fontSize: "0.98rem", lineHeight: 1.6 }}>
          Choose the admin referral role directly, add your grievance, and submit it. The case is routed locally inside the existing frontend-only flow.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "2rem", boxShadow: "0 12px 28px rgba(15,23,42,0.06)" }}>
        {errors.submit && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "12px", padding: "0.85rem 1rem" }}>
            <ErrorCircleRegular style={{ fontSize: 18 }} />
            <span>{errors.submit}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Referral Admin *</label>
            <select
              value={form.referralRole}
              onChange={(e) => setForm((prev) => ({ ...prev, referralRole: e.target.value }))}
              style={errors.referralRole ? errorInputStyle : inputStyle}
            >
              <option value="">Select admin</option>
              {ADMIN_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.referralRole && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>{errors.referralRole}</p>}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Selected Queue</label>
            <input value={form.referralRole ? getRoleLabel(form.referralRole) : "Case will go to the selected admin"} readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#475569" }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g. Scholarship, Certificate, Service Delay"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Urgency</label>
            <select value={form.urgency} onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value }))} style={inputStyle}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((urgency) => (
                <option key={urgency} value={urgency}>
                  {urgency}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Complaint Title *</label>
          <input
            value={form.purpose}
            onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
            placeholder="Short title for the complaint"
            style={errors.purpose ? errorInputStyle : inputStyle}
          />
          {errors.purpose && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>{errors.purpose}</p>}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Complaint Details *</label>
          <textarea
            rows={6}
            value={form.details}
            onChange={(e) => setForm((prev) => ({ ...prev, details: e.target.value }))}
            placeholder="Describe the issue clearly."
            style={errors.details ? { ...errorInputStyle, resize: "vertical" } : { ...inputStyle, resize: "vertical" }}
          />
          {errors.details && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>{errors.details}</p>}
        </div>

        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "1.5rem", paddingTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>Supporting Documents</h3>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>Optional links only, matching the current frontend data model.</p>
            </div>
            <button type="button" onClick={addDocument} style={{ padding: "0.6rem 0.95rem", border: "none", borderRadius: "10px", background: "#e0e7ff", color: "#4338ca", fontWeight: 700, cursor: "pointer" }}>
              + Add Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div style={{ padding: "1rem", border: "1px dashed #cbd5e1", borderRadius: "14px", color: "#64748b", fontSize: "0.9rem" }}>
              No documents added.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "0.85rem" }}>
              {documents.map((document, index) => (
                <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: "0.75rem", alignItems: "center" }}>
                  <input value={document.name} onChange={(e) => updateDocument(index, "name", e.target.value)} placeholder="Document name" style={inputStyle} />
                  <input value={document.url} onChange={(e) => updateDocument(index, "url", e.target.value)} placeholder="https://..." style={inputStyle} />
                  <button type="button" onClick={() => removeDocument(index)} style={{ padding: "0.85rem 1rem", border: "none", borderRadius: "10px", background: "#fee2e2", color: "#b91c1c", fontWeight: 700, cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: "1.5rem", width: "100%", padding: "1rem", border: "none", borderRadius: "14px", background: loading ? "#94a3b8" : "linear-gradient(135deg, #1d4ed8, #4338ca)", color: "#fff", fontWeight: 800, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}
