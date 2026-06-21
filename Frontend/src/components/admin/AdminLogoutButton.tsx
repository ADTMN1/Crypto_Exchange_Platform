import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { useAuthStore } from "../../store";

export default function AdminLogoutButton() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    // Clear auth state and storage first
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    // Navigate client-side to root. Use a microtask delay so route-guards
    // that run synchronously after state changes don't immediately redirect.
    setTimeout(() => navigate('/', { replace: true }), 0)
  };

  return (
    <button className="admin-logout-btn" type="button" onClick={handleLogout}>
      <FaSignOutAlt />
      Logout
    </button>
  );
}
