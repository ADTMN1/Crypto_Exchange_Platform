import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";
import AppShell from "../components/layout/AppShell";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

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
