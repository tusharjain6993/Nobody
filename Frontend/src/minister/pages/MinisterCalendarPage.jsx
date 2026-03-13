import { useEffect, useMemo, useState } from "react";
import { ministerViewApi } from "../ministerApi";

const VIEW_OPTIONS = ["month", "week", "day"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_STYLES = {
  "Invited Event": "bg-blue-100 text-blue-700 border-blue-200",
  "Scheduled Meeting": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Minister Meeting": "bg-amber-100 text-amber-700 border-amber-200",
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function EventPill({ item, compact = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border rounded-lg px-2.5 py-2 ${TYPE_STYLES[item.type] || "bg-slate-100 text-slate-700 border-slate-200"} ${compact ? "text-[11px]" : "text-xs"}`}
    >
      <div className="font-bold truncate">{item.title}</div>
      <div className="opacity-80 mt-0.5">{formatTime(item.startsAt)}</div>
    </button>
  );
}

function Modal({ item, mode, editForm, setEditForm, onClose, onSave, onModeChange, saving }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px] z-50 flex items-start justify-center p-6 overflow-auto">
      <div className="w-full max-w-xl mt-10 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold border ${TYPE_STYLES[item.type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{item.type}</div>
            <h3 className="mt-3 text-xl font-bold text-slate-900">{item.title}</h3>
            <div className="text-sm text-slate-500 mt-1">{new Date(item.startsAt).toLocaleString()}</div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-sm font-semibold">Close</button>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 flex gap-2">
          <button type="button" onClick={() => onModeChange("details")} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${mode === "details" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>Details</button>
          <button type="button" onClick={() => onModeChange("edit")} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${mode === "edit" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>Edit</button>
          <button type="button" onClick={() => onModeChange("files")} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${mode === "files" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>Files</button>
        </div>

        <div className="p-5">
          {mode === "details" && (
            <div className="space-y-3">
              <div className="text-sm text-slate-500">{item.source}</div>
              <div className="text-sm text-slate-700">{item.location || "Location pending"}</div>
              <div className="text-sm text-slate-600 leading-6">{item.details}</div>
              {item.videoLink && <a href={item.videoLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 inline-block">Open video repository</a>}
            </div>
          )}

          {mode === "files" && (
            <div className="space-y-3">
              {item.files?.length ? item.files.map((file, index) => (
                <a
                  key={`${file.name || "file"}-${index}`}
                  href={file.data}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 border border-slate-200 rounded-2xl px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{file.name || `File ${index + 1}`}</div>
                    <div className="text-xs text-slate-500">{file.type || "Attachment"}</div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">Open</span>
                </a>
              )) : <div className="text-sm text-slate-400">No files attached to this calendar item.</div>}
            </div>
          )}

          {mode === "edit" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSave();
              }}
              className="space-y-3"
            >
              <input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Title" />
              <textarea value={editForm.details} onChange={(event) => setEditForm((current) => ({ ...current, details: event.target.value }))} rows={4} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Description" />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={editForm.startsAt} onChange={(event) => setEditForm((current) => ({ ...current, startsAt: event.target.value }))} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
                <input type="datetime-local" value={editForm.endsAt} onChange={(event) => setEditForm((current) => ({ ...current, endsAt: event.target.value }))} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
              </div>
              <input value={editForm.location} onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Location" />
              <div className="pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MinisterCalendarPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month");
  const [cursorDate, setCursorDate] = useState(startOfDay(new Date()));
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("details");
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", details: "", startsAt: "", endsAt: "", location: "" });

  useEffect(() => {
    let mounted = true;
    ministerViewApi.calendar()
      .then((res) => { if (mounted) setItems(res.calendarItems || []); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load minister calendar"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const normalizedItems = useMemo(
    () => items.map((item) => ({ ...item, startDate: new Date(item.startsAt), endDate: new Date(item.endsAt) })),
    [items]
  );

  const monthCells = useMemo(() => {
    const first = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
    const gridStart = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const dayItems = normalizedItems.filter((item) => isSameDay(item.startDate, date));
      return { date, items: dayItems };
    });
  }, [cursorDate, normalizedItems]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursorDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      return {
        date,
        items: normalizedItems.filter((item) => isSameDay(item.startDate, date)),
      };
    });
  }, [cursorDate, normalizedItems]);

  const dayItems = useMemo(
    () => normalizedItems.filter((item) => item.startDate >= startOfDay(cursorDate) && item.startDate <= endOfDay(cursorDate)),
    [cursorDate, normalizedItems]
  );

  const openItem = (item, mode = "details") => {
    setSelectedItem(item);
    setModalMode(mode);
    setEditForm({
      title: item.title || "",
      details: item.details || "",
      startsAt: item.startsAt?.slice(0, 16) || "",
      endsAt: item.endsAt?.slice(0, 16) || "",
      location: item.location || "",
    });
  };

  const shiftCursor = (direction) => {
    const next = new Date(cursorDate);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    else if (view === "week") next.setDate(next.getDate() + direction * 7);
    else next.setDate(next.getDate() + direction);
    setCursorDate(startOfDay(next));
  };

  const saveEdit = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setError("");
    try {
      const res = await ministerViewApi.updateCalendarItem({
        sourceKind: selectedItem.sourceKind,
        sourceId: selectedItem.sourceId,
        title: editForm.title,
        details: editForm.details,
        startsAt: editForm.startsAt,
        endsAt: editForm.endsAt,
        location: editForm.location,
      });
      setItems(res.calendarItems || []);
      const updated = (res.calendarItems || []).find((item) => item.id === selectedItem.id);
      if (updated) {
        openItem(updated, "details");
      } else {
        setSelectedItem(null);
      }
    } catch (err) {
      setError(err.message || "Failed to update calendar item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[1380px] mx-auto space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Minister Calendar</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            A Google Calendar style view combining DEO-managed calendar entries and minister meetings scheduled by admins from citizen meeting requests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setCursorDate(startOfDay(new Date()))} className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white text-slate-700 border-slate-200">Today</button>
          <button type="button" onClick={() => shiftCursor(-1)} className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white text-slate-700 border-slate-200">Prev</button>
          <button type="button" onClick={() => shiftCursor(1)} className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white text-slate-700 border-slate-200">Next</button>
          {VIEW_OPTIONS.map((option) => (
            <button key={option} type="button" onClick={() => setView(option)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${view === option ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm font-semibold text-slate-700">
        {view === "month"
          ? cursorDate.toLocaleString("default", { month: "long", year: "numeric" })
          : view === "week"
            ? `Week of ${startOfWeek(cursorDate).toLocaleDateString()}`
            : cursorDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </div>

      {error && <div className="px-3 py-2 rounded-lg text-xs bg-red-50 text-red-600 border border-red-100">{error}</div>}

      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading minister calendar…</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-3d overflow-hidden">
            {view === "month" && (
              <div>
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                  {DAYS.map((day) => <div key={day} className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {monthCells.map((cell) => {
                    const inMonth = cell.date.getMonth() === cursorDate.getMonth();
                    const isToday = isSameDay(cell.date, new Date());
                    return (
                      <div key={cell.date.toISOString()} className={`min-h-32 border-b border-r border-slate-100 p-2 ${inMonth ? "bg-white" : "bg-slate-50/70"}`}>
                        <button type="button" onClick={() => setCursorDate(cell.date)} className={`w-8 h-8 rounded-full text-xs font-semibold ${isToday ? "bg-blue-600 text-white" : inMonth ? "text-slate-700" : "text-slate-400"}`}>
                          {cell.date.getDate()}
                        </button>
                        <div className="mt-2 space-y-1">
                          {cell.items.slice(0, 3).map((item) => <EventPill key={item.id} item={item} compact onClick={() => openItem(item)} />)}
                          {cell.items.length > 3 && <div className="text-[11px] text-slate-400 px-1">+{cell.items.length - 3} more</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "week" && (
              <div>
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                  {weekDays.map((day) => (
                    <div key={day.date.toISOString()} className="px-3 py-3 text-center">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{DAYS[day.date.getDay()]}</div>
                      <div className={`mt-2 inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-semibold ${isSameDay(day.date, new Date()) ? "bg-blue-600 text-white" : "text-slate-700"}`}>{day.date.getDate()}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 min-h-[520px]">
                  {weekDays.map((day) => (
                    <div key={day.date.toISOString()} className="border-r border-slate-100 p-3 space-y-2">
                      {day.items.length === 0 ? <div className="text-xs text-slate-300">No events</div> : day.items.map((item) => <EventPill key={item.id} item={item} onClick={() => openItem(item)} />)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === "day" && (
              <div className="p-4 min-h-[520px]">
                <div className="text-sm font-bold text-slate-900 mb-4">{cursorDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
                <div className="space-y-3">
                  {dayItems.length === 0 ? (
                    <div className="text-sm text-slate-400">No events for this day.</div>
                  ) : (
                    dayItems.map((item) => (
                      <button key={item.id} type="button" onClick={() => openItem(item)} className="w-full text-left border border-slate-100 rounded-2xl p-4 bg-slate-50/70">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold border ${TYPE_STYLES[item.type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{item.type}</div>
                            <div className="mt-2 font-bold text-slate-900">{item.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{item.source} · {item.location || "Location pending"}</div>
                          </div>
                          <div className="text-xs text-slate-500">{formatTime(item.startsAt)} - {formatTime(item.endsAt)}</div>
                        </div>
                        <div className="text-xs text-slate-400 mt-3">{item.details}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-3d p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Upcoming Agenda</div>
            <div className="space-y-3">
              {[...normalizedItems].sort((a, b) => a.startDate - b.startDate).slice(0, 12).map((item) => (
                <button key={item.id} type="button" onClick={() => { setCursorDate(startOfDay(item.startDate)); openItem(item); }} className="w-full text-left border-b border-slate-100 pb-3 last:border-b-0">
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.type} · {new Date(item.startsAt).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        item={selectedItem}
        mode={modalMode}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={() => setSelectedItem(null)}
        onSave={saveEdit}
        onModeChange={setModalMode}
        saving={saving}
      />
    </div>
  );
}
