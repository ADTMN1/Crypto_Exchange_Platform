interface BalanceCardProps {
  asset: string;
  amount: number;
}

export default function BalanceCard({ asset, amount }: BalanceCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{asset}</p>
      <p className="mt-2 text-2xl font-semibold">{amount}</p>
    </div>
  );
}
