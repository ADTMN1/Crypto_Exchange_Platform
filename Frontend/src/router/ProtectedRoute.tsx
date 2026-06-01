import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";
import AppShell from "../components/layout/AppShell";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return isAuthenticated ? (
    <AppShell>
      <Outlet />
    </AppShell>
  ) : (
    <Navigate to="/login" replace />
  );
}
