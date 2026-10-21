import '../../styles/trade.css';
import { useState } from 'react';
import { MarketDataProvider } from '../../hooks/MarketDataProvider';
import TradeHeader from './TradeHeader';
import TradeOrderBook from './TradeOrderBook';
import TradeChart from './TradeChart';
import TradeMarketList from './TradeMarketList';
import TradeMarketTrades from './TradeMarketTrades';

interface TradeLayoutProps {
  initialSymbol?: string;
}

type Tab = 'chart' | 'orderbook' | 'market';

export default function TradeLayout({ initialSymbol = 'BTCUSDT' }: TradeLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chart');

  return (
    <MarketDataProvider initialSymbol={initialSymbol}>
      <div className="trade-terminal">
        <TradeHeader />
        
        {/* Mobile Tabs */}
        <div className="trade-mobile-tabs">
          <button 
            className={`trade-mobile-tab ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            Chart
          </button>
          <button 
            className={`trade-mobile-tab ${activeTab === 'orderbook' ? 'active' : ''}`}
            onClick={() => setActiveTab('orderbook')}
          >
            Order Book
          </button>
          <button 
            className={`trade-mobile-tab ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
          >
            Market
          </button>
        </div>

        <div className="trade-body">
          <div className={`trade-col-orderbook ${activeTab === 'orderbook' ? 'mobile-visible' : ''}`}>
            <TradeOrderBook />
          </div>
          <div className={`trade-col-chart ${activeTab === 'chart' ? 'mobile-visible' : ''}`}>
            <TradeChart />
          </div>
          <div className={`trade-col-right ${activeTab === 'market' ? 'mobile-visible' : ''}`}>
            <TradeMarketList />
            <TradeMarketTrades />
          </div>
        </div>
      </div>
    </MarketDataProvider>
  );
}
