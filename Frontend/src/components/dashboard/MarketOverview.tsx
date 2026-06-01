export default function MarketOverview() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Market Overview</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-950 p-4">BTC / USD</div>
        <div className="rounded-2xl bg-slate-950 p-4">ETH / USD</div>
        <div className="rounded-2xl bg-slate-950 p-4">SOL / USD</div>
      </div>
    </section>
  );
}
