import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store";
import {
  FaAward,
  FaBell,
  FaBolt,
  FaChartBar,
  FaChartLine,
  FaChevronDown,
  FaChevronRight,
  FaClipboard,
  FaClipboardList,
  FaCog,
  FaCoins,
  FaCreditCard,
  FaDiscord,
  FaFileAlt,
  FaHandshake,
  FaHome,
  FaInstagram,
  FaSitemap,
  FaSignOutAlt,
  FaTicketAlt,
  FaTwitter,
  FaUser,
  FaUserFriends,
  FaUsers,
  FaWallet,
  FaMoneyBillWave,
  FaDollarSign,
  FaEllipsisH,
  FaRocket,
  FaShieldAlt,
  FaUserCircle,
} from "react-icons/fa";

const menuItems = [
  { label: "Dashboard", path: "/admin", icon: FaHome },
  {
    label: "Trade Management",
    path: "/admin/trade-management",
    icon: FaChartLine,
    children: [
      { label: "Binary Control", path: "/admin/trade-management/binary-control" },
      { label: "Spot Control", path: "/admin/trade-management/spot-control" },
    ],
  },
  {
    label: "Manage Order",
    path: "/admin/manage-order",
    icon: FaClipboardList,
    children: [
      { label: "Open Order", path: "/admin/manage-order/open-order" },
      { label: "Order History", path: "/admin/manage-order/order-history" },
      { label: "Trade History", path: "/admin/manage-order/trade-history" },
    ],
  },
  {
    label: "Manage P2P",
    path: "/admin/manage-p2p",
    icon: FaHandshake,
    children: [
      { label: "Running Trade", path: "/admin/manage-p2p/running-trade" },
      { label: "Report Trade", path: "/admin/manage-p2p/report-trade" },
      { label: "Completed Trade", path: "/admin/manage-p2p/completed-trade" },
      { label: "Manage Ad", path: "/admin/manage-p2p/manage-ad" },
      { label: "Payment Window", path: "/admin/manage-p2p/payment-window" },
      { label: "Payment Method", path: "/admin/manage-p2p/payment-method" },
    ],
  },
  {
    label: "Manage Binary",
    path: "/admin/manage-binary",
    icon: FaSitemap,
    children: [
      { label: "Running Trades", path: "/admin/manage-binary/running-trades" },
      { label: "Win Trades", path: "/admin/manage-binary/win-trades" },
      { label: "Lose Trades", path: "/admin/manage-binary/lose-trades" },
      { label: "All Trades", path: "/admin/manage-binary/all-trades" },
    ],
  },
  {
    label: "Manage Currency",
    path: "/admin/manage-currency",
    icon: FaDollarSign,
    children: [
      { label: "Crypto Currency", path: "/admin/manage-currency/crypto-currency" },
      { label: "Fiat Currency", path: "/admin/manage-currency/fiat-currency" },
    ],
  },
  { label: "Manage Market", path: "/admin/manage-market", icon: FaChartBar },
  { label: "Manage Coin Pair", path: "/admin/manage-coin-pair", icon: FaCoins },
  {
    label: "Manage Users",
    path: "/admin/users",
    icon: FaUsers,
    children: [
      { label: "Active Users", path: "/admin/users/active-users" },
      { label: "Banned Users", path: "/admin/users/banned-users" },
      { label: "Email Unverified", path: "/admin/users/email-unverified" },
      { label: "Mobile Unverified", path: "/admin/users/mobile-unverified" },
      { label: "KYC Unverified", path: "/admin/users/kyc-unverified" },
      { label: "KYC Pending", path: "/admin/users/kyc-pending" },
      { label: "All Users", path: "/admin/users" },
      { label: "Send Notification", path: "/admin/users/send-notification" },
    ],
  },
  { label: "Manage Referral", path: "/admin/manage-referral", icon: FaUserFriends },
  {
    label: "Deposits",
    path: "/admin/deposits",
    icon: FaCreditCard,
    children: [
      { label: "Pending Deposits", path: "/admin/deposits/pending-deposits" },
      { label: "Approved Deposits", path: "/admin/deposits/approved-deposits" },
      { label: "Successful Deposits", path: "/admin/deposits/successful-deposits" },
      { label: "Rejected Deposits", path: "/admin/deposits/rejected-deposits" },
      { label: "Initiated Deposits", path: "/admin/deposits/initiated-deposits" },
      { label: "All Deposits", path: "/admin/deposits" },
    ],
  },
  {
    label: "Withdrawals",
    path: "/admin/withdrawals",
    icon: FaMoneyBillWave,
    children: [
      { label: "Pending Withdrawals", path: "/admin/withdrawals/pending-withdrawals" },
      { label: "Approved Withdrawals", path: "/admin/withdrawals/approved-withdrawals" },
      { label: "Rejected Withdrawals", path: "/admin/withdrawals/rejected-withdrawals" },
      { label: "All Withdrawals", path: "/admin/withdrawals" },
    ],
  },
  {
    label: "Support Ticket",
    path: "/admin/support-ticket",
    icon: FaTicketAlt,
    children: [
      { label: "Pending Ticket", path: "/admin/support-ticket/pending-ticket" },
      { label: "Closed Ticket", path: "/admin/support-ticket/closed-ticket" },
      { label: "Answered Ticket", path: "/admin/support-ticket/answered-ticket" },
      { label: "All Ticket", path: "/admin/support-ticket" },
    ],
  },

  { label: "Report", path: "/admin/report", icon: FaFileAlt },
  { label: "Transaction History", path: "/admin/transaction-history", icon: FaClipboard },
  { label: "Login History", path: "/admin/login-history", icon: FaUser },
  { label: "Notification History", path: "/admin/notification-history", icon: FaBell },
  { label: "Subscribers", path: "/admin/subscribers", icon: FaBell },
  { label: "System Setting", path: "/admin/system-settings", icon: FaCog },
  {
    label: "Extra",
    path: "/admin/extra",
    icon: FaEllipsisH,
    children: [
      { label: "Application", path: "/admin/extra/application" },
      { label: "Server", path: "/admin/extra/server" },
      { label: "Cache", path: "/admin/extra/cache" },
      { label: "Update", path: "/admin/extra/update" },
    ],
  },
  { label: "Report & Request", path: "/admin/report-request", icon: FaClipboard },
];

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(() => {
    const activeParent = menuItems.find((item) =>
      item.children?.some((child) => location.pathname === child.path)
    );

    return activeParent?.label ?? null;
  });
  const profileName = user?.username || "Admin User";
  const profileEmail = user?.email || "admin@cryptoprop.com";
  const profileInitials = profileName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const profileRole = user?.role || "Admin";

  useEffect(() => {
    const handleProfileMenuClose = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") {
        return;
      }

      if (
        event instanceof MouseEvent &&
        profileMenuRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setIsProfileOpen(false);
    };

    document.addEventListener("mousedown", handleProfileMenuClose);
    document.addEventListener("keydown", handleProfileMenuClose);

    return () => {
      document.removeEventListener("mousedown", handleProfileMenuClose);
      document.removeEventListener("keydown", handleProfileMenuClose);
    };
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    navigate("/login", { replace: true });
  };

  return (
    <main className="nex-admin-page">
      <div className="nex-admin-shell">
        <aside className="nex-sidebar">
          <div className="nex-brand">
            <div className="nex-brand-mark">C</div>
            <span>CryptoProp</span>
          </div>


          <span className="nex-menu-label">Menu</span>
          <nav className="nex-menu">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = Boolean(item.children?.length);
              const isChildActive = item.children?.some(
                (child) => location.pathname === child.path
              );
              const isActive = location.pathname === item.path || isChildActive;
              const isOpen = openMenu === item.label || isChildActive;

              return (
                <div className="nex-menu-group" key={item.label}>
                  <button
                    className={`nex-menu-item${isActive ? " active" : ""}${
                      hasChildren ? " has-children" : ""
                    }`}
                    type="button"
                    aria-expanded={hasChildren ? isOpen : undefined}
                    onClick={() => {
                      if (hasChildren) {
                        setOpenMenu(isOpen ? null : item.label);
                        return;
                      }

                      navigate(item.path);
                    }}
                  >
                    <Icon />
                    <span>{item.label}</span>
                    {hasChildren ? (
                      <FaChevronDown className="nex-menu-caret" />
                    ) : null}
                  </button>

                  {hasChildren && isOpen ? (
                    <div className="nex-submenu">
                      {item.children?.map((child) => {
                        const isSubActive = location.pathname === child.path;

                        return (
                          <button
                            className={`nex-submenu-item${
                              isSubActive ? " active" : ""
                            }`}
                            key={child.label}
                            type="button"
                            onClick={() => navigate(child.path)}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <button className="nex-logout" type="button" onClick={handleLogout}>
            <FaSignOutAlt />
            Logout
          </button>
        </aside>

        <section className="nex-main">
          <header className="nex-topbar">
            <div className="nex-breadcrumb">
              <FaHome />
              <FaChevronRight />
              <span>Dashboard</span>
              <FaChevronRight />
              <strong>Overview</strong>
            </div>
            <div className="nex-top-actions">
             
              <button className="nex-notify-btn" type="button" title="Notifications">
                <FaBell />
              </button>
              <div className="nex-profile-menu" ref={profileMenuRef}>
                <button
                  className="nex-user-chip"
                  type="button"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsProfileOpen((current) => !current)}
                >
                  {user?.profile_image ? (
                    <img className="nex-avatar" src={user.profile_image} alt="" />
                  ) : (
                    <div className="nex-avatar">{profileInitials || "A"}</div>
                  )}
                  <span className="nex-profile-copy">
                    <strong>{profileName}</strong>
                    <span>{profileEmail}</span>
                  </span>
                  <FaChevronDown className="nex-profile-caret" />
                </button>

                {isProfileOpen ? (
                  <div className="nex-profile-dropdown" role="menu">
                    <div className="nex-profile-card">
                      {user?.profile_image ? (
                        <img className="nex-profile-avatar" src={user.profile_image} alt="" />
                      ) : (
                        <div className="nex-profile-avatar">{profileInitials || "A"}</div>
                      )}
                      <div>
                        <strong>{profileName}</strong>
                        <span>{profileEmail}</span>
                      </div>
                    </div>
                    <div className="nex-profile-meta">
                      <span>{profileRole}</span>
                      <span>Verified</span>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/admin/profile");
                      }}
                    >
                      <FaUserCircle />
                      Profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/admin/security");
                      }}
                    >
                      <FaShieldAlt />
                      Security
                    </button>
                    <button
                      className="danger"
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="nex-content">
            {location.pathname === "/admin" ? (
              <>
                <section className="nex-hero-card">
                  <div className="nex-hero-copy">
                    <span>Upcoming holidays</span>
                    <h1>Independence Day</h1>
                    <p>
                      Due to the July 4th holiday, trading hours may change. Please review
                      the schedule and plan accordingly.
                    </p>
                    <button type="button">
                      Send notification
                      <FaChevronRight />
                    </button>
                  </div>
                  <div className="nex-hero-orbit">
                    <div className="nex-orbit-card">
                      <div className="nex-orbit-logo">C</div>
                    </div>
                  </div>
                  <div className="nex-slider-dots">
                    <i className="active" />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </section>

                <section className="nex-card-grid">
                  <article className="nex-feature-card discord">
                    <div>
                      <h2>CryptoProp Discord</h2>
                      <p>Preview snapshots of upcoming news.</p>
                      <button type="button">
                        Follow Us
                        <FaChevronRight />
                      </button>
                    </div>
                    <FaDiscord className="nex-feature-watermark" />
                  </article>

                  <article className="nex-feature-card rewards">
                    <div>
                      <h2>Refer and Earn Rewards</h2>
                      <p>Refer a friend and get rewarded for your efforts.</p>
                      <button type="button">
                        Invite a friend
                        <FaChevronRight />
                      </button>
                    </div>
                    <div className="nex-network">
                      <span />
                      <span />
                      <span />
                      <FaBolt />
                    </div>
                  </article>

                  <div className="nex-social-stack">
                    <article className="nex-social-card">
                      <FaTwitter />
                      <p>Follow CryptoProp Twitter to see snapshots of upcoming news.</p>
                      <button type="button">
                        Follow Us
                        <FaChevronRight />
                      </button>
                    </article>
                    <article className="nex-social-card">
                      <FaInstagram />
                      <p>Follow CryptoProp Instagram to see snapshots of upcoming news.</p>
                      <button type="button">
                        Invite a friend
                        <FaChevronRight />
                      </button>
                    </article>
                  </div>
                </section>

                <section className="nex-kyc-strip">
                  <div className="nex-card-icon small">
                    <FaAward />
                  </div>
                  <div>
                    <strong>Congrats on passing your challenge</strong>
                    <p>Next Steps: Complete KYC. Sign Trader Agreement</p>
                  </div>
                  <button type="button">
                    Complete KYC
                    <FaChevronRight />
                  </button>
                </section>

                <section className="nex-active-section">
                  <h2>
                    Active Challenges <span>(0)</span>
                  </h2>
                  <div className="nex-account-card">
                    <div className="nex-account-top">
                      <div>
                        <span>Login ID:</span>
                        <strong>20910729611</strong>
                      </div>
                      <em>Live</em>
                      <div className="nex-account-pills">
                        <span>Type: Two Phase</span>
                        <span>Starting Balance: $200,000</span>
                      </div>
                      <div className="nex-account-actions">
                        <button type="button">Credentials</button>
                        <button className="primary" type="button">Dashboard</button>
                      </div>
                    </div>
                    <div className="nex-summary">
                      <button type="button">Hide Summary</button>
                      <div className="nex-summary-grid">
                        <span>
                          Equity <strong>$200,000</strong>
                        </span>
                        <span>
                          Daily Loss <strong>$0.00</strong>
                        </span>
                        <span>
                          Profit Target <strong>10%</strong>
                        </span>
                        <span>
                          Status <strong>Healthy</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <Outlet />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
