import { Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "./GuestRoute";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import { useAuthStore } from "../store";
import DebugPage from "../pages/DebugPage";
import HomePage from "../pages/public/HomePage";
import LandingPage from "../pages/public/LandingPage";
import MarketsPage from "../pages/public/MarketsPage";
import MarketDashboardPage from "../pages/public/MarketDashboardPage";
import SupportPage from "../pages/public/SupportPage";
import NotFoundPage from "../pages/public/NotFoundPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import TradePage from "../pages/user/TradePage";
import TradingPage from "../pages/TradingPage";
import OrdersPage from "../pages/user/OrdersPage";
import WalletPage from "../pages/user/WalletPage";
import DepositPage from "../pages/user/DepositPage";
import WithdrawPage from "../pages/user/WithdrawPage";
import ProfilePage from "../pages/user/ProfilePage";
import SecurityPage from "../pages/user/SecurityPage";
import KYCPage from "../pages/user/KYCPage";
import NotificationsPage from "../pages/user/NotificationsPage";
import NewsPage from "../pages/user/NewsPage";
import AdminDashboardPage from "../pages/admin/DashboardPage";
import AdminUsersPage from "../pages/admin/UsersPage";
import AdminUserDetailPage from "../pages/admin/UserDetailPage";
import AdminOrdersPage from "../pages/admin/OrdersPage";
import AdminTransactionsPage from "../pages/admin/TransactionsPage";
import AdminPairsPage from "../pages/admin/PairsPage";
import AdminAuditPage from "../pages/admin/AuditPage";
import AdminProfilePage from "../pages/admin/ProfilePage";
import AdminSectionPage from "../pages/admin/AdminSectionPage";
import AdminManageUsersPage from "../pages/admin/ManageUsersPage";
import HistoryPage from "../pages/user/HistoryPage";
import NotificationHistoryPage from "../pages/user/NotificationHistoryPage";
import BinaryTradesPage from "../pages/admin/BinaryTradesPage";
import P2POrdersPage from "../pages/admin/P2POrdersPage";
import P2PDisputesPage from "../pages/admin/P2PDisputesPage";
import CryptoCurrencyPage from "../pages/admin/CryptoCurrencyPage";
import FiatCryptoCurrencyPage from "../pages/admin/FiatCrptoCurrencyPage";
import OpenOrdersPage from "../pages/admin/OpenOrdersPage";
import OrderHistoryPage from "../pages/admin/OrderHistoryPage";
import TradeHistoryPage from "../pages/admin/TradeHistoryPage";
import RunningP2PTradesPage from "../pages/admin/RunningP2PTradesPage";
import RunningBinaryTradesPage from "../pages/admin/RunningBinaryTradesPage";
import MarketListPage from "../pages/admin/MarketListPage";
import CoinPairsPage from "../pages/admin/CoinPairsPage";
import CompletedP2PTradesPage from "../pages/admin/CompletedP2PTradesPage";
import SystemSettingsPage from "../pages/admin/SystemSettingsPage";
import GeneralSettingsPage from "../pages/admin/GeneralSettingsPage";
import ImpersonatePage from "../pages/admin/ImpersonatePage";

const adminSectionRoutes = [
  {
    path: "/admin/trade-management",
    title: "Trade Management",
    description: "Manage trade operations, matching rules, and execution settings.",
  },
  {
    path: "/admin/security",
    title: "Security",
    description: "Review admin security settings and access controls.",
  },
  {
    path: "/admin/trade-management/binary-control",
    title: "Binary Control",
    description: "Configure binary trading controls, limits, and execution rules.",
  },
  {
    path: "/admin/trade-management/spot-control",
    title: "Spot Control",
    description: "Configure spot trading controls, market access, and execution rules.",
  },
  {
    path: "/admin/manage-order",
    title: "Manage Order",
    description: "Review and modify open orders across the platform.",
  },
  {
    path: "/admin/manage-order/open-order",
    title: "Open Order",
    description: "Review open orders and active order activity.",
  },
  {
    path: "/admin/manage-order/order-history",
    title: "Order History",
    description: "Review historical order activity across the platform.",
  },
  {
    path: "/admin/manage-order/trade-history",
    title: "Trade History",
    description: "Review completed trade execution history.",
  },
  {
    path: "/admin/manage-p2p",
    title: "Manage P2P",
    description: "Manage peer-to-peer transactions and listings.",
  },
  {
    path: "/admin/manage-p2p/running-trade",
    title: "Running Trade",
    description: "Monitor active peer-to-peer trades.",
  },
  {
    path: "/admin/manage-p2p/report-trade",
    title: "Report Trade",
    description: "Review reported peer-to-peer trades and disputes.",
  },
  {
    path: "/admin/manage-p2p/completed-trade",
    title: "Completed Trade",
    description: "Review completed peer-to-peer trade records.",
  },
  {
    path: "/admin/manage-p2p/manage-ad",
    title: "Manage Ad",
    description: "Manage peer-to-peer ads and listing settings.",
  },
  {
    path: "/admin/manage-p2p/payment-window",
    title: "Payment Window",
    description: "Configure peer-to-peer payment windows and timing rules.",
  },
  {
    path: "/admin/manage-p2p/payment-method",
    title: "Payment Method",
    description: "Manage peer-to-peer payment method options.",
  },
  {
    path: "/admin/manage-binary",
    title: "Manage Binary",
    description: "Configure binary settings and trading controls.",
  },
  {
    path: "/admin/manage-binary/running-trades",
    title: "Running Trades",
    description: "Monitor active binary trades.",
  },
  {
    path: "/admin/manage-binary/win-trades",
    title: "Win Trades",
    description: "Review winning binary trade outcomes.",
  },
  {
    path: "/admin/manage-binary/lose-trades",
    title: "Lose Trades",
    description: "Review losing binary trade outcomes.",
  },
  {
    path: "/admin/manage-binary/all-trades",
    title: "All Trades",
    description: "Review all binary trade records.",
  },
  {
    path: "/admin/manage-currency",
    title: "Manage Currency",
    description: "Manage currency settings, fees, and supported assets.",
  },
  {
    path: "/admin/manage-currency/crypto-currency",
    title: "Crypto Currency",
    description: "Manage supported crypto currencies.",
  },
  {
    path: "/admin/manage-currency/fiat-currency",
    title: "Fiat Currency",
    description: "Manage supported fiat currencies.",
  },
  {
    path: "/admin/manage-market",
    title: "Manage Market",
    description: "Manage market configurations and trading zones.",
  },
  {
    path: "/admin/manage-coin-pair",
    title: "Manage Coin Pair",
    description: "Manage trading pairs and pair-specific market rules.",
  },
  {
    path: "/admin/users/active-users",
    title: "Active Users",
    description: "Review active user accounts.",
  },
  {
    path: "/admin/users/banned-users",
    title: "Banned Users",
    description: "Review banned user accounts.",
  },
  {
    path: "/admin/users/email-unverified",
    title: "Email Unverified",
    description: "Review users with unverified email addresses.",
  },
  {
    path: "/admin/users/mobile-unverified",
    title: "Mobile Unverified",
    description: "Review users with unverified mobile numbers.",
  },
  {
    path: "/admin/users/kyc-unverified",
    title: "KYC Unverified",
    description: "Review users who have not completed KYC verification.",
  },
  {
    path: "/admin/users/kyc-pending",
    title: "KYC Pending",
    description: "Review pending KYC submissions.",
  },
  {
    path: "/admin/users/send-notification",
    title: "Send Notification",
    description: "Send notifications to selected users or account groups.",
  },
  {
    path: "/admin/manage-referral",
    title: "Manage Referral",
    description: "Review and manage referral campaigns and rewards.",
  },
  {
    path: "/admin/deposits",
    title: "Deposits",
    description: "Monitor and approve deposit transactions.",
  },
  {
    path: "/admin/deposits/pending-deposits",
    title: "Pending Deposits",
    description: "Review deposits waiting for approval.",
  },
  {
    path: "/admin/deposits/approved-deposits",
    title: "Approved Deposits",
    description: "Review approved deposit records.",
  },
  {
    path: "/admin/deposits/successful-deposits",
    title: "Successful Deposits",
    description: "Review successfully completed deposit records.",
  },
  {
    path: "/admin/deposits/rejected-deposits",
    title: "Rejected Deposits",
    description: "Review rejected deposit requests.",
  },
  {
    path: "/admin/deposits/initiated-deposits",
    title: "Initiated Deposits",
    description: "Review initiated deposit requests.",
  },
  {
    path: "/admin/withdrawals",
    title: "Withdrawals",
    description: "Review and approve withdrawal requests.",
  },
  {
    path: "/admin/withdrawals/pending-withdrawals",
    title: "Pending Withdrawals",
    description: "Review withdrawals waiting for approval.",
  },
  {
    path: "/admin/withdrawals/approved-withdrawals",
    title: "Approved Withdrawals",
    description: "Review approved withdrawal records.",
  },
  {
    path: "/admin/withdrawals/rejected-withdrawals",
    title: "Rejected Withdrawals",
    description: "Review rejected withdrawal requests.",
  },
  {
    path: "/admin/support-ticket",
    title: "Support Ticket",
    description: "Manage customer tickets and support requests.",
  },
  {
    path: "/admin/support-ticket/pending-ticket",
    title: "Pending Ticket",
    description: "Review support tickets waiting for a response.",
  },
  {
    path: "/admin/support-ticket/closed-ticket",
    title: "Closed Ticket",
    description: "Review closed support tickets.",
  },
  {
    path: "/admin/support-ticket/answered-ticket",
    title: "Answered Ticket",
    description: "Review support tickets that have been answered.",
  },
  {
    path: "/admin/report",
    title: "Report",
    description: "View operational reports and analytics.",
  },
  {
    path: "/admin/transaction-history",
    title: "Transaction History",
    description: "Review platform transaction history.",
  },
  {
    path: "/admin/login-history",
    title: "Login History",
    description: "Review user login activity and access history.",
  },
  {
    path: "/admin/notification-history",
    title: "Notification History",
    description: "Review sent notification history.",
  },
  {
    path: "/admin/subscribers",
    title: "Subscribers",
    description: "Manage newsletter subscribers and communications.",
  },
  {
    path: "/admin/system-settings",
    title: "System Setting",
    description: "Configure system-wide settings and maintenance options.",
  },
  {
    path: "/admin/extra",
    title: "Extra",
    description: "Access extra administrative tools and utilities.",
  },
  {
    path: "/admin/extra/application",
    title: "Application",
    description: "Review application configuration and status.",
  },
  {
    path: "/admin/extra/server",
    title: "Server",
    description: "Review server information and controls.",
  },
  {
    path: "/admin/extra/cache",
    title: "Cache",
    description: "Manage application cache controls.",
  },
  {
    path: "/admin/extra/update",
    title: "Update",
    description: "Manage application update controls.",
  },
  {
    path: "/admin/report-request",
    title: "Report & Request",
    description: "Handle report requests and administrative follow-ups.",
  },
];

function RootRoute() {
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

  return user?.role === "admin" ? (
    <Navigate to="/admin" replace />
  ) : (
    <HomePage />
  );
}

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<RootRoute />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/market-dashboard" element={<MarketDashboardPage />} />
        <Route path="/trading" element={<TradingPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/trade/:pair" element={<TradePage />} />
        <Route path="/trade" element={<TradePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/assets" element={<WalletPage />} />
        <Route path="/wallet/deposit" element={<DepositPage />} />
        <Route path="/wallet/withdraw" element={<WithdrawPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/security" element={<SecurityPage />} />
        <Route path="/profile/kyc" element={<KYCPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboardPage />}>
          <Route path="profile" element={<AdminProfilePage />} />
          {adminSectionRoutes && adminSectionRoutes.length > 0 && adminSectionRoutes.map((section) => {
            const sectionPath = section.path.replace("/admin/", "");
            const isManageUsersSection = section.path.startsWith("/admin/users/");
            
            // Crypto Currency page
            if (section.path === "/admin/manage-currency/crypto-currency") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<CryptoCurrencyPage />}
                />
              );
            }

            // Fiat Currency page
            if (section.path === "/admin/manage-currency/fiat-currency") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<FiatCryptoCurrencyPage />}
                />
              );
            }

            // Market List page
            if (section.path === "/admin/manage-market") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<MarketListPage />}
                />
              );
            }

            // Coin Pairs page
            if (section.path === "/admin/manage-coin-pair") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<CoinPairsPage />}
                />
              );
            }

            // Order Management pages
            if (section.path === "/admin/manage-order/open-order") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<OpenOrdersPage />}
                />
              );
            }
            if (section.path === "/admin/manage-order/order-history") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<OrderHistoryPage />}
                />
              );
            }
            if (section.path === "/admin/manage-order/trade-history") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<TradeHistoryPage />}
                />
              );
            }

            // Binary trading pages
            if (section.path === "/admin/manage-binary/running-trades") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<RunningBinaryTradesPage />}
                />
              );
            }
            if (section.path === "/admin/manage-binary/win-trades") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={
                    <BinaryTradesPage
                      status="win"
                      title={section.title}
                      description={section.description}
                    />
                  }
                />
              );
            }
            if (section.path === "/admin/manage-binary/lose-trades") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={
                    <BinaryTradesPage
                      status="lose"
                      title={section.title}
                      description={section.description}
                    />
                  }
                />
              );
            }
            if (section.path === "/admin/manage-binary/all-trades") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={
                    <BinaryTradesPage
                      status="all"
                      title={section.title}
                      description={section.description}
                    />
                  }
                />
              );
            }

            // P2P pages
            if (section.path === "/admin/manage-p2p/running-trade") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<RunningP2PTradesPage />}
                />
              );
            }
            if (section.path === "/admin/manage-p2p/completed-trade") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<CompletedP2PTradesPage />}
                />
              );
            }
            if (section.path === "/admin/manage-p2p/report-trade") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={
                    <P2PDisputesPage
                      title={section.title}
                      description={section.description}
                    />
                  }
                />
              );
            }

            // Pending Deposits page
            if (section.path === "/admin/deposits/pending-deposits") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<AdminTransactionsPage type="pending-deposits" title={section.title} description={section.description} />}
                />
              );
            }

            // System Settings page
            if (section.path === "/admin/system-settings") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<SystemSettingsPage />}
                />
              );
            }

            // Transaction History page
            if (section.path === "/admin/transaction-history") {
              return (
                <Route
                  key={section.path}
                  path={sectionPath}
                  element={<AdminTransactionsPage />}
                />
              );
            }

            return (
              <Route
                key={section.path}
                path={sectionPath}
                element={
                  isManageUsersSection ? (
                    <AdminManageUsersPage
                      title={section.title}
                      description={section.description}
                    />
                  ) : (
                    <AdminSectionPage
                      title={section.title}
                      description={section.description}
                    />
                  )
                }
              />
            );
          })} 
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="users/:id/view" element={<ImpersonatePage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="transactions" element={<AdminTransactionsPage />} />
          <Route path="pairs" element={<AdminPairsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="settings/general" element={<GeneralSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
