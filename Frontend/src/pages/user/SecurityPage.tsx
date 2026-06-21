import { useEffect, useState } from 'react';
import { FaShieldAlt, FaLock, FaMobileAlt, FaKey, FaHistory, FaCheckCircle, FaExclamationTriangle, FaDesktop, FaMapMarkerAlt } from 'react-icons/fa';
import userService from '../../services/user.service';

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const profile = await userService.getProfile();
        if (!mounted) return;
        setTwoFactorEnabled(Boolean(profile.two_fa_enabled));
        setLastPasswordChange(profile.updated_at || null);

        // If backend exposes sessions/login history endpoints, replace these with real calls.
        // For now populate with available profile fields (last_login_at) and leave others empty.
        if (profile.last_login_at) {
          setLoginHistory(prev => [{ id: 1, device: 'Last known', location: profile.last_login_ip || 'Unknown', ip: profile.last_login_ip || 'Unknown', time: profile.last_login_at, status: 'success' }, ...prev]);
        }
      } catch (err) {
        console.error('Failed to fetch profile for security page', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false };
  }, []);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password change logic
    console.log('Password change requested');
    setShowChangePassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <main className="security-page">
      {/* Header */}
      <div className="security-header">
        <h1 className="page-title">
          <FaShieldAlt className="title-icon" />
          Security Settings
        </h1>
        <p className="page-subtitle">
          Manage your account security and privacy settings
        </p>
      </div>

      <div className="security-content">
        {/* Security Overview */}
        <div className="security-overview">
          <div className="security-status-card">
            <div className="status-icon strong">
              <FaCheckCircle size={32} />
            </div>
            <div className="status-info">
              <h3>Security Status: Strong</h3>
              <p>Your account has strong security measures enabled</p>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="security-section">
          <div className="section-header">
            <div className="section-title">
              <FaLock /> Password
            </div>
            <button 
              className="btn-primary-small" 
              onClick={() => setShowChangePassword(!showChangePassword)}
            >
              Change Password
            </button>
          </div>

          {showChangePassword && (
            <form className="password-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">Update Password</button>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowChangePassword(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="section-info">
            <p className="info-text">
              <FaKey /> Last changed: {lastPasswordChange ? new Date(lastPasswordChange).toLocaleString() : 'Unknown'}
            </p>
            <p className="info-subtext">
              We recommend changing your password every 90 days for optimal security
            </p>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="security-section">
          <div className="section-header">
            <div className="section-title">
              <FaMobileAlt /> Two-Factor Authentication (2FA)
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="section-info">
            <p className="info-text">
              {loading ? 'Loading...' : (
                twoFactorEnabled ? (
                  <><FaCheckCircle style={{ color: '#24C576' }} /> 2FA is enabled on your account</>
                ) : (
                  <><FaExclamationTriangle style={{ color: '#f59e0b' }} /> 2FA is not enabled. Enable it for better security</>
                )
              )}
            </p>
            <p className="info-subtext">
              Two-factor authentication adds an extra layer of security to your account
            </p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="security-section">
          <div className="section-header">
            <div className="section-title">
              <FaDesktop /> Active Sessions
            </div>
          </div>

          <div className="sessions-list">
            {activeSessions.map((session) => (
              <div key={session.id} className={`session-item ${session.current ? 'current' : ''}`}>
                <div className="session-icon">
                  <FaDesktop size={24} />
                </div>
                <div className="session-info">
                  <h4 className="session-device">{session.device}</h4>
                  <p className="session-location">
                    <FaMapMarkerAlt /> {session.location}
                  </p>
                  <p className="session-time">{session.lastActive}</p>
                </div>
                <div className="session-action">
                  {session.current ? (
                    <span className="badge-current">Current Session</span>
                  ) : (
                    <button className="btn-revoke">Revoke</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login History */}
        <div className="security-section">
          <div className="section-header">
            <div className="section-title">
              <FaHistory /> Recent Login Activity
            </div>
          </div>

          <div className="history-list">
            {loginHistory.length === 0 ? (
              <div className="history-item placeholder">
                <div className="history-status unknown">
                  <FaExclamationTriangle />
                </div>
                <div className="history-info">
                  <h4 className="history-device">Last known</h4>
                  <p className="history-details">
                    <FaMapMarkerAlt /> Unknown • IP: Unknown
                  </p>
                  <p className="history-time">Unknown</p>
                </div>
                <div className="history-badge">
                  <span className={`status-badge unknown`}>No Data</span>
                </div>
              </div>
            ) : (
              loginHistory.map((login) => {
                const location = login.location || 'Unknown';
                const ip = login.ip || 'Unknown';
                let timeText = 'Unknown';
                try {
                  const t = Date.parse(login.time);
                  timeText = isNaN(t) ? String(login.time) : new Date(t).toLocaleString();
                } catch { timeText = String(login.time) }

                return (
                  <div key={login.id} className="history-item">
                    <div className={`history-status ${login.status}`}>
                      {login.status === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    </div>
                    <div className="history-info">
                      <h4 className="history-device">{login.device || 'Last known'}</h4>
                      <p className="history-details">
                        <FaMapMarkerAlt /> {location} • IP: {ip}
                      </p>
                      <p className="history-time">{timeText}</p>
                    </div>
                    <div className="history-badge">
                      <span className={`status-badge ${login.status}`}>
                        {login.status === 'success' ? 'Successful' : 'Failed'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
