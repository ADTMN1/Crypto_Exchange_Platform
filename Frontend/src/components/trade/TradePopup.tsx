import { useEffect, useState } from 'react';
import { BinaryTrade, binaryService } from '../../services/binary.service';
import { useMarketData } from '../../hooks/useMarketData';

interface TradePopupProps {
  open: boolean;
  onClose: () => void;
  trade: BinaryTrade;
  onNewTrade: () => void;
}

export default function TradePopup({ open, onClose, trade, onNewTrade }: TradePopupProps) {
  const { livePrice, kline } = useMarketData();
  const [currentPrice, setCurrentPrice] = useState(0);
  const [binarySettings, setBinarySettings] = useState<any>(null);
  // Local tick — used only to re-render countdown text, not to trigger fetches
  const [, setTick] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await binaryService.getSettings();
        setBinarySettings(res.data);
      } catch (err) {
        console.error('Failed to fetch binary settings for popup:', err);
      }
    };
    if (open) {
      fetchSettings();
    }
  }, [open]);

  useEffect(() => {
    if (livePrice && livePrice > 0) {
      setCurrentPrice(livePrice);
    } else if (kline && kline.close > 0) {
      setCurrentPrice(kline.close);
    }
  }, [livePrice, kline]);

  // Tick every second so the countdown text stays live.
  // Only runs while the popup is open and the trade is still running.
  useEffect(() => {
    if (!open || trade.status !== 'running') return;
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [open, trade.status]);

  if (!open) return null;

  // Always derive from current wall-clock time — no stale state
  const expiresAtMs = new Date(trade.expires_at).getTime();
  const durationMs = Number(trade.duration) * 1000;
  // ── Countdown math (fixes "30s trade shows as 31s" bug) ──────────────
  // NO artificial +1s buffer added to the visual countdown.
  // Math.ceil gives the correct tick-aligned human count:
  //   30000ms → "30", 29999ms → "30", 29001ms → "30", 29000ms → "29"
  const rawMsLeft = expiresAtMs - Date.now();
  const countdownSec = Math.max(0, Math.ceil(rawMsLeft / 1000));
  // Processing buffer is ONLY applied to the "isProcessing" gate
  // so the UI waits for the backend resolver before revealing the result.
  // Countdown reaches "0" → user sees 0 for ~1.5s → then Processing/Result.
  const processingBufferMs = 1500;
  const msUntilProcessingPassed = expiresAtMs + processingBufferMs - Date.now();
  const isCompleted = trade.status !== 'running';
  const isProcessing = !isCompleted && msUntilProcessingPassed <= 0;

  const base = trade.pair.replace('/USDT', '').replace('USDT', '');
  const date = new Date(trade.created_at);
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const side = trade.direction === 'BUY' ? 'buy' : 'sell';
  const amount = Number(trade.amount);
  const entryPrice = Number(trade.entry_price);

  // Profit / loss calculation
  let profit = 0;
  let profitPercentage = 0;

  if (isCompleted) {
    if (trade.status === 'win') {
      const payout = Number(trade.payout || 0);
      profit = payout - amount;
      profitPercentage = amount > 0 ? (profit / amount) * 100 : 0;
    } else {
      profit = -amount;
      profitPercentage = -100;
    }
  } else {
    // Unrealised — use duration-based payout from settings
    const payoutPercent = binarySettings?.duration_payouts?.[trade.duration] || binarySettings?.payout_percentage || 10;
    const multiplier = 1 + (payoutPercent / 100);
    profitPercentage = payoutPercent;
    profit = amount * (payoutPercent / 100);
  }

  return (
    <div className="trade-popup-overlay" onClick={onClose}>
      <div className="trade-popup" onClick={(e) => e.stopPropagation()}>
        <button className="trade-popup-close" onClick={onClose}>✕</button>

        <div className="trade-popup-header">
          <h2 className="trade-popup-title">{trade.pair} Contract</h2>
        </div>

        <div className="trade-popup-status-row">
          <div className="trade-popup-time">{dateStr}, {timeStr}</div>
          <div className={`trade-popup-status ${isCompleted ? 'completed' : isProcessing ? 'processing' : 'active'}`}>
            {isCompleted
              ? trade.status.charAt(0).toUpperCase() + trade.status.slice(1)
              : isProcessing
              ? 'Processing...'
              : 'Active'}
          </div>
        </div>

        <div className="trade-popup-countdown">
          <div className={`trade-popup-countdown-circle ${isCompleted ? 'completed' : isProcessing ? 'processing' : 'active'}`}>
            <span className="trade-popup-countdown-text">
              {isProcessing ? (
                <span style={{ fontSize: '0.6em' }}>⟳</span>
              ) : isCompleted ? (
                '✓'
              ) : (
                `${countdownSec}s`
              )}
            </span>
          </div>
        </div>

        <div className="trade-popup-details">
          <div className="trade-popup-amount">
            {amount.toFixed(4)} USDT
          </div>
          <div className="trade-popup-price">
            Opening Price: {entryPrice.toLocaleString('en-US', { maximumFractionDigits: 3 })} USDT
          </div>
          {!isCompleted && !isProcessing && currentPrice > 0 && (
            <div className="trade-popup-price">
              Current Price: {currentPrice.toLocaleString('en-US', { maximumFractionDigits: 3 })} USDT
            </div>
          )}
        </div>

        {!isProcessing && (
          <div className="trade-popup-side">
            <div className={`trade-popup-side-badge ${side}`}>{trade.direction}</div>
          </div>
        )}

        {!isProcessing && (
          <div className="trade-popup-profit-row">
            <div className="trade-popup-profit-label">{isCompleted ? 'PROFIT:' : 'UNREALIZED P/L:'}</div>
            <div className={`trade-popup-profit-value ${profit >= 0 ? 'profit' : 'loss'}`}>
              {`${profit >= 0 ? '+' : ''}$${profit.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(1)}%)`}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="trade-popup-profit-row">
            <div className="trade-popup-profit-label" style={{ color: '#666' }}>Calculating Result...</div>
          </div>
        )}

        {isCompleted && (
          <div className="trade-popup-new-trade">
            <button className="trade-popup-new-trade-btn" onClick={onNewTrade}>
              New Trade
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
