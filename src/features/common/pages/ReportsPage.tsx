import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, PieChart as PieChartIcon, Download, Calendar, TrendingUp, Users, DollarSign, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const monthKey = (value: string | Date) => new Date(value).toISOString().slice(0, 7);
const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short" });
};

const ReportsPage = ({ type }: { type: "hr" | "finance" }) => {
  const hrStats = trpc.hr.getHRDashboardStats.useQuery(undefined, { enabled: type === "hr" });
  const leaveUsage = trpc.hr.getLeaveUsageReport.useQuery(undefined, { enabled: type === "hr" });
  const headcountTrends = trpc.hr.getHeadcountTrends.useQuery(undefined, { enabled: type === "hr" });
  const leaveBalances = trpc.requests.getAllLeaveBalances.useQuery(undefined, { enabled: type === "hr" });

  const financeOverview = trpc.finance.getFinancialOverview.useQuery(undefined, { enabled: type === "finance" });
  const budgetStatus = trpc.finance.getBudgetStatus.useQuery({ year: new Date().getFullYear() }, { enabled: type === "finance" });
  const expenditureHistory = trpc.requests.getExpenditureHistory.useQuery(undefined, { enabled: type === "finance" });

  const isHR = type === "hr";

  const monthlyTrend = Object.values(
    (financeOverview.data?.monthlyTrend ?? []).reduce((acc: Record<string, { key: string; total: number }>, item: any) => {
      const key = monthKey(item.date);
      acc[key] = acc[key] ?? { key, total: 0 };
      acc[key].total += Number(item.amount || 0);
      return acc;
    }, {})
  ).sort((a: any, b: any) => a.key.localeCompare(b.key));

  const topSpendingAreas = Object.values(
    (expenditureHistory.data ?? []).reduce((acc: Record<string, { label: string; total: number }>, item: any) => {
      const label = item.expenditureRequest?.department || item.expenditureRequest?.category || "Unclassified";
      acc[label] = acc[label] ?? { label, total: 0 };
      acc[label].total += Number(item.amount || 0);
      return acc;
    }, {})
  )
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  const lowBalanceEmployees = (leaveBalances.data ?? []).filter((item: any) => Number(item.annualLeaveRemaining ?? 0) <= 3);

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black capitalize tracking-tight text-[#3b6dae] dark:text-[#c79d2d]">{type} Analytics & Reports</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Decision support for {type} operations with action-ready signals and operational trends.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Calendar size={16} className="mr-2" /> Current Year
            </Button>
            <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700">
              <Download size={16} className="mr-2" /> Export Snapshot
            </Button>
          </div>
        </div>

        {isHR ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Headcount</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{hrStats.data?.totalEmployees || 0}</p>
                  <p className="mt-1 text-xs text-slate-500">Employees currently marked active</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">On Leave Today</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{hrStats.data?.onLeaveToday || 0}</p>
                  <p className="mt-1 text-xs text-slate-500">Live workforce availability signal</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Documents</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{hrStats.data?.pendingDocuments || 0}</p>
                  <p className="mt-1 text-xs text-slate-500">Compliance items needing verification</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Leave Risk Watch</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{lowBalanceEmployees.length}</p>
                  <p className="mt-1 text-xs text-slate-500">Employees under 3 annual leave days</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <PieChartIcon size={14} /> Leave Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {leaveUsage.data?.length ? (
                    leaveUsage.data.map((item: any) => (
                      <div key={item.leaveType} className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-50/70 p-3 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-300">{item.leaveType}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-white">{item._count.id} requests</span>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-xs italic text-slate-400">No leave data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 shadow-sm lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <TrendingUp size={14} /> Headcount Trend
                  </CardTitle>
                  <CardDescription className="text-[10px]">Growth momentum over the latest tracked months</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex h-48 items-end gap-3 rounded-2xl border border-border/40 bg-slate-50/70 p-4 dark:bg-slate-900/40">
                    {headcountTrends.data?.length ? (
                      headcountTrends.data.map((trend: any) => {
                        const max = Math.max(...headcountTrends.data!.map((item: any) => item.count), 1);
                        return (
                          <div key={trend.month} className="flex flex-1 flex-col items-center gap-2">
                            <div className="flex w-full flex-1 items-end rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                              <div className="w-full rounded-lg bg-indigo-600" style={{ height: `${(trend.count / max) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{trend.month}</span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{trend.count}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex w-full items-center justify-center text-sm italic text-slate-400">No trend data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 shadow-sm lg:col-span-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <AlertTriangle size={14} /> Workforce Attention List
                      </CardTitle>
                      <CardDescription className="text-[10px]">Employees with low annual leave balances</CardDescription>
                    </div>
                    <Link href="/hr/leave">
                      <span className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">Open leave management</span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {lowBalanceEmployees.length ? (
                    lowBalanceEmployees.map((employee: any) => (
                      <div key={employee.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-50/70 p-3 dark:bg-slate-900/40">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{employee.user?.name}</p>
                          <p className="text-xs text-slate-500">{employee.user?.department?.name || "No department"}</p>
                        </div>
                        <Badge variant="outline" className="border-amber-300 text-amber-600">
                          {Number(employee.annualLeaveRemaining || 0).toFixed(1)} days left
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-500">No employees are currently close to leave exhaustion.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Spending</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">RWF {(financeOverview.data?.totalSpentRWF || 0).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">Approved expenditures</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Approvals</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{financeOverview.data?.pendingApprovals || 0}</p>
                  <p className="mt-1 text-xs text-slate-500">Expenditure requests awaiting review</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Approval Efficiency</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{financeOverview.data?.approvalEfficiency || 0}%</p>
                  <p className="mt-1 text-xs text-slate-500">Operational processing benchmark</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Budget Lines At Risk</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                    {(budgetStatus.data ?? []).filter((item: any) => item.totalAmount > 0 && (item.actual / item.totalAmount) * 100 >= 80).length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Departments above 80% utilization</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="rounded-2xl border-border/50 shadow-sm lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <DollarSign size={14} /> Spending Trends
                  </CardTitle>
                  <CardDescription className="text-[10px]">Aggregated approved expenditure by month</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 h-64">
                  <div className="flex h-full items-end gap-3 rounded-2xl border border-border/40 bg-slate-50/70 p-4 dark:bg-slate-900/40">
                    {monthlyTrend.length ? (
                      monthlyTrend.map((item: any) => {
                        const max = Math.max(...monthlyTrend.map((entry: any) => entry.total), 1);
                        return (
                          <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                            <div className="flex w-full flex-1 items-end rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                              <div className="w-full rounded-lg bg-blue-600/80" style={{ height: `${(item.total / max) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{monthLabel(item.key)}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex w-full items-center justify-center text-sm italic text-slate-400">No spending trend data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <ShieldCheck size={14} /> Budget Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {(budgetStatus.data ?? []).slice(0, 5).map((item: any) => {
                    const percent = item.totalAmount > 0 ? (item.actual / item.totalAmount) * 100 : 0;
                    return (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-300">{item.department?.name}</span>
                          <span className={percent >= 90 ? "text-rose-600" : percent >= 75 ? "text-amber-600" : "text-blue-600"}>{percent.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full ${percent >= 90 ? "bg-rose-500" : percent >= 75 ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 shadow-sm lg:col-span-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <BarChart size={14} /> Top Spending Areas
                      </CardTitle>
                      <CardDescription className="text-[10px]">Highest expenditure concentration by department or category</CardDescription>
                    </div>
                    <Link href="/finance/history">
                      <span className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">Open expenditure history</span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {topSpendingAreas.length ? (
                    topSpendingAreas.map((area: any) => (
                      <div key={area.label} className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-50/70 p-3 dark:bg-slate-900/40">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{area.label}</p>
                        <Badge variant="outline">RWF {area.total.toLocaleString()}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-500">No expenditure categories available yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
