import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { citizenApi } from "../ministerApi";

function statusBadgeClass(status) {
  if (status === "scheduled") return "bg-emerald-100 text-emerald-700";
  if (status === "approved") return "bg-sky-100 text-sky-700";
  if (status === "verification_needed" || status === "under_review") return "bg-amber-100 text-amber-700";
  if (status === "resolved" || status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function getCitizenFacingStatus(item) {
  if (item?.itemType === "meeting" && ["verification_needed", "approved", "under_review"].includes(item.status)) {
    return { value: "under_review", label: "Under Review" };
  }
  return { value: item?.status || "", label: item?.statusLabel || "" };
}

export default function CitizenMyCasesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ meetings: [], complaints: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState({ q: "", status: "all", type: "all" });

  useEffect(() => {
    let mounted = true;
    citizenApi.myItems()
      .then((res) => { if (mounted) setData(res); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load your requests"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      status: "all",
      type: tab === "all" ? "all" : tab,
    }));
  }, [tab]);

  const items = useMemo(() => {
    const combined = [
      ...data.meetings.map((item) => ({ ...item, itemType: "meeting", primaryTitle: item.purpose, primaryId: item.requestId })),
      ...data.complaints.map((item) => ({ ...item, itemType: "complaint", primaryTitle: item.title, primaryId: item.complaintId })),
    ].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    return combined.filter((item) => {
      const tabOk = tab === "all" || item.itemType === tab;
      const typeOk = filters.type === "all" || item.itemType === filters.type;
      const citizenStatus = getCitizenFacingStatus(item);
      const statusOk = filters.status === "all" || citizenStatus.value === filters.status;
      const q = filters.q.trim().toLowerCase();
      const searchText = [
        item.primaryTitle,
        item.primaryId,
        citizenStatus.label,
        citizenStatus.value,
        item.currentOwner,
        item.department,
        item.relatedMeeting?.requestId,
        item.relatedComplaint?.complaintId,
        item.scheduleLocation,
        item.rejectReason,
        item.resolutionSummary,
        item.visitorId,
        item.meetingDocket,
      ].filter(Boolean).join(" ").toLowerCase();
      return tabOk && typeOk && statusOk && (!q || searchText.includes(q));
    });
  }, [data.complaints, data.meetings, filters, tab]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set([
      ...data.meetings.map((item) => getCitizenFacingStatus({ ...item, itemType: "meeting" }).value),
      ...data.complaints.map((item) => getCitizenFacingStatus({ ...item, itemType: "complaint" }).value),
    ])).filter(Boolean).sort();
  }, [data.complaints, data.meetings]);

  const totalItems = data.meetings.length + data.complaints.length;

  return (
    <div className="p-6 max-w-[1320px] mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Complaints</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            Track complaints, linked escalations, resolution updates, and related meeting references in one place.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Total requests: <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span>
        </div>
      </div>

      <div className="portal-tabs">
        {[
          ["all", `All (${totalItems})`],
          ["complaint", `Complaints (${data.complaints.length})`],
          ["meeting", `Meeting Escalations (${data.meetings.length})`],
        ].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={`portal-tab ${tab === value ? "portal-tab--active" : ""}`}>{label}</button>
        ))}
      </div>

      <div className="portal-card">
        <div className="grid md:grid-cols-3 gap-3">
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Search ID, title, status, owner..." className="portal-input" />
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="portal-input">
            <option value="all">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
          </select>
          <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="portal-input">
            <option value="all">All record types</option>
            <option value="meeting">Meetings</option>
            <option value="complaint">Complaints</option>
          </select>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-500 py-8 text-center">Loading requests…</div>}
      {error && <div className="portal-alert portal-alert--error">{error}</div>}

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm p-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No requests found for the current filters.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                    <tr className="text-[0.68rem] tracking-[0.16em] text-slate-500 dark:text-slate-400 uppercase">
                      <th className="px-4 py-4 text-left">Task ID</th>
                      <th className="px-4 py-4 text-left">Subject</th>
                      <th className="px-4 py-4 text-left">Department</th>
                      <th className="px-4 py-4 text-left">Status</th>
                      <th className="px-4 py-4 text-left">Holder</th>
                      <th className="px-4 py-4 text-left">Reference</th>
                      <th className="px-4 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const citizenStatus = getCitizenFacingStatus(item);
                      const isMeeting = item.itemType === "meeting";
                      const secondaryLine = isMeeting
                        ? (item.scheduleLocation || item.adminNotes || "Awaiting admin update")
                        : (item.department || item.callOutcome || item.resolutionSummary || "Complaint under process");
                      const departmentLabel = isMeeting
                        ? (item.referralAdminName || item.assignedAdminName || "General Admin Pool")
                        : (item.department || "Complaint Desk");
                      const referenceLabel = isMeeting
                        ? (item.relatedComplaint?.complaintId || item.meetingDocket || item.visitorId || "No linked record")
                        : (item.relatedMeeting?.requestId || item.resolutionDocs?.map((doc) => doc.name).join(", ") || "No linked record");
                      return (
                        <tr key={`${item.itemType}-${item._id}`} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0 bg-white dark:bg-slate-900">
                          <td className="px-4 py-4 align-top text-[0.76rem] font-semibold text-slate-500 dark:text-slate-400">{item.primaryId}</td>
                          <td className="px-4 py-4 align-top">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.primaryTitle}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{secondaryLine}</div>
                          </td>
                          <td className="px-4 py-4 align-top text-slate-600 dark:text-slate-300">{departmentLabel}</td>
                          <td className="px-4 py-4 align-top">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.72rem] font-semibold ${statusBadgeClass(citizenStatus.value)}`}>
                              {citizenStatus.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top text-slate-600 dark:text-slate-300">{item.currentOwner || "Pending"}</td>
                          <td className="px-4 py-4 align-top text-slate-600 dark:text-slate-300">{referenceLabel}</td>
                          <td className="px-4 py-4 align-top">
                            {isMeeting ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/meetings/${item._id}`)}
                                className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 text-[0.76rem] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                View Details
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 dark:text-slate-400">Complaint record</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden p-4 space-y-3">
                {items.map((item) => {
                  const citizenStatus = getCitizenFacingStatus(item);
                  const isMeeting = item.itemType === "meeting";
                  const departmentLabel = isMeeting
                    ? (item.referralAdminName || item.assignedAdminName || "General Admin Pool")
                    : (item.department || "Complaint Desk");
                  const referenceLabel = isMeeting
                    ? (item.relatedComplaint?.complaintId || item.meetingDocket || item.visitorId || "No linked record")
                    : (item.relatedMeeting?.requestId || item.resolutionDocs?.map((doc) => doc.name).join(", ") || "No linked record");
                  return (
                    <div key={`${item.itemType}-${item._id}`} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[0.68rem] tracking-[0.16em] uppercase text-slate-400 dark:text-slate-500">{item.primaryId}</div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{item.primaryTitle}</div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.72rem] font-semibold ${statusBadgeClass(citizenStatus.value)}`}>
                          {citizenStatus.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400 mt-4">
                        <div>
                          <div className="uppercase tracking-[0.12em] text-[0.62rem]">Department</div>
                          <div className="mt-1 text-slate-700 dark:text-slate-200">{departmentLabel}</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-[0.12em] text-[0.62rem]">Holder</div>
                          <div className="mt-1 text-slate-700 dark:text-slate-200">{item.currentOwner || "Pending"}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="uppercase tracking-[0.12em] text-[0.62rem]">Reference</div>
                          <div className="mt-1 text-slate-700 dark:text-slate-200">{referenceLabel}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                        {isMeeting
                          ? (item.scheduleLocation || item.adminNotes || "Awaiting admin update")
                          : (item.department || item.callOutcome || item.resolutionSummary || item.details)}
                      </div>
                      {isMeeting && (
                        <button
                          type="button"
                          onClick={() => navigate(`/meetings/${item._id}`)}
                          className="mt-4 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 text-[0.76rem] font-semibold text-slate-700 dark:text-slate-200"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
                <div>Showing 1-{items.length} of {items.length} requests</div>
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <span className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">10</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
