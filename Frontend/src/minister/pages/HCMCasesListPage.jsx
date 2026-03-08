import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MOCK_CASES, STATUS_COLORS, PRIORITY_COLORS,
  CASE_STATUSES, REQUEST_CATEGORIES, PRIORITIES,
  formatDate, getCategoryLabel, getStatusLabel,
} from "../../minister/ministerData";

function Badge({ label, colorStyle }) {
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: "700",
      padding: "0.2rem 0.6rem", borderRadius: "999px",
      background: colorStyle?.bg || "#f1f5f9",
      color: colorStyle?.text || "#475569",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

export default function HCMCasesListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = useMemo(() => {
    return MOCK_CASES.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.caseId.toLowerCase().includes(q) ||
        c.citizen.name.toLowerCase().includes(q) ||
        c.purpose.toLowerCase().includes(q) ||
        (c.citizen.phone || "").includes(q);
      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchPriority = !priorityFilter || c.priority === priorityFilter;
      const matchCategory = !categoryFilter || c.category === categoryFilter;
      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  const selectStyle = {
    padding: "0.5rem 0.75rem", fontSize: "0.85rem",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    background: "#fff", color: "#334155", outline: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1300px", margin: "0 auto", fontFamily: "'Lora', serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>📂 Cases</h1>
          <p style={{ color: "#64748b", margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
            {filtered.length} case{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={() => navigate("/new-case")}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.6rem 1.25rem",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            border: "none", borderRadius: "10px",
            color: "#fff", fontWeight: "700", fontSize: "0.875rem",
            cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
          }}
        >
          ➕ New Case
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: "0.75rem", flexWrap: "wrap",
        marginBottom: "1.25rem",
        background: "#fff", borderRadius: "12px",
        padding: "0.875rem 1rem",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
      }}>
        <input
          type="text"
          placeholder="🔍  Search by name, case ID, purpose…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 220px", padding: "0.5rem 0.75rem",
            fontSize: "0.85rem", border: "1px solid #e2e8f0",
            borderRadius: "8px", outline: "none", color: "#334155",
          }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All Statuses</option>
          {CASE_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selectStyle}>
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="">All Categories</option>
          {REQUEST_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || statusFilter || priorityFilter || categoryFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); setCategoryFilter(""); }}
            style={{
              padding: "0.5rem 0.75rem", fontSize: "0.8rem",
              border: "1px solid #fca5a5", borderRadius: "8px",
              background: "#fff5f5", color: "#ef4444", cursor: "pointer",
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0", overflow: "hidden",
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "2.5rem" }}>🗂️</div>
            <div style={{ marginTop: "0.5rem", fontWeight: "600" }}>No cases found</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["Case ID", "Citizen", "Purpose", "Category", "Priority", "Status", "Date", ""].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "0.75rem 1rem",
                    color: "#94a3b8", fontWeight: "600",
                    fontSize: "0.75rem", textTransform: "uppercase",
                    borderBottom: "2px solid #e2e8f0",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const st = STATUS_COLORS[c.status] || {};
                const pr = PRIORITY_COLORS[c.priority] || {};
                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span style={{ fontWeight: "800", color: "#6366f1", fontSize: "0.82rem" }}>{c.caseId}</span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{c.citizen.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{c.citizen.phone}</div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#475569", maxWidth: "200px" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.purpose}
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {getCategoryLabel(c.category)}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <Badge label={c.priority} colorStyle={pr} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <Badge label={getStatusLabel(c.status)} colorStyle={st} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.8rem" }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <button
                        onClick={() => navigate(`/cases/${c.id}`)}
                        style={{
                          padding: "0.35rem 0.8rem",
                          background: "rgba(99,102,241,0.08)",
                          border: "1px solid rgba(99,102,241,0.25)",
                          borderRadius: "8px", color: "#6366f1",
                          fontSize: "0.78rem", fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
