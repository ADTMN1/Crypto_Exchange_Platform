import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import { useMarketData } from '../../hooks/useMarketData';
import { calculateSMA } from '../../utils/technicalIndicators';
import TradePopup from './TradePopup';
import binaryService, { BinaryTrade } from '../../services/binary.service';

const INTERVALS = [
  { label: '30s', value: '30s' },
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

const MA7_COLOR = '#f0b90b';
const MA25_COLOR = '#e040fb';
const MA99_COLOR = '#ff6b9d';

export default function TradeChart() {
  const {
    symbol, interval, setChartInterval, klines, kline, livePrice,
    klinesLoading, loadMoreKlines,
  } = useMarketData();
  const base = symbol.replace('USDT', '');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma7Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma25Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma99Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, chg: 0, chgPct: 0 });
  const [maValues, setMaValues] = useState({ ma7: 0, ma25: 0, ma99: 0 });
  const [volInfo, setVolInfo] = useState({ vol: 0, ma5: 0, ma10: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Trade controls state
  const [amount, setAmount] = useState<string>('0.00');
  const [duration, setDuration] = useState<string>('30s');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  // Popup and active trade state
  const [popupOpen, setPopupOpen] = useState(false);
  const [activeTrade, setActiveTrade] = useState<BinaryTrade | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update current time every second for the button display
  useEffect(() => {
    if (!activeTrade) return;
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTrade]);

  // Check for active running trade on component mount
  useEffect(() => {
    const fetchActiveTrade = async () => {
      try {
        const response = await binaryService.getMyTrades('running', 1);
        if (response.data.trades.length > 0) {
          setActiveTrade(response.data.trades[0]);
        }
      } catch (err) {
        console.error('Failed to fetch active trades:', err);
      }
    };
    fetchActiveTrade();
  }, []);

  // focus amount input when symbol changes (user selects a new chart pair)
  useEffect(() => {
    // small async to ensure input is mounted
    const t = window.setTimeout(() => amountInputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [symbol]);

  // Poll for trade status updates
  useEffect(() => {
    if (!activeTrade) return;
    if (activeTrade.status !== 'running') return;

    const pollTradeStatus = async () => {
      try {
        const response = await binaryService.getMyTrades('running', 1);
        const currentTrade = response.data.trades.find(t => t.id === activeTrade.id);
        
        if (currentTrade) {
          if (currentTrade.status !== activeTrade.status) {
            setActiveTrade(currentTrade);
          }
        } else {
          // Trade is no longer in running status, fetch all to see what happened
          const allResponse = await binaryService.getMyTrades('all', 1);
          const updatedTrade = allResponse.data.trades.find(t => t.id === activeTrade.id);
          if (updatedTrade) {
            setActiveTrade(updatedTrade);
          }
        }
      } catch (err) {
        console.error('Failed to poll trade status:', err);
      }
    };

    const pollInterval = setInterval(pollTradeStatus, 3000);
    return () => clearInterval(pollInterval);
  }, [activeTrade]);

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e11' },
        textColor: '#848e9c',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e2329' },
        horzLines: { color: '#1e2329' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#2b2f36',
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#2b2f36',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candles = chart.addCandlestickSeries({
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderUpColor: '#0ecb81',
      borderDownColor: '#f6465d',
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    const volume = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    const ma7 = chart.addLineSeries({ color: MA7_COLOR, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const ma25 = chart.addLineSeries({ color: MA25_COLOR, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const ma99 = chart.addLineSeries({ color: MA99_COLOR, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;
    ma7Ref.current = ma7;
    ma25Ref.current = ma25;
    ma99Ref.current = ma99;

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.size) return;
      const cd = param.seriesData.get(candles);
      if (cd && typeof cd === 'object' && 'open' in cd) {
        const o = cd.open as number;
        const h = cd.high as number;
        const l = cd.low as number;
        const c = cd.close as number;
        const chg = c - o;
        setOhlc({ o, h, l, c, chg, chgPct: o ? (chg / o) * 100 : 0 });
      }
    });

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) chart.applyOptions({ width: w, height: h });
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    requestAnimationFrame(resize);
    window.setTimeout(resize, 100);

    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && range.from < 20) loadMoreKlines();
    });

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, [symbol, interval, loadMoreKlines]);

  // Load historical klines
  useEffect(() => {
    if (!klines.length || !candleRef.current) return;

    const candleData: CandlestickData[] = klines.map((k) => ({
      time: (k.openTime / 1000) as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    const volData = klines.map((k) => ({
      time: (k.openTime / 1000) as Time,
      value: k.volume,
      color: k.close >= k.open ? 'rgba(14,203,129,0.5)' : 'rgba(246,70,93,0.5)',
    }));

    const closes = klines.map((k) => k.close);
    const times = klines.map((k) => (k.openTime / 1000) as Time);
    const ma7 = calculateSMA(closes, 7);
    const ma25 = calculateSMA(closes, 25);
    const ma99 = calculateSMA(closes, 99);
    const vols = klines.map((k) => k.volume);
    const volMa5 = calculateSMA(vols, 5);
    const volMa10 = calculateSMA(vols, 10);

    const toLine = (vals: number[]): LineData[] =>
      vals.map((v, i) => ({ time: times[i], value: v })).filter((d) => d.value > 0);

    candleRef.current.setData(candleData);
    volumeRef.current?.setData(volData);
    ma7Ref.current?.setData(toLine(ma7));
    ma25Ref.current?.setData(toLine(ma25));
    ma99Ref.current?.setData(toLine(ma99));
    chartRef.current?.timeScale().fitContent();

    if (containerRef.current && chartRef.current) {
      const el = containerRef.current;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) chartRef.current.applyOptions({ width: w, height: h });
    }

    const last = klines[klines.length - 1];
    setOhlc({
      o: last.open, h: last.high, l: last.low, c: last.close,
      chg: last.close - last.open,
      chgPct: last.open ? ((last.close - last.open) / last.open) * 100 : 0,
    });
    setMaValues({
      ma7: ma7[ma7.length - 1] || 0,
      ma25: ma25[ma25.length - 1] || 0,
      ma99: ma99[ma99.length - 1] || 0,
    });
    setVolInfo({
      vol: last.volume,
      ma5: volMa5[volMa5.length - 1] || 0,
      ma10: volMa10[volMa10.length - 1] || 0,
    });
  }, [klines]);

  // Live kline update
  useEffect(() => {
    if (!kline || !candleRef.current) return;
    const t = (kline.openTime / 1000) as Time;
    candleRef.current.update({
      time: t, open: kline.open, high: kline.high, low: kline.low, close: kline.close,
    });
    volumeRef.current?.update({
      time: t,
      value: kline.volume,
      color: kline.close >= kline.open ? 'rgba(14,203,129,0.5)' : 'rgba(246,70,93,0.5)',
    });
    setOhlc({
      o: kline.open, h: kline.high, l: kline.low, c: kline.close,
      chg: kline.close - kline.open,
      chgPct: kline.open ? ((kline.close - kline.open) / kline.open) * 100 : 0,
    });
  }, [kline]);

  const isUp = ohlc.chg >= 0;
  const chgClass = isUp ? 'val-up' : 'val-down';

  return (
    <div className={`trade-col-chart ${isFullscreen ? 'trade-col-chart-fullscreen' : ''}`}>
      <div className="trade-chart-toolbar">
        <div className="trade-chart-tabs">
          <div className="trade-chart-tab active">Chart</div>
          <div className="trade-chart-tab">Info</div>
          <div className="trade-chart-tab">Trading Data</div>
          <div className="trade-chart-tab">Trading Analysis</div>
        </div>
        <div className="trade-chart-intervals">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              className={`trade-interval-btn ${interval === iv.value ? 'active' : ''}`}
              onClick={() => setChartInterval(iv.value)}
            >
              {iv.label}
            </button>
          ))}
        </div>
        <div className="trade-chart-tools">
          <span>Original</span>
          <span>⊞</span>
          <span>⚙</span>
        </div>
        <div className="trade-chart-fullscreen">
          <button
            className="trade-fullscreen-btn"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? 'Exit fullscreen chart' : 'Open fullscreen chart'}
            title={isFullscreen ? 'Exit fullscreen chart' : 'Open fullscreen chart'}
          >
            ⛶
          </button>
        </div>
      </div>

      <div className="trade-chart-ohlc">
        <span>{symbol.replace('USDT', '/USDT')} · {INTERVALS.find((i) => i.value === interval)?.label || interval}</span>
        <span>O<span className={chgClass}>{ohlc.o.toFixed(2)}</span></span>
        <span>H<span className={chgClass}>{ohlc.h.toFixed(2)}</span></span>
        <span>L<span className={chgClass}>{ohlc.l.toFixed(2)}</span></span>
        <span>C<span className={chgClass}>{ohlc.c.toFixed(2)}</span></span>
        <span className={chgClass}>
          {(ohlc.chg >= 0 ? '+' : '') + ohlc.chg.toFixed(2)} ({(ohlc.chgPct >= 0 ? '+' : '') + ohlc.chgPct.toFixed(2)}%)
        </span>
      </div>

      <div className="trade-chart-container">
        {klinesLoading && (
          <div className="trade-chart-loading">Loading chart history...</div>
        )}
        <div className="trade-chart-ma-legend">
          <span className="trade-ma7">MA(7): {maValues.ma7.toFixed(2)}</span>
          <span className="trade-ma25">MA(25): {maValues.ma25.toFixed(2)}</span>
          <span className="trade-ma99">MA(99): {maValues.ma99.toFixed(2)}</span>
        </div>
        <div ref={containerRef} className="trade-chart-canvas" />
        <div className="trade-chart-actions">
          <button className="trade-chart-action-btn buy">Market Buy</button>
          <button className="trade-chart-action-btn sell">Market Sell</button>
        </div>
      </div>

      {/* Trade controls below chart */}
      <div className="trade-order-card">
        <div className="order-row">
          <div className="order-left">
            <div className="trade-amount">
              <label className="trade-label">Enter amount (USDT)</label>
              <div className="trade-amount-input-row">
                <input
                  ref={amountInputRef}
                  className="trade-amount-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                <span className="pair-badge">USDT</span>
              </div>
            </div>
          </div>

          <div className="order-right">
            <div className="trade-durations">
              {[
                { key: '30s', label: '30s (10%)' },
                { key: '60s', label: '60s (15%)' },
                { key: '90s', label: '90s (20%)' },
                { key: '120s', label: '120s (20%)' },
                { key: '180s', label: '180s (25%)' },
                { key: '300s', label: '300s (30%)' },
              ].map((d) => (
                <button
                  key={d.key}
                  className={`trade-duration-btn ${duration === d.key ? 'active' : ''}`}
                  onClick={() => setDuration(d.key)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="order-row actions-row">
            <div className="trade-side-actions">
              <button
                className={`trade-side-btn buy ${side === 'buy' ? 'active' : ''}`}
                onClick={() => setSide('buy')}
              >BUY {base}</button>
              <button
                className={`trade-side-btn sell ${side === 'sell' ? 'active' : ''}`}
                onClick={() => setSide('sell')}
              >SELL {base}</button>
            </div>

          <div className="trade-confirm">
            <button
              className="trade-confirm-btn"
              onClick={async () => {
                if (activeTrade) {
                  // If there's an active trade, open the popup
                  setPopupOpen(true);
                } else {
                  // Validate amount first
                  const parsed = parseFloat(amount.replace(/,/g, ''));
                  
                  if (!parsed || parsed <= 0) {
                    setError('Please enter a valid amount greater than 0');
                    amountInputRef.current?.focus();
                    return;
                  }
                  
                  console.log('Placing trade request:', {
                    pair: symbol,
                    direction: side === 'buy' ? 'BUY' : 'SELL',
                    amount: parsed,
                    duration: parseInt(duration.replace('s', ''), 10)
                  });
                  
                  // Start a new trade
                  try {
                    setIsLoading(true);
                    setError(null);
                    
                    const numericDuration = parseInt(duration.replace('s', ''), 10);
                    
                    const response = await binaryService.placeTrade({
                      pair: symbol,
                      direction: side === 'buy' ? 'BUY' : 'SELL',
                      amount: parsed,
                      duration: numericDuration
                    });
                    
                    setActiveTrade(response.data);
                    setPopupOpen(true);
                  } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to place trade');
                    console.error('Trade placement failed:', err);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Placing Trade...' : (
                activeTrade ? (
                  activeTrade.status === 'running' 
                    ? `Trade Active (${Math.max(0, Math.ceil((new Date(activeTrade.expires_at).getTime() - currentTime) / 1000))}s)`
                    : `Trade ${(activeTrade.status === 'win' ? 'Win' : activeTrade.status === 'lose' ? 'Lose' : activeTrade.status.charAt(0).toUpperCase() + activeTrade.status.slice(1))} (${(Number(activeTrade.payout || 0) - Number(activeTrade.amount)) >= 0 ? '+' : ''}$${(Number(activeTrade.payout || 0) - Number(activeTrade.amount)).toLocaleString()})`
                ) : 'Confirm Trade'
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="trade-error-message">
          {error}
        </div>
      )}

      <div className="trade-volume-label">
        Vol({symbol.replace('USDT', '')}): {volInfo.vol.toFixed(4)} &nbsp;
        Vol(USDT): {(volInfo.vol * (livePrice || ohlc.c)).toFixed(2)} &nbsp;
        MA(5): {volInfo.ma5.toFixed(4)} &nbsp;
        MA(10): {volInfo.ma10.toFixed(4)}
      </div>

      {/* Trade Popup */}
      {activeTrade && (
        <TradePopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          trade={activeTrade}
          onNewTrade={() => {
            setActiveTrade(null);
            setPopupOpen(false);
          }}
        />
      )}
    </div>
  );
}
