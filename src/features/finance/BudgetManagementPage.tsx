import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, PieChart, Plus, ArrowUpRight, TrendingDown, Building2, AlertTriangle, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BudgetManagementPage = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const utils = trpc.useContext();
  const { data: budgets = [], isLoading: budgetsLoading } = trpc.finance.getBudgetStatus.useQuery({
    year: selectedYear,
  });

  const { data: departments = [] } = trpc.employees.getDepartments.useQuery();

  const setBudgetMutation = trpc.finance.setBudget.useMutation({
    onSuccess: () => {
      toast.success("Budget updated successfully");
      setIsModalOpen(false);
      utils.finance.getBudgetStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update budget");
    },
  });

  const handleSetBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const departmentId = parseInt(formData.get("departmentId") as string, 10);
    const amount = parseFloat(formData.get("amount") as string);
    const category = formData.get("category") as string;

    setBudgetMutation.mutate({
      departmentId,
      year: selectedYear,
      totalAmount: amount,
      category,
    });
  };

  const totalAllocated = budgets.reduce((acc: number, b: any) => acc + Number(b.totalAmount || 0), 0);
  const totalCommitted = budgets.reduce((acc: number, b: any) => acc + Number(b.committed || 0), 0);
  const totalUsed = budgets.reduce((acc: number, b: any) => acc + Number(b.actual || 0), 0);
  const remainingBalance = totalAllocated - totalUsed;
  const utilizationRate = totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;
  const atRiskBudgets = budgets.filter((b: any) => Number(b.totalAmount) > 0 && (Number(b.actual) / Number(b.totalAmount)) * 100 >= 80);

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Budget Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Allocate departmental budgets, monitor utilization, and surface overspend risk early.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select aria-label="Select fiscal year" className="rounded-xl border border-border/50 bg-white px-3 py-1.5 text-sm font-bold shadow-sm dark:bg-slate-900"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>{year} Fiscal Year</option>
              ))}
            </select>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-blue-600 shadow-md hover:bg-blue-700">
                  <Plus size={18} className="mr-2" /> New Allocation
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">Set Department Budget</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSetBudget} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Department</label>
                    <select aria-label="Department" name="departmentId" className="w-full rounded-xl border border-border/50 bg-slate-50 p-3 text-sm" required>
                      {departments.map((dept: any) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Total Budget (RWF)</label>
                    <Input name="amount" type="number" placeholder="Enter amount" className="rounded-xl p-6" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                    <Input name="category" placeholder="e.g. Operations, Capex" className="rounded-xl p-6" />
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl bg-blue-600 hover:bg-blue-700" disabled={setBudgetMutation.isPending}>
                    {setBudgetMutation.isPending ? "Saving..." : "Save Budget Allocation"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="overflow-hidden rounded-2xl border-border/50 bg-linear-to-br from-white to-blue-50/30 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Allocated</p>
                  <p className="text-2xl font-black text-slate-800">RWF {totalAllocated.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                <ArrowUpRight size={14} /> Budget base for fiscal oversight
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/50 bg-linear-to-br from-white to-amber-50/30 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actual Spend</p>
                  <p className="text-2xl font-black text-slate-800">RWF {totalUsed.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(utilizationRate, 100)}%` }} />
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{utilizationRate.toFixed(1)}% utilization</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/50 bg-linear-to-br from-white to-indigo-50/30 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Wallet size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Committed</p>
                  <p className="text-2xl font-black text-slate-800">RWF {totalCommitted.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Reserved against approved or planned usage</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/50 bg-linear-to-br from-white to-emerald-50/30 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <PieChart size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remaining Balance</p>
                  <p className="text-2xl font-black text-slate-800">RWF {remainingBalance.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                <ShieldCheck size={14} /> {(atRiskBudgets.length || 0) === 0 ? "Healthy budget posture" : `${atRiskBudgets.length} lines under pressure`}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="rounded-2xl border-border/50 shadow-sm xl:col-span-2">
            <CardHeader className="border-b border-border/30 bg-white px-6 py-4 dark:bg-slate-900">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Departmental Breakdown</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Department</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Budgeted</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Committed</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actual</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {budgetsLoading ? (
                    [1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-6 py-8 animate-pulse">
                          <div className="h-4 w-full rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : budgets.length ? (
                    budgets.map((budget: any) => {
                      const percent = Number(budget.totalAmount) > 0 ? (Number(budget.actual) / Number(budget.totalAmount)) * 100 : 0;
                      return (
                        <tr key={budget.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                                <Building2 size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{budget.department?.name}</p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400">{percent.toFixed(1)}% utilized</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                              {budget.category || "General"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-800 dark:text-white">{Number(budget.totalAmount).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-blue-500">{Number(budget.committed).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-sm font-black text-slate-800 dark:text-white">{Number(budget.actual).toLocaleString()}</td>
                          <td className={`px-6 py-4 text-right text-sm font-black ${Number(budget.remaining) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {Number(budget.remaining).toLocaleString()}
                            {Number(budget.remaining) < 0 ? <TrendingDown size={14} className="ml-1 inline" /> : <TrendingUp size={14} className="ml-1 inline" />}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm italic text-slate-500">
                        No budget records found for this fiscal year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Pressure Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {atRiskBudgets.slice(0, 4).map((budget: any) => {
                  const percent = Number(budget.totalAmount) > 0 ? (Number(budget.actual) / Number(budget.totalAmount)) * 100 : 0;
                  return (
                    <div key={budget.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-amber-600">
                        <AlertTriangle size={14} />
                        <p className="text-xs font-bold uppercase tracking-widest">Threshold Alert</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{budget.department?.name}</p>
                      <p className="text-xs text-slate-500">{budget.category || "General"} is at {percent.toFixed(1)}% utilization.</p>
                    </div>
                  );
                })}
                {!atRiskBudgets.length && (
                  <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">
                    No budgets are near the threshold right now.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Budget Guidance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Use department and category allocations to separate operational spend from strategic investment.</p>
                <p>Review any line above 80% utilization before approving new claims in that area.</p>
                <p>Keep committed versus actual spend close to avoid hidden budget pressure.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BudgetManagementPage;

