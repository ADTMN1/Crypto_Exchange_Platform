import { useState, useEffect, useCallback } from "react";
import adminService, { AdminNotification } from "../../services/admin.service";
import { toast } from "sonner";

export default function NotificationHistoryPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [error, setError] = useState<string | null>(null);

const fetchNotifications = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await adminService.getAdminNotifications(); // ✅ no params

    setNotifications(response.data.notifications);
    setTotalNotifications(response.data.total);
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Failed to fetch notifications";

    setError(msg);
    toast.error(msg);
  } finally {
    setIsLoading(false);
  }
}, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

const filteredNotifications = notifications.filter((n) => {
  if (!searchQuery) return true;

  const q = searchQuery.toLowerCase();

  return (
    n.title.toLowerCase().includes(q) ||
    n.type.toLowerCase().includes(q) ||
    n.notification_id.toLowerCase().includes(q)
  );
});

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      system: "nex-badge-info",
      security: "nex-badge-danger",
      marketing: "nex-badge-purple",
      update: "nex-badge-success",
    };

    return (
      <span className={`nex-badge ${map[type] ?? "nex-badge-warning"}`}>
        {type}
      </span>
    );
  };

  const getReadRatio = (n: AdminNotification) => {
    const total = n.total_recipients || 0;
    const read = n.read_count || 0;
    if (!total) return 0;
    return Math.round((read / total) * 100);
  };

  return (
    <main className="nex-admin-section-page">
      {/* Header */}
      <section className="nex-section-header">
        <div>
          <h1>Notification History</h1>
          <p>Track system notifications and delivery status</p>
        </div>
      </section>

      {/* Body */}
      <section className="nex-section-body">
        <div className="nex-card">
          {/* Title + Search */}
          <div className="nex-card-title">
            <h2>All Notifications</h2>

            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "1rem",
                marginBottom: "1rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                color: "#ef4444",
              }}
            >
              {error}
              <button
                onClick={fetchNotifications}
                style={{
                  marginLeft: "1rem",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading notifications...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Delivery Stats</th>
                    <th>Read Rate</th>
                    <th>Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="nex-empty-state">
                        <div>
                          <p>No notifications found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((n) => (
                      <tr key={n.notification_id}>
                        {/* Title */}
                        <td>
                          <div>
                            <strong>{n.title}</strong>
                            <div className="nex-table-meta">
                              ID: {n.notification_id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td>{getTypeBadge(n.type)}</td>

                        {/* Stats */}
                        <td>
                          <div className="nex-table-meta">
                            Total: {n.total_recipients}
                          </div>
                          <div className="nex-table-meta">
                            Read: {n.read_count} | Unread: {n.unread_count}
                          </div>
                        </td>

                        {/* Read Rate */}
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              color:
                                getReadRatio(n) > 70
                                  ? "#22c55e"
                                  : getReadRatio(n) > 40
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          >
                            {getReadRatio(n)}%
                          </div>
                        </td>

                        {/* Date */}
                        <td>{formatDate(n.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!isLoading && notifications.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderTop: "1px solid rgba(169,255,232,0.12)",
                color: "var(--text-muted)",
                fontSize: "14px",
              }}
            >
              Showing {filteredNotifications.length} of {totalNotifications}{" "}
              notifications
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
