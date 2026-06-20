import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import supportService, { type TicketWithReplies } from '../../services/support.service';
import { FaArrowLeft, FaPaperPlane, FaUser, FaHeadset } from 'react-icons/fa';
import { useAuthStore } from '../../store/useAuthStore';

export default function TicketConversationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<TicketWithReplies | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.replies]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await supportService.getTicketById(id!);
      
      // Fetch replies separately (admin endpoint returns replies, user endpoint doesn't)
      // So we'll need to modify this if user endpoint supports replies
      setTicket(response.data as any);
    } catch (error: any) {
      console.error('Failed to fetch ticket:', error);
      toast.error('Failed to load ticket details');
      navigate('/support/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (ticket?.status === 'closed') {
      toast.error('Cannot reply to a closed ticket');
      return;
    }

    try {
      setSending(true);
      
      // For now, users can't reply directly - they would need to create a new ticket
      // or the backend needs to support user replies
      toast.info('Reply feature coming soon. Please create a new ticket for follow-up questions.');
      
      setReplyMessage('');
    } catch (error: any) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
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
      <div className="page-container">
        <div className="nex-loading">
          <div className="nex-spinner" />
          <p>Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="page-container">
        <div className="nex-empty-state">
          <p>Ticket not found</p>
          <button onClick={() => navigate('/support/tickets')} className="nex-btn-primary">
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button 
            onClick={() => navigate('/support/tickets')}
            className="nex-btn-secondary"
            style={{ marginBottom: '1rem' }}
          >
            <FaArrowLeft /> Back to Tickets
          </button>
          <h1 className="page-title">Ticket #{ticket.ticket_number}</h1>
          <p className="page-subtitle">{ticket.subject}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
        {/* Conversation Area */}
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Conversation</h2>
          </div>
          <div className="nex-card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {/* Original Message */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              borderLeft: '3px solid #3b82f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FaUser style={{ color: '#3b82f6' }} />
                <strong>{user?.username || 'You'}</strong>
                <span className="nex-badge nex-badge-info">Original Message</span>
                <span className="nex-table-meta" style={{ marginLeft: 'auto' }}>
                  {formatDate(ticket.created_at)}
                </span>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
            </div>

            {/* Replies */}
            {ticket.replies && ticket.replies.length > 0 && ticket.replies.map((reply) => (
              <div
                key={reply.id}
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: reply.is_admin ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  borderLeft: reply.is_admin ? '3px solid #10b981' : '3px solid #3b82f6'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {reply.is_admin ? <FaHeadset style={{ color: '#10b981' }} /> : <FaUser style={{ color: '#3b82f6' }} />}
                  <strong>{reply.username || 'Unknown'}</strong>
                  {reply.is_admin && <span className="nex-badge nex-badge-success">Support Team</span>}
                  <span className="nex-table-meta" style={{ marginLeft: 'auto' }}>
                    {formatDate(reply.created_at)}
                  </span>
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{reply.message}</p>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <div className="nex-card-body" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <form onSubmit={handleSendReply}>
                <div className="nex-form-group">
                  <label htmlFor="reply">Add a Reply</label>
                  <textarea
                    id="reply"
                    className="nex-input"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                    placeholder="Type your message here..."
                    disabled={sending}
                  />
                </div>
                <button
                  type="submit"
                  className="nex-btn-primary"
                  disabled={sending || !replyMessage.trim()}
                >
                  {sending ? (
                    <>
                      <div className="nex-spinner-small"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Send Reply
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {ticket.status === 'closed' && (
            <div className="nex-card-body" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <div style={{ 
                padding: '1rem', 
                background: 'rgba(107, 114, 128, 0.1)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p>This ticket is closed. Create a new ticket if you need further assistance.</p>
                <button
                  className="nex-btn-primary"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => navigate('/support/new')}
                >
                  Create New Ticket
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ticket Information Panel */}
        <div>
          <div className="nex-card">
            <div className="nex-card-title">
              <h3>Ticket Details</h3>
            </div>
            <div className="nex-card-body">
              <div style={{ marginBottom: '1rem' }}>
                <div className="nex-table-meta">Ticket Number</div>
                <div style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: '1.1rem' }}>
                  {ticket.ticket_number}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="nex-table-meta">Status</div>
                <span className={`nex-badge ${
                  ticket.status === 'open' ? 'nex-badge-warning' :
                  ticket.status === 'in_progress' ? 'nex-badge-info' :
                  ticket.status === 'resolved' ? 'nex-badge-success' :
                  'nex-badge-secondary'
                }`}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="nex-table-meta">Priority</div>
                <span className={`nex-badge ${
                  ticket.priority === 'high' ? 'nex-badge-danger' :
                  ticket.priority === 'medium' ? 'nex-badge-warning' :
                  'nex-badge-info'
                }`}>
                  {ticket.priority.toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="nex-table-meta">Created</div>
                <div>{formatDate(ticket.created_at)}</div>
              </div>

              {ticket.updated_at && (
                <div style={{ marginBottom: '1rem' }}>
                  <div className="nex-table-meta">Last Updated</div>
                  <div>{formatDate(ticket.updated_at)}</div>
                </div>
              )}

              {ticket.closed_at && (
                <div style={{ marginBottom: '1rem' }}>
                  <div className="nex-table-meta">Closed</div>
                  <div>{formatDate(ticket.closed_at)}</div>
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <div className="nex-table-meta">Replies</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#3b82f6' }}>
                  {ticket.replies?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Help Info */}
          <div className="nex-card" style={{ marginTop: '1rem' }}>
            <div className="nex-card-body">
              <h4 style={{ marginBottom: '0.5rem' }}>Need More Help?</h4>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                Our support team typically responds within 24 hours. For urgent issues, please email us at support@cryptoexchange.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
