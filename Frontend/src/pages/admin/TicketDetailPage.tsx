import { Navigate } from 'react-router-dom';

// The ticket detail flow has been replaced by the live chat system.
// All admin support routes now go to SupportTicketsPage.
export default function TicketDetailPage() {
  return <Navigate to="/admin/support-ticket" replace />;
}
