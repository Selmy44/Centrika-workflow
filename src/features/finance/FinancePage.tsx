import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, DollarSign, History, ExternalLink, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";
import { StatsCard } from "@/components/shared/StatsCard";

export default function FinancePage() {
  const { user, isAuthenticated, hasRole } = useAuth();

  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: expenditures, isLoading: expendLoading } = trpc.requests.getApprovedExpenditures.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const hasAccess = useMemo(() => {
    return user && (hasRole("head_of_finance") || ["admin", "hr", "ceo_md"].includes(user.role));
  }, [user, hasRole]);

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You do not have permission to access the finance dashboard.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">Finance Overview</h1>
            <p className="text-muted-foreground mt-2">
              Monitor expenditures and track financial operations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <Link href="/approvals" className="w-full sm:w-auto">
              <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2 w-full">
                <ShieldCheck size={18} />
                Handle Approvals
              </Button>
            </Link>
            <Link href="/expenditure-history" className="w-full sm:w-auto">
              <Button variant="outline" className="flex items-center justify-center gap-2 w-full">
                <History size={18} />
                View History
              </Button>
            </Link>
          </div>
        </div>

        {/* Finance Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Requests" 
            value={stats?.totalRequests || 0} 
            loading={statsLoading}
            subtitle="All system requests"
          />
          <StatsCard 
            title="Pending" 
            value={stats?.pendingRequests || 0} 
            loading={statsLoading}
            subtitle="Awaiting approval"
            className="border-yellow-500/20"
          />
          <StatsCard 
            title="Approved" 
            value={stats?.approvedRequests || 0} 
            loading={statsLoading}
            subtitle="Successfully completed"
            className="border-green-500/20"
          />
          <StatsCard 
            title="Rejected" 
            value={stats?.rejectedRequests || 0} 
            loading={statsLoading}
            subtitle="Declined requests"
            className="border-red-500/20"
          />
        </div>

        {/* Approved Expenditure Summary */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="text-green-500" size={24} />
              Total Approved Expenditures
            </CardTitle>
            <CardDescription>Real-time tracking of all approved expenditure amounts by currency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="p-6 bg-green-500/5 rounded-xl border border-green-500/10 hover:border-green-500/30 transition-all">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 tracking-wider">RWF APPROVED</p>
                  <p className="text-3xl font-bold text-green-600">
                    {expendLoading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      `${(expenditures?.rwf || 0).toLocaleString()} RWF`
                    )}
                  </p>
                </div>
                <div className="p-6 bg-blue-500/5 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 tracking-wider">USD APPROVED</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {expendLoading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      `${(expenditures?.usd || 0).toLocaleString()} USD`
                    )}
                  </p>
                </div>
                <div className="p-6 bg-purple-500/5 rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-all">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 tracking-wider">EUR APPROVED</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {expendLoading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      `${(expenditures?.eur || 0).toLocaleString()} EUR`
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg italic">
                <p>
                  Note: These totals reflect every expenditure request that has successfully passed the final stage of the approval chain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Callouts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Need to approve requests?</CardTitle>
              <CardDescription>
                All pending approvals (Leave, Car, & Expenditure) are now managed in a single unified view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/approvals">
                <Button className="w-full gap-2">
                  Go to Approvals
                  <ExternalLink size={16} />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Financial History</CardTitle>
              <CardDescription>
                Review past expenditures and generated vouchers for your department or the company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/expenditure-history">
                <Button variant="outline" className="w-full gap-2">
                  View History
                  <History size={16} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
