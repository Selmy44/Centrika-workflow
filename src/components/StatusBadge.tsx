import { CheckCircle2, XCircle, Clock, FileText, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  };

  switch (status.toLowerCase()) {
    case "approved":
      return (
        <div className={`flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-[#3b6dae]/10 border border-[#3b6dae]/20 transition-all`}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#3b6dae]" />
          <span className="font-bold text-[#3b6dae] uppercase tracking-wider">Approved</span>
        </div>
      );
    case "rejected":
      return (
        <div className={`flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-[#FE5E33]/10 border border-[#FE5E33]/20 transition-all`}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#FE5E33]" />
          <span className="font-bold text-[#FE5E33] uppercase tracking-wider">Rejected</span>
        </div>
      );
    case "pending":
      return (
        <div className={`flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-[#FFB600]/10 border border-[#FFB600]/20 transition-all`}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFB600] animate-pulse" />
          <span className="font-bold text-[#FFB600] uppercase tracking-wider">Pending</span>
        </div>
      );
    case "cancelled":
      return (
        <div className={`flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all`}>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span className="font-bold text-slate-500 uppercase tracking-wider">Cancelled</span>
        </div>
      );
    case "draft":
      return (
        <div className={`flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-[#3b6dae]/10 dark:bg-[#3b6dae]/20 border border-[#3b6dae]/20 dark:border-[#3b6dae]/30 transition-all`}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#3b6dae]" />
          <span className="font-bold text-[#3b6dae] uppercase tracking-wider">Draft</span>
        </div>
      );
    default:
      return (
        <div className={`flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-muted border border-border`}>
          <span className="font-bold text-muted-foreground uppercase tracking-wider">{status}</span>
        </div>
      );
  }
}
