import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import supportService, { type Ticket } from '../../services/support.service';
import { FaPlus, FaTicketAlt, FaClock, FaCheckCircle } from 'react-icons/fa';

export default function SupportTicketsListPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getUserTickets({ limit: 50 });
      setTickets(response.data);
      
      // Calculate stats
      const stats = response.data.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {} as any);
      
      setStats(stats);
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
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
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaTicketAlt style={{ marginRight: '0.5rem' }} />
            My Support Tickets
          </h1>
          <p className="page-subtitle">View and manage your support requests</p>
        </div>
        <button 
          className="nex-btn-primary"
          onClick={() => navigate('/support/new')}
        >
          <FaPlus /> New Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="nex-card">
          <div className="nex-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FaClock style={{ fontSize: '2rem', color: '#f59e0b' }} />
              <div>
                <div className="nex-table-meta">Open</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.open || 0}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="nex-card">
          <div className="nex-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FaClock style={{ fontSize: '2rem', color: '#3b82f6' }} />
              <div>
                <div className="nex-table-meta">In Progress</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.in_progress || 0}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="nex-card">
          <div className="nex-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FaCheckCircle style={{ fontSize: '2rem', color: '#10b981' }} />
              <div>
                <div className="nex-table-meta">Resolved</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.resolved || 0}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="nex-card">
          <div className="nex-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FaCheckCircle style={{ fontSize: '2rem', color: '#6b7280' }} />
              <div>
                <div className="nex-table-meta">Closed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.closed || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="nex-card">
        <div className="nex-card-title">
          <h2>All Tickets</h2>
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
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="nex-empty-state">
                      <div>
                        <FaTicketAlt style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No tickets found</p>
                        <button 
                          className="nex-btn-primary"
                          style={{ marginTop: '1rem' }}
                          onClick={() => navigate('/support/new')}
                        >
                          Create Your First Ticket
                        </button>
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
                      <td>
                        <div>{formatDate(ticket.created_at)}</div>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/support/tickets/${ticket.id}`)}
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
    </div>
  );
}
