import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  type IChartApi, 
  type ISeriesApi, 
  type CandlestickData, 
  type Time,
  ColorType,
  CrosshairMode,
  LineStyle
} from 'lightweight-charts';

interface SimpleTradingChartProps {
  symbol: string;
  interval: string;
  height?: number;
}

export const SimpleTradingChart: React.FC<SimpleTradingChartProps> = ({
  symbol,
  interval = '1m',
  height = 600
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { type: ColorType.Solid, color: '#161a1e' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#2a2e39' },
          horzLines: { color: '#2a2e39' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: '#758696',
            width: 1,
            style: LineStyle.Dashed,
          },
          horzLine: {
            color: '#758696',
            width: 1,
            style: LineStyle.Dashed,
          },
        },
        rightPriceScale: {
          borderColor: '#2a2e39',
        },
        timeScale: {
          borderColor: '#2a2e39',
          timeVisible: true,
          secondsVisible: false,
        },
        watermark: {
          visible: true,
          fontSize: 48,
          horzAlign: 'center',
          vertAlign: 'center',
          color: 'rgba(171, 71, 188, 0.3)',
          text: symbol.toUpperCase(),
        },
      });

      // Add main candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00d4aa',
        downColor: '#ff6b6b',
        borderDownColor: '#ff6b6b',
        borderUpColor: '#00d4aa',
        wickDownColor: '#ff6b6b',
        wickUpColor: '#00d4aa',
      });

      // Store references
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;

      // Handle chart clicks
      chart.subscribeCrosshairMove((param) => {
        if (param.point && param.time && param.seriesData) {
          const price = param.seriesData.get(candlestickSeries);
          if (price && typeof price === 'object' && 'close' in price) {
            setCurrentPrice(price.close as number);
          }
        }
      });

      // Cleanup
      return () => {
        if (chart) {
          chart.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, [symbol, height]);

  // Generate mock data
  useEffect(() => {
    const generateMockData = () => {
      const now = Math.floor(Date.now() / 1000);
      let basePrice = 47000;
      const mockData: CandlestickData[] = [];

      for (let i = 0; i < 100; i++) {
        const time = (now - (100 - i) * 60) as Time; // 1 minute intervals
        const variation = (Math.random() - 0.5) * 1000;
        const open = basePrice;
        const close = basePrice + variation;
        const high = Math.max(open, close) + Math.random() * 200;
        const low = Math.min(open, close) - Math.random() * 200;
        
        mockData.push({
          time,
          open,
          high,
          low,
          close,
        });

        basePrice = close;
      }

      setChartData(mockData);
      setCurrentPrice(basePrice);

      // Update chart with data
      if (candlestickSeriesRef.current && mockData.length > 0) {
        candlestickSeriesRef.current.setData(mockData);
      }
    };

    generateMockData();
    
    // Update data periodically
    const interval_id = setInterval(() => {
      if (chartData.length > 0) {
        const lastPrice = chartData[chartData.length - 1].close;
        const variation = (Math.random() - 0.5) * 200;
        const newPrice = lastPrice + variation;
        const now = Math.floor(Date.now() / 1000) as Time;
        
        const newCandle: CandlestickData = {
          time: now,
          open: lastPrice,
          high: Math.max(lastPrice, newPrice) + Math.random() * 50,
          low: Math.min(lastPrice, newPrice) - Math.random() * 50,
          close: newPrice,
        };

        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.update(newCandle);
        }
        
        setCurrentPrice(newPrice);
      }
    }, 2000);

    return () => clearInterval(interval_id);
  }, [symbol, interval, chartData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">{symbol.toUpperCase()}</h2>
          <div className="text-lg font-mono text-green-400">
            ${currentPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative flex-1">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
