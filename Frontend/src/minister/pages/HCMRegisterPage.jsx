import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckmarkCircleRegular, ErrorCircleRegular, PersonRegular } from "@fluentui/react-icons";
import { authApi } from "../ministerApi";
import { filesToDocuments } from "../../utils/fileHelpers";
import { lookupCitizenPin } from "../../constants/indiaCitizenPinData";
import "./authPages.css";

const EMPTY_FORM = {
  name: "",
  email: "",
  aadhaar: "",
  age: "",
  gender: "",
  phonePrimary: "",
  pinCode: "",
  state: "",
  city: "",
  mpName: "",
  photo: null,
};

export default function HCMRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [citizenId, setCitizenId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Full name is required";
    if (!form.aadhaar || !/^\d{12}$/.test(form.aadhaar)) nextErrors.aadhaar = "Aadhaar must be 12 digits";
    if (!form.age || Number(form.age) < 18 || Number(form.age) > 120) nextErrors.age = "Age must be between 18 and 120";
    if (!form.gender) nextErrors.gender = "Gender is required";
    if (!/^[6-9]\d{9}$/.test(form.phonePrimary)) nextErrors.phonePrimary = "Mobile number must be a valid 10-digit number";
    if (!/^\d{6}$/.test(form.pinCode)) nextErrors.pinCode = "PIN code must be 6 digits";
    if (!form.state || !form.city || !form.mpName) nextErrors.pinCode = "Use a supported Delhi or Rajasthan PIN code";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [photo] = await filesToDocuments(form.photo ? [form.photo] : []);
      const res = await authApi.register({ ...form, photo: photo || null });
      setCitizenId(res.citizenUniqueId);
      alert(`Citizen ID generated: ${res.citizenUniqueId}`);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (citizenId) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--success">
          <div className="auth-logo auth-logo--success">
            <CheckmarkCircleRegular style={{ fontSize: 40, color: "#22c55e" }} />
          </div>
          <h2 className="auth-title" style={{ margin: "0 0 0.5rem" }}>Registration Successful</h2>
          <p className="auth-subtitle" style={{ margin: "0 0 0.75rem" }}>Your Citizen ID has been generated and linked to your Aadhaar and mobile numbers.</p>
          <div style={{ padding: "0.85rem 1rem", borderRadius: "12px", background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.4)", marginBottom: "1.25rem", color: "#e5efff" }}>
            <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "0.25rem" }}>Citizen ID</div>
            <div style={{ fontFamily: "monospace", fontWeight: 800, letterSpacing: "0.08em", fontSize: "1rem" }}>{citizenId}</div>
          </div>
          <button type="button" onClick={() => navigate("/login")} className="auth-btn auth-btn--success">Go to Login →</button>
        </div>
      </div>
    );
  }

  const inputClass = (field) => `auth-input ${errors[field] ? "auth-input--error" : ""}`.trim();
  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setError("");
  };
  const onPhoneChange = (field, value) => setField(field, value.replace(/\D/g, "").slice(0, 10));
  const onPinCodeChange = (value) => {
    const pinCode = value.replace(/\D/g, "").slice(0, 6);
    const pinMeta = lookupCitizenPin(pinCode);
    setForm((current) => ({
      ...current,
      pinCode,
      state: pinMeta?.state || "",
      city: pinMeta?.city || "",
      mpName: pinMeta?.mp || "",
    }));
    setErrors((current) => ({ ...current, pinCode: "" }));
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-page__blur1" aria-hidden="true" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)" }} />
      <div className="auth-card auth-card--wide" style={{ maxHeight: "95vh", overflowY: "auto" }}>
        <div className="auth-header" style={{ marginBottom: "1.5rem" }}>
          <div className="auth-logo auth-logo--register">
            <PersonRegular style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <h1 className="auth-title" style={{ fontSize: "1.35rem", margin: "0 0 0.2rem" }}>Citizen Registration</h1>
          <p className="auth-subtitle" style={{ fontSize: "0.85rem" }}>Aadhaar plus up to three mobile numbers generate your unique Citizen ID.</p>
        </div>

        {error && <div className="auth-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><ErrorCircleRegular style={{ fontSize: 16 }} /> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field-group">
            <label className="auth-label">FULL NAME</label>
            <input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Enter your full name" className={inputClass("name")} />
            {errors.name && <p className="auth-error" style={{ marginTop: "0.4rem", marginBottom: 0, padding: "0.45rem 0.7rem", fontSize: "0.8rem" }}>{errors.name}</p>}
          </div>

          <div className="auth-field-group">
            <label className="auth-label">EMAIL ADDRESS (OPTIONAL)</label>
            <input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="you@example.com" className="auth-input" />
          </div>

          <div className="auth-field-group">
            <label className="auth-label">AADHAAR</label>
            <input value={form.aadhaar} onChange={(event) => setField("aadhaar", event.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12-digit Aadhaar" className={inputClass("aadhaar")} />
            {errors.aadhaar && <p className="auth-error" style={{ marginTop: "0.4rem", marginBottom: 0, padding: "0.45rem 0.7rem", fontSize: "0.8rem" }}>{errors.aadhaar}</p>}
          </div>

          <div className="auth-field-group">
            <label className="auth-label">AGE</label>
            <input value={form.age} onChange={(event) => setField("age", event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="18-120" className={inputClass("age")} />
            {errors.age && <p className="auth-error" style={{ marginTop: "0.4rem", marginBottom: 0, padding: "0.45rem 0.7rem", fontSize: "0.8rem" }}>{errors.age}</p>}
          </div>

          <div className="auth-field-group">
            <label className="auth-label">GENDER</label>
            <select value={form.gender} onChange={(event) => setField("gender", event.target.value)} className={inputClass("gender")}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <p className="auth-error" style={{ marginTop: "0.4rem", marginBottom: 0, padding: "0.45rem 0.7rem", fontSize: "0.8rem" }}>{errors.gender}</p>}
          </div>

          <div className="auth-field-group">
            <label className="auth-label">MOBILE NUMBER</label>
            <input value={form.phonePrimary} onChange={(event) => onPhoneChange("phonePrimary", event.target.value)} placeholder="Required" className={inputClass("phonePrimary")} />
            {errors.phonePrimary && <p className="auth-error" style={{ marginTop: "0.4rem", marginBottom: 0, padding: "0.45rem 0.7rem", fontSize: "0.8rem" }}>{errors.phonePrimary}</p>}
          </div>

          <div className="auth-field-group">
            <label className="auth-label">PIN CODE</label>
            <input value={form.pinCode} onChange={(event) => onPinCodeChange(event.target.value)} placeholder="Delhi or Rajasthan PIN" className={inputClass("pinCode")} />
            {errors.pinCode && <p className="auth-error" style={{ marginTop: "0.4rem", marginBottom: 0, padding: "0.45rem 0.7rem", fontSize: "0.8rem" }}>{errors.pinCode}</p>}
          </div>

          <div className="auth-field-group">
            <label className="auth-label">STATE</label>
            <input value={form.state} readOnly placeholder="Auto-filled from PIN" className="auth-input auth-input--readonly" />
          </div>

          <div className="auth-field-group">
            <label className="auth-label">CITY</label>
            <input value={form.city} readOnly placeholder="Auto-filled from PIN" className="auth-input auth-input--readonly" />
          </div>

          <div className="auth-field-group">
            <label className="auth-label">MP FOR THIS CITY</label>
            <input value={form.mpName} readOnly placeholder="Auto-filled from PIN" className="auth-input auth-input--readonly" />
          </div>

          <div className="auth-field-group auth-field-group--last">
            <label className="auth-label">PHOTO UPLOAD</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setField("photo", event.target.files?.[0] || null)} className="auth-input" />
            {form.photo && <p className="auth-subtitle" style={{ marginTop: "0.5rem" }}>{form.photo.name}</p>}
          </div>

          <button type="submit" disabled={loading} className="auth-btn">{loading ? "Generating…" : "Generate Citizen ID →"}</button>
        </form>

        <div className="auth-footer" style={{ marginTop: "1.25rem" }}>
          Already registered? <Link to="/login" className="auth-link">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
