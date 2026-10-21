import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { FaHeadset, FaUser } from 'react-icons/fa';
import chatService, {
  type SupportConversation,
  type SupportMessage,
} from '../../services/chat.service';
import { useSocket } from '../../components/providers/SocketProvider';
import { useAuthStore } from '../../store/useAuthStore';

// ─── helpers ────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'pending' | 'answered' | 'closed';

interface SupportTicketsPageProps {
  statusFilter?: StatusFilter;
}

// ─── Filter helpers ──────────────────────────────────────────────────────────
function getFilterLabel(filter: StatusFilter) {
  switch (filter) {
    case 'pending':  return 'Pending';
    case 'answered': return 'Answered';
    case 'closed':   return 'Closed';
    default:         return 'All';
  }
}

function getFilterColor(filter: StatusFilter) {
  switch (filter) {
    case 'pending':  return '#f59e0b';
    case 'answered': return '#10b981';
    case 'closed':   return '#6b7280';
    default:         return '#3b82f6';
  }
}

/**
 * Derive the status bucket for a conversation:
 *  - closed  → 'closed'
 *  - open, last message from admin → 'answered'
 *  - open, last message from user (or no messages) → 'pending'
 */
function getConvBucket(conv: SupportConversation): 'pending' | 'answered' | 'closed' {
  if (conv.status === 'closed') return 'closed';
  // unread_count > 0 means unread user messages → pending
  if ((conv.unread_count ?? 0) > 0) return 'pending';
  // If last message came from user (no unread but open) → still pending
  // We use last_message_sender_type when available; fall back to 'answered'
  if (conv.last_message_sender_type === 'user') return 'pending';
  // If there's no message at all → treat as pending
  if (!conv.last_message) return 'pending';
  return 'answered';
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SupportTicketsPage({ statusFilter = 'all' }: SupportTicketsPageProps) {
  const adminUser = useAuthStore(s => s.user);
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Responsive detection ─────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── Load conversation list ───────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      setLoadingList(true);
      // For 'closed' we can pass the status directly; otherwise fetch all and filter client-side
      const params: { limit: number; status?: string } = { limit: 200 };
      if (statusFilter === 'closed') params.status = 'closed';
      else if (statusFilter === 'all') { /* no filter */ }
      else params.status = 'open'; // pending / answered are both 'open' on the server
      const res = await chatService.getAllConversations(params);
      setConversations(res.data);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter]);

  // Clear selection when filter changes
  useEffect(() => {
    setSelected(null);
    setMessages([]);
  }, [statusFilter]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages when conversation is selected ──────────────────
  const openConversation = useCallback(async (conv: SupportConversation) => {
    setSelected(conv);
    setMessages([]);
    setReply('');
    try {
      setLoadingMsgs(true);
      const res = await chatService.getConversationMessages(conv.id);
      setMessages(res.data);
      // clear unread badge in list
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
      );
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Real-time socket ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handler = (data: {
      conversationId: string;
      userId?: string;
      message: SupportMessage;
    }) => {
      // If this conversation is open, append the message
      if (selected?.id === data.conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        // auto-mark read since admin has it open
        chatService.getConversationMessages(data.conversationId).catch(() => {});
      }

      // Update list: unread count + last message preview
      setConversations(prev => {
        const exists = prev.some(c => c.id === data.conversationId);
        if (!exists) {
          loadConversations();
          return prev;
        }
        return prev.map(c => {
          if (c.id !== data.conversationId) return c;
          const isOpen = selected?.id === data.conversationId;
          return {
            ...c,
            last_message: data.message.message,
            last_message_at: data.message.created_at,
            updated_at: data.message.created_at,
            unread_count:
              data.message.sender_type === 'user' && !isOpen
                ? (c.unread_count || 0) + 1
                : c.unread_count || 0,
          };
        });
      });
    };

    socket.on('support:new-message', handler);
    return () => { socket.off('support:new-message', handler); };
  }, [socket, selected, loadConversations]);

  // ── Send reply ───────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selected || sending) return;
    const text = reply.trim();
    setReply('');
    try {
      setSending(true);
      const res = await chatService.adminSendMessage(selected.id, text);
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
    } catch {
      toast.error('Failed to send reply. Please try again.');
      setReply(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  // ── Close / reopen conversation ──────────────────────────────────
  const toggleStatus = async () => {
    if (!selected) return;
    try {
      const res =
        selected.status === 'open'
          ? await chatService.closeConversation(selected.id)
          : await chatService.reopenConversation(selected.id);
      const updated = res.data;
      setSelected(s => s ? { ...s, ...updated } : s);
      setConversations(prev =>
        prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
      );
      toast.success(updated.status === 'closed' ? 'Conversation closed' : 'Conversation reopened');
    } catch {
      toast.error('Action failed');
    }
  };

  // ── Filtered list ────────────────────────────────────────────────
  const filtered = conversations.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.username || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  return (
    <main className="nex-admin-section-page" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

        {/* ════════════════════ LEFT: user list (always on desktop, conditional on mobile) ════════════════════ */}
        {(!isMobile || mobileView === 'list') && (
          <div style={{
            width: isMobile ? '100%' : 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: !isMobile ? '1px solid rgba(255,255,255,0.07)' : 'none',
            background: 'rgba(255,255,255,0.015)',
          }}>
            {/* Header */}
            <div style={{ padding: '1rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Support Chat</h2>
                {totalUnread > 0 && (
                  <span style={{
                    background: '#ef4444', color: '#fff', borderRadius: 9999,
                    fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px',
                  }}>
                    {totalUnread}
                  </span>
                )}
                <button
                  onClick={loadConversations}
                  title="Refresh"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '1rem' }}
                >↺</button>
              </div>
              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.5rem 0.875rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: 'white', fontSize: '0.85rem', outline: 'none',
                }}
              />
            </div>

            {/* Conversation list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingList ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  <div className="nex-spinner" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>
                  {search ? 'No users match your search' : 'No conversations yet'}
                </div>
              ) : (
                filtered
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .map(conv => (
                    <ConvRow
                      key={conv.id}
                      conv={conv}
                      selected={selected?.id === conv.id}
                      onClick={() => {
                        openConversation(conv);
                        if (isMobile) setMobileView('chat');
                      }}
                    />
                  ))
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ RIGHT: chat thread (conditional on mobile) ═════════════════ */}
        {(!isMobile || mobileView === 'chat') && (
          selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: isMobile ? '100%' : 'auto' }}>

              {/* Thread top bar (with back button on mobile) */}
              <div style={{
                padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: isMobile ? '0.625rem' : '0.875rem',
                background: 'rgba(255,255,255,0.02)',
                flexShrink: 0,
              }}>
                {isMobile && (
                  <button
                    onClick={() => setMobileView('list')}
                    style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1,
                      padding: '0 0.25rem', flexShrink: 0,
                    }}
                  >‹</button>
                )}
                <Avatar name={selected.username || selected.email || '?'} size={isMobile ? 32 : 38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {selected.username || 'Unknown'}
                  </strong>
                  <p style={{
                    margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {selected.email}
                  </p>
                </div>
                {/* Status pill — desktop only */}
                {!isMobile && <StatusPill status={selected.status} />}
                {/* Close/Reopen — desktop only; on mobile it's accessible from the closed banner */}
                {!isMobile && (
                  <button
                    onClick={toggleStatus}
                    style={{
                      padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem',
                      background: selected.status === 'open' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                      color: selected.status === 'open' ? '#f87171' : '#34d399',
                      flexShrink: 0,
                    }}
                  >
                    {selected.status === 'open' ? '🔒 Close' : '🔓 Reopen'}
                  </button>
                )}
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto',
                padding: isMobile ? '1rem' : '1.25rem 1.5rem',
                display: 'flex', flexDirection: 'column', gap: '0.625rem',
              }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', marginTop: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                    <div className="nex-spinner" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading messages…</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', marginTop: '2rem' }}>
                    No messages yet in this conversation
                  </div>
                ) : (
                  messages.map(msg => (
                    <ChatBubble key={msg.id} msg={msg} adminId={adminUser?.id} />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div style={{
                padding: isMobile ? '0.75rem' : '1rem 1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
                flexShrink: 0,
              }}>
                {selected.status === 'closed' ? (
                  <div style={{
                    padding: '0.875rem', background: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10,
                    color: '#f87171', textAlign: 'center', fontSize: '0.875rem',
                  }}>
                    🔒 Conversation is closed — reopen it to reply
                  </div>
                ) : (
                  <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <textarea
                      ref={textareaRef}
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a reply…"
                      rows={isMobile ? 2 : 3}
                      disabled={sending}
                      style={{
                        flex: 1, padding: '0.75rem 1rem',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, color: 'white', fontSize: '0.925rem',
                        resize: 'none', outline: 'none', fontFamily: 'inherit',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                    <button
                      type="submit"
                      disabled={sending || !reply.trim()}
                      style={{
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.25rem',
                        background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                        border: 'none', borderRadius: 12, color: 'white',
                        fontWeight: 600, cursor: sending || !reply.trim() ? 'not-allowed' : 'pointer',
                        opacity: sending || !reply.trim() ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        transition: 'opacity 0.2s', whiteSpace: 'nowrap',
                      }}
                    >
                      {sending
                        ? <div className="nex-spinner-small" />
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                      }
                      {isMobile ? '' : 'Send'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            // Empty state
            !isMobile && (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexDirection: 'column', gap: '0.75rem',
                color: 'rgba(255,255,255,0.3)',
              }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p style={{ margin: 0, fontSize: '0.925rem' }}>
                  Select a user to view their chat
                </p>
              </div>
            )
          )
        )}
      </div>
    </main>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38,
    }}>
      {name[0].toUpperCase()}
    </div>
  );
}

// ─── Status pill ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const isOpen = status === 'open';
  return (
    <span style={{
      padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 600,
      background: isOpen ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.2)',
      color: isOpen ? '#34d399' : 'rgba(255,255,255,0.45)',
    }}>
      {isOpen ? '● Open' : '● Closed'}
    </span>
  );
}

// ─── Conversation row in left panel ──────────────────────────────────────────
function ConvRow({
  conv, selected, onClick,
}: {
  conv: SupportConversation;
  selected: boolean;
  onClick: () => void;
}) {
  const unread = conv.unread_count || 0;
  return (
    <div
      onClick={onClick}
      style={{
        padding: '0.875rem 1.125rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
        background: selected ? 'rgba(59,130,246,0.1)' : 'transparent',
        borderLeft: `3px solid ${selected ? '#3b82f6' : 'transparent'}`,
        transition: 'background 0.15s',
        display: 'flex', gap: '0.75rem', alignItems: 'center',
      }}
    >
      <Avatar name={conv.username || conv.email || '?'} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
            {conv.username || 'Unknown'}
          </span>
          {conv.status === 'closed' && (
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>🔒</span>
          )}
          {unread > 0 && (
            <span style={{
              marginLeft: 'auto', background: '#ef4444', color: '#fff',
              borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700,
              padding: '1px 6px', flexShrink: 0,
            }}>
              {unread}
            </span>
          )}
          {conv.last_message_at && (
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginLeft: unread ? '0' : 'auto', flexShrink: 0 }}>
              {fmtTime(conv.last_message_at)}
            </span>
          )}
        </div>
        {conv.last_message ? (
          <p style={{
            margin: '0.2rem 0 0', fontSize: '0.78rem',
            color: unread > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
            fontWeight: unread > 0 ? 500 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {conv.last_message}
          </p>
        ) : (
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            No messages yet
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ msg, adminId }: { msg: SupportMessage; adminId?: string }) {
  const isAdmin = msg.sender_type === 'admin';
  const isMe = msg.sender_id === adminId;

  return (
    <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: window.innerWidth < 768 ? '85%' : '68%',
        padding: '0.7rem 1rem',
        background: isAdmin ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
        border: `1px solid ${isAdmin ? 'rgba(16,185,129,0.18)' : 'rgba(59,130,246,0.18)'}`,
        borderRadius: 12,
        borderTopLeftRadius: !isAdmin ? 3 : 12,
        borderTopRightRadius: isAdmin ? 3 : 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isAdmin ? '#10b981' : '#60a5fa' }}>
            {isAdmin ? (isMe ? 'You (Admin)' : msg.sender_name || 'Admin') : msg.sender_name || 'User'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
            {fmtFull(msg.created_at)}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.message}
        </p>
        {isAdmin && (
          <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: msg.is_read ? '#34d399' : 'rgba(255,255,255,0.3)' }}>
              {msg.is_read ? '✓✓ Read' : '✓ Sent'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
