export default function OrderBook() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Order Book</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 rounded-2xl bg-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-800" />
      </div>
    </section>
  );
}
