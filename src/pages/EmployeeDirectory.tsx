import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Users, Mail, Phone, MapPin, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmployeeDirectory() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: employees = [], isLoading: isLoadingEmployees } = trpc.employees.list.useQuery({
    search: searchTerm,
    departmentId: selectedDeptId || undefined,
  }, { enabled: !!user });

  const { data: departments = [], isLoading: isLoadingDepts } = trpc.employees.getDepartments.useQuery(undefined, { enabled: !!user });

  const { data: employeeDetail, isLoading: isLoadingDetail } = trpc.employees.getDetail.useQuery(
    { employeeId: selectedEmployee?.id || 0 },
    { enabled: showDetailModal && !!selectedEmployee }
  );

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const getDeptColor = (dept?: string | null) => {
    if (!dept) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    
    const colors: Record<string, string> = {
      Engineering: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Human Resources": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      Finance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Sales & Marketing": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Operations: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };

    if (colors[dept]) return colors[dept];

    const fallbackColors = [
      "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    ];
    
    const hash = dept.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return fallbackColors[hash % fallbackColors.length];
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Employee Directory
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Contact information and details for all company employees
            </p>
          </div>
          {(isLoadingEmployees || isLoadingDepts) && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or staff ID..."
              className="pl-10 bg-white dark:bg-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedDeptId === null ? "default" : "outline"}
              onClick={() => setSelectedDeptId(null)}
              size="sm"
            >
              All Departments
            </Button>
            {departments.map((dept: any) => (
              <Button
                key={dept.id}
                variant={selectedDeptId === dept.id ? "default" : "outline"}
                onClick={() => setSelectedDeptId(dept.id)}
                size="sm"
              >
                {dept.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {employees.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                in directory
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {employees.filter((e: any) => e.status === "Active" || !e.status).length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                available for work
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {departments.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                teams
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee: any) => (
            <Card
              key={employee.id}
              className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow hover:-translate-y-1 duration-200"
            >
              <CardContent className="p-6">
                {/* Header with status */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {employee.position || employee.role}
                    </p>
                  </div>
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status || "Active"}
                  </Badge>
                </div>

                {/* Department Badge */}
                <Badge className={`${getDeptColor(employee.department)} mb-4`}>
                  {employee.department || "No Department"}
                </Badge>

                {/* Contact Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${employee.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {employee.email}
                    </a>
                  </div>
                  {employee.phoneNumber && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a
                        href={`tel:${employee.phoneNumber}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {employee.phoneNumber}
                      </a>
                    </div>
                  )}
                  {employee.location && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {employee.location}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => handleEmployeeClick(employee)}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {!isLoadingEmployees && employees.length === 0 && (
          <Card className="bg-gray-50 dark:bg-slate-900 border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No employees found
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}

        {/* Archive Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">Directory Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Search Tips:</strong> You can search by employee name, email, or staff ID.
            </p>
            <p>
              <strong>Status Indicators:</strong> Green (Active), Yellow (On Leave), Gray (Inactive)
            </p>
            <p>
              <strong>Privacy:</strong> Contact details are for internal business use only.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-none shadow-2xl">
          <DialogHeader className="border-b border-gray-100 dark:border-slate-800 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Employee Profile
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-500 animate-pulse">Fetching profile details...</p>
            </div>
          ) : employeeDetail ? (
            <div className="space-y-8 pt-4">
              {/* Profile Header */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-500/20">
                  {employeeDetail.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {employeeDetail.name}
                    </h2>
                    <Badge className={getStatusColor(employeeDetail.status)}>
                      {employeeDetail.status || "Active"}
                    </Badge>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                    {employeeDetail.position || employeeDetail.role}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                    {employeeDetail.department}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Email Address
                  </p>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {employeeDetail.email}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Phone Number
                  </p>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {employeeDetail.phoneNumber || "Not provided"}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Office Location
                  </p>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {employeeDetail.location || "Kigali, Rwanda"}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Staff ID
                  </p>
                  <div className="text-gray-900 dark:text-white font-medium pl-6">
                    {employeeDetail.staffId || "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Joined Date
                  </p>
                  <div className="text-gray-900 dark:text-white font-medium pl-6">
                    {employeeDetail.dateOfEmployment || "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Activity
                  </p>
                  <div className="text-gray-900 dark:text-white font-medium pl-6">
                    {employeeDetail.requestsCount} total requests
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 h-11"
                  onClick={() => window.location.href = `mailto:${employeeDetail.email}`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button 
                  variant="outline" 
                   className="flex-1 h-11"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close Profile
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
