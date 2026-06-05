import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";

export default function GuestRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <Navigate to={user?.role === "admin" ? "/admin" : "/"} replace />
  );
}
