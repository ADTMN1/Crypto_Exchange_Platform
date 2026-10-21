import { useCallback, useEffect, useState } from 'react';
import adminService, { AuditLog } from '../../services/admin.service';
import { toast } from 'sonner';

const fmtDate = (v: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(v));

const fmtDateShort = (v: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(v));

function fmtMeta(meta: any): string {
  if (meta == null) return '—';
  if (typeof meta === 'string') return meta;
  try { return JSON.stringify(meta); } catch { return String(meta); }
}

export default function AdminAudit() {
  const [audits, setAudits]   = useState<AuditLog[]>([]);
  const [isLoading, setLoad]  = useState(true);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [error, setError]     = useState<string | null>(null);
  const LIMIT = 20;

  const fetch = useCallback(async (p: number, s: string) => {
    setLoad(true); setError(null);
    try {
      const res = await adminService.getAuditLogs({ page: p, limit: LIMIT, search: s || undefined });
      setAudits(res.data);
      setTotal(res.totalCount);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to fetch audit logs';
      setError(msg); toast.error(msg);
    } finally { setLoad(false); }
  }, []);

  useEffect(() => { fetch(page, search); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1, search); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const initials = (a: AuditLog) =>
    (a.user_name?.[0] || a.user_email?.[0] || '?').toUpperCase();

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Audit Logs</h1>
          <p>Inspect platform activity, changes, and compliance events.</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card mu-card">

          {/* ── Toolbar ── */}
          <div className="mu-toolbar">
            <span className="mu-count">{total} log{total !== 1 ? 's' : ''}</span>
            <div className="mu-search-wrap">
              <svg className="mu-search-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="mu-search-input" type="text"
                placeholder="Action, user, IP…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="mu-search-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
          </div>

          {error && (
            <div className="nex-error-bar">
              {error}
              <button className="nex-error-retry" onClick={() => fetch(page, search)}>Retry</button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading"><div className="nex-spinner"/><p>Loading audit logs…</p></div>

          ) : audits.length === 0 ? (
            <div className="nex-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p>No audit logs found</p>
              {search && <button className="mu-clear-search-btn" onClick={() => setSearch('')}>Clear search</button>}
            </div>

          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="mu-table-wrap">
                <table className="mu-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>IP</th>
                      <th>Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map(a => (
                      <tr key={a.id} className="mu-table-row" style={{ cursor: 'default' }}>
                        <td><span className="mu-date">{fmtDate(a.created_at)}</span></td>
                        <td>
                          <div className="mu-user-cell">
                            <div className="mu-avatar">{initials(a)}</div>
                            <div className="mu-user-text">
                              <span className="mu-username">{a.user_name || 'Unknown'}</span>
                              <span className="mu-email">{a.user_email || a.user_id || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="au-action">{a.action}</span>
                        </td>
                        <td>
                          <span className="au-entity">{a.entity_type || '—'}</span>
                          {a.entity_id && <span className="mu-date-ago">{a.entity_id}</span>}
                        </td>
                        <td><span className="lh-mono">{a.ip_address || '—'}</span></td>
                        <td>
                          <span className="au-meta" title={fmtMeta(a.metadata)}>
                            {fmtMeta(a.metadata)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="mu-card-list">
                {audits.map(a => (
                  <div key={a.id} className="mu-user-card">
                    <div className="mu-card-row">
                      <div className="mu-avatar mu-avatar--lg">{initials(a)}</div>
                      <div className="mu-card-info">
                        <span className="mu-username">{a.user_name || 'Unknown'}</span>
                        <span className="mu-email">{a.user_email || a.user_id || '—'}</span>
                        <span className="au-action" style={{ marginTop: 4, display: 'block' }}>
                          {a.action}
                        </span>
                      </div>
                    </div>
                    <div className="lh-card-details">
                      {a.entity_type && (
                        <div className="lh-detail-row">
                          <span className="lh-detail-key">Entity</span>
                          <span className="au-entity">{a.entity_type}{a.entity_id ? ` · ${a.entity_id}` : ''}</span>
                        </div>
                      )}
                      {a.ip_address && (
                        <div className="lh-detail-row">
                          <span className="lh-detail-key">IP</span>
                          <span className="lh-mono">{a.ip_address}</span>
                        </div>
                      )}
                      {fmtMeta(a.metadata) !== '—' && (
                        <div className="lh-detail-row lh-detail-row--meta">
                          <span className="lh-detail-key">Meta</span>
                          <span className="au-meta">{fmtMeta(a.metadata)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mu-card-footer">
                      <span className="mu-date-ago">{fmtDateShort(a.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {!isLoading && audits.length > 0 && (
            <div className="dep-pagination">
              <span className="mu-count">Page {page} of {totalPages} · {total} total</span>
              <div className="dep-page-btns">
                <button className="dep-page-btn" disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>
                <button className="dep-page-btn" disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
