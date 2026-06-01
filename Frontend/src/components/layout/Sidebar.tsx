import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-slate-800 bg-slate-900 p-6">
      <nav className="space-y-3">
        <NavLink
          to="/dashboard"
          className="block rounded px-3 py-2 hover:bg-slate-800"
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/trade/BTC-USD"
          className="block rounded px-3 py-2 hover:bg-slate-800"
        >
          Trade
        </NavLink>
        <NavLink
          to="/wallet"
          className="block rounded px-3 py-2 hover:bg-slate-800"
        >
          Wallet
        </NavLink>
        <NavLink
          to="/orders"
          className="block rounded px-3 py-2 hover:bg-slate-800"
        >
          Orders
        </NavLink>
      </nav>
    </aside>
  );
}
