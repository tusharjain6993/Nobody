function Notification({ setOpen }) {
  return (
    <div className="p-4 max-h-80 overflow-auto">
      <h4 className="font-semibold text-gray-800 mb-2">Notifications</h4>
      <p className="text-gray-500 text-sm">No new notifications.</p>
      <button
        onClick={() => setOpen(false)}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        Close
      </button>
    </div>
  );
}

export default Notification;
