import { useEffect, useState } from "react";
import { departmentApi } from "../../minister/ministerApi";

export default function DepartmentDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await departmentApi.overview();
        if (mounted) setRows(res.departments || []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load department data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 0.4rem", color: "#0f172a", fontSize: "1.5rem", fontWeight: 800 }}>
        Department Overview
      </h1>
      <p style={{ margin: "0 0 1rem", color: "#64748b" }}>
        Live case load grouped by state and district/city.
      </p>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "1.5rem", color: "#64748b" }}>Loading department overview...</div>
        ) : error ? (
          <div style={{ padding: "1.5rem", color: "#dc2626" }}>{error}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "1.5rem", color: "#64748b" }}>No department/case data available yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["State", "District/City", "Total Cases", "Submitted Cases"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid #e2e8f0",
                      color: "#64748b",
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.state}-${row.districtCity}-${idx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 1rem", color: "#0f172a", fontWeight: 700 }}>{row.state}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>{row.districtCity}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>{row.totalCases}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>{row.submitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}