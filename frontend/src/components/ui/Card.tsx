import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-white rounded-xl border border-brand-slate-200 shadow-sm p-5",
          hoverable &&
            "transition-all duration-200 hover:shadow-md hover:border-brand-slate-300",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
