import React from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface VendorEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export const VendorEmptyState: React.FC<VendorEmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderOpen,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-brand-slate-200 bg-brand-slate-50/50 ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-brand-slate-100 text-brand-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-bold text-brand-slate-800">{title}</h4>
      {description && (
        <p className="text-[11px] text-brand-slate-500 max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-3.5">
          {action.href ? (
            <Link href={action.href}>
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="text-xs font-semibold"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
