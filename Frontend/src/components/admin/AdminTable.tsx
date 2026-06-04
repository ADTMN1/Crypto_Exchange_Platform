/**
 * @deprecated This component has been replaced by DataTable
 * 
 * Please use the new generic DataTable component instead:
 * 
 * import { DataTable } from '../common/DataTable';
 * 
 * See DATATABLE_DOCS.md for complete documentation
 * See src/pages/admin/UsersPage.tsx for example usage
 */

export default function AdminTable() {
  return (
    <div className="rounded-3xl border border-orange-800 bg-orange-900/20 p-6">
      <div className="mb-4 flex items-start gap-3">
        <svg
          className="h-6 w-6 flex-shrink-0 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h2 className="text-xl font-semibold text-orange-500">
            Component Deprecated
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            This <code className="rounded bg-slate-800 px-2 py-1 font-mono text-orange-400">AdminTable</code> component has been replaced by the new generic{' '}
            <code className="rounded bg-slate-800 px-2 py-1 font-mono text-blue-400">DataTable</code> component.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>
              <strong className="text-white">New import:</strong>{' '}
              <code className="rounded bg-slate-800 px-2 py-1 font-mono text-xs">
                import &#123; DataTable &#125; from '../common/DataTable';
              </code>
            </p>
            <p>
              <strong className="text-white">Documentation:</strong> See{' '}
              <code className="rounded bg-slate-800 px-2 py-1 font-mono text-xs">
                DATATABLE_DOCS.md
              </code>
            </p>
            <p>
              <strong className="text-white">Example:</strong> See{' '}
              <code className="rounded bg-slate-800 px-2 py-1 font-mono text-xs">
                src/pages/admin/UsersPage.tsx
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
