import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import supportService from '../../services/support.service';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import { useAuthStore } from '../../store/useAuthStore';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  // Only subject, category, and message from form - name and email come from logged in user
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: ''
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a support ticket');
      navigate('/login');
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Send ticket data with user info from auth store
      const ticketData = {
        name: user.username || user.email?.split('@')[0] || 'User',
        email: user.email,
        subject: formData.subject,
        category: formData.category,
        message: formData.message
      };
      
      const response = await supportService.createTicket(ticketData);
      toast.success('Support ticket created successfully!');
      navigate(`/support/tickets/${response.data.ticketId}`);
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="page-title">Create Support Ticket</h1>
          <p className="page-subtitle">Fill in the details below and we'll get back to you soon</p>
        </div>
      </div>

      <div className="nex-card">
        <div className="nex-card-title">
          <h2>Ticket Information</h2>
        </div>
        <div className="nex-card-body">
          <form onSubmit={handleSubmit}>
            {/* Display user info (read-only) */}
            <div className="nex-form-grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="nex-form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={user?.username || 'Not available'}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="nex-form-group">
                <label>Your Email</label>
                <input
                  type="email"
                  value={user?.email || 'Not available'}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="nex-form-grid-2">
              <div className="nex-form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="general">General Inquiry</option>
                  <option value="account">Account Issues</option>
                  <option value="trading">Trading Support</option>
                  <option value="deposit">Deposit/Withdrawal</option>
                  <option value="security">Security Concerns</option>
                  <option value="technical">Technical Issues</option>
                  <option value="kyc">KYC Verification</option>
                </select>
              </div>

              <div className="nex-form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Brief description of your issue"
                />
              </div>
            </div>

            <div className="nex-form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={8}
                placeholder="Please provide as much detail as possible about your issue..."
              />
              <small>
                Include any relevant details like transaction IDs, error messages, or steps to reproduce the issue
              </small>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="submit"
                className="nex-btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="nex-spinner-small"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Submit Ticket
                  </>
                )}
              </button>
              <button
                type="button"
                className="nex-btn-secondary"
                onClick={() => navigate('/support/tickets')}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Help Section */}
      <div className="nex-card" style={{ marginTop: '2rem' }}>
        <div className="nex-card-title">
          <h3>Need Immediate Help?</h3>
        </div>
        <div className="nex-card-body">
          <p style={{ marginBottom: '1rem' }}>
            Before submitting a ticket, you might find your answer in our:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '2rem', lineHeight: '2' }}>
            <li><a href="/support#faqs" style={{ color: '#3b82f6' }}>Frequently Asked Questions</a></li>
            <li><a href="/support#help-center" style={{ color: '#3b82f6' }}>Help Center Documentation</a></li>
            <li><a href="/support#contact" style={{ color: '#3b82f6' }}>Email Support: support@cryptoexchange.com</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
