import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { casesApi } from "../ministerApi";

export default function CitizenMyCasesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadCases() {
      try {
        setLoading(true);
        const res = await casesApi.list();
        if (mounted) setItems(res.cases || []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load your cases");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCases();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      [c.caseId, c.purpose, c.category, c.state, c.districtCity]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>Track Your Cases</h1>
          <p style={{ margin: "0.3rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>
            You can only view cases submitted by your account.
          </p>
        </div>
        <Link
          to="/new-case"
          style={{
            textDecoration: "none",
            padding: "0.6rem 1rem",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.86rem",
          }}
        >
          + Add Case
        </Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by case id, purpose, category, city..."
        style={{
          width: "100%",
          padding: "0.75rem 0.9rem",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          marginBottom: "1rem",
          fontSize: "0.9rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {loading && <p style={{ color: "#64748b" }}>Loading your cases...</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "2rem", color: "#64748b", textAlign: "center" }}>No cases found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  {["Case ID", "Purpose", "Category", "State", "City", "Status", "Created"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "0.75rem 0.9rem",
                        fontSize: "0.76rem",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem 0.9rem", fontWeight: 700, color: "#4f46e5" }}>{c.caseId}</td>
                    <td style={{ padding: "0.75rem 0.9rem", color: "#1e293b" }}>{c.purpose}</td>
                    <td style={{ padding: "0.75rem 0.9rem", color: "#334155" }}>{c.category}</td>
                    <td style={{ padding: "0.75rem 0.9rem", color: "#334155" }}>{c.state}</td>
                    <td style={{ padding: "0.75rem 0.9rem", color: "#334155" }}>{c.districtCity}</td>
                    <td style={{ padding: "0.75rem 0.9rem", color: "#334155" }}>{c.status}</td>
                    <td style={{ padding: "0.75rem 0.9rem", color: "#64748b" }}>{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
