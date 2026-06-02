import { ReactNode } from "react";

interface AuthFormProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthForm({ title, subtitle, children }: AuthFormProps) {
  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
