import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/dateFormatter";
import { StatusBadge } from "@/components/StatusBadge";
import { ProfileCard } from "@/components/ProfileCard";
import { Loader2, FileText, Car, DollarSign, CheckCircle, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";

function RecentRequestsSection() {
  const { isAuthenticated } = useAuth();
  const { data: recentRequests, isLoading } = trpc.requests.getRecentRequests.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated, staleTime: 30000 } // Cache for 30 seconds
  );

  const getRequestIcon = (type: string) => {
    switch (type) {
      case "leave":
        return <FileText className="text-blue-400" size={20} />;
      case "car":
        return <Car className="text-purple-400" size={20} />;
      case "expenditure":
        return <DollarSign className="text-green-400" size={20} />;
      default:
        return null;
    }
  };

  const formatDate = useMemo(() => (date: Date) => {
    return formatDateTime(date);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Recent Requests</h2>
        <Link href="/requests">
          <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10">
            View All
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-accent" size={24} />
            </div>
          </CardContent>
        </Card>
      ) : !recentRequests || recentRequests.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No requests yet. Create your first request to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentRequests.map((request: any) => (
            <Link key={request.id} href={`/requests/${request.id}`}>
              <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer mb-2">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-muted rounded-lg">{getRequestIcon(request.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{request.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.type.charAt(0).toUpperCase() + request.type.slice(1)} • {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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

  // Show appropriate dashboard based on role
  if (user?.role === "admin") {
    return <AdminDashboard user={user} />;
  } else if (user?.role === "hr") {
    return <HRDashboard user={user} />;
  } else if (user?.role === "head_of_department") {
    return <DeptHeadDashboard user={user} />;
  } else if (user?.role === "head_of_finance") {
    return <HeadOfFinanceDashboard user={user} />;
  } else if (user?.role === "ceo_md") {
    return <CEODashboard user={user} />;
  } else {
    return <EmployeeDashboard user={user} />;
  }
}

function EmployeeDashboard({ user }: { user: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"leave" | "car" | "expenditure">("leave");

  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    staleTime: 10000, // Data considered stale after 10 seconds
    refetchInterval: 10000, // Auto-refetch every 10 seconds for real-time updates
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="max-w-2xl">
          <ProfileCard user={user} />
        </div>

        {/* Stats Cards */}
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

        {/* Quick Actions - Request Cards */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer h-full" onClick={() => {
              setDialogType("leave");
              setDialogOpen(true);
            }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Leave Request</CardTitle>
                    <CardDescription>Request annual, sick, or unpaid leave</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                  Create Request
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer h-full" onClick={() => {
              setDialogType("car");
              setDialogOpen(true);
            }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Car className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Car Request</CardTitle>
                    <CardDescription>Book a company vehicle</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
                  Create Request
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer h-full" onClick={() => {
              setDialogType("expenditure");
              setDialogOpen(true);
            }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="text-green-400" size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Expenditure Request</CardTitle>
                    <CardDescription>Request expense reimbursement</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                  Create Request
                </Button>
              </CardContent>
            </Card>
          </div>
          <CreateRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} initialRequestType={dialogType} />
        </div>

        {/* Recent Requests */}
        <RecentRequestsSection />
      </div>
    </DashboardLayout>
  );
}

// Admin Dashboard - System stats
function AdminDashboard({ user }: { user: any }) {
  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    staleTime: 10000, // Data considered stale after 10 seconds
    refetchInterval: 10000, // Auto-refetch every 10 seconds for real-time updates
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="max-w-2xl">
          <ProfileCard user={user} />
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : (stats as any)?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.totalRequests || 0}
              </div>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.approvedRequests || 0}
              </div>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.rejectedRequests || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/users">
              <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white">Manage Users</Button>
                </CardContent>
              </Card>
            </Link>
            <Link href="/requests">
              <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>All Requests</CardTitle>
                  <CardDescription>View and manage all system requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white">View Requests</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// HR Dashboard - Pending approvals from dept heads
function HRDashboard({ user }: { user: any }) {
  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    staleTime: 10000, // Data considered stale after 10 seconds
    refetchInterval: 10000, // Auto-refetch every 10 seconds for real-time updates
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="max-w-2xl">
          <ProfileCard user={user} />
        </div>

        {/* HR Stats - Pending only + Approved + Rejected */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.pendingRequests || 0}
              </div>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.approvedRequests || 0}
              </div>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.rejectedRequests || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HR Actions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Actions</h2>
          <Link href="/approvals">
            <Button className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white">View Pending Approvals</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Department Head Dashboard - Pending only + Approved + Rejected
function DeptHeadDashboard({ user }: { user: any }) {
  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    staleTime: 10000, // Data considered stale after 10 seconds
    refetchInterval: 10000, // Auto-refetch every 10 seconds for real-time updates
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="max-w-2xl">
          <ProfileCard user={user} />
        </div>

        {/* Dept Head Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.pendingRequests || 0}
              </div>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.approvedRequests || 0}
              </div>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.rejectedRequests || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dept Head Actions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Actions</h2>
          <Link href="/approvals">
            <Button className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white">View Pending Approvals</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Finance Dashboard - Head of Finance
function HeadOfFinanceDashboard({ user }: { user: any }) {
  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    staleTime: 10000, // Data considered stale after 10 seconds
    refetchInterval: 10000, // Auto-refetch every 10 seconds for real-time updates
  });
  const { data: expenditures, isLoading: expendLoading } = trpc.requests.getApprovedExpenditures.useQuery(undefined, {
    staleTime: 30000,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="max-w-2xl">
          <ProfileCard user={user} />
        </div>

        {/* Finance Stats */}
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

        {/* Approved Expenditures Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="text-green-500" size={24} />
              Approved Expenditures
            </CardTitle>
            <CardDescription>Total amount approved through the complete approval chain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xs font-semibold text-muted-foreground mb-2">RWF Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {expendLoading ? "-" : `${expenditures?.rwf || 0} RWF`}
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs font-semibold text-muted-foreground mb-2">USD Approved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {expendLoading ? "-" : `${expenditures?.usd || 0} USD`}
                </p>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <p className="text-xs font-semibold text-muted-foreground mb-2">EUR Approved</p>
                <p className="text-2xl font-bold text-purple-600">
                  {expendLoading ? "-" : `${expenditures?.eur || 0} EUR`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finance Actions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Actions</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <Link href="/approvals">
              <Button className="md:w-auto bg-sky-600 hover:bg-sky-700 text-white">View Pending Approvals</Button>
            </Link>
            <Link href="/expenditure-history">
              <Button variant="outline" className="md:w-auto">Expenditure History</Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// CEO/MD Dashboard - Pending only + Approved + Rejected
function CEODashboard({ user }: { user: any }) {
  const { data: stats, isLoading: statsLoading } = trpc.requests.getDashboardStats.useQuery(undefined, {
    staleTime: 10000, // Data considered stale after 10 seconds
    refetchInterval: 10000, // Auto-refetch every 10 seconds for real-time updates
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="max-w-2xl">
          <ProfileCard user={user} />
        </div>

        {/* CEO Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.pendingRequests || 0}
              </div>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.approvedRequests || 0}
              </div>
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
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "-" : stats?.rejectedRequests || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CEO Actions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Actions</h2>
          <Link href="/approvals">
            <Button className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white">View Pending Approvals</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
