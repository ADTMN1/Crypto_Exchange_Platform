import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  type IChartApi, 
  type ISeriesApi, 
  type CandlestickData, 
  type LineData,
  type Time,
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode
} from 'lightweight-charts';
import { useWebSocketPrice } from '../../hooks/useWebSocketPrice';
import { calculateEMA, calculateRSI, calculateMACD } from '../../utils/technicalIndicators';
import { TradingControls } from './TradingControls';
import { OrderLines } from './OrderLines';
import { ChartIndicators } from './ChartIndicators';
import { PriceAlert } from './PriceAlert';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
}

interface Order {
  id: string;
  type: 'limit' | 'stop';
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  filled?: number;
  status: 'pending' | 'filled' | 'cancelled';
}

interface TradingChartProps {
  symbol: string;
  interval: string;
  height?: number;
  onTrade?: (trade: Trade) => void;
  onOrderPlace?: (order: Omit<Order, 'id'>) => void;
  orders?: Order[];
  trades?: Trade[];
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  interval = '1m',
  height = 600,
  onTrade,
  onOrderPlace,
  orders = [],
  trades = []
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  // Indicator series
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [showIndicators, setShowIndicators] = useState({
    ema: true,
    rsi: true,
    macd: true,
    volume: true
  });
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<'market' | 'limit' | 'stop'>('limit');

  // WebSocket for real-time price updates
  const { price, isConnected } = useWebSocketPrice(symbol);

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
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
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

      // Add volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // Add EMA series
      const emaSeries = chart.addLineSeries({
        color: '#ffd700',
        lineWidth: 2,
        title: 'EMA(21)',
      });

      // Add RSI on separate pane
      const rsiSeries = chart.addLineSeries({
        color: '#ff9800',
        lineWidth: 2,
        priceScaleId: 'rsi',
        title: 'RSI(14)',
      });

      chart.priceScale('rsi').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        mode: PriceScaleMode.Percentage,
      });

      // Add MACD series
      const macdSeries = chart.addLineSeries({
        color: '#2196f3',
        lineWidth: 2,
        priceScaleId: 'macd',
        title: 'MACD',
      });

      const macdSignalSeries = chart.addLineSeries({
        color: '#ff5722',
        lineWidth: 2,
        priceScaleId: 'macd',
        title: 'Signal',
      });

      const macdHistogramSeries = chart.addHistogramSeries({
        color: '#9c27b0',
        priceScaleId: 'macd',
        title: 'Histogram',
      });

      chart.priceScale('macd').applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });

      // Store references
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      volumeSeriesRef.current = volumeSeries;
      emaSeriesRef.current = emaSeries;
      rsiSeriesRef.current = rsiSeries;
      macdSeriesRef.current = macdSeries;
      macdSignalSeriesRef.current = macdSignalSeries;
      macdHistogramSeriesRef.current = macdHistogramSeries;

      // Handle chart clicks for order placement
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

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        // Try to fetch from backend API
        let candleData: CandlestickData[] = [];
        let volData: any[] = [];

        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/market/klines/${symbol}?interval=${interval}&limit=1000`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              candleData = data.data.map((kline: any) => ({
                time: (kline.openTime / 1000) as Time,
                open: parseFloat(kline.open),
                high: parseFloat(kline.high),
                low: parseFloat(kline.low),
                close: parseFloat(kline.close),
              }));

              volData = data.data.map((kline: any) => ({
                time: (kline.openTime / 1000) as Time,
                value: parseFloat(kline.volume),
                color: parseFloat(kline.close) >= parseFloat(kline.open) ? '#00d4aa' : '#ff6b6b',
              }));
            }
          }
        } catch (apiError) {
          console.warn('API not available, using mock data:', apiError);
        }

        // Fallback to mock data if API fails
        if (candleData.length === 0) {
          const now = Math.floor(Date.now() / 1000);
          let basePrice = 47000;

          for (let i = 0; i < 100; i++) {
            const time = (now - (100 - i) * 60) as Time; // 1 minute intervals
            const variation = (Math.random() - 0.5) * 1000;
            const open = basePrice;
            const close = basePrice + variation;
            const high = Math.max(open, close) + Math.random() * 200;
            const low = Math.min(open, close) - Math.random() * 200;
            
            candleData.push({
              time,
              open,
              high,
              low,
              close,
            });

            volData.push({
              time,
              value: Math.random() * 10 + 1,
              color: close >= open ? '#00d4aa' : '#ff6b6b',
            });

            basePrice = close;
          }
        }

        setChartData(candleData);
        setVolumeData(volData);

        // Update chart series
        if (candlestickSeriesRef.current && candleData.length > 0) {
          candlestickSeriesRef.current.setData(candleData);
        }
        if (volumeSeriesRef.current && showIndicators.volume && volData.length > 0) {
          volumeSeriesRef.current.setData(volData);
        }

        // Calculate and update indicators
        if (candleData.length > 0) {
          updateIndicators(candleData);
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();
  }, [symbol, interval, showIndicators.volume]);

  // Update indicators
  const updateIndicators = useCallback((data: CandlestickData[]) => {
    const prices = data.map(d => d.close);
    const times = data.map(d => d.time);

    // EMA
    if (showIndicators.ema && emaSeriesRef.current) {
      const emaValues = calculateEMA(prices, 21);
      const emaData: LineData[] = emaValues.map((value, index) => ({
        time: times[index],
        value: value || 0,
      })).filter(d => d.value > 0);
      emaSeriesRef.current.setData(emaData);
    }

    // RSI
    if (showIndicators.rsi && rsiSeriesRef.current) {
      const rsiValues = calculateRSI(prices, 14);
      const rsiData: LineData[] = rsiValues.map((value, index) => ({
        time: times[index],
        value: value || 0,
      })).filter(d => d.value > 0);
      rsiSeriesRef.current.setData(rsiData);
    }

    // MACD
    if (showIndicators.macd && macdSeriesRef.current && macdSignalSeriesRef.current && macdHistogramSeriesRef.current) {
      const macdData = calculateMACD(prices);
      
      const macdLineData: LineData[] = macdData.macd.map((value, index) => ({
        time: times[index],
        value: value || 0,
      })).filter(d => d.value !== 0);

      const signalLineData: LineData[] = macdData.signal.map((value, index) => ({
        time: times[index],
        value: value || 0,
      })).filter(d => d.value !== 0);

      const histogramData = macdData.histogram.map((value, index) => ({
        time: times[index],
        value: value || 0,
        color: (value || 0) >= 0 ? '#00d4aa' : '#ff6b6b',
      })).filter(d => d.value !== 0);

      macdSeriesRef.current.setData(macdLineData);
      macdSignalSeriesRef.current.setData(signalLineData);
      macdHistogramSeriesRef.current.setData(histogramData);
    }
  }, [showIndicators]);

  // Handle real-time price updates
  useEffect(() => {
    if (price && candlestickSeriesRef.current && chartData.length > 0) {
      const lastCandle = chartData[chartData.length - 1];
      const currentTime = Math.floor(Date.now() / 1000) as Time;
      
      // Update the last candle or create a new one
      const updatedCandle: CandlestickData = {
        time: currentTime,
        open: lastCandle.close,
        high: Math.max(lastCandle.close, price),
        low: Math.min(lastCandle.close, price),
        close: price,
      };

      candlestickSeriesRef.current.update(updatedCandle);
      setCurrentPrice(price);
    }
  }, [price, chartData]);

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

  const handleOrderPlace = (orderData: Omit<Order, 'id'>) => {
    if (onOrderPlace) {
      onOrderPlace(orderData);
    }
  };

  const handleIndicatorToggle = (indicator: keyof typeof showIndicators) => {
    setShowIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  };

  return (
    <div className="flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">{symbol.toUpperCase()}</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-lg font-mono text-green-400">
            ${currentPrice.toFixed(2)}
          </div>
        </div>
        
        <ChartIndicators 
          showIndicators={showIndicators}
          onToggle={handleIndicatorToggle}
        />
      </div>

      {/* Main Chart Container */}
      <div className="relative flex-1">
        <div ref={chartContainerRef} className="w-full h-full" />
        
        {/* Order Lines Overlay */}
        <OrderLines 
          chart={chartRef.current}
          orders={orders}
          onOrderUpdate={(orderId, updates) => {
            // Handle order updates
            console.log('Order update:', orderId, updates);
          }}
        />

        {/* Price Alerts */}
        <PriceAlert 
          currentPrice={currentPrice}
          alerts={[]}
          onAlertCreate={(price, type) => {
            console.log('Create alert:', price, type);
          }}
        />
      </div>

      {/* Trading Controls */}
      <TradingControls
        currentPrice={currentPrice}
        selectedOrderType={selectedOrderType}
        onOrderTypeChange={setSelectedOrderType}
        onOrderPlace={handleOrderPlace}
        isDrawingMode={isDrawingMode}
        onDrawingModeToggle={() => setIsDrawingMode(!isDrawingMode)}
      />

      {/* Trade Markers */}
      {trades.map((trade) => {
        // This would add markers to the chart for executed trades
        // Implementation would involve using chart.addMarker or similar
        return null;
      })}
    </div>
  );
};
