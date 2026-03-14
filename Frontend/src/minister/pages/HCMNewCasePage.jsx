import { useEffect, useState } from "react";
import { CheckmarkCircleRegular, ErrorCircleRegular } from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { adminDirectoryApi, citizenApi } from "../ministerApi";
import { filesToDocuments, validateComplaintFiles } from "../../utils/fileHelpers";

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
    <div className="portal-page">
      <div className="portal-page__hero">
        <div className="portal-page__eyebrow">Citizen Services</div>
        <h1 className="portal-page__title">Citizen Service Router</h1>
        <p className="portal-page__desc">
          Choose exactly one service path: request a meeting with an admin desk or submit a complaint into the common complaint pool.
        </p>
      </div>

      {error && <div className="portal-alert portal-alert--error"><ErrorCircleRegular /> <span>{error}</span></div>}
      {success && <div className="portal-alert portal-alert--success"><CheckmarkCircleRegular /> <span>{success}</span></div>}

      {!activeTab ? (
        <div className="portal-grid portal-grid--2">
          <button type="button" onClick={() => setActiveTab("meeting")} className="portal-card text-left">
            <div className="portal-page__eyebrow" style={{ marginBottom: "0.75rem" }}>Service One</div>
            <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Request Meeting</div>
            <div className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>Purpose, optional document, admin referral, and status tracking.</div>
          </button>
          <button type="button" onClick={() => setActiveTab("complaint")} className="portal-card text-left">
            <div className="portal-page__eyebrow" style={{ marginBottom: "0.75rem" }}>Service Two</div>
            <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Submit Complaint</div>
            <div className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>Documents supported: PDF, image, Excel up to 50 MB each.</div>
          </button>
        </div>
      ) : activeTab === "meeting" ? (
        <form onSubmit={submitMeeting} className="portal-card">
          <button type="button" onClick={() => { setActiveTab(""); setError(""); setSuccess(""); }} className="portal-link-btn mb-4">← Back to Services</button>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Meeting Request</h2>
          <div className="portal-form-grid">
            <div className="portal-field">
              <label className="portal-field__label">Purpose of Meeting</label>
              <input className="portal-input" value={meetingForm.purpose} onChange={(event) => setMeetingForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Explain the purpose of your meeting request" />
            </div>
            <div className="portal-field">
              <label className="portal-field__label">Admin Referral</label>
              <select className="portal-select" value={meetingForm.referralAdminUserId} onChange={(event) => setMeetingForm((current) => ({ ...current, referralAdminUserId: event.target.value }))}>
                <option value="">Select admin desk</option>
                {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name} · {admin.department}</option>)}
              </select>
            </div>
            <div className="portal-field">
              <label className="portal-field__label">Optional Document Upload</label>
              <input className="portal-input" type="file" multiple onChange={(event) => setMeetingForm((current) => ({ ...current, files: sanitizeSelectedFiles(event.target.files) }))} />
              {meetingForm.files.length > 0 && <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>{meetingForm.files.length} file(s) selected</div>}
            </div>
          </div>
          <button type="submit" disabled={loading} className="portal-btn w-full mt-6">
            {loading ? "Submitting..." : "Submit Meeting Request"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitComplaint} className="portal-card">
          <button type="button" onClick={() => { setActiveTab(""); setError(""); setSuccess(""); }} className="portal-link-btn mb-4">← Back to Services</button>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Complaint Submission</h2>
          <div className="portal-form-grid">
            <div className="portal-field">
              <label className="portal-field__label">Complaint Title</label>
              <input className="portal-input" value={complaintForm.title} onChange={(event) => setComplaintForm((current) => ({ ...current, title: event.target.value }))} placeholder="Short complaint title" />
            </div>
            <div className="portal-field">
              <label className="portal-field__label">Complaint Details</label>
              <textarea className="portal-textarea" rows={6} value={complaintForm.details} onChange={(event) => setComplaintForm((current) => ({ ...current, details: event.target.value }))} placeholder="Describe the complaint clearly" />
            </div>
            <div className="portal-field">
              <label className="portal-field__label">Complaint Date</label>
              <input className="portal-input" type="date" value={complaintForm.complaintDate} onChange={(event) => setComplaintForm((current) => ({ ...current, complaintDate: event.target.value }))} />
            </div>
            <div className="portal-field">
              <label className="portal-field__label">Location</label>
              <input className="portal-input" value={complaintForm.complaintLocation} onChange={(event) => setComplaintForm((current) => ({ ...current, complaintLocation: event.target.value }))} placeholder="Complaint location" />
            </div>
            <div className="portal-field">
              <label className="portal-field__label">Type</label>
              <input className="portal-input" value={complaintForm.complaintType} onChange={(event) => setComplaintForm((current) => ({ ...current, complaintType: event.target.value }))} placeholder="Complaint type" />
            </div>
            <div className="portal-field">
              <label className="portal-field__label">Upload Documents</label>
              <input className="portal-input" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx" onChange={(event) => setComplaintForm((current) => ({ ...current, files: sanitizeSelectedFiles(event.target.files) }))} />
              {complaintForm.files.length > 0 && <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>{complaintForm.files.length} file(s) selected</div>}
            </div>
          </div>
          <button type="submit" disabled={loading} className="portal-btn w-full mt-6">
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      )}

      <Link to="/my-cases" className="portal-link-btn">
        Track all meeting requests and complaints →
      </Link>
    </div>
  );
}
