import AppShell from "../../components/layout/AppShell";
import Hero from "../../components/Hero";
import CoinCard from "../../components/CoinCard";
import { Link } from "react-router-dom";

export default function HomePage() {
  const coins = [
    {
      name: "Bitcoin",
      symbol: "BTCK",
      change: "+2.45%",
      price: "$68,245.30",
      positive: true,
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      change: "-0.82%",
      price: "$3,521.10",
      positive: false,
    },
    {
      name: "Solana",
      symbol: "SOL",
      change: "+5.12%",
      price: "$182.45",
      positive: true,
    },
    {
      name: "Cardano",
      symbol: "ADA",
      change: "+1.20%",
      price: "$0.58",
      positive: true,
    },
    {
      name: "Binance Coin",
      symbol: "BNB",
      change: "+1.85%",
      price: "$584.20",
      positive: true,
    },
    {
      name: "Ripple",
      symbol: "XRP",
      change: "-0.30%",
      price: "$0.52",
      positive: false,
    },
    {
      name: "Dogecoin",
      symbol: "DOGE",
      change: "+10.50%",
      price: "$0.15",
      positive: true,
    },
    {
      name: "Polygon",
      symbol: "MATIC",
      change: "+3.20%",
      price: "$0.85",
      positive: true,
    },
  ];

  return (
    <AppShell>
      <Hero />
      <div className="categories">
        <button className="category-btn active">All</button>
        <button className="category-btn">DeFi</button>
        <button className="category-btn">NFTs</button>
        <button className="category-btn">Layer 1</button>
        <button className="category-btn">Layer 2</button>
        <button className="category-btn">Gaming</button>
        <button className="category-btn">AI</button>
        <button className="category-btn">Memecoins</button>
      </div>
      <section className="market-section">
        <div className="section-header">
          <h2 className="section-title">TRENDING COINS</h2>
          <Link to="/markets" className="view-all">
            VIEW ALL
          </Link>
        </div>
        <div className="coins-grid">
          {coins.map((coin, index) => (
            <CoinCard key={index} coin={coin} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
