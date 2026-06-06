import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import adminService, { AdminUser } from '../../services/admin.service';

interface UserActionMenuProps {
  user: AdminUser;
  onUpdated: (userId: string, changes: Partial<AdminUser>) => void;
  onDeleted: (userId: string) => void;
}

type ActionKey = 'activate' | 'suspend' | 'ban' | 'unban' | 'delete' | 'view';

interface Action {
  key:      ActionKey;
  label:    string;
  color:    string;
  confirm?: string;
}

function getActions(status: AdminUser['account_status']): Action[] {
  const s = status ?? 'pending';
  const actions: Action[] = [{ key: 'view', label: 'View Details', color: '#9CA3AF' }];

  if (s !== 'active')    actions.push({ key: 'activate', label: 'Activate',    color: '#00C076', confirm: 'Activate this user?' });
  if (s !== 'suspended') actions.push({ key: 'suspend',  label: 'Suspend',     color: '#F59E0B', confirm: 'Suspend this user?' });
  if (s !== 'banned')    actions.push({ key: 'ban',      label: 'Ban',         color: '#FF4D4F', confirm: 'Ban this user?' });
  if (s === 'banned')    actions.push({ key: 'unban',    label: 'Unban',       color: '#00C076', confirm: 'Unban this user?' });
  actions.push({          key: 'delete',  label: 'Delete User', color: '#FF4D4F', confirm: 'Permanently delete this user?' });

  return actions;
}

export default function UserActionMenu({ user, onUpdated, onDeleted }: UserActionMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [pending, setPending]   = useState<Action | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const execute = useCallback(async (action: Action) => {
    setPending(null);
    setLoading(true);
    try {
      switch (action.key) {
        case 'activate':
          await adminService.updateUserStatus(user.id, 'active');
          onUpdated(user.id, { account_status: 'active' });
          toast.success(`${user.username} activated.`);
          break;
        case 'suspend':
          await adminService.updateUserStatus(user.id, 'suspended');
          onUpdated(user.id, { account_status: 'suspended' });
          toast.success(`${user.username} suspended.`);
          break;
        case 'ban':
          await adminService.banUser(user.id);
          onUpdated(user.id, { account_status: 'banned' });
          toast.success(`${user.username} banned.`);
          break;
        case 'unban':
          await adminService.unbanUser(user.id);
          onUpdated(user.id, { account_status: 'active' });
          toast.success(`${user.username} unbanned.`);
          break;
        case 'delete':
          await adminService.deleteUser(user.id);
          onDeleted(user.id);
          toast.success(`${user.username} deleted.`);
          break;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  }, [user, onUpdated, onDeleted]);

  const handleClick = useCallback((action: Action) => {
    setOpen(false);
    if (action.key === 'view') {
      navigate(`/admin/users/${user.id}`);
      return;
    }
    // Show sonner confirm toast instead of window.confirm
    toast(`${action.confirm}`, {
      action: {
        label: 'Confirm',
        onClick: () => execute(action),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 8000,
    });
  }, [user.id, navigate, execute]);

  const actions = getActions(user.account_status);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8,
          background: open ? 'rgba(169,255,232,0.12)' : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(169,255,232,0.14)',
          color: '#E5E7EB', fontSize: 13, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? '…' : 'Actions'}
        <span style={{ fontSize: 10, marginTop: 1 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          minWidth: 170, zIndex: 999,
          background: 'linear-gradient(180deg,#111827,#0D1117)',
          border: '1px solid rgba(169,255,232,0.14)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}>
          {actions.map((action, i) => (
            <button
              key={action.key}
              onClick={() => handleClick(action)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', background: 'none', border: 'none',
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                color: action.color, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
