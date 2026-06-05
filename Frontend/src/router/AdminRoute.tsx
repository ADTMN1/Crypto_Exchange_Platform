import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";

export default function AdminRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === "admin" ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
