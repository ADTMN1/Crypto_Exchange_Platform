import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { tradingGateService, type TradingGateDetails } from '../../services/trading-gate.service';

export default function GeneralSettingsPage() {
  const [gateDetails, setGateDetails] = useState<TradingGateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'open' | 'close' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGateDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await tradingGateService.getDetails();
      setGateDetails(details);
    } catch (err: any) {
      console.error('Failed to fetch gate details:', err);
      setError(err.response?.data?.message || 'Failed to load trading gate details');
      toast.error('Failed to load trading gate details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGateDetails();
  }, [fetchGateDetails]);

  const handleOpenGate = async () => {
    try {
      setActionLoading('open');
      const response = await tradingGateService.openGate();
      setGateDetails(response);
      // Use the message from backend response
      toast.success('Trading gate opened successfully');
    } catch (err: any) {
      console.error('Failed to open gate:', err);
      // Use backend error message if available
      const errorMessage = err.response?.data?.message || 'Failed to open trading gate';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseGate = async () => {
    try {
      setActionLoading('close');
      const response = await tradingGateService.closeGate();
      setGateDetails(response);
      // Use the message from backend response
      toast.success('Trading gate closed successfully');
    } catch (err: any) {
      console.error('Failed to close gate:', err);
      // Use backend error message if available
      const errorMessage = err.response?.data?.message || 'Failed to close trading gate';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(dateString));
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <main className="nex-admin-section-page">
        <section className="nex-section-header">
          <div>
            <h1>General Settings</h1>
            <p>Configure fundamental system settings and trading controls</p>
          </div>
        </section>

        <section className="nex-section-body">
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner" />
              <div className="loading-text">Loading general settings...</div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error && !gateDetails) {
    return (
      <main className="nex-admin-section-page">
        <section className="nex-section-header">
          <div>
            <h1>General Settings</h1>
            <p>Configure fundamental system settings and trading controls</p>
          </div>
        </section>

        <section className="nex-section-body">
          <div className="error-container">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <h3>Error Loading Settings</h3>
              <p>{error}</p>
              <button onClick={fetchGateDetails} className="nex-btn nex-btn-primary">
                Try Again
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const isOpen = gateDetails?.status === 'open';

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>General Settings</h1>
          <p>Configure fundamental system settings and trading controls</p>
        </div>
        <div className="header-actions">
          <button
            onClick={fetchGateDetails}
            disabled={actionLoading !== null}
            className="nex-btn nex-btn-secondary nex-btn-sm refresh-btn"
          >
            <span className="btn-icon">🔄</span>
            Refresh
          </button>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="settings-layout">
          
          {/* Trading Gate Status Overview */}
          <div className="status-overview">
            <div className="status-card-grid">
              
              {/* Main Status Card */}
              <div className={`status-card main-status ${isOpen ? 'status-open' : 'status-closed'}`}>
                <div className="status-card-header">
                  <div className="status-indicator">
                    <div className={`status-dot ${isOpen ? 'dot-green' : 'dot-red'}`}></div>
                    <h2>Trading Gate</h2>
                  </div>
                  <div className={`status-badge ${isOpen ? 'badge-success' : 'badge-danger'}`}>
                    {isOpen ? 'ACTIVE' : 'SUSPENDED'}
                  </div>
                </div>
                <div className="status-card-content">
                  <div className="status-value">
                    {isOpen ? 'Open' : 'Closed'}
                  </div>
                  <div className="status-description">
                    {isOpen 
                      ? 'All trading operations are currently active' 
                      : 'Trading operations are currently suspended'
                    }
                  </div>
                </div>
              </div>

              {/* Last Updated Card */}
              <div className="status-card info-card">
                <div className="card-icon">
                  <span>🕐</span>
                </div>
                <div className="card-content">
                  <div className="card-label">Last Updated</div>
                  <div className="card-value">
                    {gateDetails?.changedAt ? formatRelativeTime(gateDetails.changedAt) : 'Unknown'}
                  </div>
                  <div className="card-meta">
                    {gateDetails?.changedAt ? formatDate(gateDetails.changedAt) : ''}
                  </div>
                </div>
              </div>

              {/* Updated By Card */}
              <div className="status-card info-card">
                <div className="card-icon">
                  <span>👤</span>
                </div>
                <div className="card-content">
                  <div className="card-label">Updated By</div>
                  <div className="card-value">
                    {gateDetails?.changedBy || 'Unknown'}
                  </div>
                  <div className="card-meta">Administrator</div>
                </div>
              </div>

              {/* Action Button */}
              <div className="action-card">
                <button
                  onClick={isOpen ? handleCloseGate : handleOpenGate}
                  disabled={actionLoading !== null}
                  className={`action-button ${isOpen ? 'btn-danger' : 'btn-success'}`}
                  title={isOpen ? 'Click to close trading gate' : 'Click to open trading gate'}
                >
                  {actionLoading ? (
                    <>
                      <div className="button-spinner" />
                      <span>{actionLoading === 'close' ? 'Closing...' : 'Opening...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="button-icon">
                        {isOpen ? '🔴' : '🟢'}
                      </span>
                      <span>{isOpen ? 'Close Trading' : 'Open Trading'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Trading Gate Information Table */}
          <div className="info-section">
            <div className="section-header">
              <h3>Trading Gate Information</h3>
              <p>Detailed information about the current trading gate configuration</p>
            </div>
            
            <div className="info-table-container">
              <table className="info-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="property-cell">
                        <span className="property-icon">🚦</span>
                        <span>Current Status</span>
                      </div>
                    </td>
                    <td>
                      <span className="property-value">{gateDetails?.status || 'Unknown'}</span>
                    </td>
                    <td>
                      <span className={`status-chip ${isOpen ? 'chip-success' : 'chip-danger'}`}>
                        {isOpen ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="property-cell">
                        <span className="property-icon">👤</span>
                        <span>Last Modified By</span>
                      </div>
                    </td>
                    <td>
                      <span className="property-value">{gateDetails?.changedBy || 'Unknown'}</span>
                    </td>
                    <td>
                      <span className="status-chip chip-info">Administrator</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="property-cell">
                        <span className="property-icon">📅</span>
                        <span>Last Modified Date</span>
                      </div>
                    </td>
                    <td>
                      <span className="property-value">
                        {gateDetails?.changedAt ? formatDate(gateDetails.changedAt) : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className="status-chip chip-neutral">
                        {gateDetails?.changedAt ? formatRelativeTime(gateDetails.changedAt) : 'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="property-cell">
                        <span className="property-icon">🔑</span>
                        <span>Gate ID</span>
                      </div>
                    </td>
                    <td>
                      <span className="property-value monospace">{gateDetails?.id || 'Unknown'}</span>
                    </td>
                    <td>
                      <span className="status-chip chip-info">System</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Information Panel */}
          <div className="info-panel">
            <div className="panel-header">
              <span className="panel-icon">ℹ️</span>
              <h4>Trading Gate Information</h4>
            </div>
            <div className="panel-content">
              <ul className="info-list">
                <li>
                  <strong>Open Status:</strong> All users can place trades and execute orders
                </li>
                <li>
                  <strong>Closed Status:</strong> Trading is suspended for regular users, admins retain access
                </li>
                <li>
                  <strong>Audit Trail:</strong> All status changes are logged with user information and timestamps
                </li>
                <li>
                  <strong>Emergency Use:</strong> Use during system maintenance or critical market conditions
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      <style>{`
        /* ===== LOADING STYLES ===== */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(169, 255, 232, 0.2);
          border-top: 3px solid #a9ffe8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          font-weight: 500;
        }

        /* ===== ERROR STYLES ===== */
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .error-content {
          text-align: center;
          max-width: 400px;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-content h3 {
          color: #ef4444;
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .error-content p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }

        /* ===== MAIN LAYOUT ===== */
        .settings-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-icon {
          font-size: 0.875rem;
        }

        /* ===== STATUS OVERVIEW ===== */
        .status-overview {
          margin-bottom: 0;
        }

        .status-card-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .status-card-grid {
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
        }

        @media (max-width: 640px) {
          .status-card-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        /* ===== STATUS CARDS ===== */
        .status-card {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(169, 255, 232, 0.15);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .status-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(169, 255, 232, 0.5), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .status-card:hover::before {
          opacity: 1;
        }

        .status-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
          border-color: rgba(169, 255, 232, 0.25);
        }

        /* Main Status Card */
        .main-status {
          grid-row: span 2;
        }

        .status-open::before {
          background: linear-gradient(90deg, transparent, #22c55e, transparent);
        }

        .status-closed::before {
          background: linear-gradient(90deg, transparent, #ef4444, transparent);
        }

        .status-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-indicator h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .dot-green {
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
        }

        .dot-red {
          background: #ef4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
        }

        .status-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-success {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .badge-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .status-value {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          line-height: 1;
        }

        .status-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          line-height: 1.4;
        }

        /* Info Cards */
        .info-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(169, 255, 232, 0.15), rgba(169, 255, 232, 0.05));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .card-content {
          flex: 1;
          min-width: 0;
        }

        .card-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.25rem;
        }

        .card-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          line-height: 1.2;
          word-break: break-word;
        }

        .card-meta {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 0.25rem;
        }

        /* Action Card */
        .action-card {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .action-button {
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .action-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .action-button:hover::before {
          left: 100%;
        }

        .btn-success {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
        }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .button-icon {
          font-size: 1.1rem;
        }

        /* ===== INFO SECTION ===== */
        .info-section {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(169, 255, 232, 0.12);
          border-radius: 16px;
          padding: 2rem;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .section-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }

        .section-header p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        .info-table-container {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(169, 255, 232, 0.08);
          border-radius: 12px;
          overflow: hidden;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
        }

        .info-table th {
          background: rgba(169, 255, 232, 0.05);
          padding: 1rem 1.5rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(169, 255, 232, 0.1);
        }

        .info-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(169, 255, 232, 0.05);
          vertical-align: middle;
        }

        .info-table tr:last-child td {
          border-bottom: none;
        }

        .info-table tr:hover {
          background: rgba(169, 255, 232, 0.02);
        }

        .property-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .property-icon {
          font-size: 1.2rem;
        }

        .property-value {
          color: white;
          font-weight: 500;
        }

        .monospace {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
        }

        .status-chip {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .chip-success {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }

        .chip-danger {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        .chip-info {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.25);
        }

        .chip-neutral {
          background: rgba(156, 163, 175, 0.15);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.25);
        }

        /* ===== INFO PANEL ===== */
        .info-panel {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02));
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .panel-icon {
          font-size: 1.25rem;
        }

        .panel-header h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
        }

        .panel-content {
          color: rgba(255, 255, 255, 0.8);
        }

        .info-list {
          margin: 0;
          padding-left: 1.25rem;
          line-height: 1.6;
        }

        .info-list li {
          margin-bottom: 0.5rem;
        }

        .info-list li:last-child {
          margin-bottom: 0;
        }

        .info-list strong {
          color: white;
        }

        /* ===== ANIMATIONS ===== */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        /* ===== RESPONSIVE DESIGN ===== */
        @media (max-width: 768px) {
          .settings-layout {
            gap: 1.5rem;
          }

          .status-card {
            padding: 1.25rem;
          }

          .main-status {
            grid-row: span 1;
          }

          .status-value {
            font-size: 1.75rem;
          }

          .info-section {
            padding: 1.5rem;
          }

          .info-table th,
          .info-table td {
            padding: 1rem;
          }

          .section-header h3 {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .status-card {
            padding: 1rem;
          }

          .card-icon {
            width: 40px;
            height: 40px;
            font-size: 1.25rem;
          }

          .action-button {
            padding: 0.875rem 1.25rem;
            font-size: 0.9rem;
          }

          .info-table th,
          .info-table td {
            padding: 0.75rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </main>
  );
}