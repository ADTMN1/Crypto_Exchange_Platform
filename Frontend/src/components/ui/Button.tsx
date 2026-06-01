interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export default function Button({
  children,
  onClick,
  type = "button",
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-white transition-colors ${
        className || "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {children}
    </button>
  );
}
