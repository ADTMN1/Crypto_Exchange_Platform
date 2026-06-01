import { ReactNode } from "react";

interface AuthFormProps {
  title: string;
  children: ReactNode;
}

export default function AuthForm({ title, children }: AuthFormProps) {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-slate-900 p-8 shadow-xl">
      <h1 className="mb-6 text-3xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}
