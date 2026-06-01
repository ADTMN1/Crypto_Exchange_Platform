export default function WalletSummary() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Wallet Summary</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-950 p-4">Available balance</div>
        <div className="rounded-2xl bg-slate-950 p-4">Locked balance</div>
      </div>
    </section>
  );
}
