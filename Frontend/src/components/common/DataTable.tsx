import { useState, useEffect, useCallback } from "react";
import { mockTradeHistory } from "../../data/mockData";
import { toast } from "sonner";
import { ActionButtons } from "../../components/common/ActionButtons";

// Direct Type mapping mimicking AdminUser parameters
interface TradeItem {
  id: string;
  orderDate: string;
  tradeDate: string;
  pair: string;
  side: "buy" | "sell" | string;
  rate: number;
  amount: number;
  status?: string; // e.g., filled, pending, cancelled
}

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<TradeItem[]>(mockTradeHistory);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Simulated data fetch matching your admin lifecycle
  const fetchTrades = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      // In production, this would call your trade history service
      setTrades(mockTradeHistory);
    } catch (err: any) {
      const msg = "Failed to fetch trade history data";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Debounced search logic matching users/audits page
  useEffect(() => {
    const timer = setTimeout(() => {
      // Handles filtering locally or via API
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredTrades = trades.filter(
    (trade) =>
      trade.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatNumber = (num: number, minDec = 2, maxDec = 6) =>
    num.toLocaleString("en-US", {
      minimumFractionDigits: minDec,
      maximumFractionDigits: maxDec,
    });

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  // Visual side mapping adopting your exact badge design parameters
  const getSideBadge = (side: string | null | undefined) => {
    const s = (side ?? "buy").toLowerCase();
    const map: Record<string, string> = {
      buy: "nex-badge-success",
      sell: "nex-badge-danger",
    };
    return (
      <span className={`nex-badge ${map[s] ?? "nex-badge-warning"}`}>
        {s === "buy" ? "✓ Buy" : "✕ Sell"}
      </span>
    );
  };

  // Status mapping mimicking account status layouts
  const getStatusBadge = (status: string | null | undefined) => {
    const s = (status ?? "filled").toLowerCase();
    const map: Record<string, string> = {
      filled: "nex-badge-success",
      pending: "nex-badge-warning",
      cancelled: "nex-badge-orange",
    };
    return (
      <span className={`nex-badge nex-badge-xs ${map[s] ?? "nex-badge-info"}`}>
        {s.toUpperCase()}
      </span>
    );
  };

  return (
    <main className="nex-admin-section-page">
      {/* 1. Standardized Section Header */}
      <section className="nex-section-header">
        <div>
          <h1>Trade History</h1>
          <p>View, trace, and monitor all executed marketplace transactions</p>
        </div>
      </section>

      {/* 2. Standardized Section Body */}
      <section className="nex-section-body">
        <div className="nex-card">
          {/* 3. Card Title Block with Identical Flex Layout */}
          <div className="nex-card-title">
            <h2>Executed Orders</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by pair or trade ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

          {/* 4. Error Alert View */}
          {error && (
            <div
              style={{
                padding: "1rem",
                marginBottom: "1rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                color: "#ef4444",
              }}
            >
              {error}
              <button
                onClick={fetchTrades}
                style={{
                  marginLeft: "1rem",
                  textDecoration: "underline",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* 5. Loading Dynamic Spinner State */}
          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading trade entries...</p>
            </div>
          ) : (
            /* 6. Pure Table Wrapper to avoid external DataTable abstraction layout pollution */
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Market Pair</th>
                    <th>Execution Side</th>
                    <th>Rate / Pricing</th>
                    <th>Volume Amount</th>
                    <th>Total Value</th>
                    <th>Execution Engine</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="nex-empty-state">
                        <div>
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                          <p>No matching trades found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((trade) => (
                      <tr key={trade.id}>
                        {/* Market Pair Avatar Cell layout (matches user cell structure) */}
                        <td>
                          <div className="nex-user-cell">
                            <div
                              className="nex-avatar-circle"
                              style={{
                                background: "rgba(169,255,232,0.08)",
                                color: "#a9ffe8",
                                border: "1px solid rgba(169,255,232,0.15)",
                              }}
                            >
                              {trade.pair.charAt(0)}
                            </div>
                            <div>
                              <strong>{trade.pair}</strong>
                              <div className="nex-table-meta">
                                ID: {trade.id.substring(0, 12)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Order Side Column */}
                        <td>{getSideBadge(trade.side)}</td>

                        {/* Rate */}
                        <td>
                          <div>${formatNumber(trade.rate, 2, 4)}</div>
                        </td>

                        {/* Amount */}
                        <td>
                          <div>{formatNumber(trade.amount, 2, 6)}</div>
                        </td>

                        {/* Calculated Total Column */}
                        <td>
                          <div style={{ color: "#a9ffe8", fontWeight: 600 }}>
                            ${formatNumber(trade.rate * trade.amount, 2, 2)}
                          </div>
                        </td>

                        {/* Timeline & Engine Verification Metrics */}
                        <td>
                          <div>{formatDate(trade.tradeDate)}</div>
                          <div
                            className="nex-verification-badges"
                            style={{ marginTop: "4px" }}
                          >
                            {getStatusBadge(trade.status)}
                            <span className="nex-badge nex-badge-xs nex-badge-info">
                              Engine V1
                            </span>
                          </div>
                        </td>

                        {/* Actions mapping */}
                        <td>
                          <ActionButtons
                            showView
                            onView={() => console.log("View trade:", trade.id)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. Aligned Bottom Status Bar */}
          {!isLoading && filteredTrades.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderTop: "1px solid rgba(169,255,232,0.12)",
                color: "var(--text-muted)",
                fontSize: "14px",
              }}
            >
              Showing {filteredTrades.length} of {trades.length} trade
              transactions
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
