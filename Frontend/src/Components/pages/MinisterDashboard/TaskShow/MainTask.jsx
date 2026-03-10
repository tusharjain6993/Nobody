import React from 'react';

function MainTask() {
  return (
    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-600 shadow-sm mt-6 h-[220px] flex flex-col items-center justify-center">
      <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">Task overview</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md text-center">
        This block previously showed static sample tasks. It is now ready to be wired to real assignment data from the system.
      </p>
    </div>
  );
}

export default MainTask;
