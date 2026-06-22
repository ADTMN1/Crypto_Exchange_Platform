import { ReactNode, useState } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { MobileSidebarProvider, useMobileSidebar } from "../../context/MobileSidebarContext";

function AppShellInner({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isOpen, toggle, close } = useMobileSidebar();

  return (
    <div className="app">
      <Topbar />
      <div 
        className={`mobile-sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={close}
      />
      <div className="main-container">
        <Sidebar 
          collapsed={collapsed} 
          onToggle={() => setCollapsed(!collapsed)}
          isMobileOpen={isOpen}
          onMobileClose={close}
        />
        <div className={`content ${collapsed ? 'collapsed' : ''}`} style={{ position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <MobileSidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </MobileSidebarProvider>
  );
}
