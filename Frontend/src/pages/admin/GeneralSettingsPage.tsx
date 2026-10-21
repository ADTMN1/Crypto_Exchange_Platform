import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { tradingGateService, type TradingGateDetails } from '../../services/trading-gate.service';

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(d));

const fmtRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hrs   < 24) return `${hrs}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return fmtDate(d);
};

export default function GeneralSettingsPage() {
  const [gate, setGate]               = useState<TradingGateDetails | null>(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setAction]    = useState<'open' | 'close' | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const fetchGate = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      setGate(await tradingGateService.getDetails());
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load trading gate details';
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGate(); }, [fetchGate]);

  const handleToggle = async () => {
    const action = isOpen ? 'close' : 'open';
    try {
      setAction(action);
      const res = action === 'close'
        ? await tradingGateService.closeGate()
        : await tradingGateService.openGate();
      setGate(res);
      toast.success(`Trading gate ${action}d successfully`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action} trading gate`);
    } finally {
      setAction(null);
    }
  };

  if (loading) {
    return (
      <main className="nex-admin-section-page">
        <section className="nex-section-header">
          <div><h1>General Settings</h1><p>Configure fundamental system settings and trading controls</p></div>
        </section>
        <div className="nex-loading"><div className="nex-spinner" /><p>Loading settings…</p></div>
      </main>
    );
  }

  if (error && !gate) {
    return (
      <main className="nex-admin-section-page">
        <section className="nex-section-header">
          <div><h1>General Settings</h1><p>Configure fundamental system settings and trading controls</p></div>
        </section>
        <div className="nex-empty-state">
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p>{error}</p>
          <button className="mu-clear-search-btn" onClick={fetchGate}>Try Again</button>
        </div>
      </main>
    );
  }

  const isOpen = gate?.status === 'open';

  return (
    <main className="nex-admin-section-page">

      {/* ── Page header ── */}
      <section className="nex-section-header">
        <div>
          <h1>General Settings</h1>
          <p>Configure fundamental system settings and trading controls</p>
        </div>
        <button className="dep-refresh-btn" onClick={fetchGate} disabled={actionLoading !== null}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </section>

      <section className="nex-section-body">
        <div className="gs-layout">

          {/* ── Status cards row ── */}
          <div className="gs-card-grid">

            {/* Main status card */}
            <div className={`gs-status-card${isOpen ? ' gs-status-card--open' : ' gs-status-card--closed'}`}>
              <div className="gs-status-header">
                <div className="gs-status-indicator">
                  <span className={`gs-dot${isOpen ? ' gs-dot--green' : ' gs-dot--red'}`} />
                  <h2>Trading Gate</h2>
                </div>
                <span className={`stp-badge ${isOpen ? 'stp-badge--resolved' : 'stp-badge--high'}`}>
                  {isOpen ? 'ACTIVE' : 'SUSPENDED'}
                </span>
              </div>
              <div className="gs-status-value">{isOpen ? 'Open' : 'Closed'}</div>
              <p className="gs-status-desc">
                {isOpen
                  ? 'All trading operations are currently active'
                  : 'Trading operations are currently suspended'}
              </p>
            </div>

            {/* Last updated */}
            <div className="gs-info-card">
              <div className="gs-info-icon">🕐</div>
              <div className="gs-info-body">
                <span className="gs-info-label">Last Updated</span>
                <span className="gs-info-val">{gate?.changedAt ? fmtRelative(gate.changedAt) : '—'}</span>
                <span className="gs-info-meta">{gate?.changedAt ? fmtDate(gate.changedAt) : ''}</span>
              </div>
            </div>

            {/* Updated by */}
            <div className="gs-info-card">
              <div className="gs-info-icon">👤</div>
              <div className="gs-info-body">
                <span className="gs-info-label">Updated By</span>
                <span className="gs-info-val">{gate?.changedBy || '—'}</span>
                <span className="gs-info-meta">Administrator</span>
              </div>
            </div>

            {/* Toggle button card */}
            <div className="gs-action-card">
              <button
                className={`gs-toggle-btn${isOpen ? ' gs-toggle-btn--close' : ' gs-toggle-btn--open'}`}
                onClick={handleToggle}
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <><div className="gs-btn-spinner" />{actionLoading === 'close' ? 'Closing…' : 'Opening…'}</>
                ) : (
                  <>{isOpen ? '🔴' : '🟢'} {isOpen ? 'Close Trading' : 'Open Trading'}</>
                )}
              </button>
            </div>
          </div>

          {/* ── Detail table ── */}
          <div className="nex-card gs-detail-card">
            <div className="nex-card-title">
              <h2>Trading Gate Information</h2>
              <span className="mu-date-ago">Detailed configuration</span>
            </div>
            <div className="mu-table-wrap">
              <table className="mu-table gs-info-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Value</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="gs-prop-cell">
                        <span>🚦</span> Current Status
                      </div>
                    </td>
                    <td><strong>{gate?.status || '—'}</strong></td>
                    <td>
                      <span className={`stp-badge ${isOpen ? 'stp-badge--resolved' : 'stp-badge--high'}`}>
                        {isOpen ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="gs-prop-cell">
                        <span>👤</span> Last Modified By
                      </div>
                    </td>
                    <td>{gate?.changedBy || '—'}</td>
                    <td><span className="stp-badge stp-badge--inprogress">Admin</span></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="gs-prop-cell">
                        <span>📅</span> Last Modified
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{gate?.changedAt ? fmtDate(gate.changedAt) : '—'}</td>
                    <td>
                      <span className="stp-badge stp-badge--closed">
                        {gate?.changedAt ? fmtRelative(gate.changedAt) : '—'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="gs-prop-cell">
                        <span>🔑</span> Gate ID
                      </div>
                    </td>
                    <td><span className="wdp-mono">{gate?.id || '—'}</span></td>
                    <td><span className="stp-badge stp-badge--inprogress">System</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Info panel ── */}
          <div className="gs-info-panel">
            <div className="gs-panel-header">
              <span>ℹ️</span>
              <h4>Trading Gate Information</h4>
            </div>
            <ul className="gs-info-list">
              <li><strong>Open:</strong> All users can place trades and execute orders</li>
              <li><strong>Closed:</strong> Trading is suspended for regular users, admins retain access</li>
              <li><strong>Audit Trail:</strong> All status changes are logged with user information and timestamps</li>
              <li><strong>Emergency Use:</strong> Use during system maintenance or critical market conditions</li>
            </ul>
          </div>

        </div>
      </section>
    </main>
  );
}
