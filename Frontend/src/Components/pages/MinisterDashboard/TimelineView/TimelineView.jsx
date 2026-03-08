import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { staticTasks } from "../staticData";

/* ---------------- CONFIG ---------------- */
const DAY_START_HOUR  = 10;
const TOTAL_COLUMNS   = 11;
const pixelsPerHour   = 120;

const statusColors = {
  "backlog":     "bg-slate-100 border-slate-300 text-slate-700",
  "postpone":    "bg-amber-100 border-amber-300 text-amber-800",
  "postponed":   "bg-amber-100 border-amber-300 text-amber-800",
  "completed":   "bg-emerald-100 border-emerald-300 text-emerald-800",
  "in progress": "bg-blue-100 border-blue-300 text-blue-800",
  "pending":     "bg-indigo-100 border-indigo-300 text-indigo-800",
  "not started": "bg-gray-100 border-gray-300 text-gray-700",
};

const buildTimelineTasks = (allTasks, selectedDate) =>
  allTasks
    .filter(t => {
      if (!t.start || !t.end) return false;
      const start = new Date(t.start);
      return (
        start.getDate()     === selectedDate.getDate()  &&
        start.getMonth()    === selectedDate.getMonth() &&
        start.getFullYear() === selectedDate.getFullYear()
      );
    })
    .map(t => {
      const start  = new Date(t.start);
      const end    = new Date(t.end);
      const status = (t.status || "in progress").toLowerCase();
      return {
        id:        t._id || t.id,
        title:     t.title || "Untitled Task",
        startDate: start,
        endDate:   end,
        status,
        color: statusColors[status] || statusColors["in progress"],
      };
    });

export default function TimelineView() {
  const scrollRef    = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks,        setTasks]        = useState(() => buildTimelineTasks(staticTasks, new Date()));

  /* Rebuild tasks whenever selectedDate changes */
  useEffect(() => {
    setTasks(buildTimelineTasks(staticTasks, selectedDate));
  }, [selectedDate]);

  /* ---------------- HELPERS ---------------- */
  const getX = (d) =>
    (d.getHours() + d.getMinutes() / 60 - DAY_START_HOUR) * pixelsPerHour;

  const dateFromPixel = (px) => {
    const h = px / pixelsPerHour;
    const d = new Date(selectedDate);
    const totalMinutes = (DAY_START_HOUR + h) * 60;
    d.setHours(Math.floor(totalMinutes / 60));
    d.setMinutes(totalMinutes % 60);
    d.setSeconds(0);
    return d;
  };

  /* ---------------- DRAG / RESIZE (local state only) ---------------- */
  const handleMouseDown = (e, taskId, type) => {
    e.stopPropagation();
    const startX = e.clientX + (scrollRef.current?.scrollLeft || 0);
    const task   = tasks.find(t => t.id === taskId);
    if (!task) return;

    const initialStart = getX(task.startDate);
    const initialEnd   = getX(task.endDate);

    const onMove = (ev) => {
      const currentX = ev.clientX + (scrollRef.current?.scrollLeft || 0);
      const delta    = currentX - startX;

      setTasks(prev =>
        prev.map(t => {
          if (t.id !== taskId) return t;
          let newStart = initialStart;
          let newEnd   = initialEnd;
          if (type === "move")  { newStart += delta; newEnd += delta; }
          if (type === "left")  { newStart += delta; }
          if (type === "right") { newEnd   += delta; }
          if (newEnd - newStart < pixelsPerHour / 2) return t;
          return { ...t, startDate: dateFromPixel(newStart), endDate: dateFromPixel(newEnd) };
        })
      );
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  };

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    if (now.getHours() >= DAY_START_HOUR && now.getHours() < DAY_START_HOUR + TOTAL_COLUMNS) {
      scrollRef.current.scrollLeft = getX(now) - 300;
    }
  }, []);

  const now        = new Date();
  const nowX       = getX(now);
  const totalWidth = TOTAL_COLUMNS * pixelsPerHour;

  return (
    <div className="h-full bg-white flex flex-col font-sans">
      {/* TOP BAR */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-bold text-gray-800">
          {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="border border-gray-300 rounded-md p-1.5 hover:bg-gray-50 transition-colors"
            onClick={() => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; })}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            className="text-xs font-bold px-4 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors uppercase tracking-wider"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </button>

          <button
            className="border border-gray-300 rounded-md p-1.5 hover:bg-gray-50 transition-colors"
            onClick={() => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; })}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* SCROLL AREA */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative custom-scrollbar">
        <div className="flex min-w-max h-full">
          <div className="relative h-full" style={{ width: totalWidth }}>

            {/* TIME HEADER */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-gray-200">
              <div className="flex h-10">
                {Array.from({ length: TOTAL_COLUMNS }).map((_, i) => (
                  <div
                    key={i}
                    style={{ width: pixelsPerHour }}
                    className="text-[10px] font-bold text-gray-400 text-center pt-3 border-l border-gray-200"
                  >
                    {DAY_START_HOUR + i}:00
                  </div>
                ))}
              </div>
            </div>

            {/* TASK ROWS */}
            <div className="relative pt-6 space-y-3 pb-8">
              {tasks.length > 0 ? tasks.map(t => (
                <div key={t.id} className="h-13 relative group px-1">
                  <div
                    className={`absolute h-12 rounded-lg border border-gray-200 shadow-sm flex items-stretch overflow-hidden transition-shadow group-hover:shadow-md ${t.color || 'bg-white'} cursor-grab active:cursor-grabbing z-10`}
                    style={{
                      left:  Math.max(0, getX(t.startDate)),
                      width: Math.max(getX(t.endDate) - getX(t.startDate), 100),
                    }}
                    onMouseDown={(e) => handleMouseDown(e, t.id, "move")}
                  >
                    {/* ACCENT BAR */}
                    <div className="w-1 bg-black/20 shrink-0" />

                    {/* CONTENT */}
                    <div className="flex-1 flex flex-col justify-center px-3 py-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-bold text-gray-800 text-[12px] leading-tight capitalize">
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-gray-500/80">
                          {t.startDate.getHours()}:{t.startDate.getMinutes().toString().padStart(2, '0')} - {t.endDate.getHours()}:{t.endDate.getMinutes().toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* HANDLES */}
                    <div className="absolute left-0 top-0 w-2 h-full cursor-w-resize z-20" onMouseDown={(e) => handleMouseDown(e, t.id, "left")} />
                    <div className="absolute right-0 top-0 w-2 h-full cursor-e-resize z-20" onMouseDown={(e) => handleMouseDown(e, t.id, "right")} />
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-400 text-sm mt-10">No tasks for today</div>
              )}
            </div>

            {/* NOW LINE */}
            {selectedDate.toDateString() === new Date().toDateString() && (
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-500 z-0 pointer-events-none"
                style={{ left: nowX }}
              >
                <div className="absolute top-10 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
