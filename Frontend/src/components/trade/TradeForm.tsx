export default function TradeForm() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Quick Trade</h2>
      <form className="space-y-4">
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          placeholder="Amount"
        />
        <button className="w-full rounded-xl bg-[#4CF4A5] py-3 text-sm font-semibold text-[#0d0d0d] hover:bg-[#3bcca0]">
          Place Order
        </button>
      </form>
    </section>
  );
}
