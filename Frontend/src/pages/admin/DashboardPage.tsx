import { useEffect, useRef, useState, useCallback } from "react";
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
  FaHome,
  FaInstagram,
  FaSitemap,
  FaSignOutAlt,
  FaTicketAlt,
  FaTwitter,
  FaUser,
  FaUsers,
  FaMoneyBillWave,
  FaShieldAlt,
  FaUserCircle,
  FaHistory,
  FaCheckDouble,
  FaTimes,
  FaUserPlus,
  FaArrowDown,
  FaArrowUp,
  FaHeadset,
  FaBan,
} from "react-icons/fa";
import notificationService, { AdminBellNotification } from "../../services/notification.service";

// ─── notification helpers ────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

const TYPE_ICON_BG: Record<string, string> = {
  USER_REGISTERED:        'rgba(34,197,94,0.15)',
  DEPOSIT_REQUESTED:      'rgba(59,130,246,0.15)',
  DEPOSIT_APPROVED:       'rgba(34,197,94,0.15)',
  DEPOSIT_REJECTED:       'rgba(239,68,68,0.15)',
  WITHDRAWAL_REQUESTED:   'rgba(245,158,11,0.15)',
  WITHDRAWAL_APPROVED:    'rgba(34,197,94,0.15)',
  WITHDRAWAL_REJECTED:    'rgba(239,68,68,0.15)',
  SUPPORT_TICKET_CREATED: 'rgba(139,92,246,0.15)',
  USER_BANNED:            'rgba(239,68,68,0.15)',
};

const TYPE_ICON_COLOR: Record<string, string> = {
  USER_REGISTERED:        '#22c55e',
  DEPOSIT_REQUESTED:      '#3b82f6',
  DEPOSIT_APPROVED:       '#22c55e',
  DEPOSIT_REJECTED:       '#ef4444',
  WITHDRAWAL_REQUESTED:   '#f59e0b',
  WITHDRAWAL_APPROVED:    '#22c55e',
  WITHDRAWAL_REJECTED:    '#ef4444',
  SUPPORT_TICKET_CREATED: '#8b5cf6',
  USER_BANNED:            '#ef4444',
};

function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case 'USER_REGISTERED':        return <FaUserPlus />;
    case 'DEPOSIT_REQUESTED':
    case 'DEPOSIT_APPROVED':
    case 'DEPOSIT_REJECTED':       return <FaArrowDown />;
    case 'WITHDRAWAL_REQUESTED':
    case 'WITHDRAWAL_APPROVED':
    case 'WITHDRAWAL_REJECTED':    return <FaArrowUp />;
    case 'SUPPORT_TICKET_CREATED': return <FaHeadset />;
    case 'USER_BANNED':            return <FaBan />;
    default:                       return <FaBell />;
  }
}

// ─── sidebar menu ────────────────────────────────────────────────────────────

const menuItems = [
  { label: "Dashboard", path: "/admin", icon: FaHome },
  {
    label: "Trade Management", path: "/admin/trade-management", icon: FaChartLine,
    children: [
      { label: "Binary Control", path: "/admin/trade-management/binary-control" },
      { label: "Spot Control",   path: "/admin/trade-management/spot-control"   },
    ],
  },
  {
    label: "Manage Order", path: "/admin/manage-order", icon: FaClipboardList,
    children: [
      { label: "Open Order",    path: "/admin/manage-order/open-order"    },
      { label: "Order History", path: "/admin/manage-order/order-history" },
      { label: "Trade History", path: "/admin/manage-order/trade-history" },
    ],
  },
  {
    label: "Manage Binary", path: "/admin/manage-binary", icon: FaSitemap,
    children: [
      { label: "Running Trades", path: "/admin/manage-binary/running-trades" },
      { label: "Win Trades",     path: "/admin/manage-binary/win-trades"     },
      { label: "Lose Trades",    path: "/admin/manage-binary/lose-trades"    },
      { label: "All Trades",     path: "/admin/manage-binary/all-trades"     },
    ],
  },
  { label: "Manage Market",    path: "/admin/manage-market",    icon: FaChartBar  },
  { label: "Manage Coin Pair", path: "/admin/manage-coin-pair", icon: FaCoins     },
  {
    label: "Manage Users", path: "/admin/users", icon: FaUsers,
    children: [
      { label: "Active Users",       path: "/admin/users/active-users"        },
      { label: "Banned Users",       path: "/admin/users/banned-users"        },
      { label: "Email Unverified",   path: "/admin/users/email-unverified"    },
      { label: "KYC Unverified",     path: "/admin/users/kyc-unverified"      },
      { label: "KYC Pending",        path: "/admin/users/kyc-pending"         },
      { label: "All Users",          path: "/admin/users"                     },
      { label: "Send Notification",  path: "/admin/users/send-notification"   },
    ],
  },
  {
    label: "Deposits", path: "/admin/deposits", icon: FaCreditCard,
    children: [
      { label: "Pending Deposits",  path: "/admin/deposits/pending-deposits"  },
      { label: "Approved Deposits", path: "/admin/deposits/approved-deposits" },
      { label: "Rejected Deposits", path: "/admin/deposits/rejected-deposits" },
      { label: "All Deposits",      path: "/admin/deposits"                   },
    ],
  },
  {
    label: "Withdrawals", path: "/admin/withdrawals", icon: FaMoneyBillWave,
    children: [
      { label: "Pending Withdrawals",  path: "/admin/withdrawals/pending-withdrawals"  },
      { label: "Approved Withdrawals", path: "/admin/withdrawals/approved-withdrawals" },
      { label: "Rejected Withdrawals", path: "/admin/withdrawals/rejected-withdrawals" },
      { label: "All Withdrawals",      path: "/admin/withdrawals"                      },
    ],
  },
  {
    label: "Support Ticket", path: "/admin/support-ticket", icon: FaTicketAlt,
    children: [
      { label: "Pending Ticket",  path: "/admin/support-ticket/pending-ticket"  },
      { label: "Closed Ticket",   path: "/admin/support-ticket/closed-ticket"   },
      { label: "Answered Ticket", path: "/admin/support-ticket/answered-ticket" },
      { label: "All Ticket",      path: "/admin/support-ticket"                 },
    ],
  },
  { label: "Transaction History",  path: "/admin/transaction-history",  icon: FaClipboard },
  { label: "Login History",        path: "/admin/login-history",        icon: FaUser      },
  { label: "Audit Log",            path: "/admin/audit",                icon: FaHistory   },
  { label: "Notification History", path: "/admin/notification-history", icon: FaBell      },
  { label: "System Setting",       path: "/admin/system-settings",      icon: FaCog       },
  { label: "Report & Request",     path: "/admin/report-request",       icon: FaClipboard },
];

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notifyRef      = useRef<HTMLDivElement | null>(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifyOpen,  setIsNotifyOpen]  = useState(false);
  const [notifications, setNotifications] = useState<AdminBellNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const [openMenu, setOpenMenu] = useState<string | null>(() => {
    const activeParent = menuItems.find((item) =>
      item.children?.some((child) => location.pathname === child.path)
    );
    return activeParent?.label ?? null;
  });

  // ── fetch 3 most recent, unread-first ────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const [nRes, count] = await Promise.all([
        notificationService.getAdminNotifications(1, 3),
        notificationService.getAdminUnreadCount(),
      ]);
      const sorted = [...nRes.data.notifications].sort((a, b) => {
        if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setNotifications(sorted);
      setUnreadCount(count);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // close notify on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifyRef.current && !notifyRef.current.contains(e.target as Node))
        setIsNotifyOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationService.markAllAdminNotificationsRead();
      setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  const handleMarkOneRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAdminNotificationRead(id);
      setNotifications((p) => p.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }, []);

  // ── profile helpers ───────────────────────────────────────────────────────
  const profileName     = user?.username || "Admin User";
  const profileEmail    = user?.email    || "admin@cryptoprop.com";
  const profileInitials = profileName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const profileRole     = user?.role || "Admin";

  // close profile on outside click / Escape
  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && profileMenuRef.current?.contains(e.target as Node)) return;
      setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown",   handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown",   handler);
    };
  }, []);

  const handleLogout = () => {
    navigate("/", { replace: true });
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
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
              const hasChildren  = Boolean(item.children?.length);
              const isChildActive = item.children?.some((c) => location.pathname === c.path);
              const isActive = location.pathname === item.path || isChildActive;
              const isOpen   = openMenu === item.label || isChildActive;

              return (
                <div className="nex-menu-group" key={item.label}>
                  <button
                    className={`nex-menu-item${isActive ? " active" : ""}${hasChildren ? " has-children" : ""}`}
                    type="button"
                    aria-expanded={hasChildren ? isOpen : undefined}
                    onClick={() => {
                      if (hasChildren) { setOpenMenu(isOpen ? null : item.label); return; }
                      navigate(item.path);
                    }}
                  >
                    <Icon />
                    <span>{item.label}</span>
                    {hasChildren && <FaChevronDown className="nex-menu-caret" />}
                  </button>

                  {hasChildren && isOpen && (
                    <div className="nex-submenu">
                      {item.children?.map((child) => (
                        <button
                          className={`nex-submenu-item${location.pathname === child.path ? " active" : ""}`}
                          key={child.label}
                          type="button"
                          onClick={() => navigate(child.path)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
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
              <FaHome /><FaChevronRight /><span>Dashboard</span><FaChevronRight /><strong>Overview</strong>
            </div>

            <div className="nex-top-actions">
              {/* ── notification bell ──────────────────────────────────────── */}
              <div ref={notifyRef} style={{ position: 'relative' }}>
                {/* bell button */}
                <button
                  className="nex-notify-btn"
                  type="button"
                  title="Notifications"
                  aria-expanded={isNotifyOpen}
                  aria-haspopup="true"
                  onClick={() => setIsNotifyOpen((o) => !o)}
                  style={{ position: 'relative' }}
                >
                  <FaBell />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -5, right: -5,
                      background: '#ef4444', color: '#fff',
                      borderRadius: '50%', fontSize: '0.6rem', fontWeight: 700,
                      minWidth: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px', lineHeight: 1, border: '2px solid var(--bg, #131620)',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* dropdown */}
                {isNotifyOpen && (
                  <div
                    role="dialog"
                    aria-label="Notifications"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      right: 0,
                      width: 'min(460px, calc(100vw - 2rem))',
                      background: 'var(--card-bg, #1a1f2e)',
                      border: '1px solid rgba(169,255,232,0.14)',
                      borderRadius: 12,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
                      zIndex: 300,
                      overflow: 'hidden',
                    }}
                  >
                    {/* header row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.9rem 1.1rem',
                      borderBottom: '1px solid rgba(169,255,232,0.1)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary, #e8f0fe)' }}>
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span style={{
                            background: 'rgba(169,255,232,0.12)', color: '#a9ffe8',
                            borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
                            padding: '2px 8px',
                          }}>
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#a9ffe8', fontSize: '0.75rem',
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '3px 6px', borderRadius: 4,
                            }}
                          >
                            <FaCheckDouble size={11} />
                            Mark all read
                          </button>
                        )}
                        <button
                          type="button"
                          title="Close"
                          onClick={() => setIsNotifyOpen(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px' }}
                        >
                          <FaTimes size={13} />
                        </button>
                      </div>
                    </div>

                    {/* list */}
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: '2.75rem 1.5rem', textAlign: 'center',
                        color: 'var(--text-muted)',
                      }}>
                        <FaBell size={34} style={{ opacity: 0.2, display: 'block', margin: '0 auto 0.75rem' }} />
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--text-primary, #e8f0fe)' }}>
                          You're all caught up
                        </p>
                        <p style={{ fontSize: '0.78rem', margin: 0 }}>
                          New notifications will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => { if (!n.is_read) handleMarkOneRead(n.id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !n.is_read) handleMarkOneRead(n.id); }}
                          style={{
                            display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                            padding: '0.95rem 1.1rem',
                            borderBottom: '1px solid rgba(169,255,232,0.07)',
                            background: n.is_read ? 'transparent' : 'rgba(169,255,232,0.04)',
                            cursor: n.is_read ? 'default' : 'pointer',
                            transition: 'background 0.15s',
                            outline: 'none',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = 'rgba(169,255,232,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background =
                              n.is_read ? 'transparent' : 'rgba(169,255,232,0.04)';
                          }}
                        >
                          {/* type icon */}
                          <div style={{
                            flexShrink: 0, width: 38, height: 38, borderRadius: '50%',
                            background: TYPE_ICON_BG[n.type] ?? 'rgba(169,255,232,0.1)',
                            color: TYPE_ICON_COLOR[n.type] ?? '#a9ffe8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.85rem', marginTop: 1,
                          }}>
                            <NotifIcon type={n.type} />
                          </div>

                          {/* text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex', alignItems: 'flex-start',
                              justifyContent: 'space-between', gap: '0.4rem',
                              marginBottom: '0.2rem',
                            }}>
                              <span style={{
                                fontWeight: n.is_read ? 500 : 700,
                                fontSize: '0.84rem',
                                color: 'var(--text-primary, #e8f0fe)',
                                lineHeight: 1.3,
                              }}>
                                {n.title}
                              </span>
                              {!n.is_read && (
                                <span style={{
                                  flexShrink: 0, width: 8, height: 8,
                                  borderRadius: '50%', background: '#a9ffe8', marginTop: 4,
                                }} />
                              )}
                            </div>
                            <p style={{
                              margin: '0 0 0.3rem',
                              color: 'var(--text-muted)', fontSize: '0.77rem', lineHeight: 1.45,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as const,
                              overflow: 'hidden',
                            }}>
                              {n.body}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.75 }}>
                              {relativeTime(n.created_at)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    {/* footer — view all */}
                    <div style={{ borderTop: '1px solid rgba(169,255,232,0.1)' }}>
                      <button
                        type="button"
                        onClick={() => { setIsNotifyOpen(false); navigate('/admin/notification-history'); }}
                        style={{
                          display: 'block', width: '100%',
                          padding: '0.85rem 1.1rem',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#a9ffe8', fontSize: '0.82rem', fontWeight: 600,
                          textAlign: 'center', letterSpacing: '0.01em',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(169,255,232,0.07)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'none';
                        }}
                      >
                        View All Notifications →
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* ── end notification bell ──────────────────────────────────── */}

              <div className="nex-profile-menu" ref={profileMenuRef}>
                <button
                  className="nex-user-chip"
                  type="button"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsProfileOpen((c) => !c)}
                >
                  {user?.profile_image
                    ? <img className="nex-avatar" src={user.profile_image} alt="" />
                    : <div className="nex-avatar">{profileInitials || "A"}</div>
                  }
                  <span className="nex-profile-copy">
                    <strong>{profileName}</strong>
                    <span>{profileEmail}</span>
                  </span>
                  <FaChevronDown className="nex-profile-caret" />
                </button>

                {isProfileOpen && (
                  <div className="nex-profile-dropdown" role="menu">
                    <div className="nex-profile-card">
                      {user?.profile_image
                        ? <img className="nex-profile-avatar" src={user.profile_image} alt="" />
                        : <div className="nex-profile-avatar">{profileInitials || "A"}</div>
                      }
                      <div>
                        <strong>{profileName}</strong>
                        <span>{profileEmail}</span>
                      </div>
                    </div>
                    <div className="nex-profile-meta">
                      <span>{profileRole}</span>
                      <span>Verified</span>
                    </div>
                    <button type="button" role="menuitem" onClick={() => { setIsProfileOpen(false); navigate("/admin/profile"); }}>
                      <FaUserCircle /> Profile
                    </button>
                    <button type="button" role="menuitem" onClick={() => { setIsProfileOpen(false); navigate("/admin/security"); }}>
                      <FaShieldAlt /> Security
                    </button>
                    <button className="danger" type="button" role="menuitem" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
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
                    <p>Due to the July 4th holiday, trading hours may change. Please review the schedule and plan accordingly.</p>
                    <button type="button">Send notification <FaChevronRight /></button>
                  </div>
                  <div className="nex-hero-orbit">
                    <div className="nex-orbit-card"><div className="nex-orbit-logo">C</div></div>
                  </div>
                  <div className="nex-slider-dots">
                    <i className="active" /><i /><i /><i /><i />
                  </div>
                </section>

                <section className="nex-card-grid">
                  <article className="nex-feature-card discord">
                    <div>
                      <h2>CryptoProp Discord</h2>
                      <p>Preview snapshots of upcoming news.</p>
                      <button type="button">Follow Us <FaChevronRight /></button>
                    </div>
                    <FaDiscord className="nex-feature-watermark" />
                  </article>

                  <article className="nex-feature-card rewards">
                    <div>
                      <h2>Refer and Earn Rewards</h2>
                      <p>Refer a friend and get rewarded for your efforts.</p>
                      <button type="button">Invite a friend <FaChevronRight /></button>
                    </div>
                    <div className="nex-network">
                      <span /><span /><span /><FaBolt />
                    </div>
                  </article>

                  <div className="nex-social-stack">
                    <article className="nex-social-card">
                      <FaTwitter />
                      <p>Follow CryptoProp Twitter to see snapshots of upcoming news.</p>
                      <button type="button">Follow Us <FaChevronRight /></button>
                    </article>
                    <article className="nex-social-card">
                      <FaInstagram />
                      <p>Follow CryptoProp Instagram to see snapshots of upcoming news.</p>
                      <button type="button">Invite a friend <FaChevronRight /></button>
                    </article>
                  </div>
                </section>

                <section className="nex-kyc-strip">
                  <div className="nex-card-icon small"><FaAward /></div>
                  <div>
                    <strong>Congrats on passing your challenge</strong>
                    <p>Next Steps: Complete KYC. Sign Trader Agreement</p>
                  </div>
                  <button type="button">Complete KYC <FaChevronRight /></button>
                </section>

                <section className="nex-active-section">
                  <h2>Active Challenges <span>(0)</span></h2>
                  <div className="nex-account-card">
                    <div className="nex-account-top">
                      <div><span>Login ID:</span><strong>20910729611</strong></div>
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
                        <span>Equity <strong>$200,000</strong></span>
                        <span>Daily Loss <strong>$0.00</strong></span>
                        <span>Profit Target <strong>10%</strong></span>
                        <span>Status <strong>Healthy</strong></span>
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
