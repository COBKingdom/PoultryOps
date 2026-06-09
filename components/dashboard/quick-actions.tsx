export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="font-bold mb-4">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <button className="border rounded p-3">
          Add Flock
        </button>

        <button className="border rounded p-3">
          Record Eggs
        </button>

        <button className="border rounded p-3">
          Record Feed
        </button>

        <button className="border rounded p-3">
          Record Expense
        </button>
      </div>
    </div>
  );
}