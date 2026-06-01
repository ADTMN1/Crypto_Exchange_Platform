import { useParams } from "react-router-dom";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <main>
      <h1>User Details</h1>
      <p>Review and manage user {id}.</p>
    </main>
  );
}
