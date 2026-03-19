import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, CheckCircle, Clock, ArrowRight, FileText, Receipt, AlertTriangle, Landmark } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/shared/StatsCard";
import { PendingApprovalsWidget } from "./PendingApprovalsWidget";

const monthKey = (value: string | Date) => new Date(value).toISOString().slice(0, 7);
const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short" });
};

export const FinanceDashboard = () => {
  const currentYear = new Date().getFullYear();
  const { data: overview, isLoading } = trpc.finance.getFinancialOverview.useQuery();
  const { data: budgets = [] } = trpc.finance.getBudgetStatus.useQuery({ year: currentYear });
  const { data: vouchers = [] } = trpc.finance.listVouchers.useQuery();
  const { data: history = [] } = trpc.requests.getExpenditureHistory.useQuery();

  const monthlySeries = Object.values(
    (overview?.monthlyTrend ?? []).reduce((acc: Record<string, { key: string; total: number }>, item: any) => {
      const key = monthKey(item.date);
      acc[key] = acc[key] ?? { key, total: 0 };
      acc[key].total += Number(item.amount || 0);
      return acc;
    }, {})
  ).sort((a: any, b: any) => a.key.localeCompare(b.key));

  const latestMonth = monthlySeries[monthlySeries.length - 1]?.total ?? 0;
  const previousMonth = monthlySeries[monthlySeries.length - 2]?.total ?? 0;
  const monthlyDelta = previousMonth > 0 ? ((latestMonth - previousMonth) / previousMonth) * 100 : 0;

  const budgetHealth = budgets.map((budget: any) => {
    const percent = budget.totalAmount > 0 ? (budget.actual / budget.totalAmount) * 100 : 0;
    return {
      ...budget,
      percent,
    };
  });

  const atRiskBudgets = budgetHealth.filter((budget: any) => budget.percent >= 80);

  const topSpendingAreas = Object.values(
    history.reduce((acc: Record<string, { name: string; total: number }>, item: any) => {
      const name = item.expenditureRequest?.department || item.expenditureRequest?.category || "Unclassified";
      acc[name] = acc[name] ?? { name, total: 0 };
      acc[name].total += Number(item.amount || 0);
      return acc;
    }, {})
  )
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
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
            Finance Command Center
            <Badge variant="outline" className="border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              Fiscal Pulse
            </Badge>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Spending oversight, budget risk monitoring, and finance actions in one workspace.
          </p>
        </div>

        <Card className="border-emerald-200/60 bg-linear-to-r from-emerald-50 to-teal-50 shadow-sm dark:border-emerald-900/40 dark:from-slate-900 dark:to-slate-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Priority Signal</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{atRiskBudgets.length} budget lines need attention</p>
              <p className="text-xs text-slate-500">Watch threshold pressure, voucher throughput, and pending approvals.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Spending"
          value={`RWF ${(overview?.totalSpentRWF || 0).toLocaleString()}`}
          icon={<Wallet className="text-blue-500" size={18} />}
          subtitle="Approved expenditure volume"
        />
        <StatsCard
          title="Pending Approvals"
          value={overview?.pendingApprovals || 0}
          icon={<Clock className="text-amber-500" size={18} />}
          subtitle="Claims awaiting finance action"
        />
        <StatsCard
          title="Monthly Comparison"
          value={`${monthlyDelta >= 0 ? "+" : ""}${monthlyDelta.toFixed(1)}%`}
          icon={<TrendingUp className="text-emerald-500" size={18} />}
          subtitle="Versus previous month"
        />
        <StatsCard
          title="Vouchers"
          value={vouchers.length}
          icon={<Receipt className="text-indigo-500" size={18} />}
          subtitle="Generated approval records"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="border-b border-border/30 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                    Spending Trend Snapshot
                  </CardTitle>
                  <CardDescription className="text-xs">Approved expenditure movement across recent months.</CardDescription>
                </div>
                <Link href="/finance/reports">
                  <span className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">Open full reports</span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex h-56 items-end gap-3">
                {monthlySeries.length ? (
                  monthlySeries.map((item: any) => {
                    const max = Math.max(...monthlySeries.map((entry: any) => entry.total), 1);
                    const height = (item.total / max) * 100;
                    return (
                      <div key={item.key} className="flex flex-1 flex-col items-center gap-3">
                        <div className="flex w-full flex-1 items-end rounded-2xl bg-slate-100 p-2 dark:bg-slate-800">
                          <div className="w-full rounded-xl bg-linear-to-t from-blue-600 to-cyan-400" style={{ height: `${height}%` }} />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{monthLabel(item.key)}</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-border/50 text-sm text-slate-500">
                    No approved expenditure trend data yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="border-b border-border/30 py-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  Budget Watchlist
                </CardTitle>
                <Link href="/finance/budgets">
                  <span className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">Manage budgets</span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {budgetHealth.slice(0, 5).map((budget: any) => (
                <div key={budget.id} className="space-y-2 rounded-xl border border-border/40 bg-slate-50/80 p-4 dark:bg-slate-950/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{budget.department?.name}</p>
                      <p className="text-xs text-slate-500">{budget.category || "General"}</p>
                    </div>
                    <Badge variant="outline" className={budget.percent >= 90 ? "border-rose-300 text-rose-600" : budget.percent >= 75 ? "border-amber-300 text-amber-600" : "border-emerald-300 text-emerald-600"}>
                      {budget.percent.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${budget.percent >= 90 ? "bg-rose-500" : budget.percent >= 75 ? "bg-amber-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(budget.percent, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Spent: {budget.actual.toLocaleString()} RWF</span>
                    <span>Remaining: {budget.remaining.toLocaleString()} RWF</span>
                  </div>
                </div>
              ))}
              {!budgetHealth.length && (
                <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                  No budget allocations have been configured yet.
                </div>
              )}
            </CardContent>
          </Card>

          <PendingApprovalsWidget />
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card className="rounded-2xl border-none bg-linear-to-br from-slate-800 to-slate-950 text-white shadow-lg shadow-slate-500/20">
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Finance Toolkit</CardTitle>
              <CardDescription className="text-xs text-slate-400">Operational shortcuts for control and compliance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Budget Management", path: "/finance/budgets", icon: <Wallet size={16} /> },
                { label: "Expenditure History", path: "/finance/history", icon: <FileText size={16} /> },
                { label: "Finance Reports", path: "/finance/reports", icon: <TrendingUp size={16} /> },
                { label: "Voucher Review", path: "/finance/history", icon: <Receipt size={16} /> },
              ].map((item) => (
                <Link key={item.path} href={item.path}>
                  <button className="group flex w-full items-center justify-between rounded-xl bg-white/10 p-3 text-sm font-medium transition-colors hover:bg-white/20">
                    <span className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </span>
                    <ArrowRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Risk Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {atRiskBudgets.slice(0, 3).map((budget: any) => (
                <div key={budget.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={14} />
                    <p className="text-xs font-bold uppercase tracking-widest">Budget Threshold</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{budget.department?.name} is at {budget.percent.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500">{budget.remaining.toLocaleString()} RWF remaining in {budget.category || "General"}.</p>
                </div>
              ))}
              {!atRiskBudgets.length && (
                <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                  No budget alerts. Current allocations are within healthy range.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Latest Vouchers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vouchers.slice(0, 4).map((voucher: any) => (
                <div key={voucher.id} className="rounded-xl border border-border/40 bg-slate-50/80 p-3 dark:bg-slate-950/30">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{voucher.voucherNumber}</p>
                  <p className="text-xs text-slate-500">
                    {voucher.request?.user?.name || "Unknown requester"} · {Number(voucher.amount).toLocaleString()} {voucher.currency}
                  </p>
                </div>
              ))}
              {!vouchers.length && (
                <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                  No vouchers have been generated yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-slate-900/60">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Top Spending Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topSpendingAreas.map((area: any) => (
                <div key={area.name} className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-50/80 p-3 dark:bg-slate-950/30">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{area.name}</p>
                  <p className="text-xs font-bold text-slate-500">RWF {area.total.toLocaleString()}</p>
                </div>
              ))}
              {!topSpendingAreas.length && (
                <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                  Spending categories will appear once approved expenditures exist.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

