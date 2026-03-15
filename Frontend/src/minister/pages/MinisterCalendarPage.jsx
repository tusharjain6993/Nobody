import { useEffect, useMemo, useState } from "react";
import { ministerViewApi } from "../ministerApi";

const VIEW_OPTIONS = ["month", "week", "day"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_STYLES = {
  "Invited Event": "bg-blue-100 text-blue-700 border-blue-200",
  "Scheduled Meeting": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Minister Meeting": "bg-amber-100 text-amber-700 border-amber-200",
};
const panelClass = "portal-card";
const secondaryBtnClass = "portal-btn-secondary";

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

function Modal({ item, mode, onClose, onModeChange }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px] z-50 flex items-start justify-center p-6 overflow-auto">
      <div className="w-full max-w-xl mt-10 portal-card overflow-hidden p-0">
        <div className="px-5 py-4 flex items-start justify-between gap-4" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
          <div>
            <div className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold border ${TYPE_STYLES[item.type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{item.type}</div>
            <h3 className="mt-3 text-xl font-bold" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
            <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{new Date(item.startsAt).toLocaleString()}</div>
          </div>
          <button type="button" onClick={onClose} className="portal-link-btn text-sm">Close</button>
        </div>

        <div className="px-5 py-3 flex gap-2" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
          <button type="button" onClick={() => onModeChange("details")} className={`portal-tab ${mode === "details" ? "portal-tab--active" : ""}`}>Details</button>
          <button type="button" onClick={() => onModeChange("files")} className={`portal-tab ${mode === "files" ? "portal-tab--active" : ""}`}>Files</button>
        </div>

        <div className="p-5">
          {mode === "details" && (
            <div className="space-y-3">
              <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>{item.source}</div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}>{item.location || "Location pending"}</div>
              <div className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{item.details}</div>
              {item.videoLink && <a href={item.videoLink} target="_blank" rel="noreferrer" className="portal-link-btn inline-block text-sm">Open video repository</a>}
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
                  className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                  style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
                >
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{file.name || `File ${index + 1}`}</div>
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{file.type || "Attachment"}</div>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>Open</span>
                </a>
              )) : <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>No files attached to this calendar item.</div>}
            </div>
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
    setModalMode(mode === "edit" ? "details" : mode);
  };

  const shiftCursor = (direction) => {
    const next = new Date(cursorDate);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    else if (view === "week") next.setDate(next.getDate() + direction * 7);
    else next.setDate(next.getDate() + direction);
    setCursorDate(startOfDay(next));
  };

  return (
    <div className="portal-page">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="portal-page__eyebrow">Minister Schedule</div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Minister Calendar</h1>
          <p className="text-sm max-w-3xl" style={{ color: "var(--text-secondary)" }}>
            A Google Calendar style view combining DEO-managed calendar entries and minister meetings scheduled by admins from citizen meeting requests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setCursorDate(startOfDay(new Date()))} className={secondaryBtnClass}>Today</button>
          <button type="button" onClick={() => shiftCursor(-1)} className={secondaryBtnClass}>Prev</button>
          <button type="button" onClick={() => shiftCursor(1)} className={secondaryBtnClass}>Next</button>
          {VIEW_OPTIONS.map((option) => (
            <button key={option} type="button" onClick={() => setView(option)} className={`portal-tab ${view === option ? "portal-tab--active" : ""}`}>
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {view === "month"
          ? cursorDate.toLocaleString("default", { month: "long", year: "numeric" })
          : view === "week"
            ? `Week of ${startOfWeek(cursorDate).toLocaleDateString()}`
            : cursorDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </div>

      {error && <div className="portal-alert portal-alert--error">{error}</div>}

      {loading ? (
        <div className="portal-card portal-empty">Loading minister calendar…</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <div className={`${panelClass} overflow-hidden p-0`}>
            {view === "month" && (
              <div>
                <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border-secondary)", background: "var(--bg-secondary)" }}>
                  {DAYS.map((day) => <div key={day} className="px-3 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {monthCells.map((cell) => {
                    const inMonth = cell.date.getMonth() === cursorDate.getMonth();
                    const isToday = isSameDay(cell.date, new Date());
                    return (
                      <div key={cell.date.toISOString()} className="min-h-32 p-2" style={{ borderBottom: "1px solid var(--border-secondary)", borderRight: "1px solid var(--border-secondary)", background: inMonth ? "var(--bg-primary)" : "var(--bg-secondary)" }}>
                        <button type="button" onClick={() => setCursorDate(cell.date)} className={`w-8 h-8 rounded-full text-xs font-semibold ${isToday ? "bg-blue-600 text-white" : ""}`} style={!isToday ? { color: inMonth ? "var(--text-primary)" : "var(--text-tertiary)" } : undefined}>
                          {cell.date.getDate()}
                        </button>
                        <div className="mt-2 space-y-1">
                          {cell.items.slice(0, 3).map((item) => <EventPill key={item.id} item={item} compact onClick={() => openItem(item)} />)}
                          {cell.items.length > 3 && <div className="text-[11px] px-1" style={{ color: "var(--text-tertiary)" }}>+{cell.items.length - 3} more</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "week" && (
              <div>
                <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border-secondary)", background: "var(--bg-secondary)" }}>
                  {weekDays.map((day) => (
                    <div key={day.date.toISOString()} className="px-3 py-3 text-center">
                      <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{DAYS[day.date.getDay()]}</div>
                      <div className={`mt-2 inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-semibold ${isSameDay(day.date, new Date()) ? "bg-blue-600 text-white" : ""}`} style={!isSameDay(day.date, new Date()) ? { color: "var(--text-primary)" } : undefined}>{day.date.getDate()}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 min-h-[520px]">
                  {weekDays.map((day) => (
                    <div key={day.date.toISOString()} className="p-3 space-y-2" style={{ borderRight: "1px solid var(--border-secondary)" }}>
                      {day.items.length === 0 ? <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>No events</div> : day.items.map((item) => <EventPill key={item.id} item={item} onClick={() => openItem(item)} />)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === "day" && (
              <div className="p-4 min-h-[520px]">
                <div className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>{cursorDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
                <div className="space-y-3">
                  {dayItems.length === 0 ? (
                    <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>No events for this day.</div>
                  ) : (
                    dayItems.map((item) => (
                      <button key={item.id} type="button" onClick={() => openItem(item)} className="w-full text-left rounded-2xl p-4" style={{ border: "1px solid var(--border-secondary)", background: "var(--bg-secondary)" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold border ${TYPE_STYLES[item.type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{item.type}</div>
                            <div className="mt-2 font-bold" style={{ color: "var(--text-primary)" }}>{item.title}</div>
                            <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{item.source} · {item.location || "Location pending"}</div>
                          </div>
                          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatTime(item.startsAt)} - {formatTime(item.endsAt)}</div>
                        </div>
                        <div className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>{item.details}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={panelClass}>
            <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-tertiary)" }}>Upcoming Agenda</div>
            <div className="space-y-3">
              {[...normalizedItems].sort((a, b) => a.startDate - b.startDate).slice(0, 12).map((item) => (
                <button key={item.id} type="button" onClick={() => { setCursorDate(startOfDay(item.startDate)); openItem(item); }} className="w-full text-left pb-3 last:border-b-0" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{item.type} · {new Date(item.startsAt).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        item={selectedItem}
        mode={modalMode}
        onClose={() => setSelectedItem(null)}
        onModeChange={setModalMode}
      />
    </div>
  );
}
