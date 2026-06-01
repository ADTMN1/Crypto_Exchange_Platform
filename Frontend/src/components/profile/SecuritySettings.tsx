export default function SecuritySettings() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Security Settings</h2>
      <div className="space-y-4">
        <button className="w-full rounded-xl border border-slate-700 py-3 hover:bg-slate-800">
          Change Password
        </button>
        <button className="w-full rounded-xl border border-slate-700 py-3 hover:bg-slate-800">
          Enable 2FA
        </button>
      </div>
    </section>
  );
}
