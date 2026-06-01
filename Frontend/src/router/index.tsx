import { Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "./GuestRoute";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import { useAuthStore } from "../store";
import HomePage from "../pages/public/HomePage";
import MarketsPage from "../pages/public/MarketsPage";
import SupportPage from "../pages/public/SupportPage";
import NotFoundPage from "../pages/public/NotFoundPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import DashboardPage from "../pages/user/DashboardPage";
import TradePage from "../pages/user/TradePage";
import OrdersPage from "../pages/user/OrdersPage";
import WalletPage from "../pages/user/WalletPage";
import DepositPage from "../pages/user/DepositPage";
import WithdrawPage from "../pages/user/WithdrawPage";
import ProfilePage from "../pages/user/ProfilePage";
import SecurityPage from "../pages/user/SecurityPage";
import KYCPage from "../pages/user/KYCPage";
import NotificationsPage from "../pages/user/NotificationsPage";
import AdminDashboardPage from "../pages/admin/DashboardPage";
import AdminUsersPage from "../pages/admin/UsersPage";
import AdminUserDetailPage from "../pages/admin/UserDetailPage";
import AdminOrdersPage from "../pages/admin/OrdersPage";
import AdminTransactionsPage from "../pages/admin/TransactionsPage";
import AdminPairsPage from "../pages/admin/PairsPage";
import AdminAuditPage from "../pages/admin/AuditPage";

function RootRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/markets" element={<MarketsPage />} />
      <Route path="/support" element={<SupportPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/trade/:pair" element={<TradePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/deposit" element={<DepositPage />} />
        <Route path="/wallet/withdraw" element={<WithdrawPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/security" element={<SecurityPage />} />
        <Route path="/profile/kyc" element={<KYCPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
        <Route path="/admin/pairs" element={<AdminPairsPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
