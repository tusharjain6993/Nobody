import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { casesApi } from "../ministerApi";

function DetailBlock({ title, children }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1rem" }}>
      <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>{title}</h4>
      {children}
    </div>
  );
}

export default function CitizenMyCasesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

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
      [c.caseId, c.purpose, c.category, c.assignedAdminLabel, c.currentAdminLabel, c.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  const handleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    try {
      const res = await casesApi.get(id);
      setItems((current) => current.map((item) => (item._id === id ? { ...item, ...res.case } : item)));
      setExpandedId(id);
    } catch (err) {
      setError(err.message || "Failed to load case details");
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>Track Your Cases</h1>
          <p style={{ margin: "0.3rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>
            Complaint logs, comments, and meeting updates are visible here.
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
        placeholder="Search by case id, admin referral, complaint title, status..."
        style={{ width: "100%", padding: "0.75rem 0.9rem", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
      />

      {loading && <p style={{ color: "#64748b" }}>Loading your cases...</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "2rem", color: "#64748b", textAlign: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
              No cases found.
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "18px", overflow: "hidden", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
                <div style={{ padding: "1rem 1.2rem", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr auto", gap: "1rem", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#6366f1", fontWeight: 800 }}>{c.caseId}</div>
                    <div style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 800, marginTop: "0.2rem" }}>{c.purpose}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Referred Admin</div>
                    <div style={{ fontSize: "0.9rem", color: "#334155", fontWeight: 600 }}>{c.assignedAdminLabel}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Current Admin</div>
                    <div style={{ fontSize: "0.9rem", color: "#334155", fontWeight: 600 }}>{c.currentAdminLabel}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.82rem", color: "#334155", fontWeight: 700, marginBottom: "0.5rem" }}>{c.status.replace(/_/g, " ")}</div>
                    <button
                      type="button"
                      onClick={() => handleExpand(c._id)}
                      style={{ padding: "0.55rem 0.85rem", borderRadius: "10px", border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", fontWeight: 700, cursor: "pointer" }}
                    >
                      {expandedId === c._id ? "Hide Details" : "View Details"}
                    </button>
                  </div>
                </div>

                {expandedId === c._id && (
                  <div style={{ borderTop: "1px solid #e2e8f0", padding: "1.2rem", display: "grid", gap: "1rem" }}>
                    <DetailBlock title="Case Summary">
                      <div style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>{c.details || "No additional complaint details."}</div>
                      {c.schedule?.scheduledAt && (
                        <div style={{ marginTop: "0.75rem", color: "#475569", fontSize: "0.88rem" }}>
                          Meeting: {new Date(c.schedule.scheduledAt).toLocaleString()} {c.schedule.venue ? `• ${c.schedule.venue}` : ""}
                        </div>
                      )}
                      {c.ministerDecisionNote && (
                        <div style={{ marginTop: "0.75rem", color: "#475569", fontSize: "0.88rem" }}>
                          Minister note: {c.ministerDecisionNote}
                        </div>
                      )}
                    </DetailBlock>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                      <DetailBlock title="Communication Logs">
                        {c.communications?.length ? (
                          c.communications.map((log) => (
                            <div key={log._id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1e293b" }}>{log.type.replace(/_/g, " ")}</div>
                              <div style={{ fontSize: "0.85rem", color: "#334155", marginTop: "0.25rem" }}>{log.summary}</div>
                              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                                {new Date(log.happenedAt || log.createdAt).toLocaleString()} • {log.createdByName}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: "#64748b", fontSize: "0.88rem" }}>No logs added yet.</div>
                        )}
                      </DetailBlock>

                      <DetailBlock title="Admin Comments">
                        {c.comments?.length ? (
                          c.comments.map((comment) => (
                            <div key={comment._id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: "0.88rem", color: "#334155" }}>{comment.comment}</div>
                              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                                {comment.createdByName} • {new Date(comment.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: "#64748b", fontSize: "0.88rem" }}>No comments added yet.</div>
                        )}
                      </DetailBlock>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
