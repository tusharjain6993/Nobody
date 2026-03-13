import { useEffect, useState } from "react";
import { useHCMAuth } from "../HCMAuthContext";
import { calendarApi, meetingsApi } from "../ministerApi";
import { filesToDocuments } from "../../utils/fileHelpers";

const inputClass = "text-[0.78rem] px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none";

export default function MeetingsPage() {
  const { user } = useHCMAuth();
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    details: "",
    eventType: "Invited Event",
    scheduleAt: "",
    endAt: "",
    mediaFolder: "",
    videoLink: "",
    department: "",
    participationRole: "Attendee",
    portfolio: "Neither",
  });
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        if (user?.role === "deo") {
          const res = await calendarApi.list();
          if (mounted) setEvents(res.events || []);
        } else {
          const res = await meetingsApi.list();
          if (mounted) setMeetings(res.meetings || []);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load items");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user?.role]);

  if (user?.role !== "deo") {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-5">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Scheduled Meetings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">Only meetings that have been approved and scheduled appear here. Pending requests stay in the work queue.</p>
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500 py-8 text-center">Loading meetings…</div>
        ) : meetings.filter((meeting) => meeting.status === "scheduled").length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3d p-8 text-center">
            <p className="text-slate-400 text-sm">No meetings scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.filter((meeting) => meeting.status === "scheduled").map((meeting) => (
              <div key={meeting._id} className="bg-white rounded-2xl border border-slate-100 shadow-3d p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[0.68rem] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold inline-block mb-2">{meeting.requestId}</div>
                    <h3 className="font-bold text-slate-900 text-sm">{meeting.purpose}</h3>
                    <div className="text-xs text-slate-500 mt-1">{meeting.citizenSnapshot?.name} · Referral: {meeting.referralAdminName}</div>
                    {meeting.scheduleDate && <div className="text-xs text-slate-500 mt-1">{meeting.scheduleDate} · {meeting.scheduleTime} · {meeting.scheduleLocation}</div>}
                    {(meeting.visitorId || meeting.meetingDocket) && <div className="text-xs text-slate-400 mt-1">Visitor ID: {meeting.visitorId || "Pending"} · Docket: {meeting.meetingDocket || "Pending"}</div>}
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-emerald-100 text-emerald-700">{meeting.statusLabel}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const createEvent = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const photoDocs = await filesToDocuments(photos);
      const documentDocs = await filesToDocuments(documents);
      const res = await calendarApi.create({ ...form, photos: photoDocs, documents: documentDocs });
      setEvents((current) => [res.event, ...current]);
      setForm({
        title: "",
        details: "",
        eventType: "Invited Event",
        scheduleAt: "",
        endAt: "",
        mediaFolder: "",
        videoLink: "",
        department: "",
        participationRole: "Attendee",
        portfolio: "Neither",
      });
      setPhotos([]);
      setDocuments([]);
    } catch (err) {
      setError(err.message || "Failed to create event");
    }
  };

  const markAttended = async (id) => {
    try {
      const res = await calendarApi.markAttended(id);
      setEvents((current) => current.map((row) => (row._id === String(id) ? res.event : row)));
    } catch (err) {
      setError(err.message || "Failed to mark attended");
    }
  };

  return (
    <div className="p-6 max-w-[1240px] mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Calendar & Engagement</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">Create invited events or scheduled office meetings, attach media references, and feed attended events into classification and productivity scoring.</p>
      </div>
      {error && <div className="px-3 py-2 rounded-lg text-xs bg-red-50 text-red-600 border border-red-100">{error}</div>}

      <form onSubmit={createEvent} className="bg-white rounded-2xl border border-slate-100 shadow-3d p-4 grid md:grid-cols-2 gap-3">
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Event title" className={inputClass} />
        <select value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))} className={inputClass}>
          <option>Invited Event</option>
          <option>Scheduled Meeting</option>
        </select>
        <textarea value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} placeholder="Event details" className={`${inputClass} md:col-span-2 min-h-28`} />
        <input type="datetime-local" value={form.scheduleAt} onChange={(event) => setForm((current) => ({ ...current, scheduleAt: event.target.value }))} className={inputClass} />
        <input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className={inputClass} />
        <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="Department" className={inputClass} />
        <input value={form.mediaFolder} onChange={(event) => setForm((current) => ({ ...current, mediaFolder: event.target.value }))} placeholder="Media folder reference" className={inputClass} />
        <input value={form.videoLink} onChange={(event) => setForm((current) => ({ ...current, videoLink: event.target.value }))} placeholder="Video repository link" className={inputClass} />
        <select value={form.participationRole} onChange={(event) => setForm((current) => ({ ...current, participationRole: event.target.value }))} className={inputClass}>
          <option>Chair</option>
          <option>Speaker</option>
          <option>Attendee</option>
        </select>
        <select value={form.portfolio} onChange={(event) => setForm((current) => ({ ...current, portfolio: event.target.value }))} className={inputClass}>
          <option>Culture</option>
          <option>Tourism</option>
          <option>Both</option>
          <option>Neither</option>
        </select>
        <input type="file" multiple accept=".png,.jpg,.jpeg,.webp" onChange={(event) => setPhotos(Array.from(event.target.files || []))} className={`${inputClass} md:col-span-2`} />
        <input type="file" multiple onChange={(event) => setDocuments(Array.from(event.target.files || []))} className={`${inputClass} md:col-span-2`} />
        <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm md:col-span-2">Create Calendar Entry</button>
      </form>

      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading calendar…</div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event._id} className="bg-white rounded-2xl border border-slate-100 shadow-3d p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold inline-block mb-2">{event.eventType}</div>
                  <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                  <div className="text-xs text-slate-500 mt-1">{new Date(event.scheduleAt).toLocaleString()} · {event.department || "No department set"}</div>
                  <div className="text-xs text-slate-400 mt-1">Media folder: {event.mediaFolder || "N/A"} · Photos: {event.photos.length} · Files: {(event.documents || []).length} · Video: {event.videoLink || "N/A"}</div>
                  <div className="text-xs text-slate-400 mt-1">Classification: {event.classification || "Pending attendance"} · Score: {event.productivityScore || 0}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-slate-100 text-slate-700">{event.attendanceStatus}</span>
                  {event.attendanceStatus !== "attended" && (
                    <button type="button" onClick={() => markAttended(event._id)} className="px-3 py-1.5 text-[0.78rem] rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-medium">
                      Mark Attended
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
