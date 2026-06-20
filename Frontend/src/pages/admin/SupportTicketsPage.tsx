import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import supportService, { type Ticket, type TicketCounts } from '../../services/support.service';

export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<TicketCounts>({ all: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });

  useEffect(() => {
    fetchTickets();
    fetchCounts();
  }, [statusFilter, pagination.offset]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: pagination.limit,
        offset: pagination.offset
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await supportService.getAllTickets(params);
      setTickets(response.data);
      setPagination(prev => ({ ...prev, total: response.pagination.total }));
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await supportService.getTicketCounts();
      setCounts(response.data);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  const handleStatusChange = (status: string) => {
    setSearchParams({ status });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: 'nex-badge-warning',
      in_progress: 'nex-badge-info',
      resolved: 'nex-badge-success',
      closed: 'nex-badge-secondary'
    };
    return `nex-badge ${badges[status] || 'nex-badge-secondary'}`;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Support Tickets</h1>
          <p>Manage customer support tickets and inquiries</p>
        </div>
      </section>

      <section className="nex-section-body">
        {/* Status Tabs */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleStatusChange('all')}
            className={`nex-badge ${statusFilter === 'all' ? 'nex-badge-primary' : 'nex-badge-secondary'}`}
            style={{ cursor: 'pointer', padding: '8px 16px' }}
          >
            All Tickets ({counts.all})
          </button>
          <button
            onClick={() => handleStatusChange('open')}
            className={`nex-badge ${statusFilter === 'open' ? 'nex-badge-warning' : 'nex-badge-secondary'}`}
            style={{ cursor: 'pointer', padding: '8px 16px' }}
          >
            Open ({counts.open})
          </button>
          <button
            onClick={() => handleStatusChange('in_progress')}
            className={`nex-badge ${statusFilter === 'in_progress' ? 'nex-badge-info' : 'nex-badge-secondary'}`}
            style={{ cursor: 'pointer', padding: '8px 16px' }}
          >
            In Progress ({counts.in_progress})
          </button>
          <button
            onClick={() => handleStatusChange('resolved')}
            className={`nex-badge ${statusFilter === 'resolved' ? 'nex-badge-success' : 'nex-badge-secondary'}`}
            style={{ cursor: 'pointer', padding: '8px 16px' }}
          >
            Resolved ({counts.resolved})
          </button>
          <button
            onClick={() => handleStatusChange('closed')}
            className={`nex-badge ${statusFilter === 'closed' ? 'nex-badge-secondary' : 'nex-badge-secondary'}`}
            style={{ cursor: 'pointer', padding: '8px 16px' }}
          >
            Closed ({counts.closed})
          </button>
        </div>

        {/* Tickets Table */}
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Tickets</h2>
            <div className="nex-badge nex-badge-info">
              {pagination.total} total
            </div>
          </div>

          {loading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading tickets...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>User</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Replies</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="nex-empty-state">
                        <div>
                          <p>No tickets found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                            {ticket.ticket_number}
                          </span>
                        </td>
                        <td>
                          <div>
                            <strong>{ticket.username || 'Guest'}</strong>
                            <div className="nex-table-meta">{ticket.email}</div>
                          </div>
                        </td>
                        <td>
                          <strong>{ticket.subject}</strong>
                        </td>
                        <td>
                          <span className={getStatusBadge(ticket.status)}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`nex-badge ${
                            ticket.priority === 'high' ? 'nex-badge-danger' :
                            ticket.priority === 'medium' ? 'nex-badge-warning' :
                            'nex-badge-info'
                          }`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </td>
                        <td>{ticket.reply_count || 0}</td>
                        <td>
                          <div>{formatDate(ticket.created_at)}</div>
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/admin/support-ticket/${ticket.id}`)}
                            className="nex-btn-xs nex-btn-primary"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
