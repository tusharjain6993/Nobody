import { useEffect, useMemo, useState } from "react";
import { CheckmarkCircleRegular, ErrorCircleRegular } from "@fluentui/react-icons";
import { useHCMAuth } from "../HCMAuthContext";
import { casesApi } from "../ministerApi";
import { Link } from "react-router-dom";
import { MOC_DEPARTMENTS, MOC_MINISTER_OFFICE_STAFF } from "../../constants/mocWhoIsWho";

const INDIA_LOCATION_MINISTERS = {
  Rajasthan: {
    Jaipur: "Kali Charan Saraf",
    Udaipur: "Phool Singh Meena",
    Jodhpur: "Atul Bhansali",
    Kota: "Sandeep Sharma",
    Ajmer: "Anita Bhadel",
  },
  Maharashtra: {
    Mumbai: "Mangal Prabhat Lodha",
    Pune: "Madhuri Misal",
    Nagpur: "Devendra Fadnavis",
  },
  "Uttar Pradesh": {
    Lucknow: "Yogesh Shukla",
    Kanpur: "Satish Mahana",
    Varanasi: "Neelkanth Tiwari",
  },
  Delhi: {
    "New Delhi": "Parvesh Verma",
    Shahdara: "Jitender Singh Shunty",
    Rohini: "Vijender Gupta",
  },
  Gujarat: {
    Ahmedabad: "Amit Shah (MP)",
    Surat: "Harsh Sanghavi",
    Vadodara: "Balkrishna Shukla",
  },
};

// Full list of Indian states and union territories for the State dropdown
const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function HCMNewCasePage() {
  const { user } = useHCMAuth();
  const [form, setForm] = useState({
    purpose: "",
    category: "",
    referralPerson: "",
    state: "",
    districtCity: "",
    pincode: "",
    localAreaMinister: "",
    details: "",
  });
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [departmentOptions] = useState(MOC_DEPARTMENTS);

  const availableCities = useMemo(() => {
    if (!form.state || !INDIA_LOCATION_MINISTERS[form.state]) return [];
    return Object.keys(INDIA_LOCATION_MINISTERS[form.state]);
  }, [form.state]);

  const validate = () => {
    const e = {};
    if (!form.purpose.trim()) e.purpose = "Purpose / issue is required.";
    // Category is now optional
    if (!form.referralPerson.trim()) e.referralPerson = "Referral person is required.";
    if (!form.state) e.state = "State is required.";
    if (!form.districtCity) e.districtCity = "District / city is required.";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Pincode must be 6 digits.";
    if (!form.localAreaMinister.trim()) e.localAreaMinister = "Local area minister is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePincodeLookup = async () => {
    if (!/^\d{6}$/.test(form.pincode)) {
      setErrors((prev) => ({ ...prev, pincode: "Enter valid 6-digit pincode first." }));
      return;
    }
    try {
      setPinLoading(true);
      const res = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
      const data = await res.json();
      const first = data?.[0]?.PostOffice?.[0];
      if (!first) return;
      const state = first.State;
      const districtCity = first.District || first.Name;
      const minister = INDIA_LOCATION_MINISTERS[state]?.[districtCity] || "";
      setForm((prev) => ({
        ...prev,
        state: state || prev.state,
        districtCity: districtCity || prev.districtCity,
        localAreaMinister: minister || prev.localAreaMinister,
      }));
    } catch {
      // keep manual option
    } finally {
      setPinLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const docList = documents.filter((d) => d.name?.trim() && d.url?.trim());
      const res = await casesApi.create({
        purpose: form.purpose,
        category: form.category,
        referralPerson: form.referralPerson,
        state: form.state,
        districtCity: form.districtCity,
        pincode: form.pincode,
        localAreaMinister: form.localAreaMinister,
        details: form.details || undefined,
        documents: docList.length ? docList : undefined,
      });
      setSuccess(res.case?.caseId || "Submitted");
      setForm({
        purpose: "",
        category: "",
        referralPerson: "",
        state: "",
        districtCity: "",
        pincode: "",
        localAreaMinister: "",
        details: "",
      });
      setDocuments([]);
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || "Failed to submit case" }));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(null);
    setForm({
      purpose: "",
      category: "",
      referralPerson: "",
      state: "",
      districtCity: "",
      pincode: "",
      localAreaMinister: "",
      details: "",
    });
    setDocuments([]);
    setErrors({});
  };

  const addDocument = () => setDocuments((d) => [...d, { name: "", url: "" }]);
  const updateDocument = (i, field, value) =>
    setDocuments((d) => d.map((doc, j) => (j === i ? { ...doc, [field]: value } : doc)));
  const removeDocument = (i) => setDocuments((d) => d.filter((_, j) => j !== i));

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
            <CheckmarkCircleRegular style={{ fontSize: 40, color: "#22c55e" }} />
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
          <Link
            to="/my-cases"
            style={{
              marginTop: "0.8rem",
              display: "block",
              textDecoration: "none",
              color: "#4f46e5",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            Track Your Cases →
          </Link>
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
          <div style={{ marginTop: "0.5rem" }}>
            <Link to="/my-cases" style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
              Track Your Cases →
            </Link>
          </div>
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
                <ErrorCircleRegular style={{ fontSize: 14 }} /> {errors.purpose}
              </p>
            )}
          </div>

          {/* Referral Person */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
                Referral Person *
              </label>
              <select
                value={form.referralPerson}
                onChange={(e) => setForm({ ...form, referralPerson: e.target.value })}
                style={{ ...(errors.referralPerson ? errorInputStyle : inputStyle), cursor: "pointer" }}
              >
                <option value="">Select referral person</option>
                {MOC_MINISTER_OFFICE_STAFF.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} – {p.designation}
                  </option>
                ))}
              </select>
              {errors.referralPerson && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>
                  {errors.referralPerson}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
              Additional details (optional)
            </label>
            <textarea
              rows={3}
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Any extra information, references, or context..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Document links */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
              Document links (optional)
            </label>
            {documents.map((doc, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
                <input
                  placeholder="Document name"
                  value={doc.name}
                  onChange={(e) => updateDocument(i, "name", e.target.value)}
                  style={{ ...inputStyle, flex: "1 1 140px" }}
                />
                <input
                  placeholder="URL"
                  value={doc.url}
                  onChange={(e) => updateDocument(i, "url", e.target.value)}
                  style={{ ...inputStyle, flex: "2 1 200px" }}
                />
                <button type="button" onClick={() => removeDocument(i)} style={{ padding: "0.5rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={addDocument} style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem", color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>+ Add document link</button>
          </div>

          {/* Location */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
                State *
              </label>
              <select
                value={form.state}
                onChange={(e) => {
                  const state = e.target.value;
                  setForm({
                    ...form,
                    state,
                    districtCity: "",
                    localAreaMinister: "",
                  });
                }}
                style={{ ...(errors.state ? errorInputStyle : inputStyle), cursor: "pointer" }}
              >
                <option value="">Select state</option>
                {INDIA_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>{errors.state}</p>}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
                District / City *
              </label>
              <select
                value={form.districtCity}
                onChange={(e) => {
                  const city = e.target.value;
                  setForm({
                    ...form,
                    districtCity: city,
                    localAreaMinister: INDIA_LOCATION_MINISTERS[form.state]?.[city] || form.localAreaMinister,
                  });
                }}
                style={{ ...(errors.districtCity ? errorInputStyle : inputStyle), cursor: "pointer" }}
              >
                <option value="">Select district/city</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.districtCity && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>{errors.districtCity}</p>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.7rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
                Pincode *
              </label>
              <input
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                placeholder="6-digit pincode"
                style={errors.pincode ? errorInputStyle : inputStyle}
              />
              {errors.pincode && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>{errors.pincode}</p>}
            </div>
            <button
              type="button"
              onClick={handlePincodeLookup}
              style={{
                alignSelf: "end",
                height: "42px",
                padding: "0 1rem",
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
                color: "#4f46e5",
                borderRadius: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {pinLoading ? "Fetching..." : "Auto-fill"}
            </button>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
              Local Area Minister *
            </label>
            <input
              value={form.localAreaMinister}
              onChange={(e) => setForm({ ...form, localAreaMinister: e.target.value })}
              placeholder="Auto-filled from selected city/pincode, can edit manually"
              style={errors.localAreaMinister ? errorInputStyle : inputStyle}
            />
            {errors.localAreaMinister && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>{errors.localAreaMinister}</p>
            )}
          </div>

          {errors.submit && <p style={{ color: "#ef4444", marginBottom: "0.8rem", fontSize: "0.88rem" }}>{errors.submit}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "0.85rem",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              border: "none", borderRadius: "12px",
              color: "#fff", fontWeight: "700", fontSize: "1rem", cursor: "pointer",
              boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Submitting..." : "Submit Case →"}
          </button>
        </form>
      </div>
    </div>
  );
}
