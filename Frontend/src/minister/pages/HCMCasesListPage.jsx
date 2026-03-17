// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { workItemsApi } from "../ministerApi";

// function isComplaintQueueItem(item) {
//   return !item.assignedAdminUserId && !["resolved", "completed"].includes(item.status);
// }

// function isMeetingQueueItem(item) {
//   return ["submitted", "verification_needed", "under_review", "approved"].includes(item.status);
// }

// function isMyComplaint(item, myAdminId) {
//   return Number(item.assignedAdminUserId || 0) === Number(myAdminId || 0) && !["resolved", "completed"].includes(item.status);
// }

// function isMyMeeting(item, myAdminId) {
//   const ownedByMe = Number(item.assignedAdminUserId || item.referralAdminUserId || 0) === Number(myAdminId || 0);
//   return ownedByMe && !["rejected"].includes(item.status) && !["completed", "cancelled"].includes(item.executionStatus || "pending");
// }

// function isResolvedItem(item) {
//   if (item.complaintId) return ["resolved", "completed"].includes(item.status);
//   return item.status === "rejected" || ["completed", "cancelled"].includes(item.executionStatus || "pending");
// }

// function getQueueBuckets(data) {
//   return {
//     complaints: data.complaints.filter(isComplaintQueueItem),
//     meetings: data.meetingRequests.filter(isMeetingQueueItem),
//     myCases: [
//       ...data.complaints.filter((item) => isMyComplaint(item, data.myAdminId)),
//       ...data.meetingRequests.filter((item) => isMyMeeting(item, data.myAdminId)),
//     ],
//     completedCases: [...data.complaints, ...data.meetingRequests].filter(isResolvedItem),
//   };
// }

// export default function HCMCasesListPage() {
//   const navigate = useNavigate();
//   const [data, setData] = useState({ meetingRequests: [], complaints: [], myAdminId: null });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [tab, setTab] = useState("complaints");
//   const [filters, setFilters] = useState({
//     q: "",
//     status: "all",
//     caseId: "",
//     citizenId: "",
//   });

//   useEffect(() => {
//     let mounted = true;
//     workItemsApi.list()
//       .then((res) => { if (mounted) setData(res); })
//       .catch((err) => { if (mounted) setError(err.message || "Failed to load work queue"); })
//       .finally(() => { if (mounted) setLoading(false); });
//     return () => { mounted = false; };
//   }, []);

//   const queues = useMemo(() => getQueueBuckets(data), [data]);
//   const baseRows = queues[tab] || [];

//   const rows = useMemo(() => {
//     return baseRows.filter((item) => {
//       const q = filters.q.trim().toLowerCase();
//       const idValue = item.complaintId || item.requestId || "";
//       const citizenId = item.citizenSnapshot?.citizenId || "";
//       const statusOk = filters.status === "all" || item.status === filters.status;
//       const caseIdOk = !filters.caseId.trim() || idValue.toLowerCase().includes(filters.caseId.trim().toLowerCase());
//       const citizenOk = !filters.citizenId.trim() || citizenId.toLowerCase().includes(filters.citizenId.trim().toLowerCase());
//       const textOk = !q || [
//         item.title,
//         item.purpose,
//         item.citizenSnapshot?.name,
//         item.citizenSnapshot?.phoneNumbers?.join(" "),
//         item.citizenSnapshot?.citizenId,
//         item.currentOwner,
//         item.status,
//         item.statusLabel,
//         item.complaintId,
//         item.requestId,
//         item.priority,
//         item.department,
//         item.assignedAdminName,
//         item.referralAdminName,
//         item.scheduleDate,
//         item.scheduleTime,
//         item.scheduleLocation,
//         item.relatedComplaint?.complaintId,
//         item.relatedMeeting?.requestId,
//       ].filter(Boolean).join(" ").toLowerCase().includes(q);
//       return statusOk && caseIdOk && citizenOk && textOk;
//     });
//   }, [baseRows, filters]);

//   const statusOptions = useMemo(() => {
//     return Array.from(new Set(baseRows.map((item) => item.status))).sort();
//   }, [baseRows]);

//   const tabCounts = useMemo(() => ({
//     complaints: queues.complaints.length,
//     meetings: queues.meetings.length,
//     myCases: queues.myCases.length,
//     completedCases: queues.completedCases.length,
//   }), [queues]);

//   return (
//     <div className="portal-page">
//       {/* <div className="portal-toolbar">
//         <div>
//           <div className="portal-page__eyebrow">Admin Console</div>
//           <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Admin Work Queue</h1>
//           <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
//             Structured retrieval is enabled here. Filter by workflow status, citizen ID, request/complaint ID, and free text without leaving the queue.
//           </p>
//         </div>
//       </div> */}

//       <div className="portal-tabs">
//         {[
//           ["complaints", `Complaint Queue (${tabCounts.complaints})`],
//           ["meetings", `Meeting Queue (${tabCounts.meetings})`],
//           ["myCases", `My Cases (${tabCounts.myCases})`],
//           ["completedCases", `Resolved / Completed (${tabCounts.completedCases})`],
//         ].map(([id, label]) => (
//           <button
//             key={id}
//             type="button"
//             onClick={() => {
//               setTab(id);
//               setFilters({ q: "", status: "all", caseId: "", citizenId: "" });
//             }}
//             className={`portal-tab ${tab === id ? "portal-tab--active" : ""}`}
//           >
//             {label}
//           </button>
//         ))}
//       </div>

//       <div className="portal-card">
//         <div className="grid md:grid-cols-4 gap-3">
//           <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Search title, ID, citizen, status, owner..." className="portal-input" />
//           <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="portal-input">
//             <option value="all">All statuses</option>
//             {statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
//           </select>
//           <input value={filters.caseId} onChange={(event) => setFilters((current) => ({ ...current, caseId: event.target.value }))} placeholder="Complaint / Request ID" className="portal-input" />
//           <input value={filters.citizenId} onChange={(event) => setFilters((current) => ({ ...current, citizenId: event.target.value.toUpperCase() }))} placeholder="Citizen ID" className="portal-input" />
//         </div>
//       </div>

//       {error && <div className="portal-alert portal-alert--error">{error}</div>}
//       {loading ? (
//         <div className="portal-card portal-empty">Loading work queue…</div>
//       ) : rows.length === 0 ? (
//         <div className="portal-card portal-empty">
//           <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No items found for the current filters.</p>
//         </div>
//       ) : (
//         <div key={tab} className="portal-list">
//           {rows.map((item) => (
//             <div key={`${tab}-${item._id}`} className="portal-list-item">
//               <div className="flex items-start justify-between gap-3 mb-3">
//                 <div className="min-w-0 flex-1">
//                   <div className="flex items-center gap-2 mb-1.5 flex-wrap">
//                     <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{item.title || item.purpose}</h3>
//                     <span className="portal-chip" style={{ background: "var(--accent-primary-subtle)", color: "var(--accent-primary)" }}>{item.complaintId || item.requestId}</span>
//                     {item.priority === "VIP" && <span className="portal-chip">VIP Meeting</span>}
//                   </div>
//                   <div className="portal-meta">
//                     <span>{item.citizenSnapshot?.name} · {item.citizenSnapshot?.citizenId}</span>
//                     <span>{item.citizenSnapshot?.phoneNumbers?.[0] || "Phone unavailable"}</span>
//                     {item.complaintId && <span>{item.assignedAdminName ? `Assigned: ${item.assignedAdminName}` : "Pool item"}</span>}
//                     <span>Owner: {item.currentOwner}</span>
//                     <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
//                   </div>
//                   {(item.relatedComplaint || item.relatedMeeting) && (
//                     <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
//                       {item.relatedComplaint && `Linked complaint: ${item.relatedComplaint.complaintId}`}
//                       {item.relatedMeeting && `Linked meeting: ${item.relatedMeeting.requestId}`}
//                     </div>
//                   )}
//                 </div>
//                 <span className="portal-chip">{item.statusLabel}</span>
//               </div>

//               <div className="flex gap-2 flex-wrap">
//                 <button type="button" onClick={() => navigate(`/cases/${item.complaintId ? "complaint" : "meeting"}/${item._id}`)} className="portal-btn-secondary">Open Record</button>
//                 {!!item.complaintId && !item.assignedAdminUserId && (
//                   <button
//                     type="button"
//                     onClick={async () => {
//                       const res = await workItemsApi.assignComplaintToSelf(item._id);
//                       setData((current) => ({
//                         ...current,
//                         complaints: current.complaints.map((row) => (row._id === item._id ? res.complaint : row)),
//                       }));
//                     }}
//                     className="portal-btn"
//                   >
//                     Assign to Me
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }



import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workItemsApi } from "../ministerApi";
import { ChevronLeft, ChevronRight } from "lucide-react";

function isComplaintQueueItem(item) {
  return !item.assignedAdminUserId && !["resolved", "completed"].includes(item.status);
}

function isMeetingQueueItem(item) {
  return ["submitted", "verification_needed", "under_review", "approved"].includes(item.status);
}

function isMyComplaint(item, myAdminId) {
  return Number(item.assignedAdminUserId || 0) === Number(myAdminId || 0) && !["resolved", "completed"].includes(item.status);
}

function isMyMeeting(item, myAdminId) {
  const ownedByMe = Number(item.assignedAdminUserId || item.referralAdminUserId || 0) === Number(myAdminId || 0);
  return ownedByMe && !["rejected"].includes(item.status) && !["completed", "cancelled"].includes(item.executionStatus || "pending");
}

function isResolvedItem(item) {
  if (item.complaintId) return ["resolved", "completed"].includes(item.status);
  return item.status === "rejected" || ["completed", "cancelled"].includes(item.executionStatus || "pending");
}

function getQueueBuckets(data) {
  const sortLatestFirst = (items) => [...items].sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0));
  return {
    complaints: sortLatestFirst(data.complaints.filter(isComplaintQueueItem)),
    meetings: sortLatestFirst(data.meetingRequests.filter(isMeetingQueueItem)),
    myCases: sortLatestFirst([
      ...data.complaints.filter((item) => isMyComplaint(item, data.myAdminId)),
      ...data.meetingRequests.filter((item) => isMyMeeting(item, data.myAdminId)),
    ]),
    completedCases: sortLatestFirst([...data.complaints, ...data.meetingRequests].filter(isResolvedItem)),
  };
}

export default function HCMCasesListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ meetingRequests: [], complaints: [], myAdminId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("complaints");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    caseId: "",
    citizenId: "",
  });

  useEffect(() => {
    let mounted = true;
    workItemsApi.list()
      .then((res) => { if (mounted) setData(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load work queue"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const queues = useMemo(() => getQueueBuckets(data), [data]);
  const baseRows = queues[tab] || [];

  const rows = useMemo(() => {
    return baseRows.filter((item) => {
      const q = filters.q.trim().toLowerCase();
      const idValue = item.complaintId || item.requestId || "";
      const citizenId = item.citizenSnapshot?.citizenId || "";
      const statusOk = filters.status === "all" || item.status === filters.status;
      const caseIdOk = !filters.caseId.trim() || idValue.toLowerCase().includes(filters.caseId.trim().toLowerCase());
      const citizenOk = !filters.citizenId.trim() || citizenId.toLowerCase().includes(filters.citizenId.trim().toLowerCase());
      const textOk = !q || [
        item.title,
        item.purpose,
        item.citizenSnapshot?.name,
        item.citizenSnapshot?.phoneNumbers?.join(" "),
        item.citizenSnapshot?.citizenId,
        item.currentOwner,
        item.status,
        item.statusLabel,
        item.complaintId,
        item.requestId,
        item.priority,
        item.department,
        item.assignedAdminName,
        item.referralAdminName,
        item.scheduleDate,
        item.scheduleTime,
        item.scheduleLocation,
        item.relatedComplaint?.complaintId,
        item.relatedMeeting?.requestId,
      ].filter(Boolean).join(" ").toLowerCase().includes(q);
      return statusOk && caseIdOk && citizenOk && textOk;
    });
  }, [baseRows, filters]);

  // Reset pagination when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, filters]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(baseRows.map((item) => item.status))).sort();
  }, [baseRows]);

  const tabCounts = useMemo(() => ({
    complaints: queues.complaints.length,
    meetings: queues.meetings.length,
    myCases: queues.myCases.length,
    completedCases: queues.completedCases.length,
  }), [queues]);

  // Pagination Logic
  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
  const paginatedRows = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
        pages.push("...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...");
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1, "...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="portal-page">
      <div className="portal-tabs">
        {[
          ["complaints", `Complaint Queue (${tabCounts.complaints})`],
          ["meetings", `Meeting Queue (${tabCounts.meetings})`],
          ["myCases", `My Cases (${tabCounts.myCases})`],
          ["completedCases", `Resolved / Completed (${tabCounts.completedCases})`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setFilters({ q: "", status: "all", caseId: "", citizenId: "" });
            }}
            className={`portal-tab ${tab === id ? "portal-tab--active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter Section */}
      <div className="portal-card">
        <div className="grid md:grid-cols-4 gap-4">
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Search title, ID, citizen, status, owner..."
            className="portal-input"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="portal-input"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
          </select>
          <input
            value={filters.caseId}
            onChange={(event) => setFilters((current) => ({ ...current, caseId: event.target.value }))}
            placeholder="Complaint / Request ID"
            className="portal-input"
          />
          <input
            value={filters.citizenId}
            onChange={(event) => setFilters((current) => ({ ...current, citizenId: event.target.value.toUpperCase() }))}
            placeholder="Citizen ID"
            className="portal-input"
          />
        </div>
      </div>

      {error && <div className="portal-alert portal-alert--error">{error}</div>}

      {loading ? (
        <div className="portal-card portal-empty">Loading work queue…</div>
      ) : rows.length === 0 ? (
        <div className="portal-card portal-empty">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No items found for the current filters.</p>
        </div>
      ) : (
        <div className="portal-card flex flex-col" style={{ padding: 0, overflow: "hidden" }}>

          {/* 🟢 Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full border-collapse whitespace-nowrap" style={{ borderColor: "var(--border-secondary)" }}>

              {/* TABLE HEADER */}
              <thead className="sticky top-0 z-10" style={{ background: "#f8fafc" }}>
                <tr style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "140px", minWidth: "140px" }}>Complaint No</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "220px", minWidth: "220px" }}>Title</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "150px", minWidth: "150px" }}>Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "140px", minWidth: "140px" }}>Citizen ID</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "130px", minWidth: "130px" }}>Mobile No</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "160px", minWidth: "160px" }}>Pool/Assigned</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "140px", minWidth: "140px" }}>Owner</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "110px", minWidth: "110px" }}>Created</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "120px", minWidth: "120px" }}>Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "180px", minWidth: "180px" }}>Actions</th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="bg-white">
                {paginatedRows.map((item, idx) => (
                  <tr
                    key={`${tab}-${item._id}`}
                    style={{
                      borderBottom: "1px solid var(--border-secondary)",
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb"
                    }}
                    className="hover:bg-blue-50 transition-colors duration-200"
                  >

                    {/* Complaint No - with VIP Badge */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-600">{item.complaintId || item.requestId}</span>
                        {item.priority === "VIP" && (
                          <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[10px] whitespace-nowrap">VIP</span>
                        )}
                      </div>
                    </td>

                    {/* Title with Related Link */}
                    <td className="px-4 py-3 text-sm">
                      <div className="font-semibold truncate max-w-[200px]" title={item.title || item.purpose}>
                        {item.title || item.purpose}
                      </div>
                      {(item.relatedComplaint || item.relatedMeeting) && (
                        <div className="text-[10px] font-medium text-gray-500 mt-1">
                          {item.relatedComplaint && `📎 ${item.relatedComplaint.complaintId}`}
                          {item.relatedMeeting && `📎 ${item.relatedMeeting.requestId}`}
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 text-sm truncate max-w-[140px] text-gray-700" title={item.citizenSnapshot?.name}>
                      {item.citizenSnapshot?.name || "N/A"}
                    </td>

                    {/* Citizen ID */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-600">
                      {item.citizenSnapshot?.citizenId || "N/A"}
                    </td>

                    {/* Mobile No */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.citizenSnapshot?.phoneNumbers?.[0] || "N/A"}
                    </td>

                    {/* Pool/Assigned */}
                    <td className="px-4 py-3 text-sm font-medium truncate max-w-[150px]" title={item.assignedAdminName || "Pool item"}>
                      {item.complaintId ? (item.assignedAdminName ? `✓ ${item.assignedAdminName}` : "📋 Pool") : "📅 Meeting"}
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[130px]" title={item.currentOwner}>
                      {item.currentOwner || "N/A"}
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center">
                      <span className="bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap inline-block">
                        {item.statusLabel || "Pooled"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                        type="button" 
                        onClick={() => navigate(`/cases/${item.complaintId ? "complaint" : "meeting"}/${item._id}`)} 
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-100 hover:text-blue-600 hover:border-blue-300 font-bold text-[12px] transition-all shadow-sm cursor-pointer"
                      >
                        View
                      </button>
                        {!!item.complaintId && !item.assignedAdminUserId && (
                          <button
                          type="button"
                          onClick={async () => {
                            const res = await workItemsApi.assignComplaintToSelf(item._id);
                            setData((current) => ({
                              ...current,
                              complaints: current.complaints.map((row) => (row._id === item._id ? res.complaint : row)),
                            }));
                          }}
                          className="px-4 py-2 bg-blue-600 border border-gray-300 text-gray-900 rounded-md hover:bg-blue-700 font-bold text-[12px] transition-all shadow-sm shadow-blue-200 cursor-pointer"
                        >
                          Assign To Me
                        </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t" style={{ borderColor: "var(--border-secondary)" }}>

              {/* Left: Previous Button */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              {/* Center: Page Numbers */}
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={page === "..."}
                    onClick={() => typeof page === "number" && setCurrentPage(page)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${page === "..."
                        ? "cursor-default text-gray-400"
                        : currentPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Right: Next Button */}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
                <ChevronRight size={16} />
              </button>

            </div>
          )}

        </div>
      )} : rows.length === 0 ? (
      <div className="portal-card portal-empty">
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No items found for the current filters.</p>
      </div>
      ) : (
      <div className="portal-card flex flex-col" style={{ padding: 0, overflow: "hidden" }}>

        {/* Table Container with Proper Structure */}
        <table className="w-full border-collapse" style={{ borderColor: "var(--border-secondary)" }}>

          {/* TABLE HEADER */}
          <thead className="sticky top-0 z-10" style={{ background: "#f8fafc" }}>
            <tr style={{ borderBottom: "1px solid var(--border-secondary)" }}>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "140px", minWidth: "140px" }}>Complaint No</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "220px", minWidth: "220px" }}>Title</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "150px", minWidth: "150px" }}>Name</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "140px", minWidth: "140px" }}>Citizen ID</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "130px", minWidth: "130px" }}>Mobile No</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "160px", minWidth: "160px" }}>Pool/Assigned</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "140px", minWidth: "140px" }}>Owner</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "110px", minWidth: "110px" }}>Created</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "120px", minWidth: "120px" }}>Status</th>
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500" style={{ width: "180px", minWidth: "180px" }}>Actions</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="bg-white">
            {paginatedRows.map((item, idx) => (
              <tr
                key={`${tab}-${item._id}`}
                style={{
                  borderBottom: "1px solid var(--border-secondary)",
                  backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb"
                }}
                className="hover:bg-blue-50 transition-colors duration-200"
              >

                {/* Complaint No - with VIP Badge */}
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-600">{item.complaintId || item.requestId}</span>
                    {item.priority === "VIP" && (
                      <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[10px] whitespace-nowrap">VIP</span>
                    )}
                  </div>
                </td>

                {/* Title with Related Link */}
                <td className="px-4 py-3 text-sm">
                  <div className="font-semibold truncate" title={item.title || item.purpose}>
                    {item.title || item.purpose}
                  </div>
                  {(item.relatedComplaint || item.relatedMeeting) && (
                    <div className="text-[10px] font-medium text-gray-500 mt-1">
                      {item.relatedComplaint && `📎 ${item.relatedComplaint.complaintId}`}
                      {item.relatedMeeting && `📎 ${item.relatedMeeting.requestId}`}
                    </div>
                  )}
                </td>

                {/* Name */}
                <td className="px-4 py-3 text-sm truncate text-gray-700" title={item.citizenSnapshot?.name}>
                  {item.citizenSnapshot?.name || "N/A"}
                </td>

                {/* Citizen ID */}
                <td className="px-4 py-3 text-sm font-medium text-gray-600">
                  {item.citizenSnapshot?.citizenId || "N/A"}
                </td>

                {/* Mobile No */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.citizenSnapshot?.phoneNumbers?.[0] || "N/A"}
                </td>

                {/* Pool/Assigned */}
                <td className="px-4 py-3 text-sm font-medium truncate" title={item.assignedAdminName || "Pool item"}>
                  {item.complaintId ? (item.assignedAdminName ? `✓ ${item.assignedAdminName}` : "📋 Pool") : "📅 Meeting"}
                </td>

                {/* Owner */}
                <td className="px-4 py-3 text-sm text-gray-600 truncate" title={item.currentOwner}>
                  {item.currentOwner || "N/A"}
                </td>

                {/* Created Date */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(item.createdAt).toLocaleDateString("en-IN")}
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3 text-center">
                  <span className="bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap inline-block">
                    {item.statusLabel || "Pooled"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/cases/${item.complaintId ? "complaint" : "meeting"}/${item._id}`)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                    >
                      View
                    </button>
                    {!!item.complaintId && !item.assignedAdminUserId && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await workItemsApi.assignComplaintToSelf(item._id);
                          setData((current) => ({
                            ...current,
                            complaints: current.complaints.map((row) => (row._id === item._id ? res.complaint : row)),
                          }));
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t" style={{ borderColor: "var(--border-secondary)" }}>

            {/* Left: Previous Button */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {/* Center: Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={page === "..."}
                  onClick={() => typeof page === "number" && setCurrentPage(page)}
                  className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${page === "..."
                      ? "cursor-default text-gray-400"
                      : currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }
                    `}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Right: Next Button */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>

          </div>
        )}

      </div>
      )

      {/* Scrollbar Styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}