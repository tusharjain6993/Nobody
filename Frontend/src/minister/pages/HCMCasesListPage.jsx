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
  const ITEMS_PER_PAGE = 8; // Adjust items per page as needed

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

      <div className="portal-card">
        <div className="grid md:grid-cols-4 gap-4">
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Search title, ID, citizen, status, owner..." className="portal-input" />
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="portal-input">
            <option value="all">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
          </select>
          <input value={filters.caseId} onChange={(event) => setFilters((current) => ({ ...current, caseId: event.target.value }))} placeholder="Complaint / Request ID" className="portal-input" />
          <input value={filters.citizenId} onChange={(event) => setFilters((current) => ({ ...current, citizenId: event.target.value.toUpperCase() }))} placeholder="Citizen ID" className="portal-input" />
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
          
          {/* 🟢 HORIZONTAL SCROLL WRAPPER */}
          <div className="overflow-x-auto w-full custom-scrollbar">
            
            {/* 🟢 TABLE CONTAINER (Generous Fixed Min Width) */}
            <div style={{ minWidth: "1500px" }}>
              
              {/* TABLE HEADER (Matches Screenshot style) */}
              <div 
                className="grid gap-4 items-center px-6 py-4 border-b text-[11px] font-bold uppercase tracking-wider"
                style={{ 
                  gridTemplateColumns: "140px minmax(200px, 1fr) 150px 130px 120px 140px 150px 100px 100px 100px",
                  borderColor: "var(--border-secondary)", 
                  background: "#f8fafc", 
                  color: "var(--text-tertiary)" 
                }}
              >
                <div>Complaint No</div>
                <div>Title</div>
                <div>Name</div>
                <div>Citizen ID</div>
                <div>Mob No</div>
                <div>Pool/Assigned</div>
                <div>Owner</div>
                <div>Created</div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>

              {/* TABLE BODY */}
              <div className="flex flex-col bg-white">
                {paginatedRows.map((item) => (
                  <div 
                    key={`${tab}-${item._id}`} 
                    className="grid gap-4 items-center px-6 py-4 border-b text-sm transition-colors hover:bg-slate-50"
                    style={{ 
                      gridTemplateColumns: "140px minmax(200px, 1fr) 150px 130px 120px 140px 150px 100px 100px 220px", 
                      borderColor: "var(--border-secondary)",
                      color: "var(--text-primary)" 
                    }}
                  >
                    
                    {/* Complaint No */}
                    <div>
                      <span className="font-semibold text-blue-600">
                        {item.complaintId || item.requestId}
                      </span>
                      {item.priority === "VIP" && (
                         <span className="ml-2 bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[10px]">VIP</span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <div className="font-semibold truncate" title={item.title || item.purpose}>
                      {item.title || item.purpose}
                      {(item.relatedComplaint || item.relatedMeeting) && (
                        <div className="text-[11px] mt-1 font-normal text-gray-500">
                          {item.relatedComplaint && `Linked: ${item.relatedComplaint.complaintId}`}
                          {item.relatedMeeting && `Linked: ${item.relatedMeeting.requestId}`}
                        </div>
                      )}
                    </div>
                    
                    {/* Name */}
                    <div className="truncate" title={item.citizenSnapshot?.name}>
                      {item.citizenSnapshot?.name || "N/A"}
                    </div>
                    
                    {/* Citizen ID */}
                    <div className="text-gray-500">
                      {item.citizenSnapshot?.citizenId || "N/A"}
                    </div>
                    
                    {/* Mobile No */}
                    <div className="text-gray-500">
                      {item.citizenSnapshot?.phoneNumbers?.[0] || "N/A"}
                    </div>
                    
                    {/* Pool Item / Assigned */}
                    <div className="text-gray-500 font-medium truncate">
                      {item.complaintId ? (item.assignedAdminName ? `Assigned: ${item.assignedAdminName}` : "Pool item") : "Meeting"}
                    </div>
                    
                    {/* Owner */}
                    <div className="text-gray-500 truncate" title={item.currentOwner}>
                      {item.currentOwner || "N/A"}
                    </div>
                    
                    {/* Created Date */}
                    <div className="text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>

                    {/* Status (Pooled) - Matching Screenshot style */}
                    <div className="flex justify-center">
                      <span className="bg-slate-100 text-slate-600 font-semibold px-3 py-1 rounded-full text-xs whitespace-nowrap">
                        {item.statusLabel || "Pooled"}
                      </span>
                    </div>

                    {/* Actions - Original Size and Classes */}
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        type="button" 
                        onClick={() => navigate(`/cases/${item.complaintId ? "complaint" : "meeting"}/${item._id}`)} 
                        className="portal-btn-secondary whitespace-nowrap"
                      >
                        Open Record
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
                          className="portal-btn whitespace-nowrap"
                        >
                          Assign to Me
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>
            
          {/* 🟢 PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t" style={{ borderColor: "var(--border-secondary)" }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="portal-btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="portal-btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
            
        </div>
      )}
      
      {/* Scrollbar styling for smooth horizontal scroll */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}