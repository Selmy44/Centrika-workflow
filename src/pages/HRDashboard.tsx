import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, Search, Eye, Calendar, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function HRDashboard() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const { data: employees = [], isLoading: employeesLoading } = trpc.requests.getAllEmployees.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "hr" || user?.role === "admin" || user?.role === "ceo_md"),
  });

  const { data: employeeLeaveData, isLoading: leaveDataLoading } = trpc.requests.getEmployeeLeaveData.useQuery(
    { employeeId: selectedEmployee?.id },
    {
      enabled: isAuthenticated && !!selectedEmployee && (user?.role === "hr" || user?.role === "admin" || user?.role === "ceo_md"),
    }
  );

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(
      (emp: any) =>
        emp?.name?.toLowerCase?.().includes(query) ||
        emp?.email?.toLowerCase?.().includes(query) ||
        emp?.department?.toLowerCase?.().includes(query)
    );
  }, [employees, searchQuery]);

  if (!isAuthenticated) {
    return null;
  }

  // Only HR, Admin, and CEO can access this
  if (user?.role !== "hr" && user?.role !== "admin" && user?.role !== "ceo_md") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>Only HR and administrators can access employee leave statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Please contact your administrator if you believe this is an error.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Employee Leave Management</h1>
          <p className="text-gray-400">View and manage employee leave balances and requests</p>
        </div>

        {/* Search Bar */}
        <Card className="border-blue-500/30 bg-blue-950/20">
          <CardHeader className="pb-3">
            <div className="flex gap-3 items-center">
              <Search className="text-blue-400" size={20} />
              <Input
                placeholder="Search employees by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-blue-900/40 border-blue-500/30 text-white placeholder:text-gray-500"
              />
              <Users size={20} className="text-blue-400" />
            </div>
          </CardHeader>
        </Card>

        {/* Employees List */}
        <Card className="border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Employees ({filteredEmployees.length})
            </CardTitle>
            <CardDescription>Click on an employee to view their leave balance and recent requests</CardDescription>
          </CardHeader>
          <CardContent>
            {employeesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-400 mr-2" />
                <span className="text-gray-400">Loading employees...</span>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-500 mb-2" size={32} />
                <p className="text-gray-400">No employees found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredEmployees.map((employee: any) => (
                  <button
                    key={employee?.id}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setShowEmployeeModal(true);
                    }}
                    className="w-full text-left p-4 rounded border border-gray-700 hover:border-blue-500 hover:bg-blue-950/20 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{employee?.name}</h3>
                        <p className="text-sm text-gray-400">{employee?.email}</p>
                        <p className="text-xs text-gray-500">{employee?.department || "No department"}</p>
                      </div>
                      <Eye className="text-blue-400" size={18} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Details Modal */}
      <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={20} />
              {selectedEmployee?.name} - Leave Details
            </DialogTitle>
            <DialogDescription>
              {selectedEmployee?.email} | {selectedEmployee?.department || "No department"}
            </DialogDescription>
          </DialogHeader>

          {leaveDataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-blue-400 mr-2" />
              <span>Loading leave data...</span>
            </div>
          ) : employeeLeaveData ? (
            <div className="space-y-6">
              {/* Leave Balance Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-blue-400" />
                  Leave Balance (Current Year)
                </h3>

                {employeeLeaveData.leaveBalance ? (
                  <div className="grid grid-cols-5 gap-3">
                    <Card className="bg-blue-950/40 border-blue-500/30">
                      <CardContent className="pt-4">
                        <p className="text-xs text-gray-400 mb-1">Annual Entitled</p>
                        <p className="text-2xl font-bold text-blue-300">{employeeLeaveData.leaveBalance?.annualLeaveEntitled || 18} days</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-cyan-950/40 border-cyan-500/30">
                      <CardContent className="pt-4">
                        <p className="text-xs text-gray-400 mb-1">Carryover</p>
                        <p className="text-2xl font-bold text-cyan-300">{employeeLeaveData.leaveBalance?.annualLeaveCarryover || 0} days</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-950/40 border-orange-500/30">
                      <CardContent className="pt-4">
                        <p className="text-xs text-gray-400 mb-1">Already Taken</p>
                        <p className="text-2xl font-bold text-orange-300">{employeeLeaveData.leaveBalance?.annualLeaveTaken || 0} days</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-950/40 border-green-500/30">
                      <CardContent className="pt-4">
                        <p className="text-xs text-gray-400 mb-1">Remaining</p>
                        <p className="text-2xl font-bold text-green-300">{employeeLeaveData.leaveBalance?.annualLeaveRemaining || 18} days</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-950/40 border-purple-500/30">
                      <CardContent className="pt-4">
                        <p className="text-xs text-gray-400 mb-1">Year</p>
                        <p className="text-2xl font-bold text-purple-300">{employeeLeaveData.leaveBalance?.year || new Date().getFullYear()}</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="p-4 rounded border border-yellow-500/30 bg-yellow-950/20 flex gap-2">
                    <AlertCircle className="text-yellow-400" size={18} />
                    <p className="text-sm text-yellow-300">No leave balance set up for this year</p>
                  </div>
                )}
              </div>

              {/* Recent Leave Requests */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-blue-400" />
                  Recent Leave Requests
                </h3>

                {employeeLeaveData.leaveRequests && employeeLeaveData.leaveRequests.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {employeeLeaveData.leaveRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="p-3 rounded border border-gray-700 bg-gray-900/40 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{req.title}</h4>
                            <p className="text-xs text-gray-400">
                              {req.details?.startDate} to {req.details?.endDate}
                            </p>
                          </div>
                          <Badge
                            className={
                              req.status === "approved"
                                ? "bg-green-500/20 text-green-400"
                                : req.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : req.status === "rejected"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-gray-500/20 text-gray-400"
                            }
                          >
                            {req.status}
                          </Badge>
                        </div>

                        {req.details && (
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                            <div>
                              <p>Entitled: <span className="text-white">{req.details.leaveDaysEntitled} days</span></p>
                            </div>
                            <div>
                              <p>Taken: <span className="text-white">{req.details.leaveDaysTaken} days</span></p>
                            </div>
                            <div>
                              <p>Remaining: <span className="text-white font-semibold">{req.details.leaveDaysRemaining} days</span></p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded border border-gray-700 text-center text-gray-400">
                    No leave requests yet
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 rounded border border-blue-500/30 bg-blue-950/20">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <AlertCircle size={16} className="text-blue-400" />
                  Summary
                </h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>
                    • Total Leave Requests: <span className="text-white font-semibold">{employeeLeaveData.leaveRequests?.length || 0}</span>
                  </li>
                  <li>
                    • Approved: <span className="text-green-400 font-semibold">{employeeLeaveData.leaveRequests?.filter((r: any) => r.status === "approved").length || 0}</span>
                  </li>
                  <li>
                    • Pending: <span className="text-yellow-400 font-semibold">{employeeLeaveData.leaveRequests?.filter((r: any) => r.status === "pending").length || 0}</span>
                  </li>
                  <li>
                    • Rejected: <span className="text-red-400 font-semibold">{employeeLeaveData.leaveRequests?.filter((r: any) => r.status === "rejected").length || 0}</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No leave data available</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowEmployeeModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
