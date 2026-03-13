import { useEffect, useState } from "react";
import { CheckmarkCircleRegular, ErrorCircleRegular } from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { adminDirectoryApi, citizenApi } from "../ministerApi";
import { filesToDocuments, validateComplaintFiles } from "../../utils/fileHelpers";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "2rem",
  boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
};

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

function sanitizeSelectedFiles(fileList) {
  return Array.from(fileList || []).filter((file) => file && typeof file.name === "string");
}

export default function HCMNewCasePage() {
  const [activeTab, setActiveTab] = useState("");
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ purpose: "", referralAdminUserId: "", files: [] });
  const [complaintForm, setComplaintForm] = useState({ title: "", details: "", complaintDate: "", complaintLocation: "", complaintType: "", files: [] });

  useEffect(() => {
    adminDirectoryApi.list().then((res) => setAdmins(res.admins || [])).catch(() => setAdmins([]));
  }, []);

  const submitMeeting = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const attachmentDocs = await filesToDocuments(meetingForm.files);
      const res = await citizenApi.createMeetingRequest({
        purpose: meetingForm.purpose,
        referralAdminUserId: meetingForm.referralAdminUserId,
        attachments: attachmentDocs,
      });
      setSuccess(`Meeting request ${res.meetingRequest.requestId} submitted`);
      setMeetingForm({ purpose: "", referralAdminUserId: "", files: [] });
    } catch (err) {
      setError(err.message || "Unable to submit meeting request");
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      validateComplaintFiles(complaintForm.files);
      const attachments = await filesToDocuments(complaintForm.files);
      const res = await citizenApi.createComplaint({
        title: complaintForm.title,
        details: complaintForm.details,
        complaintDate: complaintForm.complaintDate,
        complaintLocation: complaintForm.complaintLocation,
        complaintType: complaintForm.complaintType,
        attachments,
      });
      setSuccess(`Complaint ${res.complaint.complaintId} submitted`);
      setComplaintForm({ title: "", details: "", complaintDate: "", complaintLocation: "", complaintType: "", files: [] });
    } catch (err) {
      setError(err.message || "Unable to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1080px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #eff6ff, #eef2ff)", border: "1px solid #dbeafe", borderRadius: "24px", padding: "2rem", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#0f172a" }}>Citizen Service Router</h1>
        <p style={{ margin: "0.7rem 0 0", color: "#475569", fontSize: "0.98rem", lineHeight: 1.6 }}>
          Choose exactly one service path: request a meeting with an admin desk or submit a complaint into the common complaint pool.
        </p>
      </div>

      {error && <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "12px", padding: "0.85rem 1rem" }}><ErrorCircleRegular style={{ fontSize: 18 }} /> <span>{error}</span></div>}
      {success && <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "12px", padding: "0.85rem 1rem" }}><CheckmarkCircleRegular style={{ fontSize: 18 }} /> <span>{success}</span></div>}

      {!activeTab ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <button type="button" onClick={() => setActiveTab("meeting")} style={{ ...cardStyle, padding: "1.2rem", cursor: "pointer" }}>
            <div style={{ fontWeight: 900, color: "#0f172a", fontSize: "1.05rem" }}>Request Meeting</div>
            <div style={{ color: "#64748b", marginTop: "0.35rem", fontSize: "0.9rem" }}>Purpose, optional document, admin referral, and status tracking.</div>
          </button>
          <button type="button" onClick={() => setActiveTab("complaint")} style={{ ...cardStyle, padding: "1.2rem", cursor: "pointer" }}>
            <div style={{ fontWeight: 900, color: "#0f172a", fontSize: "1.05rem" }}>Submit Complaint</div>
            <div style={{ color: "#64748b", marginTop: "0.35rem", fontSize: "0.9rem" }}>Documents supported: PDF, image, Excel up to 50 MB each.</div>
          </button>
        </div>
      ) : activeTab === "meeting" ? (
        <form onSubmit={submitMeeting} style={cardStyle}>
          <button type="button" onClick={() => { setActiveTab(""); setError(""); setSuccess(""); }} style={{ marginBottom: "1rem", background: "transparent", border: "none", padding: 0, color: "#4f46e5", fontWeight: 700, cursor: "pointer" }}>← Back to Services</button>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Meeting Request</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Purpose of Meeting</label>
              <input value={meetingForm.purpose} onChange={(event) => setMeetingForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Explain the purpose of your meeting request" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Admin Referral</label>
              <select value={meetingForm.referralAdminUserId} onChange={(event) => setMeetingForm((current) => ({ ...current, referralAdminUserId: event.target.value }))} style={inputStyle}>
                <option value="">Select admin desk</option>
                {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name} · {admin.department}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Optional Document Upload</label>
              <input type="file" multiple onChange={(event) => setMeetingForm((current) => ({ ...current, files: sanitizeSelectedFiles(event.target.files) }))} style={inputStyle} />
              {meetingForm.files.length > 0 && <div style={{ marginTop: "0.45rem", color: "#64748b", fontSize: "0.82rem" }}>{meetingForm.files.length} file(s) selected</div>}
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: "1.5rem", width: "100%", padding: "1rem", border: "none", borderRadius: "14px", background: loading ? "#94a3b8" : "linear-gradient(135deg, #1d4ed8, #4338ca)", color: "#fff", fontWeight: 800, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Submitting..." : "Submit Meeting Request"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitComplaint} style={cardStyle}>
          <button type="button" onClick={() => { setActiveTab(""); setError(""); setSuccess(""); }} style={{ marginBottom: "1rem", background: "transparent", border: "none", padding: 0, color: "#4f46e5", fontWeight: 700, cursor: "pointer" }}>← Back to Services</button>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Complaint Submission</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Complaint Title</label>
              <input value={complaintForm.title} onChange={(event) => setComplaintForm((current) => ({ ...current, title: event.target.value }))} placeholder="Short complaint title" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Complaint Details</label>
              <textarea rows={6} value={complaintForm.details} onChange={(event) => setComplaintForm((current) => ({ ...current, details: event.target.value }))} placeholder="Describe the complaint clearly" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Complaint Date</label>
              <input type="date" value={complaintForm.complaintDate} onChange={(event) => setComplaintForm((current) => ({ ...current, complaintDate: event.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Location</label>
              <input value={complaintForm.complaintLocation} onChange={(event) => setComplaintForm((current) => ({ ...current, complaintLocation: event.target.value }))} placeholder="Complaint location" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Type</label>
              <input value={complaintForm.complaintType} onChange={(event) => setComplaintForm((current) => ({ ...current, complaintType: event.target.value }))} placeholder="Complaint type" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>Upload Documents</label>
              <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx" onChange={(event) => setComplaintForm((current) => ({ ...current, files: sanitizeSelectedFiles(event.target.files) }))} style={inputStyle} />
              {complaintForm.files.length > 0 && <div style={{ marginTop: "0.45rem", color: "#64748b", fontSize: "0.82rem" }}>{complaintForm.files.length} file(s) selected</div>}
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: "1.5rem", width: "100%", padding: "1rem", border: "none", borderRadius: "14px", background: loading ? "#94a3b8" : "linear-gradient(135deg, #1d4ed8, #4338ca)", color: "#fff", fontWeight: 800, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      )}

      <Link to="/my-cases" style={{ marginTop: "1rem", display: "inline-block", textDecoration: "none", color: "#4f46e5", fontWeight: 700, fontSize: "0.9rem" }}>
        Track all meeting requests and complaints →
      </Link>
    </div>
  );
}
