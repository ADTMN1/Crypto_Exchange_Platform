import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart } from 'lucide-react';

interface MockTradingChartProps {
  symbol: string;
  interval: string;
  height?: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const MockTradingChart: React.FC<MockTradingChartProps> = ({
  symbol,
  interval,
  height = 600
}) => {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(47000);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock candlestick data
  useEffect(() => {
    const generateMockData = () => {
      const data: CandleData[] = [];
      let basePrice = 47000;
      const now = Date.now();

      for (let i = 0; i < 100; i++) {
        const time = now - (100 - i) * 60000; // 1 minute intervals
        const variation = (Math.random() - 0.5) * 1000;
        const open = basePrice;
        const close = basePrice + variation;
        const high = Math.max(open, close) + Math.random() * 200;
        const low = Math.min(open, close) - Math.random() * 200;
        const volume = Math.random() * 10 + 1;

        data.push({
          time,
          open,
          high,
          low,
          close,
          volume,
        });

        basePrice = close;
      }

      setChartData(data);
      setCurrentPrice(basePrice);
      setPriceChange((basePrice - 47000) / 47000 * 100);
      setIsLoading(false);
    };

    generateMockData();

    // Simulate real-time updates
    const interval_id = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return prev;
        
        const lastCandle = prev[prev.length - 1];
        const variation = (Math.random() - 0.5) * 200;
        const newPrice = lastCandle.close + variation;
        
        const updatedData = [...prev];
        updatedData[updatedData.length - 1] = {
          ...lastCandle,
          close: newPrice,
          high: Math.max(lastCandle.high, newPrice),
          low: Math.min(lastCandle.low, newPrice),
        };

        setCurrentPrice(newPrice);
        setPriceChange((newPrice - 47000) / 47000 * 100);

        return updatedData;
      });
    }, 2000);

    return () => clearInterval(interval_id);
  }, [symbol, interval]);

  const renderCandlestick = (candle: CandleData, index: number) => {
    const isGreen = candle.close >= candle.open;
    const bodyHeight = Math.abs(candle.close - candle.open);
    const wickTop = candle.high - Math.max(candle.open, candle.close);
    const wickBottom = Math.min(candle.open, candle.close) - candle.low;
    
    // Normalize values for display (simplified)
    const maxPrice = Math.max(...chartData.map(d => d.high));
    const minPrice = Math.min(...chartData.map(d => d.low));
    const priceRange = maxPrice - minPrice;
    
    const normalizedHigh = ((candle.high - minPrice) / priceRange) * (height - 100);
    const normalizedLow = ((candle.low - minPrice) / priceRange) * (height - 100);
    const normalizedOpen = ((candle.open - minPrice) / priceRange) * (height - 100);
    const normalizedClose = ((candle.close - minPrice) / priceRange) * (height - 100);

    return (
      <div
        key={index}
        className="relative inline-block"
        style={{ width: '8px', height: `${height - 100}px` }}
      >
        {/* Wick */}
        <div
          className="absolute bg-gray-400 left-1/2 transform -translate-x-1/2"
          style={{
            width: '1px',
            height: `${normalizedHigh - normalizedLow}px`,
            bottom: `${normalizedLow}px`,
          }}
        />
        {/* Body */}
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 ${
            isGreen ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{
            width: '6px',
            height: `${Math.abs(normalizedClose - normalizedOpen)}px`,
            bottom: `${Math.min(normalizedOpen, normalizedClose)}px`,
          }}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-900 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <div className="text-white">Loading chart data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">{symbol.toUpperCase()}</h2>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-mono text-white">
              ${currentPrice.toFixed(2)}
            </div>
            <div className={`flex items-center space-x-1 ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? 
                <TrendingUp className="w-5 h-5" /> : 
                <TrendingDown className="w-5 h-5" />
              }
              <span className="font-medium">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <BarChart className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-gray-400">Mock Chart</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative flex-1 bg-gray-900 p-4" style={{ height: `${height - 80}px` }}>
        {/* Grid Background */}
        <div 
          className="absolute inset-4 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, #374151 1px, transparent 1px),
              linear-gradient(to bottom, #374151 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Price Labels */}
        <div className="absolute right-0 top-4 bottom-4 w-16 flex flex-col justify-between text-xs text-gray-400">
          {Array.from({ length: 5 }, (_, i) => {
            const maxPrice = Math.max(...chartData.map(d => d.high));
            const minPrice = Math.min(...chartData.map(d => d.low));
            const priceStep = (maxPrice - minPrice) / 4;
            const price = maxPrice - (i * priceStep);
            
            return (
              <div key={i} className="text-right">
                ${price.toFixed(0)}
              </div>
            );
          })}
        </div>

        {/* Candlestick Chart */}
        <div className="flex items-end justify-start h-full overflow-x-auto space-x-1 pb-8">
          {chartData.slice(-50).map((candle, index) => renderCandlestick(candle, index))}
        </div>

        {/* Time Labels */}
        <div className="absolute bottom-0 left-4 right-16 h-8 flex justify-between items-center text-xs text-gray-400">
          {Array.from({ length: 5 }, (_, i) => {
            const timeIndex = Math.floor((chartData.length - 50) + (i * 50 / 4));
            const candle = chartData[Math.max(0, Math.min(timeIndex, chartData.length - 1))];
            
            if (!candle) return <div key={i}></div>;
            
            const time = new Date(candle.time);
            return (
              <div key={i}>
                {time.getHours()}:{time.getMinutes().toString().padStart(2, '0')}
              </div>
            );
          })}
        </div>

        {/* Volume Bar Chart */}
        <div className="absolute bottom-8 left-4 right-16 h-16 flex items-end justify-start space-x-1 opacity-60">
          {chartData.slice(-50).map((candle, index) => {
            const maxVolume = Math.max(...chartData.map(d => d.volume));
            const volumeHeight = (candle.volume / maxVolume) * 60;
            
            return (
              <div
                key={index}
                className={`w-2 ${candle.close >= candle.open ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ height: `${volumeHeight}px` }}
              />
            );
          })}
        </div>
      </div>

      {/* Chart Info */}
      <div className="bg-gray-800 border-t border-gray-700 p-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Interval: {interval}</span>
            <span>Volume: {chartData[chartData.length - 1]?.volume.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>H: ${Math.max(...chartData.slice(-50).map(d => d.high)).toFixed(2)}</span>
            <span>L: ${Math.min(...chartData.slice(-50).map(d => d.low)).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};