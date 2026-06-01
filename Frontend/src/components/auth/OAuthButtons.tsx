export default function OAuthButtons() {
  return (
    <div className="space-y-3">
      <button className="w-full rounded-lg border border-slate-700 px-4 py-3 text-left text-sm hover:bg-slate-800">
        Continue with Google
      </button>
      <button className="w-full rounded-lg border border-slate-700 px-4 py-3 text-left text-sm hover:bg-slate-800">
        Continue with Apple
      </button>
    </div>
  );
}
