import { memo, useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  CrosshairMode,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';

export interface ChartPoint {
  time: number; // Unix timestamp ms
  price: number;
}

interface TradingChartProps {
  data: ChartPoint[];
  symbol?: string;
  currentPrice?: number | null;
}

const TradingChart = memo(({ data, symbol = 'BTCUSDT', currentPrice }: TradingChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Line'> | null>(null);

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: '#111827' },
        textColor: '#6B7280',
      },
      grid: {
        vertLines: { color: '#1F2937', style: LineStyle.Dashed },
        horzLines: { color: '#1F2937', style: LineStyle.Dashed },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#1F2937',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1F2937',
        timeVisible: true,
        secondsVisible: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      color: '#F7931A',
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: '#F7931A',
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, []);

  // Push new data point incrementally (or full reset)
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;

    // lightweight-charts v5 time must be in seconds for UTCTimestamp
    const lineData = data.map(d => ({
      time:  Math.floor(d.time / 1000) as unknown as number,
      value: d.price,
    }));

    seriesRef.current.setData(lineData as any);
    chartRef.current?.timeScale().scrollToRealTime();
  }, [data]);

  const ticker = symbol.replace('USDT', '');

  return (
    <div className="trading-chart-card">
      <div className="trading-chart-header">
        <div>
          <h3 className="trading-chart-title">{ticker}/USDT</h3>
          <span className="trading-chart-sub">Live Price Chart · Last {data.length} points</span>
        </div>
        <div className="trading-chart-price">
          {currentPrice
            ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '—'
          }
        </div>
      </div>

      {data.length < 2 ? (
        <div className="trading-chart-empty">
          <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
          <span>Connecting to live stream…</span>
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%' }} />
      )}
    </div>
  );
});

TradingChart.displayName = 'TradingChart';
export default TradingChart;
