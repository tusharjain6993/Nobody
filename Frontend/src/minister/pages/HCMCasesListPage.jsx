import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { casesApi } from "../ministerApi";
import { CASE_STATUSES, isStaffRole } from "../../constants/caseStatus";
import { useHCMAuth } from "../HCMAuthContext";
import {
  ArchiveRegular,
  DeleteRegular,
  ArrowUndoRegular,
  CheckmarkRegular,
  DismissRegular,
  FilterRegular,
  FolderRegular,
  FolderOpenRegular,
  DeleteDismissRegular,
  ArrowDownloadRegular,
  DocumentTableRegular,
  DocumentPdfRegular,
} from "@fluentui/react-icons";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_COLORS = {
  SUBMITTED: "bg-blue-50 text-blue-600 border-blue-200",
  IN_REVIEW: "bg-amber-50 text-amber-600 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  REQUEST_CLARIFICATION: "bg-orange-50 text-orange-600 border-orange-200",
  RESOLVED: "bg-teal-50 text-teal-600 border-teal-200",
  RESOLVED_WITHOUT_MEETING: "bg-cyan-50 text-cyan-600 border-cyan-200",
  SCHEDULED: "bg-violet-50 text-violet-600 border-violet-200",
  REOPENED: "bg-amber-50 text-amber-700 border-amber-200",
  ESCALATED: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  CLOSURE_PENDING_MINISTER: "bg-indigo-50 text-indigo-600 border-indigo-200",
  REJECTION_PENDING_MINISTER: "bg-rose-50 text-rose-600 border-rose-200",
  CLOSED: "bg-slate-100 text-slate-500 border-slate-200",
};

function Badge({ label }) {
  const color = STATUS_COLORS[label] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`text-[0.68rem] font-bold py-0.5 px-2 rounded-full border whitespace-nowrap ${color}`}>
      {label?.replace(/_/g, " ")}
    </span>
  );
}

function BulkBar({ count, view, onArchive, onUnarchive, onDelete, onRestore, onClear, loading }) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 mb-3 shadow-3d-md animate-in slide-in-from-top-2 duration-300">
      <CheckmarkRegular style={{ fontSize: 16 }} />
      <span className="text-sm font-bold mr-auto">
        {count} case{count !== 1 ? "s" : ""} selected
      </span>

      {view === "active" && (
        <>
          <button
            onClick={onArchive}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <ArchiveRegular style={{ fontSize: 14 }} /> Archive
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <DeleteRegular style={{ fontSize: 14 }} /> Delete
          </button>
        </>
      )}

      {view === "archived" && (
        <>
          <button
            onClick={onUnarchive}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <ArrowUndoRegular style={{ fontSize: 14 }} /> Restore
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <DeleteRegular style={{ fontSize: 14 }} /> Delete
          </button>
        </>
      )}

      {view === "deleted" && (
        <button
          onClick={onRestore}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
        >
          <ArrowUndoRegular style={{ fontSize: 14 }} /> Restore
        </button>
      )}

      <button
        onClick={onClear}
        className="ml-1 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        title="Clear selection"
      >
        <DismissRegular style={{ fontSize: 14 }} />
      </button>
    </div>
  );
}

const TABS = [
  { key: "active", label: "Active Cases", icon: FolderOpenRegular },
  { key: "archived", label: "Archived", icon: ArchiveRegular },
  { key: "deleted", label: "Deleted", icon: DeleteDismissRegular },
];

function casesToRows(cases) {
  return cases.map((c) => ({
    "Case ID": c.caseId || "",
    "Citizen Name": c.citizenSnapshot?.name || "",
    "Phone": c.citizenSnapshot?.phone || "",
    "Email": c.citizenSnapshot?.email || "",
    "Purpose": c.purpose || "",
    "Category": c.category || "",
    "Referred Admin": c.assignedAdminLabel || "",
    "Current Admin": c.currentAdminLabel || "",
    "Status": (c.status || "").replace(/_/g, " "),
    "Urgency": c.urgency || "",
    "Date": c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
  }));
}

function exportToExcel(cases, viewLabel) {
  const rows = casesToRows(cases);
  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key] || "").length)) + 2,
  }));
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cases");
  XLSX.writeFile(wb, `Cases_${viewLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportToPDF(cases, viewLabel) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Case Report — ${viewLabel}`, 14, 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${cases.length} cases`, 14, 21);

  const headers = ["Case ID", "Citizen", "Purpose", "Category", "Referred Admin", "Current Admin", "Status", "Urgency", "Date"];
  const body = cases.map((c) => [
    c.caseId || "",
    c.citizenSnapshot?.name || "",
    (c.purpose || "").slice(0, 40),
    c.category || "",
    c.assignedAdminLabel || "",
    c.currentAdminLabel || "",
    (c.status || "").replace(/_/g, " "),
    c.urgency || "",
    c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
  ]);

  autoTable(doc, {
    startY: 25,
    head: [headers],
    body,
    styles: { fontSize: 7, cellPadding: 2, font: "helvetica" },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`Cases_${viewLabel}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function ExportDropdown({ cases, viewLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const disabled = !cases || cases.length === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-[#f1155c] bg-[#f1155c] text-white btn-3d hover:bg-[#d81252]"
      >
        <ArrowDownloadRegular style={{ fontSize: 14 }} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600/60 rounded-lg shadow-3d-lg z-30 w-44 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <button
            onClick={() => { exportToExcel(cases, viewLabel); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-left"
          >
            <DocumentTableRegular style={{ fontSize: 16 }} className="text-emerald-600" />
            Download Excel
          </button>
          <button
            onClick={() => { exportToPDF(cases, viewLabel); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-left"
          >
            <DocumentPdfRegular style={{ fontSize: 16 }} className="text-red-500" />
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default function HCMCasesListPage({ defaultView = "active" }) {
  const navigate = useNavigate();
  const { user } = useHCMAuth();
  const isStaff = user?.role && isStaffRole(user.role);
  const showNewCaseButton = !isStaff;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [view, setView] = useState(defaultView);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadCases = useCallback(async (currentView) => {
    try {
      setLoading(true);
      setError("");
      const viewParam = currentView === "active" ? undefined : currentView;
      const res = await casesApi.list(viewParam ? { view: viewParam } : {});
      setItems(res.cases || []);
    } catch (err) {
      setError(err.message || "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  useEffect(() => {
    setSelected(new Set());
    loadCases(view);
  }, [view, loadCases]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.caseId?.toLowerCase().includes(q) ||
        (c.citizenSnapshot?.name || "").toLowerCase().includes(q) ||
        c.purpose?.toLowerCase().includes(q) ||
        (c.citizenSnapshot?.phone || "").includes(q) ||
        (c.citizenSnapshot?.email || "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchUrgency = !urgencyFilter || c.urgency === urgencyFilter;
      return matchSearch && matchStatus && matchUrgency;
    });
  }, [items, search, statusFilter, urgencyFilter]);

  const allFilteredIds = useMemo(() => new Set(filtered.map((c) => c._id)), [filtered]);
  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c._id));

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of allFilteredIds) next.delete(id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of allFilteredIds) next.add(id);
        return next;
      });
    }
  }

  async function bulkAction(action) {
    if (selected.size === 0) return;
    const ids = [...selected];
    setBulkLoading(true);
    try {
      if (action === "archive") await casesApi.bulkArchive(ids);
      else if (action === "unarchive") await casesApi.bulkUnarchive(ids);
      else if (action === "delete") await casesApi.bulkDelete(ids);
      else if (action === "restore") await casesApi.bulkRestore(ids);
      setSelected(new Set());
      await loadCases(view);
    } catch (err) {
      setError(err.message || `Failed to ${action} cases`);
    } finally {
      setBulkLoading(false);
    }
  }

  function switchView(v) {
    setView(v);
    setSearch("");
    setStatusFilter("");
    setUrgencyFilter("");
    if (v === "active") navigate("/cases");
    else navigate(`/cases/${v}`);
  }

  return (
    <div className="p-5 max-w-[1360px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 m-0">
            Case Management
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs dark:text-slate-400">
            {filtered.length} case{filtered.length !== 1 ? "s" : ""}
            {view !== "active" && ` (${view})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            cases={filtered}
            viewLabel={view === "active" ? "Active" : view === "archived" ? "Archived" : "Deleted"}
          />
          {showNewCaseButton && (
            <button
              type="button"
              onClick={() => navigate("/new-case")}
              className="flex items-center gap-1.5 py-2 px-4 bg-gradient-to-br from-blue-500 to-indigo-500 border-0 rounded-lg text-white font-bold text-xs cursor-pointer btn-3d"
            >
              + New Case
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {isStaff && (
        <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit inset-3d">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => switchView(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-3d-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Icon style={{ fontSize: 14 }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selected.size > 0 && isStaff && (
        <BulkBar
          count={selected.size}
          view={view}
          loading={bulkLoading}
          onArchive={() => bulkAction("archive")}
          onUnarchive={() => bulkAction("unarchive")}
          onDelete={() => bulkAction("delete")}
          onRestore={() => bulkAction("restore")}
          onClear={() => setSelected(new Set())}
        />
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4 bg-white dark:bg-slate-800 rounded-xl py-2.5 px-3 shadow-3d border border-slate-200/60 dark:border-slate-600/60">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          <FilterRegular style={{ fontSize: 14 }} />
        </div>
        <input
          type="text"
          placeholder="Search name, email, phone, case ID, purpose..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-[1_1_200px] py-1.5 px-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg outline-none text-slate-700 dark:text-slate-300 dark:bg-slate-800"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-1.5 px-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="py-1.5 px-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="">All Urgency</option>
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        {(search || statusFilter || urgencyFilter) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setStatusFilter(""); setUrgencyFilter(""); }}
            className="py-1.5 px-2.5 text-[0.68rem] border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 cursor-pointer font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-3d border border-slate-200/60 dark:border-slate-600/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading cases...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-red-600 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FolderRegular style={{ fontSize: 36 }} className="mx-auto mb-2 text-slate-300" />
            <div className="text-sm font-semibold">
              {view === "archived" ? "No archived cases" : view === "deleted" ? "No deleted cases" : "No cases found"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr>
                  {isStaff && (
                    <th className="w-10 py-2.5 px-3 border-b border-slate-200 dark:border-slate-600">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                      />
                    </th>
                  )}
                  {["Case ID", "Citizen", "Purpose", "Category", "Referred Admin", "Current Admin", "Status", "Date", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 text-slate-400 dark:text-slate-500 font-semibold text-[0.65rem] uppercase tracking-wider border-b border-slate-200 dark:border-slate-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isChecked = selected.has(c._id);
                  return (
                    <tr
                      key={c._id}
                      className={`border-b border-slate-100 dark:border-slate-700 transition-colors ${
                        isChecked
                          ? "bg-indigo-50/50 dark:bg-indigo-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      {isStaff && (
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(c._id)}
                            className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-indigo-500 dark:text-indigo-400 text-[0.75rem]">
                          {c.caseId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {c.citizenSnapshot?.name}
                        </div>
                        <div className="text-[0.65rem] text-slate-400 dark:text-slate-500">
                          {c.citizenSnapshot?.phone}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                        {c.purpose}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{c.category}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{c.assignedAdminLabel}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{c.currentAdminLabel}</td>
                      <td className="py-2.5 px-3">
                        <Badge label={c.status} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 text-[0.65rem]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/cases/${c._id}`)}
                          className="py-1 px-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 dark:border-indigo-400/40 rounded-md text-indigo-500 dark:text-indigo-400 text-[0.68rem] font-bold cursor-pointer hover:bg-indigo-500/20 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
