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
import { formatDateTime } from "@/lib/dateFormatter";
import { StatsCard } from "@/components/shared/StatsCard";
import { PendingApprovalsWidget } from "./PendingApprovalsWidget";

const todayIso = () => new Date().toISOString().split("T")[0];

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-800 dark:text-white">
            HR Command Center
            <Badge variant="outline" className="border-blue-500/30 text-[10px] font-bold uppercase tracking-widest text-blue-500">
              Workforce Live
            </Badge>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Today&apos;s people operations, compliance workload, and workforce movement at a glance.
          </p>
        </div>

        <Card className="border-blue-200/60 bg-linear-to-r from-blue-50 to-cyan-50 shadow-sm dark:border-blue-900/40 dark:from-slate-900 dark:to-slate-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operational Focus</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{taskLoad} items need HR attention</p>
              <p className="text-xs text-slate-500">Documents, leave coverage, and low-balance follow-up.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Active Headcount"
          value={stats?.totalEmployees || 0}
          icon={<Users className="text-blue-500" size={18} />}
          subtitle="Employees currently active"
        />
        <StatsCard
          title="Away Today"
          value={employeesOnLeaveToday.length || stats?.onLeaveToday || 0}
          icon={<Calendar className="text-amber-500" size={18} />}
          subtitle="Approved leave in progress"
        />
        <StatsCard
          title="Pending Documents"
          value={stats?.pendingDocuments || 0}
          icon={<FileText className="text-rose-500" size={18} />}
          subtitle="Verification queue"
        />
        <StatsCard
          title="Low Leave Balances"
          value={lowBalanceEmployees.length}
          icon={<Activity className="text-emerald-500" size={18} />}
          subtitle="Employees under 3 remaining days"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="overflow-hidden rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="border-b border-border/30 bg-blue-500/5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    HR Utility Stack
                  </CardTitle>
                  <CardDescription className="text-xs">Move from insight to action in one click.</CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Action Ready
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Employee Directory", path: "/employee-directory", icon: <Users size={16} />, hint: "Profiles, contacts, and teams" },
                { label: "Leave Management", path: "/hr/leave", icon: <Calendar size={16} />, hint: "Company-wide leave control" },
                { label: "Document Center", path: "/hr/documents", icon: <FileText size={16} />, hint: "Verify contracts and IDs" },
                { label: "HR Reports", path: "/hr/reports", icon: <Search size={16} />, hint: "Trends, headcount, and policy signals" },
              ].map((item) => (
                <Link key={item.path} href={item.path}>
                  <button className="group w-full rounded-2xl border border-border/40 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:bg-slate-950/40">
                    <div className="mb-4 flex items-center justify-between text-slate-700 dark:text-slate-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                        {item.icon}
                      </div>
                      <ArrowRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
                  </button>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                  <Clock3 size={16} /> Employees On Leave Today
                </CardTitle>
                <CardDescription className="text-xs">Coverage view for today&apos;s approved leave schedule.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {employeesOnLeaveToday.length ? (
                  employeesOnLeaveToday.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-50/80 p-3 dark:bg-slate-950/30">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{request.user?.name}</p>
                        <p className="text-xs text-slate-500">
                          {request.user?.department?.name || "No department"} · {request.leaveRequest?.leaveType || "leave"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
                        {request.leaveRequest?.endDate}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                    No approved leaves are active today.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                  <Building2 size={16} /> Department Overview
                </CardTitle>
                <CardDescription className="text-xs">Headcount distribution across active departments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {departmentOverview.length ? (
                  departmentOverview.map((department: any) => {
                    const percent = stats?.totalEmployees ? (department.count / stats.totalEmployees) * 100 : 0;
                    return (
                      <div key={department.name} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>{department.name}</span>
                          <span>{department.count} employees</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                    Department data will appear once employees are assigned.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="border-b border-border/30 py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Recent Workforce Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {(stats?.recentActivities ?? []).length ? (
                stats?.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-50/80 p-3 dark:bg-slate-950/30">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{activity.user?.name || "Unknown employee"}</p>
                      <p className="text-xs text-slate-500">
                        {activity.type} request updated · {formatDateTime(activity.updatedAt)}
                      </p>
                    </div>
                    <Link href={`/requests/${activity.id}`}>
                      <button className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950/40">
                        <ArrowRight size={16} />
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                  No workforce activity has been recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <PendingApprovalsWidget />

          <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Compliance Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Document Verification</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{pendingDocuments.length}</p>
                <p className="text-xs text-slate-500">Pending employee records require validation.</p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400">Leave Risk Watch</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{lowBalanceEmployees.length}</p>
                <p className="text-xs text-slate-500">Employees are nearing leave exhaustion and may need follow-up.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Verification Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingDocuments.slice(0, 4).map((document: any) => (
                <div key={document.id} className="rounded-xl border border-border/40 bg-slate-50/80 p-3 dark:bg-slate-950/30">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{document.user?.name || "Employee document"}</p>
                  <p className="text-xs text-slate-500">{document.category} · {document.name}</p>
                </div>
              ))}
              {!pendingDocuments.length && (
                <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                  No pending document reviews right now.
                </div>
              )}
              <Link href="/hr/documents">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                  Open Document Center
                  <ArrowRight size={14} />
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};


