import { ReactNode } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <Topbar />
      <div className="main-container">
        <Sidebar />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
