import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, User, Mail, Phone, FileText } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ""))) e.phone = "Enter a valid 10-digit number";
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
      const res = await fetch(`${API}/api/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          gender: form.gender,
          age: Number(form.age),
          aadhaar: form.aadhaar.replace(/\s/g, ""),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setRegisteredEmail((data.email || form.email).trim().toLowerCase());
      if (data.devOtp) setOtpValue(data.devOtp);
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
      const res = await fetch(`${API}/api/v1/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
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
      const res = await fetch(`${API}/api/v1/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Resend failed");
      setError("");
      alert("New OTP sent to your email!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: "100%", padding: "0.75rem 1rem",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px", color: "#f1f5f9",
    fontSize: "0.9rem", outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const errorFieldStyle = {
    ...fieldStyle,
    borderColor: "rgba(239,68,68,0.5)",
    background: "rgba(239,68,68,0.05)",
  };

  const labelStyle = {
    display: "block", fontSize: "0.75rem", fontWeight: "600",
    color: "#cbd5e1", marginBottom: "0.4rem", letterSpacing: "0.05em",
  };

  // ── Success Screen ──
  if (step === 3) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2744 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "1rem",
      }}>
        <div style={{
          width: "100%", maxWidth: "440px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "20px", padding: "2.5rem",
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
          textAlign: "center",
        }}>
          <div style={{
            width: "80px", height: "80px",
            background: "rgba(34,197,94,0.15)",
            borderRadius: "50%",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1.5rem",
          }}>
            <CheckCircle size={40} color="#22c55e" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#f1f5f9", margin: "0 0 0.5rem" }}>
            Registration Successful!
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 2rem" }}>
            Your account has been verified and created. You can now login with your credentials.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              width: "100%", padding: "0.85rem",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              border: "none", borderRadius: "10px",
              color: "#fff", fontWeight: "700", fontSize: "1rem",
              cursor: "pointer", boxShadow: "0 4px 15px rgba(34,197,94,0.4)",
            }}
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  // ── OTP Verification Screen ──
  if (step === 2) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2744 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "1rem",
      }}>
        <div style={{
          width: "100%", maxWidth: "420px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "20px", padding: "2.5rem",
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              width: "60px", height: "60px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: "16px",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: "1rem",
              boxShadow: "0 8px 20px rgba(245,158,11,0.4)",
            }}>
              <Mail size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#f1f5f9", margin: "0 0 0.25rem" }}>
              Verify Your Email
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
              We sent a 6-digit OTP to <strong style={{ color: "#93c5fd" }}>{registeredEmail}</strong>
            </p>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5", borderRadius: "8px", padding: "0.75rem 1rem",
              fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle}>ENTER OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                style={{
                  ...fieldStyle,
                  textAlign: "center",
                  fontSize: "1.75rem",
                  fontWeight: "700",
                  letterSpacing: "0.75rem",
                  paddingLeft: "1.5rem",
                }}
                onFocus={(e) => e.target.style.borderColor = "#f59e0b"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "0.85rem",
                background: loading ? "rgba(245,158,11,0.5)" : "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none", borderRadius: "10px",
                color: "#fff", fontWeight: "700", fontSize: "1rem",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(245,158,11,0.4)",
              }}
            >
              {loading ? "Verifying…" : "Verify OTP →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <button
              onClick={handleResendOtp}
              disabled={loading}
              style={{
                background: "none", border: "none",
                color: "#93c5fd", fontSize: "0.85rem",
                cursor: "pointer", textDecoration: "underline",
              }}
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
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2744 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "1rem",
    }}>
      <div style={{
        position: "fixed", top: "-10%", right: "-10%",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: "500px",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px", padding: "2rem 2.5rem",
        boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        maxHeight: "95vh", overflowY: "auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: "60px", height: "60px",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            borderRadius: "16px",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "0.75rem",
            boxShadow: "0 8px 20px rgba(34,197,94,0.4)",
          }}>
            <User size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#f1f5f9", margin: "0 0 0.2rem" }}>
            Citizen Registration
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
            Create your account to access HCM Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5", borderRadius: "8px", padding: "0.75rem 1rem",
            fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Name */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>FULL NAME</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: null }); }}
              placeholder="Enter your full name"
              style={errors.name ? errorFieldStyle : fieldStyle}
            />
            {errors.name && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.3rem 0 0" }}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: null }); }}
              placeholder="you@example.com"
              style={errors.email ? errorFieldStyle : fieldStyle}
            />
            {errors.email && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.3rem 0 0" }}>{errors.email}</p>}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>PHONE NUMBER</label>
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
              style={errors.phone ? errorFieldStyle : fieldStyle}
            />
            {errors.phone && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.3rem 0 0" }}>{errors.phone}</p>}
          </div>

          {/* Age & Gender Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label style={labelStyle}>AGE</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => { setForm({ ...form, age: e.target.value }); setErrors({ ...errors, age: null }); }}
                placeholder="25"
                min={18} max={120}
                style={errors.age ? errorFieldStyle : fieldStyle}
              />
              {errors.age && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.3rem 0 0" }}>{errors.age}</p>}
            </div>
            <div>
              <label style={labelStyle}>GENDER</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                style={{ ...fieldStyle, cursor: "pointer" }}
              >
                {GENDERS.map((g) => (
                  <option key={g.id} value={g.id} style={{ color: "#1e293b" }}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Aadhaar */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>AADHAAR CARD NUMBER</label>
            <input
              type="text"
              value={form.aadhaar}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length > 12) v = v.slice(0, 12);
                let formatted = v.replace(/(\d{4})(?=\d)/g, "$1 ");
                setForm({ ...form, aadhaar: formatted });
                setErrors({ ...errors, aadhaar: null });
              }}
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
              style={errors.aadhaar ? errorFieldStyle : fieldStyle}
            />
            {errors.aadhaar && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.3rem 0 0" }}>{errors.aadhaar}</p>}
          </div>

          {/* Password */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={labelStyle}>PASSWORD</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: null }); }}
                placeholder="••••••••"
                style={errors.password ? errorFieldStyle : fieldStyle}
              />
              {errors.password && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.3rem 0 0" }}>{errors.password}</p>}
            </div>
            <div>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: null }); }}
                placeholder="••••••••"
                style={errors.confirmPassword ? errorFieldStyle : fieldStyle}
              />
              {errors.confirmPassword && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.3rem 0 0" }}>{errors.confirmPassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "0.85rem",
              background: loading ? "rgba(34,197,94,0.5)" : "linear-gradient(135deg, #22c55e, #16a34a)",
              border: "none", borderRadius: "10px",
              color: "#fff", fontWeight: "700", fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(34,197,94,0.4)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Registering…" : "Register & Send OTP →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "#94a3b8" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#93c5fd", fontWeight: "600", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

