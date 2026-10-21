import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { FaPaperPlane, FaUser, FaHeadset, FaLock } from 'react-icons/fa';
import { useAuthStore } from '../../store/useAuthStore';
import { useSocket } from '../../components/providers/SocketProvider';
import chatService, { type SupportConversation, type SupportMessage } from '../../services/chat.service';

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function SupportTicketsListPage() {
  const user = useAuthStore(state => state.user);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Load conversation + messages on mount ─────────────────────────
  const loadChat = useCallback(async () => {
    try {
      setLoading(true);
      const convRes = await chatService.getConversation();
      setConversation(convRes.data);

      const msgsRes = await chatService.getMessages();
      setMessages(msgsRes.data);
    } catch {
      toast.error('Failed to load chat. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // ── Real-time: receive new messages via socket ─────────────────────
  useEffect(() => {
    if (!socket || !conversation) return;

    const handleNewMessage = (data: { conversationId: string; message: SupportMessage }) => {
      if (data.conversationId !== conversation.id) return;
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    };

    socket.on('support:new-message', handleNewMessage);
    return () => { socket.off('support:new-message', handleNewMessage); };
  }, [socket, conversation]);

  // ── Scroll to bottom whenever messages change ──────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    if (conversation?.status === 'closed') {
      toast.error('This conversation is closed. Please contact support via email.');
      return;
    }

    const text = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      const res = await chatService.sendMessage(text);
      // Add to local state immediately (socket will also fire but we dedupe)
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
    } catch {
      toast.error('Message failed to send. Please try again.');
      setNewMessage(text); // restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const isClosed = conversation?.status === 'closed';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - 120px)',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FaHeadset style={{ fontSize: 20 }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Support Team</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>
            {isClosed ? '🔒 Conversation closed' : 'Online · Replies within minutes'}
          </p>
        </div>
        {isClosed && (
          <span
            style={{
              padding: '0.25rem 0.75rem',
              background: 'rgba(239,68,68,0.15)',
              color: '#f87171',
              borderRadius: 9999,
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Closed
          </span>
        )}
      </div>

      {/* ── Messages area ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: 'rgba(255,255,255,0.5)' }}>
            <div className="nex-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading messages…
          </div>
        ) : (
          <>
            {/* Welcome message */}
            <Bubble
              isAdmin
              senderName="Support Team"
              text="Hi there 👋 How can we help you today?"
              time={conversation?.created_at ?? new Date().toISOString()}
            />

            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.875rem',
                  marginTop: '1rem',
                }}
              >
                No messages yet. Send one to get started!
              </div>
            )}

            {messages.map(msg => (
              <Bubble
                key={msg.id}
                isAdmin={msg.sender_type === 'admin'}
                senderName={
                  msg.sender_type === 'admin'
                    ? (msg.sender_name || 'Support Team')
                    : (msg.sender_name || user?.username || 'You')
                }
                text={msg.message}
                time={msg.created_at}
                isMe={msg.sender_id === user?.id}
              />
            ))}

            {isClosed && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10,
                  color: '#f87171',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <FaLock /> This conversation has been closed by support.
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Input area ───────────────────────────────────────────── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          background: 'rgba(255,255,255,0.025)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={isClosed ? 'Conversation closed' : 'Type a message…'}
            disabled={sending || isClosed || loading}
            style={{
              flex: 1,
              padding: '0.875rem 1.25rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 9999,
              color: 'white',
              fontSize: '0.975rem',
              outline: 'none',
              opacity: isClosed ? 0.5 : 1,
              cursor: isClosed ? 'not-allowed' : 'text',
            }}
            onFocus={e => !isClosed && (e.target.style.borderColor = '#3b82f6')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || isClosed || loading}
            style={{
              padding: isMobile ? '0.75rem' : '0.875rem 1.25rem',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              borderRadius: 9999,
              color: 'white',
              fontWeight: 600,
              cursor:
                sending || !newMessage.trim() || isClosed || loading
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                sending || !newMessage.trim() || isClosed || loading ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0' : '0.5rem',
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap',
              minWidth: isMobile ? '44px' : 'auto',
              justifyContent: 'center',
            }}
          >
            {sending ? (
              <div className="nex-spinner-small" />
            ) : (
              <>
                <FaPaperPlane style={{ fontSize: isMobile ? '1rem' : '1rem' }} />
                {!isMobile && <span>Send</span>}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Reusable bubble component ─────────────────────────────────────────
function Bubble({
  isAdmin,
  isMe,
  senderName,
  text,
  time,
}: {
  isAdmin: boolean;
  isMe?: boolean;
  senderName: string;
  text: string;
  time: string;
}) {
  const alignRight = !isAdmin || isMe;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: alignRight ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          maxWidth: '72%',
          padding: '0.875rem 1.125rem',
          background: isAdmin
            ? 'rgba(16,185,129,0.12)'
            : 'rgba(59,130,246,0.12)',
          border: `1px solid ${isAdmin ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
          borderRadius: 14,
          borderTopLeftRadius: isAdmin ? 4 : 14,
          borderTopRightRadius: !isAdmin ? 4 : 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '0.4rem',
          }}
        >
          {isAdmin ? (
            <FaHeadset style={{ fontSize: 12, color: '#10b981' }} />
          ) : (
            <FaUser style={{ fontSize: 12, color: '#3b82f6' }} />
          )}
          <strong style={{ fontSize: '0.8rem', color: isAdmin ? '#10b981' : '#60a5fa' }}>
            {senderName}
          </strong>
          {isAdmin && (
            <span
              style={{
                fontSize: '0.7rem',
                background: 'rgba(16,185,129,0.2)',
                color: '#10b981',
                padding: '0 0.4rem',
                borderRadius: 9999,
              }}
            >
              Support
            </span>
          )}
          <span
            style={{
              fontSize: '0.73rem',
              color: 'rgba(255,255,255,0.4)',
              marginLeft: 'auto',
            }}
          >
            {fmtTime(time)}
          </span>
        </div>
        <p style={{ margin: 0, lineHeight: 1.55, fontSize: '0.925rem', whiteSpace: 'pre-wrap' }}>
          {text}
        </p>
      </div>
    </div>
  );
}
