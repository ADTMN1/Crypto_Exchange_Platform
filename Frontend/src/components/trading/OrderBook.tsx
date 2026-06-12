import React, { useState, useEffect } from 'react';
import { useWebSocketPrice } from '../../hooks/useWebSocketPrice';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookProps {
  symbol: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ symbol }) => {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [spread, setSpread] = useState<number>(0);
  const [spreadPercent, setSpreadPercent] = useState<number>(0);
  const { isConnected } = useWebSocketPrice(symbol);

  // Generate sample order book data
  useEffect(() => {
    const generateOrderBook = () => {
      const basePrice = 47000; // Sample BTC price
      const sampleBids: OrderBookEntry[] = [];
      const sampleAsks: OrderBookEntry[] = [];

      let total = 0;
      for (let i = 0; i < 15; i++) {
        const price = basePrice - (i + 1) * 10;
        const quantity = Math.random() * 5 + 0.1;
        total += quantity;
        sampleBids.push({
          price,
          quantity: parseFloat(quantity.toFixed(4)),
          total: parseFloat(total.toFixed(4)),
        });
      }

      total = 0;
      for (let i = 0; i < 15; i++) {
        const price = basePrice + (i + 1) * 10;
        const quantity = Math.random() * 5 + 0.1;
        total += quantity;
        sampleAsks.push({
          price,
          quantity: parseFloat(quantity.toFixed(4)),
          total: parseFloat(total.toFixed(4)),
        });
      }

      setBids(sampleBids);
      setAsks(sampleAsks.reverse());
      
      // Calculate spread
      const bestBid = sampleBids[0]?.price || 0;
      const bestAsk = sampleAsks[sampleAsks.length - 1]?.price || 0;
      const spreadValue = bestAsk - bestBid;
      const spreadPercentValue = ((spreadValue / bestAsk) * 100);
      
      setSpread(spreadValue);
      setSpreadPercent(spreadPercentValue);
    };

    generateOrderBook();
    const interval = setInterval(generateOrderBook, 1000); // Update every second

    return () => clearInterval(interval);
  }, [symbol]);

  const maxBidTotal = Math.max(...bids.map(bid => bid.total));
  const maxAskTotal = Math.max(...asks.map(ask => ask.total));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 text-xs text-gray-400 border-b border-gray-700">
        <div className="flex-1 text-left">Price</div>
        <div className="flex-1 text-right">Size</div>
        <div className="flex-1 text-right">Total</div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Asks (Sell Orders) */}
        <div className="flex-1 overflow-y-auto">
          {asks.map((ask, index) => {
            const fillPercent = (ask.total / maxAskTotal) * 100;
            return (
              <div
                key={index}
                className="relative flex items-center px-2 py-1 text-xs hover:bg-gray-700/50 cursor-pointer"
              >
                <div
                  className="absolute inset-0 bg-red-500/10"
                  style={{ width: `${fillPercent}%` }}
                />
                <div className="flex-1 text-red-400 font-mono">
                  {ask.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="flex-1 text-right text-white">
                  {ask.quantity.toFixed(4)}
                </div>
                <div className="flex-1 text-right text-gray-400">
                  {ask.total.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Spread */}
        <div className="bg-gray-800 border-y border-gray-600 p-2 text-center">
          <div className="text-gray-400 text-xs">Spread</div>
          <div className="text-white font-mono text-sm">
            {spread.toFixed(2)} ({spreadPercent.toFixed(4)}%)
          </div>
          <div className="flex items-center justify-center space-x-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="flex-1 overflow-y-auto">
          {bids.map((bid, index) => {
            const fillPercent = (bid.total / maxBidTotal) * 100;
            return (
              <div
                key={index}
                className="relative flex items-center px-2 py-1 text-xs hover:bg-gray-700/50 cursor-pointer"
              >
                <div
                  className="absolute inset-0 bg-green-500/10"
                  style={{ width: `${fillPercent}%` }}
                />
                <div className="flex-1 text-green-400 font-mono">
                  {bid.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="flex-1 text-right text-white">
                  {bid.quantity.toFixed(4)}
                </div>
                <div className="flex-1 text-right text-gray-400">
                  {bid.total.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};