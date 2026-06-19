import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { useAuthStore } from "../../store";

export default function AdminLogoutButton() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    // Navigate first to avoid route guard redirect
    navigate("/", { replace: true });
    // Then update auth state and clear storage
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  };

  return (
    <button className="admin-logout-btn" type="button" onClick={handleLogout}>
      <FaSignOutAlt />
      Logout
    </button>
  );
}
