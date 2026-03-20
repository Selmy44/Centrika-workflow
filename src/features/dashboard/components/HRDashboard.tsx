import { useLayoutEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  FileText,
  Activity,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Building2,
  Clock3,
  Search,
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dateFormatter";
import { StatsCard } from "@/components/shared/StatsCard";
import { PendingApprovalsWidget } from "./PendingApprovalsWidget";
import { NoticeBoard } from "@/components/NoticeBoard";
import { QuickActions } from "./QuickActions";

const todayIso = () => new Date().toISOString().split("T")[0];

const ProgressFill = ({ percent, className }: { percent: number; className: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.width = `${Math.min(percent, 100)}%`;
    }
  }, [percent]);

  return <div ref={ref} className={`h-full rounded-full ${className}`} />;
};

export const HRDashboard = () => {
  const today = todayIso();
  const { data: stats, isLoading } = trpc.hr.getHRDashboardStats.useQuery();
  const { data: departments = [] } = trpc.employees.getDepartments.useQuery();
  const { data: leaveRequests = [] } = trpc.requests.listAllLeaveRequests.useQuery({ status: "approved" });
  const { data: leaveBalances = [] } = trpc.requests.getAllLeaveBalances.useQuery();
  const { data: pendingDocuments = [] } = trpc.hr.listAllDocuments.useQuery({ status: "pending" });

  const departmentNames = new Map(departments.map((dept: any) => [dept.id, dept.name]));

  const employeesOnLeaveToday = leaveRequests
    .filter((request: any) => {
      const leave = request.leaveRequest;
      return leave && leave.startDate <= today && leave.endDate >= today;
    })
    .slice(0, 6);

  const lowBalanceEmployees = leaveBalances
    .filter((balance: any) => Number(balance.annualLeaveRemaining ?? 0) <= 3)
    .slice(0, 5);

  const departmentOverview = (stats?.departmentDistribution ?? [])
    .map((item: any) => ({
      name: departmentNames.get(item.departmentId) ?? "Unassigned",
      count: item._count.id,
    }))
    .sort((a: any, b: any) => b.count - a.count);

  const taskLoad = (stats?.pendingDocuments ?? 0) + employeesOnLeaveToday.length + lowBalanceEmployees.length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto overflow-hidden">
      {/* Hero Header Section */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">HR Dashboard</h1>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Row 1: Full-Width Stats Grid */}
        <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <StatsCard
            title="Active Workforce"
            value={stats?.totalEmployees || 0}
            icon={<Users className="text-blue-500" size={16} />}
            subtitle="Current live records"
            className="rounded-[1rem]"
          />
          <StatsCard
            title="Away Today"
            value={employeesOnLeaveToday.length || stats?.onLeaveToday || 0}
            icon={<Calendar className="text-amber-500" size={16} />}
            subtitle="Personnel on approved leave"
            className="rounded-[1rem]"
          />
          <StatsCard
            title="Doc Queue"
            value={stats?.pendingDocuments || 0}
            icon={<FileText className="text-rose-500" size={16} />}
            subtitle="Verification backlog"
            className="rounded-[1rem]"
          />
          <StatsCard
            title="Coverage Risk"
            value={lowBalanceEmployees.length}
            icon={<Activity className="text-emerald-500" size={16} />}
            subtitle="Low remaining balances"
            className="rounded-[1rem]"
            />
        </div>

        {/* Row 2: Secondary Content Split */}
        <div className="lg:col-span-8 flex flex-col">
           {/* Integrated Notice Board Card */}
          <Card className="flex-1 bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/10 rounded-[1rem] shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
              <NoticeBoard />
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          {/* Compliance & Risk Bento */}
          <Card className="flex-1 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10 p-8 rounded-[1rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-700" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                   <Activity size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-blue-300">Compliance Queue</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{pendingDocuments.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-blue-400">New Docs</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-rose-500 dark:text-rose-400">{lowBalanceEmployees.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-tighter text-rose-400 dark:text-rose-300">Leave Risk</p>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="h-2 w-full bg-slate-100 dark:bg-blue-900/20 rounded-full overflow-hidden border dark:border-white/5">
                   <ProgressFill percent={65} className="bg-blue-600 dark:bg-blue-500 shadow-[0_0_15px_rgba(59,109,174,0.4)]" />
                </div>
                <p className="mt-4 text-[10px] text-slate-500 dark:text-blue-300 font-medium italic">Safety & Compliance Health: 84% Stable</p>
              </div>
            </div>
          </Card>
        </div>


        {/* Row 3: More Bento Blocks */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          <Card className="flex-1 rounded-[1rem] border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xl">
             <CardHeader className="p-8 pb-4 border-b border-border/10 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-lg font-black text-slate-800 dark:text-white">Recent Workforce Pulse</CardTitle>
                   <CardDescription className="text-xs">Live events from the employee lifecycle.</CardDescription>
                </div>
                <Link href="/hr/reports">
                  <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">Full Log <ArrowRight size={14} className="ml-1" /></Button>
                </Link>
             </CardHeader>
             <CardContent className="p-8 pt-6 space-y-4">
                {(stats?.recentActivities ?? []).length ? (
                  stats?.recentActivities.map((activity: any) => (
                    <div key={activity.id} className="group relative flex items-center justify-between rounded-2xl border border-slate-100 dark:border-white/10 bg-white/60 dark:bg-slate-800/40 p-4 transition-all hover:translate-x-1 hover:bg-white dark:hover:bg-slate-800/60 shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                         <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs shadow-inner">
                              {activity.user?.name?.charAt(0) || "U"}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 p-0.5 shadow-sm">
                               <div className="w-full h-full rounded-full bg-green-500" />
                            </div>
                         </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{activity.user?.name || "Anonymous User"}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                            {activity.type} ACTION · {formatDateTime(activity.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <Link href={`/requests/${activity.id}`}>
                        <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 hover:bg-blue-500 hover:text-white transition-all duration-300">
                          <ArrowRight size={14} />
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/50 py-16 text-center">
                    <p className="text-sm text-slate-400 font-medium italic">No pulse detected yet.</p>
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="rounded-[1rem] border-slate-100 dark:border-white/10 bg-white shadow-xl dark:bg-slate-900/60 overflow-hidden flex-1">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Department Health</CardTitle>
                <CardDescription className="text-[10px]">Headcount density across teams.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-5">
                {departmentOverview.slice(0, 6).map((department: any) => {
                  const percent = stats?.totalEmployees ? (department.count / stats.totalEmployees) * 100 : 0;
                  return (
                    <div key={department.name} className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                        <span>{department.name}</span>
                        <span className="text-blue-600 dark:text-blue-400">{department.count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <ProgressFill percent={percent} className="bg-blue-500 shadow-[0_0_8px_rgba(59,109,174,0.3)]" />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            <PendingApprovalsWidget />
        </div>
      </div>
    </div>
  );
};
