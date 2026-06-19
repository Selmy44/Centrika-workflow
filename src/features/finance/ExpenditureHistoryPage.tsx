import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/dateFormatter";
import { Loader2, DollarSign, User, Building2, Tag, Calendar, Search, Receipt, TrendingUp, ShieldCheck, FileText, CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ExpenditureHistoryPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedDept, setSelectedDept] = useState("all");

  const utils = trpc.useContext();
  const { data: expenditures = [], isLoading } = (trpc as any).requests.getExpenditureHistory.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: vouchers = [], isLoading: vouchersLoading } = trpc.finance.listVouchers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: departments = [] } = trpc.employees.getDepartments.useQuery();

  const generateVoucherMutation = trpc.finance.generateVoucher.useMutation({
    onSuccess: () => {
      toast.success("Voucher generated successfully");
      utils.finance.listVouchers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate voucher");
    },
  });

  const hasAccess = useMemo(() => user && ["head_of_finance", "admin", "hr", "ceo_md"].includes(user.role), [user]);

  const filteredExpenditures = useMemo(() => {
    return expenditures.filter((exp: any) => {
      const date = new Date(exp.createdAt);
      const department = exp.expenditureRequest?.department || "Unassigned";
      const category = exp.expenditureRequest?.category || "General";

      const yearMatch = date.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === "all" || date.getMonth() === selectedMonth;
      const deptMatch = selectedDept === "all" || department === selectedDept;
      const searchMatch =
        !searchTerm ||
        exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      return yearMatch && monthMatch && deptMatch && searchMatch;
    });
  }, [expenditures, searchTerm, selectedYear, selectedMonth, selectedDept]);

  const totals = useMemo(
    () =>
      filteredExpenditures.reduce(
        (acc: { rwf: number; usd: number; eur: number }, exp: any) => {
          if (exp.currency === "RWF") acc.rwf += Number(exp.amount || 0);
          else if (exp.currency === "USD") acc.usd += Number(exp.amount || 0);
          else if (exp.currency === "EUR") acc.eur += Number(exp.amount || 0);
          return acc;
        },
        { rwf: 0, usd: 0, eur: 0 }
      ),
    [filteredExpenditures]
  );

  const topCategories = useMemo(
    () =>
      Object.values(
        filteredExpenditures.reduce((acc: Record<string, { name: string; total: number }>, exp: any) => {
          const name = exp.expenditureRequest?.category || "General";
          acc[name] = acc[name] ?? { name, total: 0 };
          acc[name].total += Number(exp.amount || 0);
          return acc;
        }, {})
      )
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5),
    [filteredExpenditures]
  );

  const voucherCoverage = filteredExpenditures.length
    ? (filteredExpenditures.filter((exp: any) => vouchers.some((voucher: any) => voucher.requestId === exp.id)).length / filteredExpenditures.length) * 100
    : 0;

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You do not have permission to view expenditure history.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">Expenditure History</h1>
            <p className="mt-2 text-muted-foreground">Audit approved expenses, generate vouchers, and monitor where spending is concentrated.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Approved Records</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{isLoading ? "-" : filteredExpenditures.length}</p>
              <p className="mt-1 text-xs text-slate-500">Filtered expenditure items</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total RWF</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{isLoading ? "-" : `${totals.rwf.toLocaleString()} RWF`}</p>
              <p className="mt-1 text-xs text-slate-500">Primary local currency spend</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Voucher Coverage</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{voucherCoverage.toFixed(0)}%</p>
              <p className="mt-1 text-xs text-slate-500">Filtered records with vouchers generated</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Foreign Currency</p>
              <p className="mt-2 text-sm font-black text-blue-600">{isLoading ? "-" : `${totals.usd.toLocaleString()} USD`}</p>
              <p className="mt-1 text-sm font-black text-purple-600">{isLoading ? "-" : `${totals.eur.toLocaleString()} EUR`}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-white/50 p-4 dark:bg-slate-900/50 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Filter by year" className="rounded-lg border border-border/50 bg-transparent px-2 py-1 text-xs font-bold" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select aria-label="Filter by month" className="rounded-lg border border-border/50 bg-transparent px-2 py-1 text-xs font-bold" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}>
              <option value="all">All Months</option>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>

            <select aria-label="Filter by department" className="rounded-lg border border-border/50 bg-transparent px-2 py-1 text-xs font-bold" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              <option value="all">All Departments</option>
              {departments.map((department: any) => (
                <option key={department.id} value={department.name}>{department.name}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full lg:w-64">
            <Input placeholder="Search title, requester, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 w-full rounded-xl border-border/50 pl-9 text-xs" />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Tabs defaultValue="history" className="space-y-6">
              <TabsList className="w-fit rounded-xl border border-border/30 bg-slate-100 p-1 dark:bg-slate-800/50">
                <TabsTrigger value="history" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">Expenditure Logs</TabsTrigger>
                <TabsTrigger value="vouchers" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">Generated Vouchers</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4">
                {isLoading ? (
                  <Card className="border-border"><CardContent className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></CardContent></Card>
                ) : filteredExpenditures.length === 0 ? (
                  <Card className="border-border"><CardContent className="pt-6"><p className="py-8 text-center text-muted-foreground">{searchTerm ? "No expenditure requests match your search." : "No approved expenditure requests found."}</p></CardContent></Card>
                ) : (
                  filteredExpenditures.map((expenditure: any) => {
                    const hasVoucher = vouchers.some((voucher: any) => voucher.requestId === expenditure.id);
                    const department = expenditure.expenditureRequest?.department || "Unassigned";
                    const category = expenditure.expenditureRequest?.category || "General";
                    return (
                      <Card key={expenditure.id} className="border-border shadow-xs transition-all hover:border-blue-500/30 group">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 flex-1 items-start gap-4">
                                <div className="rounded-2xl bg-emerald-500/10 p-3 transition-colors group-hover:bg-emerald-500/20">
                                  <DollarSign className="text-emerald-600" size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">{expenditure.title}</h3>
                                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{expenditure.description || "No description provided."}</p>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-xl font-black text-emerald-600">{Number(expenditure.amount).toLocaleString()} {expenditure.currency}</p>
                                <Badge className="mt-2 border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Approved</Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 border-t border-border/30 pt-4 lg:grid-cols-4">
                              <MetaItem icon={<User size={14} className="text-slate-400" />} label="Requester" value={expenditure.requester?.name || "Unknown"} />
                              <MetaItem icon={<Building2 size={14} className="text-slate-400" />} label="Department" value={department} />
                              <MetaItem icon={<Tag size={14} className="text-slate-400" />} label="Category" value={category} />
                              <MetaItem icon={<Calendar size={14} className="text-slate-400" />} label="Approved Date" value={formatDateTime(expenditure.updatedAt)} />
                            </div>

                            <div className="flex items-center justify-end border-t border-border/30 pt-4">
                              {hasVoucher ? (
                                <Badge variant="outline" className="border-blue-200 bg-blue-50/50 text-[10px] font-black uppercase text-blue-600">
                                  <CheckCircle size={10} className="mr-1" /> Voucher Ready
                                </Badge>
                              ) : (
                                <Button size="sm" variant="outline" className="h-8 rounded-lg border-blue-200 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50" onClick={() => generateVoucherMutation.mutate({ requestId: expenditure.id })} disabled={generateVoucherMutation.isPending}>
                                  <FileText size={12} className="mr-1" /> Generate Voucher
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="vouchers" className="space-y-4">
                {vouchersLoading ? (
                  <Card className="border-border"><CardContent className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></CardContent></Card>
                ) : vouchers.length ? (
                  vouchers.map((voucher: any) => (
                    <Card key={voucher.id} className="overflow-hidden border-border/50 shadow-sm group bg-white/50 dark:bg-slate-900">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between border-b border-border/30 bg-slate-50 p-4 dark:bg-slate-800/50">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                              <Receipt size={16} />
                            </div>
                            <span className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">{voucher.voucherNumber}</span>
                          </div>
                          <Badge className="border-blue-500/20 bg-blue-500/10 text-[10px] font-bold uppercase tracking-widest text-blue-600">{voucher.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Request Reference</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{voucher.request.title}</p>
                            <p className="text-xs text-slate-500">{voucher.request.user?.name || "Unknown requester"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-800 dark:text-white">{Number(voucher.amount).toLocaleString()} {voucher.currency}</p>
                            <p className="text-[10px] italic text-slate-400">Prepared on {formatDateTime(voucher.createdAt)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 text-center text-sm italic text-slate-500">No vouchers generated yet.</div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Top Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCategories.length ? (
                  topCategories.map((category: any) => (
                    <div key={category.name} className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-50/80 p-3 dark:bg-slate-950/30">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{category.name}</p>
                      <p className="text-xs font-bold text-slate-500">RWF {category.total.toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-slate-500">No category trends yet.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Audit Guidance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <ShieldCheck size={14} />
                    <p className="text-xs font-bold uppercase tracking-widest">Voucher Control</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Maintain strong voucher coverage so approved spend always has a finance trail.</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-emerald-600">
                    <TrendingUp size={14} />
                    <p className="text-xs font-bold uppercase tracking-widest">Trend Watch</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Use department and category filters together to isolate unusual spikes faster.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{value}</p>
      </div>
    </div>
  );
}


