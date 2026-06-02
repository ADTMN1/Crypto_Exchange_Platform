export default function OrderList() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Recent Orders</h2>
      <div className="space-y-3 text-center text-slate-500">
        <div className="rounded-2xl bg-slate-950 p-4">No recent orders</div>
      </div>
    </section>
  );
}
