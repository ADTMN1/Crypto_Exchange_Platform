import { useParams } from "react-router-dom";

export default function Trade() {
  const { pair } = useParams<{ pair: string }>();

  return (
    <main>
      <h1>Trade {pair}</h1>
      <p>Review orders and place trades for the selected pair.</p>
    </main>
  );
}
