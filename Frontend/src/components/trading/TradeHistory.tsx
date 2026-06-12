import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
}

interface TradeHistoryProps {
  symbol: string;
  trades: Trade[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ symbol, trades }) => {
  const [marketTrades, setMarketTrades] = useState<Trade[]>([]);

  // Generate sample market trades
  useEffect(() => {
    const generateTrades = () => {
      const newTrades: Trade[] = [];
      const basePrice = 47000;

      for (let i = 0; i < 20; i++) {
        const priceVariation = (Math.random() - 0.5) * 200;
        const price = basePrice + priceVariation;
        const quantity = Math.random() * 2 + 0.01;
        const type = Math.random() > 0.5 ? 'buy' : 'sell';

        newTrades.push({
          id: `market-${Date.now()}-${i}`,
          type,
          price,
          quantity: parseFloat(quantity.toFixed(4)),
          timestamp: Date.now() - (i * 1000),
        });
      }

      setMarketTrades(newTrades);
    };

    generateTrades();
    const interval = setInterval(() => {
      // Add new random trade
      const basePrice = 47000;
      const priceVariation = (Math.random() - 0.5) * 100;
      const price = basePrice + priceVariation;
      const quantity = Math.random() * 1 + 0.01;
      const type = Math.random() > 0.5 ? 'buy' : 'sell';

      const newTrade: Trade = {
        id: `market-${Date.now()}`,
        type,
        price,
        quantity: parseFloat(quantity.toFixed(4)),
        timestamp: Date.now(),
      };

      setMarketTrades(prev => [newTrade, ...prev.slice(0, 49)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [symbol]);

  const allTrades = [...trades, ...marketTrades].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 text-xs text-gray-400 border-b border-gray-700">
        <div className="flex-1 text-left">Time</div>
        <div className="flex-1 text-center">Price</div>
        <div className="flex-1 text-right">Size</div>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto">
        {allTrades.slice(0, 100).map((trade, index) => (
          <div
            key={trade.id}
            className={`flex items-center px-2 py-1 text-xs hover:bg-gray-700/50 transition-colors ${
              index === 0 && trades.includes(trade) ? 'bg-blue-500/20' : ''
            }`}
          >
            <div className="flex-1 text-left text-gray-400">
              {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: false })}
            </div>
            <div className={`flex-1 text-center font-mono ${
              trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trade.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </div>
            <div className="flex-1 text-right text-white">
              {trade.quantity.toFixed(4)}
            </div>
          </div>
        ))}

        {allTrades.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No trades available
          </div>
        )}
      </div>

      {/* Trade Summary */}
      <div className="border-t border-gray-700 p-2 bg-gray-800">
        <div className="text-xs text-gray-400 mb-1">24h Summary</div>
        <div className="flex justify-between text-xs">
          <div className="text-green-400">
            ↑ {marketTrades.filter(t => t.type === 'buy').length}
          </div>
          <div className="text-red-400">
            ↓ {marketTrades.filter(t => t.type === 'sell').length}
          </div>
          <div className="text-gray-300">
            Vol: {marketTrades.reduce((sum, t) => sum + t.quantity, 0).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};