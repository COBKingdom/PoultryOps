import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary";
  children: React.ReactNode;
}

export function Badge({ 
  variant = "default", 
  children, 
  className = "",
  ...props 
}: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";
  
  const variants = {
    default: "bg-blue-100 text-blue-700",
    outline: "border border-slate-200 bg-white text-slate-700",
    secondary: "bg-slate-100 text-slate-700",
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}