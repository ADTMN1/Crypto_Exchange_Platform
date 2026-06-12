import '../../styles/trade.css';
import { MarketDataProvider } from '../../hooks/MarketDataProvider';
import TradeHeader from './TradeHeader';
import TradeOrderBook from './TradeOrderBook';
import TradeChart from './TradeChart';
import TradeMarketList from './TradeMarketList';
import TradeMarketTrades from './TradeMarketTrades';

interface TradeLayoutProps {
  initialSymbol?: string;
}

export default function TradeLayout({ initialSymbol = 'BTCUSDT' }: TradeLayoutProps) {
  return (
    <MarketDataProvider initialSymbol={initialSymbol}>
      <div className="trade-terminal">
        <TradeHeader />
        <div className="trade-body">
          <TradeOrderBook />
          <TradeChart />
          <div className="trade-col-right">
            <TradeMarketList />
            <TradeMarketTrades />
          </div>
        </div>
      </div>
    </MarketDataProvider>
  );
}
