import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckmarkCircleRegular, ErrorCircleRegular, PersonRegular, MailRegular } from "@fluentui/react-icons";
import { authApi } from "../ministerApi";
import "./authPages.css";

const GENDERS = [
  { id: "MALE", name: "Male" },
  { id: "FEMALE", name: "Female" },
  { id: "OTHER", name: "Other" },
];

export default function HCMRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=form, 2=otp, 3=success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [otpValue, setOtpValue] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [citizenId, setCitizenId] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "MALE",
    age: "",
    aadhaar: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ""))) e.phone = "Phone must be exactly 10 digits (start with 6–9)";
    if (!form.age || form.age < 18 || form.age > 120) e.age = "Age must be between 18-120";
    const rawAadhaar = form.aadhaar.replace(/\s/g, "");
    if (!rawAadhaar) e.aadhaar = "Aadhaar number is required";
    else if (!/^\d{12}$/.test(rawAadhaar)) e.aadhaar = "Aadhaar must be 12 digits";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    try {
      const data = await authApi.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        age: Number(form.age),
        aadhaar: form.aadhaar.replace(/\s/g, ""),
        password: form.password,
      });
      setRegisteredEmail((data.email || form.email).trim().toLowerCase());
      if (data.devOtp) {
        setOtpValue(data.devOtp);
        // Show OTP in a JS popup for easy copying in demo mode
        alert(`Your one-time password (OTP) is: ${data.devOtp}`);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length < 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.verifyOtp(registeredEmail, otpValue);
      if (res?.citizenUniqueId) {
        setCitizenId(res.citizenUniqueId);
      }
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      await authApi.resendOtp(registeredEmail);
      setError("");
      alert("New OTP sent to your email!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──
  if (step === 3) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--success">
          <div className="auth-logo auth-logo--success">
            <CheckmarkCircleRegular style={{ fontSize: 40, color: "#22c55e" }} />
          </div>
          <h2 className="auth-title" style={{ margin: "0 0 0.5rem" }}>
            Registration Successful!
          </h2>
          {citizenId ? (
            <>
              <p className="auth-subtitle" style={{ margin: "0 0 0.75rem" }}>
                Your account has been verified and created.
              </p>
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  background: "rgba(37,99,235,0.12)",
                  border: "1px solid rgba(37,99,235,0.4)",
                  marginBottom: "1.25rem",
                  fontSize: "0.9rem",
                  color: "#e5efff",
                }}
              >
                <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "0.25rem" }}>
                  Your Citizen ID (use this to log in):
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    fontSize: "1rem",
                  }}
                >
                  {citizenId}
                </div>
              </div>
              <p className="auth-subtitle" style={{ margin: "0 0 1.25rem" }}>
                Please save this ID. On the login screen, choose <strong>Citizen</strong> and enter this ID to access your portal.
              </p>
            </>
          ) : (
            <p className="auth-subtitle" style={{ margin: "0 0 2rem" }}>
              Your account has been verified and created. You can now login with your credentials.
            </p>
          )}
          <button type="button" onClick={() => navigate("/login")} className="auth-btn auth-btn--success">
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  // ── OTP Verification Screen ──
  if (step === 2) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo auth-logo--otp">
              <MailRegular style={{ fontSize: 28, color: "#fff" }} />
            </div>
            <h2 className="auth-title" style={{ fontSize: "1.35rem" }}>
              Verify Your Email
            </h2>
            <p className="auth-subtitle" style={{ fontSize: "0.85rem" }}>
              We sent a 6-digit OTP to <strong style={{ color: "#93c5fd" }}>{registeredEmail}</strong>
            </p>
          </div>

          {error && (
            <div className="auth-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ErrorCircleRegular style={{ fontSize: 16 }} /> {error}
            </div>
          )}

          <form onSubmit={handleVerifyOtp}>
            <div className="auth-field-group" style={{ marginBottom: "1.5rem" }}>
              <label className="auth-label">ENTER OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="auth-input auth-input--otp"
              />
            </div>

            <button type="submit" disabled={loading} className="auth-btn auth-btn--otp">
              {loading ? "Verifying…" : "Verify OTP →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="auth-link"
              style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "0.85rem" }}
            >
              Didn't receive? Resend OTP
            </button>
          </div>

          <div style={{
            marginTop: "1.25rem",
            padding: "0.75rem",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "10px",
            fontSize: "0.78rem",
            color: "#fbbf24",
          }}>
            Check your inbox and spam folder. The OTP is valid for 10 minutes.
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form ──
  const inputClass = (field) =>
    `auth-input ${errors[field] ? "auth-input--error" : ""}`.trim();

  return (
    <div className="auth-page">
      <div className="auth-page__blur1" aria-hidden="true" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)" }} />

      <div className="auth-card auth-card--wide" style={{ maxHeight: "95vh", overflowY: "auto" }}>
        <div className="auth-header" style={{ marginBottom: "1.5rem" }}>
          <div className="auth-logo auth-logo--register">
            <PersonRegular style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <h1 className="auth-title" style={{ fontSize: "1.35rem", margin: "0 0 0.2rem" }}>
            Citizen Registration
          </h1>
          <p className="auth-subtitle" style={{ fontSize: "0.85rem" }}>
            Create your account to access HCM Portal
          </p>
        </div>

        {error && (
          <div className="auth-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ErrorCircleRegular style={{ fontSize: 16 }} /> {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="auth-field-group" style={{ marginBottom: "1rem" }}>
            <label className="auth-label">FULL NAME</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: null }); }}
              placeholder="Enter your full name"
              className={inputClass("name")}
            />
            {errors.name && <p className="auth-error" style={{ marginTop: "0.3rem", padding: "0.25rem 0", fontSize: "0.78rem" }}>{errors.name}</p>}
          </div>

          <div className="auth-field-group" style={{ marginBottom: "1rem" }}>
            <label className="auth-label">EMAIL ADDRESS</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: null }); }}
              placeholder="you@example.com"
              className={inputClass("email")}
            />
            {errors.email && <p className="auth-error" style={{ marginTop: "0.3rem", padding: "0.25rem 0", fontSize: "0.78rem" }}>{errors.email}</p>}
          </div>

          <div className="auth-field-group" style={{ marginBottom: "1rem" }}>
            <label className="auth-label">PHONE NUMBER</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length > 10) v = v.slice(0, 10);
                setForm({ ...form, phone: v });
                setErrors({ ...errors, phone: null });
              }}
              placeholder="9876543210"
              maxLength={10}
              className={inputClass("phone")}
            />
            {errors.phone && <p className="auth-error" style={{ marginTop: "0.3rem", padding: "0.25rem 0", fontSize: "0.78rem" }}>{errors.phone}</p>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label className="auth-label">AGE</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => { setForm({ ...form, age: e.target.value }); setErrors({ ...errors, age: null }); }}
                placeholder="25"
                min={18}
                max={120}
                className={inputClass("age")}
              />
              {errors.age && <p className="auth-error" style={{ marginTop: "0.3rem", padding: "0.25rem 0", fontSize: "0.78rem" }}>{errors.age}</p>}
            </div>
            <div>
              <label className="auth-label">GENDER</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="auth-input"
                style={{ cursor: "pointer" }}
              >
                {GENDERS.map((g) => (
                  <option key={g.id} value={g.id} style={{ color: "#1e293b" }}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="auth-field-group" style={{ marginBottom: "1rem" }}>
            <label className="auth-label">AADHAAR CARD NUMBER</label>
            <input
              type="text"
              value={form.aadhaar}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length > 12) v = v.slice(0, 12);
                const formatted = v.replace(/(\d{4})(?=\d)/g, "$1 ");
                setForm({ ...form, aadhaar: formatted });
                setErrors({ ...errors, aadhaar: null });
              }}
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
              className={inputClass("aadhaar")}
            />
            {errors.aadhaar && <p className="auth-error" style={{ marginTop: "0.3rem", padding: "0.25rem 0", fontSize: "0.78rem" }}>{errors.aadhaar}</p>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div>
              <label className="auth-label">PASSWORD</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: null }); }}
                placeholder="••••••••"
                className={inputClass("password")}
              />
              {errors.password && <p className="auth-error" style={{ marginTop: "0.3rem", padding: "0.25rem 0", fontSize: "0.78rem" }}>{errors.password}</p>}
            </div>
            <div>
              <label className="auth-label">CONFIRM PASSWORD</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: null }); }}
                placeholder="••••••••"
                className={inputClass("confirmPassword")}
              />
              {errors.confirmPassword && <p className="auth-error" style={{ marginTop: "0.3rem", padding: "0.25rem 0", fontSize: "0.78rem" }}>{errors.confirmPassword}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-btn auth-btn--register">
            {loading ? "Registering…" : "Register & Send OTP →"}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: "1.25rem" }}>
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

