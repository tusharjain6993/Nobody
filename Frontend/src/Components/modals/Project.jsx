function Project({ open, teams, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">New Project</h3>
        <p className="text-gray-600 text-sm mb-4">Project creation form can be added here.</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default Project;
