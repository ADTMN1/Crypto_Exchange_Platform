export default function OrderFilters() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="mb-4 text-lg font-semibold">Filters</h3>
      <div className="space-y-3">
        <button className="w-full rounded-xl border border-slate-700 py-3 text-left hover:bg-slate-800">
          Open
        </button>
        <button className="w-full rounded-xl border border-slate-700 py-3 text-left hover:bg-slate-800">
          Filled
        </button>
      </div>
    </div>
  );
}
