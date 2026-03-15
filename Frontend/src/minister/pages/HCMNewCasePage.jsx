import { useEffect, useState } from "react";
import { AttachRegular, CheckmarkCircleRegular, ErrorCircleRegular, PeopleRegular } from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { adminDirectoryApi, citizenApi } from "../ministerApi";
import { filesToDocuments, validateComplaintFiles } from "../../utils/fileHelpers";

function sanitizeSelectedFiles(fileList) {
  return Array.from(fileList || []).filter((file) => file && typeof file.name === "string");
}

function limitDocumentsForDemo(documents = []) {
  return documents.map((doc) => {
    const data = String(doc?.data || "");
    if (data.length <= 220000) return doc;
    return {
      ...doc,
      data: data.slice(0, 220000),
      name: `${doc.name} (trimmed for demo storage)`,
    };
  });
}

function SubmissionModal({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4" style={{ background: "rgba(15, 23, 42, 0.58)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-[30px] border p-6 text-center shadow-2xl" style={{ background: "linear-gradient(180deg, var(--bg-primary), color-mix(in srgb, var(--bg-primary) 82%, var(--accent-primary-subtle) 18%))", borderColor: "var(--border-primary)" }}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", color: "#fff", boxShadow: "var(--shadow-card)" }}>
          <CheckmarkCircleRegular style={{ fontSize: 34 }} />
        </div>
        <div className="portal-page__eyebrow" style={{ justifyContent: "center", marginBottom: "0.7rem" }}>Submission Successful</div>
        <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{message}</p>
        <button type="button" onClick={onClose} className="portal-btn mt-5 w-full">Continue</button>
      </div>
    </div>
  );
}

export default function HCMNewCasePage() {
  const complaintCategories = [
    "Tourism Infrastructure",
    "Heritage & Monuments",
    "Cultural Institutions & Activities",
    "Tourism Services & Visitor Experience",
    "Constituency Civic Issues",
    "Government Schemes & Benefits",
    "Employment & Skill Development",
    "Public Grievances Against Departments",
    "Suggestions / Public Feedback",
  ];
  const [activeTab, setActiveTab] = useState("");
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState("");
  const [successModal, setSuccessModal] = useState({ open: false, title: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ purpose: "", referralAdminUserId: "", files: [], companions: [{ name: "", phone: "" }] });
  const [complaintForm, setComplaintForm] = useState({ title: "", details: "", complaintLocation: "", complaintType: "", files: [] });

  useEffect(() => {
    adminDirectoryApi.list().then((res) => setAdmins(res.admins || [])).catch(() => setAdmins([]));
  }, []);

  const submitMeeting = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessModal({ open: false, title: "", message: "" });
    try {
      const attachmentDocs = limitDocumentsForDemo(await filesToDocuments(meetingForm.files));
      const res = await citizenApi.createMeetingRequest({
        purpose: meetingForm.purpose,
        referralAdminUserId: meetingForm.referralAdminUserId,
        attachments: attachmentDocs,
        companions: meetingForm.companions
          .map((person) => ({ name: String(person.name || "").trim(), phone: String(person.phone || "").replace(/\D/g, "").slice(0, 10) }))
          .filter((person) => person.name || person.phone),
      });
      setSuccessModal({
        open: true,
        title: "Meeting Submitted",
        message: `Your meeting request ${res.meetingRequest.requestId} has been submitted successfully.`,
      });
      setMeetingForm({ purpose: "", referralAdminUserId: "", files: [], companions: [{ name: "", phone: "" }] });
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
    setSuccessModal({ open: false, title: "", message: "" });
    try {
      validateComplaintFiles(complaintForm.files);
      const attachments = limitDocumentsForDemo(await filesToDocuments(complaintForm.files));
      const res = await citizenApi.createComplaint({
        title: complaintForm.title,
        details: complaintForm.details,
        complaintLocation: complaintForm.complaintLocation,
        complaintType: complaintForm.complaintType,
        attachments,
      });
      setSuccessModal({
        open: true,
        title: "Complaint Submitted",
        message: `Your complaint ${res.complaint.complaintId} has been submitted successfully.`,
      });
      setComplaintForm({ title: "", details: "", complaintLocation: "", complaintType: "", files: [] });
    } catch (err) {
      setError(err.message || "Unable to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-page">
      <SubmissionModal
        open={successModal.open}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal((current) => ({ ...current, open: false }))}
      />
      <div className="portal-page__hero">
        <div className="portal-page__eyebrow">Citizen Services</div>
        <h1 className="portal-page__title">Citizen Services</h1>
        <p className="portal-page__desc">
          Choose exactly one service path: request a meeting with an admin desk or submit a complaint into the common complaint pool.
        </p>
      </div>

      {error && <div className="portal-alert portal-alert--error"><ErrorCircleRegular /> <span>{error}</span></div>}

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
          <button type="button" onClick={() => { setActiveTab(""); setError(""); setSuccessModal({ open: false, title: "", message: "" }); }} className="portal-link-btn mb-4">← Back to Services</button>
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
              <label className="portal-card portal-card--soft cursor-pointer flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--accent-primary-subtle)", color: "var(--accent-primary)" }}>
                  <AttachRegular />
                </span>
                <div>
                  <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Upload Supporting Files</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{meetingForm.files.length ? `${meetingForm.files.length} file(s) selected` : "Add PDFs, images, or office documents"}</div>
                </div>
                <input className="hidden" type="file" multiple onChange={(event) => setMeetingForm((current) => ({ ...current, files: sanitizeSelectedFiles(event.target.files) }))} />
              </label>
            </div>
            <div className="portal-field md:col-span-2">
              <label className="portal-field__label flex items-center gap-2"><PeopleRegular /> Additional Attendees</label>
              <div className="space-y-3">
                {meetingForm.companions.map((person, index) => (
                  <div key={`companion-${index}`} className="grid md:grid-cols-[1fr_220px_auto] gap-3 items-start">
                    <input
                      className="portal-input"
                      value={person.name}
                      onChange={(event) => setMeetingForm((current) => ({
                        ...current,
                        companions: current.companions.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: event.target.value } : entry),
                      }))}
                      placeholder="Attendee name"
                    />
                    <input
                      className="portal-input"
                      value={person.phone}
                      onChange={(event) => setMeetingForm((current) => ({
                        ...current,
                        companions: current.companions.map((entry, entryIndex) => entryIndex === index ? { ...entry, phone: event.target.value.replace(/\D/g, "").slice(0, 10) } : entry),
                      }))}
                      placeholder="Phone number"
                    />
                    <button
                      type="button"
                      onClick={() => setMeetingForm((current) => ({
                        ...current,
                        companions: current.companions.length === 1 ? [{ name: "", phone: "" }] : current.companions.filter((_, entryIndex) => entryIndex !== index),
                      }))}
                      className="portal-btn-secondary"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setMeetingForm((current) => ({ ...current, companions: [...current.companions, { name: "", phone: "" }] }))}
                  className="portal-btn-secondary"
                >
                  Add Person
                </button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="portal-btn w-full mt-6">
            {loading ? "Submitting..." : "Submit Meeting Request"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitComplaint} className="portal-card">
          <button type="button" onClick={() => { setActiveTab(""); setError(""); setSuccessModal({ open: false, title: "", message: "" }); }} className="portal-link-btn mb-4">← Back to Services</button>
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
              <label className="portal-field__label">Location</label>
              <input className="portal-input" value={complaintForm.complaintLocation} onChange={(event) => setComplaintForm((current) => ({ ...current, complaintLocation: event.target.value }))} placeholder="Complaint location" />
            </div>
            <div className="portal-field">
              <label className="portal-field__label">Type</label>
              <select className="portal-select" value={complaintForm.complaintType} onChange={(event) => setComplaintForm((current) => ({ ...current, complaintType: event.target.value }))}>
                <option value="">Select complaint category</option>
                {complaintCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
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
