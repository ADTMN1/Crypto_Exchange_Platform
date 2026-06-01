import { ReactNode } from "react";

interface AuthFormProps {
  title: string;
  children: ReactNode;
}

export default function AuthForm({ title, children }: AuthFormProps) {
  return (
    <div className="auth-card">
      <h1 className="auth-title">{title}</h1>
      {children}
    </div>
  );
}
