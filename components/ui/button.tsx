import * as React from "react";

type ButtonVariant = "primary" | "ghost" | "outline";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-green text-black font-semibold hover:bg-green/90",
  ghost: "bg-transparent text-white hover:bg-white/5",
  outline: "bg-transparent border border-border text-white hover:border-border2 hover:bg-surface3",
};

export function Button({
  variant = "primary",
  type = "button",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-btn px-4 py-2 text-sm font-sans transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
