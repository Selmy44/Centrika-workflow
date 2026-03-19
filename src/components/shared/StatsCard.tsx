import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export const StatsCard = ({ title, value, icon, subtitle, loading, className, trend }: StatsCardProps) => {
  return (
    <Card className={`group relative overflow-hidden bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl hover:shadow-2xl hover:shadow-[#3b6dae]/5 transition-all duration-500 hover:-translate-y-1 ${className || ""}`}>
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[12px] font-black text-slate-400 dark:text-blue-400/40 uppercase tracking-[0.2em] mb-1 truncate">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-blue-50 tracking-tight leading-none">
                {loading ? (
                  <div className="h-8 w-16 bg-muted-foreground/10 animate-pulse rounded-lg" />
                ) : (
                  value
                )}
              </h3>
              {trend && !loading && (
                <div className={`px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-tight flex items-center gap-0.5 ${trend.isUp ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"}`}>
                  {trend.isUp ? "+" : "-"}
                  {trend.value}%
                </div>
              )}
            </div>
            
            {subtitle && !loading && (
              <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c79d2d]" />
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="shrink-0 h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-[#3b6dae]/5 dark:bg-blue-500/10 flex items-center justify-center text-[#3b6dae] dark:text-blue-400 group-hover:scale-110 transition-transform duration-500 shadow-inner">
            {icon || <div className="h-1.5 w-1.5 bg-[#c79d2d] rounded-full" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
