import { useParams } from 'react-router-dom';
import TradeLayout from '../../components/trade/TradeLayout';

export default function TradePage() {
  const { pair } = useParams<{ pair?: string }>();

  let symbol = 'BTCUSDT';
  if (pair) {
    const upper = pair.toUpperCase();
    symbol = upper.endsWith('USDT') ? upper : `${upper}USDT`;
  }

  return <TradeLayout initialSymbol={symbol} />;
}
