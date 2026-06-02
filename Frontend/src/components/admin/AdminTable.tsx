export default function AdminTable() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Admin Table</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-800 px-4 py-3">Name</th>
              <th className="border-b border-slate-800 px-4 py-3">Role</th>
              <th className="border-b border-slate-800 px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={3}
                className="border-b border-slate-800 px-4 py-3 text-center text-slate-500"
              >
                No users found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
