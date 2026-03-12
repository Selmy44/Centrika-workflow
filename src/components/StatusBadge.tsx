import { CheckCircle2, XCircle, Clock, FileText, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  switch (status) {
    case "approved":
      return (
        <div className={`flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-linear-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-all`}>
          <CheckCircle2 size={size === "sm" ? 14 : size === "lg" ? 18 : 16} className="text-emerald-500 animate-pulse" />
          <span className={`font-semibold text-emerald-600 dark:text-emerald-400`}>Approved</span>
        </div>
      );
    case "rejected":
      return (
        <div className={`flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-linear-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 hover:border-red-500/50 transition-all`}>
          <XCircle size={size === "sm" ? 14 : size === "lg" ? 18 : 16} className="text-red-500 animate-pulse" />
          <span className={`font-semibold text-red-600 dark:text-red-400`}>Rejected</span>
        </div>
      );
    case "cancelled":
      return (
        <div className={`flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-linear-to-r from-gray-500/10 to-slate-500/10 border border-gray-500/30 hover:border-gray-500/50 transition-all`}>
          <AlertCircle size={size === "sm" ? 14 : size === "lg" ? 18 : 16} className="text-gray-500" />
          <span className={`font-semibold text-gray-600 dark:text-gray-400`}>Cancelled</span>
        </div>
      );
    case "pending":
      return (
        <div className={`flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-all`}>
          <Clock size={size === "sm" ? 14 : size === "lg" ? 18 : 16} className="text-amber-500 animate-spin" />
          <span className={`font-semibold text-amber-600 dark:text-amber-400`}>Pending</span>
        </div>
      );
    case "draft":
      return (
        <div className={`flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-linear-to-r from-slate-500/10 to-gray-500/10 border border-slate-500/30 hover:border-slate-500/50 transition-all`}>
          <FileText size={size === "sm" ? 14 : size === "lg" ? 18 : 16} className="text-slate-500" />
          <span className={`font-semibold text-slate-600 dark:text-slate-400`}>Draft</span>
        </div>
      );
    default:
      return (
        <div className={`flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-muted border border-border`}>
          <span className={`font-semibold text-muted-foreground capitalize`}>{status}</span>
        </div>
      );
  }
}
