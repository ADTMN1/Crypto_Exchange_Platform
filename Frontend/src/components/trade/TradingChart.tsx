import { memo, useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  CrosshairMode,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
} from 'lightweight-charts';
import type { HistoryPoint } from '../../services/market.api';

interface TradeCandleChartProps {
  data: HistoryPoint[];
  symbol: string;
  liveCandle?: HistoryPoint | null;
}

const TradeCandleChart = memo(({ data, symbol, liveCandle }: TradeCandleChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: '#0D0D0D' },
        textColor: '#6B7280',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1A1A1A', style: LineStyle.Solid },
        horzLines: { color: '#1A1A1A', style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#F7931A', labelBackgroundColor: '#F7931A' },
        horzLine: { color: '#F7931A', labelBackgroundColor: '#F7931A' },
      },
      rightPriceScale: {
        borderColor: '#1A1A1A',
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: '#1A1A1A',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale:  { mouseWheel: true, pinch: true },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:          '#00C076',
      downColor:        '#FF4D4F',
      borderUpColor:    '#00C076',
      borderDownColor:  '#FF4D4F',
      wickUpColor:      '#00C076',
      wickDownColor:    '#FF4D4F',
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

  // Load historical data
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;
    const candles: CandlestickData[] = data.map(d => ({
      time:  d.time as unknown as CandlestickData['time'],
      open:  d.open,
      high:  d.high,
      low:   d.low,
      close: d.close,
    }));
    seriesRef.current.setData(candles);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  // Update live candle (current open candle)
  useEffect(() => {
    if (!seriesRef.current || !liveCandle) return;
    seriesRef.current.update({
      time:  liveCandle.time as unknown as CandlestickData['time'],
      open:  liveCandle.open,
      high:  liveCandle.high,
      low:   liveCandle.low,
      close: liveCandle.close,
    });
  }, [liveCandle]);

  return (
    <div style={{ position: 'relative' }}>
      {data.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, color: '#6B7280',
          background: '#0D0D0D', borderRadius: 8, zIndex: 2,
        }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <span style={{ fontSize: 14 }}>Loading {symbol} chart…</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', minHeight: 420 }} />
    </div>
  );
});

TradeCandleChart.displayName = 'TradeCandleChart';
export default TradeCandleChart;
