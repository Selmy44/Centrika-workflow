import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, Clock, CheckCircle2, XCircle, Loader2, Sun, Moon, Briefcase, Activity } from "lucide-react";
import { useMemo } from "react";

export default function TeamStatusPage() {
  const { user, isAuthenticated } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data: employees = [], isLoading: loadingEmployees } = trpc.employees.list.useQuery(
    { departmentId: user?.departmentId || undefined },
    { enabled: isAuthenticated }
  );

  const { data: allLeaveRequests = [], isLoading: loadingLeave } = trpc.requests.listAllLeaveRequests.useQuery(
    { status: "approved" },
    { enabled: isAuthenticated }
  );

  const onLeaveToday = useMemo(() => {
    return allLeaveRequests.filter((req: any) => {
      const leave = req.leaveRequest;
      if (!leave) return false;
      const start = leave.startDate;
      const end = leave.endDate;
      return req.status === "approved" && start <= today && end >= today;
    });
  }, [allLeaveRequests, today]);

  const onLeaveIds = new Set(onLeaveToday.map((r: any) => r.userId));

  const availableMembers = employees.filter((e: any) => !onLeaveIds.has(e.id));
  const awayMembers = employees.filter((e: any) => onLeaveIds.has(e.id));

  const upcomingLeave = useMemo(() => {
    return allLeaveRequests
      .filter((req: any) => {
        const start = req.leaveRequest?.startDate;
        return start && start > today;
      })
      .sort((a: any, b: any) => a.leaveRequest.startDate.localeCompare(b.leaveRequest.startDate))
      .slice(0, 8);
  }, [allLeaveRequests, today]);

  const isLoading = loadingEmployees || loadingLeave;

  const availabilityRate = employees.length > 0
    ? Math.round((availableMembers.length / employees.length) * 100)
    : 100;

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#3b6dae] dark:text-[#c79d2d]">Team Status</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Real-time workforce availability, leave coverage, and upcoming out-of-office schedule.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">
              <Calendar size={14} className="mr-1.5" />
              {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="overflow-hidden rounded-2xl border-border/50 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {isLoading ? "–" : availableMembers.length}
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-emerald-600">Ready for work today</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/50 bg-gradient-to-br from-white to-amber-50/40 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Sun size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">On Leave</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {isLoading ? "–" : awayMembers.length}
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-amber-600">Currently away</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/50 bg-gradient-to-br from-white to-blue-50/40 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Team</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {isLoading ? "–" : employees.length}
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-blue-600">Tracked members</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/50 bg-gradient-to-br from-white to-indigo-50/40 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Coverage</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {isLoading ? "–" : `${availabilityRate}%`}
                  </p>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${availabilityRate >= 80 ? "bg-emerald-500" : availabilityRate >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${availabilityRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Available Members */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/30 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-600">
                  <CheckCircle2 size={16} /> Available Now
                </CardTitle>
                <CardDescription className="text-[10px]">Team members in office today</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border/30 p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : availableMembers.length ? (
                  availableMembers.map((emp: any) => (
                    <div key={emp.id} className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={emp.profileImage ?? undefined} alt={emp.name ?? ""} />
                          <AvatarFallback className="bg-emerald-100 text-xs font-bold text-emerald-700">
                            {emp.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{emp.name}</p>
                        <p className="truncate text-[10px] text-slate-500">{emp.position || emp.role} • {emp.department || "No dept"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center text-sm italic text-slate-400">No available members found</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Away + Upcoming */}
          <div className="space-y-6 lg:col-span-7">
            {/* Currently Away */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/30 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-600">
                  <Sun size={16} /> Currently Away
                </CardTitle>
                <CardDescription className="text-[10px]">Employees on approved leave today</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : onLeaveToday.length ? (
                  <div className="divide-y divide-border/30">
                    {onLeaveToday.map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between gap-4 px-6 py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={req.user?.profileImage ?? undefined} alt={req.user?.name ?? ""} />
                              <AvatarFallback className="bg-amber-100 text-xs font-bold text-amber-700">
                                {req.user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-amber-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{req.user?.name}</p>
                            <p className="truncate text-[10px] text-slate-500">{req.user?.department?.name || "No dept"}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline" className="border-amber-300/60 text-[10px] font-bold uppercase text-amber-600">
                            {req.leaveRequest?.leaveType}
                          </Badge>
                          <span className="text-[10px] font-medium text-slate-400">
                            until {req.leaveRequest?.endDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center">
                    <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={24} />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Full team available</p>
                    <p className="text-[10px] text-slate-400">No employees are on leave today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Leave */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/30 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-600">
                  <Clock size={16} /> Upcoming Leave
                </CardTitle>
                <CardDescription className="text-[10px]">Approved leave requests starting soon</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : upcomingLeave.length ? (
                  <div className="divide-y divide-border/30">
                    {upcomingLeave.map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between gap-4 px-6 py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-[10px] font-bold text-blue-700">
                              {req.user?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{req.user?.name}</p>
                            <p className="truncate text-[10px] text-slate-500">
                              {req.leaveRequest?.startDate} → {req.leaveRequest?.endDate}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 border-blue-300/60 text-[10px] font-bold uppercase text-blue-600">
                          {req.leaveRequest?.leaveType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center text-sm italic text-slate-400">
                    No upcoming leave requests scheduled
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
