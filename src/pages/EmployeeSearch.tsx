import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EmployeeSearch() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const allowedRoles = ["admin", "hr", "head_of_department", "ceo_md"];
  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const { data: employees, isLoading: isLoadingEmployees } = trpc.employees.list.useQuery(
    {
      search: searchQuery,
      department: selectedDepartment,
      role: selectedRole,
    },
    { enabled: !!user }
  );

  const { data: departments } = trpc.employees.getDepartments.useQuery(
    {},
    { enabled: !!user }
  );

  const { data: employeeDetail, isLoading: isLoadingDetail } = trpc.employees.getDetail.useQuery(
    { employeeId: selectedEmployee?.id || 0 },
    { enabled: showDetailModal && !!selectedEmployee }
  );

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Employee Directory</h1>
          <p className="text-gray-600">Search and view employee information</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Department Filter */}
            <Select value={selectedDepartment || ""} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments?.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={selectedRole || ""} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="head_of_department">Head of Department</SelectItem>
                <SelectItem value="ceo_md">CEO/MD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Employees List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoadingEmployees ? (
            <div className="p-8 text-center text-gray-500">Loading employees...</div>
          ) : employees && employees.length > 0 ? (
            <div className="divide-y">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {employee.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                      <div className="flex gap-4 mt-1">
                        {employee.position && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {employee.position}
                          </span>
                        )}
                        {employee.department && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {employee.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No employees found</div>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : employeeDetail ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xl">
                  {employeeDetail.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{employeeDetail.name}</h2>
                  <p className="text-gray-600">{employeeDetail.position}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Email</p>
                  <p className="text-gray-900">{employeeDetail.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Staff ID</p>
                  <p className="text-gray-900">{employeeDetail.staffId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Department</p>
                  <p className="text-gray-900">{employeeDetail.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Role</p>
                  <p className="text-gray-900">{employeeDetail.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Date of Employment</p>
                  <p className="text-gray-900">{employeeDetail.dateOfEmployment}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Requests</p>
                  <p className="text-gray-900">{employeeDetail.requestsCount}</p>
                </div>
              </div>

              {/* Leave History */}
              {employeeDetail.leaveHistory && employeeDetail.leaveHistory.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Leave History</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {employeeDetail.leaveHistory.map((leave: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-gray-900">{leave.leaveType}</span>
                          <span className="text-gray-600">{leave.leaveDaysRequested} days</span>
                        </div>
                        <p className="text-gray-600">
                          {leave.startDate} to {leave.endDate}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => setShowDetailModal(false)} className="w-full">
                Close
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
