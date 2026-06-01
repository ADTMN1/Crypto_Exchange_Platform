interface PerformanceCardProps {
  title: string;
  value: string;
}

export default function PerformanceCard({
  title,
  value,
}: PerformanceCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
