import React from "react";

export default function TimelineView() {
  return (
    <div className="h-full bg-white dark:bg-slate-800 flex flex-col items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-600">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        Timeline view
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs text-center">
        This area will show a real-time meeting and task timeline once we have live scheduling data. Static demo data has been removed.
      </p>
    </div>
  );
}
