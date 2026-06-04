import { useNavigate } from "react-router-dom"

interface ManageUsersPageProps {
  title: string
  description: string
}

const usersData = [
  {
    id: "rahase1219",
    name: "Rahase Amine",
    handle: "@rahase1219",
    email: "rahasezemichael@gmail.com",
    mobile: "+1 403-637-25",
    country: "CA",
    joinedAt: "2026-03-21 06:54 AM",
    joinedAgo: "2 months ago",
  },
  {
    id: "ava_collins",
    name: "Ava Collins",
    handle: "@ava_collins",
    email: "ava.collins@example.com",
    mobile: "+1 415-555-0123",
    country: "US",
    joinedAt: "2026-04-08 09:22 AM",
    joinedAgo: "1 month ago",
  },
  {
    id: "liambrooks",
    name: "Liam Brooks",
    handle: "@liambrooks",
    email: "liam.brooks@example.com",
    mobile: "+44 7700 900123",
    country: "UK",
    joinedAt: "2026-02-14 11:17 AM",
    joinedAgo: "3 months ago",
  },
]

export default function AdminManageUsersPage({ title, description }: ManageUsersPageProps) {
  const navigate = useNavigate()
  const isNotification = title === "Send Notification"

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      {isNotification ? (
        <section className="nex-section-body">
          <div className="nex-card nex-card-form">
            <h2>Send Notification</h2>
            <p>Send a broadcast message to selected users or all users.</p>
            <form className="nex-form-grid">
              <label htmlFor="notification-target">Recipient Group</label>
              <select id="notification-target" defaultValue="all">
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="banned">Banned Users</option>
                <option value="email-unverified">Email Unverified</option>
                <option value="mobile-unverified">Mobile Unverified</option>
                <option value="kyc-pending">KYC Pending</option>
              </select>

              <label htmlFor="notification-title">Title</label>
              <input id="notification-title" type="text" placeholder="Notification title" />

              <label htmlFor="notification-message">Message</label>
              <textarea id="notification-message" rows={6} placeholder="Write your notification here" />

              <button type="submit" className="btn-primary">
                Send Notification
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="nex-section-body">
          <div className="nex-card">
            <div className="nex-card-title">
              <h2>{title}</h2>
              <span>{usersData.length} sample users</span>
            </div>
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email - Mobile</th>
                    <th>Country</th>
                    <th>Joined At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                        <div className="nex-table-meta">{user.handle}</div>
                      </td>
                      <td>
                        <div>{user.email}</div>
                        <div className="nex-table-meta">{user.mobile}</div>
                      </td>
                      <td>{user.country}</td>
                      <td>
                        <div>{user.joinedAt}</div>
                        <div className="nex-table-meta">{user.joinedAgo}</div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
