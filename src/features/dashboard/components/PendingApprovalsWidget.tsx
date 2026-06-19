import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, UserCircle } from "lucide-react";
import { Link } from "wouter";
import { RequestIcon } from "@/components/shared/RequestIcon";
import { formatDateTime } from "@/lib/dateFormatter";

export const PendingApprovalsWidget = () => {
  const { data: approvals, isLoading } = trpc.requests.listPendingApprovals.useQuery(undefined, {
    staleTime: 10000,
  });

  if (isLoading) {
    return (
      <Card className="bg-white/50 backdrop-blur-sm border-border/50 rounded-2xl">
        <CardContent className="h-32 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#3b6dae]" size={24} />
        </CardContent>
      </Card>
    );
  }

  // Only show the widget if there are actual approvals pending to keep the dashboard clean
  if (!approvals || approvals.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border-border/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-500 relative group">
      {/* Decorative gradient that glows subtly on hover */}
      <div className="absolute inset-0 bg-linear-to-br from-[#3b6dae]/5 to-[#c79d2d]/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
      
      <CardHeader className="bg-[#3b6dae]/5 dark:bg-white/5 border-b border-border/30 dark:border-white/10 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[#3b6dae] text-sm font-black uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Action Required
          </CardTitle>
          <span className="text-[10px] font-bold bg-[#3b6dae] text-white px-2 py-0.5 rounded-full shadow-sm">
            {approvals.length} Pending
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 relative z-10">
        <div className="space-y-2 max-h-55 overflow-y-auto pr-1 custom-scrollbar">
          {approvals.slice(0, 4).map((request: any) => (
            <Link key={request.id} href={`/approvals?requestId=${request.id}`}>
              <div className="group/item flex items-center justify-between p-2.5 bg-white dark:bg-slate-900/40 border border-border/50 dark:border-white/10 hover:border-[#3b6dae]/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c79d2d] opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#3b6dae]/5 dark:bg-white/5 rounded-lg text-[#3b6dae] dark:text-blue-400">
                    <RequestIcon type={request.type} size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-[#3b6dae] dark:text-blue-50 truncate leading-tight mb-0.5">
                      {request.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                      {request.user && (
                         <span className="flex items-center gap-1 text-slate-500 dark:text-slate-300 font-bold max-w-20 truncate">
                            <UserCircle size={10} />
                            {request.user.name?.split(' ')[0]}
                         </span>
                      )}
                      {request.user && <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />}
                      <span className="uppercase tracking-tight truncate max-w-17.5">{request.type}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                      <span className="tracking-tight">{formatDateTime(request.createdAt).split(',')[0]}</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-[#3b6dae] hover:bg-[#3b6dae]/10 group-hover/item:translate-x-1 transition-all duration-300">
                  <ArrowRight size={12} strokeWidth={3} />
                </Button>
              </div>
            </Link>
          ))}
        </div>
        
        {approvals.length > 4 && (
          <div className="mt-3 text-center">
             <Link href="/approvals">
               <Button variant="link" className="text-[10px] font-bold text-[#3b6dae] hover:text-[#3b6dae]/80 uppercase tracking-widest h-auto p-0">
                 View All {approvals.length} Approvals
               </Button>
             </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
