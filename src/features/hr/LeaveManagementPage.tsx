import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Search, Filter, Download, Users, ShieldAlert, Clock3, CheckCircle2, ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const LeaveManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const today = new Date().toISOString().split("T")[0];

  const { data: allRequests = [], isLoading: requestsLoading } = trpc.requests.listAllLeaveRequests.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: allBalances = [], isLoading: balancesLoading } = trpc.requests.getAllLeaveBalances.useQuery();

  const filteredRequests = useMemo(
    () =>
      allRequests.filter((req: any) =>
        req.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.leaveRequest?.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allRequests, searchTerm]
  );

  const todaysCoverage = useMemo(
    () =>
      allRequests.filter((req: any) => {
        const leave = req.leaveRequest;
        return leave && req.status === "approved" && leave.startDate <= today && leave.endDate >= today;
      }),
    [allRequests, today]
  );

  const pendingRequests = allRequests.filter((req: any) => req.status === "pending");
  const lowBalances = allBalances.filter((balance: any) => Number(balance.annualLeaveRemaining ?? 0) <= 3);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Leave Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Company-wide leave oversight, balance risk tracking, and operational coverage.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl border-border/50">
              <Download size={16} className="mr-2" /> Export Report
            </Button>
            <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700">Update Policies</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Approved Today</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{todaysCoverage.length}</p>
              <p className="mt-1 text-xs text-slate-500">Employees currently away</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Review</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{pendingRequests.length}</p>
              <p className="mt-1 text-xs text-slate-500">Requests waiting on approval</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Low Balances</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{lowBalances.length}</p>
              <p className="mt-1 text-xs text-slate-500">Employees under 3 remaining days</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Balances</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{allBalances.length}</p>
              <p className="mt-1 text-xs text-slate-500">Tracked employees this year</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Tabs defaultValue="requests" className="w-full space-y-6">
              <TabsList className="w-fit rounded-2xl border border-border/30 bg-slate-100 p-1 dark:bg-slate-800/50">
                <TabsTrigger value="requests" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">
                  All Requests
                </TabsTrigger>
                <TabsTrigger value="balances" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">
                  Employee Balances
                </TabsTrigger>
                <TabsTrigger value="coverage" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">
                  Today&apos;s Coverage
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-4">
                <Card className="rounded-2xl border-border/50 bg-white/50 backdrop-blur-sm">
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <div className="relative min-w-[220px] flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        placeholder="Search employee, department, or leave type..."
                        className="rounded-xl border-border/50 pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter size={16} className="text-slate-400" />
                      <select
                        className="cursor-pointer bg-transparent text-sm font-medium focus:outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Days</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {requestsLoading ? (
                          [1, 2, 3].map((i) => (
                            <tr key={i}>
                              <td colSpan={6} className="px-6 py-4 animate-pulse">
                                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                              </td>
                            </tr>
                          ))
                        ) : filteredRequests.length ? (
                          filteredRequests.map((req: any) => (
                            <tr
                              key={req.id}
                              className="cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                              onClick={() => {
                                window.location.href = `/requests/${req.id}`;
                              }}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/30">
                                    {req.user.name?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{req.user.name}</p>
                                    <p className="text-[10px] text-slate-500">{req.user.department?.name || "No Dept"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className="border-slate-300 text-[10px] font-bold uppercase text-slate-500">
                                  {req.leaveRequest?.leaveType}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                {req.leaveRequest?.startDate} to {req.leaveRequest?.endDate}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">{req.leaveRequest?.leaveDaysRequested}</td>
                              <td className="px-6 py-4">
                                <Badge
                                  className={
                                    req.status === "approved"
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                                      : req.status === "rejected"
                                        ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
                                        : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                                  }
                                >
                                  {req.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-[10px] font-medium text-slate-400">{formatDateTime(req.createdAt)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-sm italic text-slate-500">
                              No leave requests found matching your filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="balances">
                <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Entitled</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Taken</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Remaining</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {balancesLoading ? (
                          [1, 2, 3].map((i) => (
                            <tr key={i}>
                              <td colSpan={5} className="px-6 py-4 animate-pulse">
                                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                              </td>
                            </tr>
                          ))
                        ) : allBalances.length ? (
                          allBalances.map((balance: any) => (
                            <tr key={balance.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold uppercase text-slate-600 dark:bg-slate-800">
                                    {balance.user.name?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{balance.user.name}</p>
                                    <p className="text-[10px] text-slate-500">{balance.user.department?.name || "Unassigned"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{balance.annualLeaveEntitled}</td>
                              <td className="px-6 py-4 text-sm font-bold text-rose-500">{balance.annualLeaveTaken}</td>
                              <td className="px-6 py-4">
                                <span className={`text-sm font-black ${balance.annualLeaveRemaining < 5 ? "text-rose-600" : "text-blue-600"}`}>
                                  {balance.annualLeaveRemaining}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[10px] italic text-slate-400">{formatDateTime(balance.updatedAt)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-sm italic text-slate-500">
                              No leave balance records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="coverage">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                        <Calendar size={16} /> Today&apos;s Leave Calendar
                      </CardTitle>
                      <CardDescription className="text-xs">Employees currently away and their coverage window.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {todaysCoverage.length ? (
                        todaysCoverage.map((req: any) => (
                          <div key={req.id} className="rounded-xl border border-border/40 bg-slate-50/80 p-4 dark:bg-slate-950/30">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{req.user.name}</p>
                                <p className="text-xs text-slate-500">{req.user.department?.name || "No department"} · {req.leaveRequest?.leaveType}</p>
                              </div>
                              <Badge variant="outline">{req.leaveRequest?.endDate}</Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                          No approved leave is active today.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                        <ShieldAlert size={16} /> Policy Attention
                      </CardTitle>
                      <CardDescription className="text-xs">Suggested HR follow-up based on live balance and workload signals.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Low Balance Watch</p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{lowBalances.length} employees are approaching annual leave exhaustion.</p>
                      </div>
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">Coverage Review</p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Monitor overlapping approvals when multiple employees from one department are away.</p>
                      </div>
                      <Link href="/hr/reports">
                        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                          Open HR Reports
                          <ArrowRight size={14} />
                        </button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Operational Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <Users size={14} />
                    <p className="text-xs font-bold uppercase tracking-widest">Coverage</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{todaysCoverage.length} employees are currently on approved leave today.</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-amber-600">
                    <Clock3 size={14} />
                    <p className="text-xs font-bold uppercase tracking-widest">Review Queue</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{pendingRequests.length} leave requests are waiting for approval action.</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={14} />
                    <p className="text-xs font-bold uppercase tracking-widest">Balance Control</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{allBalances.length} employees have current-year leave balances tracked.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaveManagementPage;
