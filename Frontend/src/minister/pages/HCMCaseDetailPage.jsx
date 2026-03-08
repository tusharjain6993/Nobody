import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { casesApi } from "../ministerApi";

function Row({ k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: "0.6rem", padding: "0.45rem 0" }}>
      <span style={{ color: "#64748b", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>{k}</span>
      <span style={{ color: "#0f172a", fontWeight: 500, fontSize: "0.9rem" }}>{v || "-"}</span>
    </div>
  );
}

export default function HCMCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await casesApi.get(id);
        if (mounted) setCaseData(res.case);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load case");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div style={{ padding: "2rem", color: "#64748b" }}>Loading case...</div>;
  if (error) return <div style={{ padding: "2rem", color: "#dc2626" }}>{error}</div>;

  if (!caseData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontFamily: "'Lora', serif" }}>
          <div style={{ fontSize: "3rem" }}>Not found</div>
        <p>Case not found. <button onClick={() => navigate("/cases")} style={{ color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>Go back</button></p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => navigate("/cases")}
          style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: "0.9rem", fontWeight: "700", padding: 0 }}
        >
          ← Back to Cases
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
          {caseData.caseId}
        </h1>
        <p style={{ margin: "0.2rem 0", color: "#334155" }}><strong>Status:</strong> {caseData.status}</p>
        <p style={{ margin: "0.2rem 0", color: "#334155" }}><strong>Purpose:</strong> {caseData.purpose}</p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 0.8rem", color: "#0f172a" }}>Citizen Details</h3>
        <Row k="Name" v={caseData.citizenSnapshot?.name} />
        <Row k="Email" v={caseData.citizenSnapshot?.email} />
        <Row k="Phone" v={caseData.citizenSnapshot?.phone} />
        <Row k="Aadhaar" v={caseData.citizenSnapshot?.aadhaar} />
        <Row k="Gender" v={caseData.citizenSnapshot?.gender} />
        <Row k="Age" v={caseData.citizenSnapshot?.age} />

        <h3 style={{ margin: "1rem 0 0.8rem", color: "#0f172a" }}>Case Details</h3>
        <Row k="Category" v={caseData.category} />
        <Row k="Referral Person" v={caseData.referralPerson} />
        <Row k="State" v={caseData.state} />
        <Row k="District/City" v={caseData.districtCity} />
        <Row k="Pincode" v={caseData.pincode} />
        <Row k="Local Area Minister" v={caseData.localAreaMinister} />
        <Row k="Created" v={new Date(caseData.createdAt).toLocaleString()} />
      </div>
    </div>
  );
}
