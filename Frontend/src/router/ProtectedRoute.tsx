import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";
import AppShell from "../components/layout/AppShell";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  if (isLoading) return null;

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
