interface ProfileCardProps {
  label: string;
  value: string;
}

export default function ProfileCard({ label, value }: ProfileCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
