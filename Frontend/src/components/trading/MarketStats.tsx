import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Volume, DollarSign } from 'lucide-react';
import { useWebSocketPrice } from '../../hooks/useWebSocketPrice';

interface MarketStatsProps {
  symbol: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeQuote24h: number;
  marketCap?: number;
  circulatingSupply?: number;
}

export const MarketStats: React.FC<MarketStatsProps> = ({ symbol }) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const { priceData, isConnected } = useWebSocketPrice(symbol);

  useEffect(() => {
    // Fetch initial market data
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        // This would typically fetch from your backend
        // const response = await fetch(`/api/market/stats/${symbol}`);
        // const data = await response.json();
        
        // Sample data for demo
        const sampleData: MarketData = {
          symbol: symbol,
          price: 47000,
          change24h: 1250,
          changePercent24h: 2.73,
          high24h: 48500,
          low24h: 45800,
          volume24h: 1234.56,
          volumeQuote24h: 58000000,
          marketCap: 925000000000,
          circulatingSupply: 19700000,
        };
        
        setMarketData(sampleData);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [symbol]);

  // Update price from WebSocket
  useEffect(() => {
    if (priceData && marketData) {
      setMarketData(prev => prev ? {
        ...prev,
        price: priceData.price,
        change24h: priceData.change,
        changePercent24h: priceData.changePercent,
      } : null);
    }
  }, [priceData, marketData]);

  if (loading || !marketData) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const isPositive = marketData.changePercent24h >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
  const changeIcon = isPositive ? TrendingUp : TrendingDown;

  const stats = [
    {
      label: 'Price',
      value: `$${marketData.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: `${isPositive ? '+' : ''}${marketData.changePercent24h.toFixed(2)}%`,
      changeColor,
      icon: DollarSign,
    },
    {
      label: '24h High',
      value: `$${marketData.high24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      subValue: `+${((marketData.high24h - marketData.price) / marketData.price * 100).toFixed(2)}%`,
    },
    {
      label: '24h Low',
      value: `$${marketData.low24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      subValue: `${((marketData.low24h - marketData.price) / marketData.price * 100).toFixed(2)}%`,
    },
    {
      label: '24h Volume',
      value: `${marketData.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      subValue: `$${(marketData.volumeQuote24h / 1000000).toFixed(1)}M`,
      icon: Volume,
    },
  ];

  if (marketData.marketCap) {
    stats.push({
      label: 'Market Cap',
      value: `$${(marketData.marketCap / 1000000000).toFixed(1)}B`,
      subValue: marketData.circulatingSupply ? `${(marketData.circulatingSupply / 1000000).toFixed(1)}M supply` : undefined,
    });
  }

  return (
    <div className="p-4 space-y-4">
      {/* Connection Status */}
      <div className="flex items-center space-x-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-gray-400">
          {isConnected ? 'Real-time data' : 'Connection lost'}
        </span>
      </div>

      {/* Price and Change */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xl font-bold text-white">
            ${marketData.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center space-x-1 ${changeColor}`}>
            {React.createElement(changeIcon, { className: 'w-4 h-4' })}
            <span className="font-medium">
              {marketData.changePercent24h.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {isPositive ? '+' : ''}{marketData.change24h.toFixed(2)} (24h)
        </div>
      </div>

      {/* Market Stats */}
      <div className="space-y-3">
        {stats.slice(1).map((stat, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-b-0">
            <div className="flex items-center space-x-2">
              {stat.icon && React.createElement(stat.icon, { 
                className: 'w-4 h-4 text-gray-400' 
              })}
              <span className="text-sm text-gray-400">{stat.label}</span>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${stat.changeColor || 'text-white'}`}>
                {stat.value}
              </div>
              {stat.change && (
                <div className={`text-xs ${stat.changeColor}`}>
                  {stat.change}
                </div>
              )}
              {stat.subValue && (
                <div className="text-xs text-gray-500">
                  {stat.subValue}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Volume Breakdown */}
      <div className="bg-gray-700/30 rounded-lg p-3">
        <h4 className="text-sm font-medium text-white mb-2">Volume Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Base Volume</span>
            <span className="text-white">{marketData.volume24h.toFixed(2)} BTC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Quote Volume</span>
            <span className="text-white">${(marketData.volumeQuote24h / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Avg. Trade Size</span>
            <span className="text-white">
              {(marketData.volume24h / 1000).toFixed(3)} BTC
            </span>
          </div>
        </div>
      </div>

      {/* Price Range Visualization */}
      <div className="bg-gray-700/30 rounded-lg p-3">
        <h4 className="text-sm font-medium text-white mb-3">24h Range</h4>
        <div className="relative">
          <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-green-500"
              style={{ width: '100%' }}
            />
          </div>
          <div 
            className="absolute top-0 w-1 h-2 bg-white rounded"
            style={{ 
              left: `${((marketData.price - marketData.low24h) / (marketData.high24h - marketData.low24h)) * 100}%` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>${marketData.low24h.toLocaleString()}</span>
          <span>${marketData.high24h.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};