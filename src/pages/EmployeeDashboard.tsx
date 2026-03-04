import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/dateFormatter";
import { StatusBadge } from "@/components/StatusBadge";
import { Loader2, FileText, Car, DollarSign, ArrowLeft, Calendar, Mail, Building2, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";

export default function EmployeeDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Get employeeId from URL query params
  const queryParams = new URLSearchParams(window.location.search);
  const employeeId = queryParams.get("id");

  const { data: employeeData, isLoading } = trpc.requests.getEmployeeProfile.useQuery(
    { employeeId: employeeId || "" },
    { enabled: !!employeeId && isAuthenticated }
  );

  if (!isAuthenticated) {
    return null;
  }

  if (!employeeId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Employee Not Found</CardTitle>
              <CardDescription>No employee ID provided</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/admin-users")}>Back to Employees</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  if (!employeeData?.employee) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Employee Not Found</CardTitle>
              <CardDescription>The requested employee could not be found</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/admin-users")}>Back to Employees</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const employee = employeeData.employee;
  const employeeRequests = employeeData.requests || [];

  const stats = useMemo(() => {
    return {
      total: employeeRequests.length,
      pending: employeeRequests.filter((r: any) => r.status === "pending").length,
      approved: employeeRequests.filter((r: any) => r.status === "approved").length,
      rejected: employeeRequests.filter((r: any) => r.status === "rejected").length,
    };
  }, [employeeRequests]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => setLocation("/admin-users")} className="mb-4">
          <ArrowLeft size={18} className="mr-2" />
          Back to Employees
        </Button>

        {/* Employee Profile Card */}
        <Card className="bg-gradient-to-r from-slate-500 to-slate-600 border-slate-500 overflow-hidden text-white">
          <CardContent className="p-0">
            <div className="flex items-center gap-8 p-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <Avatar className="h-28 w-28 border-4 border-white/30">
                  <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
                  <AvatarFallback className="bg-slate-400 text-2xl font-bold">
                    {employee.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{employee.name}</h1>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-50">{employee.position || "Position not set"}</p>
                  <p className="text-slate-200">{employee.department || "Department not set"}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-slate-300">
                    <Mail size={16} />
                    {employee.email}
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex-shrink-0">
                <Badge className="bg-white/20 text-white border border-white/40 px-4 py-2 text-sm font-semibold">
                  {employee.role === "head_of_department" ? "Head of Department" : "User"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 size={16} />
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">{employee.department || "Not set"}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users size={16} />
                Staff ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">{employee.staffId || "Not set"}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar size={16} />
                Date of Employment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">
                {employee.dateOfEmployment ? new Date(employee.dateOfEmployment).toLocaleDateString() : "Not set"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users size={16} />
                Head of Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">{employee.manager?.name || "Not assigned"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Request Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* All Requests */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              All Requests
            </CardTitle>
            <CardDescription>Complete history of employee requests</CardDescription>
          </CardHeader>
          <CardContent>
            {employeeRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto text-muted-foreground mb-2" size={32} />
                <p className="text-muted-foreground">No requests found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {employeeRequests.map((request: any) => (
                  <Card key={request.id} className="bg-muted border-border hover:border-accent transition-colors">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 bg-card rounded-lg">{getRequestIcon(request.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{request.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.type.charAt(0).toUpperCase() + request.type.slice(1)} • {formatDateTime(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
