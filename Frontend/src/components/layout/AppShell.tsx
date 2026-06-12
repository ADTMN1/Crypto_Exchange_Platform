import { ReactNode, useState } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app">
      <Topbar />
      <div className="main-container">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className={`content ${collapsed ? 'collapsed' : ''}`}>{children}</div>
      </div>
    </div>
  );
}
