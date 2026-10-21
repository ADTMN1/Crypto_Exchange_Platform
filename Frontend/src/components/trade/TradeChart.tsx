import { useEffect, useRef, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
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
import { useWalletStore } from '../../store/useWalletStore';

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
  const { fetchWallet } = useWalletStore();
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
  // Dropdown states for mobile
  const [intervalDropdownOpen, setIntervalDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const intervalDropdownRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);
  // Binary settings
  const [binarySettings, setBinarySettings] = useState<any>(null);

  // Fetch binary settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await binaryService.getSettings();
        setBinarySettings(res.data);
        // Set default duration if not already set
        if (res.data.allowed_expirations.length > 0) {
          const defaultDuration = `${res.data.allowed_expirations[0]}s`;
          setDuration(defaultDuration);
        }
      } catch (err) {
        console.error('Failed to fetch binary settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        intervalDropdownRef.current &&
        !intervalDropdownRef.current.contains(event.target as Node)
      ) {
        setIntervalDropdownOpen(false);
      }
      if (
        durationDropdownRef.current &&
        !durationDropdownRef.current.contains(event.target as Node)
      ) {
        setDurationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Always tick currentTime every second — drives the countdown display in the button
  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Listen for trade completion via WebSocket event
  useEffect(() => {
    if (!activeTrade || activeTrade.status !== 'running') return;

    const handleTradeCompleted = (event: CustomEvent) => {
      const data = event.detail;
      if (data.tradeId === activeTrade.id) {
        console.log('Trade completed via WebSocket event:', data);
        setActiveTrade({
          ...activeTrade,
          status: data.status,
          payout: data.payout,
          close_price: data.closePrice,
          resolved_at: new Date().toISOString()
        });
        fetchWallet();
      }
    };

    // Check sessionStorage for any pending trade completion event
    const storedEvent = sessionStorage.getItem('trade_completed_event');
    if (storedEvent) {
      try {
        const data = JSON.parse(storedEvent);
        if (data.tradeId === activeTrade.id) {
          handleTradeCompleted({ detail: data } as CustomEvent);
          sessionStorage.removeItem('trade_completed_event');
        }
      } catch (err) {
        console.error('Failed to parse stored trade event:', err);
      }
    }

    window.addEventListener('trade_completed', handleTradeCompleted as EventListener);
    return () => {
      window.removeEventListener('trade_completed', handleTradeCompleted as EventListener);
    };
  }, [activeTrade?.id, activeTrade?.status, fetchWallet]);

  // focus amount input when symbol changes (user selects a new chart pair)
  useEffect(() => {
    const t = window.setTimeout(() => amountInputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [symbol]);

  // Poll for trade status.
  // Directly fetch the trade by ID once expired — avoids pagination issues where
  // the resolved trade could be on page 2+ of the paginated list.
  useEffect(() => {
    if (!activeTrade || activeTrade.status !== 'running') return;

    const tradeId = activeTrade.id;
    const expiresAt = new Date(activeTrade.expires_at).getTime();
    // Match TradePopup buffer — keep poll start and UI transition in sync
    const PROCESSING_BUFFER_MS = 1500;
    // Safety: if backend resolver hangs/crashes, force-stop polling after this timeout
    // and show an error state instead of spinning forever.
    const MAX_POLL_DURATION_MS = 300_000; // 5 minutes hard timeout (increased from 1 minute)
    const serverExpiry = expiresAt + PROCESSING_BUFFER_MS;

    let isFetching = false;
    let cancelled = false;

    const poll = async () => {
      if (isFetching || cancelled) return;
      // Only hit the server after the trade has definitely expired server-side
      if (Date.now() < serverExpiry) return;

      if (Date.now() - serverExpiry > MAX_POLL_DURATION_MS) {
        console.error(`Poller gave up waiting for trade ${tradeId} after ${MAX_POLL_DURATION_MS}ms`);
        clearInterval(timer);
        return;
      }

      isFetching = true;
      try {
        const res = await binaryService.getTradeById(tradeId);
        const trade = res.data;
        if (!cancelled && trade && trade.status !== 'running') {
          setActiveTrade(trade);
          fetchWallet();
          clearInterval(timer); // Found it — stop polling immediately
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          console.warn(`Trade ${tradeId} returned 404 during poll`);
        } else {
          console.error('Failed to poll trade status:', err?.message || err);
        }
      } finally {
        isFetching = false;
      }
    };

    // Run every 500ms. The callback is a no-op until serverExpiry is reached.
    const timer = setInterval(poll, 500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrade?.id, activeTrade?.status]);

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
      ma7Ref.current = null;
      ma25Ref.current = null;
      ma99Ref.current = null;
    };
  }, [symbol, interval, loadMoreKlines]);

  // Load historical klines
  useEffect(() => {
    if (!klines.length || !candleRef.current || !chartRef.current) return;

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

    try {
      candleRef.current.setData(candleData);
      volumeRef.current?.setData(volData);
      ma7Ref.current?.setData(toLine(ma7));
      ma25Ref.current?.setData(toLine(ma25));
      ma99Ref.current?.setData(toLine(ma99));
      chartRef.current?.timeScale().fitContent();

      if (containerRef.current) {
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
    } catch (err) {
      // Ignore "Object is disposed" errors
      console.log("Chart update skipped (object disposed)", err);
    }
  }, [klines]);

  // Live kline update
  useEffect(() => {
    if (!kline || !candleRef.current || !chartRef.current) return;
    try {
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
    } catch (err) {
      // Ignore "Object is disposed" errors
      console.log("Live kline update skipped (object disposed)", err);
    }
  }, [kline]);

  const isUp = ohlc.chg >= 0;
  const chgClass = isUp ? 'val-up' : 'val-down';

  // Compute button label based on current time tick
  const tradeButtonLabel = (() => {
    if (isLoading) return 'Placing Trade...';
    if (!activeTrade) return 'Confirm Trade';
    if (activeTrade.status === 'running') {
      const msLeft = new Date(activeTrade.expires_at).getTime() - currentTime;
      if (msLeft <= 0) return 'Processing Result...';
      // Match TradePopup countdown: ceil of raw ms / 1000, no buffer added
      const sec = Math.max(0, Math.ceil(msLeft / 1000));
      return `Trade Active (${sec}s)`;
    }
    const pnl = Number(activeTrade.payout ?? 0) - Number(activeTrade.amount);
    const label = activeTrade.status === 'win' ? 'Win' : activeTrade.status === 'lose' ? 'Lose' : activeTrade.status;
    return `Trade ${label} (${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString()})`;
  })();

  return (
    <div className={isFullscreen ? 'trade-col-chart-fullscreen' : ''}>
      <div className="trade-chart-toolbar">
        <div className="trade-chart-tabs">
          <div className="trade-chart-tab active">Chart</div>
          <div className="trade-chart-tab">Info</div>
          <div className="trade-chart-tab">Trading Data</div>
          <div className="trade-chart-tab">Trading Analysis</div>
        </div>
        <div className="trade-chart-intervals">
          {/* Desktop: Buttons */}
          <div className="trade-interval-buttons">
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
          {/* Mobile: Dropdown */}
          <div className="trade-interval-dropdown" ref={intervalDropdownRef}>
            <button
              className="trade-interval-dropdown-btn"
              onClick={() => setIntervalDropdownOpen(!intervalDropdownOpen)}
            >
              {INTERVALS.find((i) => i.value === interval)?.label || interval} ▾
            </button>
            {intervalDropdownOpen && (
              <div className="trade-interval-dropdown-menu">
                {INTERVALS.map((iv) => (
                  <button
                    key={iv.value}
                    className={`trade-interval-dropdown-item ${interval === iv.value ? 'active' : ''}`}
                    onClick={() => {
                      setChartInterval(iv.value);
                      setIntervalDropdownOpen(false);
                    }}
                  >
                    {iv.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '60px 20px',
            color: '#F7931A',
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            backgroundColor: '#0b0e11'
          }}>
            <FaSpinner style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '20px', fontSize: '18px' }}>Loading chart history...</p>
          </div>
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
              {/* Desktop: Buttons */}
              <div className="trade-duration-buttons">
                {(binarySettings?.allowed_expirations || [30, 60, 90, 120, 180, 300]).map((d: number) => {
                  const key = `${d}s`;
                  const payout = binarySettings?.duration_payouts?.[d] || 0;
                  return (
                    <button
                      key={key}
                      className={`trade-duration-btn ${duration === key ? 'active' : ''}`}
                      onClick={() => setDuration(key)}
                    >
                      {d}s ({payout}%)
                    </button>
                  );
                })}
              </div>
              {/* Mobile: Dropdown */}
              <div className="trade-duration-dropdown" ref={durationDropdownRef}>
                <button
                  className="trade-duration-dropdown-btn"
                  onClick={() => setDurationDropdownOpen(!durationDropdownOpen)}
                >
                  {(() => {
                    const durations = binarySettings?.allowed_expirations || [30, 60, 90, 120, 180, 300];
                    const d = durations.find((num: number) => `${num}s` === duration) || durations[0];
                    const payout = binarySettings?.duration_payouts?.[d] || 0;
                    return `${d}s (${payout}%)`;
                  })()} ▾
                </button>
                {durationDropdownOpen && (
                  <div className="trade-duration-dropdown-menu">
                    {(binarySettings?.allowed_expirations || [30, 60, 90, 120, 180, 300]).map((d: number) => {
                      const key = `${d}s`;
                      const payout = binarySettings?.duration_payouts?.[d] || 0;
                      return (
                        <button
                          key={key}
                          className={`trade-duration-dropdown-item ${duration === key ? 'active' : ''}`}
                          onClick={() => {
                            setDuration(key);
                            setDurationDropdownOpen(false);
                          }}
                        >
                          {d}s ({payout}%)
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
              disabled={isLoading}
              onClick={async () => {
                if (activeTrade) {
                  setPopupOpen(true);
                  return;
                }

                const parsed = parseFloat(amount.replace(/,/g, ''));
                if (!parsed || parsed <= 0) {
                  setError('Please enter a valid amount greater than 0');
                  amountInputRef.current?.focus();
                  return;
                }

                try {
                  setIsLoading(true);
                  setError(null);
                  const numericDuration = parseInt(duration.replace('s', ''), 10);
                  const response = await binaryService.placeTrade({
                    pair: symbol,
                    direction: side === 'buy' ? 'BUY' : 'SELL',
                    amount: parsed,
                    duration: numericDuration,
                  });
                  setActiveTrade(response.data);
                  setPopupOpen(true);
                  fetchWallet();
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Failed to place trade');
                  console.error('Trade placement failed:', err);
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {tradeButtonLabel}
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
