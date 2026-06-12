import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";
import AppShell from "../components/layout/AppShell";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state?.isAuthenticated ?? false);
  const isLoading = useAuthStore((state) => state?.isLoading ?? true);
  const user = useAuthStore((state) => state?.user ?? null);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
