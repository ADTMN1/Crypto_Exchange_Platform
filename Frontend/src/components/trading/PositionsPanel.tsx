import React, { useState } from 'react';
import { X, Settings, Eye, EyeOff } from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface Order {
  id: string;
  type: 'limit' | 'stop';
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  filled?: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
}

interface PositionsPanelProps {
  positions: Position[];
  orders: Order[];
  onOrderCancel: (orderId: string) => void;
  onPositionClose?: (positionId: string) => void;
}

type TabType = 'positions' | 'orders' | 'history';

export const PositionsPanel: React.FC<PositionsPanelProps> = ({
  positions,
  orders,
  onOrderCancel,
  onPositionClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('positions');
  const [showPnL, setShowPnL] = useState(true);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'positions', label: 'Positions', count: positions.length },
    { key: 'orders', label: 'Open Orders', count: orders.filter(o => o.status === 'pending').length },
    { key: 'history', label: 'Order History', count: orders.filter(o => o.status !== 'pending').length },
  ];

  const activeOrders = orders.filter(o => o.status === 'pending');
  const orderHistory = orders.filter(o => o.status !== 'pending');
  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  const renderPositions = () => (
    <div className="space-y-2">
      {positions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No open positions
        </div>
      ) : (
        <>
          {/* PnL Summary */}
          <div className="bg-gray-700/30 rounded p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total Unrealized PnL</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPnL(!showPnL)}
                  className="text-gray-400 hover:text-white"
                  title={showPnL ? 'Hide PnL' : 'Show PnL'}
                >
                  {showPnL ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {showPnL && (
                  <span className={`font-mono font-bold ${
                    totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {positions.map((position) => (
            <div key={position.id} className="bg-gray-800 rounded p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">{position.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    position.side === 'long' 
                      ? 'bg-green-600/20 text-green-400' 
                      : 'bg-red-600/20 text-red-400'
                  }`}>
                    {position.side.toUpperCase()}
                  </span>
                </div>
                {onPositionClose && (
                  <button
                    onClick={() => onPositionClose(position.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Close Position"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white ml-2">{position.size}</span>
                </div>
                <div>
                  <span className="text-gray-400">Entry Price:</span>
                  <span className="text-white ml-2">${position.entryPrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Current Price:</span>
                  <span className="text-white ml-2">${position.currentPrice.toLocaleString()}</span>
                </div>
                {showPnL && (
                  <div>
                    <span className="text-gray-400">PnL:</span>
                    <span className={`ml-2 font-mono ${
                      position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-2">
      {activeOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No open orders
        </div>
      ) : (
        activeOrders.map((order) => (
          <div key={order.id} className="bg-gray-800 rounded p-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  order.side === 'buy' 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-red-600/20 text-red-400'
                }`}>
                  {order.side.toUpperCase()}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400">
                  {order.type.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => onOrderCancel(order.id)}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Cancel Order"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Price:</span>
                <span className="text-white ml-2">${order.price.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white ml-2">{order.quantity}</span>
              </div>
              <div>
                <span className="text-gray-400">Filled:</span>
                <span className="text-white ml-2">{order.filled || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Total:</span>
                <span className="text-white ml-2">${(order.price * order.quantity).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-400">
              Created: {new Date(order.timestamp).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-2">
      {orderHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No order history
        </div>
      ) : (
        orderHistory.slice(0, 20).map((order) => (
          <div key={order.id} className="bg-gray-800 rounded p-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  order.side === 'buy' 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-red-600/20 text-red-400'
                }`}>
                  {order.side.toUpperCase()}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400">
                  {order.type.toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  order.status === 'filled' 
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-red-600/20 text-red-400'
                }`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Price:</span>
                <span className="text-white ml-2">${order.price.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white ml-2">{order.quantity}</span>
              </div>
              <div>
                <span className="text-gray-400">Filled:</span>
                <span className="text-white ml-2">{order.filled || order.quantity}</span>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-400">
              {new Date(order.timestamp).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-gray-600 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'positions' && renderPositions()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'history' && renderHistory()}
      </div>
    </div>
  );
};