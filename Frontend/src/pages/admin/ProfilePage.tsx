import { FormEvent, useEffect, useState } from "react";
import {
  FaEnvelope,
  FaIdBadge,
  FaShieldAlt,
  FaUserCircle,
} from "react-icons/fa";
import { useAuthStore } from "../../store";

export default function AdminProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(user?.username || "");
    setEmail(user?.email || "");
  }, [user]);

  const profileName = username || "Admin User";
  const profileEmail = email || "admin@cryptoprop.com";
  const profileRole = user?.role || "Admin";
  const profileInitials = profileName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!user) {
      setError("No active admin session found.");
      return;
    }

    updateUser({ username, email });
    setMessage("Profile updated successfully.");
    setPassword("");
    setConfirmPassword("");
    window.setTimeout(() => setMessage(null), 3000);
  };

  return (
    <main className="nex-profile-page">
      <section className="nex-profile-hero">
        <div className="nex-profile-identity">
          {user?.profile_image ? (
            <img className="nex-profile-hero-avatar" src={user.profile_image} alt="Profile" />
          ) : (
            <div className="nex-profile-hero-avatar">{profileInitials || "A"}</div>
          )}
          <div>
            <span>Admin Profile</span>
            <h1>{profileName}</h1>
            <p>{profileEmail}</p>
          </div>
        </div>
        <div className="nex-profile-status">
          <span>{profileRole}</span>
          <strong>Verified Access</strong>
        </div>
      </section>

      <section className="nex-profile-info-panel">
        <div className="nex-profile-section-title">
          <h2>Profile Information</h2>
          <p>Update your details and password for a professional admin profile.</p>
        </div>

        <form className="nex-profile-form" onSubmit={handleSubmit}>
          <div className="nex-profile-form-row">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter a professional username"
              required
            />
          </div>

          <div className="nex-profile-form-row">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="nex-profile-form-row">
            <label htmlFor="admin-password">New Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="nex-profile-form-row">
            <label htmlFor="admin-confirm-password">Confirm Password</label>
            <input
              id="admin-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <div className="nex-profile-form-row">
            <label htmlFor="admin-role">Role</label>
            <input
              id="admin-role"
              type="text"
              value={profileRole}
              readOnly
            />
          </div>

          <div className="nex-profile-form-actions">
            <button className="nex-button nex-button-primary" type="submit">
              Save Changes
            </button>
            {message ? <span className="nex-form-message success">{message}</span> : null}
            {error ? <span className="nex-form-message error">{error}</span> : null}
          </div>
        </form>
      </section>
    </main>
  );
}
