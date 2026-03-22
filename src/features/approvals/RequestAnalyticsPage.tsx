import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart3, FileText, TrendingUp, Loader2 } from "lucide-react";

export default function RequestAnalytics() {
  const { user, isAuthenticated } = useAuth();

  const { data: analyticsData, isLoading } = trpc.requests.getDepartmentAnalytics.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#3b6dae] dark:text-[#c79d2d]">Request Analytics</h1>
          <p className="text-muted-foreground mt-2">Detailed analysis of request submissions and trends</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : analyticsData?.totalRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">All-time submissions</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Approved Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : `${Math.round(((analyticsData?.approvedCount || 0) / (analyticsData?.totalRequests || 1)) * 100) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Success rate</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Avg Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : `${analyticsData?.avgProcessingTime || 0} hrs`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Average approval time</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : analyticsData?.monthlyRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Current month</p>
            </CardContent>
          </Card>
        </div>

        {/* Request Type Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Request Type Breakdown
            </CardTitle>
            <CardDescription>Distribution of requests by type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Leave Requests</span>
                    <Badge variant="outline">{analyticsData?.leaveCount || 0}</Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${Math.round(((analyticsData?.leaveCount || 0) / (analyticsData?.totalRequests || 1)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Car Requests</span>
                    <Badge variant="outline">{analyticsData?.carCount || 0}</Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${Math.round(((analyticsData?.carCount || 0) / (analyticsData?.totalRequests || 1)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Expenditure Requests</span>
                    <Badge variant="outline">{analyticsData?.expenditureCount || 0}</Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${Math.round(((analyticsData?.expenditureCount || 0) / (analyticsData?.totalRequests || 1)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>Overview of request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-3xl font-bold text-green-500">{analyticsData?.approvedCount || 0}</p>
                  <p className="text-sm text-muted-foreground mt-2">Approved</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                  <p className="text-3xl font-bold text-red-500">{analyticsData?.rejectedCount || 0}</p>
                  <p className="text-sm text-muted-foreground mt-2">Rejected</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <p className="text-3xl font-bold text-yellow-500">{analyticsData?.pendingCount || 0}</p>
                  <p className="text-sm text-muted-foreground mt-2">Pending</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
