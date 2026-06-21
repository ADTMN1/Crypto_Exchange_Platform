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
        className || "bg-[#4CF4A5] hover:bg-[#3bcca0] text-[#0d0d0d]"
      }`}
    >
      {children}
    </button>
  );
}
