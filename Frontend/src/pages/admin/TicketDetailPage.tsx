import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import supportService, { type TicketWithReplies } from '../../services/support.service';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketWithReplies | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await supportService.getTicketWithReplies(id!);
      setTicket(response.data);
    } catch (error: any) {
      console.error('Failed to fetch ticket:', error);
      toast.error('Failed to load ticket details');
      navigate('/admin/support-ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setSubmitting(true);
      await supportService.replyToTicket(id!, replyMessage);
      toast.success('Reply sent successfully');
      setReplyMessage('');
      fetchTicketDetails();
    } catch (error: any) {
      console.error('Failed to reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;

    try {
      await supportService.closeTicket(id!);
      toast.success('Ticket closed successfully');
      fetchTicketDetails();
    } catch (error: any) {
      console.error('Failed to close ticket:', error);
      toast.error('Failed to close ticket');
    }
  };

  const handleReopenTicket = async () => {
    try {
      await supportService.reopenTicket(id!);
      toast.success('Ticket reopened successfully');
      fetchTicketDetails();
    } catch (error: any) {
      console.error('Failed to reopen ticket:', error);
      toast.error('Failed to reopen ticket');
    }
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

  if (loading) {
    return (
      <main className="nex-admin-section-page">
        <section className="nex-section-body">
          <div className="nex-loading">
            <div className="nex-spinner" />
            <p>Loading ticket details...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="nex-admin-section-page">
        <section className="nex-section-body">
          <div className="nex-empty-state">
            <p>Ticket not found</p>
            <button onClick={() => navigate('/admin/support-ticket')} className="nex-btn-primary">
              Back to Tickets
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>{ticket.status.toUpperCase()} [{ticket.ticket_number}]</h1>
          <p>{ticket.subject}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/admin/support-ticket')} className="nex-btn-secondary">
            ← Back
          </button>
          {ticket.status !== 'closed' ? (
            <button onClick={handleCloseTicket} className="nex-btn-danger">
              Close Ticket
            </button>
          ) : (
            <button onClick={handleReopenTicket} className="nex-btn-success">
              Reopen Ticket
            </button>
          )}
        </div>
      </section>

      <section className="nex-section-body">
        {/* Ticket Info */}
        <div className="nex-card" style={{ marginBottom: '2rem' }}>
          <div className="nex-card-title">
            <h2>Ticket Information</h2>
          </div>
          <div className="nex-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>User:</strong>
                <div>{ticket.user_name || 'Guest'}</div>
                <div className="nex-table-meta">{ticket.user_email}</div>
              </div>
              <div>
                <strong>Status:</strong>
                <div>
                  <span className={`nex-badge ${
                    ticket.status === 'open' ? 'nex-badge-warning' :
                    ticket.status === 'in_progress' ? 'nex-badge-info' :
                    ticket.status === 'resolved' ? 'nex-badge-success' :
                    'nex-badge-secondary'
                  }`}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <strong>Priority:</strong>
                <div>
                  <span className={`nex-badge ${
                    ticket.priority === 'high' ? 'nex-badge-danger' :
                    ticket.priority === 'medium' ? 'nex-badge-warning' :
                    'nex-badge-info'
                  }`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <strong>Created:</strong>
                <div>{formatDate(ticket.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Original Message */}
        <div className="nex-card" style={{ marginBottom: '2rem' }}>
          <div className="nex-card-title">
            <h2>Original Message</h2>
          </div>
          <div className="nex-card-body">
            <p style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
          </div>
        </div>

        {/* Conversation Thread */}
        {ticket.replies && ticket.replies.length > 0 && (
          <div className="nex-card" style={{ marginBottom: '2rem' }}>
            <div className="nex-card-title">
              <h2>Conversation ({ticket.replies.length} replies)</h2>
            </div>
            <div className="nex-card-body">
              {ticket.replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: reply.is_admin ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    borderLeft: reply.is_admin ? '3px solid #3b82f6' : '3px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>
                      {reply.username || 'Unknown'} 
                      {reply.is_admin && <span className="nex-badge nex-badge-info" style={{ marginLeft: '0.5rem' }}>Admin</span>}
                    </strong>
                    <span className="nex-table-meta">{formatDate(reply.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{reply.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Form */}
        {ticket.status !== 'closed' && (
          <div className="nex-card">
            <div className="nex-card-title">
              <h2>Reply to Ticket</h2>
            </div>
            <div className="nex-card-body">
              <form onSubmit={handleReply}>
                <div className="nex-form-group">
                  <label htmlFor="reply">Your Reply</label>
                  <textarea
                    id="reply"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={6}
                    placeholder="Type your response here..."
                    className="nex-input"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="nex-btn-primary"
                  >
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
