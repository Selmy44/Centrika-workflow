import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { RequestIcon } from "@/components/shared/RequestIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/dateFormatter";

export const RecentRequests = () => {
  const { isAuthenticated } = useAuth();
  const { data: recentRequests, isLoading } = trpc.requests.getRecentRequests.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated, staleTime: 30000 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-[#3b6dae] dark:text-blue-400 text-sm font-black uppercase tracking-widest opacity-80">
            Recent Requests
          </CardTitle>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Your latest activity</p>
        </div>
        <Link href="/requests">
          <button className="text-[10px] font-bold text-[#3b6dae] hover:text-[#3b6dae]/80 uppercase tracking-widest bg-transparent border-none p-0">View Worklist</button>
        </Link>
      </div>

      {isLoading ? (
        <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 backdrop-blur-sm rounded-2xl">
          <CardContent className="h-40 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#3b6dae]" size={24} />
          </CardContent>
        </Card>
      ) : !recentRequests || recentRequests.length === 0 ? (
        <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 backdrop-blur-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              No recent activity found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentRequests.map((request: any) => (
            <Link key={request.id} href={`/requests/${request.id}`}>
              <Card className="group bg-white dark:bg-slate-900/40 border-border/50 hover:border-[#3b6dae]/30 transition-all duration-300 rounded-2xl cursor-pointer overflow-hidden shadow-sm hover:shadow-md">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-3">
                    <div className="p-2 bg-[#3b6dae]/5 dark:bg-white/5 rounded-xl text-[#3b6dae] dark:text-blue-400 group-hover:scale-105 transition-transform duration-300">
                      <RequestIcon type={request.type} size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-[#3b6dae] dark:text-blue-50 truncate leading-tight">
                        {request.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.05em]">
                          {request.type}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
                          {formatDateTime(request.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={request.status} size="sm" />
                      <button className="h-6 w-6 rounded-full text-[#3b6dae] hover:bg-[#3b6dae]/10 group-hover:translate-x-0.5 transition-all duration-300 bg-transparent border-none">
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-[#3b6dae] transition-all duration-300" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
