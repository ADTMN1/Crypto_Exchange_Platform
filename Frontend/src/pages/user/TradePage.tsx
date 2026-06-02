import { useParams } from "react-router-dom";
import { FaArrowUp, FaChartLine, FaWallet } from "react-icons/fa";
import { useState } from "react";

export default function TradePage() {
  const { pair } = useParams<{ pair: string }>();
  const [activeTab, setActiveTab] = useState<"charts" | "trade" | "positions">(
    "charts",
  );
  const [timeframe, setTimeframe] = useState("1h");
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Replace with API calls
  const currentPrice = 0;
  const priceChange = 0;
  const totalPortfolio = 0;
  const availableBalance = 0;

  const holdings: Array<{ symbol: string; balance: number; usdValue: number }> =
    [];

  const timeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

  // TODO: Replace with API call for candlestick data
  const candlestickData: any[] = [];

  return (
    <main className="trade-page">
      {/* Top Section - Price & Portfolio */}
      <div className="trade-header">
        <div className="price-section">
          <div className="pair-info">
            <h1 className="pair-name">BTCUSDT</h1>
            <span className="price-badge positive">
              <FaArrowUp /> {priceChange}%
            </span>
          </div>
          <div className="current-price">
            ${currentPrice.toLocaleString()} USD
          </div>
          <div className="price-change">${priceChange} USD</div>
        </div>

        <div className="portfolio-section">
          <div className="portfolio-card">
            <div className="portfolio-label">Total Portfolio</div>
            <div className="portfolio-value">
              ${totalPortfolio.toFixed(2)} USD
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Section */}
      <div className="holdings-section">
        <h3 className="section-title">Your Holdings</h3>
        <div className="holdings-list">
          {holdings.map((holding, index) => (
            <div key={index} className="holding-item">
              <div className="holding-symbol">{holding.symbol}</div>
              <div className="holding-details">
                <div className="holding-balance">
                  {holding.balance.toFixed(8)}
                </div>
                <div className="holding-usd">
                  ${holding.usdValue.toFixed(2)} USD
                </div>
              </div>
            </div>
          ))}
          <div className="holding-item more-holdings">
            <span>+396 More</span>
          </div>
        </div>
        <div className="available-balance">
          <FaWallet className="balance-icon" />
          <span>
            Available to Trade: ${availableBalance.toFixed(2)} USD USDT
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="trade-tabs">
        <button
          className={`tab ${activeTab === "charts" ? "active" : ""}`}
          onClick={() => setActiveTab("charts")}
        >
          <FaChartLine /> Charts
        </button>
        <button
          className={`tab ${activeTab === "trade" ? "active" : ""}`}
          onClick={() => setActiveTab("trade")}
        >
          Trade
        </button>
        <button
          className={`tab ${activeTab === "positions" ? "active" : ""}`}
          onClick={() => setActiveTab("positions")}
        >
          Positions
        </button>
      </div>

      {/* Main Content */}
      <div className="trade-content">
        {activeTab === "charts" && (
          <div className="charts-section">
            <div className="market-info">
              <p className="market-sentiment">
                <span className="sentiment-badge bullish">BULLISH</span>
                BTCUSDT is up {priceChange}% today. Market sentiment is bullish.
              </p>
            </div>

            {/* Timeframe Selector */}
            <div className="timeframe-selector">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  className={`timeframe-btn ${timeframe === tf ? "active" : ""}`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Professional Trading Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <div className="chart-info">
                  <span className="chart-pair">BTCUSDT</span>
                  <span className="chart-price">
                    ${currentPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <svg
                className="trading-chart"
                viewBox="0 0 1000 400"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid lines */}
                <g className="grid-lines">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={`h-${i}`}
                      x1="50"
                      y1={50 + i * 75}
                      x2="950"
                      y2={50 + i * 75}
                      stroke="#2a2a2a"
                      strokeWidth="1"
                    />
                  ))}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <line
                      key={`v-${i}`}
                      x1={50 + i * 100}
                      y1="50"
                      x2={50 + i * 100}
                      y2="350"
                      stroke="#2a2a2a"
                      strokeWidth="1"
                    />
                  ))}
                </g>

                {/* Candlesticks */}
                <g className="candlesticks">
                  {candlestickData.map((candle, index) => {
                    const x = 60 + index * 18;
                    const yScale = 300 / 15000;
                    const yOffset = 350;

                    const openY = yOffset - (candle.open - 65000) * yScale;
                    const closeY = yOffset - (candle.close - 65000) * yScale;
                    const highY = yOffset - (candle.high - 65000) * yScale;
                    const lowY = yOffset - (candle.low - 65000) * yScale;

                    const isGreen = candle.close > candle.open;
                    const color = isGreen ? "#24C576" : "#E53935";

                    return (
                      <g key={index}>
                        {/* Wick */}
                        <line
                          x1={x}
                          y1={highY}
                          x2={x}
                          y2={lowY}
                          stroke={color}
                          strokeWidth="1"
                        />
                        {/* Body */}
                        <rect
                          x={x - 6}
                          y={Math.min(openY, closeY)}
                          width="12"
                          height={Math.abs(closeY - openY) || 1}
                          fill={color}
                        />
                      </g>
                    );
                  })}
                </g>

                {/* Y-axis labels */}
                <g className="y-axis">
                  {[68000, 70000, 72000, 74000, 76000].map((price, i) => (
                    <text
                      key={i}
                      x="40"
                      y={350 - i * 75}
                      fill="#888"
                      fontSize="12"
                      textAnchor="end"
                    >
                      {price.toLocaleString()}
                    </text>
                  ))}
                </g>
              </svg>
            </div>

            {/* Quick Trade */}
            <div className="quick-trade-section">
              <h3 className="quick-trade-title">
                Quick Trade - Start with 10% of your balance
              </h3>
              <div className="quick-trade-buttons">
                <button className="quick-trade-btn buy">
                  <span className="btn-label">BUY</span>
                  <span className="btn-subtitle">(Higher)</span>
                </button>
                <button className="quick-trade-btn sell">
                  <span className="btn-label">SELL</span>
                  <span className="btn-subtitle">(Lower)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "trade" && (
          <div className="trade-section">
            <p className="tab-placeholder">
              Advanced trading interface coming soon
            </p>
          </div>
        )}

        {activeTab === "positions" && (
          <div className="positions-section">
            <p className="tab-placeholder">
              Your open positions will appear here
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
