import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, Car, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Centrika Employee Portal</CardTitle>
            <CardDescription>Please log in to access your requests</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This portal allows you to manage leave, car, and expenditure requests.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name || "Employee"}!</h1>
          <p className="text-muted-foreground mt-2">Manage your requests and track approvals</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{statsLoading ? "-" : stats?.totalRequests || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{statsLoading ? "-" : stats?.pendingRequests || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{statsLoading ? "-" : stats?.approvedRequests || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{statsLoading ? "-" : stats?.rejectedRequests || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/requests/leave">
              <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <FileText className="text-accent" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Leave Request</CardTitle>
                      <CardDescription>Request annual, sick, or personal leave</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent/10">
                    Create Request
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/requests/car">
              <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Car className="text-accent" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Car Request</CardTitle>
                      <CardDescription>Book a company vehicle</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent/10">
                    Create Request
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/requests/expenditure">
              <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <DollarSign className="text-accent" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Expenditure Request</CardTitle>
                      <CardDescription>Request expense reimbursement</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent/10">
                    Create Request
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Requests</h2>
            <Link href="/requests">
              <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10">
                View All
              </Button>
            </Link>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">No requests yet. Create your first request to get started!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
