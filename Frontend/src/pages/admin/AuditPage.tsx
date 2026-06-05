import { useCallback, useEffect, useState } from "react";
import adminService, { AuditLog } from "../../services/admin.service";
import { toast } from "sonner";

export default function AdminAudit() {
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  const formatMetadata = (metadata: any) => {
    if (metadata == null) return "-";
    if (typeof metadata === "string") return metadata;
    try {
      return JSON.stringify(metadata);
    } catch {
      return String(metadata);
    }
  };

  const fetchAudits = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getAuditLogs({
        page,
        limit,
        search: searchQuery || undefined,
      });
      setAudits(response.data);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to fetch audit logs";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAudits();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchAudits]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Audit Logs</h1>
          <p>Inspect platform logs, changes, and compliance events.</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Audit Log Table</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by action, user, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

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
                onClick={fetchAudits}
                style={{
                  marginLeft: "1rem",
                  textDecoration: "underline",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner"></div>
              <p>Loading audit logs...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>IP Address</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="nex-empty-state">
                        <div>
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                          <p>No audit logs found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    audits.map((audit) => (
                      <tr key={audit.id}>
                        <td>{formatDate(audit.created_at)}</td>
                        <td>
                          <div>{audit.user_name || "Unknown User"}</div>
                          <div className="nex-table-meta">
                            {audit.user_email || audit.user_id || "-"}
                          </div>
                        </td>
                        <td>{audit.action}</td>
                        <td>{audit.entity_type}</td>
                        <td>{audit.entity_id || "-"}</td>
                        <td>{audit.ip_address || "-"}</td>
                        <td>{formatMetadata(audit.metadata)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && audits.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderTop: "1px solid rgba(169,255,232,0.12)",
                color: "var(--text-muted)",
                fontSize: "14px",
              }}
            >
              Showing {audits.length} of {totalCount} audit logs
              <div
                className="nex-pagination-controls"
                style={{
                  marginTop: "0.75rem",
                  display: "flex",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="button"
                  className="btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
