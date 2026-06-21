import { useEffect, useState } from 'react';
import { BinaryTrade } from '../../services/binary.service';
import { useMarketData } from '../../hooks/useMarketData';

interface TradePopupProps {
  open: boolean;
  onClose: () => void;
  trade: BinaryTrade;
  onNewTrade: () => void;
}

export default function TradePopup({ open, onClose, trade, onNewTrade }: TradePopupProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const { livePrice, kline } = useMarketData();
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    if (livePrice && livePrice > 0) {
      setCurrentPrice(livePrice);
    } else if (kline && kline.close > 0) {
      setCurrentPrice(kline.close);
    }
  }, [livePrice, kline]);

  // Calculate time left whenever something changes
  useEffect(() => {
    if (!open) return;

    const updateTimeLeft = () => {
      if (trade.status !== 'running') {
        setTimeLeft(0);
      } else {
        const remaining = Math.max(0, Math.ceil((new Date(trade.expires_at).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [open, trade]);

  if (!open) return null;

  const base = trade.pair.replace('/USDT', '').replace('USDT', '');
  const date = new Date(trade.created_at);
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const side = trade.direction === 'BUY' ? 'buy' : 'sell';
  const isCompleted = trade.status !== 'running';
  const amount = Number(trade.amount);
  const entryPrice = Number(trade.entry_price);
  
  // Calculate profit/loss
  let profit = 0;
  let profitPercentage = 0;
  
  if (isCompleted) {
    const payout = Number(trade.payout || 0);
    profit = payout - amount;
    profitPercentage = amount > 0 ? (profit / amount) * 100 : 0;
  } else {
    // Calculate live profit based on current price and trade direction
    const isWinning = (trade.direction === 'BUY' && currentPrice > entryPrice) || 
                      (trade.direction === 'SELL' && currentPrice < entryPrice);
    
    // Get payout multiplier based on duration (same as backend)
    let multiplier = 1.10; // Default 10%
    if (trade.duration === 30) multiplier = 1.10;
    else if (trade.duration === 60) multiplier = 1.15;
    else if (trade.duration === 90) multiplier = 1.20;
    else if (trade.duration === 120) multiplier = 1.20;
    else if (trade.duration === 180) multiplier = 1.25;
    else if (trade.duration === 300) multiplier = 1.30;

    if (isWinning) {
      profit = (amount * (multiplier - 1));
      profitPercentage = (multiplier - 1) * 100;
    } else {
      profit = -amount;
      profitPercentage = -100;
    }
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
          <div className={`trade-popup-status ${isCompleted ? 'completed' : 'active'}`}>
            {isCompleted ? trade.status.charAt(0).toUpperCase() + trade.status.slice(1) : 'Active'}
          </div>
        </div>
        <div className="trade-popup-countdown">
          <div className={`trade-popup-countdown-circle ${isCompleted ? 'completed' : 'active'}`}>
            <span className="trade-popup-countdown-text">{timeLeft}s</span>
          </div>
        </div>
        <div className="trade-popup-details">
          <div className="trade-popup-amount">
            {amount.toFixed(4)} USDT
          </div>
          <div className="trade-popup-price">
            Opening Price: {entryPrice.toLocaleString('en-US', { maximumFractionDigits: 3 })} USDT
          </div>
          {!isCompleted && currentPrice > 0 && (
            <div className="trade-popup-price">
              Current Price: {currentPrice.toLocaleString('en-US', { maximumFractionDigits: 3 })} USDT
            </div>
          )}
        </div>
        <div className="trade-popup-side">
          <div className={`trade-popup-side-badge ${side}`}>{trade.direction}</div>
        </div>
        <div className="trade-popup-profit-row">
          <div className="trade-popup-profit-label">{isCompleted ? 'PROFIT:' : 'UNREALIZED P/L:'}</div>
          <div className={`trade-popup-profit-value ${profit >= 0 ? 'profit' : 'loss'}`}>
            {`${profit >= 0 ? '+' : ''}$${profit.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(1)}%)`}
          </div>
        </div>
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
