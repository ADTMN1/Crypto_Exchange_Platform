import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHeadset, 
  FaEnvelope, 
  FaPhone, 
  FaComments, 
  FaQuestionCircle, 
  FaBook,
  FaRocket,
  FaShieldAlt,
  FaExchangeAlt,
  FaWallet,
  FaPaperPlane,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function SupportPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const faqs: FAQItem[] = [
    {
      category: 'getting-started',
      question: 'How do I create an account?',
      answer: 'Click the "Register" button in the top right corner, fill in your email, username, and password, then verify your email address. You can also sign up using Google OAuth for faster registration.'
    },
    {
      category: 'getting-started',
      question: 'What verification is required?',
      answer: 'Basic account access requires email verification. For higher withdrawal limits and full trading features, you\'ll need to complete KYC (Know Your Customer) verification by uploading a government ID and proof of address.'
    },
    {
      category: 'security',
      question: 'How do I enable Two-Factor Authentication (2FA)?',
      answer: 'Go to Profile > Security Settings, then enable 2FA. You\'ll need to scan the QR code with an authenticator app like Google Authenticator or Authy. Always save your backup codes in a secure location.'
    },
    {
      category: 'security',
      question: 'What should I do if my account is compromised?',
      answer: 'Immediately contact our support team via email or live chat. Change your password if you still have access, and we\'ll freeze your account to prevent unauthorized transactions while we investigate.'
    },
    {
      category: 'trading',
      question: 'What trading pairs are available?',
      answer: 'We support major trading pairs including BTC/USDT, ETH/USDT, BNB/USDT, and many more. Visit the Markets page to see all available pairs and their current prices.'
    },
    {
      category: 'trading',
      question: 'What are market and limit orders?',
      answer: 'Market orders execute immediately at the current market price. Limit orders let you set a specific price at which you want to buy or sell, and will only execute when the market reaches that price.'
    },
    {
      category: 'trading',
      question: 'What fees do you charge?',
      answer: 'We charge a competitive 0.1% maker fee and 0.1% taker fee on all trades. Fees may vary for different trading pairs and VIP levels. Deposit fees vary by cryptocurrency, and withdrawal fees are based on network costs.'
    },
    {
      category: 'wallet',
      question: 'How do I deposit cryptocurrency?',
      answer: 'Go to Wallet > Deposit, select the cryptocurrency you want to deposit, and copy your unique deposit address. Send your crypto to this address from any external wallet or exchange. Wait for the required network confirmations.'
    },
    {
      category: 'wallet',
      question: 'How long do deposits take?',
      answer: 'Deposit times vary by cryptocurrency. Bitcoin typically requires 2-6 confirmations (20-60 minutes), while Ethereum requires 12 confirmations (3-5 minutes). Your deposit will appear in your wallet once confirmed.'
    },
    {
      category: 'wallet',
      question: 'How do I withdraw funds?',
      answer: 'Go to Wallet > Withdraw, select the cryptocurrency, enter the destination address and amount. Complete 2FA verification if enabled. Withdrawals are processed within 30 minutes to 24 hours depending on security checks and network conditions.'
    },
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: FaQuestionCircle },
    { id: 'getting-started', name: 'Getting Started', icon: FaRocket },
    { id: 'security', name: 'Security', icon: FaShieldAlt },
    { id: 'trading', name: 'Trading', icon: FaExchangeAlt },
    { id: 'wallet', name: 'Wallet & Deposits', icon: FaWallet },
  ];

  const filteredFAQs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify(contactForm),
      });

      if (!response.ok) {
        throw new Error('Failed to submit ticket');
      }

      const data = await response.json();
      
      setSubmitSuccess(true);
      setContactForm({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: '',
      });

      // Navigate to ticket details page
      if (data.data?.ticketId) {
        setTimeout(() => {
          navigate(`/support/tickets/${data.data.ticketId}`);
        }, 1500);
      } else {
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Failed to submit support ticket:', error);
      alert('Failed to submit ticket. Please try again or contact us via email at support@cryptoexchange.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="support-page">
      {/* Hero Section */}
      <section className="support-hero">
        <div className="hero-content">
          <FaHeadset className="hero-icon" />
          <h1 className="hero-title">How can we help you?</h1>
          <p className="hero-subtitle">
            Get support for your account, trading, or technical issues
          </p>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section className="quick-contact">
        <div className="contact-cards">
          <div className="contact-card">
            <FaEnvelope className="card-icon" />
            <h3>Email Support</h3>
            <p>support@cryptoexchange.com</p>
            <span className="response-time">
              <FaClock /> Response within 24h
            </span>
          </div>
          <div className="contact-card">
            <FaComments className="card-icon" />
            <h3>Live Chat</h3>
            <p>Chat with our support team</p>
            <button className="btn-primary" onClick={() => navigate('/support/tickets')}>
              View My Tickets
            </button>
          </div>
          <div className="contact-card">
            <FaBook className="card-icon" />
            <h3>Help Center</h3>
            <p>Browse our documentation</p>
            <button className="btn-secondary">Visit Docs</button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2 className="section-title">
          <FaQuestionCircle /> Frequently Asked Questions
        </h2>
        
        {/* Category Filter */}
        <div className="category-filter">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <Icon />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="faq-list">
          {filteredFAQs.map((faq, index) => (
            <div 
              key={index}
              className={`faq-item ${expandedFAQ === index ? 'expanded' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">{expandedFAQ === index ? '−' : '+'}</span>
              </button>
              {expandedFAQ === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="contact-form-section">
        <h2 className="section-title">
          <FaPaperPlane /> Submit a Support Ticket
        </h2>
        <p className="section-subtitle">
          Can't find what you're looking for? Send us a message and we'll get back to you soon.
        </p>

        {submitSuccess && (
          <div className="success-message">
            <FaCheckCircle />
            <span>Your ticket has been submitted successfully! We'll respond within 24 hours.</span>
          </div>
        )}

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={contactForm.category}
                onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
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
            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                required
                placeholder="Brief description of your issue"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              required
              rows={6}
              placeholder="Please provide as much detail as possible about your issue..."
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner-small"></div>
                Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Submit Ticket
              </>
            )}
          </button>
        </form>
      </section>

      {/* Additional Resources */}
      <section className="resources-section">
        <h2 className="section-title">Additional Resources</h2>
        <div className="resource-grid">
          <div className="resource-item">
            <h4>📖 User Guide</h4>
            <p>Complete guide to using our platform</p>
          </div>
          <div className="resource-item">
            <h4>🔒 Security Tips</h4>
            <p>Keep your account safe and secure</p>
          </div>
          <div className="resource-item">
            <h4>💰 Fee Structure</h4>
            <p>Understand our trading and withdrawal fees</p>
          </div>
          <div className="resource-item">
            <h4>📊 API Documentation</h4>
            <p>Integrate with our trading API</p>
          </div>
        </div>
      </section>
    </main>
  );
}
