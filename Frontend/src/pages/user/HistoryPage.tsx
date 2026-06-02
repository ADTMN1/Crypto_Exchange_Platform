import { useState, useEffect } from 'react';
import { FaHistory, FaFilter, FaDownload, FaArrowUp, FaArrowDown, FaExchangeAlt, FaSearch } from 'react-icons/fa';
import historyService, { Transaction, Trade, Order } from '../../services/history.service';

type HistoryType = 'all' | 'deposits' | 'withdrawals' | 'trades' | 'orders';
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<HistoryType>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // Fetch data based on active tab
      switch (activeTab) {
        case 'all':
          const allTransactions = await historyService.getTransactions({ limit: 50 });
          setTransactions(allTransactions.data);
          break;
        
        case 'deposits':
          const deposits = await historyService.getTransactions({ type: 'deposit', limit: 50 });
          setTransactions(deposits.data);
          break;
        
        case 'withdrawals':
          const withdrawals = await historyService.getTransactions({ type: 'withdrawal', limit: 50 });
          setTransactions(withdrawals.data);
          break;
        
        case 'trades':
          const tradesData = await historyService.getTrades({ limit: 50 });
          setTrades(tradesData.data);
          break;
        
        case 'orders':
          const ordersData = await historyService.getOrders({ limit: 50 });
          setOrders(ordersData.data);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      // Keep empty arrays on error
      setTransactions([]);
      setTrades([]);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: TransactionStatus | Order['status']) => {
    switch (status) {
      case 'completed':
      case 'filled':
        return 'status-success';
      case 'pending':
      case 'open':
      case 'partially_filled':
        return 'status-pending';
      case 'failed':
      case 'cancelled':
        return 'status-error';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (value: string | number, decimals: number = 8) => {
    return parseFloat(value.toString()).toFixed(decimals);
  };

  const exportHistory = () => {
    // TODO: Implement CSV export
    alert('Export functionality coming soon!');
  };

  const renderTransactions = () => {
    const filtered = transactions.filter(tx => 
      activeTab === 'all' || 
      activeTab === 'deposits' && tx.type === 'deposit' ||
      activeTab === 'withdrawals' && tx.type === 'withdrawal'
    );

    if (filtered.length === 0) {
      return (
        <div className="empty-state">
          <FaHistory size={48} style={{ color: '#666', marginBottom: '1rem' }} />
          <p>No transactions found</p>
        </div>
      );
    }

    return (
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Currency</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Date</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <div className="type-cell">
                    {tx.type === 'deposit' ? (
                      <>
                        <FaArrowDown className="icon-deposit" />
                        <span>Deposit</span>
                      </>
                    ) : (
                      <>
                        <FaArrowUp className="icon-withdrawal" />
                        <span>Withdrawal</span>
                      </>
                    )}
                  </div>
                </td>
                <td><strong>{tx.currency}</strong></td>
                <td>
                  <span className={tx.type === 'deposit' ? 'amount-positive' : 'amount-negative'}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatNumber(tx.amount, 6)}
                  </span>
                </td>
                <td>{formatNumber(tx.fee, 6)}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td>{formatDate(tx.created_at)}</td>
                <td>
                  {tx.tx_hash && (
                    <button 
                      className="btn-link"
                      onClick={() => window.open(`https://blockchain.com/tx/${tx.tx_hash}`, '_blank')}
                    >
                      View TX
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTrades = () => {
    if (trades.length === 0) {
      return (
        <div className="empty-state">
          <FaExchangeAlt size={48} style={{ color: '#666', marginBottom: '1rem' }} />
          <p>No trades found</p>
        </div>
      );
    }

    return (
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Side</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Total</th>
              <th>Fee</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id}>
                <td><strong>{trade.pair}</strong></td>
                <td>
                  <span className={`side-badge ${trade.side === 'buy' ? 'side-buy' : 'side-sell'}`}>
                    {trade.side.toUpperCase()}
                  </span>
                </td>
                <td>{formatNumber(trade.price, 2)} {trade.quote_currency}</td>
                <td>{formatNumber(trade.quantity, 6)} {trade.base_currency}</td>
                <td>{formatNumber(trade.total, 2)} {trade.quote_currency}</td>
                <td>{formatNumber(trade.fee, 4)} {trade.quote_currency}</td>
                <td>{formatDate(trade.executed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOrders = () => {
    if (orders.length === 0) {
      return (
        <div className="empty-state">
          <FaHistory size={48} style={{ color: '#666', marginBottom: '1rem' }} />
          <p>No orders found</p>
        </div>
      );
    }

    return (
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Type</th>
              <th>Side</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Filled</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.pair}</strong></td>
                <td><span className="type-badge">{order.type}</span></td>
                <td>
                  <span className={`side-badge ${order.side === 'buy' ? 'side-buy' : 'side-sell'}`}>
                    {order.side.toUpperCase()}
                  </span>
                </td>
                <td>{order.price ? `${formatNumber(order.price, 2)} ${order.quote_currency}` : 'Market'}</td>
                <td>{formatNumber(order.quantity, 6)} {order.base_currency}</td>
                <td>{formatNumber(order.filled_qty, 6)} {order.base_currency}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{formatDate(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'trades':
        return renderTrades();
      case 'orders':
        return renderOrders();
      case 'all':
      case 'deposits':
      case 'withdrawals':
        return renderTransactions();
      default:
        return null;
    }
  };

  return (
    <main className="history-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaHistory className="title-icon" />
            Transaction History
          </h1>
          <p className="page-subtitle">
            View your complete transaction, trade, and order history
          </p>
        </div>
        <button className="btn-export" onClick={exportHistory}>
          <FaDownload /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="date-filter"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="history-tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          className={`tab ${activeTab === 'deposits' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          <FaArrowDown /> Deposits
        </button>
        <button
          className={`tab ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <FaArrowUp /> Withdrawals
        </button>
        <button
          className={`tab ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          <FaExchangeAlt /> Trades
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FaFilter /> Orders
        </button>
      </div>

      {/* Content */}
      <div className="history-content">
        {renderContent()}
      </div>
    </main>
  );
}
