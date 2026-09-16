import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "danger" | "info" | "neutral" | "brand" | "primary" | "default";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "neutral",
  size = "md",
  ...props
}) => {
  const baseStyles = "inline-flex items-center font-medium rounded-md";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    error: "bg-red-100 text-red-800 border border-red-200",
    danger: "bg-red-100 text-red-800 border border-red-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200",
    neutral: "bg-brand-slate-100 text-brand-slate-700 border border-brand-slate-200",
    default: "bg-brand-slate-100 text-brand-slate-700 border border-brand-slate-200",
    brand: "bg-brand-emerald-50 text-brand-emerald-800 border border-brand-emerald-200",
    primary: "bg-brand-emerald-100 text-brand-emerald-900 border border-brand-emerald-200",
  };

  return (
    <span
      className={twMerge(
        clsx(baseStyles, sizeStyles[size], variantStyles[variant] || variantStyles.neutral, className)
      )}
      {...props}
    >
      {children}
    </span>
  );
};
